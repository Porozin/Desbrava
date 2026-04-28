"use client";
import { useState, useEffect, useCallback } from "react";
import { QUESTOES_FE } from "./questions";

// --- DATA ---
const DUNGEON_ROOMS = [
  { title: "Bosque do Silêncio", icon: "🌲", desc: "Árvores ancestrais sussurram segredos esquecidos. Cada passo ecoa como um tambor.", bg: "from-green-950 via-slate-950 to-black" },
  { title: "Caverna do Eco",     icon: "🕳️", desc: "As paredes de pedra refletem tudo que você é. O medo é apenas a sua própria voz.", bg: "from-stone-950 via-slate-950 to-black" },
  { title: "Rio das Sombras",   icon: "🌊", desc: "Águas negras correm silenciosas. Algo se move sob a superfície.", bg: "from-blue-950 via-slate-950 to-black" },
  { title: "Altar Proibido",    icon: "🏛️", desc: "Ruínas de um templo antigo. A pedra pulsa com energia esquecida.", bg: "from-purple-950 via-slate-950 to-black" },
  { title: "Portal Final",      icon: "🌀", desc: "O ar distorce ao redor de um vórtice. O Guardião aguarda do outro lado.", bg: "from-indigo-950 via-slate-950 to-black" },
];

const MONSTERS = [
  { name: "Sombra Rasteira",  emoji: "👺", hp: 55, atk: 10, xpReward: 20 },
  { name: "Lobo das Trevas",  emoji: "🐺", hp: 65, atk: 13, xpReward: 25 },
  { name: "Aranha Abissal",   emoji: "🕷️", hp: 50, atk: 12, xpReward: 22 },
  { name: "Espírito Errante", emoji: "👻", hp: 60, atk: 11, xpReward: 23 },
  { name: "Servo da Morte",   emoji: "💀", hp: 70, atk: 15, xpReward: 28 },
];

const BOSS = { name: "Guardião das Sombras", emoji: "🐲", hp: 200, atk: 22, xpReward: 100 };

const EVENTS = [
  { icon: "🧙", title: "O Sábio Errante", desc: "Um ancião te oferece ervas medicinais em troca de uma pergunta respondida.", choice1: "Aceitar Oferta", choice2: "Recusar", effect1: (p) => ({ ...p, hp: Math.min(p.maxHp, p.hp + 30) }), log1: "+30 HP restaurado!", log2: "Você segue adiante..." },
  { icon: "⚗️", title: "Elixir Misterioso", desc: "Uma poção brilha sobre uma pedra. Tomar ou deixar — a escolha é sua.", choice1: "Beber o Elixir",  choice2: "Ignorar",  effect1: (p) => ({ ...p, hp: Math.min(p.maxHp, p.hp + 20), atk: p.atk + 2 }), log1: "+20 HP e +2 ATK!", log2: "A sabedoria guia seus passos." },
  { icon: "📜", title: "Inscrição Sagrada", desc: "Versículos antigos estão gravados na parede. Você para para ler.", choice1: "Ler com Cuidado",  choice2: "Seguir em Frente",  effect1: (p) => ({ ...p, fe: p.fe + 5 }), log1: "+5 FÉ! A palavra te fortalece.", log2: "Não há tempo a perder." },
];

