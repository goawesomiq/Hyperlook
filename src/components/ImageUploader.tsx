import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, Plus, X, Image as ImageIcon, Star, Palette, Pipette, User, Type } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";

interface ImageUploaderProps {
  onMainImage: (base64: string) => void;
  onRefImages: (base64s: string[]) => void;
  mainImage: string | null;
  refImages: string[];
  isMagicRef?: boolean;
  onMagicRefChange?: (val: boolean) => void;
  isMagicVariation?: boolean;
  onMagicVariationChange?: (val: boolean) => void;
  colorVariationType?: 'text' | 'code' | 'image';
  onColorVariationTypeChange?: (val: 'text' | 'code' | 'image') => void;
  colorVariationValue?: string;
  onColorVariationValueChange?: (val: string) => void;
  magicVariationModelAction?: 'same' | 'different';
  onModelActionChange?: (val: 'same' | 'different') => void;
}

export default function ImageUploader({ 
  onMainImage, 
  onRefImages, 
  mainImage, 
  refImages, 
  isMagicRef, 
  onMagicRefChange,
  isMagicVariation,
  onMagicVariationChange,
  colorVariationType,
  onColorVariationTypeChange,
  colorVariationValue,
  onColorVariationValueChange,
  magicVariationModelAction,
  onModelActionChange
}: ImageUploaderProps) {
  const { t } = useLanguage();
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
          // White background fix for transparent PNGs
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
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

  const swatchInputRef = useRef<HTMLInputElement>(null);

  const onSwatchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onColorVariationValueChange) {
      handleFile(file, (base64) => onColorVariationValueChange(base64));
    }
  };

  return (
    <div className="space-y-3 md:max-w-xl mx-auto w-full">
      {/* Feature Toggles */}
      <div className="flex flex-row items-center justify-center gap-2 md:gap-4 mb-1">
        {onMagicRefChange && (
          <button
            onClick={() => {
              onMagicRefChange(!isMagicRef);
              if (!isMagicRef && onMagicVariationChange) onMagicVariationChange(false);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-2xl text-[10px] md:text-sm font-bold transition-all ${
              isMagicRef 
                ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500 ring-2 ring-yellow-400/50 shadow-lg shadow-yellow-200/50 dark:shadow-none" 
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:shadow-md"
            }`}
          >
            <Star className={`w-3.5 h-3.5 md:w-5 md:h-5 ${isMagicRef ? "fill-yellow-500 text-yellow-500" : ""}`} />
            {t("Magic Ref", "Magic Ref")}
          </button>
        )}
        
        {onMagicVariationChange && (
          <button
            onClick={() => {
              onMagicVariationChange(!isMagicVariation);
              if (!isMagicVariation && onMagicRefChange) onMagicRefChange(false);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-2xl text-[10px] md:text-sm font-bold transition-all ${
              isMagicVariation 
                ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 ring-2 ring-purple-400/50 shadow-lg shadow-purple-200/50 dark:shadow-none" 
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:shadow-md"
            }`}
          >
            <Palette className={`w-3.5 h-3.5 md:w-5 md:h-5 ${isMagicVariation ? "fill-purple-500 text-purple-500" : ""}`} />
            {t("Magic Var", "Magic Var")}
          </button>
        )}
      </div>

      {/* Magic Variation Config */}
      <AnimatePresence>
        {isMagicVariation && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 md:p-5 bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 rounded-3xl space-y-3 shadow-inner"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Variation Type Selection */}
              <div className="space-y-3">
                <p className="text-xs md:text-sm font-bold text-purple-700 dark:text-purple-400 flex items-center gap-2">
                  <Pipette className="w-4 h-4" /> {t("Color Input Type", "Color Input Type")}
                </p>
                <div className="flex gap-2">
                  {[
                    { id: 'text', label: t('Hex/Name', 'Hex/Name'), icon: Type },
                    { id: 'image', label: t('Swatch', 'Swatch'), icon: ImageIcon }
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => onColorVariationTypeChange?.(type.id as any)}
                      className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                        colorVariationType === type.id
                          ? "bg-white dark:bg-slate-800 border-purple-500 text-purple-600 shadow-md scale-[1.02]"
                          : "bg-white/50 dark:bg-slate-800/50 border-transparent text-slate-400 hover:bg-white dark:hover:bg-slate-800"
                      }`}
                    >
                      <type.icon className="w-5 h-5" />
                      <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Model Identity Option */}
              <div className="space-y-3">
                <p className="text-xs md:text-sm font-bold text-purple-700 dark:text-purple-400 flex items-center gap-2">
                  <User className="w-4 h-4" /> {t("Model Identity", "Model Identity")}
                </p>
                <div className="flex gap-2">
                  {[
                    { id: 'same', label: t('Same Model', 'Same Model'), desc: t('Keep original person', 'Keep original person') },
                    { id: 'different', label: t('New Model', 'New Model'), desc: t('Completely new identity', 'Completely new identity') }
                  ].map((action) => (
                    <button
                      key={action.id}
                      onClick={() => onModelActionChange?.(action.id as any)}
                      className={`flex-1 flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                        magicVariationModelAction === action.id
                          ? "bg-white dark:bg-slate-800 border-purple-500 text-purple-600 shadow-md scale-[1.02]"
                          : "bg-white/50 dark:bg-slate-800/50 border-transparent text-slate-400 hover:bg-white dark:hover:bg-slate-800"
                      }`}
                    >
                      <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">{action.label}</span>
                      <span className="text-[9px] font-medium opacity-60">{action.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Input Value */}
            <div className="pt-2">
              {colorVariationType === 'text' ? (
                <div className="relative">
                  <input
                    type="text"
                    value={colorVariationValue}
                    onChange={(e) => onColorVariationValueChange?.(e.target.value)}
                    placeholder={t("Enter color name or hex (e.g., Emerald Green, #50C878)", "Enter color name or hex (e.g., Emerald Green, #50C878)")}
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md border border-slate-200" style={{ backgroundColor: colorVariationValue }} />
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => swatchInputRef.current?.click()}
                    className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-dashed border-purple-300 dark:border-purple-800/50 text-purple-600 font-bold text-sm hover:border-purple-500 transition-colors flex items-center justify-center gap-2"
                  >
                    <ImageIcon className="w-4 h-4" />
                    {colorVariationValue ? t("Change Swatch", "Change Swatch") : t("Upload Color Swatch", "Upload Color Swatch")}
                  </button>
                  <input type="file" ref={swatchInputRef} onChange={onSwatchChange} accept="image/*" className="hidden" />
                  {colorVariationValue && (
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-purple-200 shadow-sm">
                      <img src={`data:image/jpeg;base64,${colorVariationValue}`} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 pt-2">
        {/* Main Product Image */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm md:text-base font-semibold text-slate-800 dark:text-white">
              {t("Main Product Image", "Main Product Image")} <span className="text-red-500">*</span>
            </label>
          </div>
          <div
            onClick={() => mainInputRef.current?.click()}
            className={`relative w-full h-40 md:h-56 lg:h-64 rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer flex flex-col items-center justify-center overflow-hidden ${
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
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 font-medium">{t("Click to upload raw garment image", "Click to upload raw garment image")}</p>
                <p className="text-[10px] md:text-sm text-slate-400 dark:text-slate-500 mt-1">{t("PNG, JPG up to 10MB", "PNG, JPG up to 10MB")}</p>
              </div>
            )}
            {mainImage && (
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <p className="text-white text-sm font-medium">{t("Change Image", "Change Image")}</p>
              </div>
            )}
          </div>
          {isMagicRef && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl border border-yellow-100 dark:border-yellow-900/40 space-y-1">
              <p className="text-[10px] md:text-xs text-yellow-700 dark:text-yellow-500 flex items-center gap-1 font-bold">
                <Star className="w-3 h-3 fill-yellow-500" /> {t("MAGIC REF MODE ACTIVE", "MAGIC REF MODE ACTIVE")}
              </p>
              <p className="text-[10px] md:text-xs text-yellow-600 dark:text-yellow-400 leading-tight">
                {t("Upload an existing generation here. AI will keep the person and background 100% identical while transferring new poses.", "Upload an existing generation here. AI will keep the person and background 100% identical while transferring new poses.")}
              </p>
            </div>
          )}
          {isMagicVariation && (
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-100 dark:border-purple-900/40 space-y-1">
              <p className="text-[10px] md:text-xs text-purple-700 dark:text-purple-400 flex items-center gap-1 font-bold">
                <Palette className="w-3 h-3 fill-purple-500" /> {t("MAGIC VARIATIONS ACTIVE", "MAGIC VARIATIONS ACTIVE")}
              </p>
              <p className="text-[10px] md:text-xs text-purple-600 dark:text-purple-400 leading-tight">
                {t("AI will retain the garment's design and texture but update its color based on your target variation.", "AI will retain the garment's design and texture but update its color based on your target variation.")}
              </p>
            </div>
          )}
        </div>

        {/* Reference Images */}
        <div className="space-y-2">
          <label className="block text-sm md:text-base font-semibold text-slate-800 dark:text-white">
            {t("Reference Images", "Reference Images")} <span className="text-[10px] md:text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">({t("Optional hooks/angles", "Optional hooks/angles")})</span>
          </label>
          <div className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-3">
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
                <span className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mt-1 md:mt-2 font-medium">{t("Add More", "Add More")}</span>
                <input type="file" ref={refInputRef} onChange={onRefChange} accept="image/*" multiple className="hidden" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
