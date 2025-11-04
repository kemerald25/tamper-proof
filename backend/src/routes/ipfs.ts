import express, { Request, Response } from 'express';
import { Router } from 'express';
import multer from 'multer';
import { verifyToken, requireAdmin } from '../middleware/auth';
import { uploadToIPFS, retrieveFromIPFS } from '../config/ipfs';
import logger from '../utils/logger';
import { AuthRequest } from '../types';

const router: Router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// Upload file to IPFS
router.post('/upload', verifyToken, requireAdmin, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File required' });
    }

    const filename = req.file.originalname || `file-${Date.now()}`;
    const ipfsHash = await uploadToIPFS(req.file.buffer, filename);

    res.json({
      ipfsHash,
      filename,
      size: req.file.size,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('IPFS upload error:', error);
    res.status(500).json({ error: 'Failed to upload file to IPFS' });
  }
});

// Retrieve file from IPFS
router.get('/retrieve/:hash', async (req: Request, res: Response) => {
  try {
    const { hash } = req.params;

    const fileBuffer = await retrieveFromIPFS(hash);

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${hash}"`);
    res.send(fileBuffer);
  } catch (error: any) {
    logger.error('IPFS retrieve error:', error);
    res.status(500).json({ error: 'Failed to retrieve file from IPFS' });
  }
});

// Get IPFS gateway URL
router.get('/gateway/:hash', async (req: Request, res: Response) => {
  try {
    const { hash } = req.params;
    const gateway = process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs/';
    const url = `${gateway}${hash}`;

    res.json({ url, hash });
  } catch (error: any) {
    logger.error('IPFS gateway error:', error);
    res.status(500).json({ error: 'Failed to generate gateway URL' });
  }
});

export default router;

