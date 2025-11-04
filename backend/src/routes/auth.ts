import express, { Request, Response } from 'express';
import { Router } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import supabase from '../config/database';
import { verifyWalletSignature } from '../middleware/auth';
import logger from '../utils/logger';
import { AuthRequest } from '../types';

const router: Router = express.Router();

// Generate JWT token
const generateToken = (payload: object): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn } as SignOptions);
};

// Student wallet authentication
router.post('/wallet/login', [
  body('address').isEthereumAddress().withMessage('Invalid wallet address'),
  body('signature').notEmpty().withMessage('Signature required'),
  body('message').notEmpty().withMessage('Message required'),
], verifyWalletSignature, async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { address } = req.body;

    // Check if student exists
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('wallet_address', address.toLowerCase())
      .single();

    if (error || !student) {
      return res.status(404).json({ error: 'Student not found. Please register first.' });
    }

    // Generate token
    const token = generateToken({
      walletAddress: address.toLowerCase(),
      studentId: student.id,
      type: 'student',
    });

    return res.json({
      token,
      student: {
        id: student.id,
        walletAddress: student.wallet_address,
        fullName: student.full_name,
        matricNumber: student.matric_number,
      },
    });
  } catch (error: any) {
    logger.error('Wallet login error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
});

// Admin login
router.post('/admin/login', [
  body('username').notEmpty().withMessage('Username required'),
  body('password').notEmpty().withMessage('Password required'),
], async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // Get admin from database
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('username', username)
      .eq('active', true)
      .single();

    if (error || !admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await supabase
      .from('admins')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id);

    // Generate token
    const token = generateToken({
      adminId: admin.id,
      username: admin.username,
      role: admin.role,
      type: 'admin',
    });

    return res.json({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        fullName: admin.full_name,
        role: admin.role,
      },
    });
  } catch (error: any) {
    logger.error('Admin login error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
});

// Admin registration (only for initial setup)
router.post('/admin/register', [
  body('username').notEmpty().withMessage('Username required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('fullName').notEmpty().withMessage('Full name required'),
  body('role').isIn(['faculty', 'department_head', 'registry_staff']).withMessage('Invalid role'),
], async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, fullName, role, faculty, department, walletAddress } = req.body;

    // Check if username already exists
    const { data: existingAdmin } = await supabase
      .from('admins')
      .select('id')
      .eq('username', username)
      .single();

    if (existingAdmin) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin
    const { data: admin, error } = await supabase
      .from('admins')
      .insert({
        username,
        password_hash: passwordHash,
        full_name: fullName,
        role,
        faculty: faculty || null,
        department: department || null,
        wallet_address: walletAddress || null,
        active: true,
        permissions: [],
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Admin registration error:', error);
      return res.status(500).json({ error: 'Failed to create admin account' });
    }

    // Generate token
    const token = generateToken({
      adminId: admin.id,
      username: admin.username,
      role: admin.role,
      type: 'admin',
    });

    return res.status(201).json({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        fullName: admin.full_name,
        role: admin.role,
      },
    });
  } catch (error: any) {
    logger.error('Admin registration error:', error);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

// Refresh token
router.post('/refresh', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as jwt.JwtPayload;
    const newToken = generateToken({
      ...decoded,
      iat: undefined,
      exp: undefined,
    });

    return res.json({ token: newToken });
  } catch (error: any) {
    logger.error('Token refresh error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// Generate wallet authentication message
router.post('/wallet/message', [
  body('address').isEthereumAddress().withMessage('Invalid wallet address'),
], async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { address } = req.body;

    // Generate unique message for signing
    const message = `Please sign this message to authenticate with Tamper-Proof Academic Records System.\n\nWallet: ${address}\nTimestamp: ${Date.now()}`;

    return res.json({ message });
  } catch (error: any) {
    logger.error('Message generation error:', error);
    return res.status(500).json({ error: 'Failed to generate message' });
  }
});

export default router;

