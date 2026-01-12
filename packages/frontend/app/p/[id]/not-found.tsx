import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";

/**
 * PostNotFound - 404 page for post detail
 */
export default function PostNotFound() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-surface-sunken border border-border-subtle mb-6">
          <FileQuestion size={40} className="text-foreground-muted" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground mb-3">
          Post Not Found
        </h1>

        {/* Description */}
        <p className="text-foreground-muted mb-8 leading-relaxed">
          This post may have been deleted or you don't have permission to view it.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
          >
            <ArrowLeft size={18} />
            Return to Feed
          </Link>
        </div>

        {/* Additional Help */}
        <div className="mt-8 pt-8 border-t border-border-subtle">
          <p className="text-sm text-foreground-muted">
            Need help?{" "}
            <Link
              href="/help"
              className="text-primary-400 hover:text-primary-300 underline transition-colors"
            >
              Visit our Help Center
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
