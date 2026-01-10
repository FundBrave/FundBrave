"use client";

import React, { useEffect, useRef } from "react";
import { X } from "@/app/components/ui/icons";
import { RemoveScroll } from "react-remove-scroll";
import {
  AppleIcon,
  GoogleIcon,
  OutlookIcon,
  OutlookWebIcon,
  YahooIcon,
} from "./providerIcons";
import {
  createCampaignReminderEvent,
  openCalendar,
} from "@/lib/utils/calendar";
import { trapFocus } from "@/app/lib/accessibility";

interface AddReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Campaign title for the reminder */
  campaignTitle: string;
  /** Campaign end date - reminder will be set for 1 day before */
  campaignEndDate: Date;
  /** Campaign URL to include in the reminder */
  campaignUrl?: string;
  /** Optional campaign description for the reminder body */
  campaignDescription?: string;
  /** Callback when a reminder is successfully set */
  onReminderSet?: (provider: string) => void;
}

/**
 * Calendar provider configuration using reusable SVG components
 * Each provider includes an ID, display name, and corresponding icon component
 */
const calendarProviders = [
  {
    id: "apple",
    name: "Apple Calendar",
    icon: AppleIcon,
  },
  {
    id: "google",
    name: "Google Calendar",
    icon: GoogleIcon,
  },
  {
    id: "outlook",
    name: "Outlook",
    icon: OutlookIcon,
  },
  {
    id: "outlook-web",
    name: "Outlook Web",
    icon: OutlookWebIcon,
  },
  {
    id: "yahoo",
    name: "Yahoo Calendar",
    icon: YahooIcon,
  },
];

/**
 * AddReminderModal - Modal for adding campaign reminders to calendar
 * Generates calendar events for different providers (Google, Outlook, Apple, Yahoo)
 */
export default function AddReminderModal({
  isOpen,
  onClose,
  campaignTitle,
  campaignEndDate,
  campaignUrl,
  campaignDescription,
  onReminderSet,
}: AddReminderModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Trap focus when modal is open
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const cleanup = trapFocus(modalRef.current);
      // Focus the close button when modal opens
      const closeButton = modalRef.current.querySelector('button[aria-label="Close"]') as HTMLElement;
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

  if (!isOpen) return null;

  const handleProviderSelect = (providerId: string) => {
    // Create the calendar event
    const event = createCampaignReminderEvent(
      campaignTitle,
      campaignEndDate,
      campaignUrl,
      campaignDescription
    );

    // Open the calendar with the event
    openCalendar(providerId, event);

    // Notify parent and close modal
    onReminderSet?.(providerId);
    onClose();
  };

  // Format the reminder date for display
  const reminderDate = new Date(campaignEndDate);
  reminderDate.setDate(reminderDate.getDate() - 1);
  const formattedReminderDate = reminderDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <RemoveScroll>
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="reminder-modal-title"
          className="bg-brand-dark rounded-[20px] w-full max-w-[717px] min-h-[auto] sm:min-h-[540px] relative overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Close"
            type="button"
            className="absolute top-4 right-4 sm:top-[37px] sm:right-[51px] w-6 h-6 text-foreground hover:text-text-secondary transition-colors z-10"
          >
            <X size={24} />
          </button>

          {/* Content */}
          <div className="flex flex-col items-center justify-center min-h-[auto] sm:min-h-[540px] px-4 sm:px-8 py-8 sm:py-12">
            <div className="w-full sm:w-[404px] max-w-full">
              {/* Header */}
              <div className="text-center mb-6 sm:mb-7">
                <h2
                  id="reminder-modal-title"
                  className="font-['Poppins'] font-medium text-[18px] sm:text-[20px] text-foreground leading-[28px] sm:leading-[30px] tracking-[0.48px] mb-1.5"
                >
                  Add a reminder
                </h2>
                <p className="font-['Roboto'] font-normal text-[14px] sm:text-[16px] text-foreground/80 leading-[22px] sm:leading-[24px] tracking-[0.3072px] max-w-[352px] mx-auto">
                  We&apos;ll remind you on{" "}
                  <span className="text-primary-400 font-medium">
                    {formattedReminderDate}
                  </span>
                  , one day before the campaign ends.
                </p>
              </div>

              {/* Calendar Provider Options */}
              <div className="space-y-4 sm:space-y-5">
                {calendarProviders.map((provider) => {
                  const IconComponent = provider.icon;
                  return (
                    <button
                      key={provider.id}
                      onClick={() => handleProviderSelect(provider.id)}
                      className="w-full h-12 sm:h-14 px-3 sm:px-[9px] py-3 sm:py-[18px] border border-border-subtle rounded-[16px] sm:rounded-[20px] flex items-center gap-2 sm:gap-[9px] hover:bg-surface-overlay hover:border-primary-500/50 transition-colors group"
                    >
                      <div className="w-[28px] sm:w-[34px] h-[28px] sm:h-[34px] flex items-center justify-center text-foreground">
                        <IconComponent />
                      </div>
                      <span className="font-['Roboto'] font-semibold text-[16px] sm:text-[18px] text-foreground leading-[22px] sm:leading-[24px] tracking-[0.3456px] flex-1 text-center">
                        {provider.name}
                      </span>
                      {/* Spacer div to center the text */}
                      <div className="w-[28px] sm:w-[34px]"></div>
                    </button>
                  );
                })}
              </div>

              {/* Campaign Info */}
              <div className="mt-6 pt-6 border-t border-border-subtle">
                <p className="text-text-secondary text-sm text-center truncate">
                  Campaign: {campaignTitle}
                </p>
              </div>
            </div>
          </div>
        </div>
      </RemoveScroll>
    </div>
  );
}
