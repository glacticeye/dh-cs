import { create } from 'zustand';
import createClient from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

// Define interfaces for related data
export interface LibraryItem {
  id: string;
  type: string;
  name: string;
  domain?: string;
  tier?: number;
  data: any; // JSONB column content
}

export interface CharacterCard {
  id: string;
  character_id: string;
  card_id: string;
  location: 'loadout' | 'vault' | 'feature';
  state: { tokens?: number; exhausted?: boolean; custom_image_url?: string };
  sort_order?: number;
  library_item?: LibraryItem; // Joined data for the card itself
}

export interface CharacterInventoryItem {
  id: string;
  character_id: string;
  item_id?: string; // Foreign key to library, nullable for custom items
  name: string;
  description?: string;
  location: 'equipped_primary' | 'equipped_secondary' | 'armor' | 'equipped_armor' | 'backpack';
  quantity: number;
  library_item?: LibraryItem; // Joined data for the item itself
}

export interface Character {
  id: string;
  user_id: string;
  name: string;
  level: number;
  ancestry?: string;
  community?: string;
  class_id?: string;
  subclass_id?: string;
  stats: {
    agility: number;
    strength: number;
    finesse: number;
    instinct: number;
    presence: number;
    knowledge: number;
  };
  vitals: {
    hp_max: number;
    hp_current: number;
    stress_max: number;
    stress_current: number;
    armor_max: number;
    armor_current: number;
  };
  hope: number;
  fear: number;
  evasion: number;
  proficiency: number;
  experiences: string[];
  gold: {
    handfuls: number;
    bags: number;
    chests: number;
  };
  image_url?: string;
  
  // Relations
  character_cards?: CharacterCard[];
  character_inventory?: CharacterInventoryItem[];
  class_data?: LibraryItem; // Joined class data
}

export interface RollResult {
  hope: number;
  fear: number;
  total: number;
  modifier: number;
  type: 'Critical' | 'Hope' | 'Fear';
}

interface CharacterState {
  character: Character | null;
  isLoading: boolean;
  user: User | null;
  
  activeTab: 'character' | 'playmat' | 'inventory' | 'combat';
  isDiceOverlayOpen: boolean;
  activeRoll: { label: string; modifier: number } | null;
  lastRollResult: RollResult | null;
  
  setCharacter: (char: Character | null) => void;
  setUser: (user: User | null) => void;
  setActiveTab: (tab: 'character' | 'playmat' | 'inventory' | 'combat') => void;
  openDiceOverlay: () => void;
  closeDiceOverlay: () => void;
  prepareRoll: (label: string, modifier: number) => void;
  setLastRollResult: (result: RollResult) => void;
  fetchCharacter: (userId: string) => Promise<void>;
  fetchUser: () => Promise<void>; // Add fetchUser to interface
  
  updateVitals: (type: 'hp_current' | 'stress_current' | 'armor_current', value: number) => Promise<void>;
}

