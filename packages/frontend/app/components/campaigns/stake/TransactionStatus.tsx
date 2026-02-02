"use client";

import { CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface TransactionStatusProps {
  status: "idle" | "pending" | "success" | "error";
  message?: string;
  txHash?: string;
  explorerUrl?: string;
}

/**
 * TransactionStatus - Displays transaction status with clear feedback
 * Shows pending, success, and error states with appropriate icons
 */
export default function TransactionStatus({
  status,
  message,
  txHash,
  explorerUrl = "https://sepolia.basescan.org",
}: TransactionStatusProps) {
  if (status === "idle") return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={`p-4 rounded-lg border flex items-start gap-3 ${
          status === "success"
            ? "bg-green-500/10 border-green-500/20"
            : status === "error"
            ? "bg-red-500/10 border-red-500/20"
            : "bg-blue-500/10 border-blue-500/20"
        }`}
      >
        <div className="flex-shrink-0 mt-0.5">
          {status === "pending" && (
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
          )}
          {status === "success" && (
            <CheckCircle className="w-5 h-5 text-green-400" />
          )}
          {status === "error" && (
            <XCircle className="w-5 h-5 text-red-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div
            className={`font-medium text-sm mb-1 ${
              status === "success"
                ? "text-green-400"
                : status === "error"
                ? "text-red-400"
                : "text-blue-400"
            }`}
          >
            {status === "pending" && "Transaction Pending"}
            {status === "success" && "Transaction Successful"}
            {status === "error" && "Transaction Failed"}
          </div>

          {message && (
            <div className="text-xs text-text-secondary mb-2">{message}</div>
          )}

          {txHash && status !== "error" && (
            <a
              href={`${explorerUrl}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View on Block Explorer
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
