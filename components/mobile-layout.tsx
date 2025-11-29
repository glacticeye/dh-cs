'use client';

import React from 'react';
import { useCharacterStore } from '@/store/character-store';
import { User, Layers, Backpack, Dices } from 'lucide-react';
import DiceOverlay from './dice-overlay';
import clsx from 'clsx';

// Fix for no-explicit-any on NavButton props
interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType; // Use React.ElementType for icon component
  label: string;
}

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const { activeTab, setActiveTab, openDiceOverlay } = useCharacterStore();

  return (
    <div className="flex flex-col h-[100dvh] bg-dagger-dark text-white overflow-hidden">
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto scrollbar-hide pb-24 px-4 pt-4">
        {children}
      </main>

      {/* Floating Action Button (FAB) - Dice */}
      <button
        onClick={openDiceOverlay}
        className="fixed bottom-24 right-6 bg-dagger-gold text-black p-4 rounded-full shadow-lg shadow-dagger-gold/20 hover:scale-105 transition-transform z-40"
      >
        <Dices size={28} />
      </button>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-dagger-panel border-t border-white/10 pb-safe pt-2 px-6 z-40 backdrop-blur-lg">
        <div className="flex justify-between items-center h-16">
          <NavButton 
            active={activeTab === 'character'} 
            onClick={() => setActiveTab('character')}
            icon={User} 
            label="Character" 
          />
          <NavButton 
            active={activeTab === 'playmat'} 
            onClick={() => setActiveTab('playmat')}
            icon={Layers} 
            label="Playmat" 
          />
          <NavButton 
            active={activeTab === 'inventory'} 
            onClick={() => setActiveTab('inventory')}
            icon={Backpack} 
            label="Inventory" 
          />
        </div>
      </nav>

      {/* Dice Overlay Portal */}
      <DiceOverlay />
    </div>
  );
}

function NavButton({ active, onClick, icon: Icon, label }: NavButtonProps) { // Use defined props interface
  return (
    <button 
      onClick={onClick}
      className={clsx(
        "flex flex-col items-center gap-1 transition-colors w-16",
        active ? "text-dagger-gold" : "text-gray-500 hover:text-gray-300"
      )}
    >
      <Icon size={24} strokeWidth={active ? 2.5 : 2} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}