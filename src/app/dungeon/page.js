"use client";

import { useAuth } from "../../lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import GameContainer from "../../game/GameContainer";
import { ChevronLeft } from "lucide-react";

export default function DungeonPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', overflow: 'hidden' }}>
      {/* HUD de Saída (Overlay) */}
      <button 
        onClick={() => {
          if (confirm("Deseja mesmo abandonar a masmorra? Todo progresso será perdido.")) {
            router.push("/dashboard");
          }
        }}
        style={{ 
          position: 'absolute', 
          top: '20px', 
          left: '20px', 
          zIndex: 100,
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff',
          padding: '8px 12px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer'
        }}
      >
        <ChevronLeft size={18} />
        ABANDONAR
      </button>

      <GameContainer user={user} />
    </div>
  );
}
