import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { Heart, Sword, Sparkles, Trophy, Package } from 'lucide-react';
import InventoryModal from './InventoryModal';

export default function StatsBar() {
  const { player } = useGameStore();
  const [isInvOpen, setIsInvOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-zinc-900 border-b-2 border-zinc-950 text-white flex-none relative z-20">
      <div className="flex items-center gap-8">
        {/* HP Stats */}
        <div className="flex items-center gap-3 bg-zinc-950 px-4 py-2 rounded-2xl border border-zinc-800">
           <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-500/20">
              <Heart className="w-6 h-6 fill-current" />
           </div>
           <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-tighter text-zinc-500 leading-none">Vida</span>
              <span className="text-lg font-black italic tracking-tighter leading-none">{player.hp}<span className="text-zinc-600">/{player.maxHp}</span></span>
           </div>
        </div>

        {/* ATK Stats */}
        <div className="flex items-center gap-3 bg-zinc-950 px-4 py-2 rounded-2xl border border-zinc-800">
           <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Sword className="w-6 h-6" />
           </div>
           <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-tighter text-zinc-500 leading-none">Ataque</span>
              <span className="text-lg font-black italic tracking-tighter leading-none">{player.atk}</span>
           </div>
        </div>

        {/* Fé Stats */}
        <div className="flex items-center gap-3 bg-zinc-950 px-4 py-2 rounded-2xl border border-zinc-800">
           <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Sparkles className="w-6 h-6" />
           </div>
           <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-tighter text-zinc-500 leading-none">Fé</span>
              <span className="text-lg font-black italic tracking-tighter leading-none">{player.fe}</span>
           </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
         <button 
            onClick={() => setIsInvOpen(true)}
            className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-zinc-950 hover:bg-zinc-200 hover:-translate-y-1 transition-all shadow-lg active:translate-y-0"
         >
            <Package className="w-6 h-6" />
         </button>

         <div className="flex items-center gap-4 bg-zinc-950 px-4 py-2 rounded-2xl border border-zinc-800">
            <div className="flex flex-col items-end">
               <span className="text-[10px] font-black uppercase tracking-tighter text-zinc-500 leading-none">Nível {player.level}</span>
               <div className="w-24 h-2 bg-zinc-800 rounded-full mt-1 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(player.xp % 100)}%` }}
                    className="h-full bg-white transition-all shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                  />
               </div>
            </div>
         </div>
      </div>

      <InventoryModal isOpen={isInvOpen} onClose={() => setIsInvOpen(false)} />
    </div>
  );
}
