import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useAccount, useDisconnect } from 'wagmi';
import toast from 'react-hot-toast';

interface User {
  id?: string;
  walletAddress?: string;
  studentId?: string;
  adminId?: string;
  username?: string;
  fullName?: string;
  matricNumber?: string;
  role?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  handleWalletLogin: (walletAddress: string) => Promise<void>;
  adminLogin: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    // Check if user is already authenticated
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // Auto-login if wallet is connected
    if (isConnected && address && !user) {
      handleWalletLogin(address);
    }
  }, [isConnected, address]);

  const verifyToken = async (): Promise<void> => {
    try {
      const response = await axios.get(`${API_URL}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data.user);
    } catch (error) {
      // Token invalid, clear it
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleWalletLogin = async (walletAddress: string): Promise<void> => {
    try {
      setLoading(true);

      // Generate message for signing
      const messageResponse = await axios.post(`${API_URL}/auth/wallet/message`, {
        address: walletAddress,
      });

      const message = messageResponse.data.message;

      // Request signature from wallet (this would be done via Reown/WalletConnect)
      // For now, we'll use a placeholder - in production, this would be handled by the wallet
      const signature = await requestWalletSignature(message);

      // Login with signature
      const response = await axios.post(`${API_URL}/auth/wallet/login`, {
        address: walletAddress,
        signature,
        message,
      });

      const { token: newToken, student } = response.data;
      setToken(newToken);
      setUser(student);
      localStorage.setItem('token', newToken);
      toast.success('Successfully connected!');
    } catch (error: any) {
      console.error('Wallet login error:', error);
      toast.error(error.response?.data?.error || 'Failed to connect wallet');
      disconnect();
    } finally {
      setLoading(false);
    }
  };

  const requestWalletSignature = async (message: string): Promise<string> => {
    // This would be implemented with Reown/WalletConnect
    // For now, return a placeholder
    // In production, use the wallet provider to sign the message
    return new Promise((resolve, reject) => {
      // Placeholder - implement actual wallet signing
      reject(new Error('Wallet signing not implemented'));
    });
  };

  const adminLogin = async (username: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/auth/admin/login`, {
        username,
        password,
      });

      const { token: newToken, admin } = response.data;
      setToken(newToken);
      setUser(admin);
      localStorage.setItem('token', newToken);
      toast.success('Successfully logged in!');
    } catch (error: any) {
      console.error('Admin login error:', error);
      toast.error(error.response?.data?.error || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = (): void => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    if (isConnected) {
      disconnect();
    }
    toast.success('Logged out successfully');
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    handleWalletLogin,
    adminLogin,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

