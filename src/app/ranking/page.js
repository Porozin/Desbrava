"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/AuthContext";
import { db } from "../../lib/firebase";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { ChevronLeft, Trophy, Medal, Star, Flame } from "lucide-react";

export default function RankingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [hunters, setHunters] = useState([]);
  const [loadingHunters, setLoadingHunters] = useState(true);
  
  // Unidades Score
  const [scoreGuardioes, setScoreGuardioes] = useState(0);
  const [scoreGuerreiras, setScoreGuerreiras] = useState(0);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    else if (user) fetchRanking();
  }, [user, loading, router]);

  const fetchRanking = async () => {
    try {
      // Puxar todos que não são admin
      const q = query(collection(db, "users"), where("role", "==", "desbravador"));
      const snapshot = await getDocs(q);
      
      let fetchedHunters = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Ordenar por XP desc (fazemos no client pois orderBy + where pode precisar de índice composto)
      fetchedHunters.sort((a, b) => (b.xp || 0) - (a.xp || 0));
      setHunters(fetchedHunters);

      // Calcular Score das Unidades
      let guardioesXP = 0;
      let guerreirasXP = 0;
      fetchedHunters.forEach(h => {
        if (h.unidade === 'Guardiões') guardioesXP += (h.xp || 0);
        else if (h.unidade === 'Guerreiras de Cristo') guerreirasXP += (h.xp || 0);
      });
      setScoreGuardioes(guardioesXP);
      setScoreGuerreiras(guerreirasXP);

    } catch (error) {
      console.error("Erro ao buscar ranking", error);
    }
    setLoadingHunters(false);
  };

  if (loading || !user) return null;

  const totalGuerra = scoreGuardioes + scoreGuerreiras;
  const percGuardioes = totalGuerra > 0 ? (scoreGuardioes / totalGuerra) * 100 : 50;
  const percGuerreiras = totalGuerra > 0 ? (scoreGuerreiras / totalGuerra) * 100 : 50;

  return (
    <div className="container animate-slide-up">
      <header className="page-header" style={{ marginBottom: '24px' }}>
        <button className="back-button" onClick={() => router.push("/dashboard")}>
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.5rem', background: 'linear-gradient(90deg, #fbbf24, #f59e0b)', WebkitBackgroundClip: 'text' }}>Hall da Fama</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Os maiores caçadores da guilda</p>
        </div>
      </header>

      {/* Guerra das Unidades */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', justifyContent: 'center' }}>
          <Flame size={18} color="#ef4444" />
          GUERRA DE UNIDADES
          <Flame size={18} color="#ef4444" />
        </h2>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>
          <span style={{ color: '#60a5fa' }}>Guardiões ({scoreGuardioes} XP)</span>
          <span style={{ color: '#f472b6' }}>Guerreiras ({scoreGuerreiras} XP)</span>
        </div>
        
        <div style={{ width: '100%', height: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${percGuardioes}%`, background: 'linear-gradient(90deg, #2563eb, #3b82f6)', transition: 'width 1s ease-in-out' }}></div>
          <div style={{ width: `${percGuerreiras}%`, background: 'linear-gradient(90deg, #ec4899, #f472b6)', transition: 'width 1s ease-in-out' }}></div>
        </div>
      </div>

      {loadingHunters ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Invocando os heróis...</div>
      ) : hunters.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum caçador registrado ainda.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {hunters.map((hunter, index) => {
            const isTop3 = index < 3;
            let bgColor = 'rgba(255,255,255,0.02)';
            let borderColor = 'transparent';
            let icon = null;

            if (index === 0) {
              bgColor = 'rgba(251, 191, 36, 0.1)';
              borderColor = 'rgba(251, 191, 36, 0.4)';
              icon = <Trophy size={20} color="#fbbf24" />;
            } else if (index === 1) {
              bgColor = 'rgba(156, 163, 175, 0.1)';
              borderColor = 'rgba(156, 163, 175, 0.4)';
              icon = <Medal size={20} color="#9ca3af" />;
            } else if (index === 2) {
              bgColor = 'rgba(180, 83, 9, 0.1)';
              borderColor = 'rgba(180, 83, 9, 0.4)';
              icon = <Medal size={20} color="#b45309" />;
            } else {
              icon = <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', width: '20px', textAlign: 'center' }}>{index + 1}</span>;
            }

            return (
              <div key={hunter.id} className="glass-card" style={{ padding: '16px', background: bgColor, border: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '30px', display: 'flex', justifyContent: 'center' }}>
                  {icon}
                </div>
                
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                  {hunter.photoURL && hunter.photoURL.length <= 4 ? hunter.photoURL : "🛡️"}
                </div>
                
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: isTop3 ? '#fff' : '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {hunter.displayName}
                    {hunter.vocacao && <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-muted)' }}>{hunter.vocacao}</span>}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: hunter.unidade === 'Guardiões' ? '#60a5fa' : '#f472b6' }}>{hunter.unidade}</span>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <span style={{ display: 'block', color: 'var(--warning)', fontWeight: 'bold', fontSize: '1.1rem' }}>{hunter.xp || 0}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>XP</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
