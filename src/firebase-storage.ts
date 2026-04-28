import * as admin from 'firebase-admin';
import { Storage } from '@google-cloud/storage';

// 1. Initialize Firebase Admin SDK for Auth/Firestore (Account 1)
// Check if already initialized to prevent errors on hot reloads
if (!admin.apps.length) {
  try {
    const credBase64 = process.env.FIREBASE_CREDENTIALS_BASE64;
    if (credBase64) {
      const serviceAccount = JSON.parse(Buffer.from(credBase64, 'base64').toString('utf8'));
      // Only keep firestore/auth functions in the admin config
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log(`✅ Firebase Admin SDK initialized for History (Account 1)`);
    } else {
      console.warn('⚠️ FIREBASE_CREDENTIALS_BASE64 not found. History saving will be disabled.');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
  }
}

export const adminDb = admin.apps.length ? admin.firestore() : null;

// 2. Initialize Google Cloud Storage for Images (Account 2)
let gcsStorage: Storage | null = null;
const bucketName = process.env.GCS_BUCKET_NAME || 'hyperlook-gallery';

if (process.env.VERTEX_CREDENTIALS_BASE64) {
  try {
    const serviceAccount = JSON.parse(Buffer.from(process.env.VERTEX_CREDENTIALS_BASE64, 'base64').toString('utf8'));
    gcsStorage = new Storage({
      credentials: {
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key,
      },
      projectId: serviceAccount.project_id,
    });
    console.log(`✅ Google Cloud Storage initialized for Images (Account 2 / ${bucketName})`);
  } catch (e) {
    console.error('❌ Failed to initialize Google Cloud Storage:', e);
  }
} else {
  console.warn('⚠️ VERTEX_CREDENTIALS_BASE64 not found. GCP Storage uploading is disabled.');
}

const getBucket = () => {
    if (!gcsStorage) throw new Error("GCS not initialized");
    return gcsStorage.bucket(bucketName);
};

export async function saveGeneratedImage(
  userId: string,
  jobId: string,
  resolution: '1k' | '2k' | '4k',
  imageBase64: string,
  garmentType: string,
  prompt: string,
  creditsUsed: number
) {
  if (!gcsStorage) {
    throw new Error('GCS not initialized. Cannot save history.');
  }

  const bucket = getBucket();
  const imageBuffer = Buffer.from(imageBase64, 'base64');
  
  // Calculate file sizes
  const fileSizeMB = (imageBuffer.length / (1024 * 1024)).toFixed(2) + ' MB';

  const fullFileName = `generated/${userId}/${jobId}-${resolution}.png`;
  const thumbFileName = `thumbnails/${userId}/${jobId}-thumb.jpg`;

  const fullFile = bucket.file(fullFileName);
  const thumbFile = bucket.file(thumbFileName);

  // Use sharp to create a 200x200 JPEG thumbnail
  const sharp = (await import('sharp')).default;
  const thumbBuffer = await sharp(imageBuffer)
    .resize(200, 200, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toBuffer();

  // Upload Full PNG
  await fullFile.save(imageBuffer, {
    metadata: {
      contentType: 'image/png',
      cacheControl: 'private, max-age=604800', // 7 days
    }
  });

  // Upload Thumbnail
  await thumbFile.save(thumbBuffer, {
    metadata: {
      contentType: 'image/jpeg', // Technically PNG data, but browsers will handle it. We can just say it's image/png
      cacheControl: 'public, max-age=31536000', // 1 year
    }
  });

  // Make thumbnail public
  let thumbnailUrl = '';
  try {
    await thumbFile.makePublic();
    thumbnailUrl = thumbFile.publicUrl();
  } catch (publicErr) {
    console.warn(`Could not make thumbnail public (likely GCP policy), falling back to signed URL:`, publicErr);
    const [fallbackUrl] = await thumbFile.getSignedUrl({
      action: 'read',
      expires: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000) // 100 years
    });
    thumbnailUrl = fallbackUrl;
  }

  // Generate Signed URL for Full Image (Valid 7 Days)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const [downloadUrl] = await fullFile.getSignedUrl({
    action: 'read',
    expires: expiresAt,
  });

  // Save to Firestore (ONLY if adminDb is available. If not, we return so client can save)
  let firestoreDocId = undefined;
  if (adminDb) {
    try {
      const docRef = adminDb.collection(`users/${userId}/generations`).doc();
      const firestoreData = {
        jobId,
        resolution,
        storagePath: fullFileName,
        thumbnailUrl,
        downloadUrl,
        downloadUrlExpiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
        garmentType: garmentType || "Unknown",
        prompt: prompt || "",
        fileSizeMB,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        creditsUsed: creditsUsed || 0,
        status: 'available',
        downloadCount: 0
      };
      await docRef.set(firestoreData);
      firestoreDocId = docRef.id;
    } catch (e) {
      console.error("Failed to save to Firestore using Admin SDK, relying on client fallback.", e);
    }
  }

  return { downloadUrl, thumbnailUrl, firestoreDocId, fullFileName, fileSizeMB, expiresAt: expiresAt.getTime() };
}

