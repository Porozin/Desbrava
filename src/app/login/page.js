"use client";

import { useAuth } from "../../lib/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Sparkles, KeyRound } from "lucide-react";

export default function LoginPage() {
  const { user, loginWithGoogle, loginCounselor, loginAsAdmin, registerCounselor, loading } = useAuth();
  const router = useRouter();

  const [showMasterLogin, setShowMasterLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [masterError, setMasterError] = useState("");

  useEffect(() => {
    if (user) {
      if (user.status === "pending_creation") {
        router.push("/criacao");
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, router]);

  const handleMasterRegister = async () => {
    setMasterError("");
    if (!username || !password) {
      setMasterError("Preencha email e senha para registrar.");
      return;
    }
    try {
      await registerCounselor(username, password);
      // O useEffect vai capturar a mudança de auth e jogar pra /criacao
    } catch (error) {
      console.error(error);
      setMasterError("Erro do Firebase: " + error.message);
    }
  };

  const handleMasterLogin = async (e) => {
    e.preventDefault();
    setMasterError("");
    
    // Check if it's the hardcoded admin
    if (loginAsAdmin(username, password)) {
      return; // Will redirect via useEffect
    }
    
    // Check if it's a counselor (Email/Password Firebase)
    try {
      await loginCounselor(username, password);
    } catch (error) {
      console.error(error);
      setMasterError("Erro do Firebase: " + error.message);
    }
  };

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
          background: showMasterLogin ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)', 
          padding: '20px', 
          borderRadius: '50%',
          marginBottom: '20px',
          boxShadow: showMasterLogin ? '0 0 30px rgba(239, 68, 68, 0.4)' : '0 0 30px var(--accent-glow)'
        }}>
          {showMasterLogin ? <KeyRound size={64} color="var(--danger)" /> : <Shield size={64} color="var(--accent-primary)" />}
        </div>

        <h1 style={{ marginBottom: '8px', fontSize: '2rem', color: '#fff', textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>
          {showMasterLogin ? "SISTEMA MESTRE" : "SISTEMA"}
        </h1>
        <p style={{ marginBottom: '30px', color: 'var(--text-muted)', fontSize: '0.9rem', letterSpacing: '0.05em' }}>
          {showMasterLogin ? "ACESSO RESTRITO" : "DESPERTAR DO AVENTUREIRO"}
        </p>
        
        {!showMasterLogin ? (
          <>
            <button className="btn-primary" onClick={loginWithGoogle} style={{ width: '100%', marginBottom: '20px' }}>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '20px', background: '#fff', borderRadius: '50%', padding: '2px' }}/>
              INICIAR SESSÃO
            </button>

            <button onClick={() => setShowMasterLogin(true)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}>
              Entrar como Mestre do Sistema
            </button>
          </>
        ) : (
          <form onSubmit={handleMasterLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input 
              type="text" 
              placeholder="Email ou Admin" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: '100%', padding: '14px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', outline: 'none' }}
            />
            <input 
              type="password" 
              placeholder="Senha" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '14px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', outline: 'none' }}
            />
            {masterError && <p style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{masterError}</p>}
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn-primary" style={{ flex: 1, background: 'linear-gradient(135deg, var(--danger), #991b1b)', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)' }}>
                AUTENTICAR
              </button>
            </div>

            <button type="button" onClick={handleMasterRegister} style={{ background: 'none', border: '1px solid rgba(239, 68, 68, 0.5)', color: 'var(--danger)', padding: '10px', borderRadius: '10px', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s' }}>
              Não possui conta? Registrar Mestre
            </button>

            <button type="button" onClick={() => setShowMasterLogin(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', cursor: 'pointer', marginTop: '10px' }}>
              Voltar para login de caçador
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
