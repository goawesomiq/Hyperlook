import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { History as HistoryIcon, Download, RefreshCw } from "lucide-react";
import { auth, db } from "../firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { useLanguage } from "../lib/LanguageContext";

interface Generation {
  id: string;
  jobId: string;
  resolution: string;
  thumbnailUrl: string;
  downloadUrl: string;
  garmentType: string;
  prompt: string;
  fileSizeMB: string;
  createdAt: any;
  status: string;
}

export default function History({ onStartCreating }: { onStartCreating: () => void }) {
  const { t } = useLanguage();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setGenerations([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "users", user.uid, "generations"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedGenerations: Generation[] = [];
      snapshot.forEach((doc) => {
        fetchedGenerations.push({ id: doc.id, ...doc.data() } as Generation);
      });
      setGenerations(fetchedGenerations);
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
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{t("Sign in to view history", "Sign in to view history")}</h2>
        <p className="text-slate-500 dark:text-slate-400">{t("Your generated photoshoots will appear here once you sign in.", "Your generated photoshoots will appear here once you sign in.")}</p>
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

  if (generations.length === 0) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <HistoryIcon className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{t("No History Yet", "No History Yet")}</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">{t("Your generated photoshoots will appear here.", "Your generated photoshoots will appear here.")}</p>
        <button onClick={onStartCreating} className="px-8 py-3 bg-brand-600 text-white rounded-full font-bold shadow-lg hover:bg-brand-700 transition-colors dark:shadow-none">
          {t("Start Creating", "Start Creating")}
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
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 dark:text-white">{t("Your History", "Your History")}</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {generations.map((generation) => (
          <motion.div 
            key={generation.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="cute-card overflow-hidden group flex flex-col"
          >
             <div className="relative aspect-[3/4] bg-slate-100 dark:bg-slate-800">
                <img 
                  src={generation.thumbnailUrl || generation.downloadUrl} 
                  alt={generation.garmentType} 
                  className="w-full h-full object-cover select-none pointer-events-none" 
                  style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }} 
                />
                
                {generation.status === 'expired' && (
                   <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4 text-center">
                      <p className="text-white text-sm font-medium">Link Expired (7 Days)</p>
                   </div>
                )}
                
                {generation.status !== 'expired' && (
                  <>
                    <div className="absolute inset-0 z-0 bg-transparent" onContextMenu={(e) => e.preventDefault()} />
                    <div className="absolute inset-0 z-10 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      {generation.downloadUrl ? (
                         <a 
                           href={generation.downloadUrl} 
                           target="_blank"
                           rel="noopener noreferrer"
                           className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors"
                         >
                           <Download className="w-5 h-5" />
                         </a>
                      ) : (
                         <span className="text-white text-sm">Processing...</span>
                      )}
                    </div>
                  </>
                )}
             </div>
             
             <div className="p-4 flex-1 flex flex-col justify-between border-t border-slate-100 dark:border-slate-800">
               <div>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm truncate pr-2">{generation.garmentType || t("Photoshoot", "Photoshoot")}</h3>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 shrink-0">
                      {generation.resolution}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2" title={generation.prompt}>{generation.prompt || "No prompt provided"}</p>
               </div>
               
               <div className="mt-3 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                 <span>
                    {generation.createdAt?.toDate ? generation.createdAt.toDate().toLocaleDateString() : t("Recently", "Recently")}
                 </span>
                 {generation.fileSizeMB && <span>{generation.fileSizeMB}</span>}
               </div>
             </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
