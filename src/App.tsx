import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ArrowRight, AlertCircle, RefreshCw, Home as HomeIcon, User, LogOut, ChevronLeft, Download, Wand2, Moon, Sun, Crown, Coins } from "lucide-react";
import StepIndicator from "./components/StepIndicator";
import ImageUploader from "./components/ImageUploader";
import GarmentSelector from "./components/GarmentSelector";
import ConfigPanel from "./components/ConfigPanel";
import ResultGallery from "./components/ResultGallery";
import GarmentStudio from "./components/GarmentStudio";
import Home from "./components/Home";
import Account from "./components/Account";
import HowItWorks from "./components/HowItWorks";
import AdminDashboard from "./components/AdminDashboard";
import Pricing from "./components/Pricing";
import { analyzeGarment, generatePhotoshoot, GenerationConfig } from "./lib/gemini";
import { auth, db, storage } from "./firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { collection, addDoc, serverTimestamp, doc, getDoc, onSnapshot } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { useWakeLock } from "./hooks/useWakeLock";
import { useAntiPiracy } from "./hooks/useAntiPiracy";

const STEPS = ["Upload", "Analyze", "Configure"];

type Page = "home" | "garment-studio" | "design-studio" | "studio" | "workspace" | "how-it-works" | "account" | "admin";

