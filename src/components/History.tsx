import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { History as HistoryIcon, Download, RefreshCw } from "lucide-react";
import { auth, db } from "../firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

interface Photoshoot {
  id: string;
  userId: string;
  createdAt: any;
  config: any;
  results: string[];
}

export default function History({ onStartCreating }: { onStartCreating: () => void }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [photoshoots, setPhotoshoots] = useState<Photoshoot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setPhotoshoots([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "photoshoots"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPhotoshoots: Photoshoot[] = [];
      snapshot.forEach((doc) => {
        fetchedPhotoshoots.push({ id: doc.id, ...doc.data() } as Photoshoot);
      });
      setPhotoshoots(fetchedPhotoshoots);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching history:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <HistoryIcon className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Sign in to view history</h2>
        <p className="text-slate-500 dark:text-slate-400">Your generated photoshoots will appear here once you sign in.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <RefreshCw className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (photoshoots.length === 0) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <HistoryIcon className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">No History Yet</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">Your generated photoshoots will appear here.</p>
        <button onClick={onStartCreating} className="px-8 py-3 bg-brand-600 text-white rounded-full font-bold shadow-lg hover:bg-brand-700 transition-colors dark:shadow-none">
          Start Creating
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 md:space-y-12 pb-16">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-2xl flex items-center justify-center shadow-inner">
          <HistoryIcon className="w-6 h-6" />
        </div>
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 dark:text-white">Your History</h2>
      </div>

      <div className="space-y-8">
        {photoshoots.map((photoshoot) => (
          <motion.div 
            key={photoshoot.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="cute-card p-4 md:p-6 space-y-4 md:space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-lg">{photoshoot.config.garmentType || "Photoshoot"}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {photoshoot.createdAt?.toDate ? photoshoot.createdAt.toDate().toLocaleDateString() : "Recently"}
                </p>
              </div>
              <div className="px-3 py-1 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-full text-xs font-bold">
                {photoshoot.results.length} Photos
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {photoshoot.results.map((result, idx) => (
                <div key={idx} className="relative group aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img src={result} alt={`Result ${idx + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a 
                      href={result} 
                      download={`hyperlook-history-${photoshoot.id}-${idx}.png`}
                      className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
