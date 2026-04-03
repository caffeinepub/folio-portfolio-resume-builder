# Folio – Portfolio & Resume Builder

## Current State
- Dashboard has a fixed left sidebar with sections: Dashboard, Resume, Portfolio, Settings
- Resume section has editor tabs: Personal, Work, Education, Skills, Projects, Import PDF, Design
- Dashboard header has: Published toggle, View Live button, Save Changes button
- ThemeContext provides `theme`, `toggleTheme`, `accentColor`, `setAccentColor`
- Home page Navbar has a Sun/Moon theme toggle button
- Dashboard currently imports `useTheme` but only uses `accentColor` / `setAccentColor` — no theme toggle in the dashboard header
- No PDF resume download/export functionality exists

## Requested Changes (Diff)

### Add
1. **Download PDF Resume** button in the dashboard header area (next to Save Changes), and/or a dedicated "Download PDF" action in the Resume section. When clicked, generates a clean, well-formatted PDF of the user's resume data (personal info, work experience, education, skills, projects) using the browser's print API or a client-side PDF library like `jsPDF` + `html2canvas`. The PDF should reflect the current resume data.
2. **Theme toggle (Sun/Moon)** in the dashboard header — same style as the one already in the Navbar on the home page, using `toggleTheme` from `useTheme`.

### Modify
- Dashboard header: add theme toggle icon button (Sun/Moon) and Download PDF button alongside existing controls
- Dashboard imports: add `Sun`, `Moon`, `Download` icons from lucide-react; import `toggleTheme` from `useTheme`

### Remove
- Nothing removed

## Implementation Plan
1. In `DashboardPage.tsx`, destructure `theme` and `toggleTheme` from `useTheme()` (already imported).
2. Add Sun/Moon toggle button in the dashboard `<header>` right actions area, mirroring Navbar style.
3. Add a `Download` icon button (or labeled button) in the header that triggers PDF generation.
4. Implement PDF generation: create a hidden/printable resume HTML element styled for print, then call `window.print()` with print-specific CSS, OR use `jsPDF` + `html2canvas` to capture a styled resume div. The simpler approach is a print-CSS-driven window.print() using a `<style media="print">` stylesheet that shows only the resume content.
5. The resume PDF output should include: name, title, contact info, bio, work experience, education, skills, and projects — all from current state.
