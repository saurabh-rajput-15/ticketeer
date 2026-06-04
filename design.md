# Design Document

## Aesthetic Philosophy
Ticketeer employs a minimalist, high-contrast, editorial design style. The UI avoids traditional, cluttered dashboard aesthetics in favor of generous negative space, sophisticated typography, and striking monochromatic elements with minimalistic structural outlines.

## Typography
*   **Primary (UI & Forms):** `Inter` or standard `sans-serif` for high legibility in data-dense areas.
*   **Display (Headings & Branding):** Custom serif usage (via Tailwind `font-serif`) combined with `tracking-tighter` and `italic` variations to create a modern, high-end editorial feel.
*   **Accents:** `uppercase tracking-[0.2em] text-[10px]` for utility headings, micro-copy, and buttons to establish strong architectural hierarchy.

## Color Palette
*   **Base:** Bright white backgrounds (`bg-white`) with high-contrast black text (`text-black`).
*   **Surface:** Subtle use of borders (`border-black/5` or `border-black/10`) to delineate sections without relying on drop shadows. Glassmorphism used sparingly for sticky headers (`bg-white/50 backdrop-blur-md`).
*   **Interactive Elements:** Solid black buttons (`bg-black text-white`) that dim on hover (`hover:bg-zinc-800`).
*   **Feedback:** 
    *   Destructive actions / Sign Out: Red (`text-red-600`)
    *   Success/System Toasts (Sonner): Default light/dark styling for discreet notifications.
    *   Disabled states drop to `opacity-50`.

## Layout & Spacing
*   **Navigation:** Top sticky navigation bar. Dynamically adjusts link visibility based on the user's authentication state to keep the public view completely clutter-free.
*   **Containers:** Use of `min-h-screen`, `flex-col` to structure pages, allowing the main content area to flex and center inner containers (`max-w-*`).
*   **Cards/Containers:** Square corners with zero to minimal drop shadow, strictly relying on structural 1px borders.

## Component Patterns
*   **Inputs:** Clean, structural input fields (often full-border minimalist inputs `border-black/20 focus:border-black`).
*   **Buttons:** Crisp, often uppercase with wide letter spacing (`tracking-[0.2em]`), rounded or pill-shaped depending on primary vs. nav usage.
*   **Empty States:** Subdued opacity (`opacity-40` or `opacity-60`) text emphasizing an uncluttered feel instead of loud "No Data" graphics.

## Architecture

### Frontend (Client-Side SPA)
*   **Routing:** React Router DOM (v6+). Encapsulates protected admin/organizer routes (`AdminRoute`). Public routes (`/`, `/checkout/`, `/ticket/`) are explicitly defined.
*   **State Management:** React hooks (`useState`, `useEffect`) locally managed at the component level.
*   **Libraries:** 
    *   `qrcode.react` for robust ticket rendering.
    *   `html5-qrcode` for the volunteer gate scanning module.
    *   `lucide-react` for consistent SVG iconography.

### Backend (Express API)
*   **Entry Point:** `server.ts` handles API routing.
*   **Database Interaction:** `@supabase/supabase-js` utilized over PostgreSQL to ensure secure, real-time capable data management.
*   **Core Endpoints:**
    *   `GET /api/events` - Fetch all public events.
    *   `POST /api/events` - Host creates a new event & tickets.
    *   `POST /api/checkout` - Attendee registration & validation processing.
    *   `GET /api/ticket/:regId` - Retrieve purchased ticket info.
    *   `GET /api/organizer/registrations/:eventId` - Dashboard data aggregation.
    *   `POST /api/volunteer/scan` - Verification endpoint.

### Deployment / Build Flow
*   The production build uses Vite (`vite build`) and then bundles the `server.ts` file via `esbuild`. 
*   The final artifact uses Express serving the static `/dist` frontend while proxying `/api` requests natively, eliminating CORS complications in production.
