'use client';

import React from 'react';
import { useCharacterStore, CharacterCard } from '@/store/character-store';
import { LibraryBig, ScrollText } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PlaymatView() {
  const { character } = useCharacterStore();
  const router = useRouter();

  if (!character) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <div className="animate-pulse">Loading Playmat...</div>
      </div>
    );
  }

  const loadoutCards = character.character_cards?.filter(card => card.location === 'loadout') || [];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
        <ScrollText size={20} /> Active Loadout
      </h2>
      
      <div className="grid grid-cols-2 gap-4">
        {loadoutCards.length > 0 ? (
          loadoutCards.map((charCard) => (
            <CardThumbnail key={charCard.id} charCard={charCard} />
          ))
        ) : (
          <div className="aspect-[2/3] border-2 border-dashed border-white/5 rounded-lg flex flex-col items-center justify-center text-gray-600 col-span-2 p-4 text-center">
            <LibraryBig size={24} className="mb-2" />
            <span className="text-sm">No cards in Loadout.</span>
            <span className="text-xs">Add some from your Vault!</span>
          </div>
        )}
        
        {/* Fill remaining slots up to 5 if less than 5 cards */}
        {Array.from({ length: Math.max(0, 5 - loadoutCards.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-[2/3] border-2 border-dashed border-white/5 rounded-lg flex items-center justify-center text-gray-600">
            <span className="text-xs uppercase">Slot</span>
          </div>
        ))}
      </div>

      <div className="pt-4">
        <button 
          onClick={() => router.push('/vault')} // Navigate to a vault page/modal
          className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium text-gray-400 border border-white/10"
        >
          Open Vault
        </button>
      </div>
    </div>
  );
}

function CardThumbnail({ charCard }: { charCard: CharacterCard }) {
  // Use charCard.library_item for details
  const { name, domain, tier, type } = charCard.library_item || { name: 'Unknown Card', domain: '', tier: 0, type: '' };

  return (
    <div 
      className="aspect-[2/3] bg-zinc-800 border border-white/10 rounded-lg p-3 relative flex flex-col justify-between hover:border-dagger-gold transition-colors cursor-pointer"
      // onClick={() => console.log('Open card detail for:', charCard.id)}
    >
      <div className="flex justify-between items-start">
        <span className="text-xs font-bold text-dagger-gold">Lvl {tier || '?' }</span>
        <span className="text-xs font-bold text-gray-400">{charCard.state?.tokens || '0'} tokens</span> {/* Display tokens */}
      </div>
      
      <div className="text-center">
        <div className="text-xs text-gray-500 uppercase tracking-tighter">{domain} {type}</div>
        <div className="font-serif font-bold text-white leading-tight mt-1">{name}</div>
      </div>

      <div className="text-[10px] text-gray-500 text-center">
        Tap to view
      </div>
    </div>
  );
}