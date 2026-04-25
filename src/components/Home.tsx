import React from "react";
import { motion } from "motion/react";
import { Sparkles, Shirt, Footprints, Watch, Sparkle, Smartphone, Home as HomeIcon, ArrowRight, ChevronLeft, Download, Coins, Crown } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";

interface HomeProps {
  onSelectStudio: (studioId: string) => void;
  banners?: string[];
  logo?: string;
  initialMode?: 'photography' | 'design' | 'videos';
}

export default function Home({ onSelectStudio, banners, logo, initialMode = 'photography' }: HomeProps) {
  const { t } = useLanguage();

  const STUDIOS = [
    { 
      id: "garment", 
      name: t("Garment Studio", "Garment Studio"), 
      desc: t("AI Photoshoots for Saree, Kurti, Western & more", "AI Photoshoots for Saree, Kurti, Western & more"),
      icon: Shirt, 
      color: "from-pink-500 to-rose-500", 
      active: true 
    },
    { 
      id: "footwear", 
      name: t("Footwear Studio", "Footwear Studio"), 
      desc: t("Hyper-realistic shoe & sandal photoshoots", "Hyper-realistic shoe & sandal photoshoots"),
      icon: Footprints, 
      color: "from-blue-500 to-indigo-500", 
      active: false 
    },
    { 
      id: "accessories", 
      name: t("Fashion Accessories", "Fashion Accessories"), 
      desc: t("Jewelry, watches, bags & more", "Jewelry, watches, bags & more"),
      icon: Watch, 
      color: "from-amber-500 to-orange-500", 
      active: false 
    },
    { 
      id: "cosmetic", 
      name: t("Cosmetic & Beauty", "Cosmetic & Beauty"), 
      desc: t("Makeup, skincare & beauty product shots", "Makeup, skincare & beauty product shots"),
      icon: Sparkle, 
      color: "from-purple-500 to-fuchsia-500", 
      active: false 
    },
    { 
      id: "electronics", 
      name: t("Electronic Gadgets", "Electronic Gadgets"), 
      desc: t("Smartphones, laptops & tech accessories", "Smartphones, laptops & tech accessories"),
      icon: Smartphone, 
      color: "from-emerald-500 to-teal-500", 
      active: false 
    },
    { 
      id: "decor", 
      name: t("Home Décor", "Home Décor"), 
      desc: t("Furniture, lighting & interior styling", "Furniture, lighting & interior styling"),
      icon: HomeIcon, 
      color: "from-cyan-500 to-sky-500", 
      active: false 
    },
  ];

  const [currentBanner, setCurrentBanner] = React.useState(0);
  const [appMode, setAppMode] = React.useState<'photography' | 'design' | 'videos'>(initialMode);
  const [showDesignGallery, setShowDesignGallery] = React.useState(false);
  const [selectedGalleryItem, setSelectedGalleryItem] = React.useState<{id: number, img: string, n: string} | null>(null);

  React.useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners]);

  React.useEffect(() => {
    if (selectedGalleryItem) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedGalleryItem]);

  if (selectedGalleryItem) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto px-4 pb-20 mt-4 md:mt-8">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => setSelectedGalleryItem(null)}
            className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t("Inspiration Details", "Inspiration Details")}</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="relative rounded-3xl overflow-hidden cute-card border border-slate-200 dark:border-slate-700 shadow-xl max-w-sm mx-auto w-full aspect-[3/4]">
            <img 
              src={selectedGalleryItem.img} 
              alt={selectedGalleryItem.n}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">{selectedGalleryItem.n}</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                {t("A highly detailed digital print inspiration. You can use this as a reference for generating your own unique variations.", "A highly detailed digital print inspiration. You can use this as a reference for generating your own unique variations.")}
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-3">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white">{t("Download Options", "Download Options")}</h3>
              <div className="grid grid-cols-3 gap-2">
                <button
                  className="flex flex-col items-center justify-center gap-0.5 py-2 px-0.5 rounded-2xl bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/40 border border-brand-100 dark:border-brand-800/50 transition-colors h-[4.5rem]"
                >
                  <Download className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span className="text-[9px] sm:text-[10px] font-bold text-brand-700 dark:text-brand-400 leading-tight whitespace-nowrap overflow-hidden text-ellipsis w-full px-1 text-center">{t("Download 1K", "Download 1K")}</span>
                  <span className="flex items-center justify-center gap-0.5 text-[8px] sm:text-[9px] font-medium text-amber-600 dark:text-amber-400"><Coins className="w-2.5 h-2.5"/> 0.5</span>
                </button>
                <button
                  className="flex flex-col items-center justify-center gap-0.5 py-2 px-0.5 rounded-2xl bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-700 dark:hover:to-slate-800 border border-slate-300 dark:border-slate-700 transition-colors h-[4.5rem]"
                >
                  <Sparkles className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-800 dark:text-white leading-tight">{t("Req. 2K", "Req. 2K")}</span>
                  <span className="flex items-center justify-center gap-0.5 text-[8px] sm:text-[9px] font-medium text-amber-600 dark:text-amber-400"><Coins className="w-2.5 h-2.5"/> 1</span>
                </button>
                <button
                  className="flex flex-col items-center justify-center gap-0.5 py-2 px-0.5 rounded-2xl bg-gradient-to-b from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-900/60 hover:from-amber-200 hover:to-amber-300 border border-amber-300 dark:border-amber-700 transition-colors h-[4.5rem]"
                >
                  <Crown className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  <span className="text-[9px] sm:text-[10px] font-bold text-amber-800 dark:text-amber-200 drop-shadow-sm leading-tight">{t("Req. 4K", "Req. 4K")}</span>
                  <span className="flex items-center justify-center gap-0.5 text-[8px] sm:text-[9px] font-medium text-amber-800 dark:text-amber-400 drop-shadow-sm"><Coins className="w-2.5 h-2.5 fill-current"/> 2</span>
                </button>
              </div>
            </div>
            
            <button 
              onClick={() => { setSelectedGalleryItem(null); onSelectStudio('design_print_studio'); }}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white rounded-xl font-bold hover:opacity-90 shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> {t("Use as Base for Generation", "Use as Base for Generation")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-12 pb-24">
      {/* App Mode Toggle */}
      <div className="flex justify-center pt-2 px-4">
        <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800/50 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm max-w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button
            onClick={() => { setAppMode('photography'); setShowDesignGallery(false); }}
            className={`px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${appMode === 'photography' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            {t("Product Photography", "Product Photography")}
          </button>
          <button
            onClick={() => setAppMode('design')}
            className={`px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${appMode === 'design' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            {t("Design", "Design")}
          </button>
          <button
            onClick={() => { setAppMode('videos'); setShowDesignGallery(false); }}
            className={`px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${appMode === 'videos' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            {t("Videos", "Videos")}
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
          <section className="text-center space-y-1.5 pt-1 md:pt-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 dark:bg-slate-800 text-brand-600 dark:text-brand-400 rounded-full text-[9px] md:text-xs font-bold border border-brand-100 dark:border-slate-700 shadow-sm"
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
              className="text-xl md:text-2xl lg:text-3xl font-serif font-bold text-slate-900 dark:text-white leading-tight"
            >
              {t("Choose Your", "Choose Your")} <span className="gradient-text italic">{t("Product Studio", "Product Studio")}</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed px-4 md:px-0"
            >
              {t("Select a specialized AI studio to create professional, high-fidelity photoshoots for your brand.", "Select a specialized AI studio to create professional, high-fidelity photoshoots for your brand.")}
            </motion.p>
          </section>

          {/* Studio Grid */}
          <section className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mt-3 md:mt-4 max-w-5xl mx-auto px-4 md:px-0">
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
                  className={`w-full text-left cute-card p-3 md:p-4 h-full flex flex-col gap-2 md:gap-3 transition-all duration-500 relative overflow-hidden ${
                    studio.active 
                      ? "hover:border-brand-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer" 
                      : "cursor-default opacity-80"
                  }`}
                >
                  {/* Background Glow */}
                  <div className={`absolute -right-8 -top-8 w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br ${studio.color} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />
                  
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br ${studio.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                    <studio.icon className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  
                  <div className="space-y-0.5 md:space-y-1">
                    <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-white flex items-center gap-1.5 md:gap-2">
                      {studio.name}
                      {studio.active && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse flex-shrink-0" />}
                    </h3>
                    <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-2">
                      {studio.desc}
                    </p>
                  </div>

                  {studio.active ? (
                    <div className="mt-auto flex items-center gap-1 text-brand-600 dark:text-brand-400 font-bold text-[10px] md:text-xs group-hover:gap-1.5 transition-all">
                      {t("Enter Studio", "Enter Studio")} <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
                    </div>
                  ) : (
                    <div className="mt-auto text-slate-400 dark:text-slate-500 font-bold text-[9px] md:text-[10px] uppercase tracking-widest">
                      {t("Coming Soon", "Coming Soon")}
                    </div>
                  )}

                  {/* Hover Overlay for Coming Soon */}
                  {!studio.active && (
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 rounded-full font-bold text-[10px] md:text-xs shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-transform">
                        {t("Coming Soon", "Coming Soon")}
                      </div>
                    </div>
                  )}
                </button>
              </motion.div>
            ))}
          </section>

          {/* Bottom Info */}
          <section className="text-center pt-4 md:pt-6">
            <div className="inline-flex flex-col md:flex-row items-center gap-3 md:gap-6 p-3 md:p-4 glass-panel rounded-2xl md:rounded-3xl max-w-4xl mx-auto">
              <div className="flex text-left items-center md:items-start gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <img 
                      key={i}
                      src={`https://picsum.photos/seed/user${i}/100/100`} 
                      className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-white dark:border-slate-800 shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                  ))}
                </div>
                <div>
                  <p className="text-xs md:text-sm font-bold text-slate-800 dark:text-white">{t("Trusted by 10,000+ Fashion Brands", "Trusted by 10,000+ Fashion Brands")}</p>
                  <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400">{t("Generating 50,000+ photoshoots daily with 99% satisfaction.", "Generating 50,000+ photoshoots daily with 99% satisfaction.")}</p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {appMode === 'design' && (
        <div className="space-y-4 md:space-y-8">
          {/* Design Hero Section - Always visible */}
          <section className="text-center space-y-1.5 pt-4 md:pt-4 max-w-2xl mx-auto px-4 md:px-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-[9px] md:text-xs font-bold border border-indigo-100 dark:border-indigo-800/50 shadow-sm"
            >
              <Sparkles className="w-3 h-3 md:w-3 md:h-3" />
              <span>{t("Hyperlook AI Design Studio", "Hyperlook AI Design Studio")}</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl md:text-2xl lg:text-3xl font-serif font-bold text-slate-900 dark:text-white leading-tight"
            >
              {t("Transform Garments into", "Transform Garments into")} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500 italic">{t("Digital Prints", "Digital Prints")}</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed"
            >
              {t("Upload any design to generate a high-fidelity 21:9 stretch digital print ready for manufacturing, or find inspirations for your next trend.", "Upload any design to generate a high-fidelity 21:9 stretch digital print ready for manufacturing, or find inspirations for your next trend.")}
            </motion.p>
          </section>

          {!showDesignGallery ? (
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto px-4">
              {/* Card 1: Start Generating */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                onClick={() => onSelectStudio('design_print_studio')}
                className="group cursor-pointer relative cute-card p-6 md:p-8 flex flex-col gap-4 items-center text-center overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-700"
              >
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br from-indigo-500 to-cyan-500 opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity" />
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500">
                  <Shirt className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{t("Digital Print Studio", "Digital Print Studio")}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t("Instantly generate high-fidelity 21:9 digital prints from any fabric or kurti design.", "Instantly generate high-fidelity 21:9 digital prints from any fabric or kurti design.")}</p>
                </div>
                <div className="mt-auto px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-xs uppercase tracking-widest group-hover:bg-indigo-600 dark:group-hover:bg-indigo-400 flex items-center gap-2 transition-colors">
                  {t("Start Generating", "Start Generating")} <ArrowRight className="w-4 h-4" />
                </div>
              </motion.div>

              {/* Card 2: Inspirations */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={() => setShowDesignGallery(true)}
                className="group cursor-pointer relative cute-card p-6 md:p-8 flex flex-col gap-4 items-center text-center overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:border-fuchsia-300 dark:hover:border-fuchsia-700"
              >
                <div className="absolute -left-8 -top-8 w-24 h-24 bg-gradient-to-br from-fuchsia-500 to-pink-500 opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity" />
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500">
                  <Sparkle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{t("Inspirations & Ideas", "Inspirations & Ideas")}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t("Discover handpicked trend ideas and ready-to-use concepts for manufacturers.", "Discover handpicked trend ideas and ready-to-use concepts for manufacturers.")}</p>
                </div>
                <div className="mt-auto px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full font-bold text-xs uppercase tracking-widest group-hover:bg-fuchsia-100 dark:group-hover:bg-fuchsia-900/50 flex items-center gap-2 transition-colors">
                  {t("Explore Gallery", "Explore Gallery")} <ArrowRight className="w-4 h-4" />
                </div>
              </motion.div>
            </section>
          ) : (
            <section className="max-w-6xl mx-auto px-4 pb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm tracking-widest uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <button 
                    onClick={() => setShowDesignGallery(false)}
                    className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mr-1"
                  >
                    <ArrowRight className="w-5 h-5 md:w-6 md:h-6 rotate-180 text-slate-500" />
                  </button>
                  Design Inspirations
                </h2>
              </div>
              
              <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                {[
                  { r: 'aspect-[3/4]', n: 'Floral Kurti' },
                  { r: 'aspect-[4/5]', n: 'Geometric Saree' },
                  { r: 'aspect-[1/1]', n: 'Boho Print' },
                  { r: 'aspect-[3/5]', n: 'Abstract Flow' },
                  { r: 'aspect-[4/5]', n: 'Pastel Fusion' },
                  { r: 'aspect-[1/1]', n: 'Neon Glow' },
                  { r: 'aspect-[3/4]', n: 'Modern Classic' },
                  { r: 'aspect-[4/5]', n: 'Vintage Chic' },
                  { r: 'aspect-[3/4]', n: 'Minimalist Line' },
                  { r: 'aspect-[1/1]', n: 'Vibrant Splash' }
                ].map((item, i) => (
                  <div 
                    key={i} 
                    onClick={() => setSelectedGalleryItem({id: i, img: `https://picsum.photos/seed/pinterest${i}/600/800`, n: item.n})}
                    className={`group relative rounded-2xl overflow-hidden cute-card shadow-sm hover:shadow-xl transition-all duration-300 block break-inside-avoid w-full cursor-pointer ${item.r}`}
                  >
                    <img 
                      src={`https://picsum.photos/seed/pinterest${i}/600/800`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      alt={item.n}
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                      <p className="text-white font-bold text-sm leading-tight">{item.n}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {appMode === 'videos' && (
        <div className="py-12 md:py-16 text-center max-w-2xl mx-auto space-y-6 px-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-tr from-brand-100 to-accent-100 dark:from-brand-900/30 dark:to-accent-900/30 rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-brand-200/50 dark:shadow-none border border-white dark:border-slate-800 rotate-3 hover:rotate-0 transition-transform duration-500"
          >
            <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-accent-500 stroke-[url(#gradient)]" />
            <svg width="0" height="0">
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop stopColor="#ec4899" offset="0%" />
                <stop stopColor="#8b5cf6" offset="100%" />
              </linearGradient>
            </svg>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
            className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-slate-900 dark:text-white leading-tight"
          >
            Cinematic AI <span className="gradient-text italic">Video Studio</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            We are crafting a revolutionary engine for ultra-realistic product videos. Flawless consistency, physical physics, and breathtaking lighting.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
            className="pt-4"
          >
            <span className="relative inline-flex items-center gap-2 px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full text-xs md:text-sm font-bold uppercase tracking-widest shadow-xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-brand-500 to-accent-500 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-in-out" />
              <span className="relative z-10 flex items-center gap-2">Drops Soon <Sparkles className="w-3 h-3 md:w-4 md:h-4" /></span>
            </span>
          </motion.div>
        </div>
      )}
    </div>
  );
}
