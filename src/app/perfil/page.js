"use client";
import { useState, useEffect, Suspense } from "react";
import { useAuth } from "../../lib/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "../../lib/firebase";
import { doc, updateDoc, collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs, getDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import { ChevronLeft, Edit3, Save, X, Sword, Shield, BookOpen, Clock, Star, Package, Scroll } from "lucide-react";

const AVATAR_OPTIONS = ["🛡️","⚔️","🏹","🧙","🔥","❄️","⚡","🌊","🌿","🌟","💎","🦁","🐺","🦅","🐉","🌙"];
const TITLE_OPTIONS = ["Sem Título","Iniciante da Fé","Guardião do Templo","Servo do Senhor","Explorador Corajoso","Paladino da Luz","Ranger Experiente","Alquimista Sábio","Campeão da Guilda","Lendário Desbravador"];

const STAT_COLORS = { HP: "#ef4444", ATK: "#f59e0b", FÉ: "#8b5cf6", DEF: "#10b981" };

function Tab({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: "10px 4px", border: "none", borderRadius: 10, cursor: "pointer",
      background: active ? "rgba(99,102,241,0.2)" : "transparent",
      color: active ? "#818cf8" : "rgba(255,255,255,0.4)",
      borderBottom: active ? "2px solid #818cf8" : "2px solid transparent",
      fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 4, transition: "all 0.2s"
    }}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function StatBar({ label, value, max = 100, color }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{value}</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.min(100, (value/max)*100)}%`, background: color, borderRadius: 4, boxShadow: `0 0 8px ${color}60`, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

// --- TABS ---

function GuerreiroTab({ user, onSave, isOwnProfile }) {
  const [editing, setEditing] = useState(false);
  const [avatar, setAvatar] = useState(user.photoURL || "🛡️");
  const [titulo, setTitulo] = useState(user.titulo || "Sem Título");
  const [bio, setBio] = useState(user.bio || "");

  // Sincroniza estado local com dados do banco quando não estiver editando
  useEffect(() => {
    if (!editing) {
      setAvatar(user.photoURL || "🛡️");
      setTitulo(user.titulo || "Sem Título");
      setBio(user.bio || "");
    }
  }, [user, editing]);

  const xp = user.xp || 0;
  const level = Math.floor(xp / 100) + 1;
  const xpInLevel = xp % 100;
  const stats = { HP: Math.min(100, 40 + level * 6), ATK: Math.min(100, 10 + level * 5), FÉ: Math.min(100, 20 + (user.fe || 0) * 3), DEF: Math.min(100, 15 + level * 4) };

  const handleSave = async () => {
    await onSave({ photoURL: avatar, titulo, bio });
    setEditing(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Hero Card */}
      <div className="glass-card" style={{ padding: 24, textAlign: "center", position: "relative" }}>
        {isOwnProfile && (
          <button onClick={() => setEditing(!editing)} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", width: 36, height: 36, borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {editing ? <X size={16}/> : <Edit3 size={16}/>}
          </button>
        )}

        {/* Avatar */}
        <div style={{ fontSize: 72, lineHeight: 1, marginBottom: 8, filter: "drop-shadow(0 0 20px rgba(99,102,241,0.4))" }}>
          {avatar}
        </div>

        {editing ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", margin: "8px 0 12px" }}>
            {AVATAR_OPTIONS.map(e => (
              <button key={e} onClick={() => setAvatar(e)} style={{ fontSize: 24, background: avatar===e ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.05)", border: avatar===e ? "2px solid #818cf8" : "2px solid transparent", borderRadius: 8, width: 44, height: 44, cursor: "pointer" }}>{e}</button>
            ))}
          </div>
        ) : null}

        <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 900, margin: "0 0 4px" }}>{user.displayName?.split(" ")[0] || "Caçador"}</h2>

        {editing ? (
          <select value={titulo} onChange={e => setTitulo(e.target.value)} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: 8, padding: "6px 10px", fontSize: 13, marginBottom: 8, width: "100%" }}>
            {TITLE_OPTIONS.map(t => <option key={t} value={t} style={{ background: "#1e293b" }}>{t}</option>)}
          </select>
        ) : (
          <p style={{ color: "#818cf8", fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{titulo}</p>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 8 }}>
          {user.vocacao && <span style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa", fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>{user.vocacao}</span>}
          <span style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", color: "#60a5fa", fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>Nível {level}</span>
          <span style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: "#fbbf24", fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>{xp} XP</span>
        </div>

        {editing ? (
          <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Escreva uma bio do seu guerreiro..." maxLength={120} rows={3} style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: 10, padding: "10px 12px", fontSize: 13, resize: "none", fontFamily: "inherit" }} />
        ) : bio ? (
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.5, fontStyle: "italic" }}>"{bio}"</p>
        ) : null}

        {editing && (
          <button onClick={handleSave} className="btn-primary" style={{ marginTop: 12, width: "100%", padding: "12px" }}>
            <Save size={16}/> Salvar Personagem
          </button>
        )}
      </div>

      {/* Atributos */}
      <div className="glass-card" style={{ padding: 20 }}>
        <h3 style={{ color: "#fff", fontSize: 14, fontWeight: 800, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}><Sword size={16} color="#f59e0b"/> Atributos</h3>
        <StatBar label="HP (Vida)" value={stats.HP} color={STAT_COLORS.HP}/>
        <StatBar label="ATK (Ataque)" value={stats.ATK} color={STAT_COLORS.ATK}/>
        <StatBar label="FÉ" value={stats.FÉ} color={STAT_COLORS.FÉ}/>
        <StatBar label="DEF (Defesa)" value={stats.DEF} color={STAT_COLORS.DEF}/>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 8 }}>Atributos crescem conforme seu nível aumenta.</p>
      </div>

      {/* XP Bar */}
      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Progresso Nível {level} → {level+1}</span>
          <span style={{ color: "#fbbf24", fontSize: 12, fontWeight: 700 }}>{xpInLevel}/100 XP</span>
        </div>
        <div style={{ height: 10, background: "rgba(255,255,255,0.08)", borderRadius: 5, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${xpInLevel}%`, background: "linear-gradient(90deg,#f59e0b,#fbbf24)", borderRadius: 5, boxShadow: "0 0 10px rgba(245,158,11,0.5)", transition: "width 0.8s ease" }}/>
        </div>
      </div>
    </div>
  );
}

