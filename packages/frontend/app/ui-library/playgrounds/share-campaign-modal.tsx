"use client";

import { useState } from "react";
import ShareCampaignModal from "@/app/components/ui/ShareCampaignModal";
import { Button } from "@/app/components/ui/button";
import type { PlaygroundConfig } from "../types";

/**
 * Wrapper component that manages modal open/close state,
 * since renderPreview cannot use hooks directly.
 */
function ShareCampaignPreview({
  campaignTitle,
  campaignUrl,
}: {
  campaignTitle: string;
  campaignUrl: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4">
      <Button variant="primary" size="md" onClick={() => setIsOpen(true)}>
        Open Share Modal
      </Button>
      <ShareCampaignModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        campaignTitle={campaignTitle}
        campaignUrl={campaignUrl}
      />
    </div>
  );
}

const shareCampaignModalPlayground: PlaygroundConfig = {
  componentName: "ShareCampaignModal",
  importPath: "@/app/components/ui/ShareCampaignModal",
  controls: [
    {
      prop: "campaignTitle",
      label: "Campaign Title",
      type: "text",
      defaultValue: "Help Build a School in Kenya",
    },
    {
      prop: "campaignUrl",
      label: "Campaign URL",
      type: "text",
      defaultValue: "https://fundbrave.com/campaigns/school-kenya",
    },
  ],
  renderPreview: (props) => (
    <ShareCampaignPreview
      campaignTitle={props.campaignTitle as string}
      campaignUrl={props.campaignUrl as string}
    />
  ),
};

export default shareCampaignModalPlayground;
