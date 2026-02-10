"use client";

import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/app/components/ui/primitives";
import { Button } from "@/app/components/ui/button";
import type { PlaygroundConfig } from "../types";

const cardPlayground: PlaygroundConfig = {
  componentName: "Card",
  importPath: "@/app/components/ui/primitives",
  controls: [
    {
      prop: "variant",
      label: "Variant",
      type: "select",
      options: ["default", "elevated", "glass", "interactive"],
      defaultValue: "default",
    },
    {
      prop: "padding",
      label: "Padding",
      type: "select",
      options: ["none", "sm", "md", "lg"],
      defaultValue: "md",
    },
  ],
  renderPreview: (props) => (
    <Card
      variant={props.variant as "default" | "elevated" | "glass" | "interactive"}
      padding={props.padding as "none" | "sm" | "md" | "lg"}
      className="w-full max-w-sm"
    >
      <CardHeader>
        <h4 className="font-semibold text-text-primary">Campaign Update</h4>
        <p className="text-sm text-text-secondary">Posted 2 hours ago</p>
      </CardHeader>
      <CardContent className="py-4">
        <p className="text-sm text-text-secondary">
          We just hit 75% of our funding goal! Thank you to everyone who has
          contributed so far.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="primary" size="sm">
          Donate Now
        </Button>
      </CardFooter>
    </Card>
  ),
};

export default cardPlayground;
