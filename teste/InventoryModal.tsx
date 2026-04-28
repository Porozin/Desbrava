import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { X, Sword, Shield, Package, Zap } from 'lucide-react';

export default function InventoryModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { inventory, equipment, character } = useGameStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-amber-500" />
                <h2 className="text-xl font-bold tracking-tight">Inventário & Especialidades</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 h-[500px]">
              {/* Left Side: Character Preview */}
              <div className="p-8 border-r border-zinc-800 bg-zinc-950/50 flex flex-col items-center">
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 flex items-center justify-center mb-6 shadow-inner">
                   <Zap className="w-16 h-16 text-amber-500/20" />
                </div>
                <div className="text-center space-y-1">
                   <h3 className="text-2xl font-black uppercase italic tracking-tighter text-amber-500">{character.vocation}</h3>
                   <p className="text-sm text-zinc-500">Nível 1 • Guardião das Trilhas</p>
                </div>

                <div className="w-full mt-8 space-y-3">
                   <StatItem icon={Sword} label="Equipamento de Ataque" value={equipment.weapon?.name || 'Nenhum'} />
                   <StatItem icon={Shield} label="Proteção de Armadura" value={equipment.armor?.name || 'Nenhum'} />
                </div>
              </div>

              {/* Right Side: Inventory List */}
              <div className="p-6 overflow-y-auto space-y-4">
                 <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-2">Itens Coletados</h4>
                 {inventory.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center text-zinc-600 border-2 border-dashed border-zinc-800 rounded-2xl">
                       <Package className="w-8 h-8 mb-2 opacity-20" />
                       <p className="text-sm">Sem itens no momento</p>
                    </div>
                 ) : (
                    <div className="grid grid-cols-1 gap-2">
                       {inventory.map((item, i) => (
                          <div key={i} className="flex items-center gap-4 p-3 bg-zinc-800/50 border border-zinc-800 rounded-xl">
                             <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-700">
                                {item.type === 'weapon' ? <Sword className="w-5 h-5 text-red-500" /> : <Shield className="w-5 h-5 text-blue-500" />}
                             </div>
                             <div>
                                <p className="text-sm font-bold text-zinc-200">{item.name}</p>
                                <p className="text-[10px] text-zinc-500">{item.description || 'Item de dungeon'}</p>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StatItem({ icon: Icon, label, value }: any) {
  return (
    <div className="flex flex-col gap-1 p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl">
       <div className="flex items-center gap-2 text-zinc-500">
          <Icon className="w-3 h-3" />
          <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
       </div>
       <span className="text-sm font-medium text-zinc-200">{value}</span>
    </div>
  );
}
