import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: JwtPayload & {
    walletAddress?: string;
    studentId?: string;
    adminId?: string;
    username?: string;
    role?: string;
    type?: 'student' | 'admin';
  };
  walletAddress?: string;
  student?: {
    id: string;
    wallet_address: string;
    full_name: string;
    matric_number: string;
    department: string;
    faculty: string;
    level: number;
    [key: string]: any;
  };
  admin?: {
    id: string;
    username: string;
    full_name: string;
    role: string;
    [key: string]: any;
  };
}

export interface Student {
  id: string;
  wallet_address: string;
  full_name: string;
  matric_number: string;
  department: string;
  faculty: string;
  level: number;
  entry_year: number;
  email?: string;
  phone_number?: string;
  account_status: string;
  verification_flag: boolean;
  created_at: string;
  updated_at: string;
}

export interface Result {
  id: string;
  student_id: string;
  course_code: string;
  course_title: string;
  grade: string;
  grade_point: number;
  credit_units: number;
  semester: string;
  academic_session: string;
  faculty_id: string;
  ipfs_hash: string;
  metadata_hash: string;
  blockchain_tx_hash?: string;
  blockchain_block_number?: number;
  blockchain_confirmed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Admin {
  id: string;
  username: string;
  password_hash: string;
  full_name: string;
  faculty?: string;
  department?: string;
  role: 'faculty' | 'department_head' | 'registry_staff';
  wallet_address?: string;
  permissions: string[];
  active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface VerificationLog {
  id: string;
  verifier_type: 'student' | 'employer' | 'institution' | 'public';
  student_id?: string;
  result_hash: string;
  verification_outcome: boolean;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AuditTrail {
  id: string;
  actor: string;
  actor_type: 'admin' | 'student' | 'system';
  action_type: 'upload' | 'verify' | 'modify' | 'delete' | 'batch_upload' | 'authorize' | 'revoke';
  affected_records?: any;
  transaction_details?: any;
  status: 'pending' | 'completed' | 'failed';
  notes?: string;
  created_at: string;
}

export interface BlockchainRecord {
  ipfsHash: string;
  metadataHash: string;
  timestamp: string;
  submittedBy: string;
  exists: boolean;
}

export interface TransactionResult {
  txHash: string;
  blockNumber: number;
  status: 'confirmed' | 'failed';
}