export const useCharacterStore = create<CharacterState>((set, get) => ({
  character: null,
  isLoading: true,
  user: null,
  
  activeTab: 'character',
  isDiceOverlayOpen: false,
  activeRoll: null,
  lastRollResult: null,
  
  setCharacter: (char) => set({ character: char, isLoading: false }),
  setUser: (user) => set({ user }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  openDiceOverlay: () => set({ isDiceOverlayOpen: true }),
  closeDiceOverlay: () => set({ isDiceOverlayOpen: false, activeRoll: null }), // Clear active roll on close
  prepareRoll: (label, modifier) => set({ isDiceOverlayOpen: true, activeRoll: { label, modifier } }),
  setLastRollResult: (result) => set({ lastRollResult: result }),
  
  fetchUser: async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      set({ user });
      
      // Ensure profile exists
      const { data: profile, error: profileError } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
      
      if (!profile) {
        console.log("Profile missing, creating for user:", user.id);
        const { error: insertError } = await supabase.from('profiles').insert({
          id: user.id,
          username: user.user_metadata.full_name || user.email?.split('@')[0] || 'Traveler',
          avatar_url: user.user_metadata.avatar_url
        });
        
        if (insertError) {
            console.error("Error creating profile:", insertError);
        } else {
            console.log("Profile created successfully.");
        }
      }
      
      // Then fetch character
      get().fetchCharacter(user.id);
    } else {
      set({ user: null, character: null, isLoading: false });
    }
  },

  fetchCharacter: async (userId: string) => {
    set({ isLoading: true });
    const supabase = createClient();
    
    // 1. Fetch core character first
    const { data: charData, error: charError } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();
      
    if (charError) {
      console.error('Error fetching character (core):', charError.message);
      set({ isLoading: false, character: null });
      return;
    }

    if (!charData) {
       set({ isLoading: false, character: null });
       return;
    }

    // 2. Manual Join Strategy
    // A. Fetch raw relation tables
    const { data: cardsData, error: cardsError } = await supabase
        .from('character_cards')
        .select('*') // Fetch all columns including card_id
        .eq('character_id', charData.id);

    if (cardsError) {
        console.error('Error fetching cards (raw):', {
            message: cardsError.message,
            code: cardsError.code,
            details: cardsError.details,
            hint: cardsError.hint
        });
    }

    const { data: inventoryData, error: inventoryError } = await supabase
        .from('character_inventory')
        .select('*') // Fetch all columns including item_id
        .eq('character_id', charData.id);

    if (inventoryError) {
        console.error('Error fetching inventory (raw):', {
            message: inventoryError.message,
            code: inventoryError.code,
            details: inventoryError.details,
            hint: inventoryError.hint
        });
    }

    // B. Collect IDs for Library Fetch
    const libraryIds = new Set<string>();
    cardsData?.forEach((c: any) => libraryIds.add(c.card_id));
    inventoryData?.forEach((i: any) => { if(i.item_id) libraryIds.add(i.item_id); });
    
    // Add class_id if it exists
    let classIdToFetch = null;
    if (charData.class_id) {
        // Assuming class_id stored in charData is actually the name (e.g., 'Bard') or partial ID
        // Our library IDs are 'class-bard'. If charData.class_id is 'Bard', we might need to slugify.
        // However, creating character saves the library NAME ('Bard').
        // We need to find the library item where type='class' and name=charData.class_id
        // OR we update create-character to save the ID.
        // Given current state, let's try to find by ID 'class-[slug]' first.
        const slug = charData.class_id.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
        classIdToFetch = `class-${slug}`;
        libraryIds.add(classIdToFetch);
    }

    // C. Fetch Library Items
    let libraryMap = new Map<string, LibraryItem>();
    if (libraryIds.size > 0) {
        const { data: libData, error: libError } = await supabase
            .from('library')
            .select('*')
            .in('id', Array.from(libraryIds));
        
        if (libError) console.error('Error fetching library items:', libError.message);
        
        if (libData) {
            libData.forEach((item: LibraryItem) => libraryMap.set(item.id, item));
        }
    }

    // D. Stitch Data
    const enrichedCards = cardsData?.map((card: any) => ({
        ...card,
        library_item: libraryMap.get(card.card_id)
    })) || [];

    const enrichedInventory = inventoryData?.map((item: any) => ({
        ...item,
        library_item: item.item_id ? libraryMap.get(item.item_id) : undefined
    })) || [];
    
    const classData = classIdToFetch ? libraryMap.get(classIdToFetch) : undefined;


    const fullCharacter = {
        ...charData,
        character_cards: enrichedCards,
        character_inventory: enrichedInventory,
        class_data: classData,
        stats: typeof charData.stats === 'string' ? JSON.parse(charData.stats) : charData.stats,
        vitals: typeof charData.vitals === 'string' ? JSON.parse(charData.vitals) : charData.vitals,
        gold: typeof charData.gold === 'string' ? JSON.parse(charData.gold) : charData.gold,
    };

    set({ character: fullCharacter as Character, isLoading: false });
  },
  
  updateVitals: async (type, value) => {
    const state = get();
    if (!state.character) return;
    
    const newVitals = { ...state.character.vitals };
    let actualValue = value;

    if (type === 'hp_current') actualValue = Math.min(newVitals.hp_max, Math.max(0, value));
    if (type === 'stress_current') actualValue = Math.min(newVitals.stress_max, Math.max(0, value));
    if (type === 'armor_current') actualValue = Math.min(newVitals.armor_max, Math.max(0, value));

    const updatedVitals = { ...newVitals, [type]: actualValue };

    // Optimistically update UI
    set((s) => ({
      character: s.character ? { ...s.character, vitals: updatedVitals } : null,
    }));

    // Persist to DB
    const supabase = createClient();
    const { error } = await supabase
      .from('characters')
      .update({ vitals: updatedVitals })
      .eq('id', state.character.id);

    if (error) {
      console.error('Error updating vitals:', error);
      // TODO: Revert optimistic update if DB update fails
    }
  },
}));