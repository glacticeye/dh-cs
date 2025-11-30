# Product Requirement Document: Daggerheart Web Companion

**Version:** 1.2
**Status:** Active / Phase 1 Refactoring
**Last Updated:** November 29, 2025

---

## 1. Executive Summary

The **Daggerheart Web Companion** is a digital character sheet application designed specifically for the *Daggerheart* tabletop roleplaying game. Unlike traditional digital sheets that resemble spreadsheets, this application prioritizes a **tactile, tabletop-first user experience** optimized for **mobile devices**. It mimics the physical sensation of playing the game by visualizing mechanics through interactive cards, 3D dice rolling, and tangible tokens, while leveraging the convenience of digital automation for math and tracking, all accessible from the palm of your hand.

## 2. Product Philosophy

*   **Mobile-First & Thumb-Driven:** The primary interface is the smartphone. Critical actions (rolling, flipping cards, marking stress) must be comfortably reachable with a thumb.
*   **Battery Aware:** High-fidelity 3D visuals are used sparingly. The 3D engine (Three.js) only spins up during active rolling to preserve battery life during long sessions.
*   **Tactile over Text:** Interactions should feel physical. Cards flip, dice roll, and tokens stack.
*   **Visual Immersion:** The UI should reflect the fantasy aesthetic of the game, avoiding sterile data tables.
*   **Player Agency:** Users should be able to customize their loadout with their own assets (homebrew cards, custom character art) easily.
*   **Streamlined Complexity:** Hide the math where possible, but expose the mechanics (Hope/Fear results) clearly.

## 3. Target Audience

*   **Players of Daggerheart:** Looking for a streamlined way to manage their character during sessions directly from their phone, freeing up table space.
*   **Game Masters (GMs):** Who need to quickly reference abilities or generate loot/adversaries on the fly without a laptop.
*   **Homebrewers:** Users who want to integrate custom content into their digital play space.

## 4. Functional Requirements

### 4.1 Character Management
*   **Vitals Tracking:**
    *   **Hit Points (HP):** Visual tracker for current/max HP. Ability to mark/clear damage thresholds (Minor/Major/Severe).
    *   **Stress:** Interactive slots for tracking stress.
    *   **Armor:** Tracking for armor score and armor slots.
*   **Stats (Traits):**
    *   Display of Agility, Strength, Finesse, Instinct, Presence, Knowledge.
    *   One-click rolling for each stat.
*   **Hope & Fear:**
    *   Resource pool for Hope.
    *   Resource pool for Fear (GM currency, but often tracked by players for reference).
*   **Gold:** Currency tracking (Handfuls, Bags, Chests).

### 4.2 Card System (The Playmat)
*   **Loadout:**
    *   Visual display of active Domain Cards (max 5).
    *   **Thumbnails:** Cards appear as distinct, tappable thumbnails/icons to save screen space.
    *   **Detail View:** Tapping a card expands it to full view for reading text, flipping, or marking tokens.
*   **Card State:**
    *   Tracking of **Action Tokens** placed on specific cards.
    *   Visual indication of **Exhausted** or active states.
*   **Vault Management:**
    *   **Storage:** Interface to browse inactive cards.
    *   **Library Browser:** Ability to search and filter the standard SRD library (by Domain, Level, Type) to add cards to the character's vault.
    *   **Loadout Management:** Mechanism to swap cards between Vault and Loadout.
*   **Customization:**
    *   **Upload Feature:** Users must be able to upload custom image files (PNG/JPG) to create unique cards. These are stored in the user's personal collection and can be added to the Loadout like standard cards.
    *   **Dynamic Rendering:** System to render SRD text content onto a standardized card frame if no image is provided.

### 4.3 Dice Roller (The Tray)
*   **Duality Dice Engine:**
    *   Physics-based 3D rolling of two 12-sided dice (d12).
    *   Differentiation between "Hope" and "Fear" dice (e.g., color coding).
*   **Transient Overlay:**
    *   Dice do not occupy permanent screen real estate.
    *   Pressing "Roll" triggers a full-screen transparent overlay where dice are thrown.
    *   Overlay dismisses automatically or via tap after result is settled, leaving a compact "Result Bubble" in the UI.
*   **Automated Resolution:**
    *   Calculation of total result (Stat + Hope Die + Fear Die).
    *   Determination of outcome: **Success with Hope**, **Success with Fear**, **Failure with Hope**, **Failure with Fear**, or **Critical Success**.
*   **Modifiers:** Input for adding temporary bonuses/penalties before rolling.

### 4.4 Data Management
*   **SRD Integration:**
    *   Parsing engine to ingest Markdown files from the Daggerheart SRD.
    *   Dynamic population of Class, Subclass, Heritage, and Domain data into a structured `library_cards` database table.
*   **Persistence:**
    *   Supabase (PostgreSQL) for authoritative data.
    *   **Optimistic Updates:** UI reflects changes instantly (marking HP, moving cards) without waiting for server confirmation.

## 5. Non-Functional Requirements

