-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 23, 2026
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
-- Database: `ckap_leave_sys`
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- Table: users
-- ────────────────────────────────────────────────────────────

CREATE TABLE `users` (
  `id`            int(11)      NOT NULL AUTO_INCREMENT,
  `employee_code` varchar(50)  DEFAULT NULL,
  `full_name`     varchar(255) DEFAULT NULL,
  `department`    varchar(255) DEFAULT NULL,
  `password`      varchar(255) DEFAULT NULL,
  `role`          enum('user','hr','admin','super_admin') NOT NULL DEFAULT 'user',
  `created_at`    timestamp    NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` (`id`, `employee_code`, `full_name`, `department`, `password`, `role`, `created_at`) VALUES
(1,  'EMP-0001', 'วิไล สุวรรณภูมิ',   'ทรัพยากรบุคคล',       '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'super_admin', '2024-01-10 08:00:00'),
(2,  'EMP-0002', 'ประเสริฐ มีสุข',      'วิศวกรรมซอฟต์แวร์',   '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'admin',       '2024-01-10 08:05:00'),
(3,  'EMP-0003', 'ธนพล วิชัยดิษฐ',     'วิศวกรรมซอฟต์แวร์',   '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user',        '2024-01-15 09:00:00'),
(4,  'EMP-0004', 'สมหญิง ดวงดี',        'การตลาด',              '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user',        '2024-01-15 09:10:00'),
(5,  'EMP-0005', 'กิตติพงษ์ รุ่งเรือง', 'การเงิน',              '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user',        '2024-01-16 09:00:00'),
(6,  'EMP-0006', 'พรทิพย์ แสงจันทร์',   'การตลาด',              '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user',        '2024-01-16 09:15:00'),
(7,  'EMP-0007', 'นัทธพงศ์ ทองดี',      'ปฏิบัติการ',           '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user',        '2024-01-17 09:00:00'),
(8,  'EMP-0008', 'อรุณี ใจงาม',         'วิศวกรรมซอฟต์แวร์',   '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user',        '2024-01-17 09:20:00'),
(9,  'EMP-0009', 'ภูวนาถ ศรีสมบูรณ์',   'ปฏิบัติการ',           '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user',        '2024-01-18 09:00:00'),
(10, 'EMP-0010', 'มณีรัตน์ พงษ์ไพร',    'การเงิน',              '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user',        '2024-01-18 09:30:00'),
(11, 'EMP001',   'Test User',            NULL,                    '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user',        '2026-03-19 09:08:04'),
(12, 'HR001',    'HR User',              NULL,                    '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'hr',          '2026-03-19 09:08:04');

ALTER TABLE `users` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

-- ────────────────────────────────────────────────────────────
-- Table: leave_types
-- ────────────────────────────────────────────────────────────

CREATE TABLE `leave_types` (
  `id`          int(11)      NOT NULL AUTO_INCREMENT,
  `name`        varchar(100) DEFAULT NULL,
  `description` text         DEFAULT NULL,
  `max_days`    int(11)      DEFAULT NULL,
  `created_at`  timestamp    NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `leave_types` (`id`, `name`, `description`, `max_days`, `created_at`) VALUES
(1, 'ลาป่วย',    'ลาป่วยตามกฎหมายแรงงาน ม.32',              30, '2024-01-01 00:00:00'),
(2, 'ลากิจ',     'ลากิจส่วนตัว',                              3,  '2024-01-01 00:00:00'),
(3, 'ลาพักผ่อน', 'วันหยุดพักผ่อนประจำปี',                     10, '2024-01-01 00:00:00'),
(4, 'ลาอื่นๆ',   'การลาประเภทอื่นนอกเหนือจากที่กำหนด',       5,  '2024-01-01 00:00:00');

ALTER TABLE `leave_types` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

-- ────────────────────────────────────────────────────────────
-- Table: leave_requests
-- ────────────────────────────────────────────────────────────

CREATE TABLE `leave_requests` (
  `id`            int(11)         NOT NULL AUTO_INCREMENT,
  `user_id`       int(11)         DEFAULT NULL,
  `leave_type_id` int(11)         DEFAULT NULL,
  `start_date`    date            DEFAULT NULL,
  `end_date`      date            DEFAULT NULL,
  `start_time`    time            DEFAULT NULL,
  `end_time`      time            DEFAULT NULL,
  `total_days`    decimal(5,2)    DEFAULT NULL,
  `reason`        text            DEFAULT NULL,
  `status`        enum('pending','approved','rejected') DEFAULT 'pending',
  `approved_by`   int(11)         DEFAULT NULL,
  `approved_at`   datetime        DEFAULT NULL,
  `created_at`    timestamp       NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id`       (`user_id`),
  KEY `leave_type_id` (`leave_type_id`),
  KEY `approved_by`   (`approved_by`),
  CONSTRAINT `leave_requests_ibfk_1` FOREIGN KEY (`user_id`)       REFERENCES `users` (`id`),
  CONSTRAINT `leave_requests_ibfk_2` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`),
  CONSTRAINT `leave_requests_ibfk_3` FOREIGN KEY (`approved_by`)   REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `leave_requests` (`id`, `user_id`, `leave_type_id`, `start_date`, `end_date`, `start_time`, `end_time`, `total_days`, `reason`, `status`, `approved_by`, `approved_at`, `created_at`) VALUES
(1,  3, 1, '2025-01-15', '2025-01-17', NULL,       NULL,       3.00, 'ผ่าตัดเล็ก พักฟื้น',       'approved', 2, '2025-01-14 09:00:00', '2025-01-13 16:00:00'),
(2,  3, 1, '2025-01-08', '2025-01-08', '13:00:00', '15:00:00', 0.25, 'ไปรับยาที่โรงพยาบาล',      'approved', 2, '2025-01-07 09:00:00', '2025-01-07 08:00:00'),
(3,  4, 3, '2025-02-10', '2025-02-14', NULL,       NULL,       5.00, 'พักผ่อนกับครอบครัว',       'approved', 2, '2025-02-07 10:00:00', '2025-02-06 09:00:00'),
(4,  5, 2, '2025-02-20', '2025-02-20', NULL,       NULL,       1.00, 'ธุระส่วนตัวที่ธนาคาร',     'approved', 2, '2025-02-19 11:00:00', '2025-02-18 15:00:00'),
(5,  6, 1, '2025-03-03', '2025-03-05', NULL,       NULL,       3.00, 'ไม่สบาย มีไข้หวัดใหญ่',   'approved', 2, '2025-03-02 09:30:00', '2025-03-02 08:00:00'),
(6,  7, 3, '2025-03-17', '2025-03-20', NULL,       NULL,       4.00, 'ท่องเที่ยวพักผ่อน',        'approved', 2, '2025-03-14 14:00:00', '2025-03-13 10:00:00'),
(7,  3, 3, '2025-02-20', '2025-02-22', NULL,       NULL,       3.00, 'พักผ่อนประจำปี',           'approved', 2, '2025-02-18 10:00:00', '2025-02-17 08:30:00'),
(8,  8, 1, '2025-03-10', '2025-03-10', '09:00:00', '12:00:00', 0.38, 'นัดหมอช่วงเช้า',           'approved', 2, '2025-03-09 08:00:00', '2025-03-08 17:00:00'),
(9,  3, 2, '2025-03-25', '2025-03-25', NULL,       NULL,       1.00, 'ไปต่ออายุพาสปอร์ต',        'pending',  NULL, NULL,                '2025-03-20 11:15:00'),
(10, 6, 2, '2025-04-01', '2025-04-01', NULL,       NULL,       1.00, 'ไปงานแต่งงานเพื่อน',       'pending',  NULL, NULL,                '2025-03-25 09:00:00');

ALTER TABLE `leave_requests` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

-- ────────────────────────────────────────────────────────────
-- Table: leave_approvals
-- ────────────────────────────────────────────────────────────

CREATE TABLE `leave_approvals` (
  `id`               int(11)  NOT NULL AUTO_INCREMENT,
  `leave_request_id` int(11)  DEFAULT NULL,
  `approver_id`      int(11)  DEFAULT NULL,
  `status`           enum('pending','approved','rejected') DEFAULT NULL,
  `comment`          text     DEFAULT NULL,
  `approved_at`      datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `leave_request_id` (`leave_request_id`),
  KEY `approver_id`      (`approver_id`),
  CONSTRAINT `leave_approvals_ibfk_1` FOREIGN KEY (`leave_request_id`) REFERENCES `leave_requests` (`id`),
  CONSTRAINT `leave_approvals_ibfk_2` FOREIGN KEY (`approver_id`)      REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- approver_id เปลี่ยนเป็น 2 (ประเสริฐ — admin) เพราะ id=1 เป็น super_admin แล้ว
INSERT INTO `leave_approvals` (`id`, `leave_request_id`, `approver_id`, `status`, `comment`, `approved_at`) VALUES
(1, 1, 2, 'approved', 'อนุมัติ ดูแลสุขภาพด้วยนะ',       '2025-01-14 09:00:00'),
(2, 2, 2, 'approved', NULL,                               '2025-01-07 09:00:00'),
(3, 3, 2, 'approved', NULL,                               '2025-02-07 10:00:00'),
(4, 4, 2, 'approved', NULL,                               '2025-02-19 11:00:00'),
(5, 5, 2, 'approved', 'อนุมัติ พักผ่อนให้หายดีก่อนนะ', '2025-03-02 09:30:00'),
(6, 6, 2, 'approved', NULL,                               '2025-03-14 14:00:00'),
(7, 7, 2, 'approved', NULL,                               '2025-02-18 10:00:00'),
(8, 8, 2, 'approved', NULL,                               '2025-03-09 08:00:00');

ALTER TABLE `leave_approvals` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

-- ────────────────────────────────────────────────────────────
-- Table: leave_balances  (per leave_type)
-- ────────────────────────────────────────────────────────────

CREATE TABLE `leave_balances` (
  `id`            int(11) NOT NULL AUTO_INCREMENT,
  `user_id`       int(11) DEFAULT NULL,
  `leave_type_id` int(11) DEFAULT NULL,
  `total_days`    int(11) DEFAULT NULL,
  `used_days`     int(11) DEFAULT 0,
  `year`          int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id`       (`user_id`),
  KEY `leave_type_id` (`leave_type_id`),
  CONSTRAINT `leave_balances_ibfk_1` FOREIGN KEY (`user_id`)       REFERENCES `users` (`id`),
  CONSTRAINT `leave_balances_ibfk_2` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `leave_balances` (`id`, `user_id`, `leave_type_id`, `total_days`, `used_days`, `year`) VALUES
(1,  3,  1, 30, 5, 2025), (2,  3,  2, 3,  1, 2025), (3,  3,  3, 10, 3, 2025), (4,  3,  4, 5,  0, 2025),
(5,  4,  1, 30, 2, 2025), (6,  4,  2, 3,  0, 2025), (7,  4,  3, 10, 5, 2025), (8,  4,  4, 5,  1, 2025),
(9,  5,  1, 30, 0, 2025), (10, 5,  2, 3,  1, 2025), (11, 5,  3, 10, 2, 2025), (12, 5,  4, 5,  0, 2025),
(13, 6,  1, 30, 3, 2025), (14, 6,  2, 3,  2, 2025), (15, 6,  3, 10, 0, 2025), (16, 6,  4, 5,  0, 2025),
(17, 7,  1, 30, 1, 2025), (18, 7,  2, 3,  0, 2025), (19, 7,  3, 10, 4, 2025), (20, 7,  4, 5,  2, 2025),
(21, 8,  1, 30, 7, 2025), (22, 8,  2, 3,  1, 2025), (23, 8,  3, 10, 1, 2025), (24, 8,  4, 5,  0, 2025),
(25, 9,  1, 30, 0, 2025), (26, 9,  2, 3,  0, 2025), (27, 9,  3, 10, 6, 2025), (28, 9,  4, 5,  0, 2025),
(29, 10, 1, 30, 2, 2025), (30, 10, 2, 3,  1, 2025), (31, 10, 3, 10, 3, 2025), (32, 10, 4, 5,  1, 2025);

ALTER TABLE `leave_balances` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

-- ────────────────────────────────────────────────────────────
-- Table: user_leave_pool  (pool รวมที่ backend ใช้ approve/reject)
-- ────────────────────────────────────────────────────────────

CREATE TABLE `user_leave_pool` (
  `id`         int(11)      NOT NULL AUTO_INCREMENT,
  `user_id`    int(11)      NOT NULL,
  `total_days` decimal(6,2) NOT NULL DEFAULT 0,
  `used_days`  decimal(6,2) NOT NULL DEFAULT 0,
  `year`       int(11)      NOT NULL,
  `updated_at` timestamp    NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_year` (`user_id`, `year`),
  CONSTRAINT `user_leave_pool_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- seed pool รวมจาก leave_balances (sum ทุก leave_type ต่อ user ต่อปี)
INSERT INTO `user_leave_pool` (`user_id`, `total_days`, `used_days`, `year`) VALUES
(3,  48, 9,  2025),   -- 30+3+10+5=48 | used=5+1+3+0=9
(4,  48, 8,  2025),   -- used=2+0+5+1=8
(5,  48, 3,  2025),   -- used=0+1+2+0=3
(6,  48, 5,  2025),   -- used=3+2+0+0=5
(7,  48, 7,  2025),   -- used=1+0+4+2=7
(8,  48, 9,  2025),   -- used=7+1+1+0=9
(9,  48, 6,  2025),   -- used=0+0+6+0=6
(10, 48, 7,  2025);   -- used=2+1+3+1=7

-- ────────────────────────────────────────────────────────────
-- Table: audit_logs  (immutable — ห้าม UPDATE/DELETE)
-- ────────────────────────────────────────────────────────────

CREATE TABLE `audit_logs` (
  `id`          int(11)      NOT NULL AUTO_INCREMENT,
  `actor_id`    int(11)      NOT NULL,
  `actor_role`  varchar(20)  NOT NULL,
  `action`      varchar(60)  NOT NULL,
  `target_type` varchar(40)  DEFAULT NULL,
  `target_id`   int(11)      DEFAULT NULL,
  `before_data` longtext     DEFAULT NULL CHECK (json_valid(`before_data`) OR `before_data` IS NULL),
  `after_data`  longtext     DEFAULT NULL CHECK (json_valid(`after_data`)  OR `after_data`  IS NULL),
  `note`        text         DEFAULT NULL,
  `ip_address`  varchar(45)  DEFAULT NULL,
  `user_agent`  varchar(255) DEFAULT NULL,
  `created_at`  datetime     NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_actor`      (`actor_id`),
  KEY `idx_action`     (`action`),
  KEY `idx_target`     (`target_type`, `target_id`),
  KEY `idx_created_at` (`created_at` DESC),
  CONSTRAINT `audit_logs_actor_fk` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Immutable audit trail';

-- seed audit_logs จาก leave_approvals เดิม (backfill)
INSERT INTO `audit_logs` (`actor_id`, `actor_role`, `action`, `target_type`, `target_id`, `after_data`, `note`, `created_at`)
SELECT
  la.`approver_id`,
  'admin',
  CASE la.`status` WHEN 'approved' THEN 'leave.approve' ELSE 'leave.reject' END,
  'leave_request',
  la.`leave_request_id`,
  JSON_OBJECT('status', la.`status`, 'comment', la.`comment`, 'approved_at', la.`approved_at`),
  la.`comment`,
  la.`approved_at`
FROM `leave_approvals` la
WHERE la.`approved_at` IS NOT NULL;

-- ────────────────────────────────────────────────────────────
-- View: v_audit_logs  (super_admin ใช้ query)
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW `v_audit_logs` AS
SELECT
  al.`id`,
  al.`created_at`,
  al.`action`,
  al.`target_type`,
  al.`target_id`,
  al.`before_data`,
  al.`after_data`,
  al.`note`,
  al.`ip_address`,
  al.`actor_id`,
  al.`actor_role`,
  u.`full_name`     AS `actor_name`,
  u.`employee_code` AS `actor_code`,
  u.`department`    AS `actor_dept`
FROM `audit_logs` al
INNER JOIN `users` u ON u.`id` = al.`actor_id`
ORDER BY al.`created_at` DESC;

-- ────────────────────────────────────────────────────────────
-- Table: ot_requests (For Overtime Management)
-- ────────────────────────────────────────────────────────────

CREATE TABLE `ot_requests` (
  `id`            int(11)         NOT NULL AUTO_INCREMENT,
  `user_id`       int(11)         NOT NULL,
  `ot_date`       date            NOT NULL,
  `start_time`    time            NOT NULL,
  `end_time`      time            NOT NULL,
  `total_hours`   decimal(5,2)    DEFAULT NULL,
  `reason`        text            DEFAULT NULL,
  `status`        enum('pending','approved','rejected') DEFAULT 'pending',
  `approved_by`   int(11)         DEFAULT NULL,
  `approved_at`   datetime        DEFAULT NULL,
  `created_at`    timestamp       NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id`       (`user_id`),
  KEY `approved_by`   (`approved_by`),
  CONSTRAINT `ot_requests_ibfk_1` FOREIGN KEY (`user_id`)       REFERENCES `users` (`id`),
  CONSTRAINT `ot_requests_ibfk_2` FOREIGN KEY (`approved_by`)   REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample data for ot_requests
INSERT INTO `ot_requests` (`user_id`, `ot_date`, `start_time`, `end_time`, `total_hours`, `reason`, `status`) VALUES
(3, '2025-04-10', '18:00:00', '21:00:00', 3.00, 'งานเร่งด่วนปิดงบประมาณ', 'pending');

-- ────────────────────────────────────────────────────────────
-- Table: ot_approvals
-- ────────────────────────────────────────────────────────────

CREATE TABLE `ot_approvals` (
  `id`               int(11)  NOT NULL AUTO_INCREMENT,
  `ot_request_id`    int(11)  DEFAULT NULL,
  `approver_id`      int(11)  DEFAULT NULL,
  `status`           enum('pending','approved','rejected') DEFAULT NULL,
  `comment`          text     DEFAULT NULL,
  `approved_at`      datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ot_request_id` (`ot_request_id`),
  KEY `approver_id`   (`approver_id`),
  CONSTRAINT `ot_approvals_ibfk_1` FOREIGN KEY (`ot_request_id`) REFERENCES `ot_requests` (`id`),
  CONSTRAINT `ot_approvals_ibfk_2` FOREIGN KEY (`approver_id`)   REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;