// --- UTILS ---
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// --- STYLES ---
const css = {
  btn: (variant = "ghost") => ({
    ghost:   "bg-white/10 hover:bg-white/20 border border-white/20 text-white",
    primary: "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg shadow-blue-900/40",
    danger:  "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-900/40",
    warning: "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white shadow-lg shadow-amber-900/40",
    success: "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-lg shadow-emerald-900/40",
  }[variant],
};

// --- SUB-COMPONENTS ---
function HPBar({ value, max, color = "bg-blue-500", glow = "shadow-blue-500/60" }) {
  const pct = clamp((value / max) * 100, 0, 100);
  const colorClass = pct > 60 ? color : pct > 30 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out shadow-md ${colorClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function EntityCard({ emoji, name, hp, maxHp, isEnemy, hit }) {
  return (
    <div className={`flex flex-col items-center gap-2 ${hit ? (isEnemy ? "animate-hit-enemy" : "animate-hit-player") : ""}`}>
      <div className={`text-7xl leading-none drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] select-none transition-all duration-150 ${hit ? "scale-90 opacity-70" : "scale-100 opacity-100"}`}>
        {emoji}
      </div>
      <p className="text-xs font-bold uppercase tracking-widest text-white/50">{name}</p>
      <div className="w-32">
        <HPBar value={hp} max={maxHp} color={isEnemy ? "bg-red-500" : "bg-blue-500"} />
        <p className="text-center text-xs text-white/40 mt-1">{Math.max(0, hp)} / {maxHp}</p>
      </div>
    </div>
  );
}

function GameBtn({ children, variant = "ghost", onClick, disabled, fullWidth, className = "" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${css.btn(variant)}
        ${fullWidth ? "w-full" : "flex-1"}
        py-4 px-4 rounded-2xl font-bold text-sm uppercase tracking-widest
        active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {children}
    </button>
  );
}

function LogMessage({ msg, type = "neutral" }) {
  const colors = { neutral: "text-white/80", good: "text-amber-300", bad: "text-red-400", info: "text-blue-300" };
  return (
    <div className={`text-center text-sm font-semibold min-h-[1.5rem] transition-all duration-300 ${colors[type]}`}>
      {msg}
    </div>
  );
}

// --- SCREENS ---
function LoadingScreen({ onDone }) {
  useEffect(() => { setTimeout(onDone, 1400); }, [onDone]);
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 animate-fade-in">
      <div className="text-8xl animate-pulse-slow">🗡️</div>
      <div className="text-center">
        <p className="text-xs font-black tracking-[0.4em] text-blue-400 uppercase">Invocando</p>
        <p className="text-2xl font-black text-white tracking-tight mt-1">A Masmorra</p>
      </div>
      <div className="flex gap-1 mt-2">
        {[0,1,2].map(i => (
          <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i*0.2}s` }} />
        ))}
      </div>
    </div>
  );
}

function ExplorationScreen({ room, progress, maxProgress, onCombat, onEvent }) {
  return (
    <div className="flex flex-col h-full animate-slide-up">
      {/* Progress Header */}
      <div className="px-5 pt-5 pb-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black tracking-widest text-white/40 uppercase">Progresso</span>
          <span className="text-xs font-black text-white/60">{progress}/{maxProgress}</span>
        </div>
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-700" style={{ width: `${(progress / maxProgress) * 100}%` }} />
        </div>
      </div>

      {/* Room Info */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4 text-center">
        <div className="text-8xl leading-none animate-float drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
          {room.icon}
        </div>
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">{room.title}</h2>
          <p className="text-sm text-white/50 mt-2 leading-relaxed max-w-xs">{room.desc}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-5 border-t border-white/10 bg-black/30 backdrop-blur-md flex flex-col gap-3">
        <GameBtn variant="primary" onClick={onCombat} fullWidth>
          ⚔️ &nbsp; Enfrentar Perigos
        </GameBtn>
        <GameBtn variant="ghost" onClick={onEvent} fullWidth>
          ✨ &nbsp; Buscar Relíquias
        </GameBtn>
      </div>
    </div>
  );
}

function CombatScreen({ player, enemy, onPlayerAtk, onFaith, log, logType, playerHit, enemyHit, disabled }) {
  return (
    <div className="flex flex-col h-full">
      {/* Enemy Section */}
      <div className="flex-1 flex flex-col items-center justify-center pt-6 px-4 gap-3">
        <div className={`transition-all duration-150 ${enemyHit ? "scale-75 -rotate-6" : "scale-100 rotate-0"}`}>
          <div className="text-7xl leading-none drop-shadow-[0_0_25px_rgba(239,68,68,0.4)] select-none">
            {enemy.emoji}
          </div>
        </div>
        <p className="text-xs font-black tracking-widest text-white/40 uppercase">{enemy.name}</p>
        <div className="w-40">
          <HPBar value={enemy.hp} max={enemy.maxHp} color="bg-red-500" />
          <p className="text-center text-xs text-white/30 mt-1">{Math.max(0, enemy.hp)} / {enemy.maxHp}</p>
        </div>
      </div>

      {/* VS Divider + Log */}
      <div className="px-4 py-3 bg-black/40 mx-4 rounded-2xl text-center border border-white/5">
        <LogMessage msg={log} type={logType} />
      </div>

      {/* Player Section */}
      <div className="flex flex-col items-center px-4 py-4 gap-3">
        <div className="w-40">
          <HPBar value={player.hp} max={player.maxHp} color="bg-blue-500" />
          <p className="text-center text-xs text-white/30 mt-1">{Math.max(0, player.hp)} / {player.maxHp}</p>
        </div>
        <p className="text-xs font-black tracking-widest text-white/40 uppercase">{player.name}</p>
        <div className={`transition-all duration-150 ${playerHit ? "scale-75 rotate-6" : "scale-100 rotate-0"}`}>
          <div className="text-7xl leading-none drop-shadow-[0_0_25px_rgba(59,130,246,0.4)] select-none">
            {player.emoji}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-md">
        <div className="flex gap-3">
          <GameBtn variant="primary" onClick={onPlayerAtk} disabled={disabled}>⚔️ Atacar</GameBtn>
          <GameBtn variant="warning" onClick={onFaith} disabled={disabled}>✨ Usar Fé</GameBtn>
        </div>
      </div>
    </div>
  );
}

function QuizScreen({ question, onAnswer }) {
  return (
    <div className="flex flex-col h-full animate-slide-up px-5 py-6 gap-5">
      <div className="text-center">
        <p className="text-xs font-black tracking-[0.3em] text-amber-400 uppercase mb-3">✝ Prova de Fé</p>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-white font-semibold text-base leading-relaxed">{question.pergunta}</p>
        </div>
      </div>
      <div className="flex flex-col gap-3 flex-1">
        {question.opcoes.map((opt, i) => (
          <button
            key={i}
            onClick={() => onAnswer(i)}
            className="w-full py-4 px-5 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/15 active:scale-98 text-white font-semibold text-sm text-left transition-all duration-150 leading-snug"
          >
            <span className="text-white/40 mr-3 font-black">{String.fromCharCode(65 + i)}.</span>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function EventScreen({ event, onChoice1, onChoice2 }) {
  return (
    <div className="flex flex-col h-full animate-slide-up">
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5 text-center">
        <div className="text-7xl animate-float">{event.icon}</div>
        <div>
          <h2 className="text-xl font-black text-amber-300">{event.title}</h2>
          <p className="text-sm text-white/50 mt-3 leading-relaxed max-w-xs">{event.desc}</p>
        </div>
      </div>
      <div className="p-5 border-t border-white/10 bg-black/30 backdrop-blur-md flex flex-col gap-3">
        <GameBtn variant="success" onClick={onChoice1} fullWidth>✅ &nbsp; {event.choice1}</GameBtn>
        <GameBtn variant="ghost" onClick={onChoice2} fullWidth>{event.choice2}</GameBtn>
      </div>
    </div>
  );
}

function VictoryScreen({ xp, onExit }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 animate-fade-in px-6 text-center">
      <div className="text-9xl animate-bounce-slow drop-shadow-[0_0_40px_rgba(251,191,36,0.5)]">👑</div>
      <div>
        <p className="text-xs font-black tracking-[0.3em] text-amber-400 uppercase">Vitória Lendária</p>
        <h1 className="text-3xl font-black text-white mt-2">Masmorra Concluída!</h1>
      </div>
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-8 py-4">
        <p className="text-4xl font-black text-amber-300">+{xp} XP</p>
        <p className="text-xs text-white/50 mt-1">Recompensa adquirida</p>
      </div>
      <GameBtn variant="primary" onClick={onExit} className="w-full max-w-xs">Voltar ao Acampamento 🏕️</GameBtn>
    </div>
  );
}

function GameOverScreen({ onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 animate-fade-in px-6 text-center">
      <div className="text-9xl grayscale opacity-80">💀</div>
      <div>
        <p className="text-xs font-black tracking-[0.3em] text-red-400 uppercase">Derrota</p>
        <h1 className="text-2xl font-black text-white mt-2">Sua Jornada Termina Aqui</h1>
        <p className="text-sm text-white/40 mt-2">Os fortes aprendem com a queda.</p>
      </div>
      <GameBtn variant="danger" onClick={onRetry} className="w-full max-w-xs">🔄 Tentar Novamente</GameBtn>
    </div>
  );
}

// --- MAIN GAME ---
export default function DungeonGame({ user, onFinish }) {
  const [screen, setScreen] = useState("loading"); // loading, explore, combat, quiz, event, victory, gameover
  const [progress, setProgress] = useState(0);
  const [player, setPlayer] = useState({
    name: user.displayName?.split(" ")[0] || "Caçador",
    emoji: user.photoURL && user.photoURL.length <= 4 ? user.photoURL : "🛡️",
    hp: 100, maxHp: 100, atk: 15, fe: 10,
  });
  const [enemy, setEnemy] = useState(null);
  const [log, setLog] = useState("O combate começou!");
  const [logType, setLogType] = useState("neutral");
  const [playerHit, setPlayerHit] = useState(false);
  const [enemyHit, setEnemyHit] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [activeEvent, setActiveEvent] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const MAX_PROGRESS = DUNGEON_ROOMS.length;

  const triggerHit = (target) => {
    if (target === "enemy") { setEnemyHit(true); setTimeout(() => setEnemyHit(false), 180); }
    else { setPlayerHit(true); setTimeout(() => setPlayerHit(false), 180); }
  };

  const addLog = useCallback((msg, type = "neutral") => {
    setLog(msg);
    setLogType(type);
  }, []);

  const startCombat = useCallback(() => {
    const isBoss = progress >= MAX_PROGRESS - 1;
    const m = isBoss ? { ...BOSS } : { ...MONSTERS[Math.floor(Math.random() * MONSTERS.length)] };
    setEnemy(m);
    setLog(`${m.name} surge das trevas!`);
    setLogType("bad");
    setDisabled(false);
    setScreen("combat");
  }, [progress, MAX_PROGRESS]);

  const startEvent = () => {
    setActiveEvent(EVENTS[Math.floor(Math.random() * EVENTS.length)]);
    setScreen("event");
  };

  const handleAttack = () => {
    if (disabled) return;
    setDisabled(true);
    triggerHit("enemy");

    setEnemy(prev => {
      const newHp = prev.hp - player.atk;
      addLog(`Você atacou! -${player.atk} HP inimigo`, "good");

      setTimeout(() => {
        if (newHp <= 0) {
          handleVictoryCombat(prev.xpReward || 30);
          return;
        }
        // Enemy turn
        setTimeout(() => {
          const dmg = Math.floor(enemy.atk * (0.85 + Math.random() * 0.3));
          triggerHit("player");
          setPlayer(pp => {
            const nhp = pp.hp - dmg;
            addLog(`${enemy.name} revidou! -${dmg} HP`, "bad");
            if (nhp <= 0) { setTimeout(() => setScreen("gameover"), 800); }
            return { ...pp, hp: Math.max(0, nhp) };
          });
          setDisabled(false);
        }, 600);
      }, 400);

      return { ...prev, hp: Math.max(0, newHp) };
    });
  };

  const handleFaith = () => {
    if (disabled) return;
    setDisabled(true);
    const q = QUESTOES_FE[Math.floor(Math.random() * QUESTOES_FE.length)];
    setActiveQuiz(q);
    setScreen("quiz");
  };

  const handleQuizAnswer = (idx) => {
    const q = activeQuiz;
    setActiveQuiz(null);
    setScreen("combat");

    if (idx === q.correta) {
      triggerHit("enemy");
      setEnemy(prev => {
        const newHp = prev.hp - q.dano;
        addLog(`✝ LUZ DIVINA! -${q.dano} dano crítico!`, "good");
        if (newHp <= 0) { setTimeout(() => handleVictoryCombat(prev.xpReward || 30), 500); return { ...prev, hp: 0 }; }
        return { ...prev, hp: newHp };
      });
    } else {
      triggerHit("player");
      setPlayer(pp => ({ ...pp, hp: Math.max(0, pp.hp - 15) }));
      addLog("Você hesitou... -15 HP", "bad");
    }
    setTimeout(() => setDisabled(false), 800);
  };

  const handleVictoryCombat = (xpReward) => {
    const isBoss = progress >= MAX_PROGRESS - 1;
    addLog(isBoss ? "O Guardião foi derrotado! 👑" : "Inimigo dissipado!", "good");
    setTimeout(() => {
      if (isBoss) {
        setScreen("victory");
        if (onFinish) onFinish(100);
      } else {
        setProgress(p => p + 1);
        setScreen("explore");
      }
    }, 1200);
  };

  const handleEventChoice = (which) => {
    const ev = activeEvent;
    setActiveEvent(null);
    if (which === 1) {
      setPlayer(p => ev.effect1(p));
      addLog(ev.log1, "good");
    } else {
      addLog(ev.log2, "info");
    }
    setProgress(p => p + 1);
    setScreen("explore");
  };

  const currentRoom = DUNGEON_ROOMS[Math.min(progress, DUNGEON_ROOMS.length - 1)];

  const bgGradient = {
    loading: "from-slate-950 via-slate-900 to-black",
    explore: currentRoom?.bg || "from-slate-950 to-black",
    combat: "from-red-950 via-slate-950 to-black",
    quiz:   "from-amber-950 via-slate-950 to-black",
    event:  "from-emerald-950 via-slate-950 to-black",
    victory: "from-amber-950 via-slate-900 to-black",
    gameover: "from-red-950 via-slate-950 to-black",
  }[screen] || "from-slate-950 to-black";

  return (
    <>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes slide-up { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fade-in { from{opacity:0} to{opacity:1} }
        @keyframes pulse-slow { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes bounce-slow { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-15px)} }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-slide-up { animation: slide-up 0.35s ease-out both; }
        .animate-fade-in { animation: fade-in 0.5s ease-out both; }
        .animate-pulse-slow { animation: pulse-slow 2s ease-in-out infinite; }
        .animate-bounce-slow { animation: bounce-slow 1.2s ease-in-out infinite; }
      `}</style>
      <div className={`w-full h-full bg-gradient-to-b ${bgGradient} transition-all duration-700 relative overflow-hidden`}>
        {/* Ambient particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute w-1 h-1 bg-white/5 rounded-full animate-float" style={{ left: `${15 + i * 16}%`, top: `${10 + (i % 3) * 25}%`, animationDelay: `${i * 0.5}s`, animationDuration: `${3 + i * 0.4}s` }} />
          ))}
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col">
          {screen === "loading"  && <LoadingScreen onDone={() => setScreen("explore")} />}
          {screen === "explore"  && (
            <ExplorationScreen
              room={currentRoom}
              progress={progress}
              maxProgress={MAX_PROGRESS}
              onCombat={startCombat}
              onEvent={startEvent}
            />
          )}
          {screen === "combat"   && enemy && (
            <CombatScreen
              player={player}
              enemy={enemy}
              onPlayerAtk={handleAttack}
              onFaith={handleFaith}
              log={log}
              logType={logType}
              playerHit={playerHit}
              enemyHit={enemyHit}
              disabled={disabled}
            />
          )}
          {screen === "quiz"     && activeQuiz && (
            <QuizScreen question={activeQuiz} onAnswer={handleQuizAnswer} />
          )}
          {screen === "event"    && activeEvent && (
            <EventScreen
              event={activeEvent}
              onChoice1={() => handleEventChoice(1)}
              onChoice2={() => handleEventChoice(2)}
            />
          )}
          {screen === "victory"  && <VictoryScreen xp={100} onExit={() => { window.location.href = "/dashboard"; }} />}
          {screen === "gameover" && <GameOverScreen onRetry={() => window.location.reload()} />}
        </div>
      </div>
    </>
  );
}
