"use client";

import { useAuth } from "../../lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import DungeonGame from "../../game/DungeonGame";
import { db } from "../../lib/firebase";
import { doc, updateDoc, increment } from "firebase/firestore";
import toast from "react-hot-toast";

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
    <div style={{ width: "100vw", height: "100dvh", overflow: "hidden", background: "#000" }}>
      <DungeonGame user={user} onFinish={handleFinish} />
    </div>
  );
}
