# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Daggerheart Web Companion** is a mobile-first, digital character sheet for the Daggerheart Tabletop RPG. It prioritizes a tactile, "toy-like" experience (card flipping, 3D dice rolling) over spreadsheet-style data management.

**Prior to starting development, please review the Product Requirements Document (docs/PRD.md).**

### Key Technologies
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **State Management:** Zustand
- **Backend:** Supabase (PostgreSQL + Auth)
- **UI Library:** Radix UI (via shadcn/ui), Framer Motion
- **3D:** `@3d-dice/dice-box` (Three.js wrapper)

## Development Commands

### Environment Setup
1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase credentials and site URL
3. Required environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `NEXT_PUBLIC_SITE_URL` - Your site URL (localhost for dev, production URL for deployed)

### Core Commands
```bash
npm install          # Install dependencies
npm run dev          # Start dev server with Turbopack (http://localhost:3000)
npm run lint         # Run ESLint
npm run build        # Production build
```

### Development Workflow
**Always lint before building** for fastest feedback:
```bash
npm run lint         # 1. Lint first (fast, catches issues early)
npm run build        # 2. Build second (slower, verifies compilation)
```

Or as a one-liner:
```bash
npm run lint && npm run build
```

### Lint Configuration
- ESLint currently has several rules disabled (see `eslint.config.mjs:15-23`)
- `@typescript-eslint/no-unused-vars`, `no-unused-vars`, and `@typescript-eslint/no-explicit-any` are temporarily off
- **Before committing:** Lint and resolve ALL warnings and errors (per user's global instructions)
- Linting is much faster than building, so always run it first to fail fast

### Database Setup (Supabase)
1. **Schema:** Run content of `supabase/schema.sql` in the Supabase SQL Editor to create tables (`profiles`, `characters`, `library`, etc.) and RLS policies
2. **Seed Data:**
   - The game data (classes, abilities) is stored in Markdown files in `srd/`
   - To populate the database, run the parser script:
     ```bash
     node scripts/parse_srd.js
     ```
   - This generates `supabase/seed_library.sql`. Run the contents of this file in your Supabase SQL Editor

## Architecture

### Directory Structure
- `app/` - Next.js App Router pages
  - `(playground)/` - Main authenticated application views
  - `auth/` - Authentication routes
- `components/`
  - `ui/` - Reusable primitives (shadcn/ui)
  - `views/` - Feature-specific views (Character, Playmat, Inventory, Combat)
  - `daggerheart-app.tsx` - Main layout wrapper for the game view
- `srd/` - **Source of Truth** for game data. Markdown files organized by type (abilities, classes, etc.)
- `store/` - Global state using Zustand (`character-store.ts`)
- `scripts/` - Node.js scripts for data processing
- `supabase/` - SQL schemas and seeds

### Data Flow Strategy

1. **SRD Ingestion:** Markdown files are parsed → SQL Inserts → `library` table
2. **Character Data:** Fetched from `characters` table
3. **"Manual Join" Pattern:**
   - The `library` table is separate from user data
   - The frontend fetches the `character` + `character_cards`
   - It extracts `card_id`s and performs a second fetch to `library` to get the actual card text/stats
   - These are stitched together in `store/character-store.ts` before updating the state
   - *Reasoning:* Keeps the highly relational nature of RPG data manageable without complex SQL joins on every read

### State Management (Zustand)

- **`useCharacterStore`:** The single source of truth for the active session
- **Optimistic Updates:** Vitals (HP, Stress) update immediately in the UI while the async request to Supabase resolves in the background

### Mobile-First Design

- The UI is optimized for portrait mobile usage
- **Navigation:** Bottom bar for primary views
- **Interaction:** Swipe gestures, tap-to-flip cards, and a "Floaty" Action Button (FAB) for rolling dice

## Common Development Tasks

### Adding New Game Content (SRD)
1. Create or edit a Markdown file in the appropriate `srd/` subdirectory (e.g., `srd/abilities/NewAbility.md`)
2. Run `node scripts/parse_srd.js`
3. Apply the generated `supabase/seed_library.sql` to your database

### Modifying Database Schema
1. Edit `supabase/schema.sql` to reflect changes
2. If changing `library` structure, update `scripts/parse_srd.js` to match the new columns
3. Update TypeScript interfaces in `store/character-store.ts`

## Style & Formatting

- **Code Style:** Standard TypeScript/Prettier
- **Components:** Functional components with named exports
- **Naming:** `kebab-case` for files, `PascalCase` for components, `camelCase` for functions/variables
- **CSS:** Utility-first (Tailwind). Custom colors (e.g., `dagger-dark`, `dagger-gold`) are defined in `app/globals.css`

## Additional Technical Details

### Supabase Client/Server Split
- `lib/supabase/client.ts` - Client-side Supabase client (browser)
- `lib/supabase/server.ts` - Server-side Supabase client (SSR)
- `lib/supabase/middleware.ts` - Session refresh middleware
- `middleware.ts` - Applies session middleware to `/profile` and `/login` routes

### TypeScript Configuration
- **Strict mode enabled** (`tsconfig.json:7`)
- Path alias: `@/*` maps to project root
- Target: ES2017
- Some type strictness temporarily relaxed in ESLint (see Lint Configuration section)

## Deployment

### Render Deployment
When deploying to Render (or any other platform), set these environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Same as local
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Same as local
- `NEXT_PUBLIC_SITE_URL` - Your production URL (e.g., `https://your-app.onrender.com`)

### Supabase Configuration
In your Supabase project settings (Authentication → URL Configuration):
1. Set **Site URL** to match `NEXT_PUBLIC_SITE_URL`
2. Add **Redirect URLs**: `https://your-app.onrender.com/auth/callback` (and localhost for dev)
3. Ensure Google OAuth is configured with the correct redirect URIs

## Git Commit Configuration

**Important:** Use `alex.plocik.home@gmail.com` for Git commits. Do NOT use Claude Code default co-authorship tags.
