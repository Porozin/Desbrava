import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { Compass, ShieldAlert, Zap, Utensils } from 'lucide-react';

import { sounds } from '../../lib/sounds';

const NODES = [
  { id: 'combat', label: 'Seguir em frente', emoji: '⚔️', icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-500' },
  { id: 'event', label: 'Explorar ruínas', emoji: '📜', icon: Compass, color: 'text-blue-500', bg: 'bg-blue-500' },
  { id: 'rest', label: 'Descansar', emoji: '🍵', icon: Utensils, color: 'text-emerald-500', bg: 'bg-emerald-500' },
  { id: 'puzzle', label: 'Caminho Oculto', emoji: '🧩', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500' },
];

export default function ExplorationScene() {
  const { setMode, addLog, dungeon, updatePlayer, player, character } = useGameStore();

  const handleChoice = (type: string) => {
    sounds.playClick();
    const nodesVisited = (dungeon?.nodesVisited ?? 0) + 1;
    const isBossNext = nodesVisited >= (dungeon?.totalFloors ?? 5);

    updatePlayer({ 
      dungeon: { 
        ...(dungeon as any), 
        nodesVisited 
      } 
    });

    if (type === 'combat') {
      if (isBossNext) {
        addLog("⚔️ Uma presença esmagadora toma conta do lugar... O GUARDIÃO CHEGOU.");
        setMode('boss');
      } else {
        addLog("⚔️ Você ouve barulhos metálicos à frente...");
        setMode('combat');
      }
    } else if (type === 'event') {
      addLog("📜 Você encontra uma estátua antiga com inscrições estranhas.");
      setMode('event');
    } else if (type === 'puzzle') {
      addLog("⚡ Há um dispositivo emitindo sinais estranhos na parede.");
      setMode('puzzle');
    } else {
      addLog("🍵 Você respira um pouco. Recuperou 20 HP.");
      updatePlayer({ hp: Math.min(player.maxHp, player.hp + 20) });
      if (isBossNext) {
        addLog("⚠️ Mesmo descansando, você sente que o fim está próximo.");
        setMode('boss');
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] p-8 gap-12">
      {/* Hero Visual Display (SAP Style) */}
      <div className="w-full max-w-xl h-64 bg-zinc-900 border-4 border-zinc-800 rounded-[3rem] flex flex-col items-center justify-center gap-6 overflow-hidden relative shadow-2xl">
         <div className="absolute inset-x-0 bottom-0 h-1/2 bg-zinc-950/50" />
         <motion.div 
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="z-10 text-8xl"
         >
            {character.vocation === 'Desbravador' ? '🏕️' : character.vocation === 'Líder' ? '🧭' : '📖'}
         </motion.div>
         <div className="z-10 text-center space-y-1">
            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">
                {dungeon?.currentFloor}º Andar
            </h3>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Caminhando pelas sombras...</p>
         </div>
         {/* Simple background pattern */}
         <div className="absolute inset-0 z-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_2px,transparent_2px)] bg-[length:32px_32px]" />
      </div>

      <div className="grid grid-cols-2 gap-6 w-full max-w-xl">
        {NODES.map((node) => (
          <motion.button
            key={node.id}
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleChoice(node.id)}
            className="group relative flex flex-col items-center justify-center gap-4 p-8 bg-zinc-900 border-2 border-zinc-800 rounded-[2.5rem] hover:border-white transition-all shadow-xl"
          >
            <div className={`w-16 h-16 ${node.bg} rounded-3xl flex items-center justify-center text-3xl shadow-lg shadow-black/20 text-zinc-950`}>
              {node.emoji}
            </div>
            <span className="font-black text-xs uppercase tracking-tighter text-zinc-400 group-hover:text-white transition-colors">
              {node.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
