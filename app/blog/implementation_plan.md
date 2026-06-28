# Module 9: Blog & SEO Backend Integration

Integrate the existing blog frontend UI with backend APIs for full CRUD, slug-based routing, SEO metadata, and validation — while preserving all existing UI and styles.

## Key Architecture Constraints

> [!IMPORTANT]
> **Static Export**: The project uses `output: "export"` in `next.config.mjs`. This means:
> - No server-side `generateMetadata()` at runtime (only at build time)
> - Dynamic routes like `[slug]` require `generateStaticParams` for build, but we need runtime slug resolution
> - **Solution**: Use client-side routing with `useParams()` + client-side `<Head>` equivalent (updating `document.title` and meta tags via `useEffect`) for SEO on blog detail pages. Alternatively, we can remove `output: "export"` to enable SSR — but this would be a breaking change.

> [!IMPORTANT]
> **No UI Changes**: All existing blog page UI (`app/blog/page.tsx`, `components/blog/*`, `app/blog/blog.css`) will remain untouched. New pages (create, edit, manage, preview) and the API layer are additions only.

## Open Questions

> [!IMPORTANT]
> **Static Export vs SSR**: The project currently uses `output: "export"` (fully static site). For proper dynamic slug routing (`/blog/[slug]`) and server-side `generateMetadata()`, we'd need to remove this setting and switch to SSR/ISR mode. 
> 
> **Option A (Recommended)**: Keep static export. Use client-side routing for blog detail/edit pages. SEO meta tags will be set client-side via `useEffect` (works for users but not for crawlers without JS). Blog management pages (`/blog/manage`, `/blog/create`, `/blog/edit/[slug]`) are internal dashboard-style pages where SSR SEO is unnecessary.
> 
> **Option B**: Remove `output: "export"` from `next.config.mjs` to enable full SSR with `generateMetadata()`. This enables crawler-friendly SEO but changes the deployment model from static to server-rendered.
> 
> Which approach do you prefer?

---

## Proposed Changes

### Types Layer

#### [NEW] [blog.ts](file:///d:/stackly/Workplace/Website-Builder-Application/types/blog.ts)
- `Blog` interface with all fields (`_id`, `title`, `slug`, `content`, `seoTitle`, `seoDescription`, `seoKeywords`, `status`, `featuredImage`, `createdAt`, `updatedAt`)
- `CreateBlogBody` type for POST requests
- `UpdateBlogBody` type for PUT requests
- `BlogListItem` type for list response items

---

### API Layer

