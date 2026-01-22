"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { Plus } from "@/app/components/ui/icons";
import {
  ProfileHeader,
  ProfileTabs,
  CampaignsTab,
  PostsTab,
  DonationsTab,
  LikesTab,
  CommentsTab,
} from "@/app/components/profile";
import { CreatePost } from "@/app/components/ui";
import { usePosts } from "@/app/provider/PostsContext";
import { useUserProfile } from "@/app/hooks/useUserProfile";
import { useGetFundraisersByCreatorQuery } from "@/app/generated/graphql";
import type { PublishData } from "@/app/components/ui/types/CreatePost.types";
import { useAuth } from "@/app/provider/AuthProvider";

// Tab options for the profile page
type ProfileTab = "posts" | "donations" | "campaigns" | "likes" | "comments";

/**
 * ProfilePage - User profile page component
 * Displays user information, stats, social links, and content tabs
 */
export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProfileTab>("campaigns");
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const { addPost } = usePosts();
  const plusIconRef = useRef<SVGSVGElement>(null);
  const { user: currentUser } = useAuth();

  const username = params.username as string;

  // Handle "me" route - redirect to actual username
  useEffect(() => {
    if (username === "me") {
      if (currentUser?.username) {
        // Redirect to user's actual username
        router.replace(`/profile/${currentUser.username}`);
      } else if (!currentUser && username === "me") {
        // Not authenticated, redirect to login
        router.push("/auth");
      }
    }
  }, [username, currentUser, router]);

  // Skip fetching if username is "me" (will redirect)
  const shouldFetch = username !== "me";

  // Fetch user profile data from GraphQL
  const { user, isLoading: userLoading, error: userError } = useUserProfile(shouldFetch ? username : "");

  // Fetch user's campaigns
  const { data: campaignsData, loading: campaignsLoading } = useGetFundraisersByCreatorQuery({
    variables: {
      creatorId: user?.id || '',
      limit: 50,
      offset: 0,
    },
    skip: !user?.id,
    fetchPolicy: 'cache-and-network',
  });

  // Transform campaigns data
  const campaigns = campaignsData?.fundraisersByCreator?.items?.map(fundraiser => ({
    id: fundraiser.id,
    title: fundraiser.name,
    imageUrl: fundraiser.images?.[0] || '',
    donorsCount: fundraiser.stats.donorsCount,
    amountRaised: parseFloat(fundraiser.raisedAmount),
    targetAmount: parseFloat(fundraiser.goalAmount),
    currency: fundraiser.currency,
    endDate: new Date(fundraiser.deadline),
  })) || [];

  // Handle publishing a new post
  const handlePublish = (data: PublishData) => {
    if (data.type === "post") {
      addPost(data.content);
    }
    setIsCreatePostOpen(false);
  };

  // Transform user data for ProfileHeader
  const userData = user ? {
    id: user.id,
    name: user.displayName || user.username || "Anonymous",
    username: user.username || "",
    country: "", // TODO: Add country field to GraphQL
    countryFlag: "", // TODO: Add country flag
    points: 0, // TODO: Calculate points
    bio: user.bio || "",
    followers: user.stats.followersCount || 0,
    following: user.stats.followingCount || 0,
    memberSince: user.createdAt,
    isCurrentUser: false, // TODO: Check if current user
    isFollowing: false, // TODO: Implement follow status check
    socialLinks: {
      linkedin: "",
      instagram: "",
      twitter: "",
      facebook: "",
    },
  } : null;

  // Handle create post button click with GSAP animation
  const handleCreatePostClick = useCallback(() => {
    if (plusIconRef.current) {
      gsap.to(plusIconRef.current, {
        rotation: "+=180",
        scale: 1.2,
        duration: 0.3,
        ease: "back.out(1.7)",
        onComplete: () => {
          gsap.to(plusIconRef.current, {
            scale: 1,
            duration: 0.15,
          });
        },
      });
    }
    setIsCreatePostOpen(true);
  }, []);

  // Loading state
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-r-transparent mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (userError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Error Loading Profile</h1>
          <p className="text-muted-foreground mb-6">
            {userError}
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary/80 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // If user not found, show not found page
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">User Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The user @{username} doesn&apos;t exist.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary/80 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Cover Photo Section */}
          <div className="relative h-[200px] sm:h-[250px] lg:h-[300px]">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-900/50 via-purple-900/30 to-background"></div>
          </div>

          {/* Profile Content */}
          <div className="relative -mt-16 sm:-mt-20">
            {/* Avatar and Actions Row */}
            <div className="px-6 flex justify-between items-end">
              {/* Avatar */}
              <div className="relative w-[120px] h-[120px] sm:w-[140px] sm:h-[140px] rounded-full border-4 border-background overflow-hidden bg-surface-sunken">
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.displayName || user.username || "User"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary text-4xl font-bold">
                    {(user.displayName || user.username || "U").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pb-2">
                <button className="p-2.5 rounded-full border border-border-subtle hover:bg-surface-overlay transition-colors">
                  <MessageIcon className="w-5 h-5 text-white" />
                </button>
                <Link href="/settings/profile">
                  <button className="px-5 py-2 rounded-full bg-white text-black font-bold text-sm hover:bg-white/90 transition-colors">
                    Edit profile
                  </button>
                </Link>
              </div>
            </div>

            {/* Profile Details */}
            <div className="px-6 mt-4">
              {userData && <ProfileHeader user={userData} />}
            </div>
          </div>

          {/* Tabs Section */}
          <div className="mt-8">
            <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          {/* Tab Content */}
          <div className="px-6 py-8">
            {activeTab === "campaigns" && (
              <>
                {campaignsLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-r-transparent"></div>
                    <p className="text-muted-foreground mt-2">Loading campaigns...</p>
                  </div>
                ) : (
                  <CampaignsTab campaigns={campaigns} />
                )}
              </>
            )}

            {activeTab === "posts" && <PostsTab />}

            {activeTab === "donations" && (
              <DonationsTab donations={[]} />
            )}

            {activeTab === "likes" && <LikesTab likes={[]} />}

            {activeTab === "comments" && (
              <CommentsTab comments={[]} />
            )}
          </div>
        </div>
      </div>

      {/* Floating Create Post Button */}
      <button
        onClick={handleCreatePostClick}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-primary-600 to-soft-purple-500 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center z-40"
        aria-label="Create post"
      >
        <Plus ref={plusIconRef} size={24} />
      </button>

      {/* Create Post Modal */}
      <CreatePost
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onPublish={handlePublish}
      />
    </>
  );
}

/**
 * Message Icon Component
 * SVG icon for the message button
 */
function MessageIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
