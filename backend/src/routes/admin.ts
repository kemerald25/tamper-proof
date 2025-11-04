import express, { Request, Response } from 'express';
import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';
import * as crypto from 'crypto';
import supabase from '../config/database';
import { verifyToken, requireAdmin, requireRole } from '../middleware/auth';
import { uploadToIPFS } from '../config/ipfs';
import { submitRecord, batchSubmitRecords } from '../config/blockchain';
import { getRedisClient } from '../config/redis';
import logger from '../utils/logger';
import { AuthRequest } from '../types';
import { Server as SocketIOServer } from 'socket.io';

const router: Router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// Get admin dashboard
router.get('/dashboard', verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const admin = req.admin;

    if (!admin) {
      return res.status(403).json({ error: 'Admin not found' });
    }

    // Get statistics
    const { count: totalStudents } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });

    const { count: totalResults } = await supabase
      .from('results')
      .select('*', { count: 'exact', head: true });

    const { count: pendingResults } = await supabase
      .from('results')
      .select('*', { count: 'exact', head: true })
      .eq('blockchain_confirmed', false);

    const { data: recentResults } = await supabase
      .from('results')
      .select('*, students(full_name, matric_number)')
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({
      admin: {
        id: admin.id,
        username: admin.username,
        fullName: admin.full_name,
        role: admin.role,
      },
      statistics: {
        totalStudents,
        totalResults,
        pendingResults,
      },
      recentResults,
    });
  } catch (error: any) {
    logger.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// Search students
router.get('/students/search', verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { query, department, level } = req.query;

    let dbQuery = supabase.from('students').select('*');

    if (query) {
      dbQuery = dbQuery.or(
        `full_name.ilike.%${query}%,matric_number.ilike.%${query}%,wallet_address.ilike.%${query}%`
      );
    }

    if (department) {
      dbQuery = dbQuery.eq('department', department as string);
    }

    if (level) {
      dbQuery = dbQuery.eq('level', parseInt(level as string));
    }

    const { data: students, error } = await dbQuery.limit(50);

    if (error) {
      logger.error('Search error:', error);
      return res.status(500).json({ error: 'Search failed' });
    }

    res.json({ students: students || [] });
  } catch (error: any) {
    logger.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Upload single result
router.post('/results/upload', [
  verifyToken,
  requireAdmin,
  requireRole('faculty', 'department_head', 'registry_staff'),
  body('studentId').notEmpty().withMessage('Student ID required'),
  body('courseCode').notEmpty().withMessage('Course code required'),
  body('courseTitle').notEmpty().withMessage('Course title required'),
  body('grade').notEmpty().withMessage('Grade required'),
  body('creditUnits').isInt({ min: 1 }).withMessage('Credit units required'),
  body('semester').notEmpty().withMessage('Semester required'),
  body('academicSession').notEmpty().withMessage('Academic session required'),
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const admin = req.admin;
    if (!admin) {
      return res.status(403).json({ error: 'Admin not found' });
    }

    const {
      studentId,
      courseCode,
      courseTitle,
      grade,
      creditUnits,
      semester,
      academicSession,
    } = req.body;

    // Get student
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Create result document
    const resultData = {
      course_code: courseCode,
      course_title: courseTitle,
      grade,
      credit_units: creditUnits,
      semester,
      academic_session: academicSession,
    };

    // Calculate grade point
    const gradePoints: { [key: string]: number } = {
      A: 5.0, B: 4.0, C: 3.0, D: 2.0, E: 1.0, F: 0.0,
    };
    const gradePoint = gradePoints[grade.toUpperCase()] || 0;

    // Create metadata hash
    const metadataString = JSON.stringify(resultData);
    const metadataHash = crypto.createHash('sha256').update(metadataString).digest('hex');

    // Upload to IPFS
    const resultDocument = JSON.stringify(resultData);
    const ipfsHash = await uploadToIPFS(
      Buffer.from(resultDocument),
      `result-${studentId}-${courseCode}-${Date.now()}.json`
    );

    // Insert into database first
    const { data: result, error: dbError } = await supabase
      .from('results')
      .insert({
        student_id: studentId,
        course_code: courseCode,
        course_title: courseTitle,
        grade,
        grade_point: gradePoint,
        credit_units: creditUnits,
        semester,
        academic_session: academicSession,
        ipfs_hash: ipfsHash,
        metadata_hash: metadataHash,
        faculty_id: admin.id,
        blockchain_confirmed: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError || !result) {
      logger.error('Database insert error:', dbError);
      return res.status(500).json({ error: 'Failed to save result' });
    }

    // Submit to blockchain asynchronously
    submitRecord(
      student.wallet_address,
      ipfsHash,
      metadataHash
    ).then((txResult) => {
      // Update database with transaction hash
      supabase
        .from('results')
        .update({
          blockchain_tx_hash: txResult.txHash,
          blockchain_confirmed: txResult.status === 'confirmed',
          blockchain_block_number: txResult.blockNumber,
          updated_at: new Date().toISOString(),
        })
        .eq('id', result.id);

      // Emit WebSocket event
      const io = req.app.get('io') as SocketIOServer;
      if (io) {
        io.to(`tx-${txResult.txHash}`).emit('transaction-update', txResult);
      }
    }).catch((error: any) => {
      logger.error('Blockchain submission error:', error);
    });

    // Log audit trail
    await supabase.from('audit_trail').insert({
      actor: admin.id,
      actor_type: 'admin',
      action_type: 'upload',
      affected_records: JSON.stringify([result.id]),
      transaction_details: JSON.stringify({ ipfsHash, metadataHash }),
      status: 'pending',
      created_at: new Date().toISOString(),
    });

    res.status(201).json({
      result,
      message: 'Result uploaded successfully. Blockchain submission in progress.',
    });
  } catch (error: any) {
    logger.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload result' });
  }
});

// Batch upload results from CSV
router.post('/results/batch-upload', [
  verifyToken,
  requireAdmin,
  requireRole('faculty', 'department_head', 'registry_staff'),
  upload.single('csvFile'),
], async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'CSV file required' });
    }

    const admin = req.admin;
    if (!admin) {
      return res.status(403).json({ error: 'Admin not found' });
    }

    const results: any[] = [];
    const errors: any[] = [];

    // Parse CSV
    const readable = new Readable();
    readable.push(req.file.buffer);
    readable.push(null);

    await new Promise((resolve, reject) => {
      readable
        .pipe(csv())
        .on('data', (row: any) => {
          results.push(row);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    if (results.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty' });
    }

    // Process each result
    const processedResults: any[] = [];
    const studentAddresses: string[] = [];
    const ipfsHashes: string[] = [];
    const metadataHashes: string[] = [];

    for (const row of results) {
      try {
        // Validate row
        if (!row.studentId || !row.courseCode || !row.grade) {
          errors.push({ row, error: 'Missing required fields' });
          continue;
        }

        // Get student
        const { data: student } = await supabase
          .from('students')
          .select('*')
          .eq('id', row.studentId)
          .single();

        if (!student) {
          errors.push({ row, error: 'Student not found' });
          continue;
        }

        // Create result data
        const resultData = {
          course_code: row.courseCode,
          course_title: row.courseTitle || '',
          grade: row.grade,
          credit_units: parseInt(row.creditUnits) || 0,
          semester: row.semester || '',
          academic_session: row.academicSession || '',
        };

        const metadataString = JSON.stringify(resultData);
        const metadataHash = crypto.createHash('sha256').update(metadataString).digest('hex');

        // Upload to IPFS
        const resultDocument = JSON.stringify(resultData);
        const ipfsHash = await uploadToIPFS(
          Buffer.from(resultDocument),
          `result-${row.studentId}-${row.courseCode}-${Date.now()}.json`
        );

        // Insert into database
        const gradePoints: { [key: string]: number } = { A: 5.0, B: 4.0, C: 3.0, D: 2.0, E: 1.0, F: 0.0 };
        const gradePoint = gradePoints[row.grade.toUpperCase()] || 0;

        const { data: result } = await supabase
          .from('results')
          .insert({
            student_id: row.studentId,
            course_code: row.courseCode,
            course_title: row.courseTitle || '',
            grade: row.grade,
            grade_point: gradePoint,
            credit_units: parseInt(row.creditUnits) || 0,
            semester: row.semester || '',
            academic_session: row.academicSession || '',
            ipfs_hash: ipfsHash,
            metadata_hash: metadataHash,
            faculty_id: admin.id,
            blockchain_confirmed: false,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (result) {
          processedResults.push(result);
          studentAddresses.push(student.wallet_address);
          ipfsHashes.push(ipfsHash);
          metadataHashes.push(metadataHash);
        }
      } catch (error: any) {
        logger.error('Row processing error:', error);
        errors.push({ row, error: error.message });
      }
    }

    // Batch submit to blockchain
    if (studentAddresses.length > 0) {
      batchSubmitRecords(studentAddresses, ipfsHashes, metadataHashes)
        .then((txResult) => {
          // Update all records with transaction hash
          processedResults.forEach((result: any) => {
            supabase
              .from('results')
              .update({
                blockchain_tx_hash: txResult.txHash,
                blockchain_confirmed: txResult.status === 'confirmed',
                blockchain_block_number: txResult.blockNumber,
                updated_at: new Date().toISOString(),
              })
              .eq('id', result.id);
          });

          // Emit WebSocket event
          const io = req.app.get('io') as SocketIOServer;
          if (io) {
            io.to(`tx-${txResult.txHash}`).emit('transaction-update', txResult);
          }
        })
        .catch((error: any) => {
          logger.error('Batch blockchain submission error:', error);
        });
    }

    // Log audit trail
    await supabase.from('audit_trail').insert({
      actor: admin.id,
      actor_type: 'admin',
      action_type: 'batch_upload',
      affected_records: JSON.stringify(processedResults.map((r: any) => r.id)),
      transaction_details: JSON.stringify({ count: processedResults.length }),
      status: 'pending',
      created_at: new Date().toISOString(),
    });

    res.json({
      success: true,
      processed: processedResults.length,
      errors: errors.length,
      errorDetails: errors,
    });
  } catch (error: any) {
    logger.error('Batch upload error:', error);
    res.status(500).json({ error: 'Batch upload failed' });
  }
});

// Get transaction status
router.get('/transactions/:txHash', verifyToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { txHash } = req.params;

    // Get results with this transaction hash
    const { data: results, error } = await supabase
      .from('results')
      .select('*')
      .eq('blockchain_tx_hash', txHash);

    if (error) {
      logger.error('Transaction lookup error:', error);
      return res.status(500).json({ error: 'Failed to fetch transaction' });
    }

    res.json({
      txHash,
      results: results || [],
      status: results && results.length > 0 ? results[0].blockchain_confirmed ? 'confirmed' : 'pending' : 'not_found',
    });
  } catch (error: any) {
    logger.error('Get transaction error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// Get audit trail
router.get('/audit-trail', verifyToken, requireAdmin, requireRole('department_head', 'registry_staff'), async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '50' } = req.query;

    const { data: auditLogs, error } = await supabase
      .from('audit_trail')
      .select('*')
      .order('created_at', { ascending: false })
      .range((parseInt(page as string) - 1) * parseInt(limit as string), parseInt(page as string) * parseInt(limit as string) - 1);

    if (error) {
      logger.error('Audit trail error:', error);
      return res.status(500).json({ error: 'Failed to fetch audit trail' });
    }

    res.json({ auditLogs: auditLogs || [] });
  } catch (error: any) {
    logger.error('Get audit trail error:', error);
    res.status(500).json({ error: 'Failed to fetch audit trail' });
  }
});

export default router;

