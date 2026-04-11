'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ServerErrorProps {
  error: string;
}

export default function ServerError({ error }: ServerErrorProps) {
  return (
    <AnimatePresence>
      {error && (
        <motion.div
          className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3"
          initial={{ opacity: 0, scale: 0.8, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-sm text-destructive">{error}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
