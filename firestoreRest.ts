export async function getUserCredits(projectId: string, userId: string, apiKey: string): Promise<number> {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}?key=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) return 0; // Document doesn't exist yet
    throw new Error(`Failed to get credits: ${await response.text()}`);
  }
  const data = await response.json();
  return parseInt(data.fields?.credits?.integerValue || data.fields?.credits?.doubleValue || "0", 10);
}

export async function updateUserCredits(projectId: string, userId: string, amountToAdd: number, apiKey: string): Promise<number> {
  // Step 1: Read current credits
  const currentCredits = await getUserCredits(projectId, userId, apiKey);
  const newCredits = currentCredits + amountToAdd;

  // Step 2: Write new amount
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}?updateMask.fieldPaths=credits&key=${apiKey}`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        credits: {
          integerValue: Math.floor(newCredits).toString()
        }
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to update credits: ${await response.text()}`);
  }
  return newCredits;
}

export async function verifyFirebaseToken(idToken: string, apiKey: string): Promise<any> {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken })
  });
  if (!response.ok) {
    throw new Error(`Failed to verify token: ${await response.text()}`);
  }
  const data = await response.json();
  if (!data.users || data.users.length === 0) {
    throw new Error("Invalid token");
  }
  return data.users[0];
}
