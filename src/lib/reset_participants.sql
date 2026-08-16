-- Reset participants to the official QCC meeting list
-- This script deletes all existing participants and inserts the official list

-- Delete all existing participants
DELETE FROM participants;

-- Insert the official QCC meeting participants
INSERT INTO participants (registration_code, full_name, organisation, position, phone, participant_status, registration_date, registration_status, check_in_status, registration_source) VALUES
('QCC-001', 'Mr. Frank Asante', 'QCC', 'Managing Director', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED'),
('QCC-002', 'Mr. William Azalekor', 'QCC', 'Deputy Managing Director', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED'),
('QCC-003', 'Mr. Martin Asiamah', 'QCC', 'Deputy Director, Finance', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED'),
('QCC-004', 'Mr. Oheneba Boamah', 'QCC', 'Deputy Director, Human Resource', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED'),
('QCC-005', 'Mr. Frank Owusu Amoako', 'QCC', 'Security Manager', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED'),
('QCC-006', 'Mr. Kwaku Ohemeng', 'QCC', 'IT Manager', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED'),
('QCC-007', 'Mr. Frank Amoafua Mensah', 'QCC', 'Deputy HR Manager', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED'),
('QCC-008', 'Raphael Avemegah', 'QCC', 'Ag Principal', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED'),
('QCC-009', 'Mr. Dacosta Awuku', 'QCC', 'Principal', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED'),
('QCC-010', 'Justina Gifty Frempong', 'QCC', 'HR Manager', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED'),
('QCC-011', 'Mr. Daniel Wiah Salifu', 'QCC', 'Deputy QC Manager', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED'),
('QCC-012', 'Mr. Douglas Effah', 'QCC', 'Principal QC Officer', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED'),
('QCC-013', 'Mr. Onasis', 'QCC', 'Principal Security Officer', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED'),
('QCC-014', 'Dominic Gyimah', 'QCC', 'Accounts Manager', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED'),
('QCC-015', 'Agyabeng Maxwell', 'QCC', 'Audit Manager', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED'),
('QCC-016', 'Mary Allotey', 'QCC', 'HR Manager', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED');
