"use client";

if (typeof window !== "undefined") {
  if (typeof Node !== "undefined") {
    const originalRemoveChild = Node.prototype.removeChild;
    Node.prototype.removeChild = function <T extends Node>(child: T): T {
      if (!child) return child;
      if (child.parentNode !== this) {
        if (child.parentNode) {
          try {
            return child.parentNode.removeChild(child) as T;
          } catch {
            return child;
          }
        }
        return child;
      }
      try {
        return originalRemoveChild.call(this, child) as T;
      } catch {
        return child;
      }
    };

    const originalInsertBefore = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function <T extends Node>(
      newNode: T,
      referenceNode: Node | null
    ): T {
      if (!newNode) return newNode;
      if (referenceNode && referenceNode.parentNode !== this) {
        if (referenceNode.parentNode) {
          try {
            return referenceNode.parentNode.insertBefore(newNode, referenceNode) as T;
          } catch {
            return newNode;
          }
        }
        return newNode;
      }
      try {
        return originalInsertBefore.call(this, newNode, referenceNode) as T;
      } catch {
        return newNode;
      }
    };
  }

  const isBenignDomError = (msg: unknown): boolean => {
    if (typeof msg !== "string") return false;
    return (
      msg.includes("removeChild") ||
      msg.includes("insertBefore") ||
      msg.includes("The node to be removed is not a child") ||
      msg.includes("NotFoundError")
    );
  };

  // Prevent benign React DOM unmount errors from triggering development overlays
  window.addEventListener(
    "error",
    (event) => {
      const msg = event?.message || event?.error?.message;
      if (isBenignDomError(msg)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );

  window.addEventListener(
    "unhandledrejection",
    (event) => {
      const reason = event?.reason;
      const msg = reason?.message || (typeof reason === "string" ? reason : "");
      if (isBenignDomError(msg)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );
}