function InventarioTab({ userId, userCoins }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "compras"), where("uid", "==", userId));
    getDocs(q).then(snap => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, [userId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="glass-card" style={{ padding: 16 }}>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ textAlign: "center", flex: 1 }}>
            <p style={{ color: "#fbbf24", fontSize: 22, fontWeight: 900 }}>{userCoins || 0}</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>DesbravaCoins</p>
          </div>
          <div style={{ textAlign: "center", flex: 1 }}>
            <p style={{ color: "#60a5fa", fontSize: 22, fontWeight: 900 }}>{items.length}</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Itens obtidos</p>
          </div>
        </div>
      </div>

      {loading ? <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: 20 }}>Carregando inventário...</p>
      : items.length === 0 ? (
        <div style={{ textAlign: "center", marginTop: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 40 }}>🎒</span>
          <p style={{ color: "rgba(255,255,255,0.4)" }}>Inventário vazio</p>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }}>Adquira itens na Loja com suas DesbravaCoins.</p>
        </div>
      ) : items.map(item => (
        <div key={item.id} className="glass-card" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🎁</div>
          <div style={{ flex: 1 }}>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{item.itemNome || item.nome || "Item"}</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{item.criadoEm?.toDate?.()?.toLocaleDateString("pt-BR") || "—"}</p>
          </div>
          <span style={{ color: "#fbbf24", fontSize: 12, fontWeight: 700 }}>-{item.preco || item.custo || "?"} 🪙</span>
        </div>
      ))}
    </div>
  );
}

