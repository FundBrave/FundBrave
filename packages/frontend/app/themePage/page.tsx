"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, useSpring, useTransform, AnimatePresence, useMotionValue } from "motion/react";
import gsap from "gsap";
import { Button } from "../components/ui/button";
import SuccessCard from "../components/ui/SuccessCard";
import AddReminderModal from "../components/ui/AddReminderModal";
import ShareCampaignModal from "../components/ui/ShareCampaignModal";
import { CreatePost } from "../components/ui";
import ExampleUsage from "../components/ui/CreatePost/CreatePostExample";
import {
  Heart,
  Bell,
  Bookmark,
  Share2,
  Repeat2,
  Loader2,
  PanelRightClose,
  PanelRightOpen,
  Check,
  Send,
  Menu,
  X,
  Search,
  Plus,
  Sparkles,
  Rocket,
  Gift,
  Globe,
  Users,
  ArrowRight,
  Mail,
  Lock,
  Eye,
  Trophy,
} from "../components/ui/icons";

// Create motion-enabled icon components
const MotionHeart = motion.create(Heart);
const MotionBell = motion.create(Bell);
const MotionBookmark = motion.create(Bookmark);
const MotionShare2 = motion.create(Share2);
const MotionRepeat2 = motion.create(Repeat2);
const MotionCheck = motion.create(Check);
const MotionSend = motion.create(Send);
const MotionMenu = motion.create(Menu);
const MotionX = motion.create(X);
const MotionSearch = motion.create(Search);
const MotionPlus = motion.create(Plus);
const MotionSparkles = motion.create(Sparkles);
const MotionRocket = motion.create(Rocket);
const MotionGift = motion.create(Gift);
const MotionGlobe = motion.create(Globe);
const MotionUsers = motion.create(Users);
const MotionArrowRight = motion.create(ArrowRight);
const MotionMail = motion.create(Mail);
const MotionLock = motion.create(Lock);
const MotionEye = motion.create(Eye);
const MotionTrophy = motion.create(Trophy);

// Confetti particle component
const Particle = ({ index, originX, originY }: { index: number; originX: number; originY: number }) => {
  const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8"];
  const color = colors[index % colors.length];
  const angle = (index / 12) * 360;
  const velocity = 50 + Math.random() * 50;
  const x = Math.cos((angle * Math.PI) / 180) * velocity;
  const y = Math.sin((angle * Math.PI) / 180) * velocity;

  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full"
      style={{ backgroundColor: color, left: originX, top: originY }}
      initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
      animate={{ scale: [0, 1, 0.5], x, y: y + 30, opacity: [1, 1, 0] }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    />
  );
};

