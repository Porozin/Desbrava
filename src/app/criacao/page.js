"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/AuthContext";
import { db } from "../../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Sparkles, Shield, User } from "lucide-react";

export default function CriacaoPage() {
  const { user, loading, updateUserData } = useAuth();
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [emoji, setEmoji] = useState("🛡️");
  const [unidade, setUnidade] = useState("Guardiões");
  const [isSaving, setIsSaving] = useState(false);

  const EMOJIS = ["🛡️", "⚔️", "🏹", "🧙‍♂️", "🦁", "🦅", "🐺", "⚡", "🔥"];
  const UNIDADES = ["Guardiões", "Guerreiras de Cristo"];

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (user.status === "active") router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!nome.trim()) return alert("Digite o seu nome de caçador!");
    setIsSaving(true);

    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName: nome,
        photoURL: emoji, // Usaremos o campo photoURL para salvar o emoji do personagem
        unidade: unidade,
        status: "active"
      });
      
      updateUserData({
        displayName: nome,
        photoURL: emoji,
        unidade: unidade,
        status: "active"
      });
      
      router.push("/dashboard");
    } catch (error) {
      console.error("Erro ao salvar personagem:", error);
      alert("Falha ao despertar. Tente novamente.");
      setIsSaving(false);
    }
  };

  if (loading || !user) return null;

  return (
    <div className="container animate-slide-up" style={{ justifyContent: 'center' }}>
      <div className="glass-card" style={{ padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: 'rgba(139, 92, 246, 0.1)', padding: '16px', borderRadius: '50%', marginBottom: '16px', boxShadow: '0 0 30px var(--accent-purple-glow)' }}>
          <Sparkles size={48} color="var(--accent-purple)" />
        </div>
        
        <h1 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '8px' }}>O Despertar</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '32px' }}>
          Todo grande caçador precisa de uma identidade.
        </p>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ textAlign: 'left' }}>
            <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>Avatar</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
              {EMOJIS.map(e => (
                <button 
                  key={e} 
                  type="button"
                  onClick={() => setEmoji(e)}
                  style={{ 
                    fontSize: '24px', 
                    padding: '10px', 
                    background: emoji === e ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)', 
                    border: emoji === e ? '1px solid var(--accent-primary)' : '1px solid transparent',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}><User size={14} style={{display:'inline', verticalAlign:'middle'}}/> Nome do Caçador</label>
            <input 
              type="text" 
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite seu nome heroico"
              style={{ width: '100%', padding: '14px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '1rem', fontFamily: 'inherit', outline: 'none' }}
            />
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}><Shield size={14} style={{display:'inline', verticalAlign:'middle'}}/> Unidade</label>
            <select 
              value={unidade}
              onChange={(e) => setUnidade(e.target.value)}
              style={{ width: '100%', padding: '14px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '1rem', fontFamily: 'inherit', outline: 'none', appearance: 'none' }}
            >
              {UNIDADES.map(u => <option key={u} value={u} style={{background: 'var(--bg-card)'}}>{u}</option>)}
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={isSaving} style={{ marginTop: '10px' }}>
            {isSaving ? "DESPERTANDO..." : "CONFIRMAR IDENTIDADE"}
          </button>
        </form>

      </div>
    </div>
  );
}