#### [NEW] [blogApi.ts](file:///d:/stackly/Workplace/Website-Builder-Application/lib/blogApi.ts)
- Follows the same `apiRequest` pattern from [api.ts](file:///d:/stackly/Workplace/Website-Builder-Application/lib/api.ts)
- Reuses `API_BASE_URL` from env
- Exports: `createBlog()`, `getBlogs()`, `getBlogBySlug()`, `updateBlog()`, `deleteBlog()`
- Typed request/response with proper error handling
- Auth token from `localStorage` sent via `Authorization` header
- `AbortController` signal support on GET calls

---

### Blog Management Pages (New Route Group)

All management pages will live under `app/blog/manage/` to avoid conflicting with the existing `app/blog/page.tsx` (the public blog showcase/landing page).

#### [NEW] [page.tsx](file:///d:/stackly/Workplace/Website-Builder-Application/app/blog/manage/page.tsx) — Blog Listing
- Client component that fetches blogs via `GET /api/blog`
- Displays table/cards with: Title, Status badge, Created Date, Edit button, Delete button
- Loading skeleton state
- Empty state with "Create your first blog" CTA
- Error state with retry button
- Auto-refreshes after create/update/delete

#### [NEW] [page.tsx](file:///d:/stackly/Workplace/Website-Builder-Application/app/blog/manage/create/page.tsx) — Create Blog
- Form with fields: Title (required), Content (required), SEO Title, SEO Description, SEO Keywords, Featured Image URL, Status (Draft/Published)
- Client-side validation (trim whitespace, require title & content)
- Displays backend validation errors
- Disables submit during save
- Shows success toast, redirects to `/blog/manage`

#### [NEW] [page.tsx](file:///d:/stackly/Workplace/Website-Builder-Application/app/blog/manage/edit/[slug]/page.tsx) — Edit Blog
- Fetches blog via `GET /api/blog/:slug`
- Populates all form fields
- Saves via `PUT /api/blog/:id`
- Same validation, toast, and redirect behavior as create
- Loading state while fetching blog data

#### [NEW] [page.tsx](file:///d:/stackly/Workplace/Website-Builder-Application/app/blog/[slug]/page.tsx) — Public Blog View
- Client-side route that fetches published blog by slug
- Only displays if `status === "Published"` — shows 404-style message for drafts
- Renders blog content with title, featured image, content
- Sets client-side SEO meta tags via `useEffect` (title, description, keywords, og tags)

---

### Shared Components

#### [NEW] [BlogForm.tsx](file:///d:/stackly/Workplace/Website-Builder-Application/components/blog/BlogForm.tsx)
- Reusable form component shared between Create and Edit pages
- Fields: title, content (textarea), seoTitle, seoDescription, seoKeywords, featuredImage, status dropdown
- Validation logic built-in
- Accepts `initialData` prop for edit mode
- `onSubmit` callback with form data
- Loading/submitting state management

#### [NEW] [BlogToast.tsx](file:///d:/stackly/Workplace/Website-Builder-Application/components/blog/BlogToast.tsx)
- Simple toast notification component (follows existing toast pattern from portfolio/e-commerce pages)
- Auto-dismiss after timeout
- Success/error variants

#### [NEW] [BlogDeleteDialog.tsx](file:///d:/stackly/Workplace/Website-Builder-Application/components/blog/BlogDeleteDialog.tsx)
- Confirmation modal before deleting a blog
- "Are you sure?" with blog title
- Cancel and Delete buttons
- Loading state on delete button

#### [NEW] [BlogSeoHead.tsx](file:///d:/stackly/Workplace/Website-Builder-Application/components/blog/BlogSeoHead.tsx)
- Client-side component that updates `document.title` and meta tags
- Accepts seoTitle, seoDescription, seoKeywords, title (fallback)
- Sets Open Graph and Twitter meta tags dynamically

---

### Route Layout

#### [NEW] [layout.tsx](file:///d:/stackly/Workplace/Website-Builder-Application/app/blog/manage/layout.tsx)
- Dashboard-style layout for blog management pages
- Hides global navbar (follows dashboard layout pattern)
- Simple header with "Blog Management" title and back navigation

#### [NEW] [layout.tsx](file:///d:/stackly/Workplace/Website-Builder-Application/app/blog/[slug]/layout.tsx)
- Minimal layout for public blog view page

---

## File Structure Summary

```
types/blog.ts                          [NEW] Blog TypeScript interfaces
lib/blogApi.ts                         [NEW] API functions for blog CRUD
components/blog/BlogForm.tsx           [NEW] Reusable blog form
components/blog/BlogToast.tsx          [NEW] Toast notification
components/blog/BlogDeleteDialog.tsx   [NEW] Delete confirmation dialog
components/blog/BlogSeoHead.tsx        [NEW] Client-side SEO meta updater
app/blog/manage/layout.tsx             [NEW] Management pages layout
app/blog/manage/page.tsx               [NEW] Blog listing (CRUD dashboard)
app/blog/manage/create/page.tsx        [NEW] Create blog form
app/blog/manage/edit/[slug]/page.tsx   [NEW] Edit blog form
app/blog/[slug]/page.tsx               [NEW] Public blog view
app/blog/[slug]/layout.tsx             [NEW] Public view layout
```

> [!NOTE]
> The existing `app/blog/page.tsx` (the Blogify showcase/landing page) is **NOT modified**. The blog management and public view are new routes.

---

## Verification Plan

### Automated Tests
- `npm run build` — verifies TypeScript compilation and no breaking changes

### Manual Verification
- Create a blog post via `/blog/manage/create` → verify it appears in listing
- Edit a blog post → verify fields populate and save correctly
- Delete a blog post → verify confirmation dialog and list refresh
- Visit `/blog/[slug]` for a published post → verify content renders with SEO meta
- Visit `/blog/[slug]` for a draft post → verify it shows "not found"
- Test form validation (empty title, empty content, whitespace-only)
- Test error states (backend down, 404 blog, etc.)
- Verify existing `/blog` page is completely unchanged
