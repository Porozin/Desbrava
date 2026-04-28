import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { Sword, Shield, Sparkles } from 'lucide-react';
import FaithQuiz from './FaithQuiz';
import { sounds } from '../../lib/sounds';
import { generateEnemyTaunt } from '../../services/geminiService';

const ENEMIES = [
  { name: 'Sentinela de Ferro', emoji: '🤖', hp: 50, maxHp: 50, atk: 10, boss: false },
  { name: 'Sombra Errante', emoji: '👻', hp: 35, maxHp: 35, atk: 15, boss: false },
  { name: 'Construto Arcano', emoji: '🏗️', hp: 60, maxHp: 60, atk: 8, boss: false },
  { name: 'Gárgula de Pedra', emoji: '🗿', hp: 45, maxHp: 45, atk: 12, boss: false },
  { name: 'Espectro de Fé', emoji: '✨', hp: 30, maxHp: 30, atk: 18, boss: false },
  { name: 'Cão Infernal', emoji: '🐕', hp: 40, maxHp: 40, atk: 14, boss: false },
  { name: 'Serpente das Sombras', emoji: '🐍', hp: 25, maxHp: 25, atk: 22, boss: false },
];

const BOSS = { name: 'O Guardião do Vazio', emoji: '👹', hp: 200, maxHp: 200, atk: 25, boss: true };

const generateEnemy = (template: typeof ENEMIES[0]) => {
  const variance = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
  const hp = Math.floor(template.hp * variance);
  const atk = Math.floor(template.atk * variance);
  
  let prefix = "";
  if (variance > 1.1) prefix = "Feroz ";
  if (variance < 0.9) prefix = "Frágil ";

  return {
    ...template,
    name: template.boss ? template.name : `${prefix}${template.name}`,
    hp,
    maxHp: hp,
    atk
  };
};

