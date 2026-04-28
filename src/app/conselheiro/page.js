"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/AuthContext";
import { db } from "../../lib/firebase";
import { collection, getDocs, getDoc, setDoc, updateDoc, doc, query, where, addDoc, serverTimestamp, increment } from "firebase/firestore";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { ChevronLeft, Check, X, Plus, Coins, ShoppingCart, Lock, Unlock, Trash2 } from "lucide-react";

export default function ConselheiroPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState("entregas"); // "entregas", "historico", "forja", "economia", "lojaAdmin"
  const [entregas, setEntregas] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [loadingEntregas, setLoadingEntregas] = useState(true);

  // Estados da Economia
  const [economiaPausada, setEconomiaPausada] = useState(false);
  const [produtos, setProdutos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loadingShop, setLoadingShop] = useState(false);
  const [missoes, setMissoes] = useState([]);
  const [editingMissao, setEditingMissao] = useState(null);
  const [financeiro, setFinanceiro] = useState({ moedasCirculacao: 0 });

  // Estados do formulário de criação
  const [novaMissao, setNovaMissao] = useState({ titulo: "", descricao: "", xp: 10, moedasMin: 5, moedasMax: 20, categoria: "Espiritual", usarIA: false });
  const [isSaving, setIsSaving] = useState(false);

  // Estado para valor de moedas na aprovação
  const [moedasParaConceder, setMoedasParaConceder] = useState({}); // {entregaId: valor}

  // Novo Produto
  const [novoProduto, setNovoProduto] = useState({ nome: "", emoji: "🎁", descricao: "", preco: 50, nivelMinimo: 1 });

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== "admin") router.push("/dashboard");
      else fetchEntregas();
    }
  }, [user, loading, router]);

  const fetchEntregas = async () => {
    try {
      const qPendentes = query(collection(db, "entregas"), where("status", "==", "pendente"));
      const snapshotPendentes = await getDocs(qPendentes);
      setEntregas(snapshotPendentes.docs.map(d => ({ id: d.id, ...d.data() })));

      const qAprovadas = query(collection(db, "entregas"), where("status", "==", "aprovada"));
      const snapshotAprovadas = await getDocs(qAprovadas);
      setHistorico(snapshotAprovadas.docs.map(d => ({ id: d.id, ...d.data() })));

      // Economia e Loja
      const econDoc = await getDoc(doc(db, "settings", "economia"));
      if (econDoc.exists()) setEconomiaPausada(econDoc.data().pausada);

      fetchShopData();
      fetchMissoes();
      calculateFinanceiro();

    } catch (error) {
      console.error("Erro ao buscar entregas", error);
    }
    setLoadingEntregas(false);
  };

  const fetchMissoes = async () => {
    try {
      const q = query(collection(db, "missoes"), orderBy("dataCriacao", "desc"));
      // Se der erro de índice, use a query simples:
      // const q = collection(db, "missoes");
      const snapshot = await getDocs(q);
      setMissoes(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      const snapshot = await getDocs(collection(db, "missoes"));
      setMissoes(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }
  };

  const calculateFinanceiro = async () => {
    try {
      const q = query(collection(db, "users"), where("role", "==", "desbravador"));
      const snapshot = await getDocs(q);
      let total = 0;
      snapshot.docs.forEach(d => {
        total += (d.data().coins || 0);
      });
      setFinanceiro({ moedasCirculacao: total });
    } catch (e) {
      console.error(e);
    }
  };

  const fetchShopData = async () => {
    setLoadingShop(true);
    try {
      const prodSnap = await getDocs(collection(db, "produtos"));
      setProdutos(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const pedSnap = await getDocs(query(collection(db, "pedidos"), where("status", "==", "pendente")));
      setPedidos(pedSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    }
    setLoadingShop(false);
  };

  const aprovarEntrega = async (entrega) => {
    const moedas = economiaPausada ? 0 : (moedasParaConceder[entrega.id] || entrega.moedasMin || 0);
    try {
      await updateDoc(doc(db, "entregas", entrega.id), { 
        status: "aprovada", 
        iaFeedback: "Aprovado manualmente pelo Mestre.",
        coinsRecompensa: Number(moedas)
      });
      await updateDoc(doc(db, "users", entrega.userId), { 
        xp: increment(entrega.xpRecompensa),
        coins: increment(Number(moedas))
      });
      toast.success(`Aprovado! +${entrega.xpRecompensa} XP e +${moedas} 🪙`);
      setEntregas(entregas.filter(e => e.id !== entrega.id));
      fetchEntregas(); 
    } catch (error) {
      console.error("Erro", error);
      toast.error("Erro ao aprovar.");
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

  const revogarEntrega = async (entrega) => {
    if (!window.confirm(`Isso removerá o XP e as moedas (${entrega.coinsRecompensa || 0}) do usuário. Tem certeza?`)) return;
    try {
      await updateDoc(doc(db, "entregas", entrega.id), { status: "rejeitada" });
      await updateDoc(doc(db, "users", entrega.userId), { 
        xp: increment(-entrega.xpRecompensa),
        coins: increment(-(entrega.coinsRecompensa || 0))
      });
      toast.success("Aprovação revogada!");
      setHistorico(historico.filter(e => e.id !== entrega.id));
    } catch (error) {
      console.error("Erro", error);
      toast.error("Erro ao revogar.");
    }
  };

  const criarMissao = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const missaoData = {
        titulo: novaMissao.titulo,
        descricao: novaMissao.descricao,
        xp: Number(novaMissao.xp),
        moedasMin: Number(novaMissao.moedasMin),
        moedasMax: Number(novaMissao.moedasMax),
        categoria: novaMissao.categoria,
        usarIA: novaMissao.usarIA,
        arquivada: false
      };

      if (editingMissao) {
        await updateDoc(doc(db, "missoes", editingMissao.id), missaoData);
        toast.success("Missão atualizada!");
      } else {
        await addDoc(collection(db, "missoes"), {
          ...missaoData,
          dataCriacao: serverTimestamp()
        });
        toast.success("Nova missão forjada!");
      }
      
      setNovaMissao({ titulo: "", descricao: "", xp: 10, moedasMin: 5, moedasMax: 20, categoria: "Espiritual", usarIA: false });
      setEditingMissao(null);
      fetchMissoes();
    } catch (error) {
      toast.error("Erro ao salvar missão.");
    }
    setIsSaving(false);
  };

  const deletarMissao = async (id) => {
    if (!confirm("Tem certeza que deseja apagar esta missão para sempre?")) return;
    try {
      const { deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "missoes", id));
      toast.success("Missão apagada.");
      fetchMissoes();
    } catch (e) {
      toast.error("Erro ao apagar.");
    }
  };

  const arquivarMissao = async (id, status) => {
    try {
      await updateDoc(doc(db, "missoes", id), { arquivada: status });
      toast.success(status ? "Missão arquivada." : "Missão reativada.");
      fetchMissoes();
    } catch (e) {
      toast.error("Erro ao arquivar.");
    }
  };

  const toggleEconomia = async () => {
    const novoStatus = !economiaPausada;
    try {
      await setDoc(doc(db, "settings", "economia"), { pausada: novoStatus }, { merge: true });
      setEconomiaPausada(novoStatus);
      toast.success(novoStatus ? "Economia Pausada!" : "Economia Ativada!");
    } catch (e) {
      toast.error("Erro ao alterar status da economia.");
    }
  };

  const criarProduto = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "produtos"), { ...novoProduto, ativo: true });
      toast.success("Produto adicionado à loja!");
      setNovoProduto({ nome: "", emoji: "🎁", descricao: "", preco: 50, nivelMinimo: 1 });
      fetchShopData();
    } catch (e) {
      toast.error("Erro ao criar produto.");
    }
  };

  const gerenciarPedido = async (pedido, status) => {
    try {
      if (status === "aprovado") {
        // Deduzir moedas
        await updateDoc(doc(db, "users", pedido.userId), { coins: increment(-pedido.preco) });
      }
      await updateDoc(doc(db, "pedidos", pedido.id), { status });
      toast.success(`Pedido ${status}!`);
      fetchShopData();
    } catch (e) {
      toast.error("Erro ao processar pedido.");
    }
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

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveTab("entregas")}
          style={{ flex: 1, minWidth: '100px', padding: '10px 5px', fontSize: '0.85rem', background: activeTab === "entregas" ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)', color: activeTab === "entregas" ? '#fff' : 'var(--text-muted)', border: activeTab === "entregas" ? '1px solid var(--danger)' : '1px solid transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Validações
          {entregas.length > 0 && activeTab !== "entregas" && (
            <span style={{ marginLeft: '4px', background: 'var(--danger)', color: '#fff', padding: '2px 6px', borderRadius: '50%', fontSize: '0.7rem' }}>{entregas.length}</span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab("historico")}
          style={{ flex: 1, minWidth: '100px', padding: '10px 5px', fontSize: '0.85rem', background: activeTab === "historico" ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)', color: activeTab === "historico" ? '#fff' : 'var(--text-muted)', border: activeTab === "historico" ? '1px solid var(--success)' : '1px solid transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Aprovadas
        </button>
        <button 
          onClick={() => setActiveTab("forja")}
          style={{ flex: 1, minWidth: '100px', padding: '10px 5px', fontSize: '0.85rem', background: activeTab === "forja" ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)', color: activeTab === "forja" ? '#fff' : 'var(--text-muted)', border: activeTab === "forja" ? '1px solid var(--accent-primary)' : '1px solid transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Forja
        </button>
        <button 
          onClick={() => setActiveTab("economia")}
          style={{ flex: 1, minWidth: '100px', padding: '10px 5px', fontSize: '0.85rem', background: activeTab === "economia" ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.05)', color: activeTab === "economia" ? '#fff' : 'var(--text-muted)', border: activeTab === "economia" ? '1px solid #fbbf24' : '1px solid transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Economia
        </button>
        <button 
          onClick={() => setActiveTab("lojaAdmin")}
          style={{ flex: 1, minWidth: '100px', padding: '10px 5px', fontSize: '0.85rem', background: activeTab === "lojaAdmin" ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255,255,255,0.05)', color: activeTab === "lojaAdmin" ? '#fff' : 'var(--text-muted)', border: activeTab === "lojaAdmin" ? '1px solid #a78bfa' : '1px solid transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Loja (Admin)
        </button>
      </div>

      {activeTab === "entregas" && (
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
                  
                  <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Prova da Conclusão:</span>
                    <p style={{ color: '#e2e8f0', fontSize: '0.95rem', fontStyle: 'italic' }}>"{entrega.provaTexto || "Missão concluída!"}"</p>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '8px' }}>MOEDAS A CONCEDER ({entrega.moedasMin || 5} - {entrega.moedasMax || 20})</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input 
                        type="range" 
                        min={entrega.moedasMin || 5} 
                        max={entrega.moedasMax || 20} 
                        value={moedasParaConceder[entrega.id] || entrega.moedasMin || 5}
                        onChange={(e) => setMoedasParaConceder({...moedasParaConceder, [entrega.id]: Number(e.target.value)})}
                        disabled={economiaPausada}
                        style={{ flex: 1, accentColor: '#fbbf24' }}
                      />
                      <span style={{ color: '#fbbf24', fontWeight: 'bold', minWidth: '40px', textAlign: 'right' }}>
                        {economiaPausada ? "PAUSADO" : `${moedasParaConceder[entrega.id] || entrega.moedasMin || 5} 🪙`}
                      </span>
                    </div>
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
      )}

      {activeTab === "historico" && (
        <>
          {loadingEntregas ? (
            <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-muted)' }}>Buscando arquivos...</div>
          ) : historico.length === 0 ? (
            <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Nenhum registro de aprovação encontrado.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {historico.map(entrega => (
                <div key={entrega.id} className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--success)', opacity: 0.8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '1.1rem', color: '#fff' }}>{entrega.userName}</strong>
                    <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>{entrega.xpRecompensa} XP | {entrega.coinsRecompensa || 0} 🪙</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px' }}>
                    Missão: <span style={{ color: '#fff' }}>{entrega.missaoTitulo}</span>
                  </p>
                  
                  <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Prova da Conclusão:</span>
                    <p style={{ color: '#e2e8f0', fontSize: '0.95rem', fontStyle: 'italic' }}>"{entrega.provaTexto || "Missão concluída!"}"</p>
                  </div>

                  {entrega.iaFeedback && (
                    <div style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                      <span style={{ display: 'block', fontSize: '0.7rem', color: '#e9d5ff', textTransform: 'uppercase', marginBottom: '4px' }}>🔮 Veredito da Inteligência Mágica:</span>
                      <p style={{ color: '#e9d5ff', fontSize: '0.85rem' }}>{entrega.iaFeedback}</p>
                    </div>
                  )}
                  
                  <button 
                    className="btn-secondary" 
                    style={{ width: '100%', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '8px', fontSize: '0.8rem' }} 
                    onClick={() => revogarEntrega(entrega)}
                  >
                    <X size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}/>
                    REVOGAR APROVAÇÃO (-XP/🪙)
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "forja" && (
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
                <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block', marginBottom: '8px' }}>MIN MOEDAS</label>
                <input 
                  type="number" required min="0"
                  value={novaMissao.moedasMin} onChange={e => setNovaMissao({...novaMissao, moedasMin: e.target.value})}
                  style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '8px', color: '#fbbf24', fontWeight: 'bold', outline: 'none' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block', marginBottom: '8px' }}>MAX MOEDAS</label>
                <input 
                  type="number" required min="0"
                  value={novaMissao.moedasMax} onChange={e => setNovaMissao({...novaMissao, moedasMax: e.target.value})}
                  style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '8px', color: '#fbbf24', fontWeight: 'bold', outline: 'none' }}
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
              {isSaving ? "SALVANDO..." : (editingMissao ? "ATUALIZAR MISSÃO" : "FORJAR MISSÃO")}
            </button>
            {editingMissao && (
              <button type="button" className="btn-secondary" onClick={() => { setEditingMissao(null); setNovaMissao({ titulo: "", descricao: "", xp: 10, moedasMin: 5, moedasMax: 20, categoria: "Espiritual", usarIA: false }); }}>
                CANCELAR EDIÇÃO
              </button>
            )}
          </form>

          <div style={{ marginTop: '40px' }}>
            <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '16px' }}>Missões Existentes</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {missoes.map(m => (
                <div key={m.id} className="glass-card" style={{ padding: '16px', background: m.arquivada ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.03)', opacity: m.arquivada ? 0.5 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#fff' }}>{m.titulo}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.xp} XP | {m.moedasMin}-{m.moedasMax} 🪙 | {m.categoria}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => { 
                        setEditingMissao(m); 
                        setNovaMissao({
                          titulo: m.titulo || "",
                          descricao: m.descricao || "",
                          xp: m.xp || 10,
                          moedasMin: m.moedasMin || 5,
                          moedasMax: m.moedasMax || 20,
                          categoria: m.categoria || "Espiritual",
                          usarIA: !!m.usarIA
                        }); 
                        window.scrollTo({ top: 0, behavior: 'smooth' }); 
                      }} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer' }}>Editar</button>
                      <button onClick={() => arquivarMissao(m.id, !m.arquivada)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>{m.arquivada ? "Ativar" : "Arquivar"}</button>
                      <button onClick={() => deletarMissao(m.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "economia" && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24' }}>
            <Coins size={20} /> Controle da Economia
          </h2>
          
          <div style={{ background: economiaPausada ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', border: economiaPausada ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)', padding: '20px', borderRadius: '12px', textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{economiaPausada ? "🔒" : "🔓"}</div>
            <h3 style={{ color: economiaPausada ? 'var(--danger)' : 'var(--success)', marginBottom: '8px' }}>
              Economia {economiaPausada ? "PAUSADA" : "ATIVA"}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
              {economiaPausada 
                ? "Nenhuma moeda será concedida em novas aprovações. Compras na loja estão bloqueadas." 
                : "Aprovações concedem moedas e a loja está aberta para negócios."}
            </p>
            <button 
              className={economiaPausada ? "btn-primary" : "btn-secondary"} 
              style={{ width: 'auto', padding: '12px 24px', background: economiaPausada ? 'var(--success)' : 'transparent', color: economiaPausada ? '#000' : 'var(--danger)', borderColor: economiaPausada ? 'none' : 'var(--danger)' }}
              onClick={toggleEconomia}
            >
              {economiaPausada ? <Unlock size={18} /> : <Lock size={18} />}
              {economiaPausada ? "ATIVAR ECONOMIA" : "PAUSAR ECONOMIA"}
            </button>
          </div>

          <div className="glass-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <h4 style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '12px' }}>📊 Resumo Financeiro</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>MOEDAS EM CIRCULAÇÃO</span>
                <span style={{ fontSize: '1.2rem', color: '#fbbf24', fontWeight: 'bold' }}>{financeiro.moedasCirculacao} 🪙</span>
              </div>
              <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>PEDIDOS PENDENTES</span>
                <span style={{ fontSize: '1.2rem', color: '#a78bfa', fontWeight: 'bold' }}>{pedidos.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "lojaAdmin" && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#a78bfa' }}>
              <ShoppingCart size={20} /> Pedidos Pendentes
            </h2>
            {pedidos.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Nenhum pedido aguardando aprovação.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pedidos.map(pedido => (
                  <div key={pedido.id} className="glass-card" style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderLeft: '3px solid #fbbf24' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong>{pedido.userName}</strong>
                      <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{pedido.preco} 🪙</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>
                      Item: <span style={{ color: '#fff' }}>{pedido.produtoNome}</span>
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-primary" style={{ flex: 1, padding: '8px', fontSize: '0.8rem', background: 'var(--success)', color: '#000' }} onClick={() => gerenciarPedido(pedido, "aprovado")}>Aprovar</button>
                      <button className="btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '0.8rem', color: 'var(--danger)' }} onClick={() => gerenciarPedido(pedido, "rejeitado")}>Rejeitar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
              <Plus size={20} /> Novo Produto
            </h2>
            <form onSubmit={criarProduto} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ width: '80px' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>EMOJI</label>
                  <input type="text" value={novoProduto.emoji} onChange={e => setNovoProduto({...novoProduto, emoji: e.target.value})} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', textAlign: 'center', fontSize: '1.5rem' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>NOME DO PRODUTO</label>
                  <input type="text" required value={novoProduto.nome} onChange={e => setNovoProduto({...novoProduto, nome: e.target.value})} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PREÇO (🪙)</label>
                  <input type="number" required value={novoProduto.preco} onChange={e => setNovoProduto({...novoProduto, preco: Number(e.target.value)})} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '8px', color: '#fbbf24', fontWeight: 'bold' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>NÍVEL MÍNIMO</label>
                  <input type="number" required value={novoProduto.nivelMinimo} onChange={e => setNovoProduto({...novoProduto, nivelMinimo: Number(e.target.value)})} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>DESCRIÇÃO</label>
                <input type="text" required value={novoProduto.descricao} onChange={e => setNovoProduto({...novoProduto, descricao: e.target.value})} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
              </div>
              <button type="submit" className="btn-primary" style={{ background: '#a78bfa', color: '#000' }}>CADASTRAR PRODUTO</button>
            </form>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Produtos Ativos</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {produtos.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '1.5rem' }}>{p.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold' }}>{p.nome}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.preco} 🪙 | Lvl {p.nivelMinimo}</div>
                  </div>
                  <button onClick={async () => {
                    if (confirm("Remover produto?")) {
                      const { deleteDoc } = await import("firebase/firestore");
                      await deleteDoc(doc(db, "produtos", p.id));
                      fetchShopData();
                    }
                  }} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
