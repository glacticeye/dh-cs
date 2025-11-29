# Product Requirement Document: Daggerheart Web Companion

**Version:** 1.0  
**Status:** Active / Phase 1 Complete  
**Last Updated:** November 28, 2025

---

## 1. Executive Summary

The **Daggerheart Web Companion** is a digital character sheet application designed specifically for the *Daggerheart* tabletop roleplaying game. Unlike traditional digital sheets that resemble spreadsheets, this application prioritizes a **tactile, tabletop-first user experience**. It mimics the physical sensation of playing the game by visualizing mechanics through interactive cards, 3D dice rolling, and tangible tokens, while leveraging the convenience of digital automation for math and tracking.

## 2. Product Philosophy

*   **Tactile over Text:** Interactions should feel physical. Cards flip, dice roll, and tokens stack.
*   **Visual Immersion:** The UI should reflect the fantasy aesthetic of the game, avoiding sterile data tables.
*   **Player Agency:** Users should be able to customize their loadout with their own assets (homebrew cards, custom character art) easily.
*   **Streamlined Complexity:** Hide the math where possible, but expose the mechanics (Hope/Fear results) clearly.

## 3. Target Audience

*   **Players of Daggerheart:** Looking for a streamlined way to manage their character during sessions without losing the "feel" of the game.
*   **Game Masters (GMs):** Who need to quickly reference abilities or generate loot/adversaries (future scope).
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
    *   Cards are rendered as interactive 3D objects that can be flipped to reveal details.
*   **Vault:**
    *   Storage for inactive cards.
    *   Mechanism to swap cards between Vault and Loadout (paying Stress cost where applicable).
*   **Customization:**
    *   **Upload Feature:** Users must be able to upload custom image files to create unique cards.
    *   **Dynamic Rendering:** System to render SRD text content onto a standardized card frame if no image is provided.

### 4.3 Dice Roller (The Tray)
*   **Duality Dice Engine:**
    *   Physics-based 3D rolling of two 12-sided dice (d12).
    *   Differentiation between "Hope" and "Fear" dice (e.g., color coding).
*   **Automated Resolution:**
    *   Calculation of total result (Stat + Hope Die + Fear Die).
    *   Determination of outcome: **Success with Hope**, **Success with Fear**, **Failure with Hope**, **Failure with Fear**, or **Critical Success**.
*   **Modifiers:** Input for adding temporary bonuses/penalties before rolling.

### 4.4 Data Management
*   **SRD Integration:**
    *   Parsing engine to ingest Markdown files from the Daggerheart SRD.
    *   Dynamic population of Class, Subclass, Heritage, and Domain data.
*   **Persistence (Roadmap):**
    *   Local Storage saving of character state.
    *   Import/Export of character JSON files.

## 5. Non-Functional Requirements

*   **Performance:** Dice animations must be smooth (60fps target) on standard devices.
*   **Responsiveness:** Layout must adapt to desktop, tablet, and mobile screens.
*   **Accessibility:** High contrast text options; ARIA labels for screen readers where visual metaphors (dice/cards) are used.
*   **Stack:**
    *   **Frontend:** React, TypeScript, Vite.
    *   **Styling:** Tailwind CSS.
    *   **3D:** Three.js / `@3d-dice/dice-box-threejs`.
    *   **Animation:** Framer Motion.

## 6. User Interface (UI) Design

### 6.1 Layout Structure
*   **Header:** Character Name, Level, Class info, Gold.
*   **Left Panel (Vitals):** Vertical stack of HP, Stress, Armor, and Stat buttons.
*   **Center Stage (Playmat):** Horizontal scrollable area for Loadout cards.
*   **Right Panel (Dice Tray):** Dedicated container for 3D dice physics and result readouts.

### 6.2 Visual Style
*   **Theme:** Dark mode default. Deep blues/purples (`dagger-dark`), accented with gold (`dagger-gold`) and semi-transparent panels (`dagger-panel`).
*   **Typography:** Serif fonts (`Merriweather`) for headings to evoke fantasy literature; Sans-serif (`Inter`) for readability on small text.

## 7. Development Roadmap

### Phase 1: Core Foundation (Completed)
*   [x] Project setup (Vite/React/Tailwind).
*   [x] SRD Data Parsing script.
*   [x] Basic Character State Context.
*   [x] 3D Dice Roller implementation.
*   [x] Card Component with Flip animation.
*   [x] Custom Image Upload for cards.

### Phase 2: Builder & Persistence (Current Focus)
*   [ ] **Character Builder Wizard:** Step-by-step creation flow (Class -> Heritage -> Stats -> Gear).
*   [ ] **Data Persistence:** Auto-save to `localStorage`.
*   [ ] **Inventory System:** Expanded inventory management beyond just gold.
*   [ ] **Card Drag-and-Drop:** Organize Loadout via drag-and-drop interface.

### Phase 3: Advanced Features (Future)
*   [ ] **Multiplayer/P2P:** WebRTC connection to share rolls with a GM.
*   [ ] **Compendium Browser:** Searchable database of all SRD spells/abilities within the app.
*   [ ] **Mobile Optimization:** Dedicated mobile view with collapsible drawers for Vitals/Dice.

## 8. Data Schema

### Character Object
```json
{
  "id": "uuid",
  "name": "String",
  "level": "Number",
  "class": "String",
  "subclass": "String",
  "stats": {
    "agility": "Number",
    "strength": "Number",
    "finesse": "Number",
    "instinct": "Number",
    "presence": "Number",
    "knowledge": "Number"
  },
  "vitals": {
    "hp": "Number",
    "currentHp": "Number",
    "stress": "Number",
    "currentStress": "Number",
    "hope": "Number",
    "fear": "Number"
  },
  "loadout": ["CardObject"],
  "vault": ["CardObject"],
  "inventory": ["ItemObject"]
}
```
