import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Shield, Upload, Save, Image as ImageIcon, Trash2, AlertCircle } from "lucide-react";
import { auth, db, storage } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { ref, uploadString, getDownloadURL } from "firebase/storage";

export default function AdminDashboard() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [headerLogo, setHeaderLogo] = useState<string>("");
  const [favicon, setFavicon] = useState<string>("");
  const [pwaIcon, setPwaIcon] = useState<string>("");
  const [banners, setBanners] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser?.phoneNumber === "+918888039433") {
        setIsAdmin(true);
        await loadSettings();
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loadSettings = async () => {
    try {
      const docRef = doc(db, "settings", "general");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.headerLogo) setHeaderLogo(data.headerLogo);
        else if (data.logo) setHeaderLogo(data.logo); // Fallback for old data
        
        if (data.favicon) setFavicon(data.favicon);
        if (data.pwaIcon) setPwaIcon(data.pwaIcon);
        if (data.banners) setBanners(data.banners);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      let finalHeaderLogo = headerLogo;
      if (headerLogo.startsWith("data:image")) {
        const refPath = ref(storage, `settings/headerLogo_${Date.now()}.png`);
        await uploadString(refPath, headerLogo, 'data_url');
        finalHeaderLogo = await getDownloadURL(refPath);
      }

      let finalFavicon = favicon;
      if (favicon.startsWith("data:image")) {
        const refPath = ref(storage, `settings/favicon_${Date.now()}.png`);
        await uploadString(refPath, favicon, 'data_url');
        finalFavicon = await getDownloadURL(refPath);
      }

      let finalPwaIcon = pwaIcon;
      if (pwaIcon.startsWith("data:image")) {
        const refPath = ref(storage, `settings/pwaIcon_${Date.now()}.png`);
        await uploadString(refPath, pwaIcon, 'data_url');
        finalPwaIcon = await getDownloadURL(refPath);
      }

      const finalBanners = await Promise.all(banners.map(async (banner, index) => {
        if (banner.startsWith("data:image")) {
          const bannerRef = ref(storage, `settings/banner_${Date.now()}_${index}.png`);
          await uploadString(bannerRef, banner, 'data_url');
          return await getDownloadURL(bannerRef);
        }
        return banner;
      }));

      await setDoc(doc(db, "settings", "general"), {
        headerLogo: finalHeaderLogo,
        favicon: finalFavicon,
        pwaIcon: finalPwaIcon,
        banners: finalBanners
      }, { merge: true });
      
      setHeaderLogo(finalHeaderLogo);
      setFavicon(finalFavicon);
      setPwaIcon(finalPwaIcon);
      setBanners(finalBanners);
      
      setMessage({ type: "success", text: "Settings saved successfully! Refresh to see changes." });
    } catch (error: any) {
      console.error("Error saving settings:", error);
      setMessage({ type: "error", text: error.message || "Failed to save settings." });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 1024 * 1024) {
      setMessage({ type: "error", text: "Image must be under 1MB." });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setter(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 1024 * 1024) {
      setMessage({ type: "error", text: "Banner must be under 1MB." });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setBanners(prev => [...prev, reader.result as string]);
    };
    reader.readAsDataURL(file);
  };

  const removeBanner = (index: number) => {
    setBanners(prev => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return <div className="py-20 text-center dark:text-white">Loading Admin...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="py-20 text-center max-w-md mx-auto">
        <Shield className="w-16 h-16 text-red-400 dark:text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Access Denied</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">You do not have administrator privileges to view this page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center shadow-inner">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">Admin Dashboard</h2>
          <p className="text-slate-500 dark:text-slate-400">Manage site content and settings</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/50' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50'}`}>
          <AlertCircle className="w-5 h-5" />
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {/* Header Logo Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="cute-card p-6 space-y-6">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4">Header Logo</h3>
          
          <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 overflow-hidden relative group">
              {headerLogo ? (
                <img src={headerLogo} alt="Header Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <label className="cursor-pointer text-white flex flex-col items-center gap-1">
                  <Upload className="w-6 h-6" />
                  <span className="text-xs font-bold">Upload</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setHeaderLogo)} />
                </label>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              Used in the top navigation bar.<br/>Transparent PNG or SVG.
            </p>
          </div>
        </motion.div>

        {/* Favicon Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="cute-card p-6 space-y-6">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4">Browser Favicon</h3>
          
          <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 overflow-hidden relative group">
              {favicon ? (
                <img src={favicon} alt="Favicon" className="w-full h-full object-contain p-2" />
              ) : (
                <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <label className="cursor-pointer text-white flex flex-col items-center gap-1">
                  <Upload className="w-6 h-6" />
                  <span className="text-xs font-bold">Upload</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setFavicon)} />
                </label>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              Used in browser tabs.<br/>Square PNG recommended.
            </p>
          </div>
        </motion.div>

        {/* PWA Icon Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="cute-card p-6 space-y-6">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4">PWA App Icon</h3>
          
          <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 overflow-hidden relative group">
              {pwaIcon ? (
                <img src={pwaIcon} alt="PWA Icon" className="w-full h-full object-contain p-2" />
              ) : (
                <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <label className="cursor-pointer text-white flex flex-col items-center gap-1">
                  <Upload className="w-6 h-6" />
                  <span className="text-xs font-bold">Upload</span>
                  <input type="file" accept="image/png" className="hidden" onChange={(e) => handleImageUpload(e, setPwaIcon)} />
                </label>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              Used for home screen installation.<br/><strong>Must be a PNG image.</strong>
            </p>
          </div>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-1 gap-8">
        {/* Banner Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="cute-card p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Home Banners</h3>
            <label className="cursor-pointer px-3 py-1.5 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-full text-sm font-bold hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors flex items-center gap-2">
              <Upload className="w-4 h-4" /> Add Banner
              <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
            </label>
          </div>
          
          <div className="space-y-4">
            {banners.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-center py-4 text-sm">No banners uploaded yet.</p>
            ) : (
              banners.map((banner, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-[21/9]">
                  <img src={banner} alt={`Banner ${idx + 1}`} className="w-full h-full object-cover" />
                  <button 
                    onClick={() => removeBanner(idx)}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* API Key Settings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="cute-card p-6 space-y-6">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4">API Settings</h3>
        
        <div className="space-y-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            API Keys are now securely managed via Environment Variables in Vercel. 
            Please set GEMINI_API_KEY, RAZORPAY_KEY_ID, and RAZORPAY_KEY_SECRET in your Vercel project settings.
          </p>
        </div>
      </motion.div>

      <div className="flex justify-end pt-4">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 bg-brand-600 text-white rounded-full font-bold shadow-lg hover:bg-brand-700 transition-colors flex items-center gap-2 disabled:opacity-50 dark:shadow-none"
        >
          <Save className="w-5 h-5" />
          {saving ? "Saving..." : "Save All Changes"}
        </button>
      </div>
    </div>
  );
}
