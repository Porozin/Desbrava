"use client";

import { useAuth } from "../../lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Map, Trophy, ShieldAlert, Zap, Users, Skull } from "lucide-react";
import toast from "react-hot-toast";
import { db } from "../../lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function DashboardPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      const q = query(collection(db, "entregas"), where("status", "==", "pendente"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setPendingCount(snapshot.docs.length);
      });
      return () => unsubscribe();
    }
  }, [user]);

  if (loading || !user) {
    return <div className="container" style={{ justifyContent: 'center', alignItems: 'center' }}><Zap className="animate-spin" color="var(--warning)" size={32} /></div>;
  }

  const currentXP = user.xp || 0;
  const currentLevel = Math.floor(currentXP / 100) + 1;
  const xpInCurrentLevel = currentXP % 100;
  const xpPercentage = (xpInCurrentLevel / 100) * 100;

  const escolherVocacao = async (vocacao) => {
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "users", user.uid), { vocacao });
      toast.success(`Você despertou como ${vocacao}!`);
      // Simular atualização local já que o context pode demorar
      user.vocacao = vocacao;
    } catch (error) {
      toast.error("Erro ao despertar vocação.");
    }
  };

  return (
    <div className="container animate-slide-up">
      <header className="page-header" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>STATUS DO JOGADOR</h2>
          <h1 className="page-title" style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {user.displayName?.split(' ')[0] || "CAÇADOR"}
            {user.vocacao && <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.1)', color: '#e2e8f0', padding: '2px 8px', borderRadius: '4px', letterSpacing: 'normal' }}>{user.vocacao}</span>}
          </h1>
          {user.role === 'admin' && (
            <span style={{ display: 'inline-block', background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', fontSize: '0.75rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.4)', marginTop: '4px' }}>
              Mestre Conselheiro
            </span>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '14px', border: '2px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', background: 'rgba(255,255,255,0.05)' }}>
            {user.photoURL && user.photoURL.length <= 4 ? user.photoURL : "🛡️"}
          </div>
          <div style={{ position: 'absolute', bottom: '-8px', right: '-8px', background: 'var(--accent-primary)', color: '#fff', fontSize: '0.8rem', fontWeight: 'bold', width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0f172a' }}>
            {currentLevel}
          </div>
        </div>
      </header>

      {/* Escolha de Vocação */}
      {currentLevel >= 3 && !user.vocacao && user.role !== 'admin' && (
        <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', border: '1px solid var(--warning)', background: 'rgba(245, 158, 11, 0.05)', animation: 'slideUp 0.5s ease' }}>
          <h3 style={{ color: 'var(--warning)', margin: '0 0 10px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={20} /> O Despertar da Vocação
          </h3>
          <p style={{ color: '#e2e8f0', fontSize: '0.9rem', marginBottom: '16px', lineHeight: '1.5' }}>
            Você atingiu o Nível 3! Está na hora de escolher seu caminho. Qual classe você seguirá no clube?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button className="btn-secondary" style={{ textAlign: 'left', display: 'flex', gap: '12px', alignItems: 'center', padding: '12px' }} onClick={() => escolherVocacao("🏹 Ranger (Explorador)")}>
              <span style={{ fontSize: '1.5rem' }}>🏹</span>
              <div>
                <strong style={{ display: 'block', color: '#fff' }}>Ranger (Explorador)</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mestre dos nós, amarras e sobrevivência.</span>
              </div>
            </button>
            <button className="btn-secondary" style={{ textAlign: 'left', display: 'flex', gap: '12px', alignItems: 'center', padding: '12px' }} onClick={() => escolherVocacao("🛡️ Paladino (Guardião)")}>
              <span style={{ fontSize: '1.5rem' }}>🛡️</span>
              <div>
                <strong style={{ display: 'block', color: '#fff' }}>Paladino (Guardião)</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Focado na parte moral, espiritual e ordem.</span>
              </div>
            </button>
            <button className="btn-secondary" style={{ textAlign: 'left', display: 'flex', gap: '12px', alignItems: 'center', padding: '12px' }} onClick={() => escolherVocacao("🧪 Alquimista (Curandeiro)")}>
              <span style={{ fontSize: '1.5rem' }}>🧪</span>
              <div>
                <strong style={{ display: 'block', color: '#fff' }}>Alquimista (Curandeiro)</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Especialista em primeiros socorros e saúde.</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Status de XP */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'flex-end' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Experiência Total</span>
            <span style={{ fontWeight: '800', fontSize: '1.5rem', color: 'var(--warning)' }}>{currentXP} <span style={{fontSize: '0.9rem', color: 'var(--text-muted)'}}>XP</span></span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nível {currentLevel + 1} em</span>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', fontWeight: 'bold' }}>{xpInCurrentLevel} / 100</span>
          </div>
        </div>
        
        <div className="xp-bar-container">
          <div className="xp-bar-fill" style={{ width: `${xpPercentage}%` }} />
        </div>
      </div>

      {/* Conquistas / Badges */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trophy size={18} color="var(--warning)" />
          Suas Conquistas
        </h3>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {/* Badge: O Despertar (Nível 2) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: currentLevel >= 2 ? 1 : 0.3, filter: currentLevel >= 2 ? 'none' : 'grayscale(100%)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '1px solid rgba(59, 130, 246, 0.5)' }}>
              🌱
            </div>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', width: '60px' }}>O Despertar</span>
          </div>

          {/* Badge: Caçador Iniciante (Nível 3) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: currentLevel >= 3 ? 1 : 0.3, filter: currentLevel >= 3 ? 'none' : 'grayscale(100%)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '1px solid rgba(245, 158, 11, 0.5)' }}>
              ⚔️
            </div>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', width: '60px' }}>Iniciante</span>
          </div>

          {/* Badge: Guerreiro Experiente (Nível 5) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: currentLevel >= 5 ? 1 : 0.3, filter: currentLevel >= 5 ? 'none' : 'grayscale(100%)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.5)' }}>
              🔥
            </div>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', width: '60px' }}>Veterano</span>
          </div>
          
          {/* Badge: O Escolhido (Tem Vocação) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: user.vocacao ? 1 : 0.3, filter: user.vocacao ? 'none' : 'grayscale(100%)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '1px solid rgba(139, 92, 246, 0.5)' }}>
              ✨
            </div>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', width: '60px' }}>Vocação</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className="btn-primary" style={{ flex: 1, padding: '14px 10px', fontSize: '0.9rem' }} onClick={() => router.push("/missoes")}>
            <Map size={18} />
            MISSÕES
          </button>
          <button className="btn-primary" style={{ flex: 1, padding: '14px 10px', fontSize: '0.9rem', background: 'linear-gradient(135deg, #7e22ce, #db2777)' }} onClick={() => router.push("/dungeon")}>
            <Skull size={18} />
            MASMORRA
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className="btn-secondary" style={{ flex: 1, padding: '14px 10px', fontSize: '0.9rem' }} onClick={() => router.push("/ranking")}>
            <Trophy size={18} color="var(--warning)" />
            RANKING
          </button>
          <button className="btn-secondary" style={{ flex: 1, padding: '14px 10px', fontSize: '0.9rem' }} onClick={() => router.push("/unidades")}>
            <Users size={18} color="#a78bfa" />
            UNIDADES
          </button>
        </div>

        {user.role === 'admin' && (
          <button className="btn-secondary" style={{ borderColor: 'rgba(245, 158, 11, 0.3)', color: 'var(--warning)', position: 'relative' }} onClick={() => router.push("/conselheiro")}>
            <ShieldAlert size={20} />
            PAINEL DO MESTRE
            {pendingCount > 0 && (
              <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--danger)', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px rgba(239, 68, 68, 0.8)' }}>
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            )}
          </button>
        )}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '30px', display: 'flex', justifyContent: 'center' }}>
        <button onClick={logout} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--danger)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}>
          <LogOut size={16} />
          Sair do Sistema
        </button>
      </div>
    </div>
  );
}
