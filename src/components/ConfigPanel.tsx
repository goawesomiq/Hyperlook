import React from "react";
import { motion } from "motion/react";
import { Zap, Layout, User, CheckCircle2, Info, ChevronLeft } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";

interface ConfigPanelProps {
  config: {
    quality: "1K" | "2K" | "4K";
    aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" | string;
    backdrop: string;
    poses: string[];
    garmentType?: string;
  };
  onChange: (key: string, value: any) => void;
  onGenerate: () => void;
  onBack: () => void;
  isLocked?: boolean;
  generatedPoses?: string[];
}

export default function ConfigPanel({ config, onChange, onGenerate, onBack, isLocked, generatedPoses = [] }: ConfigPanelProps) {
  const { t } = useLanguage();

  const QUALITY_OPTIONS = [
    { id: "1K", label: t("1K Resolution", "1K Resolution"), desc: t("1024x1024 - Fast processing, moderate low fidelity but clearly visible", "1024x1024 - Fast processing, moderate low fidelity but clearly visible"), icon: Zap },
    { id: "2K", label: t("2K Resolution", "2K Resolution"), desc: t("2048x2048 - Moderate high fidelity, balanced processing", "2048x2048 - Moderate high fidelity, balanced processing"), icon: Zap },
    { id: "4K", label: t("4K Resolution", "4K Resolution"), desc: t("4096x4096 - Highest fidelity, utmost detailing", "4096x4096 - Highest fidelity, utmost detailing"), icon: Zap },
  ];

  const BACKDROP_OPTIONS = [
    { id: "Minimalist Botanical Studio", label: t("Minimal Botanical", "Minimal Botanical"), desc: t("Clean white studio, soft shadows, sleek wooden stool, tall olive tree in a terracotta pot", "Clean white studio, soft shadows, sleek wooden stool, tall olive tree in a terracotta pot"), icon: Layout },
    { id: "Industrial Loft Studio", label: t("Industrial Loft", "Industrial Loft"), desc: t("Exposed brick wall, large arched windows, concrete floor, vintage leather armchair", "Exposed brick wall, large arched windows, concrete floor, vintage leather armchair"), icon: Layout },
    { id: "Bohemian Indoor Studio", label: t("Bohemian Studio", "Bohemian Studio"), desc: t("Macrame wall hangings, a rattan chair, lush monstera plants, warm sunlight", "Macrame wall hangings, a rattan chair, lush monstera plants, warm sunlight"), icon: Layout },
    { id: "Vintage Elegance Studio", label: t("Vintage Elegance", "Vintage Elegance"), desc: t("Ornate wainscoting, velvet chaise lounge, antique brass floor lamp, subtle floral arrangements", "Ornate wainscoting, velvet chaise lounge, antique brass floor lamp, subtle floral arrangements"), icon: Layout },
    { id: "Modern Geometric Studio", label: t("Modern Geometric", "Modern Geometric"), desc: t("Abstract textured walls with arched alcoves, sculptural pedestal, dried pampas grass", "Abstract textured walls with arched alcoves, sculptural pedestal, dried pampas grass"), icon: Layout },
    { id: "Earthy Terracotta Studio", label: t("Earthy Terracotta", "Earthy Terracotta"), desc: t("Warm terracotta textured walls, woven rug, wooden bench, desert cacti props", "Warm terracotta textured walls, woven rug, wooden bench, desert cacti props"), icon: Layout },
  ];

  const POSE_OPTIONS = [
    { id: "Front Full Body", label: t("Front Full", "Front Full"), desc: t("Professional front-facing full body pose", "Professional front-facing full body pose"), icon: User },
    { id: "Back Full Body", label: t("Back Full", "Back Full"), desc: t("Detailed back view full body pose", "Detailed back view full body pose"), icon: User },
    { id: "Side Pose", label: t("Side Pose", "Side Pose"), desc: t("Elegant side profile full body pose", "Elegant side profile full body pose"), icon: User },
    { id: "Half Portrait", label: t("Half Portrait", "Half Portrait"), desc: t("Focusing top part above waist", "Focusing top part above waist"), icon: User },
    { id: "Sitting Pose", label: t("Sitting", "Sitting"), desc: t("Relaxed professional sitting pose", "Relaxed professional sitting pose"), icon: User },
    { id: "Walking Pose", label: t("Walking", "Walking"), desc: t("Dynamic professional walking gesture", "Dynamic professional walking gesture"), icon: User },
    { id: "Hands in Pockets", label: t("Hands in Pockets", "Hands in Pockets"), desc: t("Casual pose with both hands correctly placed in garment pockets", "Casual pose with both hands correctly placed in garment pockets"), icon: User },
    { id: "Product Focus", label: t("Product Focus", "Product Focus"), desc: t("Close-up detail shot highlighting only the specific input garment", "Close-up detail shot highlighting only the specific input garment"), icon: User },
  ];

  const ASPECT_RATIOS = [
    { id: "3:4", label: t("3:4 (Portrait)", "3:4 (Portrait)"), desc: t("Ideal for fashion & e-commerce", "Ideal for fashion & e-commerce"), icon: Layout },
    { id: "1:1", label: t("1:1 (Square)", "1:1 (Square)"), desc: t("Perfect for Instagram feeds", "Perfect for Instagram feeds"), icon: Layout },
    { id: "4:3", label: t("4:3 (Landscape)", "4:3 (Landscape)"), desc: t("Wide view for lookbooks", "Wide view for lookbooks"), icon: Layout },
    { id: "9:16", label: t("9:16 (Story)", "9:16 (Story)"), desc: t("Full vertical for Reels/Stories", "Full vertical for Reels/Stories"), icon: Layout },
  ];

  const togglePose = (poseId: string) => {
    const currentPoses = config.poses || [];
    if (currentPoses.includes(poseId)) {
      onChange("poses", currentPoses.filter(p => p !== poseId));
    } else {
      onChange("poses", [...currentPoses, poseId]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 pb-12">
      {!isLocked && (
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors font-medium -mt-2"
        >
          <ChevronLeft className="w-5 h-5" />
          {t("Back to Garment Details", "Back to Garment Details")}
        </button>
      )}

      {isLocked && (
        <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-900/40 rounded-2xl p-4 md:p-6 flex items-start gap-4">
          <Info className="w-6 h-6 text-brand-600 dark:text-brand-400 shrink-0 mt-1" />
          <p className="text-brand-800 dark:text-brand-200 text-sm leading-relaxed">
            <strong>{t("Magic Reference Active:", "Magic Reference Active:")}</strong> {t("You are generating variations of an existing image. Backdrop and Garment Details are locked to ensure 100% consistency. You can only change Poses, Aspect Ratio, and Quality.", "You are generating variations of an existing image. Backdrop and Garment Details are locked to ensure 100% consistency. You can only change Poses, Aspect Ratio, and Quality.")}
          </p>
        </div>
      )}

      {/* Backdrop Selection */}
      <section className={`space-y-3 md:space-y-4 ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/30 rounded-xl flex items-center justify-center">
            <Layout className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{t("Select Backdrop", "Select Backdrop")}</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {BACKDROP_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onChange("backdrop", opt.id)}
              disabled={isLocked}
              className={`p-3 rounded-2xl border-2 text-left transition-all duration-300 flex flex-col gap-2 ${
                config.backdrop === opt.id
                  ? "border-brand-600 bg-brand-50/50 dark:bg-brand-900/20 ring-4 ring-brand-100 dark:ring-brand-900/40"
                  : "border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <div className="aspect-video w-full rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                <img 
                  src={`https://picsum.photos/seed/${opt.id}/400/225`} 
                  className="w-full h-full object-cover opacity-80" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col">
                <span className={`font-bold block text-sm md:text-base ${config.backdrop === opt.id ? "text-brand-700 dark:text-brand-400" : "text-slate-700 dark:text-slate-300"}`}>
                  {opt.label}
                </span>
                <span className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{opt.desc}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {config.garmentType !== 'design_print' && (
        <section className="space-y-3 md:space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/30 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">{t("Select Poses", "Select Poses")}</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {POSE_OPTIONS.map((opt) => {
              const isSelected = (config.poses || []).includes(opt.id);
              const isGenerated = generatedPoses.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => togglePose(opt.id)}
                  className={`p-3 md:p-4 rounded-2xl border-2 text-center transition-all duration-300 flex flex-col items-center gap-2 md:gap-3 relative ${
                    isSelected
                      ? "border-brand-600 bg-brand-50/50 dark:bg-brand-900/20 ring-4 ring-brand-100 dark:ring-brand-900/40"
                      : isGenerated
                      ? "border-slate-300 dark:border-slate-600 bg-slate-100/50 dark:bg-slate-800/50 hover:border-brand-300 dark:hover:border-brand-700"
                      : "border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  {isGenerated && !isSelected && (
                    <div className="absolute top-2 left-2 right-2 flex justify-center">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                        {t("Generated", "Generated")}
                      </span>
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-brand-600 dark:text-brand-400" />
                    </div>
                  )}
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-colors mt-4 ${
                    isSelected ? "bg-brand-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                  }`}>
                    <User className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <span className={`font-bold text-xs md:text-sm leading-tight ${isSelected ? "text-brand-700 dark:text-brand-400" : "text-slate-700 dark:text-slate-300"}`}>
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Aspect Ratio Selection */}
      <section className="space-y-3 md:space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/30 rounded-xl flex items-center justify-center">
            <Layout className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">{t("Aspect Ratio", "Aspect Ratio")}</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {(config.garmentType === 'design_print' ? [{id: "16:9", label: t("21:9 (Digital Print)", "21:9 (Digital Print)"), desc: t("Long stretch horizontal template", "Long stretch horizontal template"), icon: Layout}] : ASPECT_RATIOS).map((opt) => (
            <button
              key={opt.id}
              onClick={() => onChange("aspectRatio", opt.id)}
              className={`p-3 md:p-4 rounded-2xl border-2 text-left transition-all duration-300 flex flex-col gap-1 md:gap-2 ${
                config.aspectRatio === opt.id || (config.garmentType === 'design_print' && opt.id === '16:9')
                  ? "border-brand-600 bg-brand-50/50 dark:bg-brand-900/20 ring-4 ring-brand-100 dark:ring-brand-900/40"
                  : "border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <div className="flex items-start justify-between">
                <span className={`font-bold text-sm md:text-base ${config.aspectRatio === opt.id || (config.garmentType === 'design_print' && opt.id === '16:9') ? "text-brand-700 dark:text-brand-400" : "text-slate-700 dark:text-slate-300"}`}>
                  {opt.label}
                </span>
                {(config.aspectRatio === opt.id || config.garmentType === 'design_print') && <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-brand-600 dark:text-brand-400 shrink-0" />}
              </div>
              <span className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 leading-tight">{opt.desc}</span>
            </button>
          ))}
        </div>
      </section>

      {config.garmentType !== 'design_print' && (
        <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-900/40 rounded-2xl p-4 md:p-5 flex items-start gap-4">
          <Info className="w-6 h-6 text-brand-600 dark:text-brand-400 shrink-0 mt-1" />
          <p className="text-brand-800 dark:text-brand-200 text-xs md:text-sm leading-relaxed">
            <strong>{t("Model Consistency:", "Model Consistency:")}</strong> {t("Generating multiple poses for the same product will maintain model consistency (face, hairstyle, and garment details) across all images.", "Generating multiple poses for the same product will maintain model consistency (face, hairstyle, and garment details) across all images.")}
          </p>
        </div>
      )}

      <div className="flex justify-center pt-4 md:pt-6 pb-6">
        <button
          onClick={onGenerate}
          disabled={config.garmentType !== 'design_print' && (!config.poses || config.poses.length === 0)}
          className={`w-full sm:w-auto px-10 md:px-14 py-4 md:py-4 rounded-2xl font-bold text-lg md:text-xl transition-all shadow-2xl flex items-center justify-center gap-3 group ${
            (config.garmentType !== 'design_print' && (!config.poses || config.poses.length === 0))
              ? "bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-none" 
              : "bg-brand-600 text-white hover:bg-brand-700 shadow-brand-200 dark:shadow-none"
          }`}
        >
          {config.garmentType === 'design_print' ? t('Generate Template', 'Generate Template') : t('Generate Photoshoot', 'Generate Photoshoot')}
          <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        </button>
      </div>
    </div>
  );
}

function Sparkles({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
