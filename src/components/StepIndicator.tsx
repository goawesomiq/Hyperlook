import { motion } from "motion/react";
import { Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
  steps: string[];
}

export default function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center w-full max-w-3xl mx-auto mb-12 px-4">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center flex-1 last:flex-none">
          <div className="relative flex flex-col items-center">
            <motion.div
              initial={false}
              animate={{
                backgroundColor: index <= currentStep ? "var(--color-brand-600)" : "var(--color-slate-200)",
                scale: index === currentStep ? 1.1 : 1,
              }}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold shadow-lg z-10`}
            >
              {index < currentStep ? (
                <Check className="w-6 h-6" />
              ) : (
                <span>{index + 1}</span>
              )}
            </motion.div>
            <span
              className={`absolute -bottom-7 text-xs font-medium whitespace-nowrap transition-colors duration-300 ${
                index <= currentStep ? "text-brand-700 dark:text-brand-400" : "text-slate-400 dark:text-slate-500"
              }`}
            >
              {step}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className="flex-1 h-0.5 mx-2 bg-slate-200 dark:bg-slate-700 overflow-hidden">
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
  );
}
