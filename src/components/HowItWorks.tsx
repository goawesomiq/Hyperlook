import React from "react";
import { motion } from "motion/react";
import { Upload, Cpu, Settings, Image as ImageIcon, Sparkles } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      icon: <Upload className="w-6 h-6 text-brand-600 dark:text-brand-400" />,
      title: "1. Upload Garment",
      description: "Start by uploading a clear, flat-lay or mannequin image of your clothing item. The better the lighting, the better the results."
    },
    {
      icon: <Cpu className="w-6 h-6 text-brand-600 dark:text-brand-400" />,
      title: "2. AI Analysis",
      description: "Our advanced AI instantly analyzes the garment's fabric, style, category, and details to understand how it should drape and fit."
    },
    {
      icon: <Settings className="w-6 h-6 text-brand-600 dark:text-brand-400" />,
      title: "3. Configure Photoshoot",
      description: "Select your preferred model type, poses, backdrop, and aspect ratio. You can even add custom notes for specific styling."
    },
    {
      icon: <ImageIcon className="w-6 h-6 text-brand-600 dark:text-brand-400" />,
      title: "4. Generate & Download",
      description: "Watch as the AI generates hyper-realistic photoshoot images. Once done, you can download them directly from your Workspace."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="text-center space-y-4 mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">How <span className="text-brand-600">Hyperlook Ai</span> Works</h2>
        <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          Transform your raw product images into professional, studio-quality photoshoots in four simple steps.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:gap-6">
        {steps.map((step, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 bg-brand-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-3 md:mb-4 shrink-0">
              {step.icon}
            </div>
            <h3 className="text-sm md:text-lg font-bold text-slate-800 dark:text-white mb-2">{step.title}</h3>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed flex-grow">{step.description}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 bg-gradient-to-br from-brand-600 to-brand-800 rounded-3xl p-6 md:p-8 text-center text-white shadow-xl">
        <Sparkles className="w-10 h-10 mx-auto mb-4 text-brand-200" />
        <h3 className="text-xl md:text-2xl font-bold mb-3">Ready to create your first photoshoot?</h3>
        <p className="text-sm md:text-base text-brand-100 max-w-xl mx-auto">
          Experience the future of fashion photography. No studio, no models, no cameras required.
        </p>
      </div>
    </div>
  );
}
