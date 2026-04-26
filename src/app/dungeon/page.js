"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/AuthContext";
import { db } from "../../lib/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { ChevronLeft, Skull } from "lucide-react";

export default function DungeonPage() {
  const { user, loading } = useAuth();
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
        if (data.resultado === "APROVADO") {
          statusEntrega = "aprovada";
          alertMessage = "A Estátua Mágica brilhou! Sua resposta foi APROVADA automaticamente. +200 XP!";
          // Add XP
          await updateDoc(doc(db, "users", user.uid), { xp: increment(200) });
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
        data: serverTimestamp()
      });
      alert(alertMessage);
      router.push("/dashboard");
    } catch (error) {
      alert("Falha na magia de comunicação.");
    }
    setEnviando(false);
  };

  if (loading || !user) return null;

  const currentStep = historia[step];

  return (
    <div className="container animate-slide-up" style={{ minHeight: '100vh', background: 'radial-gradient(circle at center, #1e1b4b, #000)' }}>
      <header className="page-header" style={{ marginBottom: '40px' }}>
        <button className="back-button" onClick={() => router.push("/dashboard")}>
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.5rem', background: 'linear-gradient(90deg, #db2777, #7e22ce)', WebkitBackgroundClip: 'text' }}>Masmorra Semanal</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Evento Especial</p>
        </div>
      </header>

      <div className="glass-card" style={{ padding: '30px', borderTop: '2px solid #db2777', boxShadow: '0 10px 40px rgba(219, 39, 119, 0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <Skull size={48} color="#db2777" />
        </div>
        
        <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#e2e8f0', marginBottom: '30px', fontStyle: 'italic', textAlign: 'center' }}>
          "{currentStep.texto}"
        </p>

        {!currentStep.isFinal ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {currentStep.escolhas.map((escolha, idx) => (
              <button 
                key={idx} 
                className="btn-secondary" 
                style={{ borderColor: '#7e22ce', color: '#e9d5ff' }}
                onClick={() => setStep(escolha.proximoStep)}
              >
                {escolha.texto}
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={finalizarDungeon}>
            <textarea 
              autoFocus
              rows={4}
              placeholder="Digite sua resposta aqui..."
              value={respostaDungeon}
              onChange={(e) => setRespostaDungeon(e.target.value)}
              style={{ width: '100%', padding: '16px', background: 'rgba(0,0,0,0.5)', border: '1px solid #7e22ce', borderRadius: '10px', color: '#fff', outline: 'none', marginBottom: '20px', resize: 'vertical' }}
            />
            <button type="submit" className="btn-primary" disabled={enviando} style={{ width: '100%', background: 'linear-gradient(135deg, #db2777, #7e22ce)' }}>
              {enviando ? "SELANDO MAGIA..." : "OFERECER RESPOSTA"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
