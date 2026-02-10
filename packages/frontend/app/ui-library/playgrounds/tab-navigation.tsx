"use client";

import { useState } from "react";
import TabNavigation from "@/app/components/ui/TabNavigation";
import type { PostType } from "@/app/components/ui/types/CreatePost.types";
import type { PlaygroundConfig } from "../types";

/* -------------------------------------------------------------------------- */
/*  Wrapper -- manages activeTab state so tabs are fully interactive           */
/* -------------------------------------------------------------------------- */

function TabNavigationPreview() {
  const [activeTab, setActiveTab] = useState<PostType>("post");

  return (
    <div className="w-full">
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Playground config                                                          */
/* -------------------------------------------------------------------------- */

const tabNavigationPlayground: PlaygroundConfig = {
  componentName: "TabNavigation",
  importPath: "@/app/components/ui/TabNavigation",
  controls: [],
  renderPreview: () => <TabNavigationPreview />,
};

export default tabNavigationPlayground;
