"use client";

import { useEffect, useRef } from "react";
import { initGame } from "./engine";

export default function GameContainer({ user }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      const game = initGame(containerRef.current, user);
      
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
