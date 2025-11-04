import { ethers, Contract, JsonRpcProvider, Wallet } from 'ethers';
import logger from '../utils/logger';
import { TransactionResult, BlockchainRecord } from '../types';

let provider: JsonRpcProvider | null = null;
let contract: Contract | null = null;
let wallet: Wallet | null = null;

interface BlockchainConfig {
  provider: JsonRpcProvider;
  contract: Contract;
  wallet: Wallet;
}

// Initialize blockchain connection
export const initBlockchain = (): BlockchainConfig => {
  if (provider && contract && wallet) {
    return { provider, contract, wallet };
  }

  const rpcUrl = process.env.POLYGON_RPC_URL || process.env.RPC_URL;
  const privateKey = process.env.PRIVATE_KEY;
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!rpcUrl || !privateKey || !contractAddress) {
    throw new Error('Missing blockchain configuration');
  }

  provider = new ethers.JsonRpcProvider(rpcUrl);
  wallet = new ethers.Wallet(privateKey, provider);

  // Contract ABI (simplified - should be loaded from compiled contract)
  const contractABI = [
    'function submitRecord(address _studentAddress, string memory _ipfsHash, string memory _metadataHash) external',
    'function batchSubmitRecords(address[] memory _studentAddresses, string[] memory _ipfsHashes, string[] memory _metadataHashes) external',
    'function verifyRecord(address _studentAddress, string memory _ipfsHash) external view returns (bool)',
    'function getRecord(address _studentAddress, string memory _ipfsHash) external view returns (tuple(string ipfsHash, string metadataHash, uint256 timestamp, address submittedBy, bool exists))',
    'function getStudentRecords(address _studentAddress) external view returns (string[] memory)',
    'function recordHashExistsCheck(string memory _ipfsHash) external view returns (bool)',
    'event RecordSubmitted(address indexed studentAddress, string indexed ipfsHash, string metadataHash, address indexed submittedBy, uint256 timestamp)',
  ];

  contract = new ethers.Contract(contractAddress, contractABI, wallet) as Contract;

  logger.info('Blockchain connection initialized');
  logger.info(`Contract address: ${contractAddress}`);
  logger.info(`Wallet address: ${wallet.address}`);

  return { provider, contract, wallet };
};

// Submit record to blockchain
export const submitRecord = async (
  studentAddress: string,
  ipfsHash: string,
  metadataHash: string
): Promise<TransactionResult> => {
  try {
    const { contract } = initBlockchain();

    const tx = await contract.submitRecord(studentAddress, ipfsHash, metadataHash);
    logger.info(`Transaction submitted: ${tx.hash}`);

    const receipt = await tx.wait();
    logger.info(`Transaction confirmed: ${tx.hash} in block ${receipt.blockNumber}`);

    return {
      txHash: tx.hash,
      blockNumber: Number(receipt.blockNumber),
      status: receipt.status === 1 ? 'confirmed' : 'failed',
    };
  } catch (error: any) {
    logger.error('Blockchain submission error:', error);
    throw new Error(`Failed to submit record to blockchain: ${error.message}`);
  }
};

// Batch submit records
export const batchSubmitRecords = async (
  studentAddresses: string[],
  ipfsHashes: string[],
  metadataHashes: string[]
): Promise<TransactionResult> => {
  try {
    const { contract } = initBlockchain();

    const tx = await contract.batchSubmitRecords(studentAddresses, ipfsHashes, metadataHashes);
    logger.info(`Batch transaction submitted: ${tx.hash}`);

    const receipt = await tx.wait();
    logger.info(`Batch transaction confirmed: ${tx.hash} in block ${receipt.blockNumber}`);

    return {
      txHash: tx.hash,
      blockNumber: Number(receipt.blockNumber),
      status: receipt.status === 1 ? 'confirmed' : 'failed',
    };
  } catch (error: any) {
    logger.error('Blockchain batch submission error:', error);
    throw new Error(`Failed to batch submit records: ${error.message}`);
  }
};

// Verify record on blockchain
export const verifyRecord = async (studentAddress: string, ipfsHash: string): Promise<boolean> => {
  try {
    const { contract } = initBlockchain();
    const exists = await contract.verifyRecord(studentAddress, ipfsHash);
    return exists;
  } catch (error: any) {
    logger.error('Blockchain verification error:', error);
    throw new Error(`Failed to verify record: ${error.message}`);
  }
};

// Get record from blockchain
export const getRecord = async (studentAddress: string, ipfsHash: string): Promise<BlockchainRecord> => {
  try {
    const { contract } = initBlockchain();
    const record = await contract.getRecord(studentAddress, ipfsHash);
    return {
      ipfsHash: record.ipfsHash,
      metadataHash: record.metadataHash,
      timestamp: record.timestamp.toString(),
      submittedBy: record.submittedBy,
      exists: record.exists,
    };
  } catch (error: any) {
    logger.error('Blockchain get record error:', error);
    throw new Error(`Failed to get record: ${error.message}`);
  }
};

// Get all student records
export const getStudentRecords = async (studentAddress: string): Promise<string[]> => {
  try {
    const { contract } = initBlockchain();
    const records = await contract.getStudentRecords(studentAddress);
    return records;
  } catch (error: any) {
    logger.error('Blockchain get student records error:', error);
    throw new Error(`Failed to get student records: ${error.message}`);
  }
};

// Check if record hash exists
export const recordHashExists = async (ipfsHash: string): Promise<boolean> => {
  try {
    const { contract } = initBlockchain();
    const exists = await contract.recordHashExistsCheck(ipfsHash);
    return exists;
  } catch (error: any) {
    logger.error('Blockchain hash check error:', error);
    throw new Error(`Failed to check hash: ${error.message}`);
  }
};

// Listen for blockchain events
export const listenForEvents = (callback: (event: any) => void): void => {
  try {
    const { contract } = initBlockchain();
    contract.on('RecordSubmitted', (studentAddress, ipfsHash, metadataHash, submittedBy, timestamp, event) => {
      callback({
        event: 'RecordSubmitted',
        studentAddress,
        ipfsHash,
        metadataHash,
        submittedBy,
        timestamp: timestamp.toString(),
        txHash: event.transactionHash,
        blockNumber: event.blockNumber,
      });
    });
    logger.info('Listening for blockchain events');
  } catch (error: any) {
    logger.error('Blockchain event listener error:', error);
  }
};

