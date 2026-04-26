"use client";

import { useAuth } from "../../lib/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Sparkles } from "lucide-react";

export default function LoginPage() {
  const { user, loginWithGoogle, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  if (loading) {
    return (
      <div className="container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="glass-card" style={{ padding: '30px', borderRadius: '50%' }}>
          <Sparkles className="animate-spin" size={32} color="var(--accent-primary)" />
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      
      <div className="glass-card animate-slide-up" style={{ padding: '40px 30px', textAlign: 'center', width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        <div style={{ 
          background: 'rgba(59, 130, 246, 0.1)', 
          padding: '20px', 
          borderRadius: '50%',
          marginBottom: '20px',
          boxShadow: '0 0 30px var(--accent-glow)'
        }}>
          <Shield size={64} color="var(--accent-primary)" />
        </div>

        <h1 style={{ marginBottom: '8px', fontSize: '2rem', color: '#fff', textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>
          SISTEMA
        </h1>
        <p style={{ marginBottom: '40px', color: 'var(--text-muted)', fontSize: '0.9rem', letterSpacing: '0.05em' }}>
          DESPERTAR DO AVENTUREIRO
        </p>
        
        <button className="btn-primary" onClick={loginWithGoogle} style={{ width: '100%' }}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '20px', background: '#fff', borderRadius: '50%', padding: '2px' }}/>
          INICIAR SESSÃO
        </button>

        <p style={{ marginTop: '20px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
          Somente guerreiros autorizados.
        </p>
      </div>
    </div>
  );
}
