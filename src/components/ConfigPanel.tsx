import React from "react";
import { motion } from "motion/react";
import { Zap, Layout, User, CheckCircle2, Info, ChevronLeft } from "lucide-react";

interface ConfigPanelProps {
  config: {
    quality: "1K" | "2K" | "4K";
    aspectRatio: "1:1" | "3:4" | "4:3" | "9:16";
    backdrop: string;
    poses: string[];
  };
  onChange: (key: string, value: any) => void;
  onGenerate: () => void;
  onBack: () => void;
  isLocked?: boolean;
  generatedPoses?: string[];
}

const QUALITY_OPTIONS = [
  { id: "1K", label: "1K Resolution", desc: "1024x1024 - Fast processing, moderate low fidelity but clearly visible", icon: Zap },
  { id: "2K", label: "2K Resolution", desc: "2048x2048 - Moderate high fidelity, balanced processing", icon: Zap },
  { id: "4K", label: "4K Resolution", desc: "4096x4096 - Highest fidelity, utmost detailing", icon: Zap },
];

const BACKDROP_OPTIONS = [
  { id: "Minimalist Botanical Studio", label: "Minimal Botanical", desc: "Clean white studio, soft shadows, sleek wooden stool, tall olive tree in a terracotta pot", icon: Layout },
  { id: "Industrial Loft Studio", label: "Industrial Loft", desc: "Exposed brick wall, large arched windows, concrete floor, vintage leather armchair", icon: Layout },
  { id: "Bohemian Indoor Studio", label: "Bohemian Studio", desc: "Macrame wall hangings, a rattan chair, lush monstera plants, warm sunlight", icon: Layout },
  { id: "Vintage Elegance Studio", label: "Vintage Elegance", desc: "Ornate wainscoting, velvet chaise lounge, antique brass floor lamp, subtle floral arrangements", icon: Layout },
  { id: "Modern Geometric Studio", label: "Modern Geometric", desc: "Abstract textured walls with arched alcoves, sculptural pedestal, dried pampas grass", icon: Layout },
  { id: "Earthy Terracotta Studio", label: "Earthy Terracotta", desc: "Warm terracotta textured walls, woven rug, wooden bench, desert cacti props", icon: Layout },
];

const POSE_OPTIONS = [
  { id: "Front Full Body", label: "Front Full", desc: "Professional front-facing full body pose", icon: User },
  { id: "Back Full Body", label: "Back Full", desc: "Detailed back view full body pose", icon: User },
  { id: "Side Pose", label: "Side Pose", desc: "Elegant side profile full body pose", icon: User },
  { id: "Half Portrait", label: "Half Portrait", desc: "Focusing top part above waist", icon: User },
  { id: "Sitting Pose", label: "Sitting", desc: "Relaxed professional sitting pose", icon: User },
  { id: "Walking Pose", label: "Walking", desc: "Dynamic professional walking gesture", icon: User },
  { id: "Hands in Pockets", label: "Hands in Pockets", desc: "Casual pose with both hands correctly placed in garment pockets", icon: User },
  { id: "Product Focus", label: "Product Focus", desc: "Close-up detail shot highlighting only the specific input garment", icon: User },
];

const ASPECT_RATIOS = [
  { id: "3:4", label: "3:4 (Portrait)", desc: "Ideal for fashion & e-commerce", icon: Layout },
  { id: "1:1", label: "1:1 (Square)", desc: "Perfect for Instagram feeds", icon: Layout },
  { id: "4:3", label: "4:3 (Landscape)", desc: "Wide view for lookbooks", icon: Layout },
  { id: "9:16", label: "9:16 (Story)", desc: "Full vertical for Reels/Stories", icon: Layout },
];

export default function ConfigPanel({ config, onChange, onGenerate, onBack, isLocked, generatedPoses = [] }: ConfigPanelProps) {
  const togglePose = (poseId: string) => {
    const currentPoses = config.poses || [];
    if (currentPoses.includes(poseId)) {
      onChange("poses", currentPoses.filter(p => p !== poseId));
    } else {
      onChange("poses", [...currentPoses, poseId]);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      {!isLocked && (
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors font-medium"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Garment Details
        </button>
      )}

      {isLocked && (
        <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-900/40 rounded-2xl p-6 flex items-start gap-4">
          <Info className="w-6 h-6 text-brand-600 dark:text-brand-400 shrink-0 mt-1" />
          <p className="text-brand-800 dark:text-brand-200 text-sm leading-relaxed">
            <strong>Magic Reference Active:</strong> You are generating variations of an existing image. Backdrop and Garment Details are locked to ensure 100% consistency. You can only change Poses, Aspect Ratio, and Quality.
          </p>
        </div>
      )}

      {/* Backdrop Selection */}
      <section className={`space-y-6 ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/30 rounded-xl flex items-center justify-center">
            <Layout className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Select Backdrop</h3>
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

      {/* Pose Selection */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/30 rounded-xl flex items-center justify-center">
            <User className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">Select Poses</h3>
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
                      Generated
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

      {/* Aspect Ratio Selection */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/30 rounded-xl flex items-center justify-center">
            <Layout className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">Aspect Ratio</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {ASPECT_RATIOS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onChange("aspectRatio", opt.id)}
              className={`p-3 md:p-4 rounded-2xl border-2 text-left transition-all duration-300 flex flex-col gap-1 md:gap-2 ${
                config.aspectRatio === opt.id
                  ? "border-brand-600 bg-brand-50/50 dark:bg-brand-900/20 ring-4 ring-brand-100 dark:ring-brand-900/40"
                  : "border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <div className="flex items-start justify-between">
                <span className={`font-bold text-sm md:text-base ${config.aspectRatio === opt.id ? "text-brand-700 dark:text-brand-400" : "text-slate-700 dark:text-slate-300"}`}>
                  {opt.label}
                </span>
                {config.aspectRatio === opt.id && <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-brand-600 dark:text-brand-400 shrink-0" />}
              </div>
              <span className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 leading-tight">{opt.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-900/40 rounded-2xl p-6 flex items-start gap-4">
        <Info className="w-6 h-6 text-brand-600 dark:text-brand-400 shrink-0 mt-1" />
        <p className="text-brand-800 dark:text-brand-200 text-sm leading-relaxed">
          <strong>Model Consistency:</strong> Generating multiple poses for the same product will maintain model consistency (face, hairstyle, and garment details) across all images.
        </p>
      </div>

      <div className="flex justify-center pt-8 pb-12">
        <button
          onClick={onGenerate}
          disabled={!config.poses || config.poses.length === 0}
          className={`w-full sm:w-auto px-16 py-5 rounded-2xl font-bold text-xl transition-all shadow-2xl flex items-center justify-center gap-3 group ${
            !config.poses || config.poses.length === 0 
              ? "bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-none" 
              : "bg-brand-600 text-white hover:bg-brand-700 shadow-brand-200 dark:shadow-none"
          }`}
        >
          Generate Photoshoot
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
