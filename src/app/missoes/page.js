"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/AuthContext";
import { db } from "../../lib/firebase";
import { collection, getDocs, addDoc, serverTimestamp, query } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { ChevronLeft, ScrollText, Swords, ShieldPlus } from "lucide-react";

export default function MissoesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [missoes, setMissoes] = useState([]);
  const [loadingMissoes, setLoadingMissoes] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    else if (user) fetchMissoes();
  }, [user, loading, router]);

  const fetchMissoes = async () => {
    try {
      const q = query(collection(db, "missoes"));
      const querySnapshot = await getDocs(q);
      const fetchedMissoes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
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

  const entregarMissao = async (missao) => {
    try {
      await addDoc(collection(db, "entregas"), {
        userId: user.uid,
        userName: user.displayName,
        missaoId: missao.id,
        missaoTitulo: missao.titulo,
        xpRecompensa: missao.xp,
        status: "pendente",
        data: serverTimestamp()
      });
      alert(`O relatório da missão "${missao.titulo}" foi enviado aos mestres!`);
    } catch (error) {
      alert("Falha na comunicação com o sistema.");
    }
  };

  const getIcon = (cat) => {
    if (cat === "Espiritual") return <ScrollText size={18} />;
    if (cat === "Física") return <Swords size={18} />;
    return <ShieldPlus size={18} />;
  };

  if (loading || !user) return null;

  return (
    <div className="container animate-slide-up">
      <header className="page-header">
        <button className="back-button" onClick={() => router.push("/dashboard")}>
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.5rem' }}>Quadro de Missões</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Tarefas diárias disponíveis</p>
        </div>
      </header>

      {loadingMissoes ? (
        <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-muted)' }}>Buscando missões no sistema...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {missoes.map(missao => (
            <div key={missao.id} className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`badge ${missao.categoria === 'Espiritual' ? 'badge-blue' : 'badge-green'}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {getIcon(missao.categoria)} {missao.categoria}
                  </span>
                </div>
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '4px 12px', borderRadius: '8px', color: 'var(--warning)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  +{missao.xp} XP
                </div>
              </div>
              
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: '#fff' }}>{missao.titulo}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '20px' }}>
                {missao.descricao}
              </p>
              
              <button className="btn-secondary" style={{ width: '100%', borderColor: 'rgba(59, 130, 246, 0.5)', color: '#60a5fa' }} onClick={() => entregarMissao(missao)}>
                REPORTAR CONCLUSÃO
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
