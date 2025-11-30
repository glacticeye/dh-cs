'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCharacterStore, Character } from '@/store/character-store';
import createClient from '@/lib/supabase/client';
import clsx from 'clsx';
import { Sparkle, HandMetal, Shield, BookOpen, User as UserIcon, Coins } from 'lucide-react';

// Define the shape of our form data
interface CharacterFormData {
  name: string;
  image_url?: string;
  ancestry_id: string; // will store library ID
  community_id: string; // will store library ID
  class_id: string; // will store library ID
  subclass_id: string; // will store library ID
  stats: {
    agility: number;
    strength: number;
    finesse: number;
    instinct: number;
    presence: number;
    knowledge: number;
  };
  experiences: [string, string];
}

// Minimal Library Item type for dropdowns and lookup
interface LibraryLookupItem {
  id: string;
  type: string;
  name: string;
  domain?: string;
  tier?: number;
  data: Record<string, any>; // Keep 'any' for now, as JSONB is highly variable and strict typing would be complex here.
}

export default function CreateCharacterPage() {
  const router = useRouter();
  const { user, fetchCharacter } = useCharacterStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<CharacterFormData>>({
    name: '',
    image_url: '',
    stats: { agility: 0, strength: 0, finesse: 0, instinct: 0, presence: 0, knowledge: 0 },
    experiences: ['', '']
  });
  const [calculatedVitals, setCalculatedVitals] = useState({ hp: 0, stress: 0, armor: 0, evasion: 10 });
  const [startingItemsAndCards, setStartingItemsAndCards] = useState<{cards: string[], weapons: string[], armor: string[], misc: string[], gold: {handfuls: number, bags: number, chests: number}}>({
    cards: [], weapons: [], armor: [], misc: [], gold: {handfuls: 0, bags: 0, chests: 0}
  });


  // State to hold all relevant lookup data from Supabase Library
  const [libraryData, setLibraryData] = useState<{
    ancestries: LibraryLookupItem[];
    communities: LibraryLookupItem[];
    classes: LibraryLookupItem[];
    subclasses: LibraryLookupItem[];
    weapons: LibraryLookupItem[];
    armor: LibraryLookupItem[];
    consumables: LibraryLookupItem[];
    abilities: LibraryLookupItem[];
    spells: LibraryLookupItem[];
    grimoires: LibraryLookupItem[];
  }>({
    ancestries: [], communities: [], classes: [], subclasses: [], weapons: [], armor: [], consumables: [], abilities: [], spells: [], grimoires: []
  });
  // libraryLoading is used implicitly in JSX (libraryLoading ? ... : ...)
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initial trait assignment values as per Daggerheart rules
  const TRAIT_ASSIGNMENT_POOL = useMemo(() => [2, 1, 1, 0, 0, -1], []);
  const [availableTraitValues, setAvailableTraitValues] = useState<number[]>([]);
  const [selectedTraitValue, setSelectedTraitValue] = useState<number | null>(null);

  useEffect(() => {
    setAvailableTraitValues([...TRAIT_ASSIGNMENT_POOL]);
  }, [TRAIT_ASSIGNMENT_POOL]);


  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const fetchAllLibraryData = async () => {
      setLibraryLoading(true);
      setError(null);
      const supabase = createClient();
      
      const { data: ancestriesData, error: e1 } = await supabase.from('library').select('*').eq('type', 'ancestry');
      const { data: communitiesData, error: e2 } = await supabase.from('library').select('*').eq('type', 'community');
      const { data: classesData, error: e3 } = await supabase.from('library').select('*').eq('type', 'class');
      const { data: subclassesData, error: e4 } = await supabase.from('library').select('*').eq('type', 'subclass');
      const { data: weaponsData, error: e5 } = await supabase.from('library').select('*').eq('type', 'weapon');
      const { data: armorData, error: e6 } = await supabase.from('library').select('*').eq('type', 'armor');
      const { data: consumablesData, error: e7 } = await supabase.from('library').select('*').eq('type', 'consumable');
      const { data: abilitiesData, error: e8 } = await supabase.from('library').select('*').eq('type', 'ability');
      const { data: spellsData, error: e9 } = await supabase.from('library').select('*').eq('type', 'spell');
      const { data: grimoiresData, error: e10 } = await supabase.from('library').select('*').eq('type', 'grimoire');


      if (e1 || e2 || e3 || e4 || e5 || e6 || e7 || e8 || e9 || e10) {
        setError("Failed to load SRD data: " + (e1?.message || e2?.message || e3?.message || e4?.message || e5?.message || e6?.message || e7?.message || e8?.message || e9?.message || e10?.message));
        console.error(e1, e2, e3, e4, e5, e6, e7, e8, e9, e10);
      } else {
        setLibraryData({
          ancestries: ancestriesData || [],
          communities: communitiesData || [],
          classes: classesData || [],
          subclasses: subclassesData || [],
          weapons: weaponsData || [],
          armor: armorData || [],
          consumables: consumablesData || [],
          abilities: abilitiesData || [],
          spells: spellsData || [],
          grimoires: grimoiresData || [],
        });
      }
      setLibraryLoading(false);
    };

    fetchAllLibraryData();
  }, [user, router]);

  // Effect to calculate vitals and starting gear based on Class/Ancestry selection
  useEffect(() => {
    if (formData.class_id && libraryData.classes.length > 0) {
      const selectedClass = libraryData.classes.find(c => c.id === formData.class_id);
      if (selectedClass) {
        setCalculatedVitals({
          hp: selectedClass.data.starting_hp || 5,
          stress: selectedClass.data.starting_stress || 6,
          armor: selectedClass.data.starting_armor_score || 0,
          evasion: 10
        });

        const initialCards: string[] = [];
        const initialWeapons: string[] = [];
        const initialArmor: string[] = [];
        const initialMiscItems: string[] = [];
        const initialGold = { handfuls: 0, bags: 0, chests: 0 };

        // --- Determine Initial Gold from Class Items Raw ---
        if (selectedClass.data.class_items_raw && selectedClass.data.class_items_raw.includes('handful of gold')) {
            initialGold.handfuls = 1; // Default to 1 for now if mentioned
        } else {
          initialGold.handfuls = 1; // All classes seem to start with a handful of gold.
        }

        // --- Determine Initial Misc Items from Class Items Raw ---
        if (selectedClass.data.class_items_raw) {
            if (selectedClass.data.class_items_raw.includes('Minor Health Potion')) {
                initialMiscItems.push('consumable-minor-health-potion');
            } else if (selectedClass.data.class_items_raw.includes('Minor Stamina Potion')) {
                initialMiscItems.push('consumable-minor-stamina-potion');
            }
            // Add more specific logic for other class items based on parsing class_items_raw.
            // For example, finding 'torch', '50 feet of rope', 'basic supplies'
            const defaultItems = [
              'torch', '50 feet of rope', 'basic supplies'
            ];
            defaultItems.forEach(itemName => {
              // Basic check, could be improved with slug comparison or regex
              if (selectedClass.data.class_items_raw.toLowerCase().includes(itemName)) {
                // Not ideal, but for now we'll just push a generic item with the name
                initialMiscItems.push(`misc-${itemName.toLowerCase().replace(/\s/g, '-')}`); 
              }
            });
        }
        
        // --- Determine Initial Weapons and Armor based on Class ---
        let defaultPrimaryWeaponId: string | undefined;
        let defaultSecondaryWeaponId: string | undefined;
        let defaultArmorId: string | undefined;

        if (selectedClass.name === 'Warrior') {
          defaultPrimaryWeaponId = libraryData.weapons.find(w => w.name === 'Longsword' && w.tier === 1)?.id;
          defaultSecondaryWeaponId = libraryData.weapons.find(w => w.name === 'Handaxe' && w.tier === 1)?.id; // Example based on Warrior template
          defaultArmorId = libraryData.armor.find(a => a.name === 'Medium Leather Armor' && a.tier === 1)?.id; // Example
        } else if (selectedClass.name === 'Guardian') {
          defaultPrimaryWeaponId = libraryData.weapons.find(w => w.name === 'Longsword' && w.tier === 1)?.id;
          defaultSecondaryWeaponId = libraryData.weapons.find(w => w.name === 'Round Shield' && w.tier === 1)?.id;
          defaultArmorId = libraryData.armor.find(a => a.name === 'Chainmail Armor' && a.tier === 1)?.id;
        } else if (selectedClass.name === 'Ranger') {
          defaultPrimaryWeaponId = libraryData.weapons.find(w => w.name === 'Longbow' && w.tier === 1)?.id;
          defaultSecondaryWeaponId = libraryData.weapons.find(w => w.name === 'Hunting Knife' && w.tier === 1)?.id;
          defaultArmorId = libraryData.armor.find(a => a.name === 'Padded Leather Armor' && a.tier === 0)?.id; // Assuming Padded is tier 0
        } else if (selectedClass.name === 'Rogue') {
          defaultPrimaryWeaponId = libraryData.weapons.find(w => w.name === 'Dual Daggers' && w.tier === 1)?.id;
          defaultSecondaryWeaponId = libraryData.weapons.find(w => w.name === 'Hand Crossbow' && w.tier === 1)?.id;
          defaultArmorId = libraryData.armor.find(a => a.name === 'Padded Leather Armor' && a.tier === 0)?.id;
        } else if (selectedClass.name === 'Bard') {
          defaultPrimaryWeaponId = libraryData.weapons.find(w => w.name === 'Curved Sword' && w.tier === 1)?.id;
          defaultSecondaryWeaponId = libraryData.weapons.find(w => w.name === 'Shortbow' && w.tier === 1)?.id;
          defaultArmorId = libraryData.armor.find(a => a.name === 'Light Leather Armor' && a.tier === 0)?.id;
        } else if (selectedClass.name === 'Druid') {
          defaultPrimaryWeaponId = libraryData.weapons.find(w => w.name === 'Wooden Staff' && w.tier === 0)?.id; // Assuming tier 0 for Wooden Staff
          defaultSecondaryWeaponId = libraryData.weapons.find(w => w.name === 'Sling' && w.tier === 0)?.id;
          defaultArmorId = libraryData.armor.find(a => a.name === 'Light Leather Armor' && a.tier === 0)?.id;
        } else if (selectedClass.name === 'Seraph') {
          defaultPrimaryWeaponId = libraryData.weapons.find(w => w.name === 'Hallowed Axe' && w.tier === 1)?.id;
          defaultSecondaryWeaponId = libraryData.weapons.find(w => w.name === 'Round Shield' && w.tier === 1)?.id;
          defaultArmorId = libraryData.armor.find(a => a.name === 'Chainmail Armor' && a.tier === 1)?.id;
        } else if (selectedClass.name === 'Sorcerer') {
          defaultPrimaryWeaponId = libraryData.weapons.find(w => w.name === 'Crystal Wand' && w.tier === 0)?.id;
          defaultSecondaryWeaponId = libraryData.weapons.find(w => w.name === 'Dagger' && w.tier === 0)?.id;
          defaultArmorId = libraryData.armor.find(a => a.name === 'Mystical Robes' && a.tier === 0)?.id;
        } else if (selectedClass.name === 'Wizard') {
          defaultPrimaryWeaponId = libraryData.weapons.find(w => w.name === 'Ornate Staff' && w.tier === 0)?.id;
          defaultSecondaryWeaponId = libraryData.weapons.find(w => w.name === 'Arcane Dagger' && w.tier === 0)?.id;
          defaultArmorId = libraryData.armor.find(a => a.name === 'Scholars Robes' && a.tier === 0)?.id;
        }


        if (defaultPrimaryWeaponId) initialWeapons.push(defaultPrimaryWeaponId);
        if (defaultSecondaryWeaponId) initialWeapons.push(defaultSecondaryWeaponId); // Allow for two weapons
        if (defaultArmorId) initialArmor.push(defaultArmorId);
        
        // --- Determine Initial Domain Cards ---
        if (selectedClass.data.domains && selectedClass.data.domains.length > 0) {
            selectedClass.data.domains.forEach((domainName: string) => {
                const potentialCards = [
                    ...(libraryData.abilities || []),
                    ...(libraryData.spells || []),
                    ...(libraryData.grimoires || []),
                ].filter(card => card.domain === domainName && card.data.level === 1);
                
                if (potentialCards.length > 0) {
                    initialCards.push(potentialCards[0].id); // Take the first available
                }
            });
        }
        
        setStartingItemsAndCards({
            cards: initialCards,
            weapons: initialWeapons,
            armor: initialArmor,
            misc: initialMiscItems,
            gold: initialGold
        });
      }
    } else {
      setCalculatedVitals({ hp: 0, stress: 0, armor: 0, evasion: 10 });
      setStartingItemsAndCards({cards: [], weapons: [], armor: [], misc: [], gold: {handfuls: 0, bags: 0, chests: 0}});
    }
  }, [formData.class_id, formData.ancestry_id, libraryData]);


  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleStatChange = useCallback((statName: keyof CharacterFormData['stats'], value: number) => {
    setFormData(prev => ({
      ...prev,
      stats: { ...prev.stats!, [statName]: value }
    }));
  }, []);

  const assignTraitValue = useCallback((statName: keyof CharacterFormData['stats'], value: number | '') => {
    const currentStats = { ...formData.stats! };
    // updatedAvailable must be 'let' as its value changes
    const updatedAvailable = [...availableTraitValues]; // Changed to const

    // Add back the old assigned value to the pool if it was a valid trait pool value
    const oldAssignedValue = currentStats[statName];
    if (oldAssignedValue !== undefined && oldAssignedValue !== null && TRAIT_ASSIGNMENT_POOL.includes(oldAssignedValue)) {
      updatedAvailable.push(oldAssignedValue);
    }

    if (value === '') { // Clear assignment
      setFormData(prev => ({ ...prev, stats: { ...prev.stats!, [statName]: 0 } }));
      setAvailableTraitValues(updatedAvailable);
    } else { // Assign new value
      const val = value as number;
      // Check if the value is in the TRAIT_ASSIGNMENT_POOL and is currently available
      const valueIndex = updatedAvailable.indexOf(val);
      if (TRAIT_ASSIGNMENT_POOL.includes(val) && valueIndex > -1) {
        updatedAvailable.splice(valueIndex, 1); // Remove from available
        setAvailableTraitValues(updatedAvailable); // Update available values state
        handleStatChange(statName, val); // Assign to form data
        setSelectedTraitValue(null); // Clear selection after assignment
      } else if (!TRAIT_ASSIGNMENT_POOL.includes(val)) {
         setError(`Value ${val} is not a valid trait value.`);
      } else {
        setError(`Value ${val} already assigned to another trait or not available in the pool.`);
      }
    }
  }, [formData.stats, availableTraitValues, handleStatChange, TRAIT_ASSIGNMENT_POOL]);


  const handleExperienceChange = useCallback((index: number, value: string) => {
    setFormData(prev => {
      const newExperiences = [...(prev.experiences || ['', ''])] as [string, string];
      newExperiences[index] = value;
      return { ...prev, experiences: newExperiences };
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    // Final validation
    if (!formData.name || !formData.ancestry_id || !formData.community_id || !formData.class_id || !formData.subclass_id) {
      setError("Please fill in all required fields.");
      setIsSubmitting(false);
      return;
    }
    
    if (!formData.experiences || formData.experiences.some(exp => !exp.trim())) {
      setError("Please provide two starting experiences.");
      setIsSubmitting(false);
      return;
    }
    
    // Ensure all trait points are assigned
    const assignedStatValues = Object.values(formData.stats || {});
    const counts: { [key: number]: number } = {};
    TRAIT_ASSIGNMENT_POOL.forEach(val => counts[val] = (counts[val] || 0) + 1);
    
    let allAssigned = true;
    for(const val of assignedStatValues) {
        if(counts[val] > 0) {
            counts[val]--;
        } else {
            allAssigned = false;
            break;
        }
    }
    if(Object.values(counts).some(count => count > 0)) { // Check if any values from pool are unassigned
        allAssigned = false;
    }


    if (!allAssigned) {
      setError("Please assign all trait values from the pool.");
      setIsSubmitting(false);
      return;
    }

    const supabase = createClient();

    // Check character limit
    const { count, error: countError } = await supabase
      .from('characters')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id);

    if (countError) {
      setError("Error checking character limit: " + countError.message);
      console.error(countError);
      setIsSubmitting(false);
      return;
    }

    if (count && count >= 10) {
      setError("You have reached the maximum of 10 characters. Please delete an existing character to create a new one.");
      setIsSubmitting(false);
      return;
    }

    // Look up actual names for storage
    const selectedAncestryName = libraryData.ancestries.find(a => a.id === formData.ancestry_id)?.name;
    const selectedCommunityName = libraryData.communities.find(c => c.id === formData.community_id)?.name;
    const selectedClassName = libraryData.classes.find(cl => cl.id === formData.class_id)?.name;
    const selectedSubclassName = libraryData.subclasses.find(sc => sc.id === formData.subclass_id)?.name;

    const newCharacterData: Omit<Character, 'id' | 'character_cards' | 'character_inventory'> = {
      user_id: user.id,
      name: formData.name,
      level: 1, // Always start at level 1
      ancestry: selectedAncestryName,
      community: selectedCommunityName,
      class_id: selectedClassName,
      subclass_id: selectedSubclassName,
      stats: formData.stats as Character['stats'],
      vitals: { // Dynamically calculated vitals
        hp_max: calculatedVitals.hp,
        hp_current: calculatedVitals.hp,
        stress_max: calculatedVitals.stress,
        stress_current: 0,
        armor_max: calculatedVitals.armor,
        armor_current: calculatedVitals.armor,
      },
      hope: 2, // Starting hope is always 2
      fear: 0,
      evasion: calculatedVitals.evasion,
      proficiency: 1,
      experiences: formData.experiences as string[],
      gold: startingItemsAndCards.gold,
      image_url: formData.image_url,
    };

    const { data: newCharacter, error: charError } = await supabase
      .from('characters')
      .insert([newCharacterData])
      .select('id')
      .single();

    if (charError) {
      setError("Error creating character: " + charError.message);
      console.error(charError);
      setIsSubmitting(false);
      return;
    }

    const characterId = newCharacter.id;

    // Insert initial character cards
    const cardsToInsert = startingItemsAndCards.cards.map((card_id, index) => ({
      character_id: characterId,
      card_id: card_id,
      location: 'loadout', // Assume all starting cards go to loadout
      sort_order: index,
    }));

    if (cardsToInsert.length > 0) {
      const { error: cardsError } = await supabase.from('character_cards').insert(cardsToInsert);
      if (cardsError) {
        setError("Error adding starting cards: " + cardsError.message);
        console.error(cardsError);
        setIsSubmitting(false);
        return;
      }
    }

    // Insert initial character inventory
    const inventoryToInsert = [];
    // const weaponOrder = 0; // Not strictly needed for a single primary weapon insertion

    for (const itemId of startingItemsAndCards.weapons) {
        const item = libraryData.weapons.find(w => w.id === itemId);
        if (item) {
            inventoryToInsert.push({
                character_id: characterId,
                item_id: item.id,
                name: item.name,
                description: item.data.markdown || '',
                location: item.data.burden === 'Two-Handed' ? 'equipped_primary' : 'equipped_primary', // Assuming one primary for now
                quantity: 1,
            });
        }
    }
    for (const itemId of startingItemsAndCards.armor) {
        const item = libraryData.armor.find(a => a.id === itemId);
        if (item) {
            inventoryToInsert.push({
                character_id: characterId,
                item_id: item.id,
                name: item.name,
                description: item.data.markdown || '',
                location: 'equipped_armor',
                quantity: 1,
            });
        }
    }
    for (const itemId of startingItemsAndCards.misc) {
        const item = libraryData.consumables.find(c => c.id === itemId); // Assuming misc items are consumables
        if (item) {
            inventoryToInsert.push({
                character_id: characterId,
                item_id: item.id,
                name: item.name,
                description: item.data.markdown || '',
                location: 'backpack',
                quantity: 1,
            });
        }
    }
    // Add default gold items as generic inventory items or handle separately
    if (startingItemsAndCards.gold.handfuls > 0 || startingItemsAndCards.gold.bags > 0 || startingItemsAndCards.gold.chests > 0) {
      inventoryToInsert.push({
          character_id: characterId,
          item_id: null, // Custom item
          name: 'Gold',
          description: `Handfuls: ${startingItemsAndCards.gold.handfuls}, Bags: ${startingItemsAndCards.gold.bags}, Chests: ${startingItemsAndCards.gold.chests}`,
          location: 'backpack',
          quantity: 1 // Quantity 1 for the 'Gold' entry itself
      });
    }


    if (inventoryToInsert.length > 0) {
      const { error: inventoryError } = await supabase.from('character_inventory').insert(inventoryToInsert);
      if (inventoryError) {
        setError("Error adding starting inventory: " + inventoryError.message);
        console.error(inventoryError);
        setIsSubmitting(false);
        return;
      }
    }
    
    // After successful creation, refetch character for store and redirect
    await fetchCharacter(user.id);
    router.push('/');
  };

  const renderStep = useCallback(() => { // Define renderStep using useCallback
    const currentClassSummary = formData.class_id ? libraryData.classes.find(c => c.id === formData.class_id) : null;
    const currentSubclassSummary = formData.subclass_id ? libraryData.subclasses.find(s => s.id === formData.subclass_id) : null;
    const currentAncestrySummary = formData.ancestry_id ? libraryData.ancestries.find(a => a.id === formData.ancestry_id) : null;
    const currentCommunitySummary = formData.community_id ? libraryData.communities.find(c => c.id === formData.community_id) : null;

    switch (currentStep) {
      case 1: // Basic Info
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold font-serif flex items-center gap-2"><BookOpen size={20}/> Step 1: Basic Info</h2>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-400">Character Name</label>
              <input type="text" id="name" name="name" value={formData.name || ''} onChange={handleInputChange} 
                     className="w-full p-2 rounded bg-black/20 border border-white/10 mt-1 focus:ring-dagger-gold focus:border-dagger-gold" required />
            </div>
            <div>
              <label htmlFor="image_url" className="block text-sm font-medium text-gray-400">Image URL (Optional)</label>
              <input type="url" id="image_url" name="image_url" value={formData.image_url || ''} onChange={handleInputChange} 
                     className="w-full p-2 rounded bg-black/20 border border-white/10 mt-1 focus:ring-dagger-gold focus:border-dagger-gold" />
            </div>
            <button type="button" onClick={() => setCurrentStep(2)} className="w-full px-4 py-2 bg-dagger-gold text-black font-bold rounded-full shadow-md hover:scale-[1.02] transition-transform">Next</button>
          </div>
        );
      case 2: // Heritage
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold font-serif flex items-center gap-2"><UserIcon size={20}/> Step 2: Heritage</h2>
            <div>
              <label htmlFor="ancestry_id" className="block text-sm font-medium text-gray-400">Ancestry</label>
              <select id="ancestry_id" name="ancestry_id" value={formData.ancestry_id || ''} onChange={handleInputChange}
                      className="w-full p-2 rounded bg-black/20 border border-white/10 mt-1 focus:ring-dagger-gold focus:border-dagger-gold" required>
                <option value="">Select an Ancestry</option>
                {libraryData.ancestries.map(anc => <option key={anc.id} value={anc.id}>{anc.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="community_id" className="block text-sm font-medium text-gray-400">Community</label>
              <select id="community_id" name="community_id" value={formData.community_id || ''} onChange={handleInputChange}
                      className="w-full p-2 rounded bg-black/20 border border-white/10 mt-1 focus:ring-dagger-gold focus:border-dagger-gold" required>
                <option value="">Select a Community</option>
                {libraryData.communities.map(comm => <option key={comm.id} value={comm.id}>{comm.name}</option>)}
              </select>
            </div>
            <div className="flex justify-between">
              <button type="button" onClick={() => setCurrentStep(1)} className="px-4 py-2 bg-white/10 text-white rounded-full hover:bg-white/20">Back</button>
              <button type="button" onClick={() => setCurrentStep(3)} className="px-4 py-2 bg-dagger-gold text-black font-bold rounded-full shadow-md hover:scale-[1.02] transition-transform">Next</button>
            </div>
          </div>
        );
      case 3: // Class & Subclass
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold font-serif flex items-center gap-2"><Sparkle size={20}/> Step 3: Class & Subclass</h2>
            <div>
              <label htmlFor="class_id" className="block text-sm font-medium text-gray-400">Class</label>
              <select id="class_id" name="class_id" value={formData.class_id || ''} onChange={handleInputChange}
                      className="w-full p-2 rounded bg-black/20 border border-white/10 mt-1 focus:ring-dagger-gold focus:border-dagger-gold" required>
                <option value="">Select a Class</option>
                {libraryData.classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
              </select>
            </div>
            {formData.class_id && (
              <div>
                <label htmlFor="subclass_id" className="block text-sm font-medium text-gray-400">Subclass</label>
                <select id="subclass_id" name="subclass_id" value={formData.subclass_id || ''} onChange={handleInputChange}
                        className="w-full p-2 rounded bg-black/20 border border-white/10 mt-1 focus:ring-dagger-gold focus:border-dagger-gold" required>
                  <option value="">Select a Subclass</option>
                  {libraryData.subclasses
                    .filter(sc => sc.data.parent_class_id === formData.class_id)
                    .map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                </select>
              </div>
            )}
            <div className="flex justify-between">
              <button type="button" onClick={() => setCurrentStep(2)} className="px-4 py-2 bg-white/10 text-white rounded-full hover:bg-white/20">Back</button>
              <button type="button" onClick={() => setCurrentStep(4)} className="px-4 py-2 bg-dagger-gold text-black font-bold rounded-full shadow-md hover:scale-[1.02] transition-transform">Next</button>
            </div>
          </div>
        );
        case 4: // Assign Traits
            const availableTraits = Object.entries(formData.stats || {});
            return (
              <div className="space-y-4">
                <h2 className="text-xl font-bold font-serif flex items-center gap-2"><HandMetal size={20}/> Step 4: Assign Traits</h2>
                <p className="text-sm text-gray-400">
                  <span className="hidden md:inline">Drag and drop or click to select, then click a stat.</span>
                  <span className="md:hidden">Tap a value, then tap a stat to assign.</span>
                  {' '}Remaining: ({availableTraitValues.length})
                </p>
                <div className="flex justify-center flex-wrap gap-2 mb-4">
                    {availableTraitValues.map((val, index) => (
                        <button
                             key={index}
                             type="button"
                             className={clsx(
                               "px-4 py-2 rounded-full cursor-pointer transition-all",
                               selectedTraitValue === val
                                 ? "bg-dagger-gold text-black ring-2 ring-dagger-gold ring-offset-2 ring-offset-dagger-dark scale-105 shadow-lg"
                                 : "bg-blue-600 text-white hover:bg-blue-500 active:scale-95"
                             )}
                             draggable
                             onDragStart={(e) => e.dataTransfer.setData("value", val.toString())}
                             onClick={() => setSelectedTraitValue(val)}
                        >
                            {val >= 0 ? `+${val}` : val}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {availableTraits.map(([stat, value]) => {
                    const statValue = formData.stats![stat as keyof CharacterFormData['stats']];
                    const isAssigned = statValue !== 0 && TRAIT_ASSIGNMENT_POOL.includes(statValue);

                    return (
                      <button
                        type="button"
                        key={stat}
                        className={clsx(
                          "flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all",
                          isAssigned
                            ? "bg-dagger-gold/10 border-dagger-gold shadow-md shadow-dagger-gold/20"
                            : "bg-black/20 border-white/5 hover:border-white/20",
                          selectedTraitValue !== null && "cursor-pointer hover:scale-105 active:scale-95"
                        )}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const droppedValue = parseInt(e.dataTransfer.getData("value"));
                          const oldAssignedValue = formData.stats![stat as keyof CharacterFormData['stats']];
                          const updatedAvailable = [...availableTraitValues];
                          if (oldAssignedValue !== 0 && oldAssignedValue !== undefined && oldAssignedValue !== null && TRAIT_ASSIGNMENT_POOL.includes(oldAssignedValue)) {
                            updatedAvailable.push(oldAssignedValue);
                          }

                          const valueIndex = updatedAvailable.indexOf(droppedValue);
                          if (valueIndex > -1) {
                            updatedAvailable.splice(valueIndex, 1);
                            setAvailableTraitValues(updatedAvailable);
                            handleStatChange(stat as keyof CharacterFormData['stats'], droppedValue);
                            setSelectedTraitValue(null);
                          } else {
                              setError("Trait value already assigned or invalid.");
                          }
                        }}
                        onClick={() => {
                          if (selectedTraitValue !== null) {
                            assignTraitValue(stat as keyof CharacterFormData['stats'], selectedTraitValue);
                          }
                        }}
                      >
                        <label className="capitalize text-sm text-gray-300 pointer-events-none">{stat}</label>
                        <div className={clsx(
                          "text-3xl font-bold mt-1 pointer-events-none",
                          isAssigned ? "text-dagger-gold" : "text-gray-500"
                        )}>
                          {statValue >= 0 ? `+${statValue}` : statValue}
                        </div>
                         <button
                           type="button"
                           onClick={(e) => {
                             e.stopPropagation();
                             assignTraitValue(stat as keyof CharacterFormData['stats'], '');
                           }}
                           className="mt-2 text-red-400 text-xs hover:underline"
                         >
                           Clear
                         </button>
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-4">
                  <button type="button" onClick={() => setCurrentStep(3)} className="px-4 py-2 bg-white/10 text-white rounded-full hover:bg-white/20">Back</button>
                  <button type="button" onClick={() => setCurrentStep(5)} className="px-4 py-2 bg-dagger-gold text-black font-bold rounded-full shadow-md hover:scale-[1.02] transition-transform">Next</button>
                </div>
              </div>
            );
        case 5: // Experiences
            return (
              <div className="space-y-4">
                <h2 className="text-xl font-bold font-serif flex items-center gap-2"><Sparkle size={20}/> Step 5: Experiences</h2>
                <p className="text-sm text-gray-400">Create two experiences that reflect your character&apos;s background. E.g., &quot;Expert Tracker&quot;, &quot;Raised by Wolves&quot;, &quot;Disgraced Noble&quot;. (+2 bonus when relevant)</p>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Experience 1 (+2)</label>
                  <input 
                    type="text" 
                    value={formData.experiences?.[0] || ''} 
                    onChange={(e) => handleExperienceChange(0, e.target.value)}
                    placeholder="e.g., Former Guard Captain"
                    className="w-full p-2 rounded bg-black/20 border border-white/10 mt-1 focus:ring-dagger-gold focus:border-dagger-gold" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Experience 2 (+2)</label>
                  <input 
                    type="text" 
                    value={formData.experiences?.[1] || ''} 
                    onChange={(e) => handleExperienceChange(1, e.target.value)}
                    placeholder="e.g., Trust No One"
                    className="w-full p-2 rounded bg-black/20 border border-white/10 mt-1 focus:ring-dagger-gold focus:border-dagger-gold" 
                  />
                </div>
                <div className="flex justify-between mt-4">
                  <button type="button" onClick={() => setCurrentStep(4)} className="px-4 py-2 bg-white/10 text-white rounded-full hover:bg-white/20">Back</button>
                  <button type="button" onClick={() => setCurrentStep(6)} className="px-4 py-2 bg-dagger-gold text-black font-bold rounded-full shadow-md hover:scale-[1.02] transition-transform">Next</button>
                </div>
              </div>
            );
        case 6: // Confirm & Create
            const currentClassSummary = formData.class_id ? libraryData.classes.find(c => c.id === formData.class_id) : null;
            const currentSubclassSummary = formData.subclass_id ? libraryData.subclasses.find(s => s.id === formData.subclass_id) : null;
            const currentAncestrySummary = formData.ancestry_id ? libraryData.ancestries.find(a => a.id === formData.ancestry_id) : null;
            const currentCommunitySummary = formData.community_id ? libraryData.communities.find(c => c.id === formData.community_id) : null;

            return (
              <div className="space-y-4">
                <h2 className="text-xl font-bold font-serif flex items-center gap-2"><Shield size={20}/> Step 6: Confirm & Create</h2>
                <div className="bg-black/20 p-4 rounded-lg border border-white/5 space-y-3">
                  <p><strong>Name:</strong> {formData.name}</p>
                  <p><strong>Ancestry:</strong> {currentAncestrySummary?.name || 'N/A'}</p>
                  <p><strong>Community:</strong> {currentCommunitySummary?.name || 'N/A'}</p>
                  <p><strong>Class:</strong> {currentClassSummary?.name || 'N/A'}</p>
                  <p><strong>Subclass:</strong> {currentSubclassSummary?.name || 'N/A'}</p>
                  <p><strong>Calculated Vitals:</strong> HP: {calculatedVitals.hp}, Stress: {calculatedVitals.stress}, Armor: {calculatedVitals.armor}</p>
                  <p><strong>Evasion:</strong> {calculatedVitals.evasion}</p>
                  <p><strong>Experiences:</strong> {formData.experiences?.join(', ')}</p>
                  <p className="flex items-center gap-1">
                    <Coins size={16} /> <strong>Starting Gold:</strong> {startingItemsAndCards.gold.handfuls}h, {startingItemsAndCards.gold.bags}b, {startingItemsAndCards.gold.chests}c
                  </p>
                  <p><strong>Starting Weapons ({startingItemsAndCards.weapons.length}):</strong></p>
                  <ul className="list-disc pl-5">
                    {startingItemsAndCards.weapons.map(id => <li key={id}>{libraryData.weapons.find(w => w.id === id)?.name}</li>)}
                  </ul>
                  <p><strong>Starting Armor ({startingItemsAndCards.armor.length}):</strong></p>
                  <ul className="list-disc pl-5">
                    {startingItemsAndCards.armor.map(id => <li key={id}>{libraryData.armor.find(a => a.id === id)?.name}</li>)}
                  </ul>
                  <p><strong>Starting Cards ({startingItemsAndCards.cards.length}):</strong></p>
                  <ul className="list-disc pl-5">
                    {startingItemsAndCards.cards.map(id => {
                        const card = [...libraryData.abilities, ...libraryData.spells, ...libraryData.grimoires].find(c => c.id === id);
                        return <li key={id}>{card?.name} ({card?.domain} {card?.type})</li>
                    })}
                  </ul>
                </div>
                <div className="flex justify-between mt-4">
                  <button type="button" onClick={() => setCurrentStep(5)} className="px-4 py-2 bg-white/10 text-white rounded-full hover:bg-white/20">Back</button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-green-600 text-white font-bold rounded-full shadow-md hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Character'}
                  </button>
                </div>
              </div>
            );
      default:
        return null;
    }
  }, [currentStep, formData, availableTraitValues, libraryData, calculatedVitals, startingItemsAndCards, TRAIT_ASSIGNMENT_POOL, handleInputChange, handleStatChange, assignTraitValue, handleExperienceChange, isSubmitting, setError, selectedTraitValue]);


  return (
    <div className="min-h-[100dvh] bg-dagger-dark text-white p-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-dagger-panel border border-white/10 rounded-xl shadow-lg p-6 space-y-6">
        <h1 className="text-2xl font-serif font-bold text-center text-dagger-gold">New Character</h1>
        
        <div className="flex justify-center gap-2 mb-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className={clsx(
              "w-6 h-2 rounded-full",
              idx + 1 === currentStep ? "bg-dagger-gold" : "bg-gray-700"
            )}/>
          ))}
        </div>

        {error && <div className="p-3 bg-red-800/50 border border-red-500 rounded text-red-300 text-sm">{error}</div>}

        <form onSubmit={handleSubmit}>
          {renderStep()}
        </form>
      </div>
    </div>
  );
}