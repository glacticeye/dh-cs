'use client';

import React from 'react';
import { useCharacterStore } from '@/store/character-store';
import { Coins, Package } from 'lucide-react';

// CharacterInventoryItem is already imported in character-store.ts and used there.
// No need to explicitly import it here unless used for a specific type definition in this file.

export default function InventoryView() {
  const { character } = useCharacterStore();

  if (!character) return null;

  const inventoryItems = character.character_inventory || [];

  return (
    <div className="space-y-6">
      {/* Gold Tracker */}
      <div className="bg-dagger-panel border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4 text-dagger-gold">
          <Coins size={18} />
          <h2 className="text-sm font-bold uppercase tracking-wider">Wealth</h2>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{character.gold.handfuls}</div>
            <div className="text-[10px] uppercase text-gray-500">Handfuls</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{character.gold.bags}</div>
            <div className="text-[10px] uppercase text-gray-500">Bags</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{character.gold.chests}</div>
            <div className="text-[10px] uppercase text-gray-500">Chests</div>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div>
        <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <Package size={20} /> Inventory Items
        </h2>
        <div className="space-y-2">
          {inventoryItems.length > 0 ? (
            inventoryItems.map((item) => (
              <ItemRow 
                key={item.id} 
                name={item.name} 
                desc={item.description || item.library_item?.data?.markdown || 'No description'} 
                quantity={item.quantity} 
              />
            ))
          ) : (
            <div className="p-4 bg-white/5 rounded-lg border border-white/5 text-gray-400 text-sm text-center">
              Your inventory is empty.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ItemRow({ name, desc, quantity = 1 }: { name: string, desc: string, quantity?: number }) {
  return (
    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
      <div>
        <div className="font-medium text-white">{name}</div>
        <div className="text-xs text-gray-400 line-clamp-1">{desc.split('\n')[0]}</div> {/* Show first line of markdown */}
      </div>
      {quantity > 1 && (
        <div className="px-2 py-1 bg-black/30 rounded text-xs font-bold text-gray-300">
          x{quantity}
        </div>
      )}
    </div>
  );
}
