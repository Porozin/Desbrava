import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { Zap, ShieldCheck, RefreshCw } from 'lucide-react';
import { sounds } from '../../lib/sounds';

export default function PuzzleScene() {
  const { setMode, addLog, updatePlayer, player } = useGameStore();
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeBtn, setActiveBtn] = useState<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'playing' | 'guessing' | 'success' | 'fail'>('idle');

  const startPuzzle = () => {
    const newSeq = Array.from({ length: 4 }, () => Math.floor(Math.random() * 4));
    setSequence(newSeq);
    setUserSequence([]);
    setStatus('playing');
    playSequence(newSeq);
  };

  const playSequence = async (seq: number[]) => {
    setIsPlaying(true);
    for (const num of seq) {
      await new Promise(r => setTimeout(r, 600));
      sounds.playClick(); // Simulate signal sound
      setActiveBtn(num);
      await new Promise(r => setTimeout(r, 300));
      setActiveBtn(null);
    }
    setIsPlaying(false);
    setStatus('guessing');
  };

  const handleGuess = (num: number) => {
    if (status !== 'guessing' || isPlaying) return;
    sounds.playClick();
    const nextUserSeq = [...userSequence, num];
    setUserSequence(nextUserSeq);

    if (num !== sequence[nextUserSeq.length - 1]) {
      setStatus('fail');
      addLog("Você falhou em decifrar o código.");
      setTimeout(() => setMode('exploration'), 1500);
      return;
    }

    if (nextUserSeq.length === sequence.length) {
      setStatus('success');
      addLog("Código decifrado! Você encontrou recursos escondidos.");
      updatePlayer({ xp: player.xp + 40, fe: player.fe + 2 });
      sounds.playVictory();
      setTimeout(() => setMode('exploration'), 1500);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-8 shadow-2xl">
        <div className="text-center space-y-2">
          <Zap className="w-8 h-8 text-amber-500 mx-auto" />
          <h2 className="text-2xl font-black text-white">SINAL DE CÓDIGO</h2>
          <p className="text-zinc-500 text-sm">Observe a sequência de luzes e sons para decifrar o caminho.</p>
        </div>

        {status === 'idle' ? (
          <button 
            onClick={startPuzzle}
            className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors"
          >
            Começar Decifração
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((num) => (
              <motion.button
                key={num}
                id={`puzzle-btn-${num}`}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleGuess(num)}
                disabled={status !== 'guessing'}
                className={`
                  aspect-square rounded-2xl border-2 transition-all flex items-center justify-center
                  ${status === 'guessing' ? 'bg-zinc-800 border-zinc-700 hover:border-amber-500' : 'bg-zinc-950 border-zinc-900'}
                  ${status === 'success' ? 'border-green-500 bg-green-500/10' : ''}
                  ${status === 'fail' ? 'border-red-500 bg-red-500/10' : ''}
                  ${activeBtn === num ? 'bg-amber-500/50 border-amber-500' : ''}
                `}
              >
                <div className={`w-4 h-4 rounded-full transition-colors ${status === 'success' ? 'bg-green-500' : status === 'fail' ? 'bg-red-500' : activeBtn === num ? 'bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.8)]' : 'bg-white/10'}`} />
              </motion.button>
            ))}
          </div>
        )}

        <div className="text-center">
            {status === 'playing' && <span className="text-sm font-mono text-amber-500 animate-pulse uppercase tracking-widest">Observando...</span>}
            {status === 'guessing' && <span className="text-sm font-mono text-zinc-400 uppercase tracking-widest">Sua Vez</span>}
        </div>
      </div>
    </div>
  );
}
