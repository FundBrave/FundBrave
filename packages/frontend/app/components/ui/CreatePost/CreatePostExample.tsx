/**
 * Example usage of the refactored CreatePostPopup component
 */

"use client";

import React, { useMemo, useState } from "react";
import CreatePost from "./CreatePost";
import type { PublishData, UserProfile, CampaignOption } from "../types/CreatePost.types";
import ShareCampaignModal from "../ShareCampaignModal";

const ExampleUsage: React.FC = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Example user data
  const currentUser: UserProfile = {
    name: "John Smith",
    avatar: "/api/placeholder/42/42",
    audience: "public",
  };

  // Example campaign data
  const campaignCategories = [
    "Health and Medical",
    "Education",
    "Community",
    "Emergency",
    "Animals",
    "Environment",
    "Technology",
    "Arts and Culture",
  ];

  const userCampaigns: CampaignOption[] = [
    { id: "1", name: "Help Build New School Library", category: "Education" },
    { id: "2", name: "Support Local Animal Shelter", category: "Animals" },
    { id: "3", name: "Community Garden Initiative", category: "Community" },
    { id: "4", name: "Emergency Relief Fund", category: "Emergency" },
  ];

  const handlePublish = async (data: PublishData) => {
    try {
      console.log("Publishing data:", data);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (data.type === "post") {
        console.log("Post published:", data.content);
        // Handle post publication
      } else {
        console.log("Campaign update published:", {
          category: data.category,
          campaign: data.campaign,
          title: data.title,
          update: data.update,
        });
        // Handle campaign update publication
      }

      // Show success message
      alert("Content published successfully!");
    } catch (error) {
      console.error("Failed to publish:", error);
      alert("Failed to publish. Please try again.");
      throw error; // Re-throw to let the component handle the error state
    }
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
  };

  const openPostCreator = () => {
    setIsPopupOpen(true);
  };

  const shareUrl = useMemo(() => {
    if (typeof window !== "undefined") {
      return window.location.origin + "/campaign/demo";
    }
    return "https://fundbrave.com/";
  }, []);

  const shareCategories = [
    { label: "Healthcare" },
    { label: "Business" },
    { label: "Education" },
    { label: "Tech" },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-foreground text-2xl font-bold mb-8">
          CreatePostPopup Component Example
        </h1>

        <button
          onClick={openPostCreator}
          className="bg-purple-600 hover:bg-purple-700 text-foreground font-medium px-6 py-3 rounded-lg transition-colors"
        >
          Create Post
        </button>

        <button
          onClick={() => setIsShareOpen(true)}
          className="ml-4 bg-blue-600 hover:bg-blue-700 text-foreground font-medium px-6 py-3 rounded-lg transition-colors"
        >
          Open Share Modal
        </button>

        <div className="mt-8 text-text-secondary text-sm max-w-md">
          <p>
            Click the button above to open the refactored CreatePostPopup
            component. The component now features improved code organization,
            better type safety, form validation, and enhanced reusability.
          </p>
        </div>
      </div>

      <CreatePost
        isOpen={isPopupOpen}
        onClose={handleClosePopup}
        onPublish={handlePublish}
        user={currentUser}
        campaignCategories={campaignCategories}
        userCampaigns={userCampaigns}
      />

      <ShareCampaignModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        url={shareUrl}
        title="Share to your FundBrave community"
        text="Share this campaign based on the community missions and values"
        categories={shareCategories}
        onShare={(network) => console.log("Shared via:", network)}
      />
    </div>
  );
};

export default ExampleUsage;
