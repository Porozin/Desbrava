"use client";
import { useState, useEffect, useCallback } from "react";
import { QUESTOES_FE } from "./questions";

const ROOMS = [
  { title: "Bosque do Silêncio", icon: "🌲", desc: "Árvores sussurram segredos nas sombras. Escolha seu caminho.", bg: "radial-gradient(ellipse at top, #052e16 0%, #020617 60%)" },
  { title: "Caverna do Eco",     icon: "🕳️", desc: "A escuridão amplifica cada som. Algo espreia na penumbra.", bg: "radial-gradient(ellipse at top, #1c1917 0%, #020617 60%)" },
  { title: "Rio das Sombras",   icon: "🌊", desc: "Águas negras correm silenciosas. Algo se move sob elas.", bg: "radial-gradient(ellipse at top, #0c1445 0%, #020617 60%)" },
  { title: "Altar Proibido",    icon: "🏛️", desc: "Ruínas pulsam com energia esquecida. O perigo é real.", bg: "radial-gradient(ellipse at top, #2e1065 0%, #020617 60%)" },
  { title: "Portal Final",      icon: "🌀", desc: "O ar distorce. O Guardião aguarda do outro lado.", bg: "radial-gradient(ellipse at top, #450a0a 0%, #020617 60%)" },
];

const MONSTERS = [
  { name: "Sombra Rasteira",  emoji: "👺", hp: 55, atk: 10, xp: 20 },
  { name: "Lobo das Trevas",  emoji: "🐺", hp: 65, atk: 13, xp: 25 },
  { name: "Aranha Abissal",   emoji: "🕷️", hp: 50, atk: 12, xp: 22 },
  { name: "Espírito Errante", emoji: "👻", hp: 60, atk: 11, xp: 23 },
  { name: "Servo da Morte",   emoji: "💀", hp: 70, atk: 15, xp: 28 },
];
const BOSS = { name: "Guardião das Sombras", emoji: "🐲", hp: 200, atk: 22, xp: 100 };

const EVENTS = [
  { icon: "🧙", title: "O Sábio Errante", desc: "Um ancião oferece ervas medicinais. Aceitar?", a: "Aceitar (+30 HP)", b: "Recusar", ea: p => ({ ...p, hp: Math.min(p.maxHp, p.hp+30) }), la: "+30 HP restaurado!", lb: "Você segue adiante." },
  { icon: "⚗️", title: "Elixir Misterioso", desc: "Uma poção brilha sobre uma pedra. Beber?", a: "Beber (+20 HP, +2 ATK)", b: "Ignorar", ea: p => ({ ...p, hp: Math.min(p.maxHp, p.hp+20), atk: p.atk+2 }), la: "+20 HP e +2 ATK!", lb: "Sabedoria guia seus passos." },
  { icon: "📜", title: "Inscrição Sagrada", desc: "Versículos gravados em pedra. Parar para ler?", a: "Ler (+5 FÉ)", b: "Seguir", ea: p => ({ ...p, fe: p.fe+5 }), la: "+5 FÉ! A Palavra fortalece.", lb: "Sem tempo a perder." },
];

