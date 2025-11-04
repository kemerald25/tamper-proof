import express, { Request, Response } from 'express';
import { Router } from 'express';
import { body } from 'express-validator';
import { verifyToken } from '../middleware/auth';
import {
  verifyRecord,
  getRecord,
  getStudentRecords,
  recordHashExists,
} from '../config/blockchain';
import logger from '../utils/logger';
import { AuthRequest } from '../types';

const router: Router = express.Router();

// Verify record on blockchain
router.post('/verify', verifyToken, [
  body('studentAddress').isEthereumAddress().withMessage('Invalid student address'),
  body('ipfsHash').notEmpty().withMessage('IPFS hash required'),
], async (req: AuthRequest, res: Response) => {
  try {
    const { studentAddress, ipfsHash } = req.body;

    const verified = await verifyRecord(studentAddress, ipfsHash);

    res.json({
      verified,
      studentAddress,
      ipfsHash,
      verifiedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Blockchain verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Get record from blockchain
router.get('/record/:studentAddress/:ipfsHash', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { studentAddress, ipfsHash } = req.params;

    const record = await getRecord(studentAddress, ipfsHash);

    res.json(record);
  } catch (error: any) {
    logger.error('Get record error:', error);
    res.status(500).json({ error: 'Failed to fetch record' });
  }
});

// Get all student records from blockchain
router.get('/student/:studentAddress', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { studentAddress } = req.params;

    const records = await getStudentRecords(studentAddress);

    res.json({ records });
  } catch (error: any) {
    logger.error('Get student records error:', error);
    res.status(500).json({ error: 'Failed to fetch student records' });
  }
});

// Check if record hash exists
router.get('/hash-exists/:ipfsHash', async (req: Request, res: Response) => {
  try {
    const { ipfsHash } = req.params;

    const exists = await recordHashExists(ipfsHash);

    res.json({ exists, ipfsHash });
  } catch (error: any) {
    logger.error('Hash exists check error:', error);
    res.status(500).json({ error: 'Failed to check hash' });
  }
});

export default router;

