"use client";

import { useState, useEffect, useCallback } from "react";
import { Moon, Sun, Settings, Eye } from "@/app/components/ui/icons";
import { cn } from "@/lib/utils";

// --- Types ---

type ThemeOption = "light" | "dark" | "system";
type FontSize = "small" | "medium" | "large";

interface AppearancePrefs {
  fontSize: FontSize;
  reducedMotion: boolean;
  highContrast: boolean;
  compactMode: boolean;
}

const STORAGE_KEY = "fundbrave-appearance";
const THEME_STORAGE_KEY = "fundbrave-theme";

const defaultPrefs: AppearancePrefs = {
  fontSize: "medium",
  reducedMotion: false,
  highContrast: false,
  compactMode: false,
};

const fontSizeMap: Record<FontSize, string> = {
  small: "text-sm",
  medium: "text-base",
  large: "text-lg",
};

// --- Toggle Switch ---

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        checked ? "bg-primary" : "bg-white/15"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block size-5 rounded-full bg-white shadow-md transition-transform duration-200",
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        )}
        style={{ marginTop: "2px" }}
      />
    </button>
  );
}

// --- Setting Row ---

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs text-text-tertiary">{description}</span>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// --- Section ---

function Section({
  legend,
  icon: Icon,
  children,
}: {
  legend: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="p-5 rounded-2xl border border-white/10 bg-surface-sunken/30">
      <legend className="sr-only">{legend}</legend>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={18} className="text-text-tertiary" />
        <h3 className="text-base font-semibold text-foreground">{legend}</h3>
      </div>
      <div className="divide-y divide-white/5">{children}</div>
    </fieldset>
  );
}

// --- Page ---

export default function AppearanceSettingsPage() {
  const [theme, setThemeState] = useState<ThemeOption>("dark");
  const [prefs, setPrefs] = useState<AppearancePrefs>(defaultPrefs);
  const [mounted, setMounted] = useState(false);

  // Load persisted preferences on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeOption | null;
    if (storedTheme) setThemeState(storedTheme);

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setPrefs({ ...defaultPrefs, ...JSON.parse(stored) });
    } catch { /* ignore corrupt data */ }

    setMounted(true);
  }, []);

  // Sync theme to ThemeProvider's storage + DOM
  const setTheme = useCallback((t: ThemeOption) => {
    setThemeState(t);
    localStorage.setItem(THEME_STORAGE_KEY, t);

    const root = document.documentElement;
    root.classList.remove("light", "dark");
    if (t === "system") {
      const sys = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(sys);
    } else {
      root.classList.add(t);
    }
  }, []);

  // Persist and apply appearance prefs
  const updatePref = useCallback(
    <K extends keyof AppearancePrefs>(key: K, value: AppearancePrefs[K]) => {
      setPrefs((prev) => {
        const next = { ...prev, [key]: value };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  // Apply root-level classes whenever prefs change
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;

    // Font size
    root.classList.remove("text-sm", "text-base", "text-lg");
    root.classList.add(fontSizeMap[prefs.fontSize]);

    // Reduced motion
    root.classList.toggle("reduce-motion", prefs.reducedMotion);

    // High contrast
    root.classList.toggle("high-contrast", prefs.highContrast);

    // Compact mode
    root.classList.toggle("compact", prefs.compactMode);
  }, [prefs, mounted]);

  // Avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-1">
          <div className="h-8 w-56 bg-surface-sunken rounded-lg animate-pulse" />
          <div className="h-5 w-72 bg-surface-sunken rounded-lg animate-pulse" />
        </header>
        <div className="h-48 rounded-2xl bg-surface-sunken/30 animate-pulse" />
        <div className="h-64 rounded-2xl bg-surface-sunken/30 animate-pulse" />
      </div>
    );
  }

  const themeOptions: { value: ThemeOption; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Settings },
  ];

  const fontOptions: { value: FontSize; label: string }[] = [
    { value: "small", label: "Small" },
    { value: "medium", label: "Medium" },
    { value: "large", label: "Large" },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <header className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-foreground">Appearance</h2>
        <p className="text-text-secondary">
          Customize how FundBrave looks and feels
        </p>
      </header>

      {/* Theme Section */}
      <Section legend="Theme" icon={Moon}>
        <div className="py-4">
          <p className="text-xs text-text-tertiary mb-3">
            Choose your preferred color scheme
          </p>
          <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Theme">
            {themeOptions.map(({ value, label, icon: Icon }) => {
              const selected = theme === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setTheme(value)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-white/10 bg-surface-sunken/20 text-text-secondary hover:border-white/20 hover:bg-surface-sunken/40"
                  )}
                >
                  <Icon size={22} className={selected ? "text-primary" : "text-text-tertiary"} />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </Section>

      {/* Font Size Section */}
      <Section legend="Font Size" icon={Settings}>
        <div className="py-4">
          <p className="text-xs text-text-tertiary mb-3">
            Adjust the base text size across the app
          </p>
          <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Font size">
            {fontOptions.map(({ value, label }) => {
              const selected = prefs.fontSize === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => updatePref("fontSize", value)}
                  className={cn(
                    "flex items-center justify-center px-4 py-3 rounded-xl border transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-white/10 bg-surface-sunken/20 text-text-secondary hover:border-white/20 hover:bg-surface-sunken/40"
                  )}
                >
                  <span
                    className={cn(
                      "font-medium",
                      value === "small" && "text-xs",
                      value === "medium" && "text-sm",
                      value === "large" && "text-base"
                    )}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </Section>

      {/* Accessibility Section */}
      <Section legend="Accessibility" icon={Eye}>
        <SettingRow
          label="Reduced motion"
          description="Minimize animations and transitions throughout the app"
        >
          <Toggle
            checked={prefs.reducedMotion}
            onChange={(v) => updatePref("reducedMotion", v)}
            label="Reduced motion"
          />
        </SettingRow>

        <SettingRow
          label="High contrast"
          description="Increase contrast for better readability"
        >
          <Toggle
            checked={prefs.highContrast}
            onChange={(v) => updatePref("highContrast", v)}
            label="High contrast"
          />
        </SettingRow>

        <SettingRow
          label="Compact mode"
          description="Reduce spacing and padding for a denser layout"
        >
          <Toggle
            checked={prefs.compactMode}
            onChange={(v) => updatePref("compactMode", v)}
            label="Compact mode"
          />
        </SettingRow>
      </Section>
    </div>
  );
}
