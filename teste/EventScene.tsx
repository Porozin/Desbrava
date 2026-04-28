import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { BookOpen, Sparkles, AlertCircle, Coins, Gem, Shield } from 'lucide-react';

type EventType = 'shrine' | 'treasure' | 'mystery';

const EVENTS = [
  {
    id: 'shrine',
    title: 'Santuário Abandonado',
    description: 'Você encontra um altar coberto de hera. Há um espaço para uma oferenda ou você pode apenas rezar.',
    choices: [
      { label: 'Rezar devotamente', result: 'Você sente sua fé aumentar.', action: (state: any) => state.updatePlayer({ fe: state.player.fe + 5 }) },
      { label: 'Deixar suprimentos', result: 'O altar brilha. Você se sente revigorado.', action: (state: any) => state.updatePlayer({ hp: state.player.maxHp }) },
    ],
    icon: Sparkles,
    color: 'text-amber-400'
  },
  {
    id: 'treasure',
    title: 'Baú de Suprimentos',
    description: 'Um baú antigo do Clube de Desbravadores. O que você pega?',
    choices: [
      { 
        label: 'Cantil Reforçado', 
        result: 'Aumenta sua vida máxima.', 
        action: (state: any) => {
          const newMax = state.player.maxHp + 20;
          state.updatePlayer({ maxHp: newMax, hp: state.player.hp + 20 });
          state.addItem({ id: 'item_hp', name: 'Cantil Reforçado', type: 'armor', bonus: { maxHp: 20 } });
        } 
      },
      { 
        label: 'Afiador de Facas', 
        result: 'Seu ataque foi aprimorado.', 
        action: (state: any) => {
          state.updatePlayer({ atk: state.player.atk + 5 });
          state.addItem({ id: 'item_atk', name: 'Afiador de Facas', type: 'weapon', bonus: { atk: 5 } });
        } 
      },
    ],
    icon: Gem,
    color: 'text-blue-400'
  },
  {
    id: 'mystery',
    title: 'Inscrições na Parede',
    description: 'Você encontra códigos que parecem ser da especialidade de Sinais e Códigos.',
    choices: [
      { label: 'Decifrar código', result: 'Você aprendeu uma nova lição. Ganhou XP.', action: (state: any) => state.updatePlayer({ xp: state.player.xp + 50 }) },
      { label: 'Ignorar', result: 'Você segue em frente com cautela.', action: () => {} },
    ],
    icon: BookOpen,
    color: 'text-emerald-400'
  }
];

export default function EventScene() {
  const store = useGameStore();
  const [currentEvent] = useState(EVENTS[Math.floor(Math.random() * EVENTS.length)]);
  const [resolved, setResolved] = useState(false);
  const [resultText, setResultText] = useState('');

  const handleChoice = (choice: any) => {
    choice.action(store);
    setResultText(choice.result);
    setResolved(true);
    store.addLog(`${currentEvent.title}: ${choice.result}`);
    
    setTimeout(() => {
       store.setMode('exploration');
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="w-full max-w-xl bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Visual Background Accent */}
        <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[100px] opacity-10 ${currentEvent.color.replace('text', 'bg')}`} />

        <AnimatePresence mode="wait">
          {!resolved ? (
            <motion.div
              key="event"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="space-y-8"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className={`p-4 rounded-2xl bg-white/5 border border-white/10 ${currentEvent.color}`}>
                  <currentEvent.icon className="w-12 h-12" />
                </div>
                <h2 className="text-3xl font-black tracking-tight text-white">{currentEvent.title}</h2>
                <p className="text-zinc-400 leading-relaxed">{currentEvent.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                {currentEvent.choices.map((choice, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleChoice(choice)}
                    className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-left group"
                  >
                    <span className="block text-sm font-bold text-white mb-1 group-hover:text-amber-500 transition-colors">
                      {choice.label}
                    </span>
                    <span className="text-xs text-zinc-500 leading-tight">Clique para agir</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-12 text-center space-y-6"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/50">
                <Sparkles className="w-8 h-8 text-green-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">Concluído</h3>
                <p className="text-zinc-400">{resultText}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