export default function App() {
  const [activePage, setActivePage] = useState<Page>("home");
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Anti-piracy features
  useAntiPiracy();
  
  // Prevent screen sleep while generating
  useWakeLock(isProcessing);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [settings, setSettings] = useState<{ logo?: string, banners?: string[] }>({});
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  
  const generationIdRef = useRef<number>(0);

  // Data State
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [refImages, setRefImages] = useState<string[]>([]);
  const [recommendation, setRecommendation] = useState<{
    garmentType: string;
    gender: string;
    ageGroup: string;
    style: string;
    description: string;
    matchingSuggestions: string;
    features: string[];
    complementaryOptions?: { label: string; description: string }[];
    footwearOptions?: { label: string; description: string }[];
  } | null>(null);
  
  const [config, setConfig] = useState<GenerationConfig>({
    garmentType: "",
    gender: "",
    ageGroup: "",
    style: "",
    description: "",
    matchingSuggestions: "",
    category: "full_set",
    quality: "2K",
    aspectRatio: "3:4",
    backdrop: "Minimalist Botanical Studio",
    poses: ["Front Full Body"],
    userNote: "",
    isMagicRef: false,
    isMagicVariation: false,
    colorVariationType: 'text',
    colorVariationValue: '',
    magicVariationModelAction: 'same',
  });

  const [results, setResults] = useState<string[]>([]);
  const [firstResult, setFirstResult] = useState<string | null>(null);
  const [generatedPoses, setGeneratedPoses] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [credits, setCredits] = useState<number>(0);
  const [showPricing, setShowPricing] = useState(false);
  const [pendingNavPage, setPendingNavPage] = useState<string | null>(null);
  const [homeMode, setHomeMode] = useState<'photography' | 'design' | 'videos'>('photography');

  const handleNavSelect = (page: string) => {
    if (showPricing) {
      setPendingNavPage(page);
    } else {
      setActivePage(page);
    }
  };
  const [lastWorkspacePage, setLastWorkspacePage] = useState<Page>("studio");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const unsubscribe = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
        if (docSnap.exists()) {
          setCredits(docSnap.data().credits || 0);
        } else {
          setCredits(0);
        }
      });
      return () => unsubscribe();
    } else {
      setCredits(0);
    }
  }, [user]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "general");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings(data);
          
          if (data.favicon) {
            const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
            link.type = 'image/png';
            link.rel = 'icon';
            link.href = data.favicon;
            document.getElementsByTagName('head')[0].appendChild(link);
          }

          if (data.pwaIcon) {
            let appleIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
            if (!appleIcon) {
              appleIcon = document.createElement('link');
              appleIcon.rel = 'apple-touch-icon';
              document.head.appendChild(appleIcon);
            }
            appleIcon.href = data.pwaIcon;

            // Generate dynamic manifest
            const manifest = {
              name: "Hyperlook Ai",
              short_name: "Hyperlook",
              description: "Multi-product AI photoshoot studio.",
              id: "/",
              start_url: "/",
              display: "standalone",
              background_color: "#ffffff",
              theme_color: "#db2777",
              icons: [
                {
                  src: data.pwaIcon,
                  sizes: "192x192",
                  type: "image/png",
                  purpose: "any maskable"
                },
                {
                  src: data.pwaIcon,
                  sizes: "512x512",
                  type: "image/png",
                  purpose: "any maskable"
                }
              ]
            };
            const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
            const manifestUrl = URL.createObjectURL(manifestBlob);
            let manifestLink = document.querySelector("link[rel='manifest']") as HTMLLinkElement;
            if (!manifestLink) {
              manifestLink = document.createElement('link');
              manifestLink.rel = 'manifest';
              document.head.appendChild(manifestLink);
            }
            manifestLink.href = manifestUrl;
          }
        }
      } catch (e) {
        console.error("Failed to fetch settings", e);
      } finally {
        // Add a small delay for smooth transition
        setTimeout(() => setIsInitialLoading(false), 1000);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    });
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const playBeep = (startTime: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, startTime);
        osc.frequency.exponentialRampToValueAtTime(1046.50, startTime + 0.1);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.5, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
        osc.start(startTime);
        osc.stop(startTime + 0.3);
      };

      const now = ctx.currentTime;
      playBeep(now);
      playBeep(now + 0.15);
      playBeep(now + 0.3);
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  const showNotification = () => {
    playNotificationSound();
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        const notif = new Notification("Photoshoot Complete! 🎉", {
          body: "Your AI generated images are ready to view and download.",
          icon: settings.pwaIcon || settings.favicon || "/logo.png"
        });
        notif.onclick = () => {
          window.focus();
          setActivePage("workspace");
        };
      } catch (e) {
        console.error("Notification failed", e);
      }
    }
  };

  const handleSelectStudio = (studioId: string) => {
    if (studioId === "garment") {
      setActivePage("garment-studio");
    } else if (studioId === "design_print_studio") {
      // Direct jump for now, we will create DesignStudio or just enter the unified workflow.
      // For Design, the flow goes to the same "studio" step with config for aspect ratio.
      // We can create an intermediate category select, but user didn't ask for it.
      // Let's pass directly to studio setup:
      
      // Wait, if activePage becomes "design-studio" we can redirect to a specific design pipeline,
      // But the standard workflow in App is "upload -> analyze -> configure".
      handleStartStudio("design_print");
    }
  };

  const handleStartStudio = (category: string) => {
    if (isProcessing) {
      if (!window.confirm("An image generation is currently in progress. Starting a new one will cancel the ongoing task. Do you want to proceed?")) {
        return;
      }
    }
    reset();
    setActivePage("studio");
    setConfig(prev => ({ ...prev, garmentType: category }));
  };

  const handleAnalyze = async () => {
    if (!mainImage) return;
    setIsProcessing(true);
    setError(null);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress(p => Math.min(p + 5, 90));
    }, 200);

    try {
      const result = await analyzeGarment(mainImage);
      setRecommendation(result);
      setCurrentStep(1);
    } catch (err: any) {
      setError(err?.message || "Failed to analyze image. Please try again.");
      console.error(err);
    } finally {
      clearInterval(progressInterval);
      setProgress(100);
      setIsProcessing(false);
    }
  };

  const handleConfirmGarment = (type: string, gender: string, age: string, style: string, desc: string, complementaryPart?: { label: string; description: string }, footwear?: { label: string; description: string }) => {
    setConfig({ 
      ...config, 
      garmentType: type, 
      gender, 
      ageGroup: age, 
      style, 
      description: desc,
      matchingSuggestions: recommendation?.matchingSuggestions || "",
      complementaryPart,
      footwear
    });
    setCurrentStep(2);
  };

  // Helper to safely extract base64 from a potentially prefixed string
  const getRawBase64 = (str: string | null): string => {
    if (!str) return "";
    if (typeof str !== 'string') return "";
    if (str.includes(",")) return str.split(",")[1];
    return str;
  };

  const getCostPerImage = (garmentType?: string, quality?: string) => {
    let cost = 1;
    if (garmentType === 'design_print') {
      if (quality === '1K') cost = 1.5;
      else if (quality === '2K') cost = 2.5;
      else if (quality === '4K') cost = 3;
      else cost = 1.5;
    } else {
      if (quality === '1K') cost = 1;
      else if (quality === '2K') cost = 1.5;
      else if (quality === '4K') cost = 2;
      else cost = 1;
    }
    return cost;
  };

  const calculateRequiredCredits = (posesLength: number) => {
    const posesCount = posesLength || 1;
    return posesCount * getCostPerImage(config.garmentType, config.quality);
  };

  const handleGenerate = async () => {
    if (!mainImage || isProcessing) return;

    // Strict Coin Validation (Bypass for admin)
    const isAdmin = user?.email?.toLowerCase() === "goawesomiq@gmail.com";
    const requiredCredits = calculateRequiredCredits(config.poses.length);
    if (!isAdmin && credits < requiredCredits) {
      setError(`Insufficient coins. You need ${requiredCredits} coins for this generation.`);
      setShowPricing(true);
      return;
    }
    
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }

    setIsProcessing(true);
    setResults([]);
    setFirstResult(null);
    setError(null);
    setProgress(0);
    setCurrentStep(3); // Result step
    setActivePage("workspace"); // Immediately move to workspace

    const currentGenId = ++generationIdRef.current;
    
    const progressInterval = setInterval(() => {
      setProgress(p => {
        if (p < 40) return p + 5;
        if (p < 85) return p + 1;
        return p;
      });
    }, 500);

    try {
      const currentConfig = { ...config };
      let currentFirstResult = firstResult;
      const newResults: string[] = [];
      const posesToGenerate = currentConfig.garmentType === 'design_print' && (!currentConfig.poses || currentConfig.poses.length === 0) 
        ? ["Digital Print Pattern"] 
        : currentConfig.poses;

      // Update requiredCredits based on posesToGenerate
      const requiredCreditsForBatch = calculateRequiredCredits(posesToGenerate.length);
      if (!isAdmin && credits < requiredCreditsForBatch) {
        clearInterval(progressInterval);
        setIsProcessing(false);
        setError(`Insufficient coins. You need ${requiredCreditsForBatch} coins for this generation.`);
        setShowPricing(true);
        return;
      }

      if (posesToGenerate.length > 0) {
        if (!currentFirstResult) {
          const firstPose = posesToGenerate[0];
          currentConfig.referenceImages = refImages;
          
          const result = await generatePhotoshoot(currentConfig, getRawBase64(mainImage), firstPose);
          if (currentGenId !== generationIdRef.current) return;
          
          currentFirstResult = result;
          setFirstResult(result);
          newResults.push(result);
          
          const remainingPoses = posesToGenerate.slice(1);
          if (remainingPoses.length > 0) {
            const base64Ref = getRawBase64(currentFirstResult);
            const parallelConfig = {
              ...currentConfig,
              // If we are in Magic Variation mode, we keep that mode active for all poses in the batch.
              // We only force isMagicRef if it's NOT a Magic Variation different-model run.
              isMagicRef: currentConfig.isMagicVariation && currentConfig.magicVariationModelAction === 'different' ? false : true,
              referenceImages: [getRawBase64(mainImage), ...refImages]
            };
            
            const parallelResults = await Promise.all(
              remainingPoses.map((pose, index) => generatePhotoshoot(parallelConfig, base64Ref, `${pose}. DISTINCT VARIATION ${index + 1}.`))
            );
            if (currentGenId !== generationIdRef.current) return;
            newResults.push(...parallelResults);
          }
        } else {
          const base64Ref = getRawBase64(currentFirstResult);
          const parallelConfig = {
            ...currentConfig,
            isMagicRef: currentConfig.isMagicVariation && currentConfig.magicVariationModelAction === 'different' ? false : true,
            referenceImages: [getRawBase64(mainImage), ...refImages]
          };
          
          const parallelResults = await Promise.all(
            posesToGenerate.map((pose, index) => generatePhotoshoot(parallelConfig, base64Ref, `${pose}. DISTINCT VARIATION ${index + 1}.`))
          );
          if (currentGenId !== generationIdRef.current) return;
          newResults.push(...parallelResults);
        }
      }
      
      if (currentGenId !== generationIdRef.current) return;

      const updatedResults = [...newResults, ...results];
      setResults(updatedResults);
      setGeneratedPoses(prev => Array.from(new Set([...prev, ...posesToGenerate])));

      if (user && newResults.length > 0) {
        try {
          const uploadedResults = await Promise.all(newResults.map(async (base64Str, index) => {
            const storageRef = ref(storage, `photoshoots/${user.uid}/${Date.now()}_${index}.jpg`);
            await uploadString(storageRef, base64Str, 'data_url');
            return await getDownloadURL(storageRef);
          }));

          const configToSave = { ...currentConfig };
          delete configToSave.referenceImages;

          await addDoc(collection(db, "photoshoots"), {
            userId: user.uid,
            createdAt: serverTimestamp(),
            config: configToSave,
            results: uploadedResults
          });
        } catch (e) {
          console.error("Failed to save to history", e);
        }
      }

      showNotification();

    } catch (err: any) {
      if (currentGenId !== generationIdRef.current) return;
      setError(err?.message || "Failed to generate photoshoot. Please try again.");
      console.error("Photoshoot execution error:", err);
    } finally {
      if (currentGenId === generationIdRef.current) {
        clearInterval(progressInterval);
        setProgress(100);
        setIsProcessing(false);
      }
    }
  };

  const handleRetry = () => {
    setResults(prev => prev.slice(config.poses.length));
    handleGenerate();
  };

  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);

  const handleAddMorePoses = () => {
    // Clear currently selected poses so the user can pick new ones
    // The previously generated ones will be highlighted via generatedPoses
    setConfig(prev => ({ ...prev, poses: [] }));
    setActivePage("studio");
    setCurrentStep(2);
  };

  const handleTryDifferent = async (index: number) => {
    if (index === -1) {
      setActivePage("studio");
      setCurrentStep(2);
      return;
    }

    const isAdmin = user?.email?.toLowerCase() === "goawesomiq@gmail.com";
    const requiredCredits = calculateRequiredCredits(1); // 1 generation
    if (!isAdmin && credits < requiredCredits) {
      setError(`Insufficient coins. You need ${requiredCredits} coins for this generation.`);
      setShowPricing(true);
      return;
    }

    setIsProcessing(true);
    setGeneratingIndex(index);
    setError(null);
    setProgress(0);

    const currentGenId = ++generationIdRef.current;

    const progressInterval = setInterval(() => {
      setProgress(p => {
        if (p < 40) return p + 5;
        if (p < 85) return p + 1;
        return p;
      });
    }, 500);

    try {
      const poseToRegenerate = config.poses[index];
      const currentConfig = { ...config };
      
      let referenceBase64 = mainImage!;
      
      // If we have a first result, use it as the magic reference to ensure 100% consistency
      if (results[0]) {
        referenceBase64 = results[0].split(",")[1];
        currentConfig.isMagicRef = true;
        // Keep original garment as a reference image to help the model
        currentConfig.referenceImages = [mainImage!, ...refImages];
      } else {
        currentConfig.referenceImages = refImages;
      }

      const newImage = await generatePhotoshoot(currentConfig, referenceBase64, `${poseToRegenerate}. CRITICAL: This must be a DISTINCT VARIATION from previous attempts. Change the arm placement, leg stance, or slight body angle to ensure it is NOT identical to the previous image.`);
      if (currentGenId !== generationIdRef.current) return;
      
      setResults(prev => {
        const newResults = [...prev];
        newResults[index] = newImage;
        return newResults;
      });

      if (index === 0) {
        setFirstResult(newImage);
      }
      
      showNotification();
      
    } catch (err: any) {
      if (currentGenId !== generationIdRef.current) return;
      setError(err?.message || "Failed to regenerate image. Please try again.");
      console.error(err);
    } finally {
      if (currentGenId === generationIdRef.current) {
        clearInterval(progressInterval);
        setProgress(100);
        setIsProcessing(false);
        setGeneratingIndex(null);
      }
    }
  };

  const reset = () => {
    generationIdRef.current++;
    setCurrentStep(0);
    setMainImage(null);
    setRefImages([]);
    setRecommendation(null);
    setResults([]);
    setFirstResult(null);
    setError(null);
    setProgress(0);
    setIsProcessing(false);
    setLastWorkspacePage("studio");
  };

  useEffect(() => {
    setFirstResult(null);
  }, [mainImage]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    // Track the last workspace-related page
    if (activePage === "studio" || activePage === "garment-studio" || activePage === "workspace") {
      setLastWorkspacePage(activePage);
    }
  }, [currentStep, activePage]);

  const renderStudio = () => (
    <div className="space-y-6 md:space-y-12">
      <div id="studio-workflow" className="space-y-6">
        <div className="flex flex-col items-center text-center space-y-2 hidden md:flex">
          <h3 className="text-2xl font-bold text-slate-800">Photoshoot Workflow</h3>
          <p className="text-sm text-slate-500 font-medium">Follow the steps below to create your masterpiece</p>
          <div className="w-12 h-1 bg-brand-200 rounded-full mt-2" />
        </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-700 text-sm"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="font-medium">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
              &times;
            </button>
          </motion.div>
        )}

        {currentStep === 0 && (
          <motion.div
            key="step-0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4 md:space-y-6 relative"
          >
            <div className="relative mb-4">
              <button 
                onClick={() => {
                  if (config.garmentType === 'design_print') {
                    setHomeMode('design');
                    handleNavSelect('home');
                  } else {
                    handleNavSelect('garment-studio');
                  }
                }}
                className="absolute left-0 top-1 w-8 h-8 shrink-0 rounded-full bg-white dark:bg-slate-800 border border-brand-100 dark:border-slate-700 flex items-center justify-center text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-slate-700 transition-colors shadow-sm z-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-center px-10 max-w-xl mx-auto">
                <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-900 leading-tight dark:text-white">
                  Upload Your <span className="gradient-text italic">{config.garmentType === 'design_print' ? 'Design' : 'Garment'}</span>
                </h2>
                <p className="text-sm md:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                  {config.garmentType === 'design_print' ? 'Upload a fabric or garment design to create a beautiful digital print.' : 'Start by uploading a clear, raw image of your product.'}
                </p>
              </div>
            </div>

            <ImageUploader
              mainImage={mainImage}
              refImages={refImages}
              onMainImage={setMainImage}
              onRefImages={setRefImages}
              isMagicRef={config.isMagicRef}
              onMagicRefChange={(val) => setConfig({ ...config, isMagicRef: val })}
              isMagicVariation={config.isMagicVariation}
              onMagicVariationChange={(val) => setConfig({ ...config, isMagicVariation: val })}
              colorVariationType={config.colorVariationType}
              onColorVariationTypeChange={(val) => setConfig({ ...config, colorVariationType: val })}
              colorVariationValue={config.colorVariationValue}
              onColorVariationValueChange={(val) => setConfig({ ...config, colorVariationValue: val })}
              magicVariationModelAction={config.magicVariationModelAction}
              onModelActionChange={(val) => setConfig({ ...config, magicVariationModelAction: val })}
            />

            <div className="flex justify-center flex-col items-center gap-3">
              <button
                disabled={!mainImage || isProcessing}
                onClick={() => {
                  if (config.isMagicRef || config.isMagicVariation) {
                    setCurrentStep(2);
                  } else {
                    handleAnalyze();
                  }
                }}
                className={`px-8 py-3 md:px-10 md:py-3.5 rounded-full font-bold text-sm md:text-base transition-all flex items-center gap-2 md:gap-3 shadow-xl ${
                  mainImage && !isProcessing
                    ? "bg-brand-600 text-white hover:bg-brand-700 hover:scale-105 shadow-brand-200 dark:shadow-none"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                }`}
              >
                  <>
                    {config.isMagicRef || config.isMagicVariation 
                      ? (config.isMagicRef ? "Configure Magic Reference" : "Configure Magic Variation") 
                      : "Analyze Garment"}
                    <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
                  </>
              </button>
            </div>
          </motion.div>
        )}

        {currentStep === 1 && recommendation && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <GarmentSelector
              recommendation={recommendation as any}
              userNote={config.userNote || ""}
              onUserNote={(note) => setConfig({ ...config, userNote: note })}
              onConfirm={handleConfirmGarment}
              onBack={() => setCurrentStep(0)}
            />
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <ConfigPanel
              config={config}
              onChange={(key, val) => setConfig({ ...config, [key]: val })}
              onGenerate={handleGenerate}
              onBack={() => setCurrentStep(1)}
              isLocked={config.isMagicRef || config.isMagicVariation || !!firstResult}
              generatedPoses={generatedPoses}
            />
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );

  if (isInitialLoading) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-slate-900 z-[100] flex flex-col items-center justify-center gap-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="w-24 h-24 flex items-center justify-center"
        >
          <img 
            src={settings.headerLogo || settings.logo || "/logo.png"} 
            onError={(e) => e.currentTarget.src = '/logo.png'} 
            alt="Hyperlook AI Logo" 
            className="w-full h-full object-contain drop-shadow-xl" 
          />
        </motion.div>
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Hyperlook<span className="text-brand-600"> Ai</span></h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Initializing Studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col dark:bg-slate-900 transition-colors duration-300">
      {/* Desktop Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-brand-50 dark:border-slate-800 py-4 sticky top-0 z-50 hidden md:block">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavSelect("home")}>
            <motion.div 
              initial={{ rotate: -180, scale: 0.5, opacity: 0 }}
              animate={isProcessing ? { rotate: 360, scale: 1, opacity: 1 } : { rotate: 0, scale: 1, opacity: 1 }}
              whileHover={!isProcessing ? { rotate: 180, scale: 1.1 } : undefined}
              transition={isProcessing ? { repeat: Infinity, duration: 2, ease: "linear" } : { type: "spring", stiffness: 260, damping: 20, duration: 1.5 }}
              className="w-10 h-10 flex items-center justify-center"
            >
              <img src={settings.headerLogo || settings.logo || "/logo.png"} onError={(e) => e.currentTarget.src = '/logo.png'} alt="Hyperlook AI Logo" className="w-full h-full object-contain drop-shadow-md" />
            </motion.div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Hyperlook<span className="text-brand-600"> Ai</span>
            </h1>
          </div>
          
          <nav className="flex items-center gap-8">
            <button 
              onClick={() => handleNavSelect("home")}
              className={`font-bold text-sm transition-colors ${activePage === "home" ? "text-brand-600" : "text-slate-500 dark:text-slate-400 hover:text-brand-400 dark:hover:text-brand-400"}`}
            >
              Home
            </button>
            <button 
              onClick={() => handleNavSelect("workspace")}
              className={`font-bold text-sm transition-colors relative ${activePage === "workspace" ? "text-brand-600" : "text-slate-500 dark:text-slate-400 hover:text-brand-400 dark:hover:text-brand-400"}`}
            >
              Workspace
              {isProcessing && (
                <span className="absolute -top-1 -right-3 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                </span>
              )}
            </button>
            <button 
              onClick={() => handleNavSelect("how-it-works")}
              className={`font-bold text-sm transition-colors ${activePage === "how-it-works" ? "text-brand-600" : "text-slate-500 dark:text-slate-400 hover:text-brand-400 dark:hover:text-brand-400"}`}
            >
              How it Works
            </button>
          </nav>

          <div className="flex items-center gap-2">
            {user && (
              <button 
                onClick={() => setShowPricing(true)}
                className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full font-bold text-xs border border-amber-200 dark:border-amber-800/50 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors mr-1"
              >
                <Coins className="w-3.5 h-3.5" />
                {user.email?.toLowerCase() === "goawesomiq@gmail.com" ? "Unlimited ∞" : credits}
              </button>
            )}
            <button 
              onClick={toggleDarkMode}
              className="w-9 h-9 rounded-full bg-brand-50 dark:bg-slate-800 border border-brand-100 dark:border-slate-700 flex items-center justify-center text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-slate-700 transition-colors"
            >
              {isDarkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
            <button 
              onClick={() => handleNavSelect("account")}
              className="w-9 h-9 rounded-full bg-brand-50 dark:bg-slate-800 border border-brand-100 dark:border-slate-700 flex items-center justify-center text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <User className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-brand-50 dark:border-slate-800 py-4 sticky top-0 z-50 md:hidden px-6 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNavSelect("home")}>
          <motion.div 
            initial={{ rotate: -180, scale: 0.5, opacity: 0 }}
            animate={isProcessing ? { rotate: 360, scale: 1, opacity: 1 } : { rotate: 0, scale: 1, opacity: 1 }}
            whileHover={!isProcessing ? { rotate: 180, scale: 1.1 } : undefined}
            transition={isProcessing ? { repeat: Infinity, duration: 2, ease: "linear" } : { type: "spring", stiffness: 260, damping: 20, duration: 1.5 }}
            className="w-8 h-8 flex items-center justify-center"
          >
            <img src={settings.headerLogo || settings.logo || "/logo.png"} onError={(e) => e.currentTarget.src = '/logo.png'} alt="Hyperlook AI Logo" className="w-full h-full object-contain drop-shadow-md" />
          </motion.div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Hyperlook<span className="text-brand-600"> Ai</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <button 
              onClick={() => setShowPricing(true)}
              className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full font-bold text-[10px] border border-amber-200 dark:border-amber-800/50 mr-1"
            >
              <Coins className="w-3 h-3" />
              {user.email?.toLowerCase() === "goawesomiq@gmail.com" ? "∞" : credits}
            </button>
          )}
          <button onClick={toggleDarkMode} className="w-8 h-8 rounded-full bg-brand-50 dark:bg-slate-800 flex items-center justify-center text-brand-600 dark:text-brand-400">
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-6 py-2 md:py-6 pb-24">
        <AnimatePresence mode="wait">
          {activePage === "home" && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Home onSelectStudio={handleSelectStudio} banners={settings.banners} logo={settings.headerLogo || settings.logo} initialMode={homeMode} />
            </motion.div>
          )}
          {activePage === "garment-studio" && (
            <motion.div key="garment-studio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-4 mb-8">
                <button 
                  onClick={() => handleNavSelect("home")}
                  className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-brand-100 dark:border-slate-700 flex items-center justify-center text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Garment Studio</h2>
              </div>
              <GarmentStudio onStart={handleStartStudio} />
            </motion.div>
          )}
          {activePage === "studio" && (
            <motion.div key="studio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {renderStudio()}
            </motion.div>
          )}
          {activePage === "workspace" && (
            <motion.div key="workspace" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ResultGallery
                images={results}
                onRetry={handleRetry}
                onTryDifferent={handleTryDifferent}
                onTryNewInput={() => { reset(); setActivePage("home"); }}
                onAddMorePoses={handleAddMorePoses}
                isGenerating={isProcessing}
                progress={progress}
                aspectRatio={config.aspectRatio}
                generatingIndex={generatingIndex}
                logo={settings.headerLogo || settings.logo}
                isDesign={config.garmentType === 'design_print'}
              />
            </motion.div>
          )}
          {activePage === "how-it-works" && (
            <motion.div key="how-it-works" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <HowItWorks />
            </motion.div>
          )}
          {activePage === "account" && (
            <motion.div key="account" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Account onNavigate={setActivePage} onShowPricing={() => setShowPricing(true)} credits={credits} />
            </motion.div>
          )}
          {activePage === "admin" && (
            <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AdminDashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Nav Bar */}
      <nav className={`fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-t border-brand-100 dark:border-slate-800 z-[100] md:hidden shadow-[0_-8px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.2)] flex flex-col transition-all duration-300 ${ (activePage === "studio" || activePage === "workspace") && (currentStep > 0 && !isProcessing && results.length === 0) ? "pt-2" : ""}`}>
        <AnimatePresence>
          {(activePage === "studio" || activePage === "workspace") && currentStep > 0 && !isProcessing && results.length === 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="w-full overflow-hidden"
            >
              <div className="px-2 pt-2 pb-4">
                <StepIndicator 
                  currentStep={currentStep} 
                  steps={STEPS} 
                  progress={progress} 
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="h-16 flex items-center justify-around px-6 pb-safe">
          <button 
            onClick={() => handleNavSelect("home")}
            className={`flex flex-col items-center gap-1 transition-colors ${activePage === "home" ? "text-brand-600" : "text-slate-400"}`}
          >
            <HomeIcon className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
          </button>
          <button 
            onClick={() => handleNavSelect(lastWorkspacePage)}
            className={`flex flex-col items-center gap-1 transition-colors relative ${ (activePage === "workspace" || activePage === "studio" || activePage === "garment-studio") ? "text-brand-600" : "text-slate-400"}`}
          >
            <Wand2 className="w-6 h-6" />
            {isProcessing && (
              <span className="absolute top-0 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
              </span>
            )}
            <span className="text-[10px] font-bold uppercase tracking-wider">Workspace</span>
          </button>
          <button 
            onClick={() => handleNavSelect("how-it-works")}
            className={`flex flex-col items-center gap-1 transition-colors ${activePage === "how-it-works" ? "text-brand-600" : "text-slate-400"}`}
          >
            <Sparkles className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">How it Works</span>
          </button>
          <button 
            onClick={() => handleNavSelect("account")}
            className={`flex flex-col items-center gap-1 transition-colors ${activePage === "account" ? "text-brand-600" : "text-slate-400"}`}
          >
            <User className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Account</span>
          </button>
        </div>
      </nav>

      {/* Floating Step Indicator - Desktop Only */}
      <AnimatePresence>
        {(activePage === "studio" || activePage === "workspace") && currentStep > 0 && !isProcessing && results.length === 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-0 right-0 z-40 pointer-events-none px-4 hidden md:block"
          >
            <div className="max-w-md mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-[0_0_40px_rgba(0,0,0,0.1)] dark:shadow-[0_0_40px_rgba(0,0,0,0.3)] rounded-[2rem] border border-slate-100 dark:border-slate-800 pt-2 px-4 pb-4 pointer-events-auto">
              <StepIndicator 
                currentStep={currentStep} 
                steps={STEPS} 
                progress={progress} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-brand-50 dark:border-slate-800 py-12 hidden md:block">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <motion.div 
              initial={{ rotate: -180, scale: 0.5, opacity: 0 }}
              whileInView={{ rotate: 0, scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              whileHover={{ rotate: 180, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, duration: 1.5 }}
              className="w-8 h-8 flex items-center justify-center"
            >
              <img src={settings.headerLogo || settings.logo || "/logo.png"} alt="Hyperlook AI Logo" className="w-full h-full object-contain drop-shadow-md" />
            </motion.div>
            <span className="font-bold text-slate-900 dark:text-white">Hyperlook Ai Studio</span>
          </div>
          <div className="flex items-center gap-8 text-sm font-medium text-slate-400 dark:text-slate-500">
            <a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Help</a>
          </div>
          <p className="text-slate-300 dark:text-slate-600 text-sm">© 2026 Hyperlook Ai. All rights reserved.</p>
        </div>
      </footer>

      <AnimatePresence>
        {showPricing && (
          <Pricing 
            onClose={() => setShowPricing(false)} 
            onLoginRequest={() => {
              setShowPricing(false);
              setActivePage("account");
            }} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pendingNavPage && (
          <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-700 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-500 to-accent-500"></div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Choose Your Plan Before Moving</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">Are you sure you want to leave without choosing a plan?</p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setPendingNavPage(null)} 
                  className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                >
                  Choose Plan
                </button>
                <button 
                  onClick={() => {
                    setShowPricing(false);
                    setActivePage(pendingNavPage);
                    setPendingNavPage(null);
                  }} 
                  className="w-full py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all border border-slate-200 dark:border-slate-600 active:scale-[0.98]"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


