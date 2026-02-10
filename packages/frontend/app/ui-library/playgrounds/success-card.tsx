"use client";

import SuccessCard from "@/app/components/ui/SuccessCard";
import type { PlaygroundConfig } from "../types";

/* -------------------------------------------------------------------------- */
/*  Wrapper -- uses key to force remount when showAnimation toggles            */
/* -------------------------------------------------------------------------- */

function SuccessCardPreview(props: Record<string, unknown>) {
  // Using showAnimation as part of the key forces a full remount,
  // which replays the entrance animation from scratch.
  const animationKey = props.showAnimation ? "anim-on" : "anim-off";

  return (
    <div className="flex justify-center">
      <SuccessCard
        key={`${animationKey}-${Date.now()}`}
        title={props.title as string}
        message={props.message as string}
        buttonText={props.buttonText as string}
        showAnimation={props.showAnimation as boolean}
        onButtonClick={() => {}}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Playground config                                                          */
/* -------------------------------------------------------------------------- */

const successCardPlayground: PlaygroundConfig = {
  componentName: "SuccessCard",
  importPath: "@/app/components/ui/SuccessCard",
  controls: [
    {
      prop: "title",
      label: "Title",
      type: "text",
      defaultValue: "Success!",
    },
    {
      prop: "message",
      label: "Message",
      type: "text",
      defaultValue: "Your 50 USDC donation has been sent successfully.",
    },
    {
      prop: "buttonText",
      label: "Button Text",
      type: "text",
      defaultValue: "Close",
    },
    {
      prop: "showAnimation",
      label: "Show Animation",
      type: "toggle",
      defaultValue: true,
    },
  ],
  renderPreview: (props) => <SuccessCardPreview {...props} />,
};

export default successCardPlayground;
