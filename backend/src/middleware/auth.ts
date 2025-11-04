import { Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { ethers } from 'ethers';
import supabase from '../config/database';
import logger from '../utils/logger';
import { AuthRequest } from '../types';

// Verify JWT token
export const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as JwtPayload;
    req.user = decoded as AuthRequest['user'];
    next();
  } catch (error) {
    logger.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Verify wallet signature
export const verifyWalletSignature = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { address, signature, message } = req.body;

    if (!address || !signature || !message) {
      res.status(400).json({ error: 'Missing wallet authentication data' });
      return;
    }

    // Recover address from signature
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    req.walletAddress = address;
    next();
  } catch (error) {
    logger.error('Wallet signature verification error:', error);
    res.status(401).json({ error: 'Signature verification failed' });
  }
};

// Check if user is admin
export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || !req.user.adminId) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    // Check admin status in database
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('id', req.user.adminId)
      .eq('active', true)
      .single();

    if (error || !admin) {
      res.status(403).json({ error: 'Invalid or inactive admin account' });
      return;
    }

    req.admin = admin;
    next();
  } catch (error) {
    logger.error('Admin check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Check if user is student
export const requireStudent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const walletAddress = req.walletAddress || req.user?.walletAddress;

    if (!walletAddress) {
      res.status(401).json({ error: 'Student wallet address required' });
      return;
    }

    // Check student exists
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single();

    if (error || !student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    req.student = student;
    next();
  } catch (error) {
    logger.error('Student check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Role-based access control
export const requireRole = (...roles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.admin) {
        res.status(403).json({ error: 'Admin access required' });
        return;
      }

      if (!roles.includes(req.admin.role)) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }

      next();
    } catch (error) {
      logger.error('Role check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

