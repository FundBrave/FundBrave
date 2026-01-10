import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Campaigns | FundBrave",
  description: "Browse and support crowdfunding campaigns on FundBrave",
};

/**
 * Layout for the campaigns section
 * Wraps all campaign pages with consistent styling
 */
export default function CampaignsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
