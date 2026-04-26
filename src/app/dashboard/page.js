"use client";

import { useAuth } from "../../lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Map, Trophy, ShieldAlert, Zap, Users, Skull } from "lucide-react";
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

  return (
    <div className="container animate-slide-up">
      <header className="page-header" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>STATUS DO JOGADOR</h2>
          <h1 className="page-title" style={{ marginBottom: '4px' }}>{user.displayName?.split(' ')[0] || "CAÇADOR"}</h1>
          {user.role === 'admin' && (
            <span style={{ display: 'inline-block', background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', fontSize: '0.75rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
              Mestre Conselheiro
            </span>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '14px', border: '2px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', background: 'rgba(255,255,255,0.05)' }}>
            {user.photoURL && user.photoURL.length <= 4 ? user.photoURL : "🛡️"}
          </div>
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
