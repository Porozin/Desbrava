"use client";

import { useAuth } from "../../lib/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Sparkles, KeyRound } from "lucide-react";

export default function LoginPage() {
  const { user, loginWithGoogle, loginCounselor, loginAsAdmin, registerUser, loading } = useAuth();
  const router = useRouter();

  const [showMasterLogin, setShowMasterLogin] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      if (user.status === "pending_creation") {
        router.push("/criacao");
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, router]);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("Preencha todos os campos.");
      return;
    }
    try {
      if (isRegistering) {
        await registerUser(username, password);
      } else {
        await loginCounselor(username, password);
      }
    } catch (error) {
      console.error(error);
      setError(error.message.includes("auth/user-not-found") ? "Usuário não encontrado." : "Erro na autenticação.");
    }
  };

  const handleMasterLogin = async (e) => {
    e.preventDefault();
    setError("");
    
    if (loginAsAdmin(username, password)) {
      return;
    }
    
    try {
      await loginCounselor(username, password);
    } catch (error) {
      console.error(error);
      setError("Falha no acesso mestre.");
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
        
        {!showMasterLogin && !showEmailLogin ? (
          <>
            <button className="btn-primary" onClick={loginWithGoogle} style={{ width: '100%', marginBottom: '12px' }}>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '20px', background: '#fff', borderRadius: '50%', padding: '2px' }}/>
              ENTRAR COM GOOGLE
            </button>

            <button className="btn-secondary" onClick={() => setShowEmailLogin(true)} style={{ width: '100%', marginBottom: '24px' }}>
              USAR EMAIL E SENHA
            </button>

            <button onClick={() => setShowMasterLogin(true)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}>
              Acesso Restrito do Mestre
            </button>
          </>
        ) : showEmailLogin ? (
          <form onSubmit={handleEmailAuth} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input 
              type="email" 
              placeholder="Seu Email" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: '100%', padding: '14px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', outline: 'none' }}
            />
            <input 
              type="password" 
              placeholder="Sua Senha" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '14px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', outline: 'none' }}
            />
            {error && <p style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{error}</p>}
            
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
              {isRegistering ? "CRIAR CONTA" : "ENTRAR"}
            </button>

            <button type="button" onClick={() => setIsRegistering(!isRegistering)} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.85rem', cursor: 'pointer' }}>
              {isRegistering ? "Já tem conta? Login" : "Novo aqui? Criar conta"}
            </button>

            <button type="button" onClick={() => setShowEmailLogin(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', cursor: 'pointer', marginTop: '10px' }}>
              Voltar
            </button>
          </form>
        ) : (
          <form onSubmit={handleMasterLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input 
              type="text" 
              placeholder="Admin ID" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: '100%', padding: '14px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', outline: 'none' }}
            />
            <input 
              type="password" 
              placeholder="Chave de Acesso" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '14px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', outline: 'none' }}
            />
            {error && <p style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{error}</p>}
            
            <button type="submit" className="btn-primary" style={{ width: '100%', background: 'linear-gradient(135deg, var(--danger), #991b1b)' }}>
              AUTENTICAR MESTRE
            </button>

            <button type="button" onClick={() => setShowMasterLogin(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', cursor: 'pointer', marginTop: '10px' }}>
              Voltar
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
