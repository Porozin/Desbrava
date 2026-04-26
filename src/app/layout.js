import '../styles/globals.css';
import { AuthProvider } from '../lib/AuthContext';

export const metadata = {
  title: 'Desbravadores - Missões',
  description: 'Plataforma de gamificação para Desbravadores',
};

import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          {children}
          <Toaster 
            position="top-center" 
            toastOptions={{ 
              style: { 
                background: '#1e293b', 
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)'
              } 
            }} 
          />
        </AuthProvider>
      </body>
    </html>
  );
}
