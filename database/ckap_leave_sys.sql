-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 18, 2026 at 10:11 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- ============================================================
--  Database: `ckap_leave_sys`
-- ============================================================

-- ── Table structure ──────────────────────────────────────────

CREATE TABLE `leave_approvals` (
  `id` int(11) NOT NULL,
  `leave_request_id` int(11) DEFAULT NULL,
  `approver_id` int(11) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `leave_balances` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `leave_type_id` int(11) DEFAULT NULL,
  `total_days` int(11) DEFAULT NULL,
  `used_days` int(11) DEFAULT 0,
  `year` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `leave_requests` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `leave_type_id` int(11) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `total_days` decimal(5,2) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `leave_types` (
  `id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `max_days` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `employee_code` varchar(50) DEFAULT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- ============================================================
--  MOCKUP DATA
-- ============================================================

-- ── users (10 คน: 2 admin, 8 user) ──────────────────────────
-- password = "password123" hashed with bcrypt rounds=10
INSERT INTO `users` (`id`, `employee_code`, `full_name`, `department`, `password`, `role`, `created_at`) VALUES
(1,  'EMP-0001', 'วิไล สุวรรณภูมิ',    'ทรัพยากรบุคคล',      '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'admin', '2024-01-10 08:00:00'),
(2,  'EMP-0002', 'ประเสริฐ มีสุข',      'วิศวกรรมซอฟต์แวร์',  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin', '2024-01-10 08:05:00'),
(3,  'EMP-0003', 'ธนพล วิชัยดิษฐ',     'วิศวกรรมซอฟต์แวร์',  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'user',  '2024-01-15 09:00:00'),
(4,  'EMP-0004', 'สมหญิง ดวงดี',       'การตลาด',            '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'user',  '2024-01-15 09:10:00'),
(5,  'EMP-0005', 'กิตติพงษ์ รุ่งเรือง', 'การเงิน',            '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'user',  '2024-01-16 09:00:00'),
(6,  'EMP-0006', 'พรทิพย์ แสงจันทร์',  'การตลาด',            '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'user',  '2024-01-16 09:15:00'),
(7,  'EMP-0007', 'นัทธพงศ์ ทองดี',     'ปฏิบัติการ',          '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'user',  '2024-01-17 09:00:00'),
(8,  'EMP-0008', 'อรุณี ใจงาม',        'วิศวกรรมซอฟต์แวร์',  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'user',  '2024-01-17 09:20:00'),
(9,  'EMP-0009', 'ภูวนาถ ศรีสมบูรณ์',  'ปฏิบัติการ',          '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'user',  '2024-01-18 09:00:00'),
(10, 'EMP-0010', 'มณีรัตน์ พงษ์ไพร',   'การเงิน',            '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'user',  '2024-01-18 09:30:00');

-- ── leave_types ──────────────────────────────────────────────
INSERT INTO `leave_types` (`id`, `name`, `description`, `max_days`, `created_at`) VALUES
(1, 'ลาป่วย',    'ลาป่วยตามกฎหมายแรงงาน ม.32',           30, '2024-01-01 00:00:00'),
(2, 'ลากิจ',     'ลากิจส่วนตัว',                           3,  '2024-01-01 00:00:00'),
(3, 'ลาพักผ่อน', 'วันหยุดพักผ่อนประจำปี',                   10, '2024-01-01 00:00:00'),
(4, 'ลาอื่นๆ',   'การลาประเภทอื่นนอกเหนือจากที่กำหนด',      5,  '2024-01-01 00:00:00');

-- ── leave_balances (ปี 2025) ─────────────────────────────────
INSERT INTO `leave_balances` (`id`, `user_id`, `leave_type_id`, `total_days`, `used_days`, `year`) VALUES
-- user 3: ธนพล
(1,  3, 1, 30, 5, 2025), (2,  3, 2, 3,  1, 2025), (3,  3, 3, 10, 3, 2025), (4,  3, 4, 5,  0, 2025),
-- user 4: สมหญิง
(5,  4, 1, 30, 2, 2025), (6,  4, 2, 3,  0, 2025), (7,  4, 3, 10, 5, 2025), (8,  4, 4, 5,  1, 2025),
-- user 5: กิตติพงษ์
(9,  5, 1, 30, 0, 2025), (10, 5, 2, 3,  1, 2025), (11, 5, 3, 10, 2, 2025), (12, 5, 4, 5,  0, 2025),
-- user 6: พรทิพย์
(13, 6, 1, 30, 3, 2025), (14, 6, 2, 3,  2, 2025), (15, 6, 3, 10, 0, 2025), (16, 6, 4, 5,  0, 2025),
-- user 7: นัทธพงศ์
(17, 7, 1, 30, 1, 2025), (18, 7, 2, 3,  0, 2025), (19, 7, 3, 10, 4, 2025), (20, 7, 4, 5,  2, 2025),
-- user 8: อรุณี
(21, 8, 1, 30, 7, 2025), (22, 8, 2, 3,  1, 2025), (23, 8, 3, 10, 1, 2025), (24, 8, 4, 5,  0, 2025),
-- user 9: ภูวนาถ
(25, 9, 1, 30, 0, 2025), (26, 9, 2, 3,  0, 2025), (27, 9, 3, 10, 6, 2025), (28, 9, 4, 5,  0, 2025),
-- user 10: มณีรัตน์
(29, 10, 1, 30, 2, 2025), (30, 10, 2, 3, 1, 2025), (31, 10, 3, 10, 3, 2025), (32, 10, 4, 5, 1, 2025);

-- ── leave_requests (10 รายการ) ───────────────────────────────
INSERT INTO `leave_requests` (`id`, `user_id`, `leave_type_id`, `start_date`, `end_date`, `start_time`, `end_time`, `total_days`, `reason`, `status`, `approved_by`, `approved_at`, `created_at`) VALUES
(1,  3, 1, '2025-01-15', '2025-01-17', NULL,    NULL,    3.00, 'ผ่าตัดเล็ก พักฟื้น',          'approved', 1, '2025-01-14 09:00:00', '2025-01-13 16:00:00'),
(2,  3, 1, '2025-01-08', '2025-01-08', '13:00', '15:00', 0.25, 'ไปรับยาที่โรงพยาบาล',         'approved', 1, '2025-01-07 09:00:00', '2025-01-07 08:00:00'),
(3,  4, 3, '2025-02-10', '2025-02-14', NULL,    NULL,    5.00, 'พักผ่อนกับครอบครัว',          'approved', 1, '2025-02-07 10:00:00', '2025-02-06 09:00:00'),
(4,  5, 2, '2025-02-20', '2025-02-20', NULL,    NULL,    1.00, 'ธุระส่วนตัวที่ธนาคาร',        'approved', 2, '2025-02-19 11:00:00', '2025-02-18 15:00:00'),
(5,  6, 1, '2025-03-03', '2025-03-05', NULL,    NULL,    3.00, 'ไม่สบาย มีไข้หวัดใหญ่',       'approved', 1, '2025-03-02 09:30:00', '2025-03-02 08:00:00'),
(6,  7, 3, '2025-03-17', '2025-03-20', NULL,    NULL,    4.00, 'ท่องเที่ยวพักผ่อน',           'approved', 2, '2025-03-14 14:00:00', '2025-03-13 10:00:00'),
(7,  3, 3, '2025-02-20', '2025-02-22', NULL,    NULL,    3.00, 'พักผ่อนประจำปี',              'approved', 1, '2025-02-18 10:00:00', '2025-02-17 08:30:00'),
(8,  8, 1, '2025-03-10', '2025-03-10', '09:00', '12:00', 0.38, 'นัดหมอช่วงเช้า',             'approved', 2, '2025-03-09 08:00:00', '2025-03-08 17:00:00'),
(9,  3, 2, '2025-03-25', '2025-03-25', NULL,    NULL,    1.00, 'ไปต่ออายุพาสปอร์ต',           'pending',  NULL, NULL,               '2025-03-20 11:15:00'),
(10, 6, 2, '2025-04-01', '2025-04-01', NULL,    NULL,    1.00, 'ไปงานแต่งงานเพื่อน',          'pending',  NULL, NULL,               '2025-03-25 09:00:00');

-- ── leave_approvals ──────────────────────────────────────────
INSERT INTO `leave_approvals` (`id`, `leave_request_id`, `approver_id`, `status`, `comment`, `approved_at`) VALUES
(1, 1, 1, 'approved', 'อนุมัติ ดูแลสุขภาพด้วยนะ',       '2025-01-14 09:00:00'),
(2, 2, 1, 'approved', NULL,                              '2025-01-07 09:00:00'),
(3, 3, 1, 'approved', NULL,                              '2025-02-07 10:00:00'),
(4, 4, 2, 'approved', NULL,                              '2025-02-19 11:00:00'),
(5, 5, 1, 'approved', 'อนุมัติ พักผ่อนให้หายดีก่อนนะ',  '2025-03-02 09:30:00'),
(6, 6, 2, 'approved', NULL,                              '2025-03-14 14:00:00'),
(7, 7, 1, 'approved', NULL,                              '2025-02-18 10:00:00'),
(8, 8, 2, 'approved', NULL,                              '2025-03-09 08:00:00');

-- ============================================================
--  Indexes & Primary Keys
-- ============================================================

ALTER TABLE `leave_approvals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leave_request_id` (`leave_request_id`),
  ADD KEY `approver_id` (`approver_id`);

ALTER TABLE `leave_balances`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `leave_type_id` (`leave_type_id`);

ALTER TABLE `leave_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `leave_type_id` (`leave_type_id`),
  ADD KEY `approved_by` (`approved_by`);

ALTER TABLE `leave_types`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

-- ── AUTO_INCREMENT ────────────────────────────────────────────

ALTER TABLE `leave_approvals`  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;
ALTER TABLE `leave_balances`   MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;
ALTER TABLE `leave_requests`   MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;
ALTER TABLE `leave_types`      MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
ALTER TABLE `users`            MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

-- ── Foreign Keys ─────────────────────────────────────────────

ALTER TABLE `leave_approvals`
  ADD CONSTRAINT `leave_approvals_ibfk_1` FOREIGN KEY (`leave_request_id`) REFERENCES `leave_requests` (`id`),
  ADD CONSTRAINT `leave_approvals_ibfk_2` FOREIGN KEY (`approver_id`) REFERENCES `users` (`id`);

ALTER TABLE `leave_balances`
  ADD CONSTRAINT `leave_balances_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `leave_balances_ibfk_2` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`);

ALTER TABLE `leave_requests`
  ADD CONSTRAINT `leave_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `leave_requests_ibfk_2` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`),
  ADD CONSTRAINT `leave_requests_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`);

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;