# Folio – Portfolio & Resume Builder

## Current State
- Landing page with hero section, features, and pricing
- Dashboard uses a top Navbar + tab-based layout (no sidebar)
- Auth is handled inline via `useInternetIdentity` – no dedicated sign in/sign up page
- `/dashboard` is not protected (no redirect if logged out)
- Dashboard does not visually match the hero mockup image

## Requested Changes (Diff)

### Add
- `/auth` route with a dedicated Sign In / Sign Up page (two tabs, both using Internet Identity)
- After successful login, redirect to `/dashboard`
- Protect `/dashboard`: redirect unauthenticated users to `/auth`
- Dashboard left fixed sidebar matching the hero image: avatar placeholder, user name, plan badge, nav items (Dashboard, Resume, Portfolio, Settings), Logout at bottom
- Dashboard main area: top bar with page title + Save/Publish action buttons; left editor panel with resume section tabs (Personal, Experience, Education, Skills, Projects); right live preview panel (light paper-like background rendering the resume)
- PDF upload section in the editor area (drag-and-drop or click)

### Modify
- Navbar CTA buttons: "Sign In" navigates to `/auth` when not logged in
- `DashboardPage.tsx`: replace current Navbar+tab layout with sidebar + two-column layout matching hero mockup
- `App.tsx`: add `/auth` route and beforeLoad guard on `/dashboard`

### Remove
- Navbar inside DashboardPage (sidebar replaces it)

## Implementation Plan
1. Add `/auth` route in `App.tsx` with `beforeLoad` guard on `/dashboard` that redirects to `/auth` if no identity
2. Create `src/frontend/src/pages/AuthPage.tsx` – Sign In / Sign Up tabs, both call `login()` from `useInternetIdentity`, show loading state, auto-redirect to `/dashboard` on success
3. Rewrite `DashboardPage.tsx` layout:
   - Fixed left sidebar: avatar, name, plan badge, nav links (Dashboard, Resume, Portfolio, Settings), Logout
   - Main area: top bar with title + Save/Publish buttons
   - Two-column: left = editor tabs (Personal, Experience, Education, Skills, Projects, PDF Import); right = live resume preview on off-white paper panel
4. Update Navbar: Sign In button navigates to `/auth`
