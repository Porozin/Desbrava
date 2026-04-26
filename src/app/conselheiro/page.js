"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/AuthContext";
import { db } from "../../lib/firebase";
import { collection, getDocs, addDoc, updateDoc, doc, increment, query, where, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { ChevronLeft, Check, X, Plus } from "lucide-react";

export default function ConselheiroPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState("entregas"); // "entregas" ou "forja"
  const [entregas, setEntregas] = useState([]);
  const [loadingEntregas, setLoadingEntregas] = useState(true);

  // Estados do formulário de criação
  const [novaMissao, setNovaMissao] = useState({ titulo: "", descricao: "", xp: 10, categoria: "Espiritual", usarIA: false });
  const [isSaving, setIsSaving] = useState(false);

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

  const criarMissao = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await addDoc(collection(db, "missoes"), {
        titulo: novaMissao.titulo,
        descricao: novaMissao.descricao,
        xp: Number(novaMissao.xp),
        categoria: novaMissao.categoria,
        usarIA: novaMissao.usarIA,
        dataCriacao: serverTimestamp()
      });
      alert("Nova missão forjada com sucesso!");
      setNovaMissao({ titulo: "", descricao: "", xp: 10, categoria: "Espiritual", usarIA: false });
      setActiveTab("entregas");
    } catch (error) {
      alert("Erro ao forjar missão.");
    }
    setIsSaving(false);
  };

  if (loading || !user || user.role !== "admin") return null;

  return (
    <div className="container animate-slide-up">
      <header className="page-header" style={{ marginBottom: '20px' }}>
        <button className="back-button" onClick={() => router.push("/dashboard")}>
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.5rem', background: 'linear-gradient(90deg, #ef4444, #f59e0b)', WebkitBackgroundClip: 'text' }}>Painel do Mestre</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Administração do Sistema</p>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveTab("entregas")}
          style={{ flex: 1, padding: '10px', background: activeTab === "entregas" ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)', color: activeTab === "entregas" ? '#fff' : 'var(--text-muted)', border: activeTab === "entregas" ? '1px solid var(--danger)' : '1px solid transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Validações
          {entregas.length > 0 && activeTab !== "entregas" && (
            <span style={{ marginLeft: '8px', background: 'var(--danger)', color: '#fff', padding: '2px 6px', borderRadius: '50%', fontSize: '0.7rem' }}>{entregas.length}</span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab("forja")}
          style={{ flex: 1, padding: '10px', background: activeTab === "forja" ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)', color: activeTab === "forja" ? '#fff' : 'var(--text-muted)', border: activeTab === "forja" ? '1px solid var(--accent-primary)' : '1px solid transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Forja de Missões
        </button>
      </div>

      {activeTab === "entregas" ? (
        <>
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
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px' }}>
                    Missão: <span style={{ color: '#fff' }}>{entrega.missaoTitulo}</span>
                  </p>
                  
                  <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Prova da Conclusão:</span>
                    <p style={{ color: '#e2e8f0', fontSize: '0.95rem', fontStyle: 'italic' }}>"{entrega.provaTexto || "Missão concluída!"}"</p>
                  </div>
                  
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
        </>
      ) : (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)' }}>
            <Plus size={20} /> Criar Nova Missão
          </h2>
          <form onSubmit={criarMissao} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div>
              <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block', marginBottom: '8px' }}>TÍTULO DA MISSÃO</label>
              <input 
                type="text" required 
                value={novaMissao.titulo} onChange={e => setNovaMissao({...novaMissao, titulo: e.target.value})}
                style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block', marginBottom: '8px' }}>RECOMPENSA (XP)</label>
                <input 
                  type="number" required min="1"
                  value={novaMissao.xp} onChange={e => setNovaMissao({...novaMissao, xp: e.target.value})}
                  style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', color: 'var(--warning)', fontWeight: 'bold', outline: 'none' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block', marginBottom: '8px' }}>CATEGORIA</label>
                <select 
                  value={novaMissao.categoria} onChange={e => setNovaMissao({...novaMissao, categoria: e.target.value})}
                  style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }}
                >
                  <option value="Espiritual">Espiritual</option>
                  <option value="Física">Física</option>
                  <option value="Mental">Mental</option>
                  <option value="Social">Social</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block', marginBottom: '8px' }}>DESCRIÇÃO (O que deve ser feito)</label>
              <textarea 
                required rows={4}
                value={novaMissao.descricao} onChange={e => setNovaMissao({...novaMissao, descricao: e.target.value})}
                style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none', resize: 'vertical' }}
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: 'rgba(139, 92, 246, 0.1)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
              <input 
                type="checkbox" 
                checked={novaMissao.usarIA} 
                onChange={e => setNovaMissao({...novaMissao, usarIA: e.target.checked})}
                style={{ width: '20px', height: '20px', accentColor: 'var(--accent-purple)' }}
              />
              <span style={{ color: '#e9d5ff', fontWeight: 'bold' }}>🔮 Validação Mágica (IA)</span>
            </label>

            <button type="submit" className="btn-primary" disabled={isSaving} style={{ marginTop: '10px' }}>
              {isSaving ? "FORJANDO..." : "FORJAR MISSÃO"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
