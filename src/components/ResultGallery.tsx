import React from "react";
import { motion } from "motion/react";
import { Download, RefreshCcw, LayoutGrid, ArrowLeft, CheckCircle, PlusCircle, Wand2 } from "lucide-react";

interface ResultGalleryProps {
  images: string[];
  onRetry: () => void;
  onTryDifferent: (index: number) => void;
  onTryNewInput: () => void;
  onAddMorePoses: () => void;
  isGenerating: boolean;
  progress?: number;
  aspectRatio?: string;
  generatingIndex?: number | null;
  logo?: string;
}

export default function ResultGallery({ images, onRetry, onTryDifferent, onTryNewInput, onAddMorePoses, isGenerating, progress = 0, aspectRatio = "1:1", generatingIndex = null, logo }: ResultGalleryProps) {
  const downloadImage = (dataUrl: string, index: number) => {
    try {
      // Split the data URL to get the content type and base64 data
      const parts = dataUrl.split(',');
      if (parts.length !== 2) throw new Error("Invalid image data");
      
      const contentType = parts[0].split(':')[1].split(';')[0];
      const base64Data = parts[1].replace(/\s/g, '');
      
      // Convert base64 to Blob
      const byteCharacters = atob(base64Data);
      const byteArrays = [];
      
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      
      const blob = new Blob(byteArrays, { type: contentType });
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `photoshoot-result-${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the object URL
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (e) {
      console.error("Download failed:", e);
      // Fallback to direct href if blob conversion fails
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `photoshoot-result-${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Map aspect ratio string to Tailwind classes
  const getAspectRatioClass = (ratio: string) => {
    switch (ratio) {
      case "3:4": return "aspect-[3/4]";
      case "4:3": return "aspect-[4/3]";
      case "9:16": return "aspect-[9/16]";
      case "1:1":
      default: return "aspect-square";
    }
  };

  if (!isGenerating && images.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20 space-y-6">
        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
          <Wand2 className="w-10 h-10 text-slate-400 dark:text-slate-500" />
        </div>
        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">No Active Tasks</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">You don't have any ongoing or completed photoshoots in your workspace right now.</p>
        <button 
          onClick={onTryNewInput} 
          className="px-8 py-3 bg-brand-600 text-white rounded-full font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-200 dark:shadow-none mt-4"
        >
          Start New Photoshoot
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            Generated Photoshoot
            <CheckCircle className="w-8 h-8 text-green-500" />
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Your professional photoshoot is ready for download.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {isGenerating && generatingIndex === null ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 space-y-6">
            <div className="relative">
              <div className="w-24 h-24 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin" />
              <img src={logo || "/logo.png"} onError={(e) => e.currentTarget.src = '/logo.png'} alt="Loading" className="absolute inset-0 m-auto w-10 h-10 object-contain animate-pulse" />
            </div>
            <div className="text-center space-y-4 w-full max-w-md">
              <p className="text-xl font-bold text-slate-800 dark:text-white">Generating Hyper-Realistic Image...</p>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Applying highest fidelity and professional studio lighting.</p>
              
              {/* Progress Bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 mt-6 overflow-hidden">
                <div 
                  className="bg-brand-600 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm font-bold text-brand-600 dark:text-brand-400">{Math.round(progress)}%</p>
            </div>
          </div>
        ) : (
          images.map((img, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`group relative ${getAspectRatioClass(aspectRatio)} rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-700`}
            >
              {isGenerating && generatingIndex === idx ? (
                <div className="absolute inset-0 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-4 z-10">
                  <div className="w-12 h-12 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin" />
                  <p className="text-sm font-bold text-brand-600 dark:text-brand-400">Regenerating...</p>
                </div>
              ) : (
                <>
                  <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button
                      onClick={() => downloadImage(img, idx)}
                      className="w-14 h-14 bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
                      title="Download Image"
                    >
                      <Download className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => onTryDifferent(idx)}
                      className="w-14 h-14 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
                      title="Regenerate This Image"
                    >
                      <RefreshCcw className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-brand-700 dark:text-brand-400 shadow-lg">
                    {idx === 0 ? "PRIMARY POSE" : `POSE ${idx + 1}`}
                  </div>
                </>
              )}
            </motion.div>
          ))
        )}
      </div>

      {!isGenerating && images.length > 0 && (
        <div className="flex flex-col items-center gap-6 pt-8">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={onAddMorePoses}
              className="px-8 py-4 rounded-full font-bold text-lg transition-all flex items-center gap-3 shadow-xl bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-900 dark:hover:bg-slate-600 hover:scale-105"
            >
              <PlusCircle className="w-6 h-6" />
              Add More Poses
            </button>
            <button
              onClick={onTryNewInput}
              className="px-8 py-4 rounded-full font-bold text-lg transition-all flex items-center gap-3 shadow-xl bg-brand-600 text-white hover:bg-brand-700 hover:scale-105 shadow-brand-200 dark:shadow-none"
            >
              <Wand2 className="w-6 h-6" />
              Try New Input
            </button>
          </div>
          
          <button
            onClick={() => onTryDifferent(-1)} // -1 means go back to config
            className="text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 font-medium flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Configuration
          </button>
        </div>
      )}
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
    </svg>
  );
}
