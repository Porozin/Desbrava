import '../styles/globals.css';
import { AuthProvider } from '../lib/AuthContext';

export const metadata = {
  title: 'Desbravadores - Missões',
  description: 'Plataforma de gamificação para Desbravadores',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
