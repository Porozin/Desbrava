"use client";

import { useAuth } from "../../lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import GameContainer from "../../game/GameContainer";
import { ChevronLeft } from "lucide-react";
import Script from "next/script";

export default function DungeonPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [craftyLoaded, setCraftyLoaded] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', overflow: 'hidden' }}>
      <Script 
        src="https://cdn.jsdelivr.net/gh/craftyjs/Crafty@release/dist/crafty-min.js" 
        onLoad={() => setCraftyLoaded(true)}
      />

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

      {craftyLoaded ? (
        <GameContainer user={user} />
      ) : (
        <div style={{ color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          Invocando a Masmorra...
        </div>
      )}
    </div>
  );
}
