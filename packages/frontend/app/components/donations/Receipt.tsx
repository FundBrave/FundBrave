"use client";

import { useMemo } from "react";
import { Button } from "@/app/components/ui/button";
import { Download, Printer } from "lucide-react";
import { formatEther } from "viem";

export interface DonationReceiptData {
  // Transaction details
  transactionHash: string;
  blockNumber?: number;
  timestamp: string;

  // Donation details
  donorAddress: string;
  donorName?: string;
  donorEmail?: string;
  amount: string; // In wei or smallest unit
  tokenSymbol: string;
  usdValue?: number;

  // Campaign details
  campaignId: string;
  campaignName: string;
  campaignOwner: string;
  beneficiaryAddress: string;

  // Donation model
  donationType: "direct" | "wealth-building" | "stake";
  beneficiaryShare?: number; // For wealth-building: 78%
  platformShare?: number; // For wealth-building: 20%
  creatorShare?: number; // For wealth-building: 2%

  // Receipt metadata
  receiptId: string;
  generatedAt: string;
  taxDeductible?: boolean;
}

export interface ReceiptProps {
  data: DonationReceiptData;
  onClose?: () => void;
}

/**
 * Donation Receipt Component
 *
 * Generates a printable/downloadable receipt for donations.
 * Can be printed as PDF using browser's print-to-PDF functionality.
 */
export function Receipt({ data, onClose }: ReceiptProps) {
  const formattedAmount = useMemo(() => {
    try {
      // Convert from wei to ether for display
      return formatEther(BigInt(data.amount));
    } catch {
      return "0";
    }
  }, [data.amount]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Trigger browser print dialog with save as PDF
    window.print();
  };

  const donationDate = new Date(data.timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const donationTime = new Date(data.timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm print:bg-white print:static print:backdrop-blur-none">
      <div className="min-h-screen flex items-center justify-center p-4 print:p-0">
        {/* Receipt Container */}
        <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none print:max-w-full">
          {/* Header - Hidden in print */}
          <div className="bg-gradient-to-r from-primary to-purple-500 p-6 print:hidden">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Donation Receipt</h2>
              <div className="flex gap-2">
                <Button
                  onClick={handlePrint}
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button
                  onClick={handleDownload}
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                {onClose && (
                  <Button
                    onClick={onClose}
                    variant="secondary"
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    Close
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Receipt Content - Print-friendly */}
          <div className="p-8 print:p-12 print:text-black">
            {/* Logo and Title - Print Header */}
            <div className="mb-8 print:mb-12">
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">FundBrave</h1>
                <p className="text-gray-600">Blockchain-Powered Fundraising Platform</p>
                <p className="text-sm text-gray-500 mt-2">
                  Tax Receipt ID: {data.receiptId}
                </p>
              </div>
              <div className="border-t-2 border-primary pt-4">
                <h2 className="text-xl font-semibold text-gray-900">Official Donation Receipt</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Generated on {new Date(data.generatedAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Donor Information */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                Donor Information
              </h3>
              <div className="space-y-2 text-sm">
                {data.donorName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium text-gray-900">{data.donorName}</span>
                  </div>
                )}
                {data.donorEmail && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium text-gray-900">{data.donorEmail}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Wallet Address:</span>
                  <span className="font-mono text-xs text-gray-900 break-all">
                    {data.donorAddress}
                  </span>
                </div>
              </div>
            </div>

            {/* Donation Details */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                Donation Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Campaign:</span>
                  <span className="font-medium text-gray-900">{data.campaignName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-bold text-lg text-primary">
                    {formattedAmount} {data.tokenSymbol}
                  </span>
                </div>
                {data.usdValue && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">USD Value:</span>
                    <span className="font-medium text-gray-900">
                      ${data.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium text-gray-900">{donationDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium text-gray-900">{donationTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Donation Type:</span>
                  <span className="font-medium text-gray-900 capitalize">
                    {data.donationType.replace("-", " ")}
                  </span>
                </div>
              </div>

              {/* Wealth-Building Split Details */}
              {data.donationType === "wealth-building" && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg print:bg-gray-100">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    Donation Distribution
                  </h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">To Campaign Beneficiary:</span>
                      <span className="font-medium text-gray-900">
                        {data.beneficiaryShare}% ({(parseFloat(formattedAmount) * (data.beneficiaryShare || 78) / 100).toFixed(4)} {data.tokenSymbol})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">To Platform Fund:</span>
                      <span className="font-medium text-gray-900">
                        {data.platformShare}% ({(parseFloat(formattedAmount) * (data.platformShare || 20) / 100).toFixed(4)} {data.tokenSymbol})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">To Campaign Creator:</span>
                      <span className="font-medium text-gray-900">
                        {data.creatorShare}% ({(parseFloat(formattedAmount) * (data.creatorShare || 2) / 100).toFixed(4)} {data.tokenSymbol})
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Blockchain Details */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                Blockchain Verification
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-start">
                  <span className="text-gray-600">Transaction Hash:</span>
                  <span className="font-mono text-xs text-gray-900 break-all max-w-md text-right">
                    {data.transactionHash}
                  </span>
                </div>
                {data.blockNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Block Number:</span>
                    <span className="font-medium text-gray-900">{data.blockNumber}</span>
                  </div>
                )}
                <div className="flex justify-between items-start">
                  <span className="text-gray-600">Beneficiary Address:</span>
                  <span className="font-mono text-xs text-gray-900 break-all max-w-md text-right">
                    {data.beneficiaryAddress}
                  </span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 border-l-4 border-primary rounded print:bg-blue-100">
                <p className="text-xs text-gray-700">
                  <strong>Verification:</strong> This transaction is permanently recorded on the blockchain
                  and can be independently verified using the transaction hash above on a blockchain explorer.
                </p>
              </div>
            </div>

            {/* Tax Information */}
            {data.taxDeductible && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                  Tax Information
                </h3>
                <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded print:bg-green-100">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Tax Deductible:</strong> This donation may be tax deductible.
                  </p>
                  <p className="text-xs text-gray-600">
                    Please consult with your tax advisor to determine eligibility for deduction.
                    Keep this receipt for your tax records.
                  </p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-12 pt-6 border-t text-center text-xs text-gray-500">
              <p className="mb-2">
                FundBrave - Decentralized Fundraising Platform
              </p>
              <p>
                This is an official receipt generated by the FundBrave platform.
              </p>
              <p className="mt-2">
                For questions or support, visit fundbrave.io/support
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 2cm;
          }

          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:bg-white {
            background-color: white !important;
          }

          .print\\:text-black {
            color: black !important;
          }

          .print\\:static {
            position: static !important;
          }

          .print\\:backdrop-blur-none {
            backdrop-filter: none !important;
          }

          .print\\:shadow-none {
            box-shadow: none !important;
          }

          .print\\:rounded-none {
            border-radius: 0 !important;
          }

          .print\\:max-w-full {
            max-width: 100% !important;
          }

          .print\\:p-0 {
            padding: 0 !important;
          }

          .print\\:p-12 {
            padding: 3rem !important;
          }

          .print\\:mb-12 {
            margin-bottom: 3rem !important;
          }

          .print\\:bg-gray-100 {
            background-color: #f3f4f6 !important;
          }

          .print\\:bg-blue-100 {
            background-color: #dbeafe !important;
          }

          .print\\:bg-green-100 {
            background-color: #d1fae5 !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Receipt;
