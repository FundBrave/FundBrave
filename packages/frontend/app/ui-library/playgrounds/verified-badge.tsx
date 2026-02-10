"use client";

import { VerifiedBadge } from "@/app/components/ui/post/VerifiedBadge";
import type { PlaygroundConfig } from "../types";

const verifiedBadgePlayground: PlaygroundConfig = {
  componentName: "VerifiedBadge",
  importPath: "@/app/components/ui/post/VerifiedBadge",
  controls: [
    {
      prop: "size",
      label: "Size",
      type: "select",
      options: ["sm", "md", "lg"],
      defaultValue: "md",
    },
  ],
  renderPreview: (props) => (
    <div className="flex items-center gap-3 p-4">
      <span className="text-foreground font-semibold">Amara Osei</span>
      <VerifiedBadge size={props.size as "sm" | "md" | "lg"} />
    </div>
  ),
};

export default verifiedBadgePlayground;
