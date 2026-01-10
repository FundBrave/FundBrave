"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { trapFocus } from "@/app/lib/accessibility";

interface ShareCategory {
  label: string;
}

interface ShareCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignUrl?: string;
  campaignTitle?: string;
  url?: string; // alias for campaignUrl
  title?: string; // alias for campaignTitle
  text?: string;
  categories?: ShareCategory[];
  onShare?: (network: string) => void;
}

// Community categories data (fallback when caller does not provide categories)
const defaultCommunityCategories = [
  {
    id: "healthcare",
    name: "Healthcare",
    image: "/images/healthcare-category.png",
    color: "bg-gradient-to-r from-blue-400 to-cyan-400",
  },
  {
    id: "business",
    name: "Business",
    image: "/images/business-category.png",
    color: "bg-gradient-to-r from-blue-500 to-indigo-500",
  },
  {
    id: "education",
    name: "Education",
    image: "/images/education-category.png",
    color: "bg-gradient-to-r from-purple-400 to-pink-400",
  },
  {
    id: "tech",
    name: "Tech",
    image: "/images/tech-category.png",
    color: "bg-gradient-to-r from-cyan-400 to-teal-400",
  },
];

// Social media platforms data
const socialPlatforms = [
  {
    id: "facebook",
    name: "Facebook",
    color: "bg-blue-600",
    icon: (
      <svg
        className="w-5 h-5 text-white"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    id: "twitter",
    name: "Twitter",
    color: "bg-black",
    icon: (
      <svg
        className="w-5 h-5 text-white"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    id: "instagram",
    name: "Instagram",
    color: "bg-gradient-to-r from-purple-500 to-pink-500",
    icon: (
      <svg
        className="w-5 h-5 text-white"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12.017 0C8.396 0 7.929.013 6.71.072 5.493.131 4.73.333 4.058.63c-.68.3-1.267.703-1.849 1.284C1.628 2.496 1.225 3.082.925 3.764.627 4.436.425 5.2.366 6.417.307 7.636.293 8.103.293 11.724s.014 4.088.073 5.307c.059 1.217.261 1.98.558 2.652.3.68.703 1.267 1.284 1.849.581.581 1.168.984 1.849 1.284.672.298 1.435.5 2.652.559 1.219.059 1.686.072 5.307.072s4.088-.013 5.307-.072c1.217-.059 1.98-.261 2.652-.559a4.994 4.994 0 001.849-1.284 4.994 4.994 0 001.284-1.849c.298-.672.5-1.435.559-2.652.059-1.219.072-1.686.072-5.307s-.013-4.088-.072-5.307c-.059-1.217-.261-1.98-.559-2.652a4.994 4.994 0 00-1.284-1.849A4.994 4.994 0 0016.464.63C15.792.333 15.029.131 13.812.072 12.593.013 12.126 0 8.505 0h3.512zm0 2.17c3.534 0 3.952.013 5.347.072 1.29.059 1.99.273 2.457.456.617.24 1.057.526 1.52.989.463.463.75.903.989 1.52.183.467.397 1.167.456 2.457.059 1.395.072 1.813.072 5.347s-.013 3.952-.072 5.347c-.059 1.29-.273 1.99-.456 2.457a4.108 4.108 0 01-.989 1.52c-.463.463-.903.75-1.52.989-.467.183-1.167.397-2.457.456-1.395.059-1.813.072-5.347.072s-3.952-.013-5.347-.072c-1.29-.059-1.99-.273-2.457-.456a4.108 4.108 0 01-1.52-.989 4.108 4.108 0 01-.989-1.52c-.183-.467-.397-1.167-.456-2.457-.059-1.395-.072-1.813-.072-5.347s.013-3.952.072-5.347c.059-1.29.273-1.99.456-2.457.24-.617.526-1.057.989-1.52.463-.463.903-.75 1.52-.989.467-.183 1.167-.397 2.457-.456 1.395-.059 1.813-.072 5.347-.072z" />
        <path d="M12.017 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12.017 16a4 4 0 110-8 4 4 0 010 8z" />
        <circle cx="18.406" cy="5.594" r="1.44" />
      </svg>
    ),
  },
  {
    id: "whatsapp",
    name: "Whatsapp",
    color: "bg-green-500",
    icon: (
      <svg
        className="w-5 h-5 text-white"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.434 3.488" />
      </svg>
    ),
  },
  {
    id: "email",
    name: "Email",
    color: "bg-orange-500",
    icon: (
      <svg
        className="w-5 h-5 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    id: "linkedin",
    name: "Linkedin",
    color: "bg-blue-700",
    icon: (
      <svg
        className="w-5 h-5 text-white"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
];

const ShareCampaignModal: React.FC<ShareCampaignModalProps> = ({
  isOpen,
  onClose,
  campaignUrl = "https://www.fundbrave.com/campaign/supportjohnsfightagains...",
  campaignTitle = "Support Johns fight against cancer",
  url,
  title,
  text,
  categories,
  onShare,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const resolvedCampaignUrl = url ?? campaignUrl;
  const resolvedCampaignTitle = title ?? campaignTitle;

  const customCategories = categories?.map((category, idx) => ({
    id: `custom-${idx}`,
    name: category.label,
    color: "bg-gradient-to-r from-purple-500 to-pink-500",
  }));

  const categoryList = customCategories ?? defaultCommunityCategories;

  // Trap focus when modal is open
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const cleanup = trapFocus(modalRef.current);
      // Focus the close button when modal opens
      const closeButton = modalRef.current.querySelector('button[aria-label="Close modal"]') as HTMLElement;
      closeButton?.focus();

      return cleanup;
    }
  }, [isOpen]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(campaignUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleSocialShare = (platformId: string) => {
    const shareText = `Help me support "${resolvedCampaignTitle}" on FundBrave`;
    const encodedUrl = encodeURIComponent(resolvedCampaignUrl);
    const textEncoded = encodeURIComponent(shareText);

    let shareUrl = "";

    switch (platformId) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${textEncoded}&url=${encodedUrl}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${textEncoded}%20${encodedUrl}`;
        break;
      case "email":
        shareUrl = `mailto:?subject=${encodeURIComponent(
          resolvedCampaignTitle
        )}&body=${textEncoded}%20${encodedUrl}`;
        break;
      default:
        return;
    }

    window.open(shareUrl, "_blank", "width=600,height=400");
    onShare?.(platformId);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-modal-title"
            className="relative w-full max-w-lg bg-background rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-6 h-6 flex items-center justify-center text-foreground hover:text-text-secondary transition-colors"
              aria-label="Close modal"
              title="Close modal"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="space-y-5">
              {/* Community Section */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <h2 id="share-modal-title" className="text-lg font-medium text-foreground leading-6 tracking-[0.48px]">
                    {resolvedCampaignTitle}
                  </h2>
                  <p className="text-sm text-text-secondary leading-5 tracking-[0.3072px]">
                    {text ??
                      "Share this campaign based on the community missions and values"}
                  </p>
                </div>

                <div className="flex gap-4 flex-wrap">
                  {categoryList.map((category) => (
                    <motion.button
                      key={category.id}
                      className="flex flex-col items-center gap-1.5 group"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="relative w-12 h-12">
                        <div
                          className={`absolute inset-0 rounded-full ${category.color} group-hover:scale-110 transition-transform`}
                        />
                      </div>
                      <span className="text-foreground text-sm font-medium leading-5">
                        {category.name}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Social Sharing Section */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-medium text-foreground leading-6 tracking-[0.48px]">
                    Reach more donors by sharing
                  </h2>
                  <p className="text-sm text-text-secondary leading-5">
                    We've written tailored messages and auto-generated posters
                    based on the fundraiser story for you to share
                  </p>
                </div>

                <div className="flex gap-4 flex-wrap">
                  {socialPlatforms.map((platform) => (
                    <motion.button
                      key={platform.id}
                      onClick={() => handleSocialShare(platform.id)}
                      className="flex flex-col items-center gap-1.5 group"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="relative w-12 h-12 rounded-full overflow-hidden">
                        <div
                          className={`absolute inset-0 ${platform.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
                        >
                          {platform.icon}
                        </div>
                      </div>
                      <span className="text-foreground text-sm font-medium leading-5">
                        {platform.name}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Copy Link Section */}
              <div className="border border-border-subtle rounded-xl p-4 flex items-center gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <svg
                    className="w-5 h-5 text-text-secondary flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  <span className="text-text-secondary text-sm leading-5 truncate flex-1">
                    {resolvedCampaignUrl}
                  </span>
                </div>
                <motion.button
                  onClick={handleCopyLink}
                  className="text-primary-400 text-sm font-semibold leading-5 flex-shrink-0 hover:text-primary-500 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {copiedLink ? "Copied!" : "Copy link"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShareCampaignModal;
