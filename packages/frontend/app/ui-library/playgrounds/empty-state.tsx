"use client";

import { EmptyState } from "@/app/components/ui/EmptyState";
import { Rocket } from "lucide-react";
import type { PlaygroundConfig } from "../types";

const emptyStatePlayground: PlaygroundConfig = {
  componentName: "EmptyState",
  importPath: "@/app/components/ui/EmptyState",
  controls: [
    {
      prop: "title",
      label: "Title",
      type: "text",
      defaultValue: "No items yet",
    },
    {
      prop: "description",
      label: "Description",
      type: "text",
      defaultValue: "Create your first item to get started.",
    },
  ],
  renderPreview: (props) => (
    <EmptyState
      icon={Rocket}
      title={props.title as string}
      description={props.description as string}
    />
  ),
};

export default emptyStatePlayground;
