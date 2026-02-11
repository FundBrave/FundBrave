"use client";

import { useState } from "react";
import AddReminderModal from "@/app/components/ui/AddReminderModal";
import { Button } from "@/app/components/ui/button";
import type { PlaygroundConfig } from "../types";

/**
 * Wrapper component that manages modal open/close state,
 * since renderPreview cannot use hooks directly.
 */
function AddReminderPreview({ campaignTitle }: { campaignTitle: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4">
      <Button variant="primary" size="md" onClick={() => setIsOpen(true)}>
        Open Reminder Modal
      </Button>
      <AddReminderModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        campaignTitle={campaignTitle}
        campaignEndDate={new Date("2026-12-31")}
      />
    </div>
  );
}

const addReminderModalPlayground: PlaygroundConfig = {
  componentName: "AddReminderModal",
  importPath: "@/app/components/ui/AddReminderModal",
  controls: [
    {
      prop: "campaignTitle",
      label: "Campaign Title",
      type: "text",
      defaultValue: "Save the Rainforest Fund",
    },
  ],
  renderPreview: (props) => (
    <AddReminderPreview campaignTitle={props.campaignTitle as string} />
  ),
};

export default addReminderModalPlayground;
