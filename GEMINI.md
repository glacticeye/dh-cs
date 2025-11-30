# Daggerheart Web Companion - Developer Guide

## 1. Project Overview
**Daggerheart Web Companion** is a mobile-first, digital character sheet for the Daggerheart Tabletop RPG. It prioritizes a tactile, "toy-like" experience (card flipping, 3D dice rolling) over spreadsheet-style data management.

Prior to starting development, please review the Product Requirements Document (docs/PRD.md).

### Key Technologies
*   **Framework:** Next.js 15 (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS v4
*   **State Management:** Zustand
*   **Backend:** Supabase (PostgreSQL + Auth)
*   **UI Library:** Radix UI (via shadcn/ui), Framer Motion
*   **3D:** `@3d-dice/dice-box` (Three.js wrapper)

## 2. Setup & Run

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Access the app at `http://localhost:3000`.

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

### Database Setup (Supabase)
1.  **Schema:** Run content of `supabase/schema.sql` in the Supabase SQL Editor to create tables (e.g., `profiles`, `character_cards`, `character_inventory`) and their respective RLS policies. Note that the `public.library` and `public.characters` tables' creation and their RLS policies are now handled by the seed data script.
2.  **Seed Data:**
    *   The game data (classes, abilities) is stored in JSON files in `srd/json/`.
    *   To populate or re-populate the `public.library` table in the database, run the parser script:
        ```bash
        node scripts/parse_json_srd.js
        ```
    *   This generates `supabase/seed_library.sql`. **Always examine the output of `node scripts/parse_json_srd.js` for "Total entries" to ensure data was parsed correctly.** If "Total entries: 0" appears, it indicates an issue with the SRD JSON files or the script itself.
    *   The generated `supabase/seed_library.sql` file will automatically include `DROP TABLE IF EXISTS` and `CREATE TABLE` statements along with their RLS policies for `public.characters` and `public.library` at the beginning, allowing for easy recreation, RLS setup, and repopulation of these tables during development.
    *   **After generating the seed file, run the contents of `supabase/seed_library.sql` in your Supabase SQL Editor.** Always check the Supabase SQL Editor output for any errors during execution.

## 3. Architecture & Conventions

### Directory Structure
*   `app/`: Next.js App Router pages.
    *   `(playground)/`: Main authenticated application views.
    *   `auth/`: Authentication routes.
*   `components/`:
    *   `ui/`: Reusable primitives (shadcn/ui).
    *   `views/`: Feature-specific views (Character, Playmat, Inventory).
    *   `daggerheart-app.tsx`: Main layout wrapper for the game view.
*   `srd/`: **Source of Truth** for game data. Markdown files organized by type (abilities, classes, etc.).
*   `store/`: Global state using Zustand (`character-store.ts`).
*   `scripts/`: Node.js scripts for data processing.
*   `supabase/`: SQL schemas and seeds.

### Data Flow Strategy
1.  **SRD Ingestion:** Markdown files are parsed -> SQL Inserts -> `library` table.
2.  **Character Data:** Fetched from `characters` table.
3.  **"Manual Join" Pattern:**
    *   The `library` table is separate from user data.
    *   The frontend fetches the `character` + `character_cards`.
    *   It extracts `card_id`s and performs a second fetch to `library` to get the actual card text/stats.
    *   These are stitched together in `store/character-store.ts` before updating the state.
    *   *Reasoning:* Keeps the highly relational nature of RPG data manageable without complex SQL joins on every read.

### State Management (Zustand)
*   **`useCharacterStore`:** The single source of truth for the active session.
*   **Optimistic Updates:** Vitals (HP, Stress) update immediately in the UI while the async request to Supabase resolves in the background.

### Mobile-First Design
*   The UI is optimized for portrait mobile usage.
*   **Navigation:** Bottom bar for primary views.
*   **Interaction:** Swipe gestures, tap-to-flip cards, and a "Floaty" Action Button (FAB) for rolling dice.

## 4. Common Development Tasks

### Adding New Game Content (SRD)
1.  Create or edit a JSON file in the appropriate `srd/json/` subdirectory (e.g., `srd/json/abilities.json`).
2.  Run `node scripts/parse_json_srd.js`.
3.  Apply the generated `supabase/seed_library.sql` to your database (refer to "Database Setup (Supabase) -> Seed Data" for detailed instructions).

### Modifying Database Schema
1.  Edit `supabase/schema.sql` to reflect changes (excluding the `public.characters` and `public.library` tables' schema or RLS policies).
2.  If changing the `public.characters` or `public.library` tables' structure or RLS policies, update `scripts/parse_json_srd.js` to modify the respective `CREATE TABLE` statements and reflect new columns/types or RLS policies.
3.  Update TypeScript interfaces in `store/character-store.ts`.

## 5. Style & Formatting
*   **Code Style:** Standard TypeScript/Prettier.
*   **Components:** Functional components with named exports.
*   **Naming:** `kebab-case` for files, `PascalCase` for components, `camelCase` for functions/variables.
*   **CSS:** Utility-first (Tailwind). Custom colors (e.g., `dagger-dark`, `dagger-gold`) are defined in `app/globals.css`.
