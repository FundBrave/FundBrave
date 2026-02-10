"use client";

import { useState } from "react";
import AvatarUploaderHorizontal from "@/app/components/ui/form/AvatarUploader";
import type { PlaygroundConfig } from "../types";

/* -------------------------------------------------------------------------- */
/*  Wrapper -- manages avatar preview state, file select, and remove actions   */
/* -------------------------------------------------------------------------- */

function AvatarUploaderPreview(props: Record<string, unknown>) {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setAvatarPreview(null);
  };

  return (
    <AvatarUploaderHorizontal
      avatarPreview={avatarPreview}
      initials="JD"
      onFileSelect={handleFileSelect}
      onRemove={handleRemove}
      disabled={props.disabled as boolean}
      enableCrop={props.enableCrop as boolean}
      title={props.title as string}
      subtitle={props.subtitle as string}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Playground config                                                          */
/* -------------------------------------------------------------------------- */

const avatarUploaderPlayground: PlaygroundConfig = {
  componentName: "AvatarUploaderHorizontal",
  importPath: "@/app/components/ui/form/AvatarUploader",
  controls: [
    {
      prop: "disabled",
      label: "Disabled",
      type: "toggle",
      defaultValue: false,
    },
    {
      prop: "enableCrop",
      label: "Enable Crop",
      type: "toggle",
      defaultValue: true,
    },
    {
      prop: "title",
      label: "Title",
      type: "text",
      defaultValue: "Profile photo",
    },
    {
      prop: "subtitle",
      label: "Subtitle",
      type: "text",
      defaultValue: "PNG, JPG or WebP up to 5MB",
    },
  ],
  renderPreview: (props) => <AvatarUploaderPreview {...props} />,
};

export default avatarUploaderPlayground;
