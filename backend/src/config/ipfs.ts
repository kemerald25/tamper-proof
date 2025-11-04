import { create, IPFSHTTPClient } from 'ipfs-http-client';
import axios from 'axios';
import logger from '../utils/logger';

let ipfsClient: IPFSHTTPClient | null = null;

// Initialize IPFS client
export const initIPFS = (): IPFSHTTPClient => {
  if (ipfsClient) {
    return ipfsClient;
  }

  const ipfsApiUrl = process.env.IPFS_API_URL || 'https://ipfs.infura.io:5001/api/v0';

  try {
    const headers: Record<string, string> = {};
    if (process.env.IPFS_AUTH) {
      headers.authorization = `Basic ${process.env.IPFS_AUTH}`;
    }
    
    ipfsClient = create({
      url: ipfsApiUrl,
      headers,
    }) as IPFSHTTPClient;
    logger.info('IPFS client initialized');
  } catch (error) {
    logger.error('IPFS initialization error:', error);
    throw error;
  }

  return ipfsClient;
};

// Upload file to IPFS
export const uploadToIPFS = async (buffer: Buffer, filename: string): Promise<string> => {
  try {
    const client = initIPFS();
    const result = await client.add({
      path: filename,
      content: buffer,
    });

    const ipfsHash = result.cid.toString();
    logger.info(`File uploaded to IPFS: ${ipfsHash}`);

    // Pin the file using Pinata if configured
    if (process.env.PINATA_API_KEY && process.env.PINATA_SECRET_KEY) {
      await pinToPinata(ipfsHash);
    }

    return ipfsHash;
  } catch (error) {
    logger.error('IPFS upload error:', error);
    throw new Error('Failed to upload file to IPFS');
  }
};

// Pin file to Pinata
export const pinToPinata = async (ipfsHash: string): Promise<any> => {
  try {
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinByHash',
      {
        hashToPin: ipfsHash,
        pinataMetadata: {
          name: `academic-record-${ipfsHash}`,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          pinata_api_key: process.env.PINATA_API_KEY,
          pinata_secret_api_key: process.env.PINATA_SECRET_KEY,
        },
      }
    );

    logger.info(`File pinned to Pinata: ${ipfsHash}`);
    return response.data;
  } catch (error) {
    logger.error('Pinata pinning error:', error);
    // Don't throw - pinning is optional
    return null;
  }
};

// Retrieve file from IPFS
export const retrieveFromIPFS = async (ipfsHash: string): Promise<Buffer> => {
  try {
    const gateway = process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs/';
    const url = `${gateway}${ipfsHash}`;
    
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });

    return Buffer.from(response.data);
  } catch (error) {
    logger.error('IPFS retrieval error:', error);
    throw new Error('Failed to retrieve file from IPFS');
  }
};

