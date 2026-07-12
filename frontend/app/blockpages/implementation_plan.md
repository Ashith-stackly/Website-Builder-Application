# Block Pages Backend Integration — Implementation Plan

## Analysis Summary

### A. Existing Frontend Save Draft Flow
- **6 Canvas components** each have a Save Draft button with placeholder `alert()` handlers:
  - [textblock/Canvas.tsx](file:///d:/stackly/Workplace/test/Website-Builder-Application/frontend/app/blockpages/textblock/Canvas.tsx#L250-L258) — `alert("Working on it - In progress!")`
  - [buttonblock/Canvas.tsx](file:///d:/stackly/Workplace/test/Website-Builder-Application/frontend/app/blockpages/buttonblock/Canvas.tsx#L280) — `alert("Draft saved locally!")`
  - [imageblock/MainCanvas.tsx](file:///d:/stackly/Workplace/test/Website-Builder-Application/frontend/app/blockpages/imageblock/MainCanvas.tsx#L226) — `alert("Save Draft functionality triggered successfully!")`
  - [videoblock/Canvas.tsx](file:///d:/stackly/Workplace/test/Website-Builder-Application/frontend/app/blockpages/videoblock/Canvas.tsx#L225) — `alert("Draft saved locally!")`
  - [dividerblock/Canvas.tsx](file:///d:/stackly/Workplace/test/Website-Builder-Application/frontend/app/blockpages/dividerblock/Canvas.tsx#L103) — `alert("Draft saved locally!")`
  - [iconsblock/Canvas.tsx](file:///d:/stackly/Workplace/test/Website-Builder-Application/frontend/app/blockpages/iconsblock/Canvas.tsx#L84) — `alert("Draft saved locally!")`
  - [PortfolioPreview.tsx](file:///d:/stackly/Workplace/test/Website-Builder-Application/frontend/app/blockpages/textblock/PortfolioPreview.tsx#L516) — `alert("Working on it - In progress!")`
- All block state is held in React `useState` inside [BlockPagesClient.tsx](file:///d:/stackly/Workplace/test/Website-Builder-Application/frontend/app/blockpages/BlockPagesClient.tsx) — not in a Zustand store.
- Local persistence: `localStorage` keys (`stackly-custom-images`, `stackly-custom-buttons`, `stackly-custom-dividers`, `stackly-custom-icons`, `portfolioVideoData`, `stackly-custom-static-icons`).

### B. Existing Frontend Preview Flow
- **Text Canvas only** has a working preview: clones the DOM, strips builder chrome, stores HTML in `localStorage` key `stackly-textblock-preview-html`, opens `/blockpages/preview` in a new tab.
- **Other canvases** (button, video, divider, icons, image) show `alert("Preview mode not yet implemented.")`.
- The [preview page](file:///d:/stackly/Workplace/test/Website-Builder-Application/frontend/app/blockpages/preview/page.tsx) reads from `localStorage` and renders with `dangerouslySetInnerHTML`.

### C. Existing Backend APIs That Can Be Reused

| API | Route | Purpose |
|-----|-------|---------|
| Create project | `POST /api/projects` | Creates a workspace document — reuse for first save |
| Get project | `GET /api/projects/:id` | Fetches full project with `builderData` — reuse for load draft |
| Autosave | `PUT /api/projects/:id/autosave` | Saves `builderData` + `htmlContent` — **primary reuse for Save Draft** |

All three already exist in [projectRoutes.js](file:///d:/stackly/Workplace/test/Website-Builder-Application/backend/src/routes/projectRoutes.js), [projectController.js](file:///d:/stackly/Workplace/test/Website-Builder-Application/backend/src/controllers/projectController.js), and [projectService.js](file:///d:/stackly/Workplace/test/Website-Builder-Application/backend/src/services/projectService.js). They use the `Workspace` Mongoose model, JWT auth, and ownership checks.

The frontend [projectApi.ts](file:///d:/stackly/Workplace/test/Website-Builder-Application/frontend/lib/projectApi.ts) already has typed wrappers: `createProject()`, `getProject()`, `autosaveProject()`, all with auth headers and error handling.

### D. Missing API Functionality
**None.** The existing backend fully supports Create, Read, and Update via the `/api/projects` routes. No new backend endpoints are needed.

### E. Files That Need Modification

**Frontend** (7 files modified, 1 new file):

| File | Change |
|------|--------|
| `frontend/lib/blockPagesDraftApi.ts` | **[NEW]** Thin wrapper for block-pages-specific draft operations using existing `projectApi` |
| `frontend/app/blockpages/BlockPagesClient.tsx` | Add draft state (projectId, save status), save/preview handlers, load draft on mount, pass callbacks to Canvas children |
| `frontend/app/blockpages/textblock/Canvas.tsx` | Wire `onSaveDraft` prop to existing button, pass save status for button text |
| `frontend/app/blockpages/buttonblock/Canvas.tsx` | Wire `onSaveDraft`/`onPreview` props |
| `frontend/app/blockpages/imageblock/MainCanvas.tsx` | Wire `onSaveDraft`/`onPreview` props |
| `frontend/app/blockpages/videoblock/Canvas.tsx` | Wire `onSaveDraft`/`onPreview` props |
| `frontend/app/blockpages/dividerblock/Canvas.tsx` | Wire `onSaveDraft`/`onPreview` props |
| `frontend/app/blockpages/iconsblock/Canvas.tsx` | Wire `onSaveDraft`/`onPreview` props |
| `frontend/app/blockpages/textblock/PortfolioPreview.tsx` | Wire `onSaveDraft` prop |
| `frontend/app/blockpages/preview/page.tsx` | Add support for loading saved draft by `?projectId=` query param |

**Backend**: **No modifications needed.** The existing `POST /api/projects`, `GET /api/projects/:id`, and `PUT /api/projects/:id/autosave` cover all requirements.

### F. Exact Endpoint Contracts

**First Save (Create Draft):**
```
POST /api/projects
Authorization: Bearer <token>
Body: { "projectName": "Block Pages Draft", "category": "blockpages" }
Response: { "success": true, "project": { "_id": "...", ... } }
```

**Subsequent Saves (Update Draft):**
```
PUT /api/projects/:id/autosave
Authorization: Bearer <token>
Body: {
  "builderData": {
    "schemaVersion": 1,
    "blockPagesData": {
      "template": "portfolio",
      "textBlockState": { ... },
      "buttonBlocks": [ ... ],
      "videoBlocks": [ ... ],
      "dividerBlocks": [ ... ],
      "iconBlocks": [ ... ],
      "customImages": { ... },
      "customButtons": { ... },
      "customIcons": { ... },
      "appliedDividers": [ ... ],
      "appliedIcons": [ ... ]
    }
  }
}
Response: { "success": true, "savedAt": "2026-07-12T..." }
```

**Load Draft:**
```
GET /api/projects/:id
Authorization: Bearer <token>
Response: { "success": true, "project": { "_id": "...", "builderData": { ... }, ... } }
```

---

## Proposed Changes

### New API helper

#### [NEW] [blockPagesDraftApi.ts](file:///d:/stackly/Workplace/test/Website-Builder-Application/frontend/lib/blockPagesDraftApi.ts)

A thin wrapper that:
- Exports `BlockPagesDraftPayload` type (collects all block state into one serializable object)
- `createBlockPagesDraft(template)` → calls `createProject` from existing `projectApi.ts`
- `saveBlockPagesDraft(id, payload)` → calls `autosaveProject` from existing `projectApi.ts`
- `loadBlockPagesDraft(id)` → calls `getProject` from existing `projectApi.ts`, extracts `blockPagesData`
- Handles blob URL sanitization for images before save
- Returns typed results

No new backend routes, no duplicate API architecture.

---

### BlockPagesClient.tsx

Add at the top level of `BlockPagesClient`:
1. **Draft state**: `projectId` (from URL `?projectId=` or created on first save), `saveStatus` enum (`idle | saving | saved | error`), `lastSavedAt`
2. **`handleSaveDraft()`**: Collects all block state into `BlockPagesDraftPayload`, calls create or update, manages `saveStatus`, stores returned `projectId` in state + URL (via `searchParams.set`)
3. **`handlePreview()`**: Reuses existing `openPreviewPage` logic from TextCanvas — clones canvas DOM, stores in `localStorage`, opens preview tab. This is lifted up so all Canvas types can trigger it.
4. **`useEffect` for load**: On mount, if `projectId` search param exists, fetches saved draft via `loadBlockPagesDraft()` and hydrates all state setters
5. Pass `onSaveDraft`, `onPreview`, `saveStatus`, `isSaving` as props to all Canvas children

> [!IMPORTANT]  
> All state remains in React `useState` — we do NOT migrate to Zustand. This preserves the existing architecture exactly.

---

### Canvas Components (text, button, image, video, divider, icons)

Each Canvas gets new optional props:
```ts
onSaveDraft?: () => void;
onPreview?: () => void;
saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
```

The existing Save Draft button `onClick` changes from `alert(...)` to `onSaveDraft?.()`.
The button text changes based on `saveStatus`:
- `idle` → "Save Draft"  
- `saving` → "Saving..."  
- `saved` → "Saved ✓"  
- `error` → "Save Failed"

The button is disabled when `saveStatus === 'saving'`.

The existing Preview button `onClick` changes from `alert(...)` to `onPreview?.()` (for button/video/divider/icons canvases).

**No CSS changes. No restructuring. No animation changes.**

---

### PortfolioPreview.tsx

The embedded Save Draft button (line 516) gets wired to an `onSaveDraft` prop, same as the Canvas components.

---

### Preview Page

[preview/page.tsx](file:///d:/stackly/Workplace/test/Website-Builder-Application/frontend/app/blockpages/preview/page.tsx):
- Add support for `?projectId=xxx` query param
- If `projectId` present → fetch saved draft from backend → render saved content
- If no `projectId` → use existing `localStorage` flow (current editor state preview)
- This provides both **MODE 1** (current state) and **MODE 2** (saved draft) preview

---

## Image Handling

- Images stored as `customImages` use either remote URLs (Unsplash, CDN) or `blob:` URLs from file uploads
- Before saving to backend: any `blob:` URLs are **stripped** (set to empty string) since they are not persistable
- The API helper documents this limitation clearly
- No new image upload/S3 architecture is introduced in this task
- Remote/CDN URLs are preserved correctly

---

## Authentication

- Uses existing `getAuthToken()` from [projectApi.ts](file:///d:/stackly/Workplace/test/Website-Builder-Application/frontend/lib/projectApi.ts#L46-L49) which reads `stackly-auth-token` from `localStorage`
- Auth header `Authorization: Bearer <token>` is attached automatically via `authHeaders()`
- Backend JWT middleware validates token and sets `req.user._id`
- Ownership check: `{ _id: id, userId: req.user._id, status: { $ne: 'deleted' } }` — already enforced in `projectService.js`

---

## Concurrency Protection

- `isSavingRef` (React ref) prevents overlapping save requests
- Button is disabled during save via `saveStatus === 'saving'`
- First save creates project and stores `projectId`; subsequent saves use `autosaveProject(projectId, ...)`

---

## Undo/Redo

- Save and Preview operations do NOT push to undo/redo history
- They read current state without modifying it
- Loading a draft initializes state fresh (no history entries)

---

## Verification Plan

### Automated Tests
- `curl` commands to verify API contracts work end-to-end after implementation

### Manual Verification
All 10 test cases from the requirements will be verified by tracing the complete path:
1. Save Draft button → `onSaveDraft` → `handleSaveDraft` → `createProject`/`autosaveProject` → backend → MongoDB → response → UI status update
2. Preview button → `onPreview` → `openPreviewPage` → `localStorage` → preview tab → rendered output
3. Load draft → URL `?projectId=` → `useEffect` → `loadBlockPagesDraft` → state hydration → editor display

---

## Open Questions

> [!IMPORTANT]
> **Draft naming**: When creating the first draft, should it be auto-named (e.g., "Block Pages Draft — Portfolio") or should a name prompt appear? **Current plan**: Auto-name with template type, user can rename from Dashboard later.

> [!IMPORTANT]
> **Blob URL images**: File-uploaded images use `blob:` URLs which cannot be persisted to MongoDB. **Current plan**: Strip blob URLs on save and document the limitation. A future task would add image upload to S3/backend storage. Is this acceptable?
