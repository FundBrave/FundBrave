"use client";

/**
 * /campaigns/create — 3-step campaign wizard (Basics → Media → Review).
 *
 * Draft lifecycle: the draft is POSTed on the first successful step-1 "Next",
 * then PATCHed on later saves. `?draft=<id>` loads an existing campaign into
 * the wizard (drafts are fully editable; published campaigns only allow
 * story + media changes).
 */

import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api";
import {
  CATEGORIES,
  MAX_MEDIA_ITEMS,
  type Campaign,
  type CampaignStatus,
  type CreateCampaignInput,
  type MediaType,
  type UpdateCampaignInput,
  categoryLabel,
  formatUsd,
  validateMediaFile,
} from "@/lib/campaigns";
import {
  useCreateCampaign,
  useMyCampaigns,
  usePublishCampaign,
  useUpdateCampaign,
  useUploadMedia,
} from "@/hooks/useCampaigns";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { InputField, TextAreaField } from "@/components/ui/form/FormFields";
import {
  CampaignImage,
  CATEGORY_ICONS,
  MediaPlaceholder,
} from "@/components/campaigns/CampaignCard";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Grid3X3,
  Play,
  Trash2,
  Upload,
  X,
} from "@/components/ui/icons";

// ============================================================================
// Constants + validation
// ============================================================================

const STEPS = [
  { n: 1, label: "Basics" },
  { n: 2, label: "Media" },
  { n: 3, label: "Review" },
] as const;

const TITLE_MIN = 5;
const TITLE_MAX = 80;
const DESC_MIN = 20;
const DESC_MAX = 10000;
const GOAL_MIN = 10;
const GOAL_MAX = 10_000_000;

interface FormState {
  title: string;
  category: string;
  goalUsd: string; // raw input
  deadline: string; // yyyy-mm-dd or ""
  description: string;
}

interface FormErrors {
  title?: string;
  category?: string;
  goalUsd?: string;
  deadline?: string;
  description?: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  category: "",
  goalUsd: "",
  deadline: "",
  description: "",
};

/** yyyy-mm-dd → ISO at end of that local day. */
function toDeadlineIso(dateInput: string): string {
  return new Date(`${dateInput}T23:59:00`).toISOString();
}

/** ISO → yyyy-mm-dd for the native date input. */
function toDateInputValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function validateStep1(form: FormState): FormErrors {
  const errors: FormErrors = {};

  const title = form.title.trim();
  if (title.length < TITLE_MIN || title.length > TITLE_MAX) {
    errors.title = `Title must be ${TITLE_MIN}-${TITLE_MAX} characters`;
  }

  if (!CATEGORIES.some((c) => c.slug === form.category)) {
    errors.category = "Pick a category";
  }

  const goal = Number.parseFloat(form.goalUsd);
  if (!Number.isFinite(goal) || goal < GOAL_MIN || goal > GOAL_MAX) {
    errors.goalUsd = `Goal must be between $${GOAL_MIN.toLocaleString()} and $${GOAL_MAX.toLocaleString()}`;
  }

  if (form.deadline) {
    const ts = new Date(`${form.deadline}T23:59:00`).getTime();
    if (Number.isNaN(ts)) {
      errors.deadline = "Invalid date";
    } else if (ts < Date.now() + 24 * 60 * 60 * 1000) {
      errors.deadline = "Deadline must be more than 24 hours away";
    } else if (ts > Date.now() + 365 * 24 * 60 * 60 * 1000) {
      errors.deadline = "Deadline must be within one year";
    }
  }

  const desc = form.description.trim();
  if (desc.length < DESC_MIN || desc.length > DESC_MAX) {
    errors.description = `Description must be ${DESC_MIN}-${DESC_MAX.toLocaleString()} characters`;
  }

  return errors;
}

// ============================================================================
// Media items
// ============================================================================

interface DraftMediaItem {
  localId: string;
  type: MediaType;
  /** publicUrl once uploaded */
  url: string | null;
  fileName: string;
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
}