const ThemePage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Animated icon states
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isReposted, setIsReposted] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Advanced animation states
  const [showPathDraw, setShowPathDraw] = useState(false);
  const [staggerKey, setStaggerKey] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiOrigin, setConfettiOrigin] = useState({ x: 0, y: 0 });
  const [morphState, setMorphState] = useState<"heart" | "star">("heart");
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [rocketLaunched, setRocketLaunched] = useState(false);

  // Spring animation values
  const springX = useSpring(0, { stiffness: 300, damping: 20 });
  const springScale = useSpring(1, { stiffness: 400, damping: 10 });

  // Stagger animation icons
  const staggerIcons = [
    { Icon: MotionHeart, color: "text-red-500" },
    { Icon: MotionSparkles, color: "text-yellow-500" },
    { Icon: MotionGift, color: "text-pink-500" },
    { Icon: MotionGlobe, color: "text-blue-500" },
    { Icon: MotionUsers, color: "text-green-500" },
    { Icon: MotionTrophy, color: "text-amber-500" },
  ];

  // Confetti trigger
  const triggerConfetti = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setConfettiOrigin({ x: rect.width / 2, y: rect.height / 2 });
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 700);
  };

  // GSAP refs
  const bellRef = useRef<SVGSVGElement>(null);
  const shareRef = useRef<SVGSVGElement>(null);
  const loaderRef = useRef<SVGSVGElement>(null);

  // GSAP animation handlers
  const shakeBell = () => {
    if (bellRef.current) {
      gsap.to(bellRef.current, {
        rotation: 20,
        duration: 0.1,
        yoyo: true,
        repeat: 5,
        ease: "power1.inOut",
        onComplete: () => {
          gsap.set(bellRef.current, { rotation: 0 });
        },
      });
    }
  };

  const bounceShare = () => {
    if (shareRef.current) {
      gsap.fromTo(
        shareRef.current,
        { y: 0 },
        {
          y: -10,
          duration: 0.2,
          yoyo: true,
          repeat: 1,
          ease: "power2.out",
        }
      );
    }
  };

  const spinLoader = () => {
    if (loaderRef.current) {
      gsap.to(loaderRef.current, {
        rotation: 360,
        duration: 1,
        ease: "linear",
        repeat: 2,
      });
    }
  };

  const handleProviderSelect = (provider: string) => {
    console.log("Selected provider:", provider);
    setIsModalOpen(false);
    // Here you would typically handle the provider selection
  };

  const handlePublish = (data: {
    type: string;
    content?: string;
    [key: string]: unknown;
  }) => {
    console.log("Published data:", data);
    // Here you would typically send the data to your API
    // For example:
    // if (data.type === 'post') {
    //   await createPost(data.content);
    // } else if (data.type === 'campaign-update') {
    //   await createCampaignUpdate(data);
    // }
  };

  return (
    <>
      <main className="container mx-auto px-4 py-8">
        <section className="py-12 md:py-16">
          {/* Hero Section */}
          <h1 className="text-4xl md:text-5xl font-bold text-brand-dark dark:text-white mb-6 font-gilgan">
            Welcome to FundBrave
          </h1>
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold text-primary-800 dark:text-purple-300 mb-4 font-montserrat">
              A Decentralized Fundraising Platform
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              FundBrave connects innovators and supporters in a transparent,
              secure environment powered by blockchain technology. Start your
              journey in web3 fundraising today.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="bg-primary hover:bg-primary-600 text-white px-6 py-3 rounded-md transition-colors font-medium">
                Start a Campaign
              </button>
              <button className="bg-soft-purple-100 hover:bg-soft-purple-200 text-primary-800 px-6 py-3 rounded-md transition-colors font-medium border border-soft-purple-200 dark:bg-primary-900 dark:hover:bg-primary-800 dark:text-white dark:border-primary-700">
                Explore Projects
              </button>
            </div>
          </div>
        </section>
        <section className="py-10">
          {/* Color Theme Showcase */}
          <h2 className="text-2xl font-semibold mb-8 text-brand-dark dark:text-white border-b border-border pb-2">
            FundBrave Theme Colors
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Primary Blue Colors */}
            <div className="p-6 rounded-lg bg-transparent dark:bg-primary-900 shadow-sm border border-border">
              <h3 className="text-xl font-semibold mb-4 text-brand-blue">
                Primary Blue
              </h3>
              <div className="grid grid-cols-5 gap-2">
                <div className="h-12 rounded bg-primary-50"></div>
                <div className="h-12 rounded bg-primary-200"></div>
                <div className="h-12 rounded bg-primary-400"></div>
                <div className="h-12 rounded bg-primary-600"></div>
                <div className="h-12 rounded bg-primary-800"></div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Our primary blue color represents trust and innovation.
              </p>
              <button className="mt-4 bg-primary hover:bg-primary-600 text-white px-4 py-2 rounded transition-colors w-full">
                Primary Action
              </button>
            </div>

            {/* Primary Purple Colors */}
            <div className="p-6 rounded-lg bg-transparent dark:bg-primary-900 shadow-sm border border-border">
              <h3 className="text-xl font-semibold mb-4 text-brand-purple">
                Primary Purple
              </h3>
              <div className="grid grid-cols-5 gap-2">
                <div className="h-12 rounded bg-purple-50"></div>
                <div className="h-12 rounded bg-purple-200"></div>
                <div className="h-12 rounded bg-purple-400"></div>
                <div className="h-12 rounded bg-purple-600"></div>
                <div className="h-12 rounded bg-purple-800"></div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Our purple palette adds creativity to our brand.
              </p>
              <button className="mt-4 bg-purple hover:bg-purple-600 text-white px-4 py-2 rounded transition-colors w-full">
                Purple Action
              </button>
            </div>

            {/* Soft Purple Colors */}
            <div className="p-6 rounded-lg bg-white dark:bg-primary-900 shadow-sm border border-border">
              <h3 className="text-xl font-semibold mb-4 text-brand-soft-purple">
                Soft Purple
              </h3>
              <div className="grid grid-cols-5 gap-2">
                <div className="h-12 rounded bg-soft-purple-50"></div>
                <div className="h-12 rounded bg-soft-purple-200"></div>
                <div className="h-12 rounded bg-soft-purple-400"></div>
                <div className="h-12 rounded bg-soft-purple-600"></div>
                <div className="h-12 rounded bg-soft-purple-800"></div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Our soft purple adds a gentle feel to our interfaces.
              </p>
              <button className="mt-4 bg-soft-purple hover:bg-soft-purple-600 text-soft-purple-foreground px-4 py-2 rounded transition-colors w-full">
                Soft Action
              </button>
            </div>
          </div>
        </section>
        {/* custom button component */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-4 text-brand-dark dark:text-white border-b border-border pb-2">
            Design Button Component
          </h2>

          <div className=" grid gap-4 grid-cols-3">
            <Button variant="primary" size="sm" fullWidth={false}>
              Primary
            </Button>
            <Button variant="secondary" size="sm" fullWidth={false}>
              Secondary
            </Button>
            <Button variant="tertiary" size="sm" fullWidth={false}>
              Tertiary
            </Button>

            <Button variant="primary" size="md" fullWidth={false}>
              Medium Primary
            </Button>
            <Button variant="secondary" size="md" fullWidth={false}>
              Medium Secondary
            </Button>
            <Button variant="tertiary" size="md" fullWidth={false}>
              Medium Tertiary
            </Button>

            <Button variant="primary" size="lg" fullWidth={false}>
              Big Primary
            </Button>
            <Button variant="secondary" size="lg" fullWidth={false}>
              Big Secondary
            </Button>
            <Button variant="tertiary" size="lg" fullWidth={false}>
              Big Tertiary
            </Button>

            <Button variant="primary" size="xl" fullWidth>
              Full Width Primary
            </Button>
            <Button variant="secondary" size="xl" fullWidth>
              Full Width Secondary
            </Button>
            <Button variant="tertiary" size="xl" fullWidth>
              Full Width Tertiary
            </Button>
          </div>
        </section>
        {/* Success Card Component */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-8 text-brand-dark dark:text-white border-b border-border pb-2">
            Success Card Component
          </h2>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Default Success Card - Animated */}
            <div className="flex justify-center">
              <SuccessCard showAnimation={true} />
            </div>

            {/* Custom Success Card - Transaction */}
            <div className="flex justify-center">
              <SuccessCard
                title="Transaction Complete!"
                message="Your donation of 50 ETH to the Climate Change Initiative has been successfully processed."
                buttonText="View Transaction"
                onButtonClick={() => console.log("View transaction clicked")}
                showAnimation={false}
              />
            </div>

            {/* Custom Success Card - Campaign Created */}
            <div className="flex justify-center">
              <SuccessCard
                title="Campaign Created!"
                message="Your fundraising campaign 'Save the Ocean' has been successfully created and is now live."
                buttonText="View Campaign"
                onButtonClick={() => console.log("View campaign clicked")}
                showAnimation={false}
              />
            </div>
          </div>

          <div className="mt-8 p-6 rounded-lg bg-accent/50 dark:bg-primary-800/30 border border-border">
            <h3 className="text-lg font-semibold mb-4 text-brand-dark dark:text-white">
              Success Card Features
            </h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
              <li>Animated success confirmation with checkmark</li>
              <li>Customizable title and message</li>
              <li>Optional action button with callback</li>
              <li>Responsive design for all screen sizes</li>
              <li>Dark mode support</li>
            </ul>
          </div>
        </section>
        {/* Add Reminder Modal Component */}
        <section className="mt-10">
          <div className="p-6 rounded-lg bg-accent/50 dark:bg-primary-800/30 border border-border">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-brand-dark dark:text-white">
                Modal Features
              </h3>

              <Button
                variant="primary"
                size="md"
                onClick={() => setIsModalOpen(true)}
              >
                Open Add Reminder Modal
              </Button>
            </div>
          </div>
        </section>

        {/* CreatePost Component */}
        <section className="mt-10">
          <div className="p-6 rounded-lg bg-accent/50 dark:bg-primary-800/30 border border-border">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-brand-dark dark:text-white">
                CreatePost Popup Component
              </h3>
              <p className="text-muted-foreground dark:text-purple-100 mb-4">
                Interactive popup for creating posts and campaign updates with
                tabbed interface and media actions.
              </p>

              <Button
                variant="primary"
                size="md"
                onClick={() => setIsCreatePostOpen(true)}
              >
                Open CreatePost Popup
              </Button>
            </div>
          </div>
        </section>

        {/* ShareCampaignModal Component */}
        <section className="mt-10">
          <div className="p-6 rounded-lg bg-accent/50 dark:bg-primary-800/30 border border-border">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-brand-dark dark:text-white">
                Share Campaign Modal Component
              </h3>
              <p className="text-muted-foreground dark:text-purple-100 mb-4">
                Modal for sharing campaigns across social media platforms and
                communities with customizable sharing options.
              </p>

              <Button
                variant="primary"
                size="md"
                onClick={() => setIsShareModalOpen(true)}
              >
                Open Share Campaign Modal
              </Button>
            </div>
          </div>
        </section>

        {/* Theme toggle information */}
        <section className="mt-10 p-6 rounded-lg bg-accent dark:bg-primary-800 text-accent-foreground border border-border">
          <h2 className="text-xl font-semibold mb-4">Theme Support</h2>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/2">
              <h3 className="text-lg mb-2 font-medium">Light & Dark Mode</h3>
              <p className="text-muted-foreground dark:text-purple-100">
                This platform supports both light and dark themes. Click the
                theme toggle in the navbar to switch between themes or use your
                system preferences.
              </p>
            </div>
            <div className="md:w-1/2">
              <h3 className="text-lg mb-2 font-medium">Brand Colors</h3>
              <p className="text-muted-foreground dark:text-purple-100">
                Our color system is designed to support fundraisers and donors
                in web3, building emotional connection, readability, and a sense
                of belonging across the platform.
              </p>
            </div>
          </div>
        </section>

        {/* Animated Icons Showcase */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-8 text-brand-dark dark:text-white border-b border-border pb-2">
            Animated SVG Icons
          </h2>

          {/* Motion (Framer Motion) Examples */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-brand-dark dark:text-white">
              Motion Library Examples
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* Heart - Like Animation */}
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-white/5 border border-white/10">
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className="p-3 rounded-full hover:bg-white/10 transition-colors"
                >
                  <MotionHeart
                    size={28}
                    className={isLiked ? "fill-red-500 text-red-500" : "text-gray-400"}
                    animate={isLiked ? { scale: [1, 1.4, 1] } : { scale: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    whileTap={{ scale: 0.8 }}
                  />
                </button>
                <span className="text-xs text-muted-foreground">Like</span>
              </div>

              {/* Bookmark - Save Animation */}
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-white/5 border border-white/10">
                <button
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  className="p-3 rounded-full hover:bg-white/10 transition-colors"
                >
                  <MotionBookmark
                    size={28}
                    className={isBookmarked ? "fill-yellow-500 text-yellow-500" : "text-gray-400"}
                    animate={isBookmarked ? { y: [0, -5, 0] } : {}}
                    transition={{ duration: 0.3 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  />
                </button>
                <span className="text-xs text-muted-foreground">Bookmark</span>
              </div>

              {/* Repeat2 - Repost Animation */}
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-white/5 border border-white/10">
                <button
                  onClick={() => setIsReposted(!isReposted)}
                  className="p-3 rounded-full hover:bg-white/10 transition-colors"
                >
                  <MotionRepeat2
                    size={28}
                    className={isReposted ? "text-green-500" : "text-gray-400"}
                    animate={isReposted ? { rotate: 360 } : { rotate: 0 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    whileHover={{ scale: 1.1 }}
                  />
                </button>
                <span className="text-xs text-muted-foreground">Repost</span>
              </div>

              {/* Check - Success Animation */}
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-white/5 border border-white/10">
                <motion.button
                  className="p-3 rounded-full hover:bg-white/10 transition-colors"
                  whileTap={{ scale: 0.9 }}
                >
                  <MotionCheck
                    size={28}
                    className="text-green-500"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                </motion.button>
                <span className="text-xs text-muted-foreground">Success</span>
              </div>

              {/* Send - Fly Animation */}
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-white/5 border border-white/10">
                <button
                  onClick={() => {
                    setIsSent(true);
                    setTimeout(() => setIsSent(false), 600);
                  }}
                  className="p-3 rounded-full hover:bg-white/10 transition-colors"
                >
                  <MotionSend
                    size={28}
                    className="text-primary"
                    animate={isSent ? { x: 20, y: -20, opacity: 0 } : { x: 0, y: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </button>
                <span className="text-xs text-muted-foreground">Send</span>
              </div>

              {/* Menu/X - Toggle Animation */}
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-white/5 border border-white/10">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-3 rounded-full hover:bg-white/10 transition-colors"
                >
                  <motion.div
                    animate={{ rotate: isMenuOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {isMenuOpen ? (
                      <X size={28} className="text-gray-400" />
                    ) : (
                      <Menu size={28} className="text-gray-400" />
                    )}
                  </motion.div>
                </button>
                <span className="text-xs text-muted-foreground">Menu</span>
              </div>
            </div>
          </div>

          {/* GSAP Examples */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-brand-dark dark:text-white">
              GSAP Animation Examples
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* Bell - Shake Animation */}
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-white/5 border border-white/10">
                <button
                  onClick={shakeBell}
                  className="p-3 rounded-full hover:bg-white/10 transition-colors"
                >
                  <Bell
                    ref={bellRef}
                    size={28}
                    className="text-yellow-500"
                    style={{ transformOrigin: "top center" }}
                  />
                </button>
                <span className="text-xs text-muted-foreground">Notification</span>
              </div>

              {/* Share - Bounce Animation */}
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-white/5 border border-white/10">
                <button
                  onClick={bounceShare}
                  className="p-3 rounded-full hover:bg-white/10 transition-colors"
                >
                  <Share2
                    ref={shareRef}
                    size={28}
                    className="text-blue-500"
                  />
                </button>
                <span className="text-xs text-muted-foreground">Share</span>
              </div>

              {/* Loader - Spin Animation */}
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-white/5 border border-white/10">
                <button
                  onClick={spinLoader}
                  className="p-3 rounded-full hover:bg-white/10 transition-colors"
                >
                  <Loader2
                    ref={loaderRef}
                    size={28}
                    className="text-primary"
                  />
                </button>
                <span className="text-xs text-muted-foreground">Loading</span>
              </div>

              {/* Panel Toggle */}
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-white/5 border border-white/10">
                <button
                  onClick={() => setIsPanelOpen(!isPanelOpen)}
                  className="p-3 rounded-full hover:bg-white/10 transition-colors"
                >
                  {isPanelOpen ? (
                    <PanelRightClose size={28} className="text-purple-500" />
                  ) : (
                    <PanelRightOpen size={28} className="text-purple-500" />
                  )}
                </button>
                <span className="text-xs text-muted-foreground">Panel</span>
              </div>
            </div>
          </div>

          {/* Continuous Animations */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-brand-dark dark:text-white">
              Continuous Animations
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* Pulsing Heart */}
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-white/5 border border-white/10">
                <MotionHeart
                  size={28}
                  className="text-red-500 fill-red-500"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                />
                <span className="text-xs text-muted-foreground">Pulse</span>
              </div>

              {/* Spinning Loader */}
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-white/5 border border-white/10">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 size={28} className="text-primary" />
                </motion.div>
                <span className="text-xs text-muted-foreground">Spinner</span>
              </div>

              {/* Bouncing Bell */}
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-white/5 border border-white/10">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Bell size={28} className="text-yellow-500" />
                </motion.div>
                <span className="text-xs text-muted-foreground">Bounce</span>
              </div>

              {/* Glowing Bookmark */}
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-white/5 border border-white/10">
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Bookmark size={28} className="text-yellow-500 fill-yellow-500" />
                </motion.div>
                <span className="text-xs text-muted-foreground">Glow</span>
              </div>
            </div>
          </div>

          {/* Code Examples */}
          <div className="p-6 rounded-lg bg-gray-900 border border-white/10">
            <h3 className="text-lg font-semibold mb-4 text-white">
              Usage Examples
            </h3>
            <pre className="text-sm text-gray-300 overflow-x-auto">
              <code>{`// Motion (Framer Motion) Example
import { motion } from "motion/react";
import { Heart } from "@/app/components/ui/icons";

const MotionHeart = motion.create(Heart);

<MotionHeart
  size={24}
  className={isLiked ? "fill-red-500 text-red-500" : "text-gray-400"}
  animate={isLiked ? { scale: [1, 1.4, 1] } : { scale: 1 }}
  transition={{ duration: 0.3 }}
  whileTap={{ scale: 0.8 }}
/>

// GSAP Example
import gsap from "gsap";
import { Bell } from "@/app/components/ui/icons";

const bellRef = useRef<SVGSVGElement>(null);

const shakeBell = () => {
  gsap.to(bellRef.current, {
    rotation: 20,
    duration: 0.1,
    yoyo: true,
    repeat: 5,
    ease: "power1.inOut",
  });
};

<Bell ref={bellRef} size={24} className="text-yellow-500" />`}</code>
            </pre>
          </div>
        </section>

        {/* Advanced Animation Showcase */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-8 text-brand-dark dark:text-white border-b border-border pb-2">
            Advanced SVG Animations
          </h2>

          {/* 1. Path Drawing Animations */}
          <div className="mb-10">
            <h3 className="text-lg font-semibold mb-4 text-brand-dark dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center">1</span>
              Path Drawing Animations
            </h3>
            <p className="text-muted-foreground mb-4">SVG paths that draw themselves on screen - perfect for checkmarks, signatures, and reveal effects.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Checkmark Draw */}
              <div className="p-6 rounded-lg bg-white/5 border border-white/10">
                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={() => setShowPathDraw(!showPathDraw)}
                    className="p-4 rounded-full bg-green-500/20 hover:bg-green-500/30 transition-colors"
                  >
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500">
                      <motion.path
                        d="M20 6L9 17l-5-5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: showPathDraw ? 1 : 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                      />
                    </svg>
                  </button>
                  <span className="text-sm text-muted-foreground">Click to toggle</span>
                  <span className="text-xs font-mono bg-gray-800 px-2 py-1 rounded">pathLength: 0 → 1</span>
                </div>
              </div>

              {/* Circle Draw */}
              <div className="p-6 rounded-lg bg-white/5 border border-white/10">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4">
                    <svg width="48" height="48" viewBox="0 0 24 24" className="text-primary">
                      <motion.circle
                        cx="12"
                        cy="12"
                        r="10"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        initial={{ pathLength: 0, rotate: -90 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        style={{ transformOrigin: "center" }}
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-muted-foreground">Loading circle</span>
                  <span className="text-xs font-mono bg-gray-800 px-2 py-1 rounded">Infinite loop</span>
                </div>
              </div>

              {/* Custom Path */}
              <div className="p-6 rounded-lg bg-white/5 border border-white/10">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4">
                    <svg width="48" height="48" viewBox="0 0 24 24" className="text-purple-500">
                      <motion.path
                        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-muted-foreground">Star drawing</span>
                  <span className="text-xs font-mono bg-gray-800 px-2 py-1 rounded">repeatDelay: 1s</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Stagger Animations */}
          <div className="mb-10">
            <h3 className="text-lg font-semibold mb-4 text-brand-dark dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center">2</span>
              Stagger Animations
            </h3>
            <p className="text-muted-foreground mb-4">Sequential animations where elements animate one after another with configurable delays.</p>

            <div className="p-6 rounded-lg bg-white/5 border border-white/10">
              <div className="flex flex-col items-center gap-6">
                <Button variant="primary" size="sm" onClick={() => setStaggerKey(k => k + 1)}>
                  Replay Stagger Animation
                </Button>

                <div className="flex gap-4" key={staggerKey}>
                  {staggerIcons.map(({ Icon, color }, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20, scale: 0 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                      }}
                      className="p-3 rounded-lg bg-white/5"
                    >
                      <Icon size={32} className={color} />
                    </motion.div>
                  ))}
                </div>

                <div className="text-xs font-mono bg-gray-800 px-3 py-2 rounded">
                  delay: index * 0.1 (100ms between each)
                </div>
              </div>
            </div>
          </div>

          {/* 3. Spring Physics */}
          <div className="mb-10">
            <h3 className="text-lg font-semibold mb-4 text-brand-dark dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center">3</span>
              Spring Physics
            </h3>
            <p className="text-muted-foreground mb-4">Natural, physics-based animations with configurable stiffness, damping, and mass.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bouncy */}
              <div className="p-6 rounded-lg bg-white/5 border border-white/10">
                <div className="flex flex-col items-center gap-4">
                  <motion.button
                    className="p-4 rounded-full bg-red-500/20"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <Heart size={32} className="text-red-500" />
                  </motion.button>
                  <span className="text-sm text-muted-foreground">Bouncy (high stiffness, low damping)</span>
                  <span className="text-xs font-mono bg-gray-800 px-2 py-1 rounded">stiffness: 400, damping: 10</span>
                </div>
              </div>

              {/* Smooth */}
              <div className="p-6 rounded-lg bg-white/5 border border-white/10">
                <div className="flex flex-col items-center gap-4">
                  <motion.button
                    className="p-4 rounded-full bg-blue-500/20"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 100, damping: 15 }}
                  >
                    <Globe size={32} className="text-blue-500" />
                  </motion.button>
                  <span className="text-sm text-muted-foreground">Smooth (low stiffness, high damping)</span>
                  <span className="text-xs font-mono bg-gray-800 px-2 py-1 rounded">stiffness: 100, damping: 15</span>
                </div>
              </div>

              {/* Wobbly */}
              <div className="p-6 rounded-lg bg-white/5 border border-white/10">
                <div className="flex flex-col items-center gap-4">
                  <motion.button
                    className="p-4 rounded-full bg-yellow-500/20"
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    whileTap={{ scale: 0.8, rotate: -10 }}
                    transition={{ type: "spring", stiffness: 300, damping: 5 }}
                  >
                    <Gift size={32} className="text-yellow-500" />
                  </motion.button>
                  <span className="text-sm text-muted-foreground">Wobbly (very low damping)</span>
                  <span className="text-xs font-mono bg-gray-800 px-2 py-1 rounded">stiffness: 300, damping: 5</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Gesture-Based Interactions */}
          <div className="mb-10">
            <h3 className="text-lg font-semibold mb-4 text-brand-dark dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center">4</span>
              Gesture-Based Interactions
            </h3>
            <p className="text-muted-foreground mb-4">Drag, swipe, and touch interactions that respond to user gestures.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Draggable Icon */}
              <div className="p-6 rounded-lg bg-white/5 border border-white/10">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-full h-32 bg-gray-800/50 rounded-lg relative flex items-center justify-center overflow-hidden">
                    <motion.div
                      drag
                      dragConstraints={{ left: -100, right: 100, top: -40, bottom: 40 }}
                      dragElastic={0.1}
                      whileDrag={{ scale: 1.2 }}
                      className="p-3 rounded-full bg-primary cursor-grab active:cursor-grabbing"
                    >
                      <Sparkles size={28} className="text-white" />
                    </motion.div>
                    <span className="absolute bottom-2 text-xs text-gray-500">Drag me around!</span>
                  </div>
                  <span className="text-xs font-mono bg-gray-800 px-2 py-1 rounded">drag + dragConstraints</span>
                </div>
              </div>

              {/* Swipe to Action */}
              <div className="p-6 rounded-lg bg-white/5 border border-white/10">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-full h-32 bg-gray-800/50 rounded-lg relative flex items-center justify-center overflow-hidden">
                    <motion.div
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      onDragEnd={(_, info) => {
                        if (info.offset.x > 100) {
                          setIsLiked(true);
                        } else if (info.offset.x < -100) {
                          setIsLiked(false);
                        }
                      }}
                      className={`p-4 rounded-full cursor-grab active:cursor-grabbing transition-colors ${
                        isLiked ? "bg-red-500" : "bg-gray-600"
                      }`}
                    >
                      <Heart size={32} className="text-white" fill={isLiked ? "white" : "none"} />
                    </motion.div>
                    <div className="absolute left-4 text-green-500 text-xs">← Like</div>
                    <div className="absolute right-4 text-red-400 text-xs">Unlike →</div>
                  </div>
                  <span className="text-xs font-mono bg-gray-800 px-2 py-1 rounded">Swipe left/right to toggle</span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. SVG Morphing */}
          <div className="mb-10">
            <h3 className="text-lg font-semibold mb-4 text-brand-dark dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center">5</span>
              SVG Morphing
            </h3>
            <p className="text-muted-foreground mb-4">Smooth transitions between different icon shapes using path interpolation.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Heart to Star Morph */}
              <div className="p-6 rounded-lg bg-white/5 border border-white/10">
                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={() => setMorphState(s => s === "heart" ? "star" : "heart")}
                    className="p-4 rounded-full bg-pink-500/20 hover:bg-pink-500/30 transition-colors"
                  >
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-pink-500">
                      <motion.path
                        fill="currentColor"
                        animate={{
                          d: morphState === "heart"
                            ? "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                            : "M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                        }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                      />
                    </svg>
                  </button>
                  <span className="text-sm text-muted-foreground">Heart ↔ Star</span>
                  <span className="text-xs font-mono bg-gray-800 px-2 py-1 rounded">animate d attribute</span>
                </div>
              </div>

              {/* Menu to X Morph */}
              <div className="p-6 rounded-lg bg-white/5 border border-white/10">
                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-4 rounded-full bg-gray-500/20 hover:bg-gray-500/30 transition-colors"
                  >
                    <svg width="48" height="48" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" className="text-white">
                      <motion.line
                        x1="4" x2="20"
                        animate={{
                          y1: isMenuOpen ? 12 : 6,
                          y2: isMenuOpen ? 12 : 6,
                          rotate: isMenuOpen ? 45 : 0
                        }}
                        style={{ transformOrigin: "center" }}
                        transition={{ duration: 0.3 }}
                      />
                      <motion.line
                        x1="4" y1="12" x2="20" y2="12"
                        animate={{ opacity: isMenuOpen ? 0 : 1, scaleX: isMenuOpen ? 0 : 1 }}
                        style={{ transformOrigin: "center" }}
                        transition={{ duration: 0.2 }}
                      />
                      <motion.line
                        x1="4" x2="20"
                        animate={{
                          y1: isMenuOpen ? 12 : 18,
                          y2: isMenuOpen ? 12 : 18,
                          rotate: isMenuOpen ? -45 : 0
                        }}
                        style={{ transformOrigin: "center" }}
                        transition={{ duration: 0.3 }}
                      />
                    </svg>
                  </button>
                  <span className="text-sm text-muted-foreground">Menu ↔ Close</span>
                  <span className="text-xs font-mono bg-gray-800 px-2 py-1 rounded">Line position + rotation</span>
                </div>
              </div>
            </div>
          </div>

          {/* 6. Particle Effects */}
          <div className="mb-10">
            <h3 className="text-lg font-semibold mb-4 text-brand-dark dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center">6</span>
              Particle & Confetti Effects
            </h3>
            <p className="text-muted-foreground mb-4">Celebratory effects that burst from icons on interaction.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Confetti Burst */}
              <div className="p-6 rounded-lg bg-white/5 border border-white/10">
                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={triggerConfetti}
                    className="relative p-4 rounded-full bg-amber-500/20 hover:bg-amber-500/30 transition-colors"
                  >
                    <Trophy size={40} className="text-amber-500" />
                    <AnimatePresence>
                      {showConfetti && (
                        <>
                          {Array.from({ length: 12 }).map((_, i) => (
                            <Particle key={i} index={i} originX={confettiOrigin.x} originY={confettiOrigin.y} />
                          ))}
                        </>
                      )}
                    </AnimatePresence>
                  </button>
                  <span className="text-sm text-muted-foreground">Click for confetti!</span>
                  <span className="text-xs font-mono bg-gray-800 px-2 py-1 rounded">12 particles with random angles</span>
                </div>
              </div>

              {/* Rocket Launch */}
              <div className="p-6 rounded-lg bg-white/5 border border-white/10">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-32 w-full relative flex items-end justify-center overflow-hidden bg-gray-800/30 rounded-lg">
                    <motion.button
                      onClick={() => {
                        setRocketLaunched(true);
                        setTimeout(() => setRocketLaunched(false), 1500);
                      }}
                      animate={rocketLaunched ? { y: -150, opacity: [1, 1, 0] } : { y: 0, opacity: 1 }}
                      transition={{ duration: 1, ease: "easeIn" }}
                      className="p-3 rounded-full bg-orange-500/20 mb-4"
                    >
                      <Rocket size={32} className="text-orange-500" />
                    </motion.button>
                    {rocketLaunched && (
                      <motion.div
                        className="absolute bottom-8 left-1/2 -translate-x-1/2"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 2], y: [0, 20, 40] }}
                        transition={{ duration: 0.8 }}
                      >
                        <div className="w-4 h-4 rounded-full bg-orange-500/50 blur-sm" />
                      </motion.div>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">Click to launch!</span>
                  <span className="text-xs font-mono bg-gray-800 px-2 py-1 rounded">y: -150 + trail effect</span>
                </div>
              </div>
            </div>
          </div>

          {/* 7. Micro-interactions */}
          <div className="mb-10">
            <h3 className="text-lg font-semibold mb-4 text-brand-dark dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center">7</span>
              Micro-Interactions
            </h3>
            <p className="text-muted-foreground mb-4">Subtle feedback animations for common UI patterns.</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Search Focus */}
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex flex-col items-center gap-3">
                  <motion.div
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 border border-white/10 w-full"
                    whileFocus={{ borderColor: "rgba(139, 92, 246, 0.5)", scale: 1.02 }}
                  >
                    <MotionSearch
                      size={18}
                      className="text-gray-400"
                      whileHover={{ scale: 1.2, rotate: -10 }}
                    />
                    <input
                      type="text"
                      placeholder="Search..."
                      className="bg-transparent text-sm outline-none w-full text-white"
                    />
                  </motion.div>
                  <span className="text-xs text-muted-foreground">Search</span>
                </div>
              </div>

              {/* Password Toggle */}
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 border border-white/10 w-full">
                    <Lock size={18} className="text-gray-400" />
                    <input
                      type={isPasswordVisible ? "text" : "password"}
                      value="password123"
                      readOnly
                      className="bg-transparent text-sm outline-none w-full text-white"
                    />
                    <motion.button
                      onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                      whileTap={{ scale: 0.8 }}
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={isPasswordVisible ? "visible" : "hidden"}
                          initial={{ opacity: 0, rotate: -90 }}
                          animate={{ opacity: 1, rotate: 0 }}
                          exit={{ opacity: 0, rotate: 90 }}
                          transition={{ duration: 0.15 }}
                        >
                          <Eye size={18} className={isPasswordVisible ? "text-primary" : "text-gray-400"} />
                        </motion.div>
                      </AnimatePresence>
                    </motion.button>
                  </div>
                  <span className="text-xs text-muted-foreground">Password</span>
                </div>
              </div>

              {/* Add Button */}
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex flex-col items-center gap-3">
                  <motion.button
                    className="p-3 rounded-full bg-primary"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Plus size={24} className="text-white" />
                  </motion.button>
                  <span className="text-xs text-muted-foreground">Add</span>
                </div>
              </div>

              {/* Arrow Hover */}
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex flex-col items-center gap-3">
                  <motion.button
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm"
                    whileHover="hover"
                  >
                    Continue
                    <motion.div
                      variants={{
                        hover: { x: 5 }
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <ArrowRight size={16} />
                    </motion.div>
                  </motion.button>
                  <span className="text-xs text-muted-foreground">CTA Button</span>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Code Examples */}
          <div className="p-6 rounded-lg bg-gray-900 border border-white/10">
            <h3 className="text-lg font-semibold mb-4 text-white">
              Advanced Animation Code
            </h3>
            <pre className="text-sm text-gray-300 overflow-x-auto">
              <code>{`// Path Drawing Animation
<motion.path
  d="M20 6L9 17l-5-5"
  initial={{ pathLength: 0 }}
  animate={{ pathLength: 1 }}
  transition={{ duration: 0.5 }}
/>

// Stagger Children
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

// Spring Physics
<motion.div
  whileHover={{ scale: 1.2 }}
  transition={{ type: "spring", stiffness: 400, damping: 10 }}
/>

// SVG Path Morphing
<motion.path
  animate={{
    d: isHeart
      ? "M20.84 4.61a5.5 5.5 0 0 0-7.78..." // heart
      : "M12 2L15.09 8.26L22 9.27..."       // star
  }}
  transition={{ duration: 0.5 }}
/>

// Drag Gesture
<motion.div
  drag
  dragConstraints={{ left: -100, right: 100 }}
  dragElastic={0.1}
  whileDrag={{ scale: 1.2 }}
/>`}</code>
            </pre>
          </div>
        </section>

        <section className="mt-10">
          <ExampleUsage />
        </section>
      </main>

      {/* Add Reminder Modal */}
      <AddReminderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        campaignTitle="Support John's Fight Against Cancer"
        campaignEndDate={new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)}
        campaignUrl="https://www.fundbrave.com/campaign/supportjohnsfightagainscancer"
        onReminderSet={handleProviderSelect}
      />

      {/* CreatePost Popup */}
      {/*
       <CreatePost
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onPublish={handlePublish}
      /> 
      */}

      {/* ShareCampaignModal */}
      <ShareCampaignModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        campaignUrl="https://www.fundbrave.com/campaign/supportjohnsfightagainscancer"
        campaignTitle="Support John's Fight Against Cancer"
      />
    </>
  );
};

export default ThemePage;
