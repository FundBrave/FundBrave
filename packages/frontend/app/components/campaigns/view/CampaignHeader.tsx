"use client";

import Image from "next/image";
import {
  Heart,
  Users,
  AlertTriangle,
  GraduationCap,
  Leaf,
  Cat,
  Briefcase,
  HeartHandshake,
  Trophy,
  Plane,
  Laptop,
  Grid3X3,
} from "@/app/components/ui/icons";

interface CampaignHeaderProps {
  title: string;
  imageUrl: string;
  categories: string[];
}

// Helper to get icon for category
const getCategoryIcon = (category: string) => {
  const lowerCat = category.toLowerCase();
  if (lowerCat.includes("health") || lowerCat.includes("medical")) return <Heart size={20} />;
  if (lowerCat.includes("education")) return <GraduationCap size={20} />;
  if (lowerCat.includes("environment")) return <Leaf size={20} />;
  if (lowerCat.includes("emergency")) return <AlertTriangle size={20} />;
  if (lowerCat.includes("animal")) return <Cat size={20} />;
  if (lowerCat.includes("community")) return <Users size={20} />;
  if (lowerCat.includes("business")) return <Briefcase size={20} />;
  if (lowerCat.includes("family")) return <HeartHandshake size={20} />;
  if (lowerCat.includes("sport")) return <Trophy size={20} />;
  if (lowerCat.includes("travel")) return <Plane size={20} />;
  if (lowerCat.includes("tech")) return <Laptop size={20} />;
  return <Grid3X3 size={20} />;
};

export default function CampaignHeader({
  title,
  imageUrl,
  categories,
}: CampaignHeaderProps) {
  return (
    <div className="flex flex-col gap-4 w-full">
      <h1 className="text-2xl sm:text-3xl font-semibold text-foreground leading-tight tracking-wide font-[family-name:var(--font-family-gilgan)]">
        {title}
      </h1>
      
      {/* Responsive image height for different screen sizes */}
      <div className="relative h-[250px] sm:h-[320px] md:h-[380px] lg:h-[435px] w-full rounded-2xl overflow-hidden bg-surface-sunken">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="flex flex-wrap gap-3 sm:gap-5 items-center mt-2">
        {categories.map((category, index) => (
          <div key={index} className="flex items-center gap-2 text-foreground/80">
            {getCategoryIcon(category)}
            <span className="text-sm sm:text-base">{category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
