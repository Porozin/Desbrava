"use client";

import { useAuth } from "../../lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogOut, Map, Trophy, ShieldAlert, Zap, Users } from "lucide-react";

export default function DashboardPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="container" style={{ justifyContent: 'center', alignItems: 'center' }}><Zap className="animate-spin" color="var(--warning)" size={32} /></div>;
  }

  const currentXP = user.xp || 0;
  const currentLevel = Math.floor(currentXP / 100) + 1;
  const xpInCurrentLevel = currentXP % 100;
  const xpPercentage = (xpInCurrentLevel / 100) * 100;

  return (
    <div className="container animate-slide-up">
      <header className="page-header" style={{ justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>STATUS DO JOGADOR</h2>
          <h1 className="page-title">{user.displayName?.split(' ')[0] || "CAÇADOR"}</h1>
        </div>
        <div style={{ position: 'relative' }}>
          <img 
            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=0D8ABC&color=fff`} 
            alt="Avatar" 
            style={{ width: '56px', height: '56px', borderRadius: '14px', border: '2px solid rgba(255,255,255,0.1)', objectFit: 'cover' }} 
          />
          <div style={{ position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)', background: 'var(--warning)', color: '#000', fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '8px', border: '2px solid var(--bg-deep)' }}>
            LVL {currentLevel}
          </div>
        </div>
      </header>

      <div className="glass-card" style={{ padding: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'flex-end' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Experiência</span>
            <span style={{ fontWeight: '800', fontSize: '1.5rem', color: 'var(--warning)' }}>{currentXP} <span style={{fontSize: '0.9rem', color: 'var(--text-muted)'}}>XP Total</span></span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontWeight: '600' }}>{xpInCurrentLevel} / 100</span>
        </div>
        
        <div className="xp-bar-container">
          <div className="xp-bar-fill" style={{ width: `${xpPercentage}%` }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
        <button className="btn-primary" onClick={() => router.push("/missoes")}>
          <Map size={20} />
          QUADRO DE MISSÕES
        </button>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className="btn-secondary" style={{ flex: 1 }} onClick={() => router.push("/ranking")}>
            <Trophy size={20} color="var(--warning)" />
            RANKING
          </button>
          <button className="btn-secondary" style={{ flex: 1 }} onClick={() => router.push("/unidades")}>
            <Users size={20} color="#a78bfa" />
            UNIDADES
          </button>
        </div>

        {user.role === 'admin' && (
          <button className="btn-secondary" style={{ borderColor: 'rgba(245, 158, 11, 0.3)', color: 'var(--warning)' }} onClick={() => router.push("/conselheiro")}>
            <ShieldAlert size={20} />
            PAINEL DO MESTRE
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
