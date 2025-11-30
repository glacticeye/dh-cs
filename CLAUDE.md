# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Daggerheart Web Companion is a mobile-first digital character sheet for the Daggerheart TTRPG. The app emphasizes a tactile, playful experience with card flipping animations, 3D dice rolling, and swipe gestures rather than traditional spreadsheet-style data management.

**Key Technologies:**
- Next.js 15 (App Router) with TypeScript
- Tailwind CSS v4 for styling
- Zustand for state management
- Supabase (PostgreSQL + Auth)
- Radix UI primitives (via shadcn/ui) + Framer Motion
- `@3d-dice/dice-box` for 3D dice rolling (Three.js wrapper)

## Development Commands

### Core Commands
```bash
npm install          # Install dependencies
npm run dev          # Start dev server with Turbopack (http://localhost:3000)
npm run build        # Production build
npm run lint         # Run ESLint
```

### Lint Configuration
- ESLint currently has several rules disabled (see `eslint.config.mjs:15-23`)
- `@typescript-eslint/no-unused-vars`, `no-unused-vars`, and `@typescript-eslint/no-explicit-any` are temporarily off
- **Before committing:** Lint and resolve ALL warnings and errors (per user's global instructions)

### Database Setup
1. Run `supabase/schema.sql` in Supabase SQL Editor to create tables and RLS policies
2. Parse SRD data: `node scripts/parse_srd.js` (or `parse_json_srd.js` for JSON format)
3. Run generated `supabase/seed_library.sql` in Supabase SQL Editor

## Architecture

### Directory Structure
- `app/` - Next.js App Router pages
  - `(playground)/` - Main authenticated views (client, server, profile)
  - `auth/` - Authentication routes
  - `create-character/` - Character creation flow
- `components/`
  - `ui/` - Reusable shadcn/ui primitives
  - `views/` - Feature-specific views (character-view, combat-view, inventory-view, playmat-view)
  - `daggerheart-app.tsx` - Main layout wrapper
  - `dice-overlay.tsx` - 3D dice roller overlay
  - `mobile-layout.tsx` - Mobile navigation shell
- `srd/` - **Source of Truth** for game data (Markdown/JSON/CSV formats)
- `store/` - Zustand global state (`character-store.ts`)
- `lib/supabase/` - Supabase client/server utilities
- `types/` - TypeScript type definitions
- `scripts/` - Node.js data processing scripts
- `supabase/` - SQL schemas and seed files

### Critical Data Flow Pattern: "Manual Join"

This codebase uses a **two-step fetch pattern** to separate user data from library data:

1. **Library Table** (`public.library`): Contains all game content (abilities, classes, items, etc.) as immutable reference data
2. **User Data Tables** (`characters`, `character_cards`, `character_inventory`): Contains user-specific instances with foreign keys to `library`

**How it works:**
1. Fetch user's `character` record + related `character_cards` rows
2. Extract all `card_id` values from `character_cards`
3. Perform a second query to `library` to fetch the actual card definitions
4. **Stitch together** in `store/character-store.ts` before updating Zustand state

**Why:** Keeps RPG's highly relational data manageable without complex SQL joins on every read. Library content is immutable; user state (tokens, exhausted, custom images) lives in junction tables.

### State Management (Zustand)

- **`useCharacterStore`** (`store/character-store.ts`) is the single source of truth for the active character session
- **Optimistic updates:** Vitals (HP, Stress, Armor) update immediately in UI while async Supabase request resolves in background
- Store holds fully hydrated character data with library items stitched in via the manual join pattern

### Supabase Client/Server Split

- `lib/supabase/client.ts` - Client-side Supabase client (browser)
- `lib/supabase/server.ts` - Server-side Supabase client (SSR)
- `lib/supabase/middleware.ts` - Session refresh middleware
- `middleware.ts` - Applies session middleware to `/profile` and `/login` routes

### SRD (System Reference Document) Data Pipeline

**Source formats:** Markdown, JSON, or CSV files in `srd/` subdirectories

**Processing:**
1. Edit or add files in `srd/markdown/`, `srd/json/`, or `srd/csv/`
2. Run `node scripts/parse_srd.js` (Markdown parser) or `node scripts/parse_json_srd.js` (JSON parser)
3. Script generates `supabase/seed_library.sql` with INSERT statements
4. Apply generated SQL to database

**Important:** The `library` table schema must match the parser output. If schema changes, update both `supabase/schema.sql` and the relevant parser script.

## UI/UX Patterns

### Mobile-First Design
- Optimized for portrait mobile (primary target)
- Bottom navigation bar for primary views
- Swipe gestures, tap-to-flip cards, FAB (Floating Action Button) for dice rolling
- Custom Tailwind colors: `dagger-dark`, `dagger-gold`, etc. (defined in `app/globals.css`)

### Component Conventions
- Functional components with named exports
- File naming: `kebab-case.tsx`
- Component naming: `PascalCase`
- Functions/variables: `camelCase`

### Styling
- **Utility-first Tailwind CSS** (v4)
- Minimal custom CSS in `app/globals.css` for theme colors and dice-box styles
- Use `cn()` utility from `lib/utils.ts` for conditional classes

## TypeScript Configuration

- **Strict mode enabled** (`tsconfig.json:7`)
- Path alias: `@/*` maps to project root
- Target: ES2017
- Some type strictness temporarily relaxed in ESLint (see Lint Configuration section)

## Common Patterns

### Adding New Game Content
1. Create/edit file in `srd/markdown/[type]/` or `srd/json/[type]/`
2. Run parser: `node scripts/parse_srd.js` or `node scripts/parse_json_srd.js`
3. Apply `supabase/seed_library.sql` to database
4. Content automatically available via library queries

### Modifying Database Schema
1. Update `supabase/schema.sql`
2. If changing `library` table structure, update parser scripts to match new columns
3. Update TypeScript interfaces in `store/character-store.ts` (`LibraryItem`, `Character`, etc.)
4. Apply schema changes to Supabase

### Working with Character Data
- Always use `useCharacterStore` for character state
- Perform optimistic UI updates for vitals (HP, Stress, Armor)
- Remember the two-step fetch pattern: fetch user data, then fetch library data, then stitch
- See `store/character-store.ts` for full interface definitions

## Git Commit Configuration

**Important:** Use `alex.plocik.home@gmail.com` for Git commits. Do NOT use Claude Code default co-authorship tags.
