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
  `role`          enum('user','lead','assistant manager','manager', 'admin') NOT NULL DEFAULT 'user',
  `supervisor_id` int(11)      DEFAULT NULL,
  `created_at`    timestamp    NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_user_supervisor` FOREIGN KEY (`supervisor_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` (`id`, `employee_code`, `full_name`, `department`, `password`, `role`, `created_at`) VALUES
(1,  'MKT-0001', 'นางสาวปวิดา  กาญจนางกูล',   'การตลาด',       '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'manager', '2024-01-10 08:00:00'),
(2,  'MKT-0002', 'นางสาวภัทรา  พงษ์การุณ',      'การตลาด',   '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'assistant manager',       '2024-01-10 08:05:00'),
(3,  'MKT-0003', 'นายพูนศักดิ์  วงศ์มกรพันธ์',     'การตลาด',   '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'lead',        '2024-01-15 09:00:00'),
(4,  'MKT-0004', 'นางสาวอนงค์กานต์  เหียดใส',        'การตลาด',              '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user',        '2024-01-15 09:10:00'),
(5,  'MKT-0005', 'นางสาวพรปวีณ์  เทพวิจิตร์', 'การตลาด',              '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user',        '2024-01-16 09:00:00'),
(6,  'MKT-0006', 'นางสาวนพวรรณ  ศรีเสริม',   'การตลาด',              '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user',        '2024-01-16 09:15:00'),
(7,  'MKT-0007', 'นางสาวสุภาภรณ์  จ้อยวงศ์',      'การตลาด',           '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user',        '2024-01-17 09:00:00'),
(8,  'MKT-0008', 'นางสาวรวิวรรณ  อนุตรี',         'การตลาด',   '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user',        '2024-01-17 09:20:00'),
(9,  'MKT-0009', 'นางสาวจันทรรัตน์  อดิศรวรกิจ',   'การตลาด',           '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user',        '2024-01-18 09:00:00'),
(10, 'MKT-0010', 'นางสาวอาจรีย์  ทุ่งราช',    'การตลาด',              '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user',        '2024-01-18 09:30:00'),
(11, 'MKT-0011', 'นางสาวพุทธพร  พัดจีบ',    'การตลาด',              '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user',        '2024-01-18 09:30:00'),
(12, 'MKT-0012', 'นางสาวนัชนก  ไชยแป้น',    'การตลาด',              '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user',        '2024-01-18 09:30:00'),
(13, 'MKT-0013', 'นางสาวปานไพลิน  ปินใจ',    'การตลาด',              '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user',        '2024-01-18 09:30:00'),
(14, 'MKT-0014', 'นางสาวธิษณา  ธัญญวิชยเวช',    'การตลาด',              '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user',        '2024-01-18 09:30:00'),
(15, 'MKT-0015', 'นายวินัย  ลูกปัด',    'การตลาด',              '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user',        '2024-01-18 09:30:00'),
(16, 'MKT-0016', 'นายชยพล  อุ่มเจริญ',    'การตลาด',              '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user',        '2024-01-18 09:30:00'),
(17, 'test-0001', 'นายทดสอบระบบ',    'การตลาด',              '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'admin',        '2024-01-18 09:30:00');

ALTER TABLE `users` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

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
  'manager',
  CASE la.`status` WHEN 'approved' THEN 'leave.approve' ELSE 'leave.reject' END,
  'leave_request',
  la.`leave_request_id`,
  JSON_OBJECT('status', la.`status`, 'comment', la.`comment`, 'approved_at', la.`approved_at`),
  la.`comment`,
  la.`approved_at`
FROM `leave_approvals` la
WHERE la.`approved_at` IS NOT NULL;

-- ────────────────────────────────────────────────────────────
-- View: v_audit_logs  (manager ใช้ query)
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