const S = {
  screen: { width:"100%", height:"100%", display:"flex", flexDirection:"column", position:"relative", overflow:"hidden", transition:"background 0.7s ease" },
  topBar: { padding:"14px 20px 10px", borderBottom:"1px solid rgba(255,255,255,0.08)", background:"rgba(0,0,0,0.35)", backdropFilter:"blur(12px)" },
  center: { flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"20px", textAlign:"center", gap:12 },
  footer: { padding:"16px 20px", borderTop:"1px solid rgba(255,255,255,0.08)", background:"rgba(0,0,0,0.45)", backdropFilter:"blur(12px)", display:"flex", flexDirection:"column", gap:10 },
  row: { display:"flex", gap:10 },
  btn: (v="ghost") => ({
    flex:1, padding:"14px 10px", borderRadius:14, fontFamily:"'Outfit',sans-serif",
    fontWeight:700, fontSize:14, textTransform:"uppercase", letterSpacing:"0.06em",
    cursor:"pointer", border:"none", transition:"all 0.15s ease", color:"#fff",
    background: v==="primary" ? "linear-gradient(135deg,#3b82f6,#2563eb)"
               : v==="danger"  ? "linear-gradient(135deg,#ef4444,#dc2626)"
               : v==="warning" ? "linear-gradient(135deg,#f59e0b,#d97706)"
               : v==="success" ? "linear-gradient(135deg,#10b981,#059669)"
               : "rgba(255,255,255,0.08)",
    border: v==="ghost" ? "1px solid rgba(255,255,255,0.12)" : "none",
    boxShadow: v!=="ghost" ? "0 4px 16px rgba(0,0,0,0.3)" : "none",
  }),
  btnFull: (v="ghost") => ({ ...S.btn(v), flex:"unset", width:"100%" }),
  hpBarWrap: { width:140, height:6, background:"rgba(255,255,255,0.1)", borderRadius:6, overflow:"hidden" },
  label: { color:"rgba(255,255,255,0.4)", fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.25em" },
  logBox: { margin:"0 16px", padding:"12px 16px", borderRadius:14, background:"rgba(0,0,0,0.4)", border:"1px solid rgba(255,255,255,0.06)", minHeight:44, textAlign:"center" },
};

function HPBar({ hp, maxHp, color="#3b82f6" }) {
  const pct = Math.max(0, Math.min(100, (hp/maxHp)*100));
  const c = pct>60 ? color : pct>30 ? "#f59e0b" : "#ef4444";
  return <div style={S.hpBarWrap}><div style={{ height:"100%", width:`${pct}%`, background:c, borderRadius:6, boxShadow:`0 0 8px ${c}80`, transition:"width 0.4s ease" }} /></div>;
}

function EntityBlock({ emoji, name, hp, maxHp, hit, hpColor }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, transition:"all 0.15s ease", transform: hit?"scale(0.8) rotate(8deg)":"scale(1) rotate(0deg)" }}>
      <div style={{ fontSize:72, lineHeight:1, filter:`drop-shadow(0 0 18px ${hpColor}50)`, userSelect:"none" }}>{emoji}</div>
      <p style={S.label}>{name}</p>
      <HPBar hp={hp} maxHp={maxHp} color={hpColor} />
      <p style={{ color:"rgba(255,255,255,0.3)", fontSize:11 }}>{Math.max(0,hp)} / {maxHp}</p>
    </div>
  );
}

function QuizScreen({ q, onAnswer }) {
  return (
    <div style={{ ...S.screen, background:"radial-gradient(ellipse at top, #451a03 0%, #020617 60%)", padding:20, gap:16 }}>
      <p style={{ color:"#fbbf24", fontSize:10, fontWeight:900, textTransform:"uppercase", letterSpacing:"0.35em", marginTop:20 }}>✝ Prova de Fé</p>
      <div style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, padding:"16px 20px" }}>
        <p style={{ color:"#fff", fontWeight:600, lineHeight:1.6, fontSize:16 }}>{q.pergunta}</p>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10, width:"100%" }}>
        {q.opcoes.map((opt, i) => (
          <button key={i} onClick={() => onAnswer(i)} style={{ ...S.btnFull("ghost"), textAlign:"left", padding:"14px 18px", fontWeight:600, fontSize:14, textTransform:"none", letterSpacing:"normal" }}>
            <span style={{ color:"rgba(255,255,255,0.35)", fontWeight:900, marginRight:12 }}>{String.fromCharCode(65+i)}.</span>{opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function DungeonGame({ user, onFinish }) {
  const [screen, setScreen] = useState("loading");
  const [progress, setProgress] = useState(0);
  const [player, setPlayer] = useState({ name: user.displayName?.split(" ")[0]||"Caçador", emoji: user.photoURL?.length<=4 ? user.photoURL : "🛡️", hp:100, maxHp:100, atk:15, fe:10 });
  const [enemy, setEnemy] = useState(null);
  const [log, setLog] = useState("O combate começou!");
  const [logColor, setLogColor] = useState("#fff");
  const [pHit, setPHit] = useState(false);
  const [eHit, setEHit] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [activeEvent, setActiveEvent] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const MAX = ROOMS.length;

  useEffect(() => { if (screen==="loading") { const t=setTimeout(()=>setScreen("explore"),1400); return ()=>clearTimeout(t); } }, [screen]);

  const hit = (who) => {
    if(who==="e"){setEHit(true);setTimeout(()=>setEHit(false),180);}
    else{setPHit(true);setTimeout(()=>setPHit(false),180);}
  };

  const addLog = (msg, color="#fff") => { setLog(msg); setLogColor(color); };

  const startCombat = useCallback(() => {
    const isBoss = progress >= MAX-1;
    setEnemy(isBoss ? {...BOSS} : {...MONSTERS[Math.floor(Math.random()*MONSTERS.length)]});
    setDisabled(false);
    setScreen("combat");
    addLog("O inimigo surge das trevas!", "#ef4444");
  }, [progress, MAX]);

  const startEvent = () => { setActiveEvent(EVENTS[Math.floor(Math.random()*EVENTS.length)]); setScreen("event"); };

  const doAttack = () => {
    if(disabled) return;
    setDisabled(true);
    hit("e");
    setEnemy(prev => {
      const newHp = prev.hp - player.atk;
      addLog(`Você atacou! -${player.atk} HP`, "#60a5fa");
      setTimeout(() => {
        if(newHp<=0){ handleWin(prev.xp||30); return; }
        setTimeout(()=>{
          const dmg = Math.floor((enemy?.atk||10)*(0.85+Math.random()*0.3));
          hit("p");
          setPlayer(pp=>{
            const nhp=pp.hp-dmg;
            addLog(`Inimigo revidou! -${dmg} HP`,"#f87171");
            if(nhp<=0)setTimeout(()=>setScreen("gameover"),700);
            return {...pp,hp:Math.max(0,nhp)};
          });
          setDisabled(false);
        },600);
      },300);
      return {...prev, hp:Math.max(0,newHp)};
    });
  };

  const doFaith = () => {
    if(disabled) return;
    setDisabled(true);
    setActiveQuiz(QUESTOES_FE[Math.floor(Math.random()*QUESTOES_FE.length)]);
    setScreen("quiz");
  };

  const onQuizAnswer = (idx) => {
    const q = activeQuiz; setActiveQuiz(null); setScreen("combat");
    if(idx===q.correta){
      hit("e");
      setEnemy(prev=>{
        const nhp=prev.hp-q.dano;
        addLog(`✝ LUZ DIVINA! -${q.dano} crítico!`,"#fbbf24");
        if(nhp<=0)setTimeout(()=>handleWin(prev.xp||30),500);
        return {...prev,hp:Math.max(0,nhp)};
      });
    } else {
      hit("p");
      setPlayer(pp=>({...pp,hp:Math.max(0,pp.hp-15)}));
      addLog("Você hesitou... -15 HP","#f87171");
    }
    setTimeout(()=>setDisabled(false),800);
  };

  const handleWin = (xp) => {
    const isBoss = progress >= MAX-1;
    addLog(isBoss?"Guardião derrotado! 👑":"Inimigo dissipado!","#4ade80");
    setTimeout(()=>{
      if(isBoss){ setScreen("victory"); if(onFinish)onFinish(100); }
      else { setProgress(p=>p+1); setScreen("explore"); }
    },1000);
  };

  const onEventChoice = (which) => {
    const ev = activeEvent; setActiveEvent(null);
    if(which===1){ setPlayer(p=>ev.ea(p)); addLog(ev.la,"#4ade80"); }
    else { addLog(ev.lb,"rgba(255,255,255,0.5)"); }
    setProgress(p=>p+1); setScreen("explore");
  };

  const room = ROOMS[Math.min(progress,ROOMS.length-1)];
  const bg = { loading:"radial-gradient(ellipse at top,#0f172a,#020617)", explore:room.bg, combat:"radial-gradient(ellipse at top,#1e1b4b,#020617)", quiz:"radial-gradient(ellipse at top,#451a03,#020617)", event:"radial-gradient(ellipse at top,#052e16,#020617)", victory:"radial-gradient(ellipse at top,#78350f,#020617)", gameover:"radial-gradient(ellipse at top,#450a0a,#020617)" }[screen]||"#020617";

  if(screen==="quiz"&&activeQuiz) return <QuizScreen q={activeQuiz} onAnswer={onQuizAnswer}/>;

  return (
    <div style={{...S.screen, background:bg}}>
      {/* Floating particles */}
      {[0,1,2,3,4].map(i=>(
        <div key={i} style={{ position:"absolute", width:3, height:3, borderRadius:"50%", background:"rgba(255,255,255,0.06)", left:`${10+i*20}%`, top:`${5+i*15}%`, animation:`floatParticle ${3+i*0.5}s ease-in-out infinite`, animationDelay:`${i*0.4}s`, pointerEvents:"none" }}/>
      ))}

      {/* LOADING */}
      {screen==="loading" && (
        <div style={S.center}>
          <div style={{ fontSize:80, animation:"pulse 2s ease-in-out infinite" }}>🗡️</div>
          <div><p style={{ color:"#3b82f6", fontSize:11, fontWeight:900, letterSpacing:"0.4em", textTransform:"uppercase" }}>Invocando</p>
          <p style={{ color:"#fff", fontSize:24, fontWeight:900, marginTop:4 }}>A Masmorra</p></div>
          <div style={{ display:"flex", gap:6, marginTop:8 }}>
            {[0,1,2].map(i=><div key={i} style={{ width:8,height:8,background:"#3b82f6",borderRadius:"50%",animation:`bounce 1s ease-in-out ${i*0.2}s infinite` }}/>)}
          </div>
        </div>
      )}

      {/* EXPLORE */}
      {screen==="explore" && (
        <>
          <div style={S.topBar}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={S.label}>Progresso</span>
              <span style={{ ...S.label, color:"rgba(255,255,255,0.6)" }}>{progress}/{MAX}</span>
            </div>
            <div style={{ width:"100%", height:4, background:"rgba(255,255,255,0.08)", borderRadius:4, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${(progress/MAX)*100}%`, background:"linear-gradient(90deg,#3b82f6,#8b5cf6)", borderRadius:4, transition:"width 0.7s ease", boxShadow:"0 0 8px #3b82f650" }}/>
            </div>
          </div>
          <div style={S.center}>
            <div style={{ fontSize:80, lineHeight:1, animation:"float 3s ease-in-out infinite", filter:"drop-shadow(0 0 20px rgba(255,255,255,0.15))" }}>{room.icon}</div>
            <h2 style={{ color:"#fff", fontSize:22, fontWeight:900, margin:"4px 0 0" }}>{room.title}</h2>
            <p style={{ color:"rgba(255,255,255,0.45)", fontSize:14, lineHeight:1.6, maxWidth:280 }}>{room.desc}</p>
          </div>
          <div style={S.footer}>
            <button style={S.btnFull("primary")} onClick={startCombat}>⚔️ &nbsp; Enfrentar Perigos</button>
            <button style={S.btnFull("ghost")} onClick={startEvent}>✨ &nbsp; Buscar Relíquias</button>
          </div>
        </>
      )}

      {/* COMBAT */}
      {screen==="combat" && enemy && (
        <>
          <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, padding:"20px 20px 12px" }}>
            <EntityBlock emoji={enemy.emoji} name={enemy.name} hp={enemy.hp} maxHp={enemy.maxHp} hit={eHit} hpColor="#ef4444"/>
          </div>
          <div style={S.logBox}><p style={{ color:logColor, fontSize:14, fontWeight:600 }}>{log}</p></div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"12px 0" }}>
            <EntityBlock emoji={player.emoji} name={player.name} hp={player.hp} maxHp={player.maxHp} hit={pHit} hpColor="#3b82f6"/>
          </div>
          <div style={S.footer}>
            <div style={S.row}>
              <button style={S.btn("primary")} onClick={doAttack} disabled={disabled}>⚔️ Atacar</button>
              <button style={S.btn("warning")} onClick={doFaith} disabled={disabled}>✨ Usar Fé</button>
            </div>
          </div>
        </>
      )}

      {/* EVENT */}
      {screen==="event" && activeEvent && (
        <>
          <div style={S.center}>
            <div style={{ fontSize:72, animation:"float 3s ease-in-out infinite" }}>{activeEvent.icon}</div>
            <h2 style={{ color:"#fbbf24", fontSize:20, fontWeight:900 }}>{activeEvent.title}</h2>
            <p style={{ color:"rgba(255,255,255,0.5)", fontSize:14, lineHeight:1.6, maxWidth:280 }}>{activeEvent.desc}</p>
          </div>
          <div style={S.footer}>
            <button style={S.btnFull("success")} onClick={()=>onEventChoice(1)}>✅ &nbsp;{activeEvent.a}</button>
            <button style={S.btnFull("ghost")} onClick={()=>onEventChoice(2)}>{activeEvent.b}</button>
          </div>
        </>
      )}

      {/* VICTORY */}
      {screen==="victory" && (
        <div style={S.center}>
          <div style={{ fontSize:90, animation:"bounce 1.2s ease-in-out infinite", filter:"drop-shadow(0 0 30px rgba(251,191,36,0.5))" }}>👑</div>
          <div><p style={{ color:"#fbbf24", fontSize:10, fontWeight:900, letterSpacing:"0.35em", textTransform:"uppercase" }}>Vitória Lendária</p>
          <h1 style={{ color:"#fff", fontSize:26, fontWeight:900, marginTop:4 }}>Masmorra Concluída!</h1></div>
          <div style={{ background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.3)", borderRadius:16, padding:"16px 40px", marginTop:4 }}>
            <p style={{ color:"#fbbf24", fontSize:36, fontWeight:900 }}>+100 XP</p>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:12, marginTop:4 }}>Recompensa adquirida</p>
          </div>
          <button style={{ ...S.btn("primary"), flex:"unset", padding:"14px 40px", marginTop:8 }} onClick={()=>window.location.href="/dashboard"}>Voltar ao Acampamento 🏕️</button>
        </div>
      )}

      {/* GAME OVER */}
      {screen==="gameover" && (
        <div style={S.center}>
          <div style={{ fontSize:90, filter:"grayscale(1) opacity(0.8)" }}>💀</div>
          <div><p style={{ color:"#ef4444", fontSize:10, fontWeight:900, letterSpacing:"0.35em", textTransform:"uppercase" }}>Derrota</p>
          <h1 style={{ color:"#fff", fontSize:22, fontWeight:900, marginTop:4 }}>Sua Jornada Termina Aqui</h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:14, marginTop:6 }}>Os fortes aprendem com a queda.</p></div>
          <button style={{ ...S.btn("danger"), flex:"unset", padding:"14px 40px", marginTop:8 }} onClick={()=>window.location.reload()}>🔄 Tentar Novamente</button>
        </div>
      )}

      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes floatParticle { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-20px) scale(1.5)} }
        button:active { transform: scale(0.96) !important; }
        button:disabled { opacity: 0.4 !important; cursor: not-allowed !important; }
      `}</style>
    </div>
  );
}
