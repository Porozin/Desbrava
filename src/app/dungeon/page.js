"use client";

import { useAuth } from "../../lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import DungeonGame from "../../game/DungeonGame";
import { db } from "../../lib/firebase";
import { doc, updateDoc, increment } from "firebase/firestore";
import toast from "react-hot-toast";
import { ChevronLeft } from "lucide-react";

export default function DungeonPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) return null;

  const handleFinish = async (xp) => {
    try {
      await updateDoc(doc(db, "users", user.uid), { xp: increment(xp) });
      toast.success(`+${xp} XP conquistado!`);
    } catch (e) {
      console.error("Erro ao salvar XP", e);
    }
  };

  return (
    <div style={{ width: "100vw", height: "100dvh", overflow: "hidden", position: "relative", background: "#000" }}>
      {/* Botão Abandonar */}
      <button
        onClick={() => {
          if (confirm("Abandonar a masmorra? O progresso será perdido.")) router.push("/dashboard");
        }}
        style={{
          position: "absolute", top: 16, right: 16, zIndex: 9999,
          background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)",
          color: "#fff", padding: "8px 14px", borderRadius: "12px",
          display: "flex", alignItems: "center", gap: "6px",
          cursor: "pointer", fontSize: "13px", fontWeight: "700",
          backdropFilter: "blur(8px)"
        }}
      >
        <ChevronLeft size={16} />
        SAIR
      </button>

      <DungeonGame user={user} onFinish={handleFinish} />
    </div>
  );
}
