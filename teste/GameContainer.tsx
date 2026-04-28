import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import StatsBar from './StatsBar';
import GameLogs from './GameLogs';
import ExplorationScene from './ExplorationScene';
import EventScene from './EventScene';
import PuzzleScene from './PuzzleScene';
import CombatScene from './CombatScene';
import { Trophy, Sparkles, Loader2, Play } from 'lucide-react';
import { getPlayerStats } from '../../services/dbService';
import { sounds } from '../../lib/sounds';
import { generateDungeonIntro } from '../../services/geminiService';

export default function GameContainer() {
  const { mode, startGame, resetGame, updatePlayer } = useGameStore();
  const [loading, setLoading] = useState(true);
  const [aiIntro, setAiIntro] = useState("");

  useEffect(() => {
    async function loadData() {
      const stats = await getPlayerStats();
      if (stats) {
        updatePlayer(stats as any);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleStart = async (vocation: any) => {
    sounds.playAmbient();
    const intro = await generateDungeonIntro(vocation);
    setAiIntro(intro);
    startGame(vocation);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-950">
        <Loader2 className="w-8 h-8 text-white animate-spin opacity-20" />
      </div>
    );
  }

  return (
    <div id="game-root" className="flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* Top Header/Stats */}
      {mode !== 'idle' && <StatsBar />}

      <div className="flex flex-1 overflow-hidden relative">
        {/* Main Game Stage */}
        <main className="flex-1 relative overflow-y-auto bg-[radial-gradient(circle_at_50%_50%,rgba(24,24,27,1)_0%,rgba(9,9,11,1)_100%)]">
          <AnimatePresence mode="wait">
            {mode === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center min-h-full p-8 text-center"
              >
                <div className="mb-12 space-y-4">
                  <motion.div 
                    initial={{ scale: 0.5, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', bounce: 0.5 }}
                    className="w-32 h-32 bg-amber-500 rounded-[2.5rem] flex items-center justify-center text-6xl mx-auto mb-6 shadow-2xl shadow-amber-500/20"
                  >
                    🏕️
                  </motion.div>
                  <h1 className="text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-600 uppercase">
                    DESBRAVA
                  </h1>
                  <p className="text-zinc-500 max-w-sm mx-auto font-medium">
                    Um RPG táctico inspirado no Clube de Desbravadores. 
                    Escolha seu pet, acumule fé e vença o Vazio.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
                   {[
                      { name: 'Desbravador', emoji: '🏕️', color: 'bg-emerald-500', desc: 'Equilibrado' },
                      { name: 'Líder', emoji: '🧭', color: 'bg-blue-500', desc: 'Estrategista' },
                      { name: 'Instrutor', emoji: '📖', color: 'bg-amber-500', desc: 'Sábio' }
                   ].map((v) => (
                      <button 
                         key={v.name}
                         onClick={() => handleStart(v.name as any)}
                         className="group relative flex flex-col items-center gap-4 p-8 rounded-[2.5rem] bg-zinc-900 border-2 border-zinc-800 hover:border-white transition-all shadow-xl hover:-translate-y-2 active:translate-y-0"
                      >
                         <div className={`w-20 h-20 ${v.color} rounded-3xl flex items-center justify-center text-4xl shadow-lg group-hover:scale-110 transition-transform`}>
                            {v.emoji}
                         </div>
                         <div className="space-y-1">
                            <span className="block text-xl font-black uppercase italic tracking-tighter text-white">{v.name}</span>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{v.desc}</span>
                         </div>
                      </button>
                   ))}
                </div>
              </motion.div>
            )}

            {mode === 'exploration' && (
               <motion.div key="exploration" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                 <ExplorationScene />
               </motion.div>
            )}

            {mode === 'event' && (
               <motion.div key="event" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                 <EventScene />
               </motion.div>
            )}

            {mode === 'puzzle' && (
               <motion.div key="puzzle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                 <PuzzleScene />
               </motion.div>
            )}

            {(mode === 'combat' || mode === 'boss') && (
               <motion.div key="combat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                 <CombatScene />
               </motion.div>
            )}

            {mode === 'victory' && (
              <motion.div
                key="victory"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center h-full p-8 text-center"
              >
                <div className="relative mb-6">
                    <Trophy className="w-24 h-24 text-yellow-500 animate-bounce" />
                    <Sparkles className="absolute -top-4 -right-4 w-12 h-12 text-amber-400 animate-pulse" />
                </div>
                <h2 className="text-5xl font-black text-white mb-2 uppercase italic tracking-tighter">VITÓRIA TOTAL!</h2>
                <p className="text-zinc-500 mb-8 max-w-sm">
                  O Guardião foi repelido. Você é uma verdadeira lenda dos Desbravadores!
                </p>
                <button
                  onClick={resetGame}
                  className="px-12 py-5 bg-white text-black font-black uppercase tracking-tighter rounded-full hover:bg-zinc-200 transition-all flex items-center gap-3 shadow-2xl"
                >
                  Continuar Jornada
                </button>
              </motion.div>
            )}

            {mode === 'gameover' && (
              <motion.div
                key="gameover"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center h-full p-8 text-center"
              >
                <div className="text-8xl mb-8">💀</div>
                <h2 className="text-5xl font-black text-red-500 mb-4 tracking-tighter italic uppercase">DERROTA</h2>
                <p className="text-zinc-500 mb-8 italic">Sua chama vacilou nas sombras...</p>
                <button
                  onClick={resetGame}
                  className="px-8 py-4 bg-zinc-900 border-2 border-red-500/20 text-white font-bold rounded-full hover:bg-zinc-800 transition-all flex items-center gap-3"
                >
                  <Play className="w-5 h-5 fill-red-500 text-red-500" />
                  RECOMEÇAR
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Message Overlay */}
          <AnimatePresence>
            {aiIntro && mode !== 'idle' && mode !== 'gameover' && mode !== 'victory' && (
               <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                onAnimationComplete={() => setTimeout(() => setAiIntro(""), 5000)}
                className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-zinc-950 px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-3 pointer-events-none"
               >
                 <Sparkles className="w-5 h-5" />
                 {aiIntro}
               </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Side Logs */}
        {mode !== 'idle' && (
          <aside className="hidden xl:block w-96 shrink-0 border-l border-zinc-900 bg-zinc-950">
            <GameLogs />
          </aside>
        )}
      </div>
    </div>
  );
}
