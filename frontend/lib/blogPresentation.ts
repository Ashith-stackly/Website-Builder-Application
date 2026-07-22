type BlogPreview = {
  content?: string;
  excerpt?: string;
  seoDescription?: string;
  publishedAt?: string;
  createdAt: string;
};

export function formatBlogDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export function getBlogExcerpt(blog: BlogPreview, maxLength = 180): string {
  const source = blog.excerpt || blog.seoDescription || ("content" in blog ? blog.content : "") || "";
  const text = source.replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).replace(/\s+\S*$/, "")}...`;
}

export function getReadingTime(content?: string): string {
  const words = (content || "").trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 220));
  return `${minutes} min read`;
}

export function getPublishDate(blog: BlogPreview): string {
  return formatBlogDate(blog.publishedAt || blog.createdAt);
}
