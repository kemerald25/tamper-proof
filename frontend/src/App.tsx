import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { createConfig, WagmiProvider } from 'wagmi';
import { createAppKit } from '@reown/appkit';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, polygon } from 'wagmi/chains';
import { http } from 'wagmi';

// Import pages
import StudentPortal from './pages/StudentPortal';
import AdminPanel from './pages/AdminPanel';
import VerificationPortal from './pages/VerificationPortal';
import HomePage from './pages/HomePage';

// Import contexts
import { AuthProvider } from './contexts/AuthContext';

// Create Reown AppKit
const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || 'your-project-id';

const metadata = {
  name: 'Tamper-Proof Academic Records',
  description: 'Decentralized academic records management system',
  url: window.location.origin,
  icons: [`${window.location.origin}/favicon.ico`],
};

const chains = [mainnet, polygon] as const;

const wagmiAdapter = new WagmiAdapter({
  chains,
  projectId,
});

const wagmiConfig = createConfig({
  chains,
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
  },
  ...wagmiAdapter.wagmiAdapter,
});

createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  metadata,
  features: {
    analytics: true,
    email: false,
    socials: false,
    emailShowWallets: false,
  },
});

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/student/*" element={<StudentPortal />} />
                <Route path="/admin/*" element={<AdminPanel />} />
                <Route path="/verify/*" element={<VerificationPortal />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#4ade80',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 5000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </div>
          </Router>
        </AuthProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
};

export default App;

