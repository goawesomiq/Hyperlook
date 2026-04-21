import { motion } from "motion/react";
import { Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
  steps: string[];
  progress?: number;
}

export default function StepIndicator({ currentStep, steps, progress }: StepIndicatorProps) {
  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto py-4">
      <div className="flex items-center justify-center w-full px-4 mb-4">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="relative flex items-center justify-center">
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: index <= currentStep ? "var(--color-brand-600)" : "var(--color-slate-200)",
                  scale: index === currentStep ? 1 : 0.9,
                }}
                className={`w-4 h-4 md:w-6 md:h-6 rounded-full flex items-center justify-center text-white text-[8px] md:text-sm font-semibold shadow-sm z-10 transition-colors bg-brand-600`}
              >
                {index < currentStep ? (
                  <Check className="w-2.5 h-2.5 md:w-4 md:h-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </motion.div>
              <span
                className={`absolute -bottom-4 text-[8px] md:text-xs font-semibold whitespace-nowrap transition-colors duration-300 ${
                  index <= currentStep ? "text-brand-700 dark:text-brand-400" : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-1 md:mx-2 bg-slate-200 dark:bg-slate-700 overflow-hidden rounded-full">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: index < currentStep ? "100%" : "0%" }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-brand-600"
                />
              </div>
            )}
          </div>
        ))}
      </div>
      {progress !== undefined && progress > 0 && progress < 100 && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10px] font-bold text-brand-600 flex items-center gap-1.5 mt-2"
        >
          <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse" />
          <span>{Math.round(progress)}% Progress</span>
        </motion.div>
      )}
    </div>
  );
}
