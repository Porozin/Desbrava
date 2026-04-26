"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/AuthContext";
import { db } from "../../lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { ChevronLeft, Crown, Medal } from "lucide-react";

export default function RankingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [ranking, setRanking] = useState([]);
  const [loadingRanking, setLoadingRanking] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    else if (user) fetchRanking();
  }, [user, loading, router]);

  const fetchRanking = async () => {
    try {
      const q = query(collection(db, "users"), orderBy("xp", "desc"), limit(10));
      const querySnapshot = await getDocs(q);
      const fetchedRanking = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRanking(fetchedRanking);
    } catch (error) {
      console.error("Erro ao buscar ranking", error);
    }
    setLoadingRanking(false);
  };

  if (loading || !user) return null;

  return (
    <div className="container animate-slide-up">
      <header className="page-header">
        <button className="back-button" onClick={() => router.push("/dashboard")}>
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.5rem', background: 'linear-gradient(90deg, var(--warning), #fbbf24)', WebkitBackgroundClip: 'text' }}>Hall da Fama</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Os Caçadores de Elite</p>
        </div>
      </header>

      {loadingRanking ? (
        <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-muted)' }}>Buscando registros do sistema...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {ranking.map((player, index) => (
            <div 
              key={player.id} 
              className="glass-card" 
              style={{ 
                padding: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px',
                border: index === 0 ? '1px solid var(--warning)' : 
                        index === 1 ? '1px solid #e2e8f0' : 
                        index === 2 ? '1px solid #b45309' : 
                        '1px solid rgba(255, 255, 255, 0.05)',
                boxShadow: index === 0 ? '0 0 20px rgba(245, 158, 11, 0.15)' : 'none',
                background: index === 0 ? 'linear-gradient(145deg, rgba(245, 158, 11, 0.1), rgba(15, 23, 42, 0.8))' : ''
              }}
            >
              <div style={{ width: '30px', display: 'flex', justifyContent: 'center' }}>
                {index === 0 ? <Crown size={24} color="var(--warning)" /> : 
                 index === 1 ? <Medal size={24} color="#e2e8f0" /> : 
                 index === 2 ? <Medal size={24} color="#b45309" /> : 
                 <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>{index + 1}</span>}
              </div>
              
              <img 
                src={player.photoURL || `https://ui-avatars.com/api/?name=${player.displayName}&background=random`} 
                alt="Avatar" 
                style={{ width: '48px', height: '48px', borderRadius: '12px', border: index === 0 ? '2px solid var(--warning)' : '2px solid transparent' }} 
              />
              
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1rem', margin: '0 0 4px 0', color: index === 0 ? 'var(--warning)' : '#fff' }}>
                  {player.displayName || "Guerreiro Anônimo"}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Nível {Math.floor((player.xp || 0) / 100) + 1}
                </span>
              </div>
              
              <div style={{ color: 'var(--warning)', fontWeight: '800', fontSize: '1.1rem' }}>
                {player.xp || 0} <span style={{fontSize: '0.7rem', color: 'rgba(245, 158, 11, 0.5)'}}>XP</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
