"use client";

import { WalletAddressInput } from "@/app/components/ui/form/WalletAddressInput";
import type { PlaygroundConfig } from "../types";

const walletAddressInputPlayground: PlaygroundConfig = {
  componentName: "WalletAddressInput",
  importPath: "@/app/components/ui/form/WalletAddressInput",
  controls: [
    {
      prop: "value",
      label: "Value",
      type: "text",
      defaultValue: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD38",
    },
    {
      prop: "error",
      label: "Error",
      type: "text",
      defaultValue: "",
    },
    {
      prop: "disabled",
      label: "Disabled",
      type: "toggle",
      defaultValue: false,
    },
    {
      prop: "isWalletConnected",
      label: "Wallet Connected",
      type: "toggle",
      defaultValue: false,
    },
    {
      prop: "label",
      label: "Label",
      type: "text",
      defaultValue: "Wallet Address",
    },
    {
      prop: "required",
      label: "Required",
      type: "toggle",
      defaultValue: true,
    },
  ],
  renderPreview: (props) => (
    <WalletAddressInput
      value={props.value as string}
      onChange={() => {}}
      {...((props.error as string) ? { error: props.error as string } : {})}
      disabled={props.disabled as boolean}
      isWalletConnected={props.isWalletConnected as boolean}
      {...((props.isWalletConnected as boolean)
        ? { connectedWalletAddress: "0x1234567890abcdef1234567890abcdef12345678" }
        : {})}
      label={props.label as string}
      required={props.required as boolean}
    />
  ),
};

export default walletAddressInputPlayground;
