import express, { Request, Response } from 'express';
import { Router } from 'express';
import { validationResult } from 'express-validator';
import supabase from '../config/database';
import { verifyToken, requireStudent } from '../middleware/auth';
import { verifyRecord, getRecord, getStudentRecords } from '../config/blockchain';
import { getRedisClient } from '../config/redis';
import logger from '../utils/logger';
import { AuthRequest } from '../types';

const router: Router = express.Router();

// Get student dashboard data
router.get('/dashboard', verifyToken, requireStudent, async (req: AuthRequest, res: Response) => {
  try {
    const student = req.student || req.user;

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get student records from database
    const { data: results, error } = await supabase
      .from('results')
      .select('*')
      .eq('student_id', student.studentId || student.id)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch records' });
    }

    // Verify each record on blockchain
    const verifiedResults = await Promise.all(
      (results || []).map(async (result: any) => {
        try {
          const isVerified = await verifyRecord(
            student.walletAddress || student.wallet_address || '',
            result.ipfs_hash
          );
          return {
            ...result,
            blockchainVerified: isVerified,
          };
        } catch (error: any) {
          logger.error('Blockchain verification error:', error);
          return {
            ...result,
            blockchainVerified: false,
          };
        }
      })
    );

    res.json({
      student: {
        id: student.id || student.studentId,
        fullName: student.full_name,
        matricNumber: student.matric_number,
        department: student.department,
        level: student.level,
      },
      results: verifiedResults,
      totalRecords: verifiedResults.length,
    });
  } catch (error: any) {
    logger.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// Get student records
router.get('/records', verifyToken, requireStudent, async (req: AuthRequest, res: Response) => {
  try {
    const student = req.student || req.user;
    const { page = '1', limit = '20', semester, session } = req.query;

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    let query = supabase
      .from('results')
      .select('*')
      .eq('student_id', student.studentId || student.id);

    if (semester) {
      query = query.eq('semester', semester as string);
    }

    if (session) {
      query = query.eq('academic_session', session as string);
    }

    const { data: results, error, count } = await query
      .order('created_at', { ascending: false })
      .range((parseInt(page as string) - 1) * parseInt(limit as string), parseInt(page as string) * parseInt(limit as string) - 1);

    if (error) {
      logger.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch records' });
    }

    res.json({
      results: results || [],
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: count || (results?.length || 0),
      },
    });
  } catch (error: any) {
    logger.error('Get records error:', error);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

// Get specific record
router.get('/records/:recordId', verifyToken, requireStudent, async (req: AuthRequest, res: Response) => {
  try {
    const { recordId } = req.params;
    const student = req.student || req.user;

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get record from database
    const { data: result, error } = await supabase
      .from('results')
      .select('*')
      .eq('id', recordId)
      .eq('student_id', student.studentId || student.id)
      .single();

    if (error || !result) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // Verify on blockchain
    let blockchainVerified = false;
    let blockchainRecord = null;

    try {
      blockchainVerified = await verifyRecord(
        student.walletAddress || student.wallet_address || '',
        result.ipfs_hash
      );

      if (blockchainVerified) {
        blockchainRecord = await getRecord(
          student.walletAddress || student.wallet_address || '',
          result.ipfs_hash
        );
      }
    } catch (error: any) {
      logger.error('Blockchain verification error:', error);
    }

    res.json({
      ...result,
      blockchainVerified,
      blockchainRecord,
    });
  } catch (error: any) {
    logger.error('Get record error:', error);
    res.status(500).json({ error: 'Failed to fetch record' });
  }
});

// Get blockchain records for student
router.get('/blockchain/records', verifyToken, requireStudent, async (req: AuthRequest, res: Response) => {
  try {
    const student = req.student || req.user;
    const walletAddress = student?.walletAddress || student?.wallet_address;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address not found' });
    }

    // Check cache first
    const redis = getRedisClient();
    const cacheKey = `student:records:${walletAddress}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Get from blockchain
    const records = await getStudentRecords(walletAddress);

    // Cache for 5 minutes
    await redis.setEx(cacheKey, 300, JSON.stringify(records));

    res.json({ records });
  } catch (error: any) {
    logger.error('Get blockchain records error:', error);
    res.status(500).json({ error: 'Failed to fetch blockchain records' });
  }
});

// Verify record
router.post('/records/:recordId/verify', verifyToken, requireStudent, async (req: AuthRequest, res: Response) => {
  try {
    const { recordId } = req.params;
    const student = req.student || req.user;

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get record from database
    const { data: result, error } = await supabase
      .from('results')
      .select('*')
      .eq('id', recordId)
      .eq('student_id', student.studentId || student.id)
      .single();

    if (error || !result) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // Verify on blockchain
    const verified = await verifyRecord(
      student.walletAddress || student.wallet_address || '',
      result.ipfs_hash
    );

    // Log verification
    await supabase.from('verification_logs').insert({
      verifier_type: 'student',
      student_id: student.id || student.studentId,
      result_hash: result.ipfs_hash,
      verification_outcome: verified,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      created_at: new Date().toISOString(),
    });

    res.json({
      verified,
      recordId: result.id,
      ipfsHash: result.ipfs_hash,
      blockchainTxHash: result.blockchain_tx_hash,
    });
  } catch (error: any) {
    logger.error('Verify record error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Get student profile
router.get('/profile', verifyToken, requireStudent, async (req: AuthRequest, res: Response) => {
  try {
    const student = req.student || req.user;

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const { data: profile, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', student.studentId || student.id)
      .single();

    if (error || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Remove sensitive data
    const { password_hash, ...safeProfile } = profile as any;

    res.json(safeProfile);
  } catch (error: any) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;

