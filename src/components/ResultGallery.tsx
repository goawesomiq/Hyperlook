import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Download, RefreshCcw, LayoutGrid, ArrowLeft, CheckCircle, PlusCircle, Wand2, Crown } from "lucide-react";
import { auth } from "../firebase";

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
  isDesign?: boolean;
}

export default function ResultGallery({ images, onRetry, onTryDifferent, onTryNewInput, onAddMorePoses, isGenerating, progress = 0, aspectRatio = "1:1", generatingIndex = null, logo, isDesign = false }: ResultGalleryProps) {
  const [processingHighRes, setProcessingHighRes] = useState<{ [index: number]: '2k' | '4k' | null }>({});
  const [highResUrls, setHighResUrls] = useState<{ [index: number]: { '2k'?: string, '4k'?: string } }>({});
  const [highResProgress, setHighResProgress] = useState<{ [index: number]: number }>({});



  const cost1k = isDesign ? 1.5 : 1;
  const cost2k = isDesign ? 2.5 : 1.5;
  const cost4k = isDesign ? 3 : 2;

  const downloadImage = (dataUrl: string, index: number, isHighRes: boolean = false, type: '1k' | '2k' | '4k' = '1k') => {
    try {
      if (isHighRes && !dataUrl.startsWith('data:')) {
        // Direct download for premium if it's a URL (mocked as dataUrl for now)
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `photoshoot-${type}-result-${index + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // Existing 1K/data URL logic
      const parts = dataUrl.split(',');
      if (parts.length !== 2) throw new Error("Invalid image data");
      
      const contentType = parts[0].split(':')[1].split(';')[0];
      const base64Data = parts[1].replace(/\s/g, '');
      if (base64Data.length < 100) throw new Error("Image data too small");

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
      link.download = `photoshoot-${type}-result-${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (e) {
      console.error("Download failed:", e);
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `photoshoot-${type}-result-${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleRequestHighRes = async (index: number, quality: '2k' | '4k') => {
    if (processingHighRes[index]) return;
    
    // Set processing state
    setProcessingHighRes(prev => ({ ...prev, [index]: quality }));

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Please log in to use high-fidelity features.");

      const response = await fetch("/api/upscale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
          imageBase64: images[index], // Send the 1K image directly
          quality,
          isDesign
        })
      });

      if (!response.ok) {
         const respObj = await response.json();
         throw new Error(respObj.error || "Failed to start upscaling");
      }
      
      const { jobId } = await response.json();
      
      const eventSource = new EventSource(`/api/status/${jobId}`);
      
      eventSource.onmessage = async (e) => {
        const data = JSON.parse(e.data);
        if (data.progress !== undefined) {
          setHighResProgress(prev => ({ ...prev, [index]: data.progress }));
        }
        if (data.state === 'completed') {
          eventSource.close();
          const res = await fetch(`/api/result/${jobId}`);
          if (res.ok) {
            const resData = await res.json();
            setHighResUrls(prev => ({
              ...prev,
              [index]: {
                ...prev[index],
                [quality]: resData.returnvalue?.imageUrl || resData.returnvalue
              }
            }));
          } else {
            console.error("Failed to fetch upscale result.");
          }
          setProcessingHighRes(prev => ({ ...prev, [index]: null }));
          setHighResProgress(prev => { const n = {...prev}; delete n[index]; return n; });
        } else if (data.state === 'failed') {
          eventSource.close();
          setProcessingHighRes(prev => ({ ...prev, [index]: null }));
          setHighResProgress(prev => { const n = {...prev}; delete n[index]; return n; });
          alert("Upscale failed: " + data.failedReason);
        }
      };
      
      eventSource.onerror = () => {
        eventSource.close();
        setProcessingHighRes(prev => ({ ...prev, [index]: null }));
        alert("Connection to server lost. Upscale failed.");
      };

    } catch (error: any) {
      alert(error.message);
      setProcessingHighRes(prev => ({ ...prev, [index]: null }));
    }
  };

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
      <div className="max-w-4xl mx-auto text-center py-12 md:py-20 space-y-4 md:space-y-6">
        <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
          <Wand2 className="w-10 h-10 text-slate-400 dark:text-slate-500" />
        </div>
        <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">Workspace is Empty</h3>
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-md mx-auto">You don't have any ongoing or completed AI processes. Please start by choosing a studio.</p>
        <button 
          onClick={onTryNewInput} 
          className="px-6 py-3 bg-brand-600 text-white rounded-full font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-200 dark:shadow-none mt-4 text-sm"
        >
          Choose Studio
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 pb-12">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2 md:gap-3">
            Generated Photoshoot
            <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
          </h3>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 md:mt-2">Your professional photoshoot is ready. Upgrade to 4K Masterpiece for highest fidelity.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {isGenerating && generatingIndex === null ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12 md:py-20 space-y-4 md:space-y-6">
            <div className="relative">
              <div className="w-20 h-20 md:w-28 md:h-28 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin shadow-lg shadow-brand-500/20" />
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-sm md:text-lg font-bold text-brand-600 dark:text-brand-400">{Math.round(progress)}%</span>
              </div>
            </div>
            <div className="text-center space-y-2 md:space-y-4 w-full max-w-md">
              <p className="text-lg md:text-xl font-bold text-slate-800 dark:text-white">Generating Hyper-Realistic Image...</p>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 md:mt-2">Applying highest fidelity studio lighting & rendering details.</p>
            </div>
          </div>
        ) : (
          images.map((img, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex flex-col gap-4"
            >
              <div className={`group relative ${getAspectRatioClass(aspectRatio)} rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-700`}>
                {isGenerating && generatingIndex === idx ? (
                  <div className="absolute inset-0 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-4 z-10">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin shadow-lg shadow-brand-500/20" />
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-xs font-bold text-brand-600 dark:text-brand-400">{Math.round(progress)}%</span>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-brand-600 dark:text-brand-400">Regenerating...</p>
                  </div>
                ) : (
                  <>
                    <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-brand-700 dark:text-brand-400 shadow-lg">
                      {idx === 0 ? "PRIMARY POSE" : `POSE ${idx + 1}`}
                    </div>

                    <AnimatePresence>
                      {processingHighRes[idx] && (
                        <motion.div 
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }} 
                          exit={{ opacity: 0 }} 
                          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center space-y-4 z-20"
                        >
                          <div className="relative">
                            <div className="w-16 h-16 border-4 border-brand-100/30 border-t-brand-400 rounded-full animate-spin shadow-lg shadow-brand-500/20" />
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                              {highResProgress[idx] !== undefined && (
                                <span className="text-xs font-bold text-brand-400">{Math.round(highResProgress[idx])}%</span>
                              )}
                            </div>
                          </div>
                          <p className="text-white font-bold tracking-widest text-sm uppercase">Adding high-resolutions...</p>
                          <p className="text-white/80 text-xs flex items-center gap-1">Processing {processingHighRes[idx]?.toUpperCase()}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>

              {/* Advanced Action Bar */}
              <div className="grid grid-cols-4 gap-2 pt-2">
                <button
                  onClick={() => onTryDifferent(idx)}
                  disabled={!!processingHighRes[idx]}
                  className="flex flex-col items-center justify-center gap-0.5 py-2 px-0.5 rounded-2xl bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 h-[4.5rem]"
                >
                  <RefreshCcw className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 dark:text-slate-400 leading-tight">Try Different</span>
                  <span className="flex items-center justify-center gap-0.5 text-[8px] sm:text-[9px] font-medium text-amber-600 dark:text-amber-400"><Crown className="w-2.5 h-2.5"/> {cost1k}</span>
                </button>

                <button
                  onClick={() => downloadImage(img, idx, false, '1k')}
                  disabled={!!processingHighRes[idx]}
                  className="flex flex-col items-center justify-center gap-0.5 py-2 px-0.5 rounded-2xl bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/40 border border-brand-100 dark:border-brand-800/50 transition-colors disabled:opacity-50 h-[4.5rem]"
                >
                  <Download className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span className="text-[9px] sm:text-[10px] font-bold text-brand-700 dark:text-brand-400 leading-tight whitespace-nowrap overflow-hidden text-ellipsis w-full px-1 text-center">Download 1K</span>
                  <span className="flex items-center justify-center gap-0.5 text-[8px] sm:text-[9px] font-medium text-amber-600 dark:text-amber-400"><Crown className="w-2.5 h-2.5"/> {cost1k}</span>
                </button>

                {highResUrls[idx]?.['2k'] ? (
                  <button
                    onClick={() => downloadImage(highResUrls[idx]['2k']!, idx, true, '2k')}
                    className="flex flex-col items-center justify-center gap-0.5 py-2 px-0.5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800/50 transition-colors h-[4.5rem]"
                  >
                    <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[9px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-400 leading-tight">Save 2K</span>
                    <span className="flex items-center justify-center gap-0.5 text-[8px] sm:text-[9px] font-medium text-emerald-700/60 dark:text-emerald-400/60 opacity-0"><Crown className="w-2.5 h-2.5"/> 0</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleRequestHighRes(idx, '2k')}
                    disabled={!!processingHighRes[idx]}
                    className="flex flex-col items-center justify-center gap-0.5 py-2 px-0.5 rounded-2xl bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-700 dark:hover:to-slate-800 border border-slate-300 dark:border-slate-700 transition-colors disabled:opacity-50 h-[4.5rem]"
                  >
                    <Sparkles className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-800 dark:text-white leading-tight">Req. 2K</span>
                    <span className="flex items-center justify-center gap-0.5 text-[8px] sm:text-[9px] font-medium text-amber-600 dark:text-amber-400"><Crown className="w-2.5 h-2.5"/> {cost2k}</span>
                  </button>
                )}

                {highResUrls[idx]?.['4k'] ? (
                  <button
                    onClick={() => downloadImage(highResUrls[idx]['4k']!, idx, true, '4k')}
                    className="flex flex-col items-center justify-center gap-0.5 py-2 px-0.5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800/50 transition-colors h-[4.5rem]"
                  >
                    <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[9px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-400 leading-tight">Save 4K</span>
                    <span className="flex items-center justify-center gap-0.5 text-[8px] sm:text-[9px] font-medium text-emerald-700/60 dark:text-emerald-400/60 opacity-0"><Crown className="w-2.5 h-2.5"/> 0</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleRequestHighRes(idx, '4k')}
                    disabled={!!processingHighRes[idx]}
                    className="flex flex-col items-center justify-center gap-0.5 py-2 px-0.5 rounded-2xl bg-gradient-to-b from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-900/60 hover:from-amber-200 hover:to-amber-300 border border-amber-300 dark:border-amber-700 transition-colors disabled:opacity-50 h-[4.5rem]"
                  >
                    <Crown className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                    <span className="text-[9px] sm:text-[10px] font-bold text-amber-800 dark:text-amber-200 drop-shadow-sm leading-tight">Req. 4K</span>
                    <span className="flex items-center justify-center gap-0.5 text-[8px] sm:text-[9px] font-medium text-amber-800 dark:text-amber-400 drop-shadow-sm"><Crown className="w-2.5 h-2.5 fill-current"/> {cost4k}</span>
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {!isGenerating && images.length > 0 && (
        <div className="flex flex-col items-center gap-6 pt-8 pb-10">
          <div className="flex flex-row items-center gap-2 sm:gap-4 w-full justify-center px-2">
            <button
              onClick={onAddMorePoses}
              className="flex-1 max-w-[200px] py-3.5 sm:py-4 rounded-full font-bold text-sm sm:text-lg transition-all flex items-center justify-center gap-2 shadow-xl bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-900 dark:hover:bg-slate-600 hover:scale-105"
            >
              <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="whitespace-nowrap">More Poses</span>
            </button>
            <button
              onClick={onTryNewInput}
              className="flex-1 max-w-[200px] py-3.5 sm:py-4 rounded-full font-bold text-sm sm:text-lg transition-all flex items-center justify-center gap-2 shadow-xl bg-brand-600 text-white hover:bg-brand-700 hover:scale-105 shadow-brand-200 dark:shadow-none"
            >
              <Wand2 className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="whitespace-nowrap">New Input</span>
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
