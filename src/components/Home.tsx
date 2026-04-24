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
  const [appMode, setAppMode] = React.useState<'photography' | 'design' | 'videos'>('photography');

  React.useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners]);

  return (
    <div className="space-y-4 md:space-y-12 pb-24">
      {/* App Mode Toggle */}
      <div className="flex justify-center pt-2 px-4">
        <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800/50 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm max-w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button
            onClick={() => setAppMode('photography')}
            className={`px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${appMode === 'photography' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Product Photography
          </button>
          <button
            onClick={() => setAppMode('design')}
            className={`px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${appMode === 'design' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Design
          </button>
          <button
            onClick={() => setAppMode('videos')}
            className={`px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${appMode === 'videos' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Videos <span className="ml-1 px-1.5 py-0.5 bg-brand-100 dark:bg-brand-900/50 text-[8px] md:text-[9px] rounded-full uppercase tracking-wider text-brand-600 dark:text-brand-400">Soon</span>
          </button>
        </div>
      </div>

      {/* Dynamic Banners - Always show for now, or could restrict to photography */}
      {banners && banners.length > 0 && appMode === 'photography' && (
        <section className="pt-1 md:pt-4">
          <div className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden shadow-xl aspect-[21/9] md:aspect-[32/9]">
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
              <div className="absolute bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 md:gap-2 z-10">
                {banners.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all ${idx === currentBanner ? "bg-white w-4 md:w-6" : "bg-white/50"}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {appMode === 'photography' && (
        <>
          {/* Hero Section */}
          <section className="text-center space-y-1.5 md:space-y-3 pt-1 md:pt-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-1.5 md:gap-2 px-3 py-1 md:px-4 md:py-1.5 bg-brand-50 dark:bg-slate-800 text-brand-600 dark:text-brand-400 rounded-full text-[9px] md:text-xs font-bold border border-brand-100 dark:border-slate-700 shadow-sm"
            >
              <motion.img 
                src={logo || "/logo.png"} 
                onError={(e) => e.currentTarget.src = '/logo.png'}
                alt="Hyperlook AI" 
                className="w-2.5 h-2.5 md:w-3 md:h-3 object-contain"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
              />
              <span>Hyperlook Ai Multi-Product Studio</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl md:text-3xl font-serif font-bold text-slate-900 dark:text-white leading-tight"
            >
              Choose Your <br className="hidden md:block"/>
              <span className="gradient-text italic">Product Studio</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed px-4 md:px-0"
            >
              Select a specialized AI studio to create professional, high-fidelity photoshoots for your brand.
            </motion.p>
          </section>

          {/* Studio Grid */}
          <section className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-4 md:mt-8 max-w-5xl mx-auto">
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
          <section className="text-center pt-6 md:pt-12">
            <div className="inline-flex flex-col md:flex-row items-center gap-4 md:gap-8 p-4 md:p-8 glass-panel rounded-3xl md:rounded-[2.5rem] max-w-4xl mx-auto">
              <div className="flex text-left items-center md:items-start gap-4">
                <div className="flex -space-x-2 md:-space-x-4">
                  {[1, 2, 3, 4].map((i) => (
                    <img 
                      key={i}
                      src={`https://picsum.photos/seed/user${i}/100/100`} 
                      className="w-8 h-8 md:w-12 md:h-12 rounded-full border-2 md:border-4 border-white dark:border-slate-800 shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                  ))}
                </div>
                <div>
                  <p className="text-sm md:text-base font-bold text-slate-800 dark:text-white">Trusted by 10,000+ Fashion Brands</p>
                  <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">Generating 50,000+ photoshoots daily with 99% satisfaction.</p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {appMode === 'design' && (
        <div className="space-y-8 md:space-y-12">
          {/* Design Hero Section */}
          <section className="text-center space-y-1.5 md:space-y-3 pt-4 md:pt-6 max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-1.5 md:gap-2 px-3 py-1 md:px-4 md:py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-[9px] md:text-xs font-bold border border-indigo-100 dark:border-indigo-800/50 shadow-sm"
            >
              <Sparkles className="w-3 h-3 md:w-3 md:h-3" />
              <span>Hyperlook AI Design Studio</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl md:text-3xl font-serif font-bold text-slate-900 dark:text-white leading-tight"
            >
              Transform Garments into <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500 italic">Digital Print Templates</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed px-4 md:px-0"
            >
              Upload any fabric, kurti, or saree design. We will instantly generate a high-fidelity 21:9 stretch digital print ready for your manufacturing pipeline.
            </motion.p>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={() => onSelectStudio('design_print_studio')}
              className="mt-4 md:mt-6 px-6 py-2.5 md:px-8 md:py-3.5 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white rounded-full font-bold text-sm shadow-lg hover:shadow-indigo-500/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 mx-auto"
            >
              Start Generating Template <ArrowRight className="w-4 h-4 md:w-4 md:h-4" />
            </motion.button>
          </section>

          {/* Gallery Ideas */}
          <section className="max-w-5xl mx-auto pt-6">
            <div className="flex items-center justify-between mb-4 md:mb-6 px-4 md:px-0">
              <h2 className="text-lg md:text-xl font-serif font-bold text-slate-900 dark:text-white">Design Inspiration Gallery</h2>
              <button className="text-indigo-600 dark:text-indigo-400 text-xs md:text-sm font-semibold hover:underline">View All Ideas</button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3 md:gap-4 px-4 md:px-0">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="group relative rounded-2xl overflow-hidden aspect-[4/5] md:aspect-[3/4] cute-card shadow-sm hover:shadow-xl transition-all duration-300">
                  <img 
                    src={`https://picsum.photos/seed/design${i}/400/700`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    alt="Design inspiration"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                    <p className="text-white font-semibold text-sm">Saree Masterpiece {i + 1}</p>
                    <p className="text-indigo-200 text-xs mt-1 font-medium">Digital Print Concept</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {appMode === 'videos' && (
        <div className="py-24 text-center max-w-lg mx-auto space-y-6">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-brand-50 dark:bg-brand-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-brand-500" />
          </div>
          <h2 className="text-2xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white">AI Video Studio</h2>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
            We are working on bringing ultra-realistic video generation to your studio. Cinematic quality, perfect consistency. Coming very soon.
          </p>
          <div className="pt-4">
            <span className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-sm font-bold uppercase tracking-widest shadow-inner">
              In Development
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
