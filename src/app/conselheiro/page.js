"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/AuthContext";
import { db } from "../../lib/firebase";
import { collection, getDocs, updateDoc, doc, increment, query, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { ChevronLeft, Check, X } from "lucide-react";

export default function ConselheiroPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [entregas, setEntregas] = useState([]);
  const [loadingEntregas, setLoadingEntregas] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== "admin") router.push("/dashboard");
      else fetchEntregas();
    }
  }, [user, loading, router]);

  const fetchEntregas = async () => {
    try {
      const q = query(collection(db, "entregas"), where("status", "==", "pendente"));
      const querySnapshot = await getDocs(q);
      const fetchedEntregas = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setEntregas(fetchedEntregas);
    } catch (error) {
      console.error("Erro ao buscar entregas", error);
    }
    setLoadingEntregas(false);
  };

  const aprovarEntrega = async (entrega) => {
    try {
      await updateDoc(doc(db, "entregas", entrega.id), { status: "aprovada" });
      await updateDoc(doc(db, "users", entrega.userId), { xp: increment(entrega.xpRecompensa) });
      setEntregas(entregas.filter(e => e.id !== entrega.id));
    } catch (error) {
      console.error("Erro", error);
    }
  };

  const rejeitarEntrega = async (entrega) => {
    try {
      await updateDoc(doc(db, "entregas", entrega.id), { status: "rejeitada" });
      setEntregas(entregas.filter(e => e.id !== entrega.id));
    } catch (error) {
      console.error("Erro", error);
    }
  };

  if (loading || !user || user.role !== "admin") return null;

  return (
    <div className="container animate-slide-up">
      <header className="page-header">
        <button className="back-button" onClick={() => router.push("/dashboard")}>
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.5rem', background: 'linear-gradient(90deg, #ef4444, #f59e0b)', WebkitBackgroundClip: 'text' }}>Painel do Mestre</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Validação de Relatórios</p>
        </div>
      </header>

      {loadingEntregas ? (
        <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-muted)' }}>Verificando o sistema...</div>
      ) : entregas.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <p style={{ color: 'var(--success)', fontSize: '1.1rem', fontWeight: 'bold' }}>Nenhum relatório pendente.</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '8px' }}>Os guerreiros estão em missão.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {entregas.map(entrega => (
            <div key={entrega.id} className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--warning)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <strong style={{ fontSize: '1.1rem', color: '#fff' }}>{entrega.userName}</strong>
                <span style={{ color: 'var(--warning)', fontWeight: 'bold', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>+{entrega.xpRecompensa} XP</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '20px' }}>
                Relatou a conclusão de: <span style={{ color: '#fff' }}>{entrega.missaoTitulo}</span>
              </p>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className="btn-primary" 
                  style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', flex: 1, border: '1px solid rgba(16, 185, 129, 0.3)', boxShadow: 'none' }} 
                  onClick={() => aprovarEntrega(entrega)}
                >
                  <Check size={18} />
                  APROVAR
                </button>
                <button 
                  className="btn-secondary" 
                  style={{ color: 'var(--danger)', flex: 1, border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }} 
                  onClick={() => rejeitarEntrega(entrega)}
                >
                  <X size={18} />
                  REJEITAR
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
