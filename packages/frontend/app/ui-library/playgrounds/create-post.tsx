"use client";

import { useState } from "react";
import CreatePost from "@/app/components/ui/CreatePost/CreatePost";
import { Button } from "@/app/components/ui/button";
import type { PlaygroundConfig } from "../types";

/**
 * Wrapper component that manages modal open/close state,
 * since renderPreview cannot use hooks directly.
 *
 * CreatePost is a complex dialog with internal tabs (post / campaign update),
 * so we only wire isOpen, onClose, and onPublish here.
 */
function CreatePostPreview() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4">
      <Button variant="primary" size="md" onClick={() => setIsOpen(true)}>
        Open Create Post
      </Button>
      <CreatePost
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onPublish={(data) => {
          console.log("Published:", data);
          setIsOpen(false);
        }}
      />
    </div>
  );
}

const createPostPlayground: PlaygroundConfig = {
  componentName: "CreatePost",
  importPath: "@/app/components/ui/CreatePost/CreatePost",
  controls: [],
  renderPreview: () => <CreatePostPreview />,
};

export default createPostPlayground;
