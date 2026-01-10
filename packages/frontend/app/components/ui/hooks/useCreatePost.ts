/**
 * Custom hooks for CreatePost component
 */

import { useState, useCallback, useMemo } from "react";
import type {
  PostType,
  PublishData,
  CampaignOption,
  PostFormErrors,
  CampaignUpdateFormErrors,
  AudienceType,
} from "../types/CreatePost.types";
import {
  validatePostForm,
  validateCampaignUpdateForm,
} from "../../../../lib/validation.utils";

export interface TouchedFields {
  postContent: boolean;
  category: boolean;
  campaign: boolean;
  title: boolean;
  update: boolean;
}

export const useCreatePost = (
  onPublish: (data: PublishData) => void,
  onClose: () => void,
  userCampaigns: CampaignOption[] = []
) => {
  const [activeTab, setActiveTab] = useState<PostType>("post");
  const [isPublishing, setIsPublishing] = useState(false);

  // Audience state
  const [audience, setAudience] = useState<AudienceType>("everyone");

  // Post form state
  const [postContent, setPostContent] = useState("");

  // Campaign update form state
  const [campaignCategory, setCampaignCategory] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [campaignTitle, setCampaignTitle] = useState("");
  const [campaignUpdate, setCampaignUpdate] = useState("");

  // Touched state for each field
  const [touched, setTouched] = useState<TouchedFields>({
    postContent: false,
    category: false,
    campaign: false,
    title: false,
    update: false,
  });

  // Filter campaigns based on selected category
  const filteredCampaigns = useMemo(() => {
    if (!campaignCategory) {
      return userCampaigns;
    }
    return userCampaigns.filter(
      (campaign) => campaign.category === campaignCategory
    );
  }, [campaignCategory, userCampaigns]);

  // Handle category change - reset campaign if it doesn't match the new category
  const handleCategoryChange = useCallback(
    (newCategory: string) => {
      setCampaignCategory(newCategory);
      setTouched((prev) => ({ ...prev, category: true }));

      // Check if current selected campaign belongs to the new category
      if (selectedCampaign) {
        const currentCampaign = userCampaigns.find(
          (c) => c.id === selectedCampaign
        );
        if (currentCampaign && currentCampaign.category !== newCategory) {
          setSelectedCampaign("");
        }
      }
    },
    [selectedCampaign, userCampaigns]
  );

  // Handle campaign change with touched state
  const handleCampaignChange = useCallback((campaignId: string) => {
    setSelectedCampaign(campaignId);
    setTouched((prev) => ({ ...prev, campaign: true }));
  }, []);

  // Handle post content change with touched state
  const handlePostContentChange = useCallback((content: string) => {
    setPostContent(content);
    setTouched((prev) => ({ ...prev, postContent: true }));
  }, []);

  // Handle title change with touched state
  const handleTitleChange = useCallback((title: string) => {
    setCampaignTitle(title);
    setTouched((prev) => ({ ...prev, title: true }));
  }, []);

  // Handle update change with touched state
  const handleUpdateChange = useCallback((update: string) => {
    setCampaignUpdate(update);
    setTouched((prev) => ({ ...prev, update: true }));
  }, []);

  // Handle audience change
  const handleAudienceChange = useCallback((newAudience: AudienceType) => {
    setAudience(newAudience);
  }, []);

  // Compute errors only for touched fields
  const postFormErrors = useMemo((): PostFormErrors => {
    const allErrors = validatePostForm(postContent);
    return {
      content: touched.postContent ? allErrors.content : undefined,
    };
  }, [postContent, touched.postContent]);

  const campaignUpdateFormErrors = useMemo((): CampaignUpdateFormErrors => {
    const allErrors = validateCampaignUpdateForm({
      category: campaignCategory,
      campaign: selectedCampaign,
      title: campaignTitle,
      update: campaignUpdate,
    });

    return {
      category: touched.category ? allErrors.category : undefined,
      campaign: touched.campaign ? allErrors.campaign : undefined,
      title: touched.title ? allErrors.title : undefined,
      update: touched.update ? allErrors.update : undefined,
    };
  }, [
    campaignCategory,
    selectedCampaign,
    campaignTitle,
    campaignUpdate,
    touched,
  ]);

  const resetForm = useCallback(() => {
    setPostContent("");
    setCampaignCategory("");
    setSelectedCampaign("");
    setCampaignTitle("");
    setCampaignUpdate("");
    setAudience("everyone");
    setIsPublishing(false);
    setTouched({
      postContent: false,
      category: false,
      campaign: false,
      title: false,
      update: false,
    });
  }, []);

  const handlePublish = useCallback(async () => {
    // Mark all fields as touched before validation
    if (activeTab === "post") {
      setTouched((prev) => ({ ...prev, postContent: true }));
    } else {
      setTouched({
        postContent: false,
        category: true,
        campaign: true,
        title: true,
        update: true,
      });
    }

    // Validate before publishing
    if (activeTab === "post") {
      const errors = validatePostForm(postContent);
      if (errors.content) {
        return;
      }
    } else {
      const errors = validateCampaignUpdateForm({
        category: campaignCategory,
        campaign: selectedCampaign,
        title: campaignTitle,
        update: campaignUpdate,
      });
      if (errors.category || errors.campaign || errors.title || errors.update) {
        return;
      }
    }

    setIsPublishing(true);

    try {
      const data: PublishData =
        activeTab === "post"
          ? { type: "post", content: postContent }
          : {
              type: "campaign-update",
              category: campaignCategory,
              campaign: selectedCampaign,
              title: campaignTitle,
              update: campaignUpdate,
            };

      await onPublish(data);
      resetForm();
      onClose();
    } catch (error) {
      console.error("Failed to publish:", error);
      setIsPublishing(false);
    }
  }, [
    activeTab,
    postContent,
    campaignCategory,
    selectedCampaign,
    campaignTitle,
    campaignUpdate,
    onPublish,
    onClose,
    resetForm,
  ]);

  const handleRewriteWithAI = useCallback(() => {
    // AI rewrite functionality - implement based on your AI service
    console.log("Rewrite with AI clicked");
  }, []);

  return {
    activeTab,
    setActiveTab,
    isPublishing,
    audience,
    setAudience: handleAudienceChange,
    postContent,
    setPostContent: handlePostContentChange,
    campaignCategory,
    setCampaignCategory: handleCategoryChange,
    selectedCampaign,
    setSelectedCampaign: handleCampaignChange,
    campaignTitle,
    setCampaignTitle: handleTitleChange,
    campaignUpdate,
    setCampaignUpdate: handleUpdateChange,
    handlePublish,
    handleRewriteWithAI,
    resetForm,
    filteredCampaigns,
    touched,
    postFormErrors,
    campaignUpdateFormErrors,
  };
};
