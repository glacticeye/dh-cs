# Daggerheart Companion - Database Schema

This document outlines the database schema for the Daggerheart Companion application, specifically focusing on the `library` table and the structure of the JSONB data stored within it.

## Core Tables

### `library`
The `library` table stores all static game data (SRD content). It uses a single-table inheritance pattern where the specific fields for each item type are stored in a `data` JSONB column.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `TEXT` (PK) | Unique identifier (slugified). E.g., `class-bard`, `weapon-longsword`. |
| `type` | `TEXT` | The category of the item. E.g., `class`, `subclass`, `weapon`, `armor`, `spell`. |
| `name` | `TEXT` | The display name of the item. |
| `domain` | `TEXT` | (Optional) The domain associated with the item (e.g., `Blade`, `Arcana`). |
| `tier` | `INT` | (Optional) The tier or level of the item. |
| `data` | `JSONB` | Unstructured data specific to the `type`. See below for schemas. |
| `created_at` | `TIMESTAMP` | Creation timestamp. |

---

## JSONB Data Schemas (by Type)

### Class (`type: 'class'`)
Stores core class information, starting stats, and features.

```json
{
  "description": "String (Markdown)",
  "starting_evasion": Integer,
  "starting_hp": Integer,
  "items_text": "String (Starting items description)",
  "domains": ["String", "String"], // E.g. ["Blade", "Bone"]
  "hope_feature": {
    "name": "String",
    "description": "String"
  },
  "class_features": [
    {
      "name": "String",
      "text": "String"
    }
  ],
  "subclass_names": ["String", "String"], // Names of available subclasses
  "suggested": {
    "traits": "String (e.g., '+2, +1, 0, ...')",
    "primary_weapon": "String",
    "secondary_weapon": "String",
    "armor": "String"
  },
  "background_questions": [
    { "question": "String" }
  ],
  "connection_questions": [
    { "question": "String" }
  ]
}
```

### Subclass (`type: 'subclass'`)
Stores subclass-specific features.

```json
{
  "description": "String (Markdown)",
  "spellcast_trait": "String", // E.g., "Presence", "Instinct", or null
  "parent_class_id": "String", // ID of the parent class (e.g., "class-bard") - Added by post-processing
  "foundation_features": [
    { "name": "String", "text": "String" }
  ],
  "specialization_features": [
    { "name": "String", "text": "String" }
  ],
  "mastery_features": [
    { "name": "String", "text": "String" }
  ],
  "extras": "String (Markdown)" // Additional rules like Beastform or Companion stats
}
```

### Ancestry (`type: 'ancestry'`)
Stores ancestry features.

```json
{
  "description": "String (Markdown)",
  "features": [
    { "name": "String", "text": "String" }
  ]
}
```

### Community (`type: 'community'`)
Stores community features.

```json
{
  "description": "String (Markdown)",
  "note": "String (Flavor text)",
  "features": [
    { "name": "String", "text": "String" }
  ]
}
```

### Ability / Spell / Grimoire (`type: 'ability' | 'spell' | 'grimoire'`)
Represents cards placed on the playmat.

```json
{
  "description": "String (Markdown text of the ability)",
  "recall_cost": Integer,
  "level": Integer
}
```

### Weapon (`type: 'weapon'`)
Stores weapon statistics.

```json
{
  "type": "String", // "Physical" or "Magical"
  "hand": "String", // "Primary" or "Secondary"
  "trait": "String", // Stat used (e.g., "Agility", "Strength")
  "range": "String", // "Melee", "Very Close", "Far", etc.
  "damage": "String", // Dice notation (e.g., "d10+2 phy")
  "burden": "String", // "One-Handed" or "Two-Handed"
  "feature": {
    "name": "String", // Optional weapon feature name (e.g., "Reliable")
    "text": "String"  // Description of the feature
  }
}
```

### Armor (`type: 'armor'`)
Stores armor statistics.

```json
{
  "base_score": Integer,
  "base_thresholds": "String", // E.g., "5 / 11"
  "feature": {
    "name": "String", // Optional armor feature name
    "text": "String"
  }
}
```

### Adversary (`type: 'adversary'`)
Stores GM-facing monster/enemy data.

```json
{
  "description": "String",
  "motives": "String",
  "difficulty": "String", // String because sometimes it's "Special"
  "thresholds": "String", // "Minor/Major"
  "hp": "String",
  "stress": "String",
  "attack": {
    "name": "String",
    "modifier": "String", // E.g., "+3"
    "range": "String",
    "damage": "String"
  },
  "features": [
    { "name": "String", "text": "String" }
  ]
}
```

### Consumable (`type: 'consumable'`)
Single-use items.

```json
{
  "description": "String"
}
```
