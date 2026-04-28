"use client";

import { useEffect, useRef } from "react";
import { initGame } from "./engine";
import { db } from "../lib/firebase";
import { doc, updateDoc, increment } from "firebase/firestore";
import toast from "react-hot-toast";

export default function GameContainer({ user }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      const game = initGame(containerRef.current, user, async (xpGained) => {
        try {
          await updateDoc(doc(db, "users", user.uid), {
            xp: increment(xpGained)
          });
          toast.success(`Masmorra concluída! +${xpGained} XP!`);
        } catch (e) {
          console.error("Erro ao salvar progresso", e);
        }
      });
      
      return () => {
        if (window.Crafty) {
          window.Crafty.stop();
        }
      };
    }
  }, [user]);

  return (
    <div 
      ref={containerRef} 
      id="cr-stage" 
      style={{ 
        width: '100%', 
        height: '100vh', 
        background: '#000',
        overflow: 'hidden',
        position: 'relative'
      }}
    />
  );
}