function makeLocalId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `m-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function fileNameFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    return decodeURIComponent(path.split("/").pop() ?? "media");
  } catch {
    return "media";
  }
}

// ============================================================================
// Steps indicator
// ============================================================================

function StepsIndicator({
  current,
  onStepClick,
}: {
  current: number;
  onStepClick: (step: number) => void;
}) {
  return (
    <ol className="flex items-center justify-center gap-0" aria-label="Steps">
      {STEPS.map((step, index) => {
        const done = current > step.n;
        const active = current === step.n;
        return (
          <li key={step.n} className="flex items-center">
            {index > 0 && (
              <span
                aria-hidden="true"
                className={cn(
                  "mx-2 h-px w-8 sm:w-16",
                  done || active ? "bg-primary" : "bg-white/10"
                )}
              />
            )}
            <button
              type="button"
              onClick={() => done && onStepClick(step.n)}
              disabled={!done}
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-full px-2 py-1",
                done && "cursor-pointer",
                !done && "cursor-default"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  active &&
                    "bg-[linear-gradient(90deg,var(--color-primary)_0%,var(--color-purple-500)_100%)] text-white",
                  done && "bg-primary/20 text-primary-200",
                  !active && !done && "bg-surface-elevated text-text-tertiary"
                )}
              >
                {done ? <Check size={16} aria-hidden="true" /> : step.n}
              </span>
              <span
                className={cn(
                  "text-sm",
                  active
                    ? "font-semibold text-foreground"
                    : "text-text-secondary"
                )}
              >
                {step.label}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

// ============================================================================
// Wizard
// ============================================================================

function CreateCampaignWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const draftParam = searchParams.get("draft");

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [media, setMedia] = useState<DraftMediaItem[]>([]);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [campaignStatus, setCampaignStatus] =
    useState<CampaignStatus>("DRAFT");
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const hydratedRef = useRef(false);

  const createMutation = useCreateCampaign();
  const updateMutation = useUpdateCampaign();
  const publishMutation = usePublishCampaign();
  const uploadMedia = useUploadMedia();

  const isLive = campaignStatus === "ACTIVE";

  // ------------------------------------------------------------------
  // Hydrate from ?draft=<id>
  // ------------------------------------------------------------------
  const myCampaigns = useMyCampaigns(!!draftParam);

  useEffect(() => {
    if (!draftParam || hydratedRef.current || !myCampaigns.data) return;
    hydratedRef.current = true;

    const existing = myCampaigns.data.find((c) => c.id === draftParam);
    if (!existing) {
      showToast("We could not find that campaign draft.", "error");
      return;
    }

    setDraftId(existing.id);
    setSlug(existing.slug);
    setCampaignStatus(existing.status);
    setForm({
      title: existing.title,
      category: existing.category,
      goalUsd: existing.goalUsd,
      deadline: existing.deadline ? toDateInputValue(existing.deadline) : "",
      description: existing.description,
    });
    setMedia(
      [...existing.media]
        .sort((a, b) => a.order - b.order)
        .map((m) => ({
          localId: m.id,
          type: m.type,
          url: m.url,
          fileName: fileNameFromUrl(m.url),
          progress: 100,
          status: "done" as const,
        }))
    );
  }, [draftParam, myCampaigns.data, showToast]);

  // ------------------------------------------------------------------
  // Saving
  // ------------------------------------------------------------------
  const doneMedia = media.filter(
    (m): m is DraftMediaItem & { url: string } =>
      m.status === "done" && !!m.url
  );
  const doneImages = doneMedia.filter((m) => m.type === "IMAGE");
  const uploadsInFlight = media.some((m) => m.status === "uploading");

  const mediaPayload = useCallback(
    () =>
      doneMedia.map((m, index) => ({
        type: m.type,
        url: m.url,
        order: index,
      })),
    [doneMedia]
  );

  /** POST on first save, PATCH afterwards. Throws on failure. */
  const saveDraft = useCallback(async (): Promise<Campaign> => {
    if (!draftId) {
      const input: CreateCampaignInput = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        goalUsd: Number.parseFloat(form.goalUsd),
        media: mediaPayload(),
      };
      if (form.deadline) input.deadline = toDeadlineIso(form.deadline);
      const created = await createMutation.mutateAsync(input);
      setDraftId(created.id);
      setSlug(created.slug);
      setCampaignStatus(created.status);
      return created;
    }

    const input: UpdateCampaignInput = {
      description: form.description.trim(),
      media: mediaPayload(),
    };
    if (!isLive) {
      input.title = form.title.trim();
      input.category = form.category;
      input.goalUsd = Number.parseFloat(form.goalUsd);
      if (form.deadline) input.deadline = toDeadlineIso(form.deadline);
    }
    const updated = await updateMutation.mutateAsync({ id: draftId, input });
    setSlug(updated.slug);
    setCampaignStatus(updated.status);
    return updated;
  }, [draftId, form, isLive, mediaPayload, createMutation, updateMutation]);

  const errorMessage = (err: unknown): string =>
    err instanceof Error ? err.message : "Something went wrong. Try again.";

  // ------------------------------------------------------------------
  // Step handlers
  // ------------------------------------------------------------------
  const handleStep1Next = async () => {
    const nextErrors = validateStep1(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    try {
      await saveDraft();
      setStep(2);
      window.scrollTo({ top: 0 });
    } catch (err) {
      showToast(errorMessage(err), "error", 6000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStep2Next = async () => {
    if (uploadsInFlight) {
      showToast("Please wait for uploads to finish.", "info");
      return;
    }
    setIsSaving(true);
    try {
      await saveDraft();
      setStep(3);
      window.scrollTo({ top: 0 });
    } catch (err) {
      showToast(errorMessage(err), "error", 6000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      await saveDraft();
      showToast("Draft saved.", "success");
    } catch (err) {
      showToast(errorMessage(err), "error", 6000);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (doneImages.length === 0) {
      showToast("Add at least one image before publishing.", "error");
      setStep(2);
      return;
    }
    if (uploadsInFlight) {
      showToast("Please wait for uploads to finish.", "info");
      return;
    }

    setIsPublishing(true);
    try {
      const saved = await saveDraft();
      if (saved.status === "ACTIVE") {
        // Already published — just resave story/media and go view it.
        showToast("Changes saved.", "success");
        router.push(`/campaigns/${saved.slug}`);
        return;
      }
      const published = await publishMutation.mutateAsync(saved.id);
      showToast("Your campaign is live!", "success");
      router.push(`/campaigns/${published.slug}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        showToast(
          `${err.message} Your draft is saved — you can retry publishing anytime.`,
          "error",
          9000
        );
      } else {
        showToast(errorMessage(err), "error", 6000);
      }
    } finally {
      setIsPublishing(false);
    }
  };

  // ------------------------------------------------------------------
  // Media handlers
  // ------------------------------------------------------------------
  const updateMediaItem = useCallback(
    (localId: string, patch: Partial<DraftMediaItem>) => {
      setMedia((prev) =>
        prev.map((m) => (m.localId === localId ? { ...m, ...patch } : m))
      );
    },
    []
  );

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const incoming = Array.from(files);
      const room = MAX_MEDIA_ITEMS - media.length;
      if (incoming.length > room) {
        showToast(
          `You can add up to ${MAX_MEDIA_ITEMS} files per campaign.`,
          "warning"
        );
      }

      for (const file of incoming.slice(0, Math.max(0, room))) {
        const check = validateMediaFile(file);
        if (!check.ok) {
          showToast(`${file.name}: ${check.error}`, "error", 6000);
          continue;
        }
        const localId = makeLocalId();
        setMedia((prev) => [
          ...prev,
          {
            localId,
            type: check.type,
            url: null,
            fileName: file.name,
            progress: 0,
            status: "uploading",
          },
        ]);
        void uploadMedia(file, (percent) =>
          updateMediaItem(localId, { progress: percent })
        )
          .then((result) =>
            updateMediaItem(localId, {
              url: result.url,
              status: "done",
              progress: 100,
            })
          )
          .catch((err: unknown) => {
            const message =
              err instanceof Error ? err.message : "Upload failed";
            updateMediaItem(localId, { status: "error", error: message });
            showToast(`${file.name}: ${message}`, "error", 6000);
          });
      }
    },
    [media.length, showToast, uploadMedia, updateMediaItem]
  );

  const moveMedia = (index: number, direction: -1 | 1) => {
    setMedia((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const a = next[index];
      next[index] = next[target];
      next[target] = a;
      return next;
    });
  };

  const removeMedia = (localId: string) => {
    setMedia((prev) => prev.filter((m) => m.localId !== localId));
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    if (event.dataTransfer.files.length > 0) addFiles(event.dataTransfer.files);
  };

  // ------------------------------------------------------------------
  // Loading state while hydrating an existing draft
  // ------------------------------------------------------------------
  if (draftParam && !hydratedRef.current) {
    if (myCampaigns.isLoading || myCampaigns.isPending) {
      return (
        <div
          className="flex min-h-[60vh] items-center justify-center"
          role="status"
          aria-label="Loading your draft"
        >
          <Spinner size="lg" color="primary" />
        </div>
      );
    }
    if (myCampaigns.isError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="max-w-sm text-text-secondary">
            We could not load your campaigns.
          </p>
          <Button variant="outline" onClick={() => myCampaigns.refetch()}>
            Try again
          </Button>
        </div>
      );
    }
  }

  const firstImageIndex = media.findIndex(
    (m) => m.type === "IMAGE" && m.status === "done"
  );

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12"
    >
      <h1 className="text-center text-3xl font-bold text-foreground">
        {draftId
          ? isLive
            ? "Edit campaign"
            : "Finish your campaign"
          : "Start a campaign"}
      </h1>

      <div className="mt-6">
        <StepsIndicator current={step} onStepClick={setStep} />
      </div>

      {isLive && (
        <p className="mt-6 rounded-xl border border-brave-amber/30 bg-brave-amber/10 px-4 py-3 text-sm text-brave-amber">
          This campaign is live — only the story and media can be edited.
        </p>
      )}

      {/* ============================== STEP 1 ============================== */}
      {step === 1 && (
        <section className="mt-8 flex flex-col gap-6" aria-label="Basics">
          {isLive ? (
            <div className="flex flex-col gap-2">
              <span className="font-['Poppins'] text-[14px] font-medium tracking-[0.72px] text-foreground sm:text-[16px]">
                Campaign title
              </span>
              <input
                type="text"
                value={form.title}
                disabled
                aria-label="Campaign title (locked after publishing)"
                className="h-12 w-full cursor-not-allowed rounded-[12px] bg-gray-100 px-4 font-['Poppins'] text-[14px] font-medium text-foreground opacity-50 outline-none sm:h-14 sm:rounded-[16px] sm:text-[15px] dark:bg-neutral-dark-400"
              />
            </div>
          ) : (
            <InputField
              label="Campaign title"
              value={form.title}
              onChange={(title) => setForm((f) => ({ ...f, title }))}
              placeholder="Give your campaign a clear, short title"
              required
              maxLength={TITLE_MAX}
              showCharacterCount
              error={errors.title}
            />
          )}

          {/* Category chip grid */}
          <div className="flex flex-col gap-2">
            <span className="font-['Poppins'] text-[14px] font-medium tracking-[0.72px] text-foreground sm:text-[16px]">
              Category
            </span>
            <div
              role="radiogroup"
              aria-label="Category"
              className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5"
            >
              {CATEGORIES.map((category) => {
                const Icon = CATEGORY_ICONS[category.slug] ?? Grid3X3;
                const selected = form.category === category.slug;
                return (
                  <button
                    key={category.slug}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={isLive}
                    onClick={() =>
                      setForm((f) => ({ ...f, category: category.slug }))
                    }
                    className={cn(
                      "flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
                      selected
                        ? "border-primary bg-primary/15 font-medium text-foreground"
                        : "border-white/10 bg-surface-elevated text-text-secondary hover:border-white/20 hover:text-foreground",
                      isLive && "cursor-not-allowed opacity-50"
                    )}
                  >
                    <Icon size={16} aria-hidden="true" />
                    <span className="truncate">{category.label}</span>
                  </button>
                );
              })}
            </div>
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category}</p>
            )}
          </div>

          {/* Goal + deadline */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="goal-usd"
                className="font-['Poppins'] text-[14px] font-medium tracking-[0.72px] text-foreground sm:text-[16px]"
              >
                Goal (USD)
              </label>
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-text-secondary"
                >
                  $
                </span>
                <input
                  id="goal-usd"
                  type="number"
                  inputMode="decimal"
                  min={GOAL_MIN}
                  max={GOAL_MAX}
                  step="1"
                  value={form.goalUsd}
                  disabled={isLive}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, goalUsd: e.target.value }))
                  }
                  placeholder="5000"
                  className={cn(
                    "h-12 w-full rounded-[12px] bg-gray-100 pr-4 pl-8 text-foreground outline-none sm:h-14 sm:rounded-[16px] dark:bg-neutral-dark-400",
                    "font-['Poppins'] text-[14px] font-medium placeholder:text-text-secondary sm:text-[15px]",
                    "focus:ring-2 focus:ring-purple-500/50 focus:ring-opacity-50 transition-all",
                    errors.goalUsd && "ring-2 ring-destructive/50",
                    isLive && "cursor-not-allowed opacity-50"
                  )}
                />
              </div>
              {errors.goalUsd && (
                <p className="text-sm text-destructive">{errors.goalUsd}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="deadline"
                className="font-['Poppins'] text-[14px] font-medium tracking-[0.72px] text-foreground sm:text-[16px]"
              >
                Deadline{" "}
                <span className="font-normal text-text-tertiary">
                  (optional)
                </span>
              </label>
              <input
                id="deadline"
                type="date"
                value={form.deadline}
                disabled={isLive}
                onChange={(e) =>
                  setForm((f) => ({ ...f, deadline: e.target.value }))
                }
                className={cn(
                  "h-12 w-full rounded-[12px] bg-gray-100 px-4 text-foreground outline-none sm:h-14 sm:rounded-[16px] dark:bg-neutral-dark-400",
                  "font-['Poppins'] text-[14px] font-medium sm:text-[15px]",
                  "focus:ring-2 focus:ring-purple-500/50 transition-all",
                  "[color-scheme:dark]",
                  errors.deadline && "ring-2 ring-destructive/50",
                  isLive && "cursor-not-allowed opacity-50"
                )}
              />
              {errors.deadline && (
                <p className="text-sm text-destructive">{errors.deadline}</p>
              )}
            </div>
          </div>

          <TextAreaField
            label="Tell your story"
            value={form.description}
            onChange={(description) => setForm((f) => ({ ...f, description }))}
            placeholder="What are you raising funds for? Why does it matter? How will the money be used?"
            required
            showMediaActions={false}
            maxLength={DESC_MAX}
            minLength={DESC_MIN}
            showCharacterCount
            error={errors.description}
          />

          <div className="flex justify-end">
            <Button
              onClick={handleStep1Next}
              loading={isSaving}
              loadingText="Saving..."
              className="w-full sm:w-auto"
            >
              Next: Media
              <ArrowRight size={18} aria-hidden="true" />
            </Button>
          </div>
        </section>
      )}

      {/* ============================== STEP 2 ============================== */}
      {step === 2 && (
        <section className="mt-8 flex flex-col gap-6" aria-label="Media">
          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={cn(
              "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
              dragOver
                ? "border-primary bg-primary/10"
                : "border-white/10 bg-surface-elevated"
            )}
          >
            <Upload size={32} className="text-text-tertiary" aria-hidden="true" />
            <div>
              <p className="font-medium text-foreground">
                Drag and drop photos or videos
              </p>
              <p className="mt-1 text-sm text-text-tertiary">
                Images up to 10MB (JPEG, PNG, WebP, GIF) · videos up to 200MB
                (MP4, WebM) · max {MAX_MEDIA_ITEMS} files
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Browse files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {/* Media list */}
          {media.length > 0 && (
            <ul className="flex flex-col gap-3">
              {media.map((item, index) => (
                <li
                  key={item.localId}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-surface-elevated p-3"
                >
                  {/* Thumb */}
                  <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-sunken">
                    {item.status === "done" && item.url ? (
                      item.type === "IMAGE" ? (
                        <CampaignImage
                          src={item.url}
                          alt={item.fileName}
                          sizes="96px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-black/60">
                          <Play size={20} className="text-white" />
                        </div>
                      )
                    ) : item.status === "error" ? (
                      <div className="flex h-full w-full items-center justify-center">
                        <X size={20} className="text-destructive" />
                      </div>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Spinner size="sm" color="primary" />
                      </div>
                    )}
                  </div>

                  {/* Name + progress */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm text-foreground">
                        {item.fileName}
                      </p>
                      {index === firstImageIndex && (
                        <span className="shrink-0 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary-200">
                          Cover
                        </span>
                      )}
                    </div>
                    {item.status === "uploading" && (
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="bg-progress-gradient h-full rounded-full transition-[width]"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                    {item.status === "error" && (
                      <p className="mt-1 truncate text-xs text-destructive">
                        {item.error ?? "Upload failed"}
                      </p>
                    )}
                    {item.status === "done" && (
                      <p className="mt-0.5 text-xs text-text-tertiary">
                        {item.type === "IMAGE" ? "Image" : "Video"}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveMedia(index, -1)}
                      disabled={index === 0}
                      aria-label={`Move ${item.fileName} up`}
                      className="flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-overlay hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                    >
                      <ChevronUp size={18} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveMedia(index, 1)}
                      disabled={index === media.length - 1}
                      aria-label={`Move ${item.fileName} down`}
                      className="flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-overlay hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                    >
                      <ChevronDown size={18} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeMedia(item.localId)}
                      aria-label={`Remove ${item.fileName}`}
                      className="flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-overlay hover:text-destructive"
                    >
                      <Trash2 size={18} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <p className="text-sm text-text-tertiary">
            The first image is used as your campaign cover. You need at least
            one image to publish.
          </p>

          <div className="flex flex-col-reverse justify-between gap-3 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="w-full sm:w-auto"
            >
              <ArrowLeft size={18} aria-hidden="true" />
              Back
            </Button>
            <Button
              onClick={handleStep2Next}
              loading={isSaving}
              loadingText="Saving..."
              disabled={uploadsInFlight}
              className="w-full sm:w-auto"
            >
              Next: Review
              <ArrowRight size={18} aria-hidden="true" />
            </Button>
          </div>
        </section>
      )}

      {/* ============================== STEP 3 ============================== */}
      {step === 3 && (
        <section
          className="mt-8 flex flex-col gap-6"
          aria-label="Review and publish"
        >
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface-elevated">
            {/* Cover preview */}
            <div className="relative h-48 w-full bg-surface-sunken sm:h-64">
              {doneImages.length > 0 ? (
                <CampaignImage
                  src={doneImages[0].url}
                  alt="Campaign cover"
                  sizes="(max-width: 768px) 100vw, 768px"
                />
              ) : (
                <MediaPlaceholder />
              )}
            </div>

            <div className="flex flex-col gap-4 p-5 sm:p-6">
              <div>
                <p className="text-xs font-semibold tracking-wide text-primary-300 uppercase">
                  {categoryLabel(form.category)}
                </p>
                <h2 className="mt-1 text-xl font-bold text-foreground">
                  {form.title.trim() || "Untitled campaign"}
                </h2>
              </div>

              <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-text-tertiary">Goal</dt>
                  <dd className="mt-0.5 font-semibold text-foreground">
                    {form.goalUsd ? formatUsd(form.goalUsd) : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-text-tertiary">Deadline</dt>
                  <dd className="mt-0.5 font-semibold text-foreground">
                    {form.deadline
                      ? new Date(
                          `${form.deadline}T23:59:00`
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "None"}
                  </dd>
                </div>
                <div>
                  <dt className="text-text-tertiary">Media</dt>
                  <dd className="mt-0.5 font-semibold text-foreground">
                    {doneImages.length}{" "}
                    {doneImages.length === 1 ? "image" : "images"}
                    {doneMedia.length - doneImages.length > 0 &&
                      `, ${doneMedia.length - doneImages.length} video${
                        doneMedia.length - doneImages.length === 1 ? "" : "s"
                      }`}
                  </dd>
                </div>
              </dl>

              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Story
                </h3>
                <p className="mt-1 line-clamp-6 text-sm whitespace-pre-wrap text-text-secondary">
                  {form.description.trim()}
                </p>
              </div>
            </div>
          </div>

          {doneImages.length === 0 && (
            <p className="rounded-xl border border-brave-amber/30 bg-brave-amber/10 px-4 py-3 text-sm text-brave-amber">
              Add at least one image in the Media step before publishing. You
              can still save this as a draft.
            </p>
          )}

          <p className="text-sm text-text-tertiary">
            Publishing creates a dedicated on-chain vault address for your
            campaign. This can take a few seconds.
          </p>

          <div className="flex flex-col-reverse justify-between gap-3 sm:flex-row sm:items-center">
            <Button
              variant="outline"
              onClick={() => setStep(2)}
              disabled={isSaving || isPublishing}
              className="w-full sm:w-auto"
            >
              <ArrowLeft size={18} aria-hidden="true" />
              Back
            </Button>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="secondary"
                onClick={handleSaveDraft}
                loading={isSaving}
                loadingText="Saving..."
                disabled={isPublishing}
                className="w-full sm:w-auto"
              >
                Save draft
              </Button>
              <Button
                onClick={handlePublish}
                loading={isPublishing}
                loadingText="Publishing..."
                disabled={isSaving}
                className="w-full sm:w-auto"
              >
                {isLive ? "Save changes" : "Publish campaign"}
              </Button>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

// ============================================================================
// Page
// ============================================================================

export default function CreateCampaignPage() {
  return (
    <AuthGuard requireOnboarded>
      <Suspense
        fallback={
          <div
            className="flex min-h-[60vh] items-center justify-center"
            role="status"
            aria-label="Loading"
          >
            <Spinner size="lg" color="primary" />
          </div>
        }
      >
        <CreateCampaignWizard />
      </Suspense>
    </AuthGuard>
  );
}
