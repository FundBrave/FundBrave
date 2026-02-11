"use client";

import { useState } from "react";
import { SocialLinksGroup } from "@/app/components/ui/form/SocialLinksGroup";
import type { SocialLinks } from "@/app/components/ui/form/SocialLinksGroup";
import type { PlaygroundConfig } from "../types";

/* -------------------------------------------------------------------------- */
/*  Wrapper -- manages internal social links state for interactive inputs      */
/* -------------------------------------------------------------------------- */

function SocialLinksGroupPreview(props: Record<string, unknown>) {
  const [links, setLinks] = useState<SocialLinks>({
    twitter: "",
    instagram: "",
    linkedin: "",
    github: "",
  });

  return (
    <SocialLinksGroup
      value={links}
      onChange={setLinks}
      disabled={props.disabled as boolean}
      defaultCollapsed={props.defaultCollapsed as boolean}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Playground config                                                          */
/* -------------------------------------------------------------------------- */

const socialLinksGroupPlayground: PlaygroundConfig = {
  componentName: "SocialLinksGroup",
  importPath: "@/app/components/ui/form/SocialLinksGroup",
  controls: [
    {
      prop: "disabled",
      label: "Disabled",
      type: "toggle",
      defaultValue: false,
    },
    {
      prop: "defaultCollapsed",
      label: "Default Collapsed",
      type: "toggle",
      defaultValue: false,
    },
  ],
  renderPreview: (props) => <SocialLinksGroupPreview {...props} />,
};

export default socialLinksGroupPlayground;
