const BLOG_CHANGED_EVENT = "stackly:blog-changed";

export function notifyBlogChanged(workspaceId?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(BLOG_CHANGED_EVENT, {
      detail: { workspaceId },
    })
  );
}

export function onBlogChanged(callback: (workspaceId?: string) => void) {
  if (typeof window === "undefined") return () => {};

  const handler = (event: Event) => {
    const detail = (event as CustomEvent<{ workspaceId?: string }>).detail;
    callback(detail?.workspaceId);
  };

  window.addEventListener(BLOG_CHANGED_EVENT, handler);
  return () => window.removeEventListener(BLOG_CHANGED_EVENT, handler);
}
