'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useCharacterStore } from '@/store/character-store';
import { AnimatePresence, motion } from 'framer-motion';
import { X, RotateCcw } from 'lucide-react';
import clsx from 'clsx';

export default function DiceOverlay() {
  const { isDiceOverlayOpen, closeDiceOverlay, setLastRollResult, lastRollResult } = useCharacterStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const boxInstanceRef = useRef<any>(null); // Ref for the DiceBox instance, keeping any for external lib.
  const [isReady, setIsReady] = useState(false);

  // Use a state variable to hold the dynamically imported DiceBox constructor
  const [DiceBoxModule, setDiceBoxModule] = useState<any>(null);

  useEffect(() => {
    if (isDiceOverlayOpen && typeof window !== 'undefined' && !DiceBoxModule) {
      // Dynamically import DiceBox when overlay opens and it hasn't been imported yet
      import('@3d-dice/dice-box')
        .then(module => {
          setDiceBoxModule(module.default);
        })
        .catch(e => console.error("Failed to load DiceBox module:", e));
    }
  }, [isDiceOverlayOpen, DiceBoxModule]);


  useEffect(() => {
    // Initialize DiceBox instance once the module is loaded and containerRef is ready
    if (!containerRef.current || boxInstanceRef.current || !DiceBoxModule || !isDiceOverlayOpen) return;

    const box = new DiceBoxModule("#dice-tray-overlay", {
      assetPath: 'https://unpkg.com/@3d-dice/dice-box@1.1.3/dist/assets/',
      scale: 7,
      theme: 'default',
      offscreen: true,
      gravity_multiplier: 400,
      light_intensity: 0.8,
      enable_shadows: true,
      shadow_transparency: 0.4,
    });

    boxInstanceRef.current = box;
    
    try {
      box.init().then(() => { // Ensure init is awaited before setting isReady
        setIsReady(true);
        
        const handleResize = () => box.resize();
        window.addEventListener('resize', handleResize);
        
        return () => window.removeEventListener('resize', handleResize);
      });
    } catch (e) {
      console.error("DiceBox init error:", e);
    }

    return () => {
        if (boxInstanceRef.current) {
            boxInstanceRef.current.clear();
            boxInstanceRef.current = null;
            setIsReady(false);
        }
    };
  }, [isDiceOverlayOpen, DiceBoxModule]); // Depend on DiceBoxModule state


  const rollDuality = async (modifier = 0) => {
    if (!boxInstanceRef.current || !isReady) {
      console.warn("DiceBox not ready");
      return;
    }
    
    setLastRollResult({ hope: 0, fear: 0, total: 0, modifier: 0, type: 'Hope' }); 
    boxInstanceRef.current.clear();

    try {
      const result = await boxInstanceRef.current.roll([
        { sides: 12, themeColor: '#f6c928' }, // Hope (Gold)
        { sides: 12, themeColor: '#4a148c' }  // Fear (Purple)
      ]);

      if (Array.isArray(result) && result.length === 2) {
        const hopeRoll = result[0].value;
        const fearRoll = result[1].value;
        const total = hopeRoll + fearRoll + modifier;
        
        let type: 'Critical' | 'Hope' | 'Fear' = 'Hope';
        if (hopeRoll === fearRoll) type = 'Critical';
        else if (hopeRoll > fearRoll) type = 'Hope';
        else type = 'Fear';

        setLastRollResult({
          hope: hopeRoll,
          fear: fearRoll,
          total,
          modifier,
          type
        });
      }
    } catch (e) {
      console.error("Roll failed", e);
    }
  };

  return (
    <AnimatePresence>
      {isDiceOverlayOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col"
        >
          {/* Header / Controls */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-20">
            <button 
              onClick={closeDiceOverlay}
              className="p-2 bg-black/40 rounded-full text-white hover:bg-black/60 transition-colors"
            >
              <X size={24} />
            </button>
            
            <div className="flex gap-2">
               <button 
                onClick={() => rollDuality(0)}
                className="px-6 py-2 bg-dagger-gold text-black font-bold rounded-full shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
              >
                <RotateCcw size={18} />
                ROLL
              </button>
            </div>
          </div>

          {/* 3D Container */}
          <div id="dice-tray-overlay" ref={containerRef} className="w-full h-full cursor-pointer" onClick={() => rollDuality(0)} />

          {/* Result Display (Floating) */}
          {lastRollResult && lastRollResult.total > 0 && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-md pointer-events-none"
            >
              <div className="bg-dagger-panel border border-white/10 p-6 rounded-2xl shadow-2xl backdrop-blur-md text-center">
                <div className="text-sm text-gray-400 uppercase tracking-wider mb-1">Result</div>
                <div className="text-6xl font-serif font-black text-white mb-4">{lastRollResult.total}</div>
                
                <div className="flex justify-center gap-8 mb-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-dagger-gold uppercase font-bold">Hope</span>
                    <span className="text-2xl font-bold text-white">{lastRollResult.hope}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-purple-400 uppercase font-bold">Fear</span>
                    <span className="text-2xl font-bold text-white">{lastRollResult.fear}</span>
                  </div>
                </div>

                <div className={clsx(
                  "inline-block px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide",
                  lastRollResult.type === 'Critical' ? "bg-green-500/20 text-green-400 border border-green-500/50" :
                  lastRollResult.type === 'Hope' ? "bg-dagger-gold/20 text-dagger-gold border border-dagger-gold/50" : 
                  "bg-purple-500/20 text-purple-300 border border-purple-500/50"
                )}>
                  With {lastRollResult.type}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
