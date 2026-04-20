import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, Plus, X, Image as ImageIcon, Star } from "lucide-react";

interface ImageUploaderProps {
  onMainImage: (base64: string) => void;
  onRefImages: (base64s: string[]) => void;
  mainImage: string | null;
  refImages: string[];
  isMagicRef?: boolean;
  onMagicRefChange?: (val: boolean) => void;
}

export default function ImageUploader({ onMainImage, onRefImages, mainImage, refImages, isMagicRef, onMagicRefChange }: ImageUploaderProps) {
  const mainInputRef = useRef<HTMLInputElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        
        // Max dimension 1500px to keep base64 size well under Vercel's 4.5MB limit
        const MAX_DIMENSION = 1500;
        if (width > height && width > MAX_DIMENSION) {
          height *= MAX_DIMENSION / width;
          width = MAX_DIMENSION;
        } else if (height > MAX_DIMENSION) {
          width *= MAX_DIMENSION / height;
          height = MAX_DIMENSION;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress to JPEG with 0.8 quality
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
          callback(dataUrl.split(",")[1]);
        } else {
          // Fallback if canvas fails
          const base64 = e.target?.result as string;
          callback(base64.split(",")[1]);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const onMainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file, onMainImage);
  };

  const onRefChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    files.forEach((file) => {
      handleFile(file, (base64) => {
        onRefImages([...refImages, base64]);
      });
    });
  };

  const removeRef = (index: number) => {
    const newRefs = [...refImages];
    newRefs.splice(index, 1);
    onRefImages(newRefs);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        {/* Main Product Image */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm md:text-base font-semibold text-slate-800 dark:text-white">
              Main Product Image <span className="text-red-500">*</span>
            </label>
            {onMagicRefChange && (
              <button
                onClick={() => onMagicRefChange(!isMagicRef)}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] md:text-sm font-bold transition-colors ${
                  isMagicRef 
                    ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500 border border-yellow-200 dark:border-yellow-900/50" 
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent"
                }`}
                title="Use an existing generation to create new poses with 100% consistency"
              >
                <Star className={`w-3 h-3 md:w-4 md:h-4 ${isMagicRef ? "fill-yellow-500 text-yellow-500" : ""}`} />
                Magic Ref
              </button>
            )}
          </div>
          <div
            onClick={() => mainInputRef.current?.click()}
            className={`relative w-full h-48 md:h-auto md:aspect-square rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer flex flex-col items-center justify-center overflow-hidden ${
              mainImage ? "border-brand-500 bg-brand-50/30 dark:bg-brand-900/10" : "border-slate-300 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-600 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            }`}
          >
            <input type="file" ref={mainInputRef} onChange={onMainChange} accept="image/*" className="hidden" />
            {mainImage ? (
              <img src={`data:image/jpeg;base64,${mainImage}`} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            ) : (
              <div className="text-center p-4">
                <div className="w-10 h-10 md:w-16 md:h-16 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-4">
                  <Upload className="w-5 h-5 md:w-8 md:h-8 text-brand-600 dark:text-brand-400" />
                </div>
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 font-medium">Click to upload raw garment image</p>
                <p className="text-[10px] md:text-sm text-slate-400 dark:text-slate-500 mt-1">PNG, JPG up to 10MB</p>
              </div>
            )}
            {mainImage && (
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <p className="text-white text-sm font-medium">Change Image</p>
              </div>
            )}
          </div>
          {isMagicRef && (
            <p className="text-[10px] md:text-sm text-yellow-700 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-xl border border-yellow-100 dark:border-yellow-900/40 leading-tight">
              <Star className="w-3 h-3 inline-block mr-1 mb-0.5" />
              <strong>Magic Ref Mode:</strong> Upload an existing generation to perfectly match the model and background, changing only the pose.
            </p>
          )}
        </div>

        {/* Reference Images */}
        <div className="space-y-2">
          <label className="block text-sm md:text-base font-semibold text-slate-800 dark:text-white">
            Reference Images <span className="text-[10px] md:text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">(Optional hooks/angles)</span>
          </label>
          <div className="grid grid-cols-3 md:grid-cols-2 gap-2 md:gap-4">
            <AnimatePresence>
              {refImages.map((img, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group shadow-sm"
                >
                  <img src={`data:image/jpeg;base64,${img}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRef(idx);
                    }}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {refImages.length < 4 && (
              <button
                onClick={() => refInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col items-center justify-center transition-all group"
              >
                <Plus className="w-6 h-6 md:w-8 md:h-8 text-slate-400 dark:text-slate-500 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors" />
                <span className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mt-1 md:mt-2 font-medium">Add More</span>
                <input type="file" ref={refInputRef} onChange={onRefChange} accept="image/*" multiple className="hidden" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
