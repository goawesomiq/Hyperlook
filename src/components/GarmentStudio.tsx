import React from "react";
import { motion } from "motion/react";
import { ArrowRight, Heart } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";

interface GarmentStudioProps {
  onStart: (category: string) => void;
}

export default function GarmentStudio({ onStart }: GarmentStudioProps) {
  const { t } = useLanguage();

  const CATEGORIES = [
    { id: "saree", name: t("Saree", "Saree"), icon: "✨", color: "bg-pink-100 text-pink-600" },
    { id: "kurti", name: t("Kurti", "Kurti"), icon: "🌸", color: "bg-purple-100 text-purple-600" },
    { id: "indo-western", name: t("Indo Western", "Indo Western"), icon: "👗", color: "bg-indigo-100 text-indigo-600" },
    { id: "casuals", name: t("Casuals", "Casuals"), icon: "👕", color: "bg-blue-100 text-blue-600" },
    { id: "other", name: t("Other", "Other"), icon: "🎨", color: "bg-slate-100 text-slate-600" },
  ];

  return (
    <div className="space-y-6 md:space-y-8 pb-12 max-w-5xl mx-auto">
      {/* Categories */}
      <section className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">{t("Select Category", "Select Category")}</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-4">
          {CATEGORIES.map((cat, idx) => (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => onStart(cat.id)}
              className="cute-card p-4 md:p-6 flex flex-col items-center justify-center gap-2 md:gap-3 group relative overflow-hidden"
            >
              
              <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl md:rounded-3xl ${cat.color} flex items-center justify-center text-2xl md:text-3xl shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                {cat.icon}
              </div>
              
              <div className="text-center">
                <span className="block font-bold text-slate-800 dark:text-white text-sm md:text-base">{cat.name}</span>
                <span className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 font-medium">{t("Start Studio", "Start Studio")}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </section>
    </div>
  );
}