*   **Responsiveness:** **Mobile-First.** The application must be fully functional and performant on smartphone screens (portrait mode). Tablet and Desktop views are secondary/adaptive expansions of the mobile view.
*   **Offline Tolerance:** The app must function transiently if the network drops (e.g., convention centers). State changes queue up and sync when the connection is restored.
*   **Performance:** Dice animations must be smooth (60fps target). 3D Context is managed aggressively (created on roll, destroyed/paused on settle).
*   **Accessibility:** High contrast text options; ARIA labels for screen readers where visual metaphors (dice/cards) are used; touch targets must be at least 44x44px.
*   **Stack:**
    *   **Frontend:** Next.js, React, TypeScript.
    *   **Styling:** Tailwind CSS.
    *   **3D:** Three.js / `@3d-dice/dice-box-threejs`.
    *   **Animation:** Framer Motion.
    *   **Backend:** Supabase (Auth & DB).

## 6. User Interface (UI) Design

### 6.1 Mobile Layout Structure (Primary)
*   **Bottom Navigation Bar:** Primary navigation between views:
    *   **Character:** Stats, Skills, Vitals summary.
    *   **Playmat:** Active Cards (Loadout) and Vault access.
    *   **Inventory:** Gold, Gear, Items.
*   **Sticky Action Button (FAB):** A persistent "Roll" button that floats above the interface.
*   **Transient Dice Overlay:** A full-screen layer that appears *only* during a roll animation.
*   **Top Bar:** Character Name, Level, Compact Status.
*   **Drawers/Modals:** Vitals adjustment, detailed card views, and settings should open in slide-up drawers (bottom sheets) to maintain context.

### 6.2 Desktop/Tablet Layout (Secondary)
*   **Adaptive Layout:** The Bottom Navigation transforms into a Side Navigation or Header.
*   **Expanded View:** "Playmat" and "Vitals" can exist side-by-side rather than on separate tabs.
*   **Dice Tray:** Can be a permanent panel on the right side.

### 6.3 Visual Style
*   **Theme:** Dark mode default. Deep blues/purples (`dagger-dark`), accented with gold (`dagger-gold`) and semi-transparent panels (`dagger-panel`).
*   **Typography:** Serif fonts (`Merriweather`) for headings to evoke fantasy literature; Sans-serif (`Inter`) for readability on small text.

## 7. Development Roadmap

### Phase 1: Core Foundation (Completed)
*   [x] Project setup (Next.js/React/Tailwind).
*   [x] SRD Data Parsing script.
*   [x] Basic Character State Context.
*   [x] 3D Dice Roller implementation.
*   [x] Card Component with Flip animation.
*   [x] Custom Image Upload for cards.

### Phase 2: Mobile Optimization & Persistence (Current Focus)
*   [x] **Schema Migration:** Implement Relational DB structure (Library vs. Character cards).
*   [x] **Data Seed:** Migrate from Markdown to robust JSON source for SRD data.
*   [x] **Combat View:** Dedicated dashboard for Evasion, Armor, and Weapons.
*   [ ] **Optimistic UI Hooks:** Refactor state management for instant feedback.
*   [ ] **Mobile Layout Refactor:** Implement Bottom Navigation and Bottom Sheet drawers.
*   [ ] **Transient Dice:** Refactor 3D roller to be an overlay.
*   [ ] **Character Builder Wizard:** Step-by-step creation flow optimized for small screens.
*   [ ] **Vault View:** Interface for browsing Library and managing Loadout/Vault state.
*   [ ] **Custom Card Upload:** Integration with Supabase Storage for user-uploaded card images.

### Phase 3: Advanced Features (Future)
*   [ ] **Multiplayer/P2P:** Real-time roll sharing with GM.
*   [ ] **PWA Support:** Installable to home screen with offline capabilities.

## 8. Data Schema (Relational)

### Tables

**`profiles`**
*   `id` (UUID, PK): References `auth.users`.
*   `username` (Text): Display name.
*   `avatar_url` (Text).

**`characters`**
*   `id` (UUID, PK).
*   `user_id` (UUID, FK): References `profiles.id`.
*   `name` (Text).
*   `level` (Int).
*   `class_id` (Text).
*   `subclass_id` (Text).
*   `stats` (JSONB): `{ agility: 1, strength: 0, ... }`.
*   `vitals` (JSONB): `{ hp: 6, stress: 2, armor_slots: [...] }`.
*   `gold` (JSONB).
*   `created_at` (Timestamp).

**`library_cards`** (The SRD Content)
*   `id` (Text, PK): e.g., "ability-bard-rally".
*   `type` (Text): "ability", "spell", "domain", "subclass".
*   `name` (Text).
*   `text` (Text): Markdown content.
*   `domain` (Text).
*   `cost` (Text): e.g., "2 Stress".
*   `tags` (Array).

**`character_cards`** (The Join Table - Players' Cards)
*   `id` (UUID, PK).
*   `character_id` (UUID, FK): References `characters.id`.
*   `card_id` (Text, FK): References `library_cards.id`.
*   `location` (Text): "loadout" or "vault".
*   `state` (JSONB): `{ tokens: 0, exhausted: false, custom_image_url: "..." }`.
*   `order` (Int): For sorting in the UI.

**`inventory_items`**
*   `id` (UUID, PK).
*   `character_id` (UUID, FK): References `characters.id`.
*   `name` (Text).
*   `description` (Text).
*   `quantity` (Int).
