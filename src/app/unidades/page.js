"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/AuthContext";
import { db } from "../../lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { ChevronLeft, Users } from "lucide-react";

export default function UnidadesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [membros, setMembros] = useState([]);
  const [loadingMembros, setLoadingMembros] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    else if (user) fetchMembros();
  }, [user, loading, router]);

  const fetchMembros = async () => {
    try {
      const q = query(collection(db, "users"), orderBy("displayName", "asc"));
      const querySnapshot = await getDocs(q);
      const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(u => u.status === "active");
      setMembros(fetched);
    } catch (error) {
      console.error("Erro ao buscar membros", error);
    }
    setLoadingMembros(false);
  };

  if (loading || !user) return null;

  const guardioes = membros.filter(m => m.unidade === "Guardiões");
  const guerreiras = membros.filter(m => m.unidade === "Guerreiras de Cristo");

  const renderUnidade = (nome, icon, list) => (
    <div style={{ marginBottom: '30px' }}>
      <h2 style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
        {icon} {nome} <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px' }}>{list.length}</span>
      </h2>
      {list.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>Nenhum caçador despertado ainda.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
          {list.map(m => (
            <div key={m.id} className="glass-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', background: 'rgba(255,255,255,0.05)', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                {m.photoURL && m.photoURL.length <= 4 ? m.photoURL : "🛡️"}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 style={{ fontSize: '0.9rem', margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {m.displayName}
                </h3>
                {m.role === 'admin' && (
                  <span style={{ fontSize: '0.65rem', color: '#fca5a5', background: 'rgba(239, 68, 68, 0.2)', padding: '2px 4px', borderRadius: '4px', marginTop: '4px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    CONSELHEIRO
                  </span>
                )}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>LVL {Math.floor((m.xp || 0) / 100) + 1}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="container animate-slide-up">
      <header className="page-header">
        <button className="back-button" onClick={() => router.push("/dashboard")}>
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.5rem', background: 'linear-gradient(90deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text' }}>Unidades</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>As Forças do Clube</p>
        </div>
      </header>

      {loadingMembros ? (
        <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-muted)' }}>Mapeando guerreiros...</div>
      ) : (
        <>
          {renderUnidade("Guardiões", "🦁", guardioes)}
          {renderUnidade("Guerreiras de Cristo", "🦅", guerreiras)}
        </>
      )}
    </div>
  );
}
