-- Tamper-Proof Academic Records System - Database Schema
-- PostgreSQL (Supabase)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Students Table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    matric_number TEXT NOT NULL UNIQUE,
    department TEXT NOT NULL,
    faculty TEXT NOT NULL,
    level INTEGER NOT NULL,
    entry_year INTEGER NOT NULL,
    email TEXT,
    phone_number TEXT,
    account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'inactive')),
    verification_flag BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on wallet_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_wallet_address ON students(wallet_address);
CREATE INDEX IF NOT EXISTS idx_students_matric_number ON students(matric_number);
CREATE INDEX IF NOT EXISTS idx_students_department ON students(department);

-- Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    faculty TEXT,
    department TEXT,
    role TEXT NOT NULL CHECK (role IN ('faculty', 'department_head', 'registry_staff')),
    wallet_address TEXT,
    permissions JSONB DEFAULT '[]'::jsonb,
    active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on username
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);

-- Results Table
CREATE TABLE IF NOT EXISTS results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_code TEXT NOT NULL,
    course_title TEXT NOT NULL,
    grade TEXT NOT NULL,
    grade_point DECIMAL(3, 2) NOT NULL,
    credit_units INTEGER NOT NULL,
    semester TEXT NOT NULL,
    academic_session TEXT NOT NULL,
    faculty_id UUID NOT NULL REFERENCES admins(id) ON DELETE SET NULL,
    ipfs_hash TEXT NOT NULL,
    metadata_hash TEXT NOT NULL,
    blockchain_tx_hash TEXT,
    blockchain_block_number BIGINT,
    blockchain_confirmed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_results_student_id ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_course_code ON results(course_code);
CREATE INDEX IF NOT EXISTS idx_results_semester ON results(semester);
CREATE INDEX IF NOT EXISTS idx_results_academic_session ON results(academic_session);
CREATE INDEX IF NOT EXISTS idx_results_ipfs_hash ON results(ipfs_hash);
CREATE INDEX IF NOT EXISTS idx_results_blockchain_tx_hash ON results(blockchain_tx_hash);
CREATE INDEX IF NOT EXISTS idx_results_blockchain_confirmed ON results(blockchain_confirmed);

-- Verification Logs Table
CREATE TABLE IF NOT EXISTS verification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verifier_type TEXT NOT NULL CHECK (verifier_type IN ('student', 'employer', 'institution', 'public')),
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    result_hash TEXT NOT NULL,
    verification_outcome BOOLEAN NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_verification_logs_student_id ON verification_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_result_hash ON verification_logs(result_hash);
CREATE INDEX IF NOT EXISTS idx_verification_logs_created_at ON verification_logs(created_at);

-- Audit Trail Table
CREATE TABLE IF NOT EXISTS audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor UUID NOT NULL,
    actor_type TEXT NOT NULL CHECK (actor_type IN ('admin', 'student', 'system')),
    action_type TEXT NOT NULL CHECK (action_type IN ('upload', 'verify', 'modify', 'delete', 'batch_upload', 'authorize', 'revoke')),
    affected_records JSONB,
    transaction_details JSONB,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_trail_actor ON audit_trail(actor);
CREATE INDEX IF NOT EXISTS idx_audit_trail_action_type ON audit_trail(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_trail_created_at ON audit_trail(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to update updated_at
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_results_updated_at BEFORE UPDATE ON results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;

-- Policy: Students can view their own records
CREATE POLICY "Students can view own records" ON students
    FOR SELECT USING (wallet_address = current_setting('app.current_wallet_address', true));

-- Policy: Admins can view all students
CREATE POLICY "Admins can view all students" ON students
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE id::text = current_setting('app.current_admin_id', true)
            AND active = true
        )
    );

-- Policy: Students can view their own results
CREATE POLICY "Students can view own results" ON results
    FOR SELECT USING (
        student_id IN (
            SELECT id FROM students
            WHERE wallet_address = current_setting('app.current_wallet_address', true)
        )
    );

-- Policy: Admins can view all results
CREATE POLICY "Admins can view all results" ON results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE id::text = current_setting('app.current_admin_id', true)
            AND active = true
        )
    );

-- Policy: Admins can insert results
CREATE POLICY "Admins can insert results" ON results
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admins
            WHERE id::text = current_setting('app.current_admin_id', true)
            AND active = true
        )
    );

-- Policy: Public can view verification logs (read-only)
CREATE POLICY "Public can view verification logs" ON verification_logs
    FOR SELECT USING (true);

-- Policy: Anyone can insert verification logs
CREATE POLICY "Anyone can insert verification logs" ON verification_logs
    FOR INSERT WITH CHECK (true);

-- Policy: Admins can view audit trail
CREATE POLICY "Admins can view audit trail" ON audit_trail
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE id::text = current_setting('app.current_admin_id', true)
            AND active = true
            AND role IN ('department_head', 'registry_staff')
        )
    );

-- Comments for documentation
COMMENT ON TABLE students IS 'Student information and wallet addresses';
COMMENT ON TABLE admins IS 'Administrator accounts with role-based access';
COMMENT ON TABLE results IS 'Academic results linked to students and stored on blockchain';
COMMENT ON TABLE verification_logs IS 'Log of all verification requests for analytics';
COMMENT ON TABLE audit_trail IS 'Complete audit log of all system activities';