export default function CombatScene() {
  const { player, enemy, mode, setEnemy, damageEnemy, damagePlayer, addLog, setMode, updatePlayer, character } = useGameStore();
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [isAttacking, setIsAttacking] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [enemyHurt, setEnemyHurt] = useState(false);
  const [playerHurt, setPlayerHurt] = useState(false);
  const [taunt, setTaunt] = useState("");

  useEffect(() => {
    if (!enemy) {
      const template = mode === 'boss' ? BOSS : ENEMIES[Math.floor(Math.random() * ENEMIES.length)];
      const spawnedEnemy = generateEnemy(template);
      setEnemy(spawnedEnemy);
      addLog(`Um ${spawnedEnemy.name} surgiu! 🐾`);
      
      // AI Taunt
      generateEnemyTaunt(spawnedEnemy.name).then(setTaunt);
    }
  }, [enemy, setEnemy, addLog, mode]);

  useEffect(() => {
    if (enemy && enemy.hp <= 0) {
      const xpGained = enemy.boss ? 100 : 20;
      addLog(`${enemy.name} foi derrotado! Você ganhou ${xpGained} XP.`);
      
      const newXp = player.xp + xpGained;
      const newLevel = Math.floor(newXp / 100) + 1;
      const leveledUp = newLevel > player.level;
      
      if (leveledUp) {
        addLog("NÍVEL AUMENTADO! Sua força cresce. ✨");
      }

      const updatedStats = { 
        xp: newXp, 
        level: newLevel,
        atk: leveledUp ? player.atk + 5 : player.atk,
        maxHp: leveledUp ? player.maxHp + 20 : player.maxHp,
        hp: leveledUp ? player.maxHp + 20 : player.hp,
        fe: player.fe
      };

      updatePlayer(updatedStats);
      import('../../services/dbService').then(s => s.savePlayerStats(updatedStats));

      setEnemy(null);
      if (enemy.boss) {
        setMode('victory');
      } else {
        setMode('exploration');
      }
    }
    if (player.hp <= 0) {
      addLog("Você foi derrotado nas profundezas...");
      setMode('gameover');
    }
  }, [enemy?.hp, player.hp]);

  const handleAction = async (type: 'attack' | 'defend' | 'fe') => {
    if (!isPlayerTurn || !enemy || showQuiz) return;

    if (type === 'fe') {
      setShowQuiz(true);
      return;
    }

    setIsPlayerTurn(false);
    setIsAttacking(true);

    if (type === 'attack') {
      sounds.playAttack();
      const crit = Math.random() > 0.8;
      const dmg = crit ? player.atk * 2 : player.atk;
      addLog(`💥 Você ataca! ${crit ? 'CRÍTICO! ' : ''}Causou ${dmg} de dano.`);
      
      setEnemyHurt(true);
      sounds.playDamage();
      setTimeout(() => setEnemyHurt(false), 500);
      
      damageEnemy(dmg);
    } else if (type === 'defend') {
      addLog("🛡️ Você se prepara para o próximo golpe.");
    }

    setTimeout(() => {
      setIsAttacking(false);
      enemyTurn();
    }, 1000);
  };

  const handleQuizResult = (correct: boolean) => {
    setShowQuiz(false);
    setIsPlayerTurn(false);
    setIsAttacking(true);
    
    if (correct) {
      sounds.playVictory();
      const dmg = player.atk * 3;
      addLog(`✨ FÉ MANIFESTADA! O golpe sagrado causou ${dmg} de dano!`);
      
      setEnemyHurt(true);
      sounds.playDamage();
      setTimeout(() => setEnemyHurt(false), 500);
      
      damageEnemy(dmg);
    } else {
      addLog("Seu espírito vacila... O ataque falhou.");
    }

    setTimeout(() => {
      setIsAttacking(false);
      enemyTurn();
    }, 1000);
  };

  const enemyTurn = () => {
    if (!enemy) return;
    setTimeout(() => {
      const dmg = enemy.atk;
      addLog(`💢 ${enemy.name} ataca e causa ${dmg} de dano.`);
      
      setPlayerHurt(true);
      sounds.playDamage();
      setTimeout(() => setPlayerHurt(false), 500);
      
      damagePlayer(dmg);
      setIsPlayerTurn(true);
    }, 800);
  };

  if (!enemy) return null;

  return (
    <motion.div 
      animate={playerHurt ? { x: [-10, 10, -10, 10, 0] } : {}}
      className="relative flex flex-col items-center justify-between min-h-[500px] p-8 pt-12 overflow-hidden"
    >
      <AnimatePresence>
        {playerHurt && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-red-600 z-0 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQuiz && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
                <div className="w-full max-w-md">
                    <FaithQuiz onResult={handleQuizResult} />
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Combat Arena (SAP Style) */}
      <div className="w-full max-w-4xl flex flex-col items-center gap-12 relative z-10">
        
        {/* Enemy Side */}
        <div className="flex flex-col items-center gap-4">
           <AnimatePresence>
             {taunt && (
               <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white text-zinc-900 px-4 py-2 rounded-2xl text-xs font-bold relative mb-2 shadow-lg"
               >
                 {taunt}
                 <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white" />
               </motion.div>
             )}
           </AnimatePresence>

           <motion.div
            animate={
              enemyHurt 
                ? { x: [-5, 5, -5, 5, 0], scale: [1, 1.1, 1] } 
                : isAttacking 
                  ? { y: [0, 20, 0] } 
                  : {}
            }
            className="w-32 h-32 bg-zinc-800 border-4 border-zinc-700 rounded-3xl flex items-center justify-center text-6xl relative shadow-xl"
          >
            {(enemy as any).emoji}
            <AnimatePresence>
              <div className="absolute -bottom-4 w-40 left-1/2 -translate-x-1/2 h-4 bg-zinc-900 rounded-full border-2 border-zinc-700 overflow-hidden">
                  <motion.div 
                      initial={{ width: '100%' }}
                      animate={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                      className={`h-full transition-all duration-300 ${enemy.boss ? 'bg-amber-500' : 'bg-red-500'}`}
                  />
              </div>
            </AnimatePresence>
          </motion.div>
          <h3 className="text-xl font-black text-white uppercase tracking-tighter mt-4">{enemy.name}</h3>
        </div>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />

        {/* Player Side */}
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={!isPlayerTurn && !showQuiz ? { y: [0, -10, 0] } : {}}
            className="w-32 h-32 bg-amber-500/10 border-4 border-amber-500 rounded-3xl flex items-center justify-center text-6xl shadow-xl shadow-amber-500/10"
          >
            {character.vocation === 'Desbravador' ? '🏕️' : character.vocation === 'Líder' ? '🧭' : '📖'}
          </motion.div>
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">{character.vocation}</h3>
        </div>
      </div>

      {/* Action Buttons (SAP Style) */}
      <div className="relative z-10 grid grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-2xl bg-zinc-900/80 p-6 rounded-[2.5rem] border-2 border-zinc-800 backdrop-blur-md shadow-2xl">
        <ActionButton 
          icon={Sword} 
          label="Ataque" 
          onClick={() => handleAction('attack')} 
          disabled={!isPlayerTurn}
          color="bg-red-500 hover:bg-red-400"
        />
        <ActionButton 
          icon={Shield} 
          label="Defesa" 
          onClick={() => handleAction('defend')} 
          disabled={!isPlayerTurn}
          color="bg-blue-500 hover:bg-blue-400"
        />
        <ActionButton 
          icon={Sparkles} 
          label="Fé" 
          onClick={() => handleAction('fe')} 
          disabled={!isPlayerTurn}
          color="bg-amber-500 hover:bg-amber-400"
        />
      </div>
    </motion.div>
  );
}

function ActionButton({ icon: Icon, label, onClick, disabled, color }: any) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      disabled={disabled}
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 py-6 rounded-3xl font-black text-sm uppercase tracking-tighter transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed ${color} text-zinc-950 shadow-[0_8px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-1`}
    >
      <Icon className="w-8 h-8" strokeWidth={3} />
      {label}
    </motion.button>
  );
}
