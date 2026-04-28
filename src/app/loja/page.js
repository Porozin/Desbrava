"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/AuthContext";
import { db } from "../../lib/firebase";
import {
  collection, getDocs, addDoc, query, where, serverTimestamp, doc, getDoc
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { ChevronLeft, ShoppingBag, Coins, Lock } from "lucide-react";
import toast from "react-hot-toast";

export default function LojaPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [produtos, setProdutos] = useState([]);
  const [pedidosPendentes, setPedidosPendentes] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [economiaPausada, setEconomiaPausada] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    else if (user) fetchData();
  }, [user, loading]);

  const fetchData = async () => {
    try {
      // Verificar status da economia
      const econDoc = await getDoc(doc(db, "settings", "economia"));
      if (econDoc.exists()) setEconomiaPausada(econDoc.data().pausada || false);

      // Buscar produtos ativos
      const prodSnap = await getDocs(query(collection(db, "produtos"), where("ativo", "==", true)));
      setProdutos(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // Buscar pedidos pendentes do usuário
      const pedSnap = await getDocs(query(
        collection(db, "pedidos"),
        where("userId", "==", user.uid),
        where("status", "==", "pendente")
      ));
      setPedidosPendentes(pedSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    }
    setLoadingData(false);
  };

  const comprar = async (produto) => {
    const coins = user.coins || 0;
    if (economiaPausada) {
      toast.error("A economia está pausada pelo Conselheiro. Tente mais tarde.");
      return;
    }
    const nivelAtual = Math.floor((user.xp || 0) / 100) + 1;
    if (nivelAtual < (produto.nivelMinimo || 1)) {
      toast.error(`Você precisa ser Nível ${produto.nivelMinimo} para comprar este item.`);
      return;
    }
    if (coins < produto.preco) {
      toast.error(`Moedas insuficientes! Você tem ${coins} 🪙 e precisa de ${produto.preco} 🪙`);
      return;
    }
    const jaTemPendente = pedidosPendentes.some(p => p.produtoId === produto.id);
    if (jaTemPendente) {
      toast("Você já tem um pedido pendente deste item.", { icon: "⏳" });
      return;
    }

    try {
      await addDoc(collection(db, "pedidos"), {
        userId: user.uid,
        userName: user.displayName,
        produtoId: produto.id,
        produtoNome: produto.nome,
        preco: produto.preco,
        status: "pendente",
        data: serverTimestamp()
      });
      toast.success(`Pedido de "${produto.nome}" enviado! Aguarde aprovação do Conselheiro. 🛒`);
      fetchData();
    } catch (e) {
      toast.error("Erro ao enviar pedido.");
    }
  };

  if (loading || !user) return null;

  const coins = user.coins || 0;

  return (
    <div className="container animate-slide-up">
      <header className="page-header" style={{ marginBottom: "24px" }}>
        <button className="back-button" onClick={() => router.push("/dashboard")}>
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="page-title" style={{ fontSize: "1.5rem", background: "linear-gradient(90deg, #fbbf24, #f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Loja da Guilda
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Gaste suas conquistas</p>
        </div>
      </header>

      {/* Saldo */}
      <div className="glass-card" style={{ padding: "20px", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Seu Saldo</span>
          <span style={{ fontSize: "2rem", fontWeight: "800", color: "#fbbf24" }}>{coins} <span style={{ fontSize: "1rem" }}>🪙</span></span>
        </div>
        <ShoppingBag size={32} color="rgba(251,191,36,0.4)" />
      </div>

      {economiaPausada && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: "12px", padding: "14px 16px", marginBottom: "20px", color: "#fca5a5", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "10px" }}>
          <Lock size={16} /> A economia está pausada pelo Conselheiro. Compras indisponíveis no momento.
        </div>
      )}

      {loadingData ? (
        <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "40px" }}>Carregando itens...</div>
      ) : produtos.length === 0 ? (
        <div className="glass-card" style={{ padding: "40px", textAlign: "center" }}>
          <p style={{ color: "var(--text-muted)" }}>Nenhum item disponível na loja ainda.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {produtos.map(produto => {
            const nivelAtual = Math.floor((user.xp || 0) / 100) + 1;
            const bloqueado = nivelAtual < (produto.nivelMinimo || 1);
            const semMoedas = coins < produto.preco;
            const pendente = pedidosPendentes.some(p => p.produtoId === produto.id);

            return (
              <div key={produto.id} className="glass-card" style={{ padding: "18px", display: "flex", alignItems: "center", gap: "16px", opacity: bloqueado ? 0.5 : 1 }}>
                <div style={{ fontSize: "2.2rem", width: "48px", textAlign: "center" }}>{produto.emoji || "🎁"}</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, color: "#fff", fontSize: "1rem" }}>{produto.nome}</h3>
                  <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.8rem" }}>{produto.descricao}</p>
                  {produto.nivelMinimo > 1 && (
                    <span style={{ fontSize: "0.7rem", color: "#a78bfa" }}>Nível {produto.nivelMinimo}+ necessário</span>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                  <span style={{ color: "#fbbf24", fontWeight: "bold", fontSize: "1.1rem" }}>{produto.preco} 🪙</span>
                  <button
                    onClick={() => comprar(produto)}
                    disabled={bloqueado || pendente || economiaPausada}
                    style={{
                      padding: "8px 14px", borderRadius: "8px", border: "none", cursor: bloqueado || pendente || economiaPausada ? "not-allowed" : "pointer", fontSize: "0.8rem", fontWeight: "bold",
                      background: pendente ? "rgba(255,255,255,0.05)" : semMoedas || bloqueado ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #f59e0b, #d97706)",
                      color: pendente ? "var(--text-muted)" : semMoedas || bloqueado ? "var(--text-muted)" : "#000"
                    }}
                  >
                    {bloqueado ? "🔒 Bloqueado" : pendente ? "⏳ Pendente" : semMoedas ? "Sem moedas" : "Comprar"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
