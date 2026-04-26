"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/AuthContext";
import { db } from "../../lib/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from "firebase/firestore";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { ChevronLeft, Skull } from "lucide-react";

export default function DungeonPage() {
  const { user, loading, updateUserData } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [respostaDungeon, setRespostaDungeon] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  // História simples mockada (poderia vir do banco no futuro)
  const historia = [
    {
      texto: "Os portões da Caverna do Desespero se fecham atrás de você. A escuridão é densa, mas você percebe duas passagens. A da esquerda emana um brilho celestial, a da direita cheira a enxofre. Qual caminho você escolhe?",
      escolhas: [
        { texto: "Caminho da Esquerda (Luz)", proximoStep: 1 },
        { texto: "Caminho da Direita (Sombra)", proximoStep: 2 }
      ]
    },
    {
      texto: "Você segue pela luz. No fim do túnel, encontra uma estátua antiga segurando um pergaminho. O pergaminho pergunta: 'Qual é o maior mandamento da lei?'",
      escolhas: [
        { texto: "Responder o pergaminho", proximoStep: 3 }
      ]
    },
    {
      texto: "A sombra te enganou. Você escorrega em um fosso lodoso, perdendo muito tempo, mas consegue se arrastar até uma sala iluminada onde repousa um pergaminho mágico que te pergunta: 'Qual é o maior mandamento da lei?'",
      escolhas: [
        { texto: "Responder o pergaminho", proximoStep: 3 }
      ]
    },
    {
      texto: "A estátua aguarda a sua sabedoria. Escreva a sua resposta com as suas palavras.",
      isFinal: true
    }
  ];

  const finalizarDungeon = async (e) => {
    e.preventDefault();
    if (!respostaDungeon.trim()) return alert("Você não pode escapar sem responder!");
    setEnviando(true);

    try {
      let statusEntrega = "pendente";
      let alertMessage = "Sua sabedoria ecoou pela masmorra. O Mestre julgará sua resposta!";
      let iaFeedback = null;

      // AI Validation for Dungeon
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missaoDescricao: "Responder qual é o maior mandamento da lei (Amar a Deus sobre todas as coisas e ao próximo como a si mesmo).",
          provaTexto: respostaDungeon
        })
      });

      if (res.ok) {
        const data = await res.json();
        iaFeedback = data.rawText;
        if (data.resultado === "APROVADO") {
          statusEntrega = "aprovada";
          alertMessage = "A Estátua Mágica brilhou! Sua resposta foi APROVADA automaticamente. +200 XP!";
          // Add XP no banco e na tela
          await updateDoc(doc(db, "users", user.uid), { xp: increment(200) });
          updateUserData({ xp: (user.xp || 0) + 200 });
        } else {
          statusEntrega = "pendente"; // Goes to human analysis
          alertMessage = "A Estátua silenciou. Os Mestres julgarão se suas palavras são dignas.";
        }
      }

      await addDoc(collection(db, "entregas"), {
        userId: user.uid,
        userName: user.displayName,
        missaoId: "dungeon_semanal",
        missaoTitulo: "Masmorra Semanal: A Caverna do Desespero",
        xpRecompensa: 200,
        provaTexto: respostaDungeon,
        status: statusEntrega,
        iaFeedback: iaFeedback,
        data: serverTimestamp()
      });
      toast.success(alertMessage, { duration: 5000 });
      router.push("/dashboard");
    } catch (error) {
      toast.error("Falha na magia de comunicação.");
    }
    setEnviando(false);
  };

  if (loading || !user) return null;

  return (
    <div className="container animate-slide-up" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="page-header" style={{ marginBottom: '20px' }}>
        <button className="back-button" onClick={() => router.push("/dashboard")}>
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.4rem', color: '#f87171' }}>Masmorra Semanal</h1>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)' }}>
            <Skull size={40} />
          </div>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#fff' }}>A Caverna do Desespero</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
            {historia[step].texto}
          </p>
        </div>

        {historia[step].isFinal ? (
          <form onSubmit={finalizarDungeon} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <textarea 
              rows={4}
              required
              placeholder="Escreva sua resposta..."
              value={respostaDungeon}
              onChange={e => setRespostaDungeon(e.target.value)}
              style={{ width: '100%', padding: '15px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', color: '#fff', resize: 'vertical', outline: 'none' }}
            />
            <button type="submit" className="btn-primary" style={{ background: 'linear-gradient(90deg, #ef4444, #b91c1c)' }} disabled={enviando}>
              {enviando ? "ENVIANDO..." : "ENFRENTAR A ESTÁTUA"}
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {historia[step].escolhas.map((escolha, index) => (
              <button 
                key={index}
                className="btn-secondary" 
                style={{ width: '100%', padding: '16px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '1rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={() => setStep(escolha.proximoStep)}
              >
                {escolha.texto}
                <ChevronLeft size={20} style={{ transform: 'rotate(180deg)', color: 'var(--text-muted)' }}/>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
