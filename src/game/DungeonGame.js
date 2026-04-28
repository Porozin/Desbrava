"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { QUESTOES_FE } from "./questions";
import { sounds } from "./sounds";
import { generateDungeonIntro, generateEnemyTaunt } from "./ai";
import { 
  Sword, Shield, Sparkles, ChevronLeft, Package, 
  Trash2, Zap, Heart, Flame, Scroll, Trophy, X
} from "lucide-react";

// --- CONSTANTS ---

const ROOMS = [
  { title: "Bosque do Silêncio", icon: "🌲", desc: "Árvores sussurram segredos nas sombras.", bg: "radial-gradient(ellipse at top, #052e16 0%, #020617 60%)" },
  { title: "Caverna do Eco",     icon: "🕳️", desc: "A escuridão amplifica cada som.", bg: "radial-gradient(ellipse at top, #1c1917 0%, #020617 60%)" },
  { title: "Rio das Sombras",   icon: "🌊", desc: "Águas negras correm silenciosas.", bg: "radial-gradient(ellipse at top, #0c1445 0%, #020617 60%)" },
  { title: "Altar Proibido",    icon: "🏛️", desc: "Ruínas pulsam com energia esquecida.", bg: "radial-gradient(ellipse at top, #2e1065 0%, #020617 60%)" },
  { title: "Portal Final",      icon: "🌀", desc: "O Guardião aguarda do outro lado.", bg: "radial-gradient(ellipse at top, #450a0a 0%, #020617 60%)" },
];

const MONSTERS = [
  { name: "Sombra Rasteira",  emoji: "👺", hp: 60, maxHp: 60, atk: 12, xp: 20 },
  { name: "Lobo das Trevas",  emoji: "🐺", hp: 70, maxHp: 70, atk: 14, xp: 25 },
  { name: "Aranha Abissal",   emoji: "🕷️", hp: 55, maxHp: 55, atk: 13, xp: 22 },
  { name: "Espírito Errante", emoji: "👻", hp: 65, maxHp: 65, atk: 12, xp: 23 },
  { name: "Servo da Morte",   emoji: "💀", hp: 80, maxHp: 80, atk: 16, xp: 28 },
];

const BOSS = { name: "Guardião das Sombras", emoji: "🐲", hp: 250, maxHp: 250, atk: 24, xp: 100 };

const ITEM_POOL = [
  { id: 'sw1', name: "Espada Curta", type: "weapon", bonus: { atk: 5 }, emoji: "🗡️", desc: "+5 ATK" },
  { id: 'sw2', name: "Lâmina de Prata", type: "weapon", bonus: { atk: 10 }, emoji: "⚔️", desc: "+10 ATK" },
  { id: 'sh1', name: "Escudo de Madeira", type: "armor", bonus: { maxHp: 20 }, emoji: "🛡️", desc: "+20 Max HP" },
  { id: 'sh2', name: "Escudo de Ferro", type: "armor", bonus: { maxHp: 40 }, emoji: "🛡️", desc: "+40 Max HP" },
  { id: 'bt1', name: "Botas de Couro", type: "accessory", bonus: { def: 5 }, emoji: "👞", desc: "+5 DEF" },
];

// --- STYLES (SAP / RPG STYLE) ---

const S = {
  screen: { width: "100%", height: "100%", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", background: "#020617" },
  topBar: { padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.3)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(255,255,255,0.1)", zIndex: 10 },
  main: { flex: 1, display: "flex", flexDirection: "column", position: "relative" },
  footer: { padding: "20px", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(15px)", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", gap: 12 },
  logs: { height: 80, overflowY: "auto", padding: "0 10px", fontSize: 13, display: "flex", flexDirection: "column-reverse", gap: 4, color: "rgba(255,255,255,0.5)" },
  card: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: 20, textAlign: "center" },
  btn: (color = "#3b82f6") => ({
    flex: 1, padding: "16px", borderRadius: 16, border: "none", background: color, color: "#fff", fontWeight: 800, 
    fontSize: 14, textTransform: "uppercase", letterSpacing: "0.05em", cursor: "pointer", 
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.1s ease",
    boxShadow: `0 4px 0 ${color}CC`
  }),
  btnSecondary: { padding: "12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.05)", color: "#fff", cursor: "pointer" }
};

// --- COMPONENTS ---

