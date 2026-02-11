"use client";

import { useState } from "react";
import { PostImageGrid } from "@/app/components/ui/post/PostImageGrid";
import { MOCK_IMAGES } from "@/app/ui-library/playgrounds/_mock-data";
import type { PlaygroundConfig } from "../types";

/**
 * Wrapper that slices MOCK_IMAGES based on the imageCount control.
 * The renderPreview function itself cannot use hooks, so state-dependent
 * logic is lifted into this wrapper component.
 */
function PostImageGridPreview({ imageCount }: { imageCount: number }) {
  const images = MOCK_IMAGES.slice(0, imageCount);

  return (
    <div className="max-w-md">
      <PostImageGrid images={images} onImageClick={() => {}} />
    </div>
  );
}

const postImageGridPlayground: PlaygroundConfig = {
  componentName: "PostImageGrid",
  importPath: "@/app/components/ui/post/PostImageGrid",
  controls: [
    {
      prop: "imageCount",
      label: "Image Count",
      type: "number",
      defaultValue: 2,
      min: 1,
      max: 4,
      step: 1,
    },
  ],
  renderPreview: (props) => (
    <PostImageGridPreview imageCount={props.imageCount as number} />
  ),
};

export default postImageGridPlayground;
