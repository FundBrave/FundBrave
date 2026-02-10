"use client";

import { Skeleton } from "@/app/components/ui/Skeleton";
import type { PlaygroundConfig } from "../types";

const skeletonPlayground: PlaygroundConfig = {
  componentName: "Skeleton",
  importPath: "@/app/components/ui/Skeleton",
  controls: [
    {
      prop: "variant",
      label: "Variant",
      type: "select",
      options: ["text", "circular", "rectangular", "rounded"],
      defaultValue: "rectangular",
    },
    {
      prop: "animation",
      label: "Animation",
      type: "select",
      options: ["pulse", "wave", "none"],
      defaultValue: "pulse",
    },
    {
      prop: "width",
      label: "Width (px)",
      type: "number",
      defaultValue: 200,
      min: 40,
      max: 400,
      step: 10,
    },
    {
      prop: "height",
      label: "Height (px)",
      type: "number",
      defaultValue: 100,
      min: 20,
      max: 300,
      step: 10,
    },
  ],
  renderPreview: (props) => (
    <Skeleton
      variant={props.variant as "text" | "circular" | "rectangular" | "rounded"}
      animation={props.animation as "pulse" | "wave" | "none"}
      width={props.width as number}
      height={props.height as number}
    />
  ),
};

export default skeletonPlayground;
