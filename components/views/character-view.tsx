'use client';

import React from 'react';
import { useCharacterStore } from '@/store/character-store';
import { Heart, Zap, Shield } from 'lucide-react';
import clsx from 'clsx';
import Image from 'next/image';

export default function CharacterView() {
  const { character, updateVitals } = useCharacterStore();
  // openDiceOverlay is used implicitly by StatButton component, so it's not an unused variable.

  // Fallback if loading
  if (!character) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <div className="animate-pulse">Loading Character...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gray-700 rounded-full overflow-hidden border-2 border-white/10 flex-shrink-0">
          {character.image_url ? (
            <Image src={character.image_url} alt={character.name} width={64} height={64} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-bold bg-gradient-to-br from-dagger-gold to-orange-600 text-black">
              {character.name[0]}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-serif font-bold text-white">{character.name}</h1>
          <p className="text-sm text-gray-400">Level {character.level} {character.class_id} • {character.subclass_id}</p>
        </div>
      </div>

      {/* Vitals Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* HP */}
        <VitalCard 
          label="Hit Points" 
          current={character.vitals.hp_current} 
          max={character.vitals.hp_max}
          color="text-red-400"
          icon={Heart}
          onIncrement={() => updateVitals('hp_current', character.vitals.hp_current + 1)}
          onDecrement={() => updateVitals('hp_current', character.vitals.hp_current - 1)}
        />
        {/* Stress */}
        <VitalCard 
          label="Stress" 
          current={character.vitals.stress_current} 
          max={character.vitals.stress_max}
          color="text-purple-400"
          icon={Zap}
          onIncrement={() => updateVitals('stress_current', character.vitals.stress_current + 1)}
          onDecrement={() => updateVitals('stress_current', character.vitals.stress_current - 1)}
        />
        {/* Armor */}
        <VitalCard 
          label="Armor" 
          current={character.vitals.armor_current} 
          max={character.vitals.armor_max}
          color="text-blue-400"
          icon={Shield}
          onIncrement={() => updateVitals('armor_current', character.vitals.armor_current + 1)}
          onDecrement={() => updateVitals('armor_current', character.vitals.armor_current - 1)}
        />
      </div>

      {/* Stats Grid */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider">Traits</h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(character.stats).map(([key, value]) => (
            <StatButton key={key} label={key} value={value} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Props interface for VitalCard
interface VitalCardProps {
  label: string;
  current: number;
  max: number;
  color: string;
  icon: React.ElementType;
  onIncrement: () => void;
  onDecrement: () => void;
}

function VitalCard({ label, current, max, color, icon: Icon, onIncrement, onDecrement }: VitalCardProps) {
  return (
    <div className="bg-dagger-panel border border-white/10 rounded-xl p-3 flex flex-col items-center justify-between aspect-square">
      <div className={clsx("flex items-center gap-1 text-xs font-bold uppercase", color)}>
        <Icon size={14} />
        {label}
      </div>
      <div className="text-3xl font-serif font-bold">
        {current}<span className="text-sm text-gray-500 font-sans font-normal">/{max}</span>
      </div>
      <div className="flex w-full gap-2 mt-1">
        <button type="button" onClick={onDecrement} className="flex-1 h-8 bg-white/5 hover:bg-white/10 rounded flex items-center justify-center text-lg font-bold">-</button>
        <button type="button" onClick={onIncrement} className="flex-1 h-8 bg-white/5 hover:bg-white/10 rounded flex items-center justify-center text-lg font-bold">+</button>
      </div>
    </div>
  );
}

// Removed openDiceOverlay prop to StatButton, let it call store directly
function StatButton({ label, value }: { label: string, value: number }) {
  const { prepareRoll } = useCharacterStore(); // Call from store directly
  
  return (
    <button 
      type="button"
      onClick={() => prepareRoll(label, value)}
      className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg p-3 flex items-center justify-between transition-colors group"
    >
      <span className="capitalize font-medium text-gray-300 group-hover:text-white">{label}</span>
      <span className="text-xl font-bold text-dagger-gold">{value >= 0 ? `+${value}` : value}</span>
    </button>
  );
}