function HistoricoTab({ userId }) {
  const [entregas, setEntregas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "entregas"), where("uid", "==", userId));
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a,b) => (b.criadoEm?.toMillis?.() || 0) - (a.criadoEm?.toMillis?.() || 0));
      setEntregas(data);
      setLoading(false);
    });
    return () => unsub();
  }, [userId]);

  const statusStyle = { pendente: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" }, aprovada: { color: "#10b981", bg: "rgba(16,185,129,0.1)" }, rejeitada: { color: "#ef4444", bg: "rgba(239,68,68,0.1)" } };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="glass-card" style={{ padding: 16 }}>
        <div style={{ display: "flex", gap: 0, textAlign: "center" }}>
          {[{ label: "Total", val: entregas.length, color: "#fff" }, { label: "Aprovadas", val: entregas.filter(e=>e.status==="aprovada").length, color: "#10b981" }, { label: "Pendentes", val: entregas.filter(e=>e.status==="pendente").length, color: "#f59e0b" }].map(s => (
            <div key={s.label} style={{ flex: 1 }}>
              <p style={{ color: s.color, fontSize: 22, fontWeight: 900 }}>{s.val}</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {loading ? <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: 20 }}>Carregando histórico...</p>
      : entregas.length === 0 ? (
        <div style={{ textAlign: "center", marginTop: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 40 }}>📜</span>
          <p style={{ color: "rgba(255,255,255,0.4)" }}>Nenhuma missão entregue ainda</p>
        </div>
      ) : entregas.map(e => {
        const st = statusStyle[e.status] || statusStyle.pendente;
        return (
          <div key={e.id} className="glass-card" style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <p style={{ color: "#fff", fontWeight: 700, fontSize: 14, flex: 1, paddingRight: 8 }}>{e.missaoTitulo || "Missão"}</p>
              <span style={{ background: st.bg, color: st.color, fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 6, textTransform: "uppercase", whiteSpace: "nowrap" }}>{e.status}</span>
            </div>
            {e.prova && <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, lineHeight: 1.4, marginBottom: 6 }} className="line-clamp-2">"{e.prova}"</p>}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{e.criadoEm?.toDate?.()?.toLocaleDateString("pt-BR") || "—"}</span>
              {e.status === "aprovada" && <span style={{ color: "#fbbf24", fontSize: 11, fontWeight: 700 }}>+{e.xpGanho || 0} XP</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DiarioTab({ userId, userName, isOwnProfile }) {
  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "diario"), where("uid", "==", userId));
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a,b) => (b.criadoEm?.toMillis?.() || 0) - (a.criadoEm?.toMillis?.() || 0));
      setEntries(data);
      setLoading(false);
    });
    return () => unsub();
  }, [userId]);

  const addEntry = async () => {
    if (!newEntry.trim()) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "diario"), {
        uid: userId, texto: newEntry.trim(),
        criadoEm: serverTimestamp(), autor: userName
      });
      setNewEntry("");
      toast.success("Entrada adicionada ao diário!");
    } catch { toast.error("Erro ao salvar."); }
    setSaving(false);
  };

  const moodEmojis = ["⚔️","🙏","😤","😌","🔥","💪","😴","🌟"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Nova entrada */}
      {isOwnProfile && (
        <div className="glass-card" style={{ padding: 16 }}>
          <h3 style={{ color: "#fff", fontSize: 13, fontWeight: 800, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}><BookOpen size={14} color="#8b5cf6"/> Nova Entrada</h3>
          <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
            {moodEmojis.map(e => (
              <button key={e} onClick={() => setNewEntry(prev => prev + e)} style={{ fontSize: 18, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, width: 36, height: 36, cursor: "pointer" }}>{e}</button>
            ))}
          </div>
          <textarea
            value={newEntry} onChange={e => setNewEntry(e.target.value)}
            placeholder="O que aconteceu hoje na sua jornada? Registre suas batalhas, aprendizados e reflexões..."
            rows={4} maxLength={500}
            style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: 10, padding: "10px 12px", fontSize: 14, resize: "none", fontFamily: "inherit", lineHeight: 1.5 }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{newEntry.length}/500</span>
            <button onClick={addEntry} disabled={saving || !newEntry.trim()} className="btn-primary" style={{ padding: "10px 20px", fontSize: 13 }}>
              <Scroll size={14}/> {saving ? "Salvando..." : "Registrar"}
            </button>
          </div>
        </div>
      )}

      {/* Entradas */}
      {loading ? <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center" }}>Carregando diário...</p>
      : entries.length === 0 ? (
        <div style={{ textAlign: "center", marginTop: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 40 }}>📖</span>
          <p style={{ color: "rgba(255,255,255,0.4)" }}>Seu diário está em branco</p>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }}>Registre sua primeira aventura acima.</p>
        </div>
      ) : entries.map(e => (
        <div key={e.id} className="glass-card" style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={12} color="rgba(255,255,255,0.3)"/>
              <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>
                {e.criadoEm?.toDate?.()?.toLocaleString("pt-BR", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" }) || "—"}
              </span>
            </div>
          </div>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, lineHeight: 1.6 }}>{e.texto}</p>
        </div>
      ))}
    </div>
  );
}

function PerfilContent() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [viewUser, setViewUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("guerreiro");

  const queryUid = searchParams.get("uid");
  const isOwnProfile = !queryUid || queryUid === currentUser?.uid;

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) { router.push("/login"); return; }

    if (isOwnProfile) {
      setViewUser(currentUser);
      setLoading(false);
    } else {
      setLoading(true);
      getDoc(doc(db, "users", queryUid)).then(snap => {
        if (snap.exists()) {
          setViewUser({ uid: snap.id, ...snap.data() });
        } else {
          toast.error("Usuário não encontrado.");
          router.push("/dashboard");
        }
        setLoading(false);
      });
    }
  }, [queryUid, currentUser, authLoading, isOwnProfile, router]);

  // Se for o próprio perfil, usa o currentUser do context (que agora é reativo)
  const userData = isOwnProfile ? currentUser : viewUser;

  if (loading || authLoading || !userData) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#05050f" }}><div style={{ color: "#3b82f6", fontSize: 32 }}>⚔️</div></div>;

  const handleSave = async (data) => {
    try {
      await updateDoc(doc(db, "users", currentUser.uid), data);
      toast.success("Personagem atualizado!");
    } catch (e) { 
      console.error(e);
      toast.error("Erro ao salvar."); 
    }
  };

  const TABS = [
    { key: "guerreiro",  label: "Guerreiro", icon: <Sword size={16}/> },
    { key: "inventario", label: "Inventário", icon: <Package size={16}/> },
    { key: "historico",  label: "Histórico",  icon: <Star size={16}/> },
    { key: "diario",     label: "Diário",     icon: <BookOpen size={16}/> },
  ];

  return (
    <div className="container animate-slide-up">
      <header className="page-header">
        <button className="back-button" onClick={() => router.push("/dashboard")}><ChevronLeft size={20}/></button>
        <div>
          <h1 className="page-title" style={{ fontSize: "1.5rem" }}>{isOwnProfile ? "Meu Perfil" : "Perfil do Guerreiro"}</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>@{userData.displayName || userData.email?.split("@")[0]}</p>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", padding: 4, borderRadius: 14, marginBottom: 20, border: "1px solid rgba(255,255,255,0.06)" }}>
        {TABS.map(t => <Tab key={t.key} active={tab===t.key} onClick={() => setTab(t.key)} icon={t.icon} label={t.label}/>)}
      </div>

      {tab === "guerreiro"  && <GuerreiroTab user={userData} onSave={handleSave} isOwnProfile={isOwnProfile}/>}
      {tab === "inventario" && <InventarioTab userId={userData.uid} userCoins={userData.coins}/>}
      {tab === "historico"  && <HistoricoTab userId={userData.uid}/>}
      {tab === "diario"     && <DiarioTab userId={userData.uid} userName={userData.displayName} isOwnProfile={isOwnProfile}/>}
    </div>
  );
}

// --- MAIN EXPORT ---
export default function PerfilPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <PerfilContent />
    </Suspense>
  );
}
