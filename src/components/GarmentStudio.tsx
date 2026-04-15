import React from "react";
import { motion } from "motion/react";
import { ArrowRight, Heart } from "lucide-react";

interface GarmentStudioProps {
  onStart: (category: string) => void;
}

const CATEGORIES = [
  { id: "saree", name: "Saree", icon: "✨", color: "bg-pink-100 text-pink-600" },
  { id: "kurti", name: "Kurti", icon: "🌸", color: "bg-purple-100 text-purple-600" },
  { id: "indo-western", name: "Indo Western", icon: "👗", color: "bg-indigo-100 text-indigo-600" },
  { id: "casuals", name: "Casuals", icon: "👕", color: "bg-blue-100 text-blue-600" },
  { id: "other", name: "Other", icon: "🎨", color: "bg-slate-100 text-slate-600" },
];

export default function GarmentStudio({ onStart }: GarmentStudioProps) {
  return (
    <div className="space-y-12 pb-24">
      {/* Categories */}
      <section className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Select Category</h2>
          <button className="text-brand-600 dark:text-brand-400 font-bold text-sm flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {CATEGORIES.map((cat, idx) => (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => onStart(cat.id)}
              className="cute-card p-6 md:p-8 flex flex-col items-center justify-center gap-3 md:gap-4 group relative overflow-hidden"
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Heart className="w-5 h-5 text-brand-400 fill-brand-400" />
              </div>
              
              <div className={`w-20 h-20 rounded-3xl ${cat.color} flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                {cat.icon}
              </div>
              
              <div className="text-center">
                <span className="block font-bold text-slate-800 dark:text-white text-lg">{cat.name}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Start Studio</span>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Featured Banner */}
      <section className="relative h-64 rounded-[3rem] overflow-hidden shadow-2xl group">
        <img 
          src="https://picsum.photos/seed/fashion/1200/400" 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-900/80 to-transparent flex flex-col justify-center px-12 text-white">
          <h3 className="text-3xl font-serif font-bold mb-2">New Season Styles</h3>
          <p className="text-brand-100 mb-6 max-w-md">Try our latest indoor studio backdrops for your ethnic collection.</p>
          <button 
            onClick={() => onStart("other")}
            className="w-fit px-8 py-3 bg-white text-brand-600 rounded-full font-bold hover:bg-brand-50 transition-colors shadow-lg"
          >
            Explore Now
          </button>
        </div>
      </section>
    </div>
  );
}
