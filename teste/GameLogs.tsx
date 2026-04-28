import { useGameStore } from '../../store/gameStore';
import { ScrollText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GameLogs() {
  const { logs } = useGameStore();

  return (
    <div className="h-full flex flex-col bg-black/40 backdrop-blur-sm border-l border-zinc-800">
      <div className="p-3 border-b border-zinc-800 flex items-center gap-2 text-zinc-400">
        <ScrollText className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wider">Diário de Aventura</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <AnimatePresence mode="popLayout">
          {logs.map((log, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1 - i * 0.15, x: 0 }}
              className="text-sm text-zinc-300 font-medium leading-relaxed"
            >
              {log}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
