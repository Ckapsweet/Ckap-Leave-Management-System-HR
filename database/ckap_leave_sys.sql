-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 12, 2026 at 03:59 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ckap_leave_sys`
--

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL,
  `actor_id` int(11) NOT NULL,
  `actor_role` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_type` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_id` int(11) DEFAULT NULL,
  `before_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `after_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `name`, `created_at`) VALUES
(2, 'การตลาด', '2026-04-28 06:41:49');

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

CREATE TABLE `events` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `created_by` int(11) NOT NULL,
  `lead_id` int(11) NOT NULL,
  `department` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `event_external_participants`
--

CREATE TABLE `event_external_participants` (
  `id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `department` varchar(255) DEFAULT 'บุคคลอื่นๆ',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `event_leads`
--

CREATE TABLE `event_leads` (
  `id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `lead_id` int(11) NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `event_participants`
--

CREATE TABLE `event_participants` (
  `id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `selected_by_lead_id` int(11) DEFAULT NULL,
  `selected_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `event_time_logs`
--

CREATE TABLE `event_time_logs` (
  `id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `external_participant_id` int(11) DEFAULT NULL,
  `event_date` date NOT NULL,
  `check_in_time` time DEFAULT NULL,
  `check_out_time` time DEFAULT NULL,
  `check_in_at` datetime DEFAULT NULL,
  `check_out_at` datetime DEFAULT NULL,
  `status` enum('draft','pending','approved','rejected') NOT NULL DEFAULT 'draft',
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `approval_comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `event_time_attachments`
--

CREATE TABLE `event_time_attachments` (
  `id` int(11) NOT NULL,
  `event_time_log_id` int(11) NOT NULL,
  `evidence_type` enum('check_in','check_out') NOT NULL DEFAULT 'check_in',
  `original_name` varchar(255) NOT NULL,
  `stored_name` varchar(255) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `size` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `leave_approvals`
--

CREATE TABLE `leave_approvals` (
  `id` int(11) NOT NULL,
  `leave_request_id` int(11) DEFAULT NULL,
  `approver_id` int(11) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `leave_approvals`
--

INSERT INTO `leave_approvals` (`id`, `leave_request_id`, `approver_id`, `status`, `comment`, `approved_at`) VALUES
(25, 42, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 13:40:51'),
(26, 43, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 13:46:20'),
(27, 44, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 13:48:43'),
(28, 45, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 13:49:24'),
(29, 46, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 13:51:57'),
(30, 47, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 13:52:32'),
(31, 48, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 13:54:16'),
(34, 51, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 14:14:48'),
(36, 53, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 14:31:08'),
(37, 54, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 14:31:55'),
(39, 56, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 14:47:05'),
(40, 57, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 15:00:35'),
(41, 58, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 15:01:01'),
(42, 59, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 15:01:30'),
(43, 60, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 15:03:16'),
(44, 61, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 15:04:16'),
(45, 62, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 15:05:03'),
(46, 63, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 15:06:47'),
(47, 64, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 15:08:17'),
(48, 65, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 15:08:55'),
(49, 66, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 15:09:46'),
(50, 67, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 15:10:39'),
(51, 68, 17, 'approved', 'บันทึกประวัติย้อนหลังโดยผู้ดูแล', '2026-06-11 15:11:13');


-- --------------------------------------------------------

--
-- Table structure for table `leave_balances`
--

CREATE TABLE `leave_balances` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `leave_type_id` int(11) DEFAULT NULL,
  `total_days` decimal(6,2) DEFAULT NULL,
  `used_days` decimal(6,2) DEFAULT 0.00,
  `year` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `leave_balances`
--

INSERT INTO `leave_balances` (`id`, `user_id`, `leave_type_id`, `total_days`, `used_days`, `year`) VALUES
(121, 2, 3, 10, 2, 2026),
(124, 3, 3, 10, 1, 2026),
(125, 15, 3, 10, 1, 2026),
(126, 15, 4, 5, 2, 2026),
(127, 16, 3, 10, 4, 2026),
(128, 1, 3, 10, 1, 2026),
(133, 4, 3, 10, 5, 2026),
(138, 6, 1, 30, 1, 2026),
(139, 7, 1, 30, 2, 2026),
(141, 7, 3, 10, 0, 2026),
(142, 8, 3, 10, 4, 2026),
(144, 10, 4, 5, 0, 2026),
(145, 11, 1, 30, 0, 2026),
(147, 12, 3, 10, 1, 2026),
(148, 22, 3, 10, 1, 2026),
(150, 22, 4, 5, 0, 2026),
(151, 13, 3, 10, 1, 2026);
-- --------------------------------------------------------

--
-- Table structure for table `leave_requests`
--

CREATE TABLE `leave_requests` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `leave_type_id` int(11) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `total_days` decimal(5,2) DEFAULT NULL,
  `request_type` enum('leave','late','offsite') NOT NULL DEFAULT 'leave',
  `reason` text DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `current_assignee_id` int(11) DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `leave_requests`
--

INSERT INTO `leave_requests` (`id`, `user_id`, `leave_type_id`, `start_date`, `end_date`, `start_time`, `end_time`, `total_days`, `request_type`, `reason`, `status`, `current_assignee_id`, `approved_by`, `approved_at`, `created_at`) VALUES
(42, 2, 3, '2026-05-04', '2026-05-05', NULL, NULL, 2.00, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 13:40:51', '2026-06-11 06:40:51'),
(43, 2, 3, '2026-05-06', '2026-05-06', '08:30:00', '09:00:00', 0.07, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 13:46:20', '2026-06-11 06:46:20'),
(44, 2, 3, '2026-05-07', '2026-05-07', '08:30:00', '09:30:00', 0.13, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 13:48:43', '2026-06-11 06:48:43'),
(45, 3, 3, '2026-05-04', '2026-05-04', NULL, NULL, 1.00, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 13:49:24', '2026-06-11 06:49:24'),
(46, 15, 3, '2026-05-04', '2026-05-04', NULL, NULL, 1.00, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 13:51:57', '2026-06-11 06:51:57'),
(47, 15, 4, '2026-05-05', '2026-05-06', NULL, NULL, 2.00, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 13:52:32', '2026-06-11 06:52:32'),
(48, 16, 3, '2026-05-04', '2026-05-07', NULL, NULL, 4.00, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 13:54:16', '2026-06-11 06:54:16'),
(51, 16, 3, '2026-05-15', '2026-05-15', '08:00:00', '09:00:00', 0.13, 'leave', 'บันทึกรายการย้อนหลัง\n', 'approved', NULL, 17, '2026-06-11 14:14:48', '2026-06-11 07:14:48'),
(53, 4, 3, '2026-05-04', '2026-05-07', NULL, NULL, 4.00, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 14:31:08', '2026-06-11 07:31:08'),
(54, 4, 3, '2026-05-11', '2026-05-11', '08:30:00', '12:30:00', 0.47, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 14:31:55', '2026-06-11 07:31:55'),
(56, 4, 3, '2026-05-13', '2026-05-13', NULL, NULL, 0.50, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 14:47:05', '2026-06-11 07:47:05'),
(57, 6, 1, '2026-05-04', '2026-05-04', NULL, NULL, 1.00, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 15:00:35', '2026-06-11 08:00:35'),
(58, 7, 1, '2026-05-04', '2026-05-05', NULL, NULL, 2.00, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 15:01:01', '2026-06-11 08:01:01'),
(59, 7, 3, '2026-05-07', '2026-05-07', '08:30:00', '09:30:00', 0.13, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 15:01:30', '2026-06-11 08:01:30'),
(60, 8, 3, '2026-05-04', '2026-05-07', NULL, NULL, 4.00, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 15:03:16', '2026-06-11 08:03:16'),
(61, 8, 3, '2026-05-18', '2026-05-18', '08:00:00', '09:00:00', 0.13, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 15:04:16', '2026-06-11 08:04:16'),
(62, 10, 4, '2026-05-19', '2026-05-19', '08:30:00', '09:00:00', 0.07, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 15:05:03', '2026-06-11 08:05:03'),
(63, 11, 1, '2026-05-19', '2026-05-19', '08:30:00', '10:00:00', 0.20, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 15:06:47', '2026-06-11 08:06:47'),
(64, 12, 3, '2026-05-20', '2026-05-20', NULL, NULL, 1.00, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 15:08:17', '2026-06-11 08:08:17'),
(65, 22, 3, '2026-05-19', '2026-05-19', NULL, NULL, 1.00, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 15:08:55', '2026-06-11 08:08:55'),
(66, 22, 3, '2026-05-21', '2026-05-21', '08:30:00', '10:30:00', 0.27, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 15:09:46', '2026-06-11 08:09:46'),
(67, 22, 4, '2026-05-19', '2026-05-19', '08:30:00', '09:00:00', 0.07, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 15:10:39', '2026-06-11 08:10:39'),
(68, 13, 3, '2026-05-20', '2026-05-20', NULL, NULL, 1.00, 'leave', 'บันทึกรายการย้อนหลัง', 'approved', NULL, 17, '2026-06-11 15:11:13', '2026-06-11 08:11:13');

-- --------------------------------------------------------

--
-- Table structure for table `leave_request_attachments`
--

CREATE TABLE `leave_request_attachments` (
  `id` int(11) NOT NULL,
  `leave_request_id` int(11) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `stored_name` varchar(255) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `size` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- --------------------------------------------------------

--
-- Table structure for table `leave_types`
--

CREATE TABLE `leave_types` (
  `id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `max_days` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `leave_types`
--

INSERT INTO `leave_types` (`id`, `name`, `description`, `max_days`, `created_at`) VALUES
(1, 'ลาป่วย', 'ลาป่วยได้เท่าที่ใบรับรองแพทย์กำหนด โดยได้รับค่าจ้างตามปกติสูงสุดไม่เกิน 30 วันทำงานต่อปี', 30, '2024-01-01 00:00:00'),
(2, 'ลากิจ', 'ลากิจส่วนตัวไม่เกิน 5 วันต่อปี', 3, '2024-01-01 00:00:00'),
(3, 'ลาพักผ่อน', 'วันหยุดพักผ่อนประจำปี', 10, '2024-01-01 00:00:00'),
(4, 'ลาอื่นๆ', 'การลาประเภทอื่นนอกเหนือจากที่กำหนด', 5, '2024-01-01 00:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `ot_approvals`
--

CREATE TABLE `ot_approvals` (
  `id` int(11) NOT NULL,
  `ot_request_id` int(11) DEFAULT NULL,
  `approver_id` int(11) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ot_requests`
--

CREATE TABLE `ot_requests` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `ot_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `total_hours` decimal(5,2) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `current_assignee_id` int(11) DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ot_requests`
--

INSERT INTO `ot_requests` (`id`, `user_id`, `ot_date`, `start_time`, `end_time`, `total_hours`, `reason`, `status`, `current_assignee_id`, `approved_by`, `approved_at`, `created_at`) VALUES
(1, 3, '2025-04-10', '18:00:00', '21:00:00', 3.00, 'งานเร่งด่วนปิดงบประมาณ', 'pending', NULL, NULL, NULL, '2026-04-28 06:41:50');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `employee_code` varchar(50) DEFAULT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` enum('user','lead','assistant manager','manager','hr','admin') NOT NULL DEFAULT 'user',
  `supervisor_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `email` varchar(255) DEFAULT NULL,
  `email_2` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `employee_code`, `full_name`, `department`, `password`, `role`, `supervisor_id`, `created_at`, `email`, `email_2`, `phone`, `is_active`) VALUES
(1, 'MKT-0001', 'นางสาวปวิดา  กาญจนางกูล', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'manager', NULL, '2024-01-10 08:00:00', 'pawidackapsweet@outlook.com', '', '', 1),
(2, 'MKT-0002', 'นางสาวภัทรา  พงษ์การุณ', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'assistant manager', 1, '2024-01-10 08:05:00', 'phatthrackapsweet@outlook.com', '', '', 1),
(3, 'MKT-0003', 'นายพูนศักดิ์  วงศ์มกรพันธ์', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'lead', 2, '2024-01-15 09:00:00', 'poonsakckapsweet@outlook.com', '', '', 1),
(4, 'MKT-0004', 'นางสาวอนงค์กานต์  เหียดใส', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'lead', 2, '2024-01-15 09:10:00', 'anongkarnckapsweet@outlook.com', '', '', 1),
(5, 'MKT-0005', 'นางสาวพรปวีณ์  เทพวิจิตร์', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'lead', 2, '2024-01-16 09:00:00', 'p.paweeckapsweet@outlook.com', '', '', 1),
(6, 'MKT-0006', 'นางสาวนพวรรณ  ศรีเสริม', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'lead', 2, '2024-01-16 09:15:00', 'noppawanckapsweet@outlook.com', '', '', 1),
(7, 'MKT-0007', 'นางสาวสุภาภรณ์  จ้อยวงศ์', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'lead', 2, '2024-01-17 09:00:00', 'Team1ckapsweet@outlook.com', '', '', 1),
(8, 'MKT-0008', 'นางสาวรวิวรรณ  อนุตรี', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'lead', 1, '2024-01-17 09:20:00', 'rawiwunckapsweet@outlook.com', '', '', 1),
(9, 'MKT-0009', 'นางสาวจันทรรัตน์  อดิศรวรกิจ', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user', NULL, '2024-01-18 09:00:00', '', '', '', 0),
(10, 'MKT-0010', 'นางสาวอาจรีย์  ทุ่งราช', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user', 7, '2024-01-18 09:30:00', 'team2ckapsweet@outlook.com', '', '', 1),
(11, 'MKT-0011', 'นางสาวพุทธพร  พัดจีบ', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user', 8, '2024-01-18 09:30:00', 'mktcenter@outlook.com', '', '', 1),
(12, 'MKT-0012', 'นางสาวนัชนก  ไชยแป้น', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user', 5, '2024-01-18 09:30:00', 'salesckapsweet@outlook.com', '', '', 1),
(13, 'MKT-0013', 'นางสาวปานไพลิน  ปินใจ', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user', 4, '2024-01-18 09:30:00', 'parnpailinckapsweet@outlook.com', '', '', 1),
(14, 'MKT-0014', 'นางสาวธิษณา  ธัญญวิชยเวช', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user', 8, '2024-01-18 09:30:00', 'sale_e-commerce@outlook.com', '', '', 1),
(15, 'MKT-0015', 'นายวินัย  ลูกปัด', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user', 3, '2024-01-18 09:30:00', '', '', '', 1),
(16, 'MKT-0016', 'นายชยพล  อุ่มเจริญ', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user', 3, '2024-01-18 09:30:00', '', '', '', 1),
(17, 'test-0001', 'นายทดสอบระบบ', 'test', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'admin', NULL, '2024-01-18 09:30:00', 'test@test.com', 'test@test.com', '1150', 1),
(18, 'test-002', 'test', 'test', '$2b$10$1jtjQ2/u4YlNQfU24HLCB.zRM6orFD4ps9xH9P.9sB7g9D7c5I7TO', 'manager', 18, '2026-05-05 01:01:23', '', '', '', 1),
(19, 'test-003', 'test2', 'test', '$2b$10$7sqPVmdVrV.GHdXdLHD9fuI00inaJlavy.U4Iu31n5My6/E1wK25y', 'assistant manager', 18, '2026-05-05 01:02:06', '', '', '', 1),
(20, 'test-004', 'test_lead', 'test', '$2b$10$.qnuWz/AUwkD.Lys8JmS0OkPo551kHvIC3u9DgOsuskRWD.Igw4CS', 'lead', 18, '2026-05-05 01:02:28', 'programmer_ckap@outlook.com', '', '', 1),
(21, 'test-005', 'test_user', 'test', '$2b$10$ZXfnR.282qGOvb7kXH3AAeEBwEG3glsvOFWAuxhW1HG7hK62eRtC6', 'user', 18, '2026-05-05 01:02:47', 'teerapong@ckapsweet.com', '', '', 1),
(22, 'MKT-0017', 'นางสาวกนกวรรณ  แซ่ฉั่ว', 'การตลาด', '$2b$10$suCEG1o6.8JvC8h8M7BrleaVdeOIALFRM4cuBwOpUkguyrFA/msv.', 'user', 6, '2026-05-05 06:35:25', 'technicianckapsweet@outlook.com', '', '', 1);

-- --------------------------------------------------------

--
-- Table structure for table `user_leave_pool`
--

CREATE TABLE `user_leave_pool` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `total_days` decimal(6,2) NOT NULL DEFAULT 0.00,
  `used_days` decimal(6,2) NOT NULL DEFAULT 0.00,
  `year` int(11) NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- --------------------------------------------------------

--
-- Stand-in structure for view `v_audit_logs`
-- (See below for the actual view)
--
CREATE TABLE `v_audit_logs` (
`id` int(11)
,`created_at` datetime
,`action` varchar(60)
,`target_type` varchar(40)
,`target_id` int(11)
,`before_data` longtext
,`after_data` longtext
,`note` text
,`ip_address` varchar(45)
,`actor_id` int(11)
,`actor_role` varchar(20)
,`actor_name` varchar(255)
,`actor_code` varchar(50)
,`actor_dept` varchar(255)
);

-- --------------------------------------------------------

--
-- Structure for view `v_audit_logs`
--
DROP TABLE IF EXISTS `v_audit_logs`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_audit_logs`  AS SELECT `al`.`id` AS `id`, `al`.`created_at` AS `created_at`, `al`.`action` AS `action`, `al`.`target_type` AS `target_type`, `al`.`target_id` AS `target_id`, `al`.`before_data` AS `before_data`, `al`.`after_data` AS `after_data`, `al`.`note` AS `note`, `al`.`ip_address` AS `ip_address`, `al`.`actor_id` AS `actor_id`, `al`.`actor_role` AS `actor_role`, `u`.`full_name` AS `actor_name`, `u`.`employee_code` AS `actor_code`, `u`.`department` AS `actor_dept` FROM (`audit_logs` `al` join `users` `u` on(`u`.`id` = `al`.`actor_id`)) ORDER BY `al`.`created_at` DESC ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_actor` (`actor_id`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_target` (`target_type`,`target_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `events`
--
ALTER TABLE `events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_events_lead` (`lead_id`),
  ADD KEY `idx_events_creator` (`created_by`),
  ADD KEY `idx_events_department_dates` (`department`,`start_date`,`end_date`);

--
-- Indexes for table `event_external_participants`
--
ALTER TABLE `event_external_participants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_event_external_name` (`event_id`,`full_name`),
  ADD KEY `idx_event_external_participants_event` (`event_id`),
  ADD KEY `idx_event_external_participants_creator` (`created_by`);

--
-- Indexes for table `event_leads`
--
ALTER TABLE `event_leads`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_event_lead` (`event_id`,`lead_id`),
  ADD KEY `idx_event_leads_lead` (`lead_id`);

--
-- Indexes for table `event_participants`
--
ALTER TABLE `event_participants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_event_user` (`event_id`,`user_id`),
  ADD KEY `idx_event_participants_user` (`user_id`),
  ADD KEY `idx_event_participants_lead` (`selected_by_lead_id`);

--
-- Indexes for table `event_time_logs`
--
ALTER TABLE `event_time_logs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_event_time_user_date` (`event_id`,`user_id`,`event_date`),
  ADD UNIQUE KEY `uq_event_time_external_date` (`event_id`,`external_participant_id`,`event_date`),
  ADD KEY `idx_event_time_logs_user` (`user_id`),
  ADD KEY `idx_event_time_logs_external_participant` (`external_participant_id`),
  ADD KEY `idx_event_time_logs_approved_by` (`approved_by`);

--
-- Indexes for table `event_time_attachments`
--
ALTER TABLE `event_time_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_event_time_attachments_log` (`event_time_log_id`);

--
-- Indexes for table `leave_approvals`
--
ALTER TABLE `leave_approvals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leave_request_id` (`leave_request_id`),
  ADD KEY `approver_id` (`approver_id`);

--
-- Indexes for table `leave_balances`
--
ALTER TABLE `leave_balances`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `leave_type_id` (`leave_type_id`),
  ADD UNIQUE KEY `uq_leave_balances_user_type_year` (`user_id`,`leave_type_id`,`year`);

--
-- Indexes for table `leave_requests`
--
ALTER TABLE `leave_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `leave_type_id` (`leave_type_id`),
  ADD KEY `approved_by` (`approved_by`),
  ADD KEY `idx_leave_requests_user_created` (`user_id`,`created_at`),
  ADD KEY `idx_leave_requests_user_status_start` (`user_id`,`status`,`start_date`),
  ADD KEY `idx_leave_requests_status_start_end` (`status`,`start_date`,`end_date`),
  ADD KEY `idx_leave_requests_assignee` (`current_assignee_id`);

--
-- Indexes for table `leave_request_attachments`
--
ALTER TABLE `leave_request_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leave_request_id` (`leave_request_id`);

--
-- Indexes for table `leave_types`
--
ALTER TABLE `leave_types`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ot_approvals`
--
ALTER TABLE `ot_approvals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ot_request_id` (`ot_request_id`),
  ADD KEY `approver_id` (`approver_id`);

--
-- Indexes for table `ot_requests`
--
ALTER TABLE `ot_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `approved_by` (`approved_by`),
  ADD KEY `idx_ot_requests_user_created` (`user_id`,`created_at`),
  ADD KEY `idx_ot_requests_user_status_date` (`user_id`,`status`,`ot_date`),
  ADD KEY `idx_ot_requests_user_date_time` (`user_id`,`ot_date`,`start_time`,`end_time`),
  ADD KEY `idx_ot_requests_status_date` (`status`,`ot_date`),
  ADD KEY `idx_ot_requests_assignee` (`current_assignee_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_user_supervisor` (`supervisor_id`),
  ADD KEY `idx_users_is_active` (`is_active`),
  ADD KEY `idx_users_department_active_role` (`department`,`is_active`,`role`),
  ADD KEY `idx_users_role_department_active` (`role`,`department`,`is_active`),
  ADD KEY `idx_users_employee_active` (`employee_code`,`is_active`);

--
-- Indexes for table `user_leave_pool`
--
ALTER TABLE `user_leave_pool`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_user_year` (`user_id`,`year`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=109;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `events`
--
ALTER TABLE `events`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `event_external_participants`
--
ALTER TABLE `event_external_participants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `event_leads`
--
ALTER TABLE `event_leads`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `event_participants`
--
ALTER TABLE `event_participants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `event_time_logs`
--
ALTER TABLE `event_time_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `event_time_attachments`
--
ALTER TABLE `event_time_attachments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `leave_approvals`
--
ALTER TABLE `leave_approvals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- AUTO_INCREMENT for table `leave_balances`
--
ALTER TABLE `leave_balances`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=152;

--
-- AUTO_INCREMENT for table `leave_requests`
--
ALTER TABLE `leave_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=69;

--
-- AUTO_INCREMENT for table `leave_request_attachments`
--
ALTER TABLE `leave_request_attachments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `leave_types`
--
ALTER TABLE `leave_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `ot_approvals`
--
ALTER TABLE `ot_approvals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ot_requests`
--
ALTER TABLE `ot_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `user_leave_pool`
--
ALTER TABLE `user_leave_pool`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_actor_fk` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `events`
--
ALTER TABLE `events`
  ADD CONSTRAINT `events_created_by_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `events_lead_fk` FOREIGN KEY (`lead_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `event_external_participants`
--
ALTER TABLE `event_external_participants`
  ADD CONSTRAINT `event_external_participants_event_fk` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `event_external_participants_creator_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `event_leads`
--
ALTER TABLE `event_leads`
  ADD CONSTRAINT `event_leads_event_fk` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `event_leads_lead_fk` FOREIGN KEY (`lead_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `event_participants`
--
ALTER TABLE `event_participants`
  ADD CONSTRAINT `event_participants_event_fk` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `event_participants_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `event_participants_lead_fk` FOREIGN KEY (`selected_by_lead_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `event_time_logs`
--
ALTER TABLE `event_time_logs`
  ADD CONSTRAINT `event_time_logs_event_fk` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `event_time_logs_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `event_time_logs_external_participant_fk` FOREIGN KEY (`external_participant_id`) REFERENCES `event_external_participants` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `event_time_logs_approved_by_fk` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `event_time_attachments`
--
ALTER TABLE `event_time_attachments`
  ADD CONSTRAINT `event_time_attachments_log_fk` FOREIGN KEY (`event_time_log_id`) REFERENCES `event_time_logs` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `leave_approvals`
--
ALTER TABLE `leave_approvals`
  ADD CONSTRAINT `leave_approvals_ibfk_1` FOREIGN KEY (`leave_request_id`) REFERENCES `leave_requests` (`id`),
  ADD CONSTRAINT `leave_approvals_ibfk_2` FOREIGN KEY (`approver_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `leave_balances`
--
ALTER TABLE `leave_balances`
  ADD CONSTRAINT `leave_balances_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `leave_balances_ibfk_2` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`);

--
-- Constraints for table `leave_requests`
--
ALTER TABLE `leave_requests`
  ADD CONSTRAINT `leave_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `leave_requests_ibfk_2` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`),
  ADD CONSTRAINT `leave_requests_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `leave_request_attachments`
--
ALTER TABLE `leave_request_attachments`
  ADD CONSTRAINT `leave_request_attachments_ibfk_1` FOREIGN KEY (`leave_request_id`) REFERENCES `leave_requests` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `ot_approvals`
--
ALTER TABLE `ot_approvals`
  ADD CONSTRAINT `ot_approvals_ibfk_1` FOREIGN KEY (`ot_request_id`) REFERENCES `ot_requests` (`id`),
  ADD CONSTRAINT `ot_approvals_ibfk_2` FOREIGN KEY (`approver_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `ot_requests`
--
ALTER TABLE `ot_requests`
  ADD CONSTRAINT `ot_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `ot_requests_ibfk_2` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_user_supervisor` FOREIGN KEY (`supervisor_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `user_leave_pool`
--
ALTER TABLE `user_leave_pool`
  ADD CONSTRAINT `user_leave_pool_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
