import React, { useState } from "react";
import { motion } from "motion/react";
import { Check, Edit3, Sparkles, ChevronLeft } from "lucide-react";

interface GarmentSelectorProps {
  recommendation: {
    garmentType: string;
    gender: string;
    ageGroup: string;
    style: string;
    description: string;
    features: string[];
    category: "top" | "bottom" | "full_set";
    complementaryOptions?: { label: string; description: string }[];
    footwearOptions?: { label: string; description: string }[];
  };
  userNote: string;
  onUserNote: (note: string) => void;
  onConfirm: (type: string, gender: string, age: string, style: string, description: string, complementaryPart?: { label: string; description: string }, footwear?: { label: string; description: string }) => void;
  onBack: () => void;
}

const COMMON_GARMENTS = ["Saree", "Sherwani", "Kurti", "Lehenga", "Suit", "Dress", "Shirt", "T-Shirt", "Blazer", "Trousers"];
const GENDERS = ["Male", "Female", "Unisex"];
const AGE_GROUPS = ["Infant", "Toddler", "Child", "Teen", "Adult"];

export default function GarmentSelector({ recommendation, userNote, onUserNote, onConfirm, onBack }: GarmentSelectorProps) {
  const [selectedType, setSelectedType] = useState(recommendation.garmentType);
  const [gender, setGender] = useState(recommendation.gender);
  const [ageGroup, setAgeGroup] = useState(recommendation.ageGroup);
  const [style, setStyle] = useState(recommendation.style);
  const [description, setDescription] = useState(recommendation.description);
  const [selectedComplementary, setSelectedComplementary] = useState<{ label: string; description: string } | undefined>(
    recommendation.complementaryOptions?.[0]
  );
  const [selectedFootwear, setSelectedFootwear] = useState<{ label: string; description: string } | undefined>(
    recommendation.footwearOptions?.[0]
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors font-medium -mt-2"
      >
        <ChevronLeft className="w-5 h-5" />
        Back to Upload
      </button>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Sparkles className="w-24 h-24 text-brand-600 dark:text-brand-400" />
        </div>

        <div className="flex items-center gap-4 mb-4 md:mb-6">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-brand-100 dark:bg-brand-900/30 rounded-2xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 md:w-6 h-6 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white">Deep Analysis Result</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm">AI has analyzed gender, age, and style</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Garment Type */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Garment Type</label>
            <div className="flex flex-wrap gap-2">
              {COMMON_GARMENTS.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border-2 ${
                    selectedType.toLowerCase() === type.toLowerCase()
                      ? "bg-brand-600 border-brand-600 text-white"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-300 dark:hover:border-brand-700"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Special User Note */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Special Instructions / Highlights</label>
            <textarea
              value={userNote}
              onChange={(e) => onUserNote(e.target.value)}
              placeholder="E.g., Highlight the embroidery on the sleeves, focus on the collar design..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-500 outline-none text-slate-700 dark:text-slate-300 resize-none h-24"
            />
          </div>

          {/* Complementary Part Selection */}
          {recommendation.category !== "full_set" && recommendation.complementaryOptions && (
            <div className="space-y-3 p-6 bg-brand-50 dark:bg-brand-900/20 rounded-2xl border border-brand-100 dark:border-brand-900/40">
              <label className="text-sm font-bold text-brand-700 dark:text-brand-400 uppercase tracking-wider flex items-center gap-2">
                Complete the Look
                <Sparkles className="w-4 h-4" />
              </label>
              <p className="text-xs text-brand-600 dark:text-brand-400 mb-4">
                This looks like a <strong>{recommendation.category}</strong>. How should we style the other half?
              </p>
              <div className="grid grid-cols-2 md:flex md:flex-row md:overflow-x-auto md:snap-x pb-4 gap-3 md:scrollbar-thin md:scrollbar-thumb-brand-200 dark:md:scrollbar-thumb-brand-800">
                {recommendation.complementaryOptions.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => setSelectedComplementary(option)}
                    className={`w-full md:w-[200px] flex-shrink-0 md:snap-center p-4 rounded-xl text-left transition-all border-2 flex flex-col justify-between aspect-square md:aspect-auto ${
                      selectedComplementary?.label === option.label
                        ? "bg-white dark:bg-slate-800 border-brand-600 shadow-md"
                        : "bg-white/50 dark:bg-slate-800/50 border-transparent hover:border-brand-200 dark:hover:border-brand-800"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <span className={`font-bold text-sm md:text-base leading-tight ${selectedComplementary?.label === option.label ? "text-brand-700 dark:text-brand-400" : "text-slate-700 dark:text-slate-300"}`}>
                          {option.label}
                        </span>
                        {selectedComplementary?.label === option.label && <Check className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-4 md:line-clamp-none">{option.description}</p>
                    </div>
                  </button>
                ))}
                
                {/* Custom Option */}
                <div className={`w-full md:w-[200px] flex-shrink-0 md:snap-center p-4 rounded-xl text-left transition-all border-2 flex flex-col aspect-square md:aspect-auto ${
                  selectedComplementary?.label === "Custom"
                    ? "bg-white dark:bg-slate-800 border-brand-600 shadow-md"
                    : "bg-white/50 dark:bg-slate-800/50 border-transparent hover:border-brand-200 dark:hover:border-brand-800"
                }`}>
                  <div className="flex items-start justify-between mb-2 cursor-pointer" onClick={() => setSelectedComplementary({ label: "Custom", description: "" })}>
                    <span className={`font-bold text-sm md:text-base leading-tight flex items-center gap-1 ${selectedComplementary?.label === "Custom" ? "text-brand-700 dark:text-brand-400" : "text-slate-700 dark:text-slate-300"}`}>
                      <Edit3 className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
                      Custom
                    </span>
                    {selectedComplementary?.label === "Custom" && <Check className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />}
                  </div>
                  {selectedComplementary?.label === "Custom" ? (
                    <textarea
                      autoFocus
                      value={selectedComplementary.description}
                      onChange={(e) => setSelectedComplementary({ label: "Custom", description: e.target.value })}
                      placeholder="E.g., A bright red silk skirt..."
                      className="w-full p-2 mt-1 rounded-lg border border-brand-200 dark:border-brand-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none resize-none h-24 text-sm text-slate-700 dark:text-slate-300 bg-transparent"
                    />
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 cursor-pointer" onClick={() => setSelectedComplementary({ label: "Custom", description: "" })}>
                      Write your own brief description for the other half.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gender */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Gender</label>
              <div className="flex gap-2">
                {GENDERS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all border-2 ${
                      gender === g
                        ? "bg-brand-600 border-brand-600 text-white"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-300 dark:hover:border-brand-700"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Age Group */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Age Group</label>
              <div className="flex flex-wrap gap-2">
                {AGE_GROUPS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAgeGroup(a)}
                    className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all border-2 ${
                      ageGroup.includes(a)
                        ? "bg-brand-600 border-brand-600 text-white"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-300 dark:hover:border-brand-700"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Style */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Style Context</label>
            <input
              type="text"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-500 outline-none text-slate-700 dark:text-slate-300"
              placeholder="e.g. Traditional, Formal, Casual..."
            />
          </div>

          {/* Footwear Selection */}
          {recommendation.footwearOptions && (
            <div className="space-y-3 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                Footwear
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                AI suggested footwear that best suits the overall garment style.
              </p>
              <div className="grid grid-cols-2 md:flex md:flex-row md:overflow-x-auto md:snap-x pb-4 gap-3 md:scrollbar-thin md:scrollbar-thumb-slate-300 dark:md:scrollbar-thumb-slate-600">
                {recommendation.footwearOptions.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => setSelectedFootwear(option)}
                    className={`w-full md:w-[200px] flex-shrink-0 md:snap-center p-4 rounded-xl text-left transition-all border-2 flex flex-col justify-between aspect-square md:aspect-auto ${
                      selectedFootwear?.label === option.label
                        ? "bg-white dark:bg-slate-800 border-slate-800 dark:border-slate-400 shadow-md"
                        : "bg-white/50 dark:bg-slate-800/50 border-transparent hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <span className={`font-bold text-sm md:text-base leading-tight ${selectedFootwear?.label === option.label ? "text-slate-800 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}>
                          {option.label}
                        </span>
                        {selectedFootwear?.label === option.label && <Check className="w-4 h-4 text-slate-800 dark:text-white shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-4 md:line-clamp-none">{option.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-center sm:justify-end">
          <button
            onClick={() => onConfirm(selectedType, gender, ageGroup, style, description, selectedComplementary, selectedFootwear)}
            className="w-full sm:w-auto px-10 py-4 bg-brand-600 text-white rounded-2xl font-bold hover:bg-brand-700 transition-all shadow-xl shadow-brand-200 dark:shadow-none flex items-center justify-center gap-2 group"
          >
            Confirm & Continue
            <Check className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
