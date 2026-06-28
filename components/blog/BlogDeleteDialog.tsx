"use client";

interface BlogDeleteDialogProps {
  blogTitle: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirmation modal shown before deleting a blog post.
 * Renders as a centered overlay with backdrop.
 */
export default function BlogDeleteDialog({
  blogTitle,
  isDeleting,
  onConfirm,
  onCancel,
}: BlogDeleteDialogProps) {
  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onCancel();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="blog-delete-dialog-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in">
        <h2
          id="blog-delete-dialog-title"
          className="text-lg font-bold text-slate-900 m-0"
        >
          Delete Blog Post
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-slate-800">
            &ldquo;{blogTitle}&rdquo;
          </span>
          ? This action cannot be undone.
        </p>
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 border border-red-600 hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting…
              </>
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes animate-in-keyframes {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-in {
          animation: animate-in-keyframes 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
