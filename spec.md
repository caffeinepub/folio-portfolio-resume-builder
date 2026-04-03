# Folio – Portfolio & Resume Builder

## Current State

- DashboardPage has a sidebar with `resume` and `portfolio` sections, but both render the same two-column editor+preview layout. The `portfolio` section label exists but clicking it still shows the resume editor tabs and the same template preview on the right.
- The `Download PDF` button is in the top header bar, always visible regardless of active section.
- The PDF generation (`handleDownloadPDF`) does NOT include the profile photo (`avatarUrl`). It builds a pure HTML resume with text only.
- The `Download PDF` button in the header always uses the current state — there is no "selected version" concept in the current code. The issue is likely that the button calls `handleDownloadPDF` which uses the latest React state, but that should work. Need to verify the template rendering also doesn't interfere.
- `PortfolioPage` (`/portfolio/:principalId`) renders the chosen template (Modern, Classic, etc.) as a full public page with `Navbar` and `Footer`.
- The dashboard live preview on the right uses `zoom: 0.55` and renders the same template component — this is for the Portfolio tab preview.

## Requested Changes (Diff)

### Add
- Profile photo (`avatarUrl`) embedded as a `<img>` in the PDF HTML output — circular, placed in the header next to name/title.
- Portfolio tab in dashboard shows a dedicated portfolio website builder view: left side has fields (auto-filled from resume data) for customizing the public portfolio, right side shows a minimal webpage-style preview (distinct from the resume PDF layout).
- The portfolio preview pane in the dashboard should look like a real website (sections, hero, etc.) not a resume document.
- `Download PDF` button should only show when `activeSection === "resume"` (or always, but it must use the current resume form data correctly).

### Modify
- `handleDownloadPDF`: inject `avatarUrl` as a base64 img tag in the PDF HTML header if it exists. Show it as a small circular photo on the right side of the header.
- Dashboard: when `activeSection === "portfolio"`, show a dedicated Portfolio builder panel instead of the same resume editor. The left side has portfolio-specific settings (template picker, accent color, bio/description override, visibility toggle, view live button). The right side shows a minimal modern portfolio webpage preview.
- The existing resume editor (Personal, Work, Education, Skills, Projects, Import, Design tabs) remains under `activeSection === "resume"` only.
- The portfolio preview pane should use the template components but style them to look like actual web pages, not resume documents — OR build a separate clean minimal portfolio preview panel that shows how the published site will look.
- Move template/design selection to the Portfolio tab (where it logically belongs for the website).

### Remove
- Nothing removed — the resume editor stays intact.

## Implementation Plan

1. **Fix PDF photo**: In `handleDownloadPDF`, read `avatarUrl` from state and inject an `<img>` tag with the base64 data URL in the PDF HTML header if present. Style as a 64px circular image floated right.
2. **Fix Download button scope**: Move `Download PDF` button to only show when `activeSection === "resume"` (inside the top header conditional or via a flag). The button already uses the correct state; keep behavior but scope visibility.
3. **Separate Portfolio tab content**: When `activeSection === "portfolio"`, render a new two-column layout:
   - Left: Portfolio Settings panel — template picker (moved here from Design tab in resume), accent color picker, toggle for published state, view live link.
   - Right: Portfolio webpage preview — render the active template at zoom 0.55 with actual data, clearly styled as a "website preview" with a browser-chrome frame around it.
4. **Resume tab cleanup**: Remove the Design tab from the resume editor tabs (or keep it but make it clear it affects the portfolio). The resume editor focuses on content (Personal, Work, Education, Skills, Projects, Import PDF).
5. **Portfolio webpage preview**: The right side of the Portfolio tab uses the same `TEMPLATE_MAP` render but wraps it in a mock browser frame (address bar, dots) to make it clear it's a website preview, not a resume.
