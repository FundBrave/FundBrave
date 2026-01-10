"use client";

import {
  LinkedInIcon,
  XIcon,
  InstagramIcon,
  FacebookIcon,
} from "@/app/components/ui/icons/SocialIcons";

interface UserData {
  name: string;
  username: string;
  country: string;
  countryFlag: string;
  points: number;
  bio: string;
  followers: number;
  following: number;
  memberSince: string;
  socialLinks: {
    linkedin?: string;
    instagram?: string;
    twitter?: string;
    facebook?: string;
  };
}

interface ProfileHeaderProps {
  user: UserData;
}

/**
 * ProfileHeader - Displays user's profile information
 * Includes name, username, points, bio, followers/following stats, and social links
 */
export default function ProfileHeader({ user }: ProfileHeaderProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Top Section - Name and Social Links */}
      <div className="flex items-start justify-between">
        {/* User Info */}
        <div className="flex flex-col gap-1.5 max-w-[795px]">
          {/* Name and Country Flag */}
          <div className="flex items-center gap-2">
            <h1 className="text-foreground text-xl font-semibold leading-[30px] tracking-wide font-['Poppins']">
              {user.name}
            </h1>
            <span className="text-lg" title={user.country}>
              {user.countryFlag}
            </span>
          </div>

          {/* Username */}
          <p className="text-text-secondary text-sm leading-[21px] tracking-wide">
            @{user.username}
          </p>

          {/* Points Badge */}
          <div className="flex items-center gap-1 mt-1">
            <TrophyIcon className="w-6 h-6 text-amber-500" />
            <span className="text-amber-500 text-sm font-semibold leading-[21px] tracking-wide">
              {user.points}
            </span>
            <span className="text-amber-500 text-sm font-semibold leading-[21px] tracking-wide">
              points collected
            </span>
          </div>

          {/* Bio */}
          <p className="text-text-secondary text-base leading-6 tracking-wide mt-2">
            {user.bio}
          </p>
        </div>

        {/* Social Links */}
        <div className="flex gap-5 items-center">
          {user.socialLinks.linkedin && (
            <a
              href={user.socialLinks.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="w-6 h-6 text-foreground hover:text-primary transition-colors"
              aria-label="LinkedIn"
            >
              <LinkedInIcon className="w-full h-full" />
            </a>
          )}
          {user.socialLinks.instagram && (
            <a
              href={user.socialLinks.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="w-6 h-6 text-foreground hover:text-primary transition-colors"
              aria-label="Instagram"
            >
              <InstagramIcon className="w-full h-full" />
            </a>
          )}
          {user.socialLinks.twitter && (
            <a
              href={user.socialLinks.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="w-6 h-6 text-foreground hover:text-primary transition-colors"
              aria-label="Twitter/X"
            >
              <XIcon className="w-full h-full" />
            </a>
          )}
          {user.socialLinks.facebook && (
            <a
              href={user.socialLinks.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="w-6 h-6 text-foreground hover:text-primary transition-colors"
              aria-label="Facebook"
            >
              <FacebookIcon className="w-full h-full" />
            </a>
          )}
        </div>
      </div>

      {/* Stats Row - Followers/Following and Member Since */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-base">
          <p className="font-bold">
            <span className="text-foreground tracking-wide">{user.followers}</span>{" "}
            <span className="text-text-secondary font-normal">Followers</span>
          </p>
          <p className="font-bold">
            <span className="text-foreground tracking-wide">{user.following}</span>{" "}
            <span className="text-text-secondary font-normal">Following</span>
          </p>
        </div>
        <p className="text-foreground font-bold text-base">
          Member since {user.memberSince}
        </p>
      </div>
    </div>
  );
}

/**
 * TrophyIcon - Award/Trophy SVG icon
 * Used to display user points/achievements
 */
function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 15C15.866 15 19 11.866 19 8V3H5V8C5 11.866 8.13401 15 12 15Z"
        fill="currentColor"
      />
      <path
        d="M19 5H21V8C21 9.65685 19.6569 11 18 11H17.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M5 5H3V8C3 9.65685 4.34315 11 6 11H6.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 15V17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8 21H16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M10 17H14V21H10V17Z" fill="currentColor" />
    </svg>
  );
}
