'use client';

import React from 'react';
import { useCharacterStore } from '@/store/character-store';
import { Shield, Swords, Zap, Skull, Info } from 'lucide-react';
import clsx from 'clsx';

export default function CombatView() {
  const { character, prepareRoll } = useCharacterStore();

  if (!character) return null;

  // Extract derived stats
  const evasion = character.evasion;
  // Default armor score if not calculated yet (should be dynamic based on armor)
  const armorScore = character.vitals.armor_current; 
  
  // Find equipped items
  const weapons = character.character_inventory?.filter(
    item => item.location === 'equipped_primary' || item.location === 'equipped_secondary'
  ) || [];
  
  const armor = character.character_inventory?.find(item => item.location === 'equipped_armor');

  // Find Class Data for features
  // We assume the class data is loaded or we might need to fetch it if not fully populated in character store
  // For now, we might need to rely on what we have. 
  // *Correction*: The `character` object in store currently has `class_id` (string). 
  // We might need to fetch the Class Library Item to get the features text if it's not stored on the character.
  // The current store `fetchCharacter` stitches `library_item` for cards/inventory, but NOT for the class itself yet.
  
  // TODO: We need to fetch Class Library Data to display Class Features. 
  // For this iteration, we will focus on Vitals and Weapons.

  return (
    <div className="space-y-6 pb-24">
      {/* Defenses Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-dagger-panel border border-white/10 rounded-xl p-4 flex flex-col items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500/50"></div>
          <div className="text-cyan-400 mb-1"><Shield size={24} /></div>
          <div className="text-4xl font-black text-white">{evasion}</div>
          <div className="text-[10px] uppercase tracking-widest text-gray-400 mt-1">Evasion</div>
        </div>

        <div className="bg-dagger-panel border border-white/10 rounded-xl p-4 flex flex-col items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/50"></div>
          <div className="text-blue-400 mb-1"><Shield size={24} /></div>
          <div className="text-4xl font-black text-white">{armorScore}</div>
          <div className="text-[10px] uppercase tracking-widest text-gray-400 mt-1">Armor Score</div>
        </div>
      </div>

      {/* Damage Thresholds (Placeholder - Needs Armor Data logic) */}
      <div className="bg-white/5 rounded-lg p-3 border border-white/5">
        <div className="flex justify-between text-xs text-gray-400 mb-2 uppercase tracking-wider">
          <span>Minor</span>
          <span>Major</span>
          <span>Severe</span>
        </div>
        <div className="flex justify-between font-mono font-bold text-lg text-white">
          {/* TODO: Calculate these based on Armor Item */}
          <span>1 - {armor?.library_item?.data?.base_thresholds?.split('/')[0] || 'X'}</span>
          <span>{parseInt(armor?.library_item?.data?.base_thresholds?.split('/')[0] || '0') + 1} - {armor?.library_item?.data?.base_thresholds?.split('/')[1] || 'X'}</span>
          <span>{parseInt(armor?.library_item?.data?.base_thresholds?.split('/')[1] || '0') + 1}+</span>
        </div>
      </div>

      {/* Weapons List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
          <Swords size={16} /> Active Weapons
        </h3>
        
        {weapons.length > 0 ? (
          weapons.map((weapon) => {
            const libData = weapon.library_item?.data;
            const trait = libData?.trait || 'Strength';
            const damage = libData?.damage || '1d8';
            const range = libData?.range || 'Melee';
            const traitValue = character.stats[trait.toLowerCase() as keyof typeof character.stats] || 0;

            return (
              <div key={weapon.id} className="bg-dagger-panel border border-white/10 rounded-xl overflow-hidden group">
                <div className="p-4 flex justify-between items-start">
                  <div>
                    <h4 className="font-serif font-bold text-white text-lg">{weapon.name}</h4>
                    <div className="flex gap-2 text-xs text-gray-400 mt-1">
                      <span className="uppercase bg-white/10 px-1.5 py-0.5 rounded">{trait}</span>
                      <span className="uppercase bg-white/10 px-1.5 py-0.5 rounded">{range}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-dagger-gold">{damage}</div>
                    <div className="text-[10px] text-gray-500 uppercase">Damage</div>
                  </div>
                </div>
                
                {/* Action Bar */}
                <div className="bg-black/40 p-2 flex gap-2">
                  <button 
                    onClick={() => prepareRoll(`${weapon.name} Attack`, traitValue)}
                    className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Zap size={16} className="text-yellow-400" /> Attack ({traitValue >= 0 ? `+${traitValue}` : traitValue})
                  </button>
                  <button 
                    onClick={() => prepareRoll(`${weapon.name} Damage`, 0)} // Damage usually strictly dice, but proficiency might apply
                    className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Skull size={16} className="text-red-400" /> Damage
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-gray-500 text-center py-4 italic">No active weapons equipped.</div>
        )}
      </div>

      {/* Active Armor */}
      {armor && (
        <div className="space-y-2">
           <h3 className="text-sm font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
            <Shield size={16} /> Active Armor
          </h3>
          <div className="bg-dagger-panel border border-white/10 rounded-xl p-4">
            <h4 className="font-serif font-bold text-white">{armor.name}</h4>
            <p className="text-xs text-gray-400 mt-1 italic">{armor.library_item?.data?.feature?.text}</p>
          </div>
        </div>
      )}

      {/* Class Features */}
      {character.class_data && (
        <div className="space-y-4 mt-6">
          <h3 className="text-sm font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
            <Info size={16} /> Class Features
          </h3>
          
          {/* Hope Feature */}
          {character.class_data.data.hope_feature && (
             <div className="bg-dagger-panel border border-dagger-gold/30 rounded-xl p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-dagger-gold"></div>
                <h4 className="font-serif font-bold text-dagger-gold mb-1 flex items-center gap-2">
                  <Zap size={14} />
                  {character.class_data.data.hope_feature.name}
                </h4>
                <p className="text-sm text-gray-300">{character.class_data.data.hope_feature.description}</p>
             </div>
          )}

          {/* Core Class Features */}
          {character.class_data.data.class_features?.map((feature: any, idx: number) => (
            <div key={idx} className="bg-dagger-panel border border-white/10 rounded-xl p-4">
              <h4 className="font-serif font-bold text-white mb-1">{feature.name}</h4>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{feature.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