function ProgressBar({ current, max }) {
  const pct = (current / max) * 100;
  return (
    <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.1)", borderRadius: 4, margin: "0 16px", overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #3b82f6, #8b5cf6)", transition: "width 0.5s ease" }} />
    </div>
  );
}

function StatBadge({ icon: Icon, value, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(0,0,0,0.3)", padding: "4px 8px", borderRadius: 8, fontSize: 12, border: `1px solid ${color}40` }}>
      <Icon size={12} color={color} />
      <span style={{ fontWeight: 700, color: "#fff" }}>{value}</span>
    </div>
  );
}

function HPBar({ current, max, color = "#ef4444" }) {
  const pct = Math.max(0, (current / max) * 100);
  return (
    <div style={{ width: "100%", height: 10, background: "rgba(0,0,0,0.5)", borderRadius: 5, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, transition: "width 0.3s ease" }} />
    </div>
  );
}

// --- MAIN GAME COMPONENT ---

export default function DungeonGame({ user, onFinish }) {
  const [screen, setScreen] = useState("loading");
  const [progress, setProgress] = useState(0);
  const [player, setPlayer] = useState({
    name: user.displayName?.split(" ")[0] || "Caçador",
    emoji: user.photoURL?.length <= 4 ? user.photoURL : "🛡️",
    hp: 100, maxHp: 100, atk: 15, def: 5, fe: 10, xp: 0
  });
  const [enemy, setEnemy] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [equipment, setEquipment] = useState({ weapon: null, armor: null, accessory: null });
  const [logs, setLogs] = useState(["Benvindo ao Desbrava RPG."]);
  const [activeTaunt, setActiveTaunt] = useState("");
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [puzzle, setPuzzle] = useState(null); // { sequence, input }
  const [disabled, setDisabled] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [shake, setShake] = useState(null); // 'p' or 'e'
  
  const logEndRef = useRef(null);
  const MAX_PROGRESS = ROOMS.length;

  const addLog = (msg) => setLogs(prev => [msg, ...prev].slice(0, 20));

  useEffect(() => {
    if (screen === "loading") {
      generateDungeonIntro(player.name).then(msg => {
        addLog(msg);
        setTimeout(() => setScreen("explore"), 1500);
      });
    }
  }, [screen, player.name]);

  // Effects for equipment bonuses
  const getAtk = () => player.atk + (equipment.weapon?.bonus.atk || 0);
  const getMaxHp = () => player.maxHp + (equipment.armor?.bonus.maxHp || 0);
  const getDef = () => player.def + (equipment.accessory?.bonus.def || 0);

  const startCombat = useCallback(() => {
    const isBoss = progress >= MAX_PROGRESS - 1;
    const template = isBoss ? BOSS : MONSTERS[Math.floor(Math.random() * MONSTERS.length)];
    
    // Variance
    const variance = 0.8 + Math.random() * 0.4;
    const spawn = { 
      ...template, 
      hp: Math.floor(template.hp * variance), 
      maxHp: Math.floor(template.maxHp * variance),
      atk: Math.floor(template.atk * variance),
      prefix: variance > 1.1 ? "Feroz " : variance < 0.9 ? "Frágil " : ""
    };
    
    setEnemy(spawn);
    setScreen("combat");
    sounds.play("click");
    generateEnemyTaunt(spawn.name).then(setActiveTaunt);
  }, [progress, MAX_PROGRESS]);

  const doFaith = () => {
    if (disabled) return;
    setDisabled(true);
    sounds.play("click");
    setActiveQuiz(QUESTOES_FE[Math.floor(Math.random() * QUESTOES_FE.length)]);
    setScreen("quiz");
  };

  const onQuizAnswer = (idx) => {
    const q = activeQuiz;
    setActiveQuiz(null);
    setScreen("combat");
    
    if (idx === q.correta) {
      sounds.play("faith");
      setShake("e");
      const dmg = q.dano;
      const newEnemyHp = Math.max(0, enemy.hp - dmg);
      addLog(`✨ LUZ DIVINA! Sua fé causou ${dmg} de dano crítico!`);
      setEnemy(prev => ({ ...prev, hp: newEnemyHp }));
      setTimeout(() => {
        setShake(null);
        if (newEnemyHp <= 0) handleVictory();
        else setDisabled(false);
      }, 500);
    } else {
      sounds.play("damage");
      setShake("p");
      addLog("⚠️ Sua fé vacilou... Você recebeu dano mental.");
      setPlayer(prev => ({ ...prev, hp: Math.max(0, prev.hp - 15) }));
      setTimeout(() => {
        setShake(null);
        setDisabled(false);
      }, 500);
    }
  };

  const startPuzzle = () => {
    sounds.play("click");
    const seq = Array.from({ length: 4 }, () => Math.floor(Math.random() * 4));
    setPuzzle({ sequence: seq, input: [] });
    setScreen("puzzle");
  };

  const onPuzzleClick = (val) => {
    if (!puzzle) return;
    const newIn = [...puzzle.input, val];
    sounds.play("click");
    
    if (newIn[newIn.length - 1] !== puzzle.sequence[newIn.length - 1]) {
      addLog("❌ Sequência incorreta! Você perdeu a chance.");
      setScreen("explore");
      return;
    }

    if (newIn.length === puzzle.sequence.length) {
      sounds.play("levelUp");
      addLog("✅ Mistério resolvido! Você ganhou +10 ATK temporário.");
      setPlayer(prev => ({ ...prev, atk: prev.atk + 10 }));
      setScreen("explore");
      setProgress(p => p + 1);
    } else {
      setPuzzle({ ...puzzle, input: newIn });
    }
  };

  const doAttack = () => {
    if (disabled || !enemy) return;
    setDisabled(true);
    sounds.play("attack");
    
    // Player Hit
    setShake("e");
    const crit = Math.random() > 0.85;
    const dmg = crit ? getAtk() * 2 : getAtk();
    const newEnemyHp = Math.max(0, enemy.hp - dmg);
    
    addLog(`💥 Você atacou o ${enemy.name}! ${crit ? 'CRÍTICO! ' : ''}-${dmg} HP`);
    setEnemy(prev => ({ ...prev, hp: newEnemyHp }));

    setTimeout(() => {
      setShake(null);
      if (newEnemyHp <= 0) {
        handleVictory();
      } else {
        // Enemy Turn
        setTimeout(() => {
          sounds.play("damage");
          setShake("p");
          const eDmg = Math.max(1, enemy.atk - getDef());
          const newPlayerHp = Math.max(0, player.hp - eDmg);
          
          addLog(`💢 ${enemy.name} revidou! -${eDmg} HP`);
          setPlayer(prev => ({ ...prev, hp: newPlayerHp }));
          
          if (newPlayerHp <= 0) {
            sounds.play("defeat");
            setScreen("gameover");
          }
          
          setTimeout(() => {
            setShake(null);
            setDisabled(false);
          }, 300);
        }, 500);
      }
    }, 300);
  };

  const handleVictory = () => {
    sounds.play("victory");
    const xpGained = enemy.xp || 20;
    addLog(`🏆 Vitória! +${xpGained} XP.`);
    
    // Loot chance
    if (Math.random() > 0.5) {
      const item = ITEM_POOL[Math.floor(Math.random() * ITEM_POOL.length)];
      addLog(`🎁 Você encontrou: ${item.emoji} ${item.name}!`);
      setInventory(prev => [...prev, item]);
    }

    setPlayer(prev => ({ ...prev, xp: prev.xp + xpGained }));
    setTimeout(() => {
      if (enemy.name === BOSS.name) {
        setScreen("victory");
        if (onFinish) onFinish(100);
      } else {
        setProgress(p => p + 1);
        setScreen("explore");
      }
      setEnemy(null);
      setDisabled(false);
      setActiveTaunt("");
    }, 1000);
  };

  const equipItem = (item) => {
    sounds.play("click");
    setEquipment(prev => {
      const type = item.type === "weapon" ? "weapon" : item.type === "armor" ? "armor" : "accessory";
      return { ...prev, [type]: item };
    });
    addLog(`Equipado: ${item.name}`);
  };

  const room = ROOMS[Math.min(progress, ROOMS.length - 1)];

  return (
    <div style={{ ...S.screen, background: screen === "explore" ? room.bg : S.screen.background }}>
      
      {/* TOP BAR */}
      <div style={S.topBar}>
        <button onClick={() => window.location.href="/dashboard"} style={S.btnSecondary}><ChevronLeft size={18}/></button>
        <ProgressBar current={progress} max={MAX_PROGRESS} />
        <div style={{ display: "flex", gap: 8 }}>
          <StatBadge icon={Heart} value={player.hp} color="#ef4444" />
          <StatBadge icon={Flame} value={getAtk()} color="#f59e0b" />
          <button onClick={() => setShowInventory(true)} style={{ ...S.btnSecondary, background: "var(--accent-primary)" }}><Package size={18}/></button>
        </div>
      </div>

      <div style={S.main}>
        {/* EXPLORE SCREEN */}
        {screen === "explore" && (
          <div style={{ padding: 40, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20, marginTop: "10%" }}>
             <div style={{ fontSize: 100, filter: "drop-shadow(0 0 20px rgba(255,255,255,0.2))", animation: "float 3s ease-in-out infinite" }}>{room.icon}</div>
             <h2 style={{ color: "#fff", fontSize: 28, fontWeight: 900 }}>{room.title}</h2>
             <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, maxWidth: 300 }}>{room.desc}</p>
             <div style={{ width: "100%", maxWidth: 300, display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
                <button style={S.btn("#3b82f6")} onClick={startCombat}><Sword size={20}/> Seguir em Frente</button>
                <button style={S.btn("#fbbf24")} onClick={startPuzzle}><Zap size={20}/> Caminho Oculto</button>
                <button style={S.btn("rgba(255,255,255,0.1)")} onClick={() => { addLog("🔍 Você vasculhou a área mas nada encontrou."); setProgress(p=>p+1); }}><Scroll size={20}/> Investigar</button>
             </div>
          </div>
        )}

        {/* COMBAT SCREEN */}
        {screen === "combat" && enemy && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 20, justifyContent: "space-between" }}>
            
            {/* Enemy Side */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginTop: 20, transform: shake === "e" ? "translateY(10px)" : "none", transition: "transform 0.1s" }}>
              {activeTaunt && (
                <div style={{ background: "#fff", color: "#000", padding: "6px 12px", borderRadius: "12px 12px 12px 0", fontSize: 12, fontWeight: 700, position: "relative", marginBottom: 10 }}>
                  {activeTaunt}
                  <div style={{ position: "absolute", bottom: -6, left: 0, width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderTop: "8px solid #fff" }} />
                </div>
              )}
              <div style={{ fontSize: 80 }}>{enemy.emoji}</div>
              <div style={{ width: "100%", maxWidth: 200 }}>
                <HPBar current={enemy.hp} max={enemy.maxHp} />
                <p style={{ color: "#fff", fontSize: 11, textAlign: "center", marginTop: 4, fontWeight: 900, textTransform: "uppercase" }}>{enemy.prefix}{enemy.name}</p>
              </div>
            </div>

            <div style={{ height: 2, background: "rgba(255,255,255,0.05)", width: "80%", alignSelf: "center" }} />

            {/* Player Side */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 20, transform: shake === "p" ? "translateY(-10px)" : "none", transition: "transform 0.1s" }}>
               <div style={{ fontSize: 80, border: "4px solid var(--accent-primary)", borderRadius: 30, width: 120, height: 120, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(59,130,246,0.1)" }}>{player.emoji}</div>
               <div style={{ width: "100%", maxWidth: 200 }}>
                <HPBar current={player.hp} max={getMaxHp()} color="#3b82f6" />
                <p style={{ color: "#fff", fontSize: 11, textAlign: "center", marginTop: 4, fontWeight: 900 }}>{player.name}</p>
              </div>
            </div>
          </div>
        )}

        {/* LOADING */}
        {screen === "loading" && (
          <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20 }}>
            <div style={{ fontSize: 60, animation: "spin 2s linear infinite" }}>⚙️</div>
            <p style={{ color: "var(--accent-primary)", fontWeight: 900, letterSpacing: 5 }}>INVOCANDO...</p>
          </div>
        )}

        {/* QUIZ SCREEN */}
        {screen === "quiz" && activeQuiz && (
          <div style={{ padding: 40, display: "flex", flexDirection: "column", gap: 20, marginTop: "10%" }}>
            <h3 style={{ color: "#fbbf24", fontWeight: 900, fontSize: 18 }}>DESAFIO DE FÉ</h3>
            <div style={S.card}>{activeQuiz.pergunta}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {activeQuiz.opcoes.map((opt, i) => (
                <button key={i} onClick={() => onQuizAnswer(i)} style={S.btn("rgba(255,255,255,0.08)")}>{opt}</button>
              ))}
            </div>
          </div>
        )}

        {/* PUZZLE SCREEN */}
        {screen === "puzzle" && puzzle && (
          <div style={{ padding: 40, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 30, marginTop: "10%" }}>
            <h3 style={{ color: "var(--accent-primary)", fontWeight: 900 }}>MISTÉRIO ANTIGO</h3>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Repita a sequência de runas:</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15, width: "100%", maxWidth: 200 }}>
              {[0,1,2,3].map(v => (
                <button key={v} onClick={() => onPuzzleClick(v)} style={{ ...S.btn("rgba(255,255,255,0.1)"), height: 80, fontSize: 30 }}>
                  {["🔥", "💧", "🌿", "⚡"][v]}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {puzzle.input.map((_, i) => <div key={i} style={{ width: 12, height: 12, background: "var(--accent-primary)", borderRadius: "50%" }} />)}
            </div>
          </div>
        )}
        {screen === "gameover" && (
          <div style={{ padding: 40, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20, marginTop: "20%" }}>
            <div style={{ fontSize: 100 }}>💀</div>
            <h2 style={{ color: "#fff", fontSize: 32, fontWeight: 900 }}>DERROTA</h2>
            <p style={{ color: "rgba(255,255,255,0.4)" }}>Sua jornada termina nas profundezas.</p>
            <button style={S.btn("#ef4444")} onClick={() => window.location.reload()}>Tentar Novamente</button>
          </div>
        )}

        {/* VICTORY */}
        {screen === "victory" && (
          <div style={{ padding: 40, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20, marginTop: "15%" }}>
            <div style={{ fontSize: 100, animation: "bounce 1s infinite" }}>🏆</div>
            <h2 style={{ color: "#fbbf24", fontSize: 32, fontWeight: 900 }}>VITÓRIA!</h2>
            <div style={S.card}>
              <p style={{ color: "#fbbf24", fontSize: 40, fontWeight: 900 }}>+100 XP</p>
              <p style={{ color: "rgba(255,255,255,0.4)" }}>O clube celebra seu triunfo.</p>
            </div>
            <button style={S.btn("#fbbf24")} onClick={() => window.location.href="/dashboard"}>Voltar ao Acampamento</button>
          </div>
        )}
      </div>

      {/* FOOTER / LOGS / ACTIONS */}
      <div style={S.footer}>
        <div style={S.logs}>
          {logs.map((l, i) => <div key={i}>{l}</div>)}
        </div>
        {screen === "combat" && (
          <div style={{ display: "flex", gap: 12 }}>
            <button style={S.btn("#ef4444")} onClick={doAttack} disabled={disabled}><Flame size={18}/> Atacar</button>
            <button style={S.btn("#fbbf24")} onClick={() => { sounds.play("click"); addLog("✨ Você usa sua fé! (Quiz em breve)"); }} disabled={disabled}><Sparkles size={18}/> Fé</button>
          </div>
        )}
      </div>

      {/* INVENTORY MODAL */}
      {showInventory && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ width: "100%", maxWidth: 400, background: "#0f172a", borderRadius: 32, border: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
             <div style={{ padding: 20, borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontWeight: 900, display: "flex", alignItems: "center", gap: 8 }}><Package size={20} color="#fbbf24"/> INVENTÁRIO</h3>
                <button onClick={() => setShowInventory(false)} style={S.btnSecondary}><X size={18}/></button>
             </div>
             
             <div style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Equipment */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                   <EquipSlot label="Arma" item={equipment.weapon} />
                   <EquipSlot label="Armadura" item={equipment.armor} />
                   <EquipSlot label="Acessório" item={equipment.accessory} />
                </div>

                <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />

                {/* Items */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
                   {inventory.length === 0 ? <p style={{ textAlign: "center", color: "rgba(255,255,255,0.2)", padding: 20 }}>Nenhum item encontrado.</p> : 
                    inventory.map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ fontSize: 24 }}>{item.emoji}</div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: 700 }}>{item.name}</p>
                          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{item.desc}</p>
                        </div>
                        <button onClick={() => equipItem(item)} style={{ ...S.btnSecondary, fontSize: 10, padding: "6px 12px" }}>EQUIPAR</button>
                      </div>
                    ))
                   }
                </div>
             </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        button:active { transform: scale(0.95); }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
}

function EquipSlot({ label, item }) {
  return (
    <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 6 }}>
      <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", fontWeight: 900 }}>{label}</p>
      <div style={{ height: 60, background: "rgba(255,255,255,0.03)", border: "2px dashed rgba(255,255,255,0.1)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
        {item ? item.emoji : ""}
      </div>
      {item && <p style={{ fontSize: 9, color: "var(--accent-primary)", fontWeight: 700 }}>{item.name}</p>}
    </div>
  );
}
