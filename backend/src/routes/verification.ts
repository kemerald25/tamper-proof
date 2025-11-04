import express, { Request, Response } from 'express';
import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import supabase from '../config/database';
import { verifyRecord, getRecord, recordHashExists } from '../config/blockchain';
import logger from '../utils/logger';

const router: Router = express.Router();

// Public verification by student ID and hash
router.post('/verify', [
  body('studentId').notEmpty().withMessage('Student ID required'),
  body('recordHash').notEmpty().withMessage('Record hash required'),
], async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { studentId, recordHash } = req.body;

    // Get student
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get result from database
    const { data: result, error: resultError } = await supabase
      .from('results')
      .select('*')
      .eq('student_id', studentId)
      .eq('ipfs_hash', recordHash)
      .single();

    if (resultError || !result) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // Verify on blockchain
    let blockchainVerified = false;
    let blockchainRecord = null;

    try {
      blockchainVerified = await verifyRecord(
        student.wallet_address,
        recordHash
      );

      if (blockchainVerified) {
        blockchainRecord = await getRecord(
          student.wallet_address,
          recordHash
        );
      }
    } catch (error: any) {
      logger.error('Blockchain verification error:', error);
    }

    // Log verification request
    await supabase.from('verification_logs').insert({
      verifier_type: 'public',
      student_id: studentId,
      result_hash: recordHash,
      verification_outcome: blockchainVerified,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      created_at: new Date().toISOString(),
    });

    return res.json({
      verified: blockchainVerified,
      student: {
        id: student.id,
        fullName: student.full_name,
        matricNumber: student.matric_number,
        department: student.department,
      },
      record: {
        id: result.id,
        courseCode: result.course_code,
        courseTitle: result.course_title,
        grade: result.grade,
        creditUnits: result.credit_units,
        semester: result.semester,
        academicSession: result.academic_session,
        ipfsHash: result.ipfs_hash,
        blockchainTxHash: result.blockchain_tx_hash,
        blockchainConfirmed: result.blockchain_confirmed,
      },
      blockchainRecord,
      verificationTimestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Verification error:', error);
    return res.status(500).json({ error: 'Verification failed' });
  }
});

// Quick hash verification (check if hash exists on blockchain)
router.post('/verify-hash', [
  body('recordHash').notEmpty().withMessage('Record hash required'),
], async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { recordHash } = req.body;

    // Check if hash exists on blockchain
    const exists = await recordHashExists(recordHash);

    // Log verification request
    await supabase.from('verification_logs').insert({
      verifier_type: 'public',
      result_hash: recordHash,
      verification_outcome: exists,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      created_at: new Date().toISOString(),
    });

    return res.json({
      exists,
      recordHash,
      verificationTimestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Hash verification error:', error);
    return res.status(500).json({ error: 'Verification failed' });
  }
});

// Get verification certificate
router.get('/certificate/:studentId/:recordHash', async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { studentId, recordHash } = req.params;

    // Get student
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get result
    const { data: result, error: resultError } = await supabase
      .from('results')
      .select('*')
      .eq('student_id', studentId)
      .eq('ipfs_hash', recordHash)
      .single();

    if (resultError || !result) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // Verify on blockchain
    let blockchainVerified = false;
    let blockchainRecord = null;

    try {
      blockchainVerified = await verifyRecord(
        student.wallet_address,
        recordHash
      );

      if (blockchainVerified) {
        blockchainRecord = await getRecord(
          student.wallet_address,
          recordHash
        );
      }
    } catch (error: any) {
      logger.error('Blockchain verification error:', error);
    }

    // Generate certificate data
    const certificate = {
      verified: blockchainVerified,
      student: {
        fullName: student.full_name,
        matricNumber: student.matric_number,
        department: student.department,
        faculty: student.faculty,
      },
      record: {
        courseCode: result.course_code,
        courseTitle: result.course_title,
        grade: result.grade,
        creditUnits: result.credit_units,
        semester: result.semester,
        academicSession: result.academic_session,
      },
      blockchain: {
        ipfsHash: result.ipfs_hash,
        txHash: result.blockchain_tx_hash,
        blockNumber: result.blockchain_block_number,
        timestamp: blockchainRecord?.timestamp || result.created_at,
      },
      verificationDate: new Date().toISOString(),
      institution: 'University of Benin',
      certificateId: `TAMPER-PROOF-${studentId}-${recordHash.substring(0, 8)}`,
    };

    return res.json(certificate);
  } catch (error: any) {
    logger.error('Certificate generation error:', error);
    return res.status(500).json({ error: 'Failed to generate certificate' });
  }
});

export default router;

