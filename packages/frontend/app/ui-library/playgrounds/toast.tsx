"use client";

import { ToastProvider, useToast } from "@/app/components/ui/Toast";
import type { PlaygroundConfig } from "../types";

/* -------------------------------------------------------------------------- */
/*  Inner component -- lives inside ToastProvider so useToast() is available   */
/* -------------------------------------------------------------------------- */

function ToastTrigger(props: Record<string, unknown>) {
  const { showToast } = useToast();

  const handleClick = () => {
    showToast(
      props.message as string,
      props.type as "success" | "error" | "info" | "warning"
    );
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-text-secondary text-center">
        Click the button below to trigger a toast notification.
      </p>
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        Show Toast
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Wrapper -- provides ToastProvider context around the trigger button        */
/* -------------------------------------------------------------------------- */

function ToastPreview(props: Record<string, unknown>) {
  return (
    <ToastProvider>
      <ToastTrigger {...props} />
    </ToastProvider>
  );
}

/* -------------------------------------------------------------------------- */
/*  Playground config                                                          */
/* -------------------------------------------------------------------------- */

const toastPlayground: PlaygroundConfig = {
  componentName: "Toast",
  importPath: "@/app/components/ui/Toast",
  controls: [
    {
      prop: "type",
      label: "Type",
      type: "select",
      options: ["success", "error", "info", "warning"],
      defaultValue: "success",
    },
    {
      prop: "message",
      label: "Message",
      type: "text",
      defaultValue: "Campaign created successfully!",
    },
  ],
  renderPreview: (props) => <ToastPreview {...props} />,
};

export default toastPlayground;
