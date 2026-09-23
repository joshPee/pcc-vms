-- Add role field to users table for role-based access control
-- This migration adds a role column to distinguish between different user types

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'admin';

-- Update existing users to have admin role by default
UPDATE users 
SET role = 'admin' 
WHERE role IS NULL;

-- Add check constraint for valid roles
ALTER TABLE users 
ADD CONSTRAINT check_role 
CHECK (role IN ('admin', 'security_officer', 'supervisor', 'sector_head'));

-- Create index for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
