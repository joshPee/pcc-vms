-- Reset participants to the official QCC meeting list
-- This script deletes all existing participants and check-ins, then inserts the official list

-- Delete all existing check-ins
DELETE FROM check_ins;

-- Delete all existing participants
DELETE FROM participants;

-- Insert the official QCC meeting participants in the exact order from the letter
-- Order: MSI (1-17), QCC (18-33), TMA (34-39)
INSERT INTO participants (registration_code, full_name, organisation, position, phone, participant_status, registration_date, registration_status, check_in_status, registration_source, sort_order) VALUES
-- MSI Team (Mercy Ships) - 17 participants
('MSI-7156', 'Dr Michelle White', 'Mercy Ships International', 'CEO', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 1),
('MSI-2849', 'Taylor Perez', 'Global Mercy Ship', 'Captain', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 2),
('MSI-6372', 'Matthew Murray', 'Global Mercy Ship', 'Managing Director', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 3),
('MSI-1594', 'Bambi Hawkins', 'Global Mercy Ship', 'EA to MD', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 4),
('MSI-4827', 'Curtis Rosen', 'Global Mercy Ship', 'Senior Chaplain', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 5),
('MSI-8160', 'David Quigg', 'Global Mercy Ship', 'Hospital Director', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 6),
('MSI-3495', 'Jacob Roebuck', 'Global Mercy Ship', 'Communications Director', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 7),
('MSI-5728', 'Laurens Baars', 'Global Mercy Ship', 'Operations Director', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 8),
('MSI-9031', 'Theresa White', 'Global Mercy Ship', 'People & Culture Director', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 9),
('MSI-2654', 'Valérie Moser', 'Mercy Ships', 'Executive Assistant & Specialist Advisor to CEO', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 10),
('MSI-5187', 'Michael Nkeze', 'Mercy Ships', 'Country Director', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 11),
('MSI-7402', 'Elizabeth Macleod', 'Mercy Ships', 'Country Engagement and Operations Support', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 12),
('MSI-1936', 'Ryan Meaker', 'Mercy Ships', 'Global Infrastructure Portfolio Manager', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 13),
('MSI-4269', 'Pete Brosey', 'Mercy Ships', 'Infrastructure Project Manager', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 14),
('MSI-6591', 'Jeff Scace', 'Mercy Ships', 'Senior Director of Global Security', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 15),
('MSI-9824', 'Gerhard Venter', 'Mercy Ships', 'Regional Security Director', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 16),
('MSI-3147', 'Julius Milton', 'Mercy Ships', 'Field Security Officer', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 17),
-- QCC Team - 16 participants
('CTS-8472', 'Mr. Frank Asante', 'QCC', 'Managing Director', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 18),
('CTS-3951', 'Mr. William Azalekor', 'QCC', 'Deputy Managing Director', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 19),
('CTS-7264', 'Mr. Martin Asiamah', 'QCC', 'Deputy Director, Finance', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 20),
('CTS-1589', 'Mr. Oheneba Boamah', 'QCC', 'Deputy Director, Human Resource', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 21),
('CTS-6420', 'Mr. Frank Owusu Amoako', 'QCC', 'Security Manager', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 22),
('CTS-9183', 'Mr. Kwaku Ohemeng', 'QCC', 'IT Manager', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 23),
('CTS-2746', 'Mr. Frank Amoafua Mensah', 'QCC', 'Deputy HR Manager', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 24),
('CTS-5307', 'Raphael Avemegah', 'QCC', 'Ag Principal', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 25),
('CTS-8619', 'Mr. Dacosta Awuku', 'QCC', 'Principal', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 26),
('CTS-4052', 'Justina Gifty Frempong', 'QCC', 'HR Manager', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 27),
('CTS-7935', 'Mr. Daniel Wiah Salifu', 'QCC', 'Deputy QC Manager', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 28),
('CTS-2168', 'Mr. Douglas Effah', 'QCC', 'Principal QC Officer', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 29),
('CTS-5891', 'Mr. Onasis Frimpong', 'QCC', 'Principal Security Officer (To beef up Security)', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 30),
('CTS-3274', 'Dominic Gyimah', 'QCC', 'Accounts Manager', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 31),
('CTS-6507', 'Agyabeng Maxwell', 'QCC', 'Audit Manager', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 32),
('CTS-9843', 'Mary Allotey', 'QCC', 'HR Manager', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'REGISTERED', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 33),
-- TMA Team - 6 participants
('TMA-8472', 'Hon. Ebi Bright', 'TMA', 'MCE', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'PENDING', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 34),
('TMA-3951', 'Francis Mensah', 'TMA', 'MCD', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'PENDING', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 35),
('TMA-7264', 'Jeremiah Amoafo', 'TMA', 'Metro Development Planner', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'PENDING', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 36),
('TMA-1589', 'Eden Gbekorvor', 'TMA', 'Metro Physical Planner', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'PENDING', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 37),
('TMA-6420', 'Frank Asante', 'TMA', 'PRO', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'PENDING', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 38),
('TMA-9183', 'Augustine Pepraf', 'TMA', 'Incoming MCD', NULL, 'EXPECTED', CURRENT_TIMESTAMP, 'PENDING', 'NOT_CHECKED_IN', 'PRE_REGISTERED', 39);
