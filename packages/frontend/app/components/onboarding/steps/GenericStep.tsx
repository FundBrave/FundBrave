"use client";

import React from 'react';
import { motion } from 'motion/react';
import { StepComponentProps } from '@/lib/onboarding-steps';

interface GenericStepProps extends StepComponentProps {
  title: string;
  fields?: number;
}

const GenericStep: React.FC<GenericStepProps> = ({ 
  title, 
  onNext, 
  onBack,
  fields = 2 
}) => (
  <motion.div 
    className="w-full max-w-md px-4"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
  >
    

    {/* Navigation buttons */}
    <div className="flex gap-4">
      {onBack && (
        <motion.button 
          onClick={onBack} 
          className="py-3 px-6 bg-secondary rounded-lg text-white font-semibold hover:bg-secondary/80 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Back
        </motion.button>
      )}
      {onNext && (
        <motion.button 
          onClick={onNext} 
          className="flex-1 py-3 rounded-lg text-white font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all"
          style={{
            background: "linear-gradient(97deg, var(--primary-500) 0%, var(--soft-purple-500) 100%)"
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Next
        </motion.button>
      )}
    </div>
  </motion.div>
);

export default GenericStep;
