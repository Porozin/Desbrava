"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/AuthContext";
import { db } from "../../lib/firebase";
import { collection, getDocs, addDoc, serverTimestamp, query, doc, updateDoc, increment, where } from "firebase/firestore";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { ChevronLeft, ScrollText, Swords, ShieldPlus, Brain } from "lucide-react";

export default function MissoesPage() {
  const { user, loading, updateUserData } = useAuth();
  const router = useRouter();
  const [missoes, setMissoes] = useState([]);
  const [loadingMissoes, setLoadingMissoes] = useState(true);
  
  const [missaoAtiva, setMissaoAtiva] = useState(null); // Para abrir o input de prova
  const [provaTexto, setProvaTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    else if (user) fetchMissoes();
  }, [user, loading, router]);

  const fetchMissoes = async () => {
    try {
      const q = query(collection(db, "missoes"), where("arquivada", "==", false));
      const querySnapshot = await getDocs(q);
      let fetchedMissoes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Fallback for missions without the arquivada field (backwards compatibility)
      if (fetchedMissoes.length === 0) {
        const allQ = query(collection(db, "missoes"));
        const allSnapshot = await getDocs(allQ);
        fetchedMissoes = allSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(m => m.arquivada !== true);
      }
      
      if (fetchedMissoes.length === 0) {
        setMissoes([
          { id: "1", titulo: "Ler Provérbios 1", descricao: "Leia o primeiro capítulo e faça um resumo da sabedoria encontrada.", xp: 50, categoria: "Espiritual" },
          { id: "2", titulo: "15 min de Exercício", descricao: "Fortaleça seu corpo físico para as batalhas que virão.", xp: 30, categoria: "Física" },
        ]);
      } else {
        setMissoes(fetchedMissoes);
      }
    } catch (error) {
      console.error("Erro ao buscar missões", error);
    }
    setLoadingMissoes(false);
  };

  const entregarMissao = async (e) => {
    e.preventDefault();
    if (!provaTexto.trim()) return alert("Você deve escrever a prova da sua missão!");
    setEnviando(true);

    try {
      let statusEntrega = "pendente";
      let alertMessage = `O relatório da missão "${missaoAtiva.titulo}" foi enviado aos mestres!`;
      let iaFeedback = null;

      // Se a missão tiver IA ativada
      if (missaoAtiva.usarIA) {
        const res = await fetch("/api/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            missaoDescricao: missaoAtiva.descricao,
            provaTexto: provaTexto
          })
        });

        if (res.ok) {
          const data = await res.json();
          iaFeedback = data.rawText;
          if (data.resultado === "APROVADO") {
            statusEntrega = "aprovada";
            alertMessage = `A Inteligência Mágica APROVOU sua missão instantaneamente! +${missaoAtiva.xp} XP!`;
            // Atualiza XP do usuário na hora no banco e na tela
            await updateDoc(doc(db, "users", user.uid), { xp: increment(Number(missaoAtiva.xp)) });
            updateUserData({ xp: (user.xp || 0) + Number(missaoAtiva.xp) });
          } else {
            statusEntrega = "pendente"; // Rejeitado pela IA vai para análise humana
            alertMessage = "A IA não se convenceu. Seu relatório foi enviado para análise humana dos Mestres.";
          }
        }
      }

      await addDoc(collection(db, "entregas"), {
        userId: user.uid,
        userName: user.displayName,
        missaoId: missaoAtiva.id,
        missaoTitulo: missaoAtiva.titulo,
        xpRecompensa: Number(missaoAtiva.xp),
        provaTexto: provaTexto,
        status: statusEntrega,
        iaFeedback: iaFeedback,
        data: serverTimestamp()
      });
      
      alert(alertMessage);
      setMissaoAtiva(null);
      setProvaTexto("");
    } catch (error) {
      console.error(error);
      alert("Falha na comunicação com o sistema.");
    }
    setEnviando(false);
  };

  const getIcon = (cat) => {
    if (cat === "Espiritual") return <ScrollText size={18} />;
    if (cat === "Física") return <Swords size={18} />;
    if (cat === "Mental") return <Brain size={18} />;
    return <ShieldPlus size={18} />;
  };

  if (loading || !user) return null;

  return (
    <div className="container animate-slide-up">
      <header className="page-header" style={{ marginBottom: '24px' }}>
        <button className="back-button" onClick={() => router.push("/dashboard")}>
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.5rem', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text' }}>Mural da Guilda</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Missões Disponíveis</p>
        </div>
      </header>

      {missaoAtiva && (
        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', border: '1px solid var(--accent-primary)', animation: 'slideUp 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.2rem', margin: 0, color: '#fff' }}>{missaoAtiva.titulo}</h2>
            <button onClick={() => setMissaoAtiva(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              X
            </button>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.5' }}>
            {missaoAtiva.descricao}
          </p>

          <form onSubmit={entregarMissao} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Prova da Conclusão (Relatório)</label>
              <textarea 
                rows="4" 
                required
                placeholder="Descreva detalhadamente como você completou esta missão..."
                value={provaTexto}
                onChange={(e) => setProvaTexto(e.target.value)}
                style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', resize: 'vertical', outline: 'none' }}
              ></textarea>
            </div>
            <button type="submit" className="btn-primary" disabled={enviando}>
              {enviando ? "Enviando Relatório..." : "Reportar Conclusão"}
            </button>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loadingMissoes ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>Procurando pergaminhos...</div>
        ) : (
          missoes.map(missao => (
            <div key={missao.id} className="glass-card" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
              <span style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {missao.categoria}
              </span>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                  <ScrollText size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', paddingRight: '60px' }}>{missao.titulo}</h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--warning)', fontWeight: 'bold' }}>+{missao.xp} XP</span>
                </div>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px', lineHeight: '1.4' }}>
                {missao.descricao}
              </p>
              
              {missaoAtiva?.id !== missao.id && (
                <button 
                  className="btn-secondary" 
                  onClick={() => { setMissaoAtiva(missao); setProvaTexto(""); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                >
                  Aceitar Missão
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
