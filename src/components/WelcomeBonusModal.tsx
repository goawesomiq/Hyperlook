import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { Coins, Sparkles, X } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";

interface WelcomeBonusModalProps {
  onClose: () => void;
}

export default function WelcomeBonusModal({ onClose }: WelcomeBonusModalProps) {
  const { t } = useLanguage();

  useEffect(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FFD700', '#FFA500', '#FF8C00']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#FFD700', '#FFA500', '#FF8C00']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 50 }}
        className="relative bg-gradient-to-br from-amber-50 to-orange-100 dark:from-slate-800 dark:to-slate-900 rounded-[2rem] w-full max-w-md p-8 text-center shadow-2xl border border-amber-200 dark:border-amber-900 overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-400 bg-opacity-20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-orange-400 bg-opacity-20 rounded-full blur-3xl" />
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/50 hover:bg-white/80 dark:bg-slate-700/50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center text-amber-900 dark:text-amber-100 placeholder-amber-900"
        >
          <X className="w-4 h-4" />
        </button>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
          className="w-24 h-24 mx-auto bg-gradient-to-br from-yellow-300 to-amber-500 rounded-full flex items-center justify-center shadow-xl shadow-amber-500/30 mb-6 border-4 border-white dark:border-slate-800 relative z-10"
        >
          <Coins className="w-12 h-12 text-white drop-shadow-md" />
        </motion.div>

        <h2 className="text-3xl font-black text-amber-600 dark:text-amber-400 mb-2 relative z-10 font-serif drop-shadow-sm">
          {t("Welcome Bonus!")}
        </h2>
        
        <p className="text-lg text-amber-900/80 dark:text-amber-200/80 mb-6 relative z-10 font-medium">
          {t("You just received")} <strong className="text-amber-600 dark:text-amber-400 font-black text-2xl mx-1">10</strong> {t("free coins worth ₹250!")}
        </p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-black text-lg shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all flex items-center justify-center gap-2 relative z-10 uppercase tracking-widest"
        >
          <Sparkles className="w-5 h-5" /> {t("Let's Go Create")}
        </motion.button>
      </motion.div>
    </div>
  );
}
