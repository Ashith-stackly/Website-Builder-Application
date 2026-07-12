param(
  [string]$OutputPath = (Join-Path $PSScriptRoot "manager_project_overview.docx")
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression

function Escape-Xml([string]$Value) {
  return [System.Security.SecurityElement]::Escape($Value)
}

function Paragraph([string]$Text, [string]$Style = "Normal") {
  $escaped = Escape-Xml $Text
  return "<w:p><w:pPr><w:pStyle w:val=`"$Style`"/></w:pPr><w:r><w:t xml:space=`"preserve`">$escaped</w:t></w:r></w:p>"
}

function Page-Break {
  return "<w:p><w:r><w:br w:type=`"page`"/></w:r></w:p>"
}

$body = @(
  (Paragraph "Stackly Website Builder Application" "Title"),
  (Paragraph "Manager overview: project setup, delivery structure and working model" "Subtitle"),
  (Paragraph "Prepared: 11 July 2026" "Meta"),
  (Paragraph "Executive summary" "Heading1"),
  (Paragraph "Stackly is a no-code website builder. A user can create a project, choose a template, assemble a page with visual blocks, preview it at different device sizes, save it, and export the generated site."),
  (Paragraph "The codebase is a monorepo with a Next.js frontend and an Express/MongoDB backend. Work is organised into eleven product modules so that delivery can be planned, built and verified in clear functional slices."),
  (Paragraph "Current position: the core customer journey is implemented. The builder, project workspace, templates, preview and blog capabilities are usable. Remaining work is concentrated in production publishing, domains, e-commerce UI, analytics integration and AI assistance."),
  (Paragraph "Management takeaway" "Heading2"),
  (Paragraph "- The visual website-builder experience is complete for the current delivery scope."),
  (Paragraph "- The main technical decision now is how and when to consolidate scaffolded backend services into the live API before expanding product scope."),
  (Paragraph "- The next highest-value release work is publishing and deployment, followed by reliable analytics and commerce surfaces."),

  (Page-Break),
  (Paragraph "1. Project setup and structure" "Heading1"),
  (Paragraph "Repository layout" "Heading2"),
  (Paragraph "Website-Builder-Application/" "Code"),
  (Paragraph "- frontend/ - Next.js 16, React 19, TypeScript and Tailwind. This contains user pages, the visual builder, reusable components, Zustand stores and API clients."),
  (Paragraph "- backend/ - Node.js, Express and MongoDB. This is the active API structure, organised into routes, controllers, services, models, validators and middleware."),
  (Paragraph "- docs/ - delivery dashboard, technical planning material and this management brief."),
  (Paragraph "- test/ - reference and expanded backend implementations used during consolidation and feature planning."),
  (Paragraph "Runtime flow" "Heading2"),
  (Paragraph "User action -> Next.js page/component -> Zustand state store -> typed API client -> Express route -> controller -> service -> MongoDB model."),
  (Paragraph "The builder also keeps client-side editing state for fast interaction. It saves project data and generated HTML through the Project API, while user interface preferences such as canvas grid visibility remain local to the browser."),
  (Paragraph "Local setup" "Heading2"),
  (Paragraph "1. Install dependencies separately in backend/ and frontend/ with npm install."),
  (Paragraph "2. Copy each .env.example file and provide MongoDB, JWT and optional provider credentials."),
  (Paragraph "3. Start the backend with npm run dev and the frontend with npm run dev. The frontend uses NEXT_PUBLIC_API_BASE_URL to reach the API."),

  (Page-Break),
  (Paragraph "2. How we work module by module" "Heading1"),
  (Paragraph "Each module is a product capability with an explicit user outcome, owning screens, state, API paths and acceptance checks. This keeps delivery understandable without requiring every stakeholder to follow implementation detail."),
  (Paragraph "Standard delivery workflow" "Heading2"),
  (Paragraph "1. Scope the user outcome and identify the affected module(s)."),
  (Paragraph "2. Define the data contract and validation rules before wiring the UI."),
  (Paragraph "3. Build the frontend component and state changes in the relevant feature folder."),
  (Paragraph "4. Build or extend the API through route -> validator -> controller -> service -> model."),
  (Paragraph "5. Connect the typed API client, handle loading and failure states, and preserve data compatibility."),
  (Paragraph "6. Verify with linting, TypeScript checks and feature-level behaviour checks; update the delivery dashboard."),
  (Paragraph "Definition of done" "Heading2"),
  (Paragraph "A module item is marked done only when its intended user-facing flow is implemented and checked in the active code path. Partial means code or backend scaffolding exists but is not yet fully exposed, integrated or production-ready. Pending means it is intentionally not started."),
  (Paragraph "Why this matters" "Heading2"),
  (Paragraph "This model lets the team deliver the core builder independently from future platform capabilities. It also makes dependencies visible: for example, the publishing UI should be delivered only after the live backend can safely create and report deployments."),

  (Page-Break),
  (Paragraph "3. Module delivery snapshot" "Heading1"),
  (Paragraph "1. Authentication and user management - Core registration, login, OTP reset and Google sign-in are delivered. Durable client refresh handling and fully enforced plan gating remain follow-up work."),
  (Paragraph "2. Workspace and dashboard - Delivered. Users can create, list, duplicate, delete and save projects."),
  (Paragraph "3. Template library - Delivered for browsing, previewing and cloning templates. Larger curated seed content remains an ongoing content task."),
  (Paragraph "4. Drag-and-drop builder - Delivered for the current scope. It includes reusable blocks, nested drag and drop, styling, responsive editing, undo and redo, save/import/export and canvas controls."),
  (Paragraph "5. Preview and responsive design - Delivered. Desktop, tablet and mobile frames use stored responsive style overrides and HTML preview."),
  (Paragraph "6. Domain and hosting - Foundation only. Domain models and service scaffolding exist, but DNS, SSL and routing are not live."),
  (Paragraph "7. Publishing system - HTML generation and project save are delivered. Deployment to hosting, publish status and rollback UI are not yet connected to the live product."),
  (Paragraph "8. E-commerce - Backend foundations exist; product management, cart and checkout surfaces still need to be brought into the active frontend and API."),
  (Paragraph "9. Blog and SEO - The editor, schema, slugs and sitemap service are implemented. The frontend API contract must be aligned to the workspace-scoped backend before the CMS is fully live; crawler-ready Open Graph metadata is also a follow-up."),
  (Paragraph "10. Analytics - Dashboard UI is delivered; event ingestion and reporting still need live backend integration."),
  (Paragraph "11. AI content assistant - Planned, not started. The current block definitions leave space for future text and image generation."),
  (Paragraph "Module 9 sprint scope" "Heading2"),
  (Paragraph "- Create blog post schema - implemented in the workspace-scoped backend model."),
  (Paragraph "- Build blog editor UI - implemented with shared create and edit form components."),
  (Paragraph "- Implement post creation, edit and delete - backend services exist; frontend API route alignment is pending."),
  (Paragraph "- Generate slug-based URLs - implemented with unique per-workspace slugs."),
  (Paragraph "- Add SEO metadata fields - implemented for title, description and keywords."),
  (Paragraph "- Generate sitemap.xml - implemented by the public workspace sitemap endpoint."),
  (Paragraph "- Add Open Graph and meta tags - client-side tags are implemented; crawler-ready static/server metadata is pending."),
  (Paragraph "- Implement blog listing page - public and management listing interfaces are implemented."),

  (Page-Break),
  (Paragraph "4. Builder Phase 1 completion" "Heading1"),
  (Paragraph "The builder is the central product module. This phase completed its editor chrome and operational feedback without changing saved website content."),
  (Paragraph "Delivered in this phase" "Heading2"),
  (Paragraph "- Persisted canvas preferences: grid visibility and size, snap preference, rulers, status bar, minimap placeholder and grid/dots/plain background preference."),
  (Paragraph "- Selection toolbar: move, duplicate, copy, lock/unlock, hide/show, layer order and delete actions are connected to existing builder store actions."),
  (Paragraph "- Status bar: autosave state, block count, canvas mode, active viewport, zoom and grid/snap controls are visible to the editor."),
  (Paragraph "- Canvas presentation: visible grid or dots background and CSS zoom work without altering the website document model."),
  (Paragraph "- Integration and validation: the toolbar and status bar are composed through BuilderLayout; builder additions pass ESLint and TypeScript checks."),
  (Paragraph "Operational benefit" "Heading2"),
  (Paragraph "Editors get clearer feedback about their work and a faster way to manage selected blocks. The team gains a separate UI-preference store, so future editor chrome can evolve without risking project data or backend save behaviour."),

  (Page-Break),
  (Paragraph "5. Next priorities and delivery risks" "Heading1"),
  (Paragraph "Recommended sequence" "Heading2"),
  (Paragraph "1. Consolidate the required backend services and align route names used by frontend API clients and the active backend."),
  (Paragraph "2. Deliver a publish flow with deployment status, safe failure handling and hosted-site output."),
  (Paragraph "3. Connect analytics ingestion and dashboard reporting to the active backend."),
  (Paragraph "4. Bring e-commerce APIs into the live backend and introduce product, cart and checkout user interfaces."),
  (Paragraph "5. Add AI assistance only after the core publishing and measurement loops are stable."),
  (Paragraph "Risks to manage" "Heading2"),
  (Paragraph "- Backend duplication: the repository contains active and reference backend implementations. Consolidation ownership and route compatibility should be agreed before adding more API-dependent features."),
  (Paragraph "- Infrastructure scope: domain, hosting and deployment require real cloud, DNS and security decisions; these are not just frontend tasks."),
  (Paragraph "- Data ownership: browser-first editing is appropriate for responsiveness, but project saves must remain authoritative on the backend as collaboration and publishing grow."),
  (Paragraph "Reference" "Heading2"),
  (Paragraph "For the detailed live task list, source paths and status definitions, open docs/index.html in this repository. This document is intentionally written as a management-level summary rather than an implementation specification.")
) -join "`n"

$document = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    $body
    <w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
  </w:body>
</w:document>
"@

$styles = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:style>
  <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:pPr><w:spacing w:after="180"/></w:pPr><w:rPr><w:b/><w:color w:val="0B1D40"/><w:sz w:val="40"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:pPr><w:spacing w:after="120"/></w:pPr><w:rPr><w:color w:val="566583"/><w:sz w:val="26"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Meta"><w:name w:val="Meta"/><w:pPr><w:spacing w:after="420"/></w:pPr><w:rPr><w:color w:val="566583"/><w:sz w:val="20"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="Heading 1"/><w:pPr><w:spacing w:before="300" w:after="150"/></w:pPr><w:rPr><w:b/><w:color w:val="0B1D40"/><w:sz w:val="30"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="Heading 2"/><w:pPr><w:spacing w:before="180" w:after="90"/></w:pPr><w:rPr><w:b/><w:color w:val="1D4ED8"/><w:sz w:val="24"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Code"><w:name w:val="Code"/><w:pPr><w:spacing w:after="120"/><w:ind w:left="360"/></w:pPr><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:color w:val="334155"/><w:sz w:val="20"/></w:rPr></w:style>
</w:styles>
"@

$contentTypes = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>
"@

$rootRelationships = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>
"@

$documentRelationships = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>
"@

$temp = Join-Path ([System.IO.Path]::GetTempPath()) ("stackly-manager-brief-" + [guid]::NewGuid().ToString())
[System.IO.Directory]::CreateDirectory($temp) | Out-Null

function Write-Utf8([string]$RelativePath, [string]$Content) {
  $path = Join-Path $temp $RelativePath
  [System.IO.Directory]::CreateDirectory((Split-Path -Parent $path)) | Out-Null
  [System.IO.File]::WriteAllText($path, $Content, [System.Text.UTF8Encoding]::new($false))
}

try {
  Write-Utf8 "[Content_Types].xml" $contentTypes
  Write-Utf8 "_rels/.rels" $rootRelationships
  Write-Utf8 "word/document.xml" $document
  Write-Utf8 "word/styles.xml" $styles
  Write-Utf8 "word/_rels/document.xml.rels" $documentRelationships

  if (Test-Path -LiteralPath $OutputPath) {
    Remove-Item -LiteralPath $OutputPath -Force
  }
  $archive = [System.IO.Compression.ZipFile]::Open(
    $OutputPath,
    [System.IO.Compression.ZipArchiveMode]::Create
  )
  try {
    Get-ChildItem -LiteralPath $temp -Recurse -File | ForEach-Object {
      $relativePath = $_.FullName.Substring($temp.Length + 1).Replace("\", "/")
      $entry = $archive.CreateEntry($relativePath, [System.IO.Compression.CompressionLevel]::Optimal)
      $source = [System.IO.File]::OpenRead($_.FullName)
      $destination = $entry.Open()
      try {
        $source.CopyTo($destination)
      }
      finally {
        $destination.Dispose()
        $source.Dispose()
      }
    }
  }
  finally {
    $archive.Dispose()
  }
  Write-Output "Created $OutputPath"
}
finally {
  if (Test-Path -LiteralPath $temp) {
    [System.IO.Directory]::Delete($temp, $true)
  }
}
