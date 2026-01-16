"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

import SignupPage from "./signup/page";
import LoginPage from "./login/page";
import AuthHero from "../components/auth/AuthHero";
import { AnimatePresence, motion, Variants, Transition } from "motion/react";
import { useAuth } from "../provider/AuthProvider";

interface AuthViewProps {
  key: "signup" | "login";
  render: (onToggle: () => void) => React.ReactNode;
}

const Page = () => {
  // We define these types to ensure type safety throughout the component.
  // Direction helps us determine animation direction for smooth transitions.
  type AuthViewKey = "signup" | "login";
  type Direction = 1 | -1;

  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [view, setView] = React.useState<AuthViewKey>("login");
  const [direction, setDirection] = React.useState<Direction>(1);

  // Redirect authenticated users to homepage
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/");
    }
  }, [isLoading, isAuthenticated, router]);

  // This function handles view changes and calculates the correct animation direction.
  // We prevent unnecessary re-renders by checking if the view is already active.
  const setActiveView = React.useCallback(
    (nextView: AuthViewKey) => {
      if (nextView === view) return;

      // Calculate direction: login (1) slides left-to-right, signup (-1) slides right-to-left
      setDirection(nextView === "login" ? 1 : -1);
      setView(nextView);
    },
    [view]
  );

  // Simple toggle between signup and login views for seamless UX
  const handleToggle = React.useCallback(() => {
    setActiveView(view === "signup" ? "login" : "signup");
  }, [setActiveView, view]);

  // To make our component cleaner and more scalable, we define the auth views
  // in a simple array of objects. This is a declarative approach that makes

  const authViews: AuthViewProps[] = [
    { key: "signup", render: (onToggle) => <SignupPage onToggle={onToggle} /> },
    { key: "login", render: (onToggle) => <LoginPage onToggle={onToggle} /> },
  ];

  // These variants define the smooth morphing animation for our progress dots.
  const dotVariants: Variants = {
    idle: {
      width: "0.625rem",
      backgroundColor: "#475569",
      scale: 1,
    },
    active: {
      width: "2rem",
      backgroundColor: "#8B5CF6", // Purple-500 for consistency
      scale: 1.1,
    },
    hover: {
      scale: 1.2,
      backgroundColor: "#64748B", // Slightly lighter on hover
    },
  };

  const dotTransition: Transition = {
    type: "spring",
    stiffness: 300,
    damping: 30,
    duration: 0.3,
  };

  const swipeVariants: Variants = {
    enter: (dir: Direction) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
      scale: 0.95, // Slight scale for depth
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: Direction) => ({
      zIndex: 0,
      x: dir > 0 ? "-100%" : "100%",
      opacity: 0,
      scale: 0.95, // Consistent scale for smooth exit
    }),
  };

  // Don't render auth page if user is authenticated or still loading
  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Redirecting...
  }

  return (
    <div className="flex h-dvh">
      <motion.aside
        className=" hidden h-full w-1/2 py-10 lg:flex flex-col auth-gradient items-center justify-between overflow-hidden relative"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="flex-1 flex items-center justify-center relative w-full">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={view}
              custom={direction}
              variants={swipeVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                type: "spring",
                stiffness: 480,
                damping: 32,
                mass: 0.8,
                opacity: { duration: 0.18 },
                duration: 0.2,
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <AuthHero variant={view === "login" ? "login" : "signup"} />
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.div
          className="flex justify-center items-center gap-3 z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          {authViews.map(({ key }) => (
            <motion.button
              key={key}
              onClick={() => setActiveView(key)}
              className="h-2.5 rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800"
              variants={dotVariants}
              initial="idle"
              animate={view === key ? "active" : "idle"}
              whileHover={view === key ? { scale: 1.1 } : "hover"}
              whileTap={{ scale: 0.95 }}
              transition={dotTransition}
              aria-label={`Switch to ${key} view`}
              aria-current={view === key ? 'true' : 'false'}
            />
          ))}
        </motion.div>
      </motion.aside>

      <main className="flex h-full w-full flex-col items-center justify-center overflow-hidden !overflow-y-hidden lg:w-1/2">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            className="size-full overflow-x-hidden overflow-auto 2xl:overflow-hidden"
            key={view} // Ensures form re-animates on view change
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
              opacity: { duration: 0.2 },
            }}
          >
            {view === "signup" ? (
              <SignupPage onToggle={handleToggle} />
            ) : (
              <LoginPage onToggle={handleToggle} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Page;