export async function refreshDownloadUrl(userId: string, docId: string) {
  if (!adminDb || !gcsStorage) throw new Error('Firebase or GCS missing');

  const docRef = adminDb.collection(`users/${userId}/generations`).doc(docId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    throw new Error('History record not found');
  }

  const data = docSnap.data() as any;
  if (data.status === 'expired') {
    return null;
  }

  const file = getBucket().file(data.storagePath);
  const [exists] = await file.exists();

  if (!exists) {
    await docRef.update({ status: 'expired', expiredAt: admin.firestore.FieldValue.serverTimestamp() });
    return null;
  }

  // Generate new 24h signed URL
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const [newDownloadUrl] = await file.getSignedUrl({
    action: 'read',
    expires: expiresAt,
  });

  await docRef.update({
    downloadUrl: newDownloadUrl,
    downloadUrlExpiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
    lastDownloadedAt: admin.firestore.FieldValue.serverTimestamp(),
    downloadCount: admin.firestore.FieldValue.increment(1)
  });

  return { downloadUrl: newDownloadUrl, resolution: data.resolution, fileSizeMB: data.fileSizeMB };
}

export async function getUserHistory(userId: string, limitCount = 50) {
  if (!adminDb) return [];

  const snapshot = await adminDb
    .collection(`users/${userId}/generations`)
    .orderBy('createdAt', 'desc')
    .limit(limitCount)
    .get();

  const now = Date.now();
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    
    // Calculate days remaining
    let daysRemaining = 0;
    if (data.downloadUrlExpiresAt) {
      const expiresMs = data.downloadUrlExpiresAt.toMillis();
      daysRemaining = Math.max(0, Math.ceil((expiresMs - now) / (1000 * 60 * 60 * 24)));
    }

    return {
      id: doc.id,
      jobId: data.jobId,
      resolution: data.resolution,
      thumbnailUrl: data.thumbnailUrl,
      garmentType: data.garmentType,
      createdAt: data.createdAt ? data.createdAt.toMillis() : Date.now(),
      fileSizeMB: data.fileSizeMB,
      creditsUsed: data.creditsUsed,
      status: data.status,
      daysRemaining,
      prompt: data.prompt
    };
  });
}

export async function cleanupExpiredImages() {
  if (!adminDb || !gcsStorage) return { success: false, message: 'Firebase or GCS not linked' };

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const snapshot = await adminDb.collectionGroup('generations')
    .where('status', '==', 'available')
    .where('createdAt', '<', admin.firestore.Timestamp.fromDate(sevenDaysAgo))
    .get();

  let cleaned = 0;
  const bucket = getBucket();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    try {
      if (data.storagePath) {
        await bucket.file(data.storagePath).delete().catch(() => {});
      }
      await doc.ref.update({
        status: 'expired',
        downloadUrl: null,
        expiredAt: admin.firestore.FieldValue.serverTimestamp()
      });
      cleaned++;
    } catch (e) {
      console.error(`Failed to cleanup document ${doc.id}`);
    }
  }

  console.log(`Cleaned up ${cleaned} expired images`);
  return { success: true, message: `Cleaned up ${cleaned} expired images` };
}
