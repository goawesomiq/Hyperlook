import React from "react";
import { motion } from "motion/react";
import { Sparkles, Shirt, Footprints, Watch, Sparkle, Smartphone, Home as HomeIcon, ArrowRight } from "lucide-react";

interface HomeProps {
  onSelectStudio: (studioId: string) => void;
  banners?: string[];
  logo?: string;
}

const STUDIOS = [
  { 
    id: "garment", 
    name: "Garment Studio", 
    desc: "AI Photoshoots for Saree, Kurti, Western & more",
    icon: Shirt, 
    color: "from-pink-500 to-rose-500", 
    active: true 
  },
  { 
    id: "footwear", 
    name: "Footwear Studio", 
    desc: "Hyper-realistic shoe & sandal photoshoots",
    icon: Footprints, 
    color: "from-blue-500 to-indigo-500", 
    active: false 
  },
  { 
    id: "accessories", 
    name: "Fashion Accessories", 
    desc: "Jewelry, watches, bags & more",
    icon: Watch, 
    color: "from-amber-500 to-orange-500", 
    active: false 
  },
  { 
    id: "cosmetic", 
    name: "Cosmetic & Beauty", 
    desc: "Makeup, skincare & beauty product shots",
    icon: Sparkle, 
    color: "from-purple-500 to-fuchsia-500", 
    active: false 
  },
  { 
    id: "electronics", 
    name: "Electronic Gadgets", 
    desc: "Smartphones, laptops & tech accessories",
    icon: Smartphone, 
    color: "from-emerald-500 to-teal-500", 
    active: false 
  },
  { 
    id: "decor", 
    name: "Home Décor", 
    desc: "Furniture, lighting & interior styling",
    icon: HomeIcon, 
    color: "from-cyan-500 to-sky-500", 
    active: false 
  },
];

export default function Home({ onSelectStudio, banners, logo }: HomeProps) {
  const [currentBanner, setCurrentBanner] = React.useState(0);

  React.useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners]);

  return (
    <div className="space-y-16 pb-24">
      {/* Dynamic Banners */}
      {banners && banners.length > 0 && (
        <section className="pt-4">
          <div className="relative w-full rounded-3xl overflow-hidden shadow-xl aspect-[21/9] md:aspect-[32/9]">
            <motion.img 
              key={currentBanner}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              src={banners[currentBanner]} 
              alt="Promo Banner" 
              className="w-full h-full object-cover absolute inset-0"
            />
            {banners.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {banners.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`w-2 h-2 rounded-full transition-all ${idx === currentBanner ? "bg-white w-6" : "bg-white/50"}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section className="text-center space-y-6 pt-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-6 py-2 bg-brand-50 dark:bg-slate-800 text-brand-600 dark:text-brand-400 rounded-full text-sm font-bold border border-brand-100 dark:border-slate-700 shadow-sm"
        >
          <motion.img 
            src={logo || "/logo.png"} 
            onError={(e) => e.currentTarget.src = '/logo.png'}
            alt="Hyperlook AI" 
            className="w-5 h-5 object-contain"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
          />
          <span>Hyperlook Ai Multi-Product Studio</span>
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-serif font-bold text-slate-900 dark:text-white leading-tight"
        >
          Choose Your <br />
          <span className="gradient-text italic">Product Studio</span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed"
        >
          Select a specialized AI studio to create professional, high-fidelity photoshoots for your brand.
        </motion.p>
      </section>

      {/* Studio Grid */}
      <section className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        {STUDIOS.map((studio, idx) => (
          <motion.div
            key={studio.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group relative"
          >
            <button
              disabled={!studio.active}
              onClick={() => onSelectStudio(studio.id)}
              className={`w-full text-left cute-card p-4 md:p-8 h-full flex flex-col gap-4 md:gap-6 transition-all duration-500 relative overflow-hidden ${
                studio.active 
                  ? "hover:border-brand-300 hover:shadow-xl hover:-translate-y-2 cursor-pointer" 
                  : "cursor-default opacity-80"
              }`}
            >
              {/* Background Glow */}
              <div className={`absolute -right-12 -top-12 w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br ${studio.color} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />
              
              <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${studio.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                <studio.icon className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              
              <div className="space-y-1 md:space-y-2">
                <h3 className="text-lg md:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  {studio.name}
                  {studio.active && <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse flex-shrink-0" />}
                </h3>
                <p className="text-xs md:text-base text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-2 md:line-clamp-none">
                  {studio.desc}
                </p>
              </div>

              {studio.active ? (
                <div className="mt-auto flex items-center gap-1 md:gap-2 text-brand-600 dark:text-brand-400 font-bold text-xs md:text-base group-hover:gap-2 md:group-hover:gap-4 transition-all">
                  Enter <span className="hidden md:inline">Studio</span> <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                </div>
              ) : (
                <div className="mt-auto text-slate-400 dark:text-slate-500 font-bold text-[10px] md:text-sm uppercase tracking-widest">
                  Coming Soon
                </div>
              )}

              {/* Hover Overlay for Coming Soon */}
              {!studio.active && (
                <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 md:px-6 md:py-2 rounded-full font-bold text-xs md:text-sm shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform">
                    Coming Soon
                  </div>
                </div>
              )}
            </button>
          </motion.div>
        ))}
      </section>

      {/* Bottom Info */}
      <section className="text-center pt-12">
        <div className="inline-flex items-center gap-8 p-8 glass-panel rounded-[2.5rem] max-w-4xl mx-auto">
          <div className="hidden md:flex -space-x-4">
            {[1, 2, 3, 4].map((i) => (
              <img 
                key={i}
                src={`https://picsum.photos/seed/user${i}/100/100`} 
                className="w-12 h-12 rounded-full border-4 border-white dark:border-slate-800 shadow-sm"
                referrerPolicy="no-referrer"
              />
            ))}
          </div>
          <div className="text-left">
            <p className="font-bold text-slate-800 dark:text-white">Trusted by 10,000+ Fashion Brands</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Generating 50,000+ photoshoots daily with 99% satisfaction.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
