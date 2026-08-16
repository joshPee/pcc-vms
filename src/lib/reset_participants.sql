-- Reset participants to the official QCC meeting list
-- This script deletes all existing participants and inserts the official list

-- Delete all existing participants
DELETE FROM participants;

-- Insert the official QCC meeting participants with unique CTS codes matching public registration format
INSERT INTO participants (registration_code, full_name, organisation, position, phone, participant_status, registration_date, registration_status, check_in_status, registration_source) VALUES
('CTS-100001', 'Mr. Frank Asante', 'QCC', 'Managing Director', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED'),
('CTS-100002', 'Mr. William Azalekor', 'QCC', 'Deputy Managing Director', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED'),
('CTS-100003', 'Mr. Martin Asiamah', 'QCC', 'Deputy Director, Finance', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED'),
('CTS-100004', 'Mr. Oheneba Boamah', 'QCC', 'Deputy Director, Human Resource', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED'),
('CTS-100005', 'Mr. Frank Owusu Amoako', 'QCC', 'Security Manager', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED'),
('CTS-100006', 'Mr. Kwaku Ohemeng', 'QCC', 'IT Manager', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED'),
('CTS-100007', 'Mr. Frank Amoafua Mensah', 'QCC', 'Deputy HR Manager', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED'),
('CTS-100008', 'Raphael Avemegah', 'QCC', 'Ag Principal', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED'),
('CTS-100009', 'Mr. Dacosta Awuku', 'QCC', 'Principal', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED'),
('CTS-100010', 'Justina Gifty Frempong', 'QCC', 'HR Manager', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED'),
('CTS-100011', 'Mr. Daniel Wiah Salifu', 'QCC', 'Deputy QC Manager', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED'),
('CTS-100012', 'Mr. Douglas Effah', 'QCC', 'Principal QC Officer', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED'),
('CTS-100013', 'Mr. Onasis', 'QCC', 'Principal Security Officer', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED'),
('CTS-100014', 'Dominic Gyimah', 'QCC', 'Accounts Manager', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED'),
('CTS-100015', 'Agyabeng Maxwell', 'QCC', 'Audit Manager', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED'),
('CTS-100016', 'Mary Allotey', 'QCC', 'HR Manager', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED');
