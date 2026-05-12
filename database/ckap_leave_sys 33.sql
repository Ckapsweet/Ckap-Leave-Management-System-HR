-- phpMyAdmin SQL Dump
-- version 5.2.1deb3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: May 11, 2026 at 07:14 AM
-- Server version: 8.0.45-0ubuntu0.24.04.1
-- PHP Version: 8.3.6

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
  `id` int NOT NULL,
  `actor_id` int NOT NULL,
  `actor_role` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_type` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_id` int DEFAULT NULL,
  `before_data` longtext COLLATE utf8mb4_unicode_ci,
  `after_data` longtext COLLATE utf8mb4_unicode_ci,
  `note` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `actor_id`, `actor_role`, `action`, `target_type`, `target_id`, `before_data`, `after_data`, `note`, `ip_address`, `user_agent`, `created_at`) VALUES
(1, 17, 'admin', 'user.role_change', 'user', 4, '{\"role\":\"user\"}', '{\"role\":\"assistant manager\"}', 'เปลี่ยน role user → assistant manager', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '2026-04-28 13:55:02'),
(2, 17, 'admin', 'user.role_change', 'user', 4, '{\"role\":\"assistant manager\"}', '{\"role\":\"lead\"}', 'เปลี่ยน role assistant manager → lead', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '2026-04-28 14:04:07'),
(3, 16, 'user', 'leave.create', 'leave_request', 11, NULL, '{\"leave_type_id\":1,\"start_date\":\"2026-04-30\",\"end_date\":\"2026-04-30\",\"start_time\":null,\"end_time\":null,\"total_days\":1,\"reason\":\",,\",\"status\":\"pending\"}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-28 14:06:14'),
(4, 17, 'admin', 'admin.assign_subordinate', 'user', 15, NULL, '{\"supervisor_id\":3,\"full_name\":\"นายวินัย  ลูกปัด\"}', 'กำหนด user 15 เป็นลูกน้อง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '2026-04-28 14:06:41'),
(5, 17, 'admin', 'admin.assign_subordinate', 'user', 16, NULL, '{\"supervisor_id\":3,\"full_name\":\"นายชยพล  อุ่มเจริญ\"}', 'กำหนด user 16 เป็นลูกน้อง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '2026-04-28 14:06:43'),
(6, 1, 'manager', 'leave.approve', 'leave_request', 11, '{\"status\":\"pending\",\"approved_by\":null,\"approved_at\":null,\"current_assignee_id\":null}', '{\"status\":\"approved\",\"approved_by\":1,\"approved_at\":\"2026-04-28T07:07:48.217Z\",\"comment\":\"\"}', '', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-04-28 14:07:48'),
(7, 16, 'user', 'leave.create', 'leave_request', 12, NULL, '{\"leave_type_id\":3,\"start_date\":\"2026-05-01\",\"end_date\":\"2026-05-01\",\"start_time\":null,\"end_time\":null,\"total_days\":1,\"reason\":\"aa\",\"status\":\"pending\"}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-28 14:08:57'),
(8, 17, 'admin', 'leave.approve', 'leave_request', 12, '{\"status\":\"pending\",\"approved_by\":null,\"approved_at\":null,\"current_assignee_id\":3}', '{\"status\":\"approved\",\"approved_by\":17,\"approved_at\":\"2026-04-28T07:09:16.870Z\",\"comment\":\"\"}', '', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '2026-04-28 14:09:16'),
(9, 16, 'user', 'leave.create', 'leave_request', 13, NULL, '{\"leave_type_id\":3,\"start_date\":\"2026-05-05\",\"end_date\":\"2026-05-05\",\"start_time\":null,\"end_time\":null,\"total_days\":1,\"reason\":\"มม\",\"status\":\"pending\"}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-28 14:16:38'),
(10, 16, 'user', 'leave.cancel', 'leave_request', 13, '{\"status\":\"pending\",\"start_date\":\"2026-05-04T17:00:00.000Z\",\"end_date\":\"2026-05-04T17:00:00.000Z\",\"total_days\":\"1.00\",\"reason\":\"มม\"}', NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-28 14:32:38'),
(11, 16, 'user', 'leave.create', 'leave_request', 14, NULL, '{\"leave_type_id\":2,\"start_date\":\"2026-05-13\",\"end_date\":\"2026-05-13\",\"start_time\":null,\"end_time\":null,\"total_days\":1,\"reason\":\"test\",\"status\":\"pending\"}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-28 14:33:15'),
(12, 3, 'lead', 'leave.approve', 'leave_request', 14, '{\"status\":\"pending\",\"approved_by\":null,\"approved_at\":null,\"current_assignee_id\":3}', '{\"status\":\"pending\",\"approved_by\":3,\"approved_at\":\"2026-04-28T07:34:36.901Z\",\"comment\":\"\"}', '', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '2026-04-28 14:34:36'),
(13, 1, 'manager', 'leave.approve', 'leave_request', 14, '{\"status\":\"pending\",\"approved_by\":null,\"approved_at\":null,\"current_assignee_id\":2}', '{\"status\":\"approved\",\"approved_by\":1,\"approved_at\":\"2026-04-28T07:34:49.442Z\",\"comment\":\"\"}', '', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0', '2026-04-28 14:34:49'),
(14, 17, 'admin', 'balance.update_multiple', 'leave_balance', 1, NULL, '{\"balances\":[{\"leave_type_id\":1,\"total_days\":30},{\"leave_type_id\":2,\"total_days\":3},{\"leave_type_id\":3,\"total_days\":10},{\"leave_type_id\":4,\"total_days\":5}],\"totalGlobalDays\":48}', 'แก้ไขวันลาแยกประเภท ปี 2026', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 10:17:27'),
(15, 17, 'admin', 'user.role_change', 'user', 7, '{\"role\":\"user\"}', '{\"role\":\"lead\"}', 'เปลี่ยน role user → lead', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-04-29 14:18:46'),
(16, 1, 'manager', 'leave.create', 'leave_request', 15, NULL, '{\"leave_type_id\":1,\"start_date\":\"2026-05-01\",\"end_date\":\"2026-05-01\",\"start_time\":null,\"end_time\":null,\"total_days\":1,\"reason\":\"tt\",\"status\":\"approved\"}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '2026-04-30 13:26:20'),
(17, 17, 'admin', 'user.create', 'user', 18, NULL, '{\"id\":18,\"employee_code\":\"test-002\",\"full_name\":\"test\",\"department\":\"test\",\"role\":\"user\",\"supervisor_id\":null}', 'สร้าง user test-002', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '2026-05-05 08:01:23'),
(18, 17, 'admin', 'balance.update_multiple', 'leave_balance', 18, NULL, '{\"balances\":[{\"leave_type_id\":1,\"total_days\":30},{\"leave_type_id\":2,\"total_days\":3},{\"leave_type_id\":3,\"total_days\":10},{\"leave_type_id\":4,\"total_days\":5}],\"totalGlobalDays\":48}', 'แก้ไขวันลาแยกประเภท ปี 2026', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '2026-05-05 08:01:43'),
(19, 17, 'admin', 'user.create', 'user', 19, NULL, '{\"id\":19,\"employee_code\":\"test-003\",\"full_name\":\"test2\",\"department\":\"test\",\"role\":\"user\",\"supervisor_id\":null}', 'สร้าง user test-003', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '2026-05-05 08:02:06'),
(20, 17, 'admin', 'user.create', 'user', 20, NULL, '{\"id\":20,\"employee_code\":\"test-004\",\"full_name\":\"test3\",\"department\":\"test\",\"role\":\"user\",\"supervisor_id\":null}', 'สร้าง user test-004', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '2026-05-05 08:02:28'),
(21, 17, 'admin', 'user.create', 'user', 21, NULL, '{\"id\":21,\"employee_code\":\"test-005\",\"full_name\":\"test\",\"department\":\"test\",\"role\":\"user\",\"supervisor_id\":null}', 'สร้าง user test-005', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '2026-05-05 08:02:47'),
(22, 17, 'admin', 'user.role_change', 'user', 18, '{\"role\":\"user\"}', '{\"role\":\"manager\"}', 'เปลี่ยน role user → manager', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '2026-05-05 08:02:52'),
(23, 17, 'admin', 'user.role_change', 'user', 19, '{\"role\":\"user\"}', '{\"role\":\"assistant manager\"}', 'เปลี่ยน role user → assistant manager', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '2026-05-05 08:02:55'),
(24, 17, 'admin', 'user.role_change', 'user', 20, '{\"role\":\"user\"}', '{\"role\":\"lead\"}', 'เปลี่ยน role user → lead', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '2026-05-05 08:02:57'),
(25, 3, 'lead', 'leave.create', 'leave_request', 16, NULL, '{\"leave_type_id\":1,\"start_date\":\"2026-05-05\",\"end_date\":\"2026-05-05\",\"start_time\":null,\"end_time\":null,\"total_days\":1,\"reason\":\"test\",\"status\":\"pending\"}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-05 08:35:39'),
(26, 17, 'admin', 'leave.approve', 'leave_request', 16, '{\"status\":\"pending\",\"approved_by\":null,\"approved_at\":null,\"current_assignee_id\":3}', '{\"status\":\"approved\",\"approved_by\":17,\"approved_at\":\"2026-05-05T01:35:52.731Z\",\"comment\":\"\"}', '', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '2026-05-05 08:35:52'),
(27, 17, 'admin', 'admin.assign_subordinate', 'user', 19, NULL, '{\"supervisor_id\":18,\"full_name\":\"test2\"}', 'กำหนด assistant manager 19 เป็นลูกน้อง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '2026-05-05 08:57:34'),
(28, 17, 'admin', 'admin.assign_subordinate', 'user', 20, NULL, '{\"supervisor_id\":18,\"full_name\":\"test3\"}', 'กำหนด lead 20 เป็นลูกน้อง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '2026-05-05 08:57:36'),
(29, 17, 'admin', 'admin.assign_subordinate', 'user', 21, NULL, '{\"supervisor_id\":18,\"full_name\":\"test\"}', 'กำหนด user 21 เป็นลูกน้อง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '2026-05-05 08:57:37'),
(30, 18, 'manager', 'balance.update_multiple', 'leave_balance', 19, NULL, '{\"balances\":[{\"leave_type_id\":1,\"total_days\":30},{\"leave_type_id\":2,\"total_days\":3},{\"leave_type_id\":3,\"total_days\":10},{\"leave_type_id\":4,\"total_days\":5}],\"totalGlobalDays\":48}', 'แก้ไขวันลาแยกประเภท ปี 2026', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '2026-05-05 09:03:01'),
(31, 18, 'manager', 'balance.update_multiple', 'leave_balance', 20, NULL, '{\"balances\":[{\"leave_type_id\":1,\"total_days\":30},{\"leave_type_id\":2,\"total_days\":3},{\"leave_type_id\":3,\"total_days\":10},{\"leave_type_id\":4,\"total_days\":5}],\"totalGlobalDays\":48}', 'แก้ไขวันลาแยกประเภท ปี 2026', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '2026-05-05 09:03:05'),
(32, 18, 'manager', 'balance.update_multiple', 'leave_balance', 21, NULL, '{\"balances\":[{\"leave_type_id\":1,\"total_days\":30},{\"leave_type_id\":2,\"total_days\":3},{\"leave_type_id\":3,\"total_days\":10},{\"leave_type_id\":4,\"total_days\":5}],\"totalGlobalDays\":48}', 'แก้ไขวันลาแยกประเภท ปี 2026', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '2026-05-05 09:03:07'),
(33, 18, 'manager', 'leave.create', 'leave_request', 17, NULL, '{\"leave_type_id\":1,\"start_date\":\"2026-05-05\",\"end_date\":\"2026-05-05\",\"start_time\":null,\"end_time\":null,\"total_days\":1,\"reason\":\"aa\",\"status\":\"approved\"}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '2026-05-05 09:09:38'),
(34, 1, 'manager', 'leave.create', 'leave_request', 18, NULL, '{\"leave_type_id\":1,\"start_date\":\"2026-05-08\",\"end_date\":\"2026-05-08\",\"start_time\":null,\"end_time\":null,\"total_days\":1,\"reason\":\"หห\",\"status\":\"approved\"}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-05 13:16:09'),
(35, 17, 'admin', 'leave.create', 'leave_request', 19, NULL, '{\"leave_type_id\":1,\"start_date\":\"2026-05-05\",\"end_date\":\"2026-05-05\",\"start_time\":null,\"end_time\":null,\"total_days\":1,\"reason\":\"aa\",\"status\":\"pending\"}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '2026-05-05 13:22:15'),
(36, 17, 'admin', 'leave.approve', 'leave_request', 19, '{\"status\":\"pending\",\"approved_by\":null,\"approved_at\":null,\"current_assignee_id\":3}', '{\"status\":\"approved\",\"approved_by\":17,\"approved_at\":\"2026-05-05T06:22:37.472Z\",\"comment\":\"\"}', '', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '2026-05-05 13:22:37'),
(37, 17, 'admin', 'user.role_change', 'user', 5, '{\"role\":\"user\"}', '{\"role\":\"lead\"}', 'เปลี่ยน role user → lead', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-05 13:30:43'),
(38, 17, 'admin', 'user.role_change', 'user', 6, '{\"role\":\"user\"}', '{\"role\":\"lead\"}', 'เปลี่ยน role user → lead', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-05 13:30:52'),
(39, 17, 'admin', 'user.role_change', 'user', 8, '{\"role\":\"user\"}', '{\"role\":\"lead\"}', 'เปลี่ยน role user → lead', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-05 13:31:06'),
(40, 17, 'admin', 'admin.assign_subordinate', 'user', 2, NULL, '{\"supervisor_id\":1,\"full_name\":\"นางสาวภัทรา  พงษ์การุณ\"}', 'กำหนด assistant manager 2 เป็นลูกน้อง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-05 13:32:27'),
(41, 17, 'admin', 'admin.assign_subordinate', 'user', 8, NULL, '{\"supervisor_id\":1,\"full_name\":\"นางสาวรวิวรรณ  อนุตรี\"}', 'กำหนด lead 8 เป็นลูกน้อง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-05 13:32:46'),
(42, 17, 'admin', 'admin.assign_subordinate', 'user', 3, NULL, '{\"supervisor_id\":2,\"full_name\":\"นายพูนศักดิ์  วงศ์มกรพันธ์\"}', 'กำหนด lead 3 เป็นลูกน้อง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-05 13:32:54'),
(43, 17, 'admin', 'admin.assign_subordinate', 'user', 4, NULL, '{\"supervisor_id\":2,\"full_name\":\"นางสาวอนงค์กานต์  เหียดใส\"}', 'กำหนด lead 4 เป็นลูกน้อง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-05 13:32:55'),
(44, 17, 'admin', 'admin.assign_subordinate', 'user', 7, NULL, '{\"supervisor_id\":2,\"full_name\":\"นางสาวสุภาภรณ์  จ้อยวงศ์\"}', 'กำหนด lead 7 เป็นลูกน้อง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-05 13:33:13'),
(45, 17, 'admin', 'admin.assign_subordinate', 'user', 6, NULL, '{\"supervisor_id\":2,\"full_name\":\"นางสาวนพวรรณ  ศรีเสริม\"}', 'กำหนด lead 6 เป็นลูกน้อง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-05 13:33:18'),
(46, 17, 'admin', 'admin.assign_subordinate', 'user', 5, NULL, '{\"supervisor_id\":2,\"full_name\":\"นางสาวพรปวีณ์  เทพวิจิตร์\"}', 'กำหนด lead 5 เป็นลูกน้อง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-05 13:33:24'),
(47, 17, 'admin', 'admin.assign_subordinate', 'user', 13, NULL, '{\"supervisor_id\":4,\"full_name\":\"นางสาวปานไพลิน  ปินใจ\"}', 'กำหนด user 13 เป็นลูกน้อง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-05 13:34:04'),
(48, 17, 'admin', 'admin.assign_subordinate', 'user', 12, NULL, '{\"supervisor_id\":5,\"full_name\":\"นางสาวนัชนก  ไชยแป้น\"}', 'กำหนด user 12 เป็นลูกน้อง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-05 13:34:22'),
(49, 17, 'admin', 'user.create', 'user', 22, NULL, '{\"id\":22,\"employee_code\":\"MKT-0017\",\"full_name\":\"นางสาวกนกวรรณ  แซ่ฉั่ว\",\"department\":\"การตลาด\",\"role\":\"user\",\"supervisor_id\":null}', 'สร้าง user MKT-0017', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-05 13:35:25'),
(50, 17, 'admin', 'admin.assign_subordinate', 'user', 22, NULL, '{\"supervisor_id\":6,\"full_name\":\"นางสาวกนกวรรณ  แซ่ฉั่ว\"}', 'กำหนด user 22 เป็นลูกน้อง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-05 13:35:50'),
(51, 17, 'admin', 'admin.assign_subordinate', 'user', 10, NULL, '{\"supervisor_id\":7,\"full_name\":\"นางสาวอาจรีย์  ทุ่งราช\"}', 'กำหนด user 10 เป็นลูกน้อง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-05 13:36:19'),
(52, 17, 'admin', 'admin.assign_subordinate', 'user', 14, NULL, '{\"supervisor_id\":8,\"full_name\":\"นางสาวธิษณา  ธัญญวิชยเวช\"}', 'กำหนด user 14 เป็นลูกน้อง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-05 13:36:33'),
(53, 17, 'admin', 'admin.assign_subordinate', 'user', 11, NULL, '{\"supervisor_id\":8,\"full_name\":\"นางสาวพุทธพร  พัดจีบ\"}', 'กำหนด user 11 เป็นลูกน้อง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-05 13:36:39'),
(54, 17, 'admin', 'admin.assign_subordinate', 'user', 9, NULL, '{\"supervisor_id\":8,\"full_name\":\"นางสาวจันทรรัตน์  อดิศรวรกิจ\"}', 'กำหนด user 9 เป็นลูกน้อง', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-05 13:36:48'),
(55, 17, 'admin', 'balance.update_multiple', 'leave_balance', 2, NULL, '{\"balances\":[{\"leave_type_id\":1,\"total_days\":30},{\"leave_type_id\":2,\"total_days\":3},{\"leave_type_id\":3,\"total_days\":10},{\"leave_type_id\":4,\"total_days\":5}],\"totalGlobalDays\":48}', 'แก้ไขวันลาแยกประเภท ปี 2026', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-05 13:41:25'),
(56, 17, 'admin', 'balance.update_multiple', 'leave_balance', 3, NULL, '{\"balances\":[{\"leave_type_id\":1,\"total_days\":30},{\"leave_type_id\":2,\"total_days\":3},{\"leave_type_id\":3,\"total_days\":10},{\"leave_type_id\":4,\"total_days\":5}],\"totalGlobalDays\":48}', 'แก้ไขวันลาแยกประเภท ปี 2026', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-05 13:41:28'),
(57, 17, 'admin', 'balance.update_multiple', 'leave_balance', 4, NULL, '{\"balances\":[{\"leave_type_id\":1,\"total_days\":30},{\"leave_type_id\":2,\"total_days\":3},{\"leave_type_id\":3,\"total_days\":10},{\"leave_type_id\":4,\"total_days\":5}],\"totalGlobalDays\":48}', 'แก้ไขวันลาแยกประเภท ปี 2026', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-05 13:41:31'),
(58, 17, 'admin', 'balance.update_multiple', 'leave_balance', 5, NULL, '{\"balances\":[{\"leave_type_id\":1,\"total_days\":30},{\"leave_type_id\":2,\"total_days\":3},{\"leave_type_id\":3,\"total_days\":10},{\"leave_type_id\":4,\"total_days\":5}],\"totalGlobalDays\":48}', 'แก้ไขวันลาแยกประเภท ปี 2026', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-05 13:41:35'),
(59, 17, 'admin', 'balance.update_multiple', 'leave_balance', 6, NULL, '{\"balances\":[{\"leave_type_id\":1,\"total_days\":30},{\"leave_type_id\":2,\"total_days\":3},{\"leave_type_id\":3,\"total_days\":10},{\"leave_type_id\":4,\"total_days\":5}],\"totalGlobalDays\":48}', 'แก้ไขวันลาแยกประเภท ปี 2026', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-05 13:41:38'),
(60, 17, 'admin', 'balance.update_multiple', 'leave_balance', 7, NULL, '{\"balances\":[{\"leave_type_id\":1,\"total_days\":30},{\"leave_type_id\":2,\"total_days\":3},{\"leave_type_id\":3,\"total_days\":10},{\"leave_type_id\":4,\"total_days\":5}],\"totalGlobalDays\":48}', 'แก้ไขวันลาแยกประเภท ปี 2026', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-05 13:41:41'),
(61, 17, 'admin', 'balance.update_multiple', 'leave_balance', 8, NULL, '{\"balances\":[{\"leave_type_id\":1,\"total_days\":30},{\"leave_type_id\":2,\"total_days\":3},{\"leave_type_id\":3,\"total_days\":10},{\"leave_type_id\":4,\"total_days\":5}],\"totalGlobalDays\":48}', 'แก้ไขวันลาแยกประเภท ปี 2026', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-05 13:41:44'),
(62, 17, 'admin', 'balance.update_multiple', 'leave_balance', 9, NULL, '{\"balances\":[{\"leave_type_id\":1,\"total_days\":30},{\"leave_type_id\":2,\"total_days\":3},{\"leave_type_id\":3,\"total_days\":10},{\"leave_type_id\":4,\"total_days\":5}],\"totalGlobalDays\":48}', 'แก้ไขวันลาแยกประเภท ปี 2026', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-05 13:41:47'),
(63, 17, 'admin', 'balance.update_multiple', 'leave_balance', 10, NULL, '{\"balances\":[{\"leave_type_id\":1,\"total_days\":30},{\"leave_type_id\":2,\"total_days\":3},{\"leave_type_id\":3,\"total_days\":10},{\"leave_type_id\":4,\"total_days\":5}],\"totalGlobalDays\":48}', 'แก้ไขวันลาแยกประเภท ปี 2026', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-05 13:41:50'),
(64, 17, 'admin', 'balance.update_multiple', 'leave_balance', 11, NULL, '{\"balances\":[{\"leave_type_id\":1,\"total_days\":30},{\"leave_type_id\":2,\"total_days\":3},{\"leave_type_id\":3,\"total_days\":10},{\"leave_type_id\":4,\"total_days\":5}],\"totalGlobalDays\":48}', 'แก้ไขวันลาแยกประเภท ปี 2026', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-05 13:41:53'),
(65, 17, 'admin', 'balance.update_multiple', 'leave_balance', 12, NULL, '{\"balances\":[{\"leave_type_id\":1,\"total_days\":30},{\"leave_type_id\":2,\"total_days\":3},{\"leave_type_id\":3,\"total_days\":10},{\"leave_type_id\":4,\"total_days\":5}],\"totalGlobalDays\":48}', 'แก้ไขวันลาแยกประเภท ปี 2026', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-05 13:41:57'),
(66, 17, 'admin', 'balance.update_multiple', 'leave_balance', 13, NULL, '{\"balances\":[{\"leave_type_id\":1,\"total_days\":30},{\"leave_type_id\":2,\"total_days\":3},{\"leave_type_id\":3,\"total_days\":10},{\"leave_type_id\":4,\"total_days\":5}],\"totalGlobalDays\":48}', 'แก้ไขวันลาแยกประเภท ปี 2026', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-05 13:42:00'),
(67, 17, 'admin', 'balance.update_multiple', 'leave_balance', 14, NULL, '{\"balances\":[{\"leave_type_id\":1,\"total_days\":30},{\"leave_type_id\":2,\"total_days\":3},{\"leave_type_id\":3,\"total_days\":10},{\"leave_type_id\":4,\"total_days\":5}],\"totalGlobalDays\":48}', 'แก้ไขวันลาแยกประเภท ปี 2026', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-05 13:42:03'),
(68, 17, 'admin', 'balance.update_multiple', 'leave_balance', 15, NULL, '{\"balances\":[{\"leave_type_id\":1,\"total_days\":30},{\"leave_type_id\":2,\"total_days\":3},{\"leave_type_id\":3,\"total_days\":10},{\"leave_type_id\":4,\"total_days\":5}],\"totalGlobalDays\":48}', 'แก้ไขวันลาแยกประเภท ปี 2026', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-05 13:42:07'),
(69, 17, 'admin', 'balance.update_multiple', 'leave_balance', 22, NULL, '{\"balances\":[{\"leave_type_id\":1,\"total_days\":30},{\"leave_type_id\":2,\"total_days\":3},{\"leave_type_id\":3,\"total_days\":10},{\"leave_type_id\":4,\"total_days\":5}],\"totalGlobalDays\":48}', 'แก้ไขวันลาแยกประเภท ปี 2026', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-05 14:29:14'),
(70, 9, 'user', 'leave.create', 'leave_request', 20, NULL, '{\"leave_type_id\":1,\"start_date\":\"2026-05-05\",\"end_date\":\"2026-05-05\",\"start_time\":null,\"end_time\":null,\"total_days\":1,\"reason\":\"test\",\"status\":\"pending\"}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '2026-05-05 15:29:40'),
(71, 8, 'lead', 'leave.approve', 'leave_request', 20, '{\"status\":\"pending\",\"approved_by\":null,\"approved_at\":null,\"current_assignee_id\":8}', '{\"status\":\"pending\",\"approved_by\":8,\"approved_at\":\"2026-05-05T08:32:00.073Z\",\"comment\":\"\"}', '', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '2026-05-05 15:32:00'),
(72, 2, 'assistant manager', 'leave.approve', 'leave_request', 20, '{\"status\":\"pending\",\"approved_by\":null,\"approved_at\":null,\"current_assignee_id\":2}', '{\"status\":\"pending\",\"approved_by\":2,\"approved_at\":\"2026-05-05T08:33:48.231Z\",\"comment\":\"\"}', '', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-05 15:33:48'),
(73, 1, 'manager', 'leave.approve', 'leave_request', 20, '{\"status\":\"pending\",\"approved_by\":null,\"approved_at\":null,\"current_assignee_id\":1}', '{\"status\":\"approved\",\"approved_by\":1,\"approved_at\":\"2026-05-05T08:34:17.380Z\",\"comment\":\"\"}', '', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-05 15:34:17'),
(74, 17, 'admin', 'leave.create', 'leave_request', 21, NULL, '{\"leave_type_id\":\"1\",\"start_date\":\"2026-05-06\",\"end_date\":\"2026-05-06\",\"start_time\":null,\"end_time\":null,\"total_days\":\"1\",\"request_type\":\"leave\",\"reason\":\"test\",\"status\":\"pending\",\"attachments\":[{\"original_name\":\"à¸¥à¸±à¸à¸à¹à¸³à¹à¸à¸·à¹à¸­à¸¡à¹à¸à¹à¸¡à¸à¹à¸.png\",\"mime_type\":\"image/png\",\"size\":1558129}]}', NULL, '127.0.0.1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36 Edg/147.0.0.0', '2026-05-06 09:32:13'),
(75, 17, 'admin', 'leave.create', 'leave_request', 22, NULL, '{\"leave_type_id\":\"4\",\"start_date\":\"2026-05-06\",\"end_date\":\"2026-05-06\",\"start_time\":null,\"end_time\":null,\"total_days\":\"1\",\"request_type\":\"leave\",\"reason\":\"55\",\"status\":\"pending\",\"attachments\":[{\"original_name\":\"ลังน้ำเชื่อมละลายเร็ว.png\",\"mime_type\":\"image/png\",\"size\":2676379}]}', NULL, '127.0.0.1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36 Edg/147.0.0.0', '2026-05-06 10:19:50'),
(76, 17, 'admin', 'leave.create', 'leave_request', 23, NULL, '{\"leave_type_id\":\"1\",\"start_date\":\"2026-05-06\",\"end_date\":\"2026-05-06\",\"start_time\":null,\"end_time\":null,\"total_days\":\"1\",\"request_type\":\"leave\",\"reason\":\"test\",\"status\":\"pending\",\"attachments\":[{\"original_name\":\"receipt.jpg\",\"mime_type\":\"image/jpeg\",\"size\":279726}]}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-06 15:05:30'),
(77, 17, 'admin', 'leave.create', 'leave_request', 24, NULL, '{\"leave_type_id\":4,\"start_date\":\"2026-05-07\",\"end_date\":\"2026-05-07\",\"start_time\":null,\"end_time\":null,\"total_days\":1,\"request_type\":\"leave\",\"reason\":\"test\",\"status\":\"pending\",\"attachments\":[]}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-06 15:08:26'),
(78, 17, 'admin', 'leave.create', 'leave_request', 25, NULL, '{\"leave_type_id\":4,\"start_date\":\"2026-05-06\",\"end_date\":\"2026-05-06\",\"start_time\":null,\"end_time\":null,\"total_days\":1,\"request_type\":\"leave\",\"reason\":\"tt\",\"status\":\"pending\",\"attachments\":[]}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-06 15:11:48'),
(79, 17, 'admin', 'leave.create', 'leave_request', 26, NULL, '{\"leave_type_id\":2,\"start_date\":\"2026-05-06\",\"end_date\":\"2026-05-06\",\"start_time\":null,\"end_time\":null,\"total_days\":1,\"request_type\":\"leave\",\"reason\":\"ฟฟ\",\"status\":\"pending\",\"attachments\":[]}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-06 15:54:29'),
(80, 17, 'admin', 'leave.create', 'leave_request', 27, NULL, '{\"leave_type_id\":2,\"start_date\":\"2026-05-07\",\"end_date\":\"2026-05-07\",\"start_time\":null,\"end_time\":null,\"total_days\":1,\"request_type\":\"leave\",\"reason\":\"test\",\"status\":\"pending\",\"attachments\":[]}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '2026-05-07 08:50:26'),
(81, 17, 'admin', 'leave.create', 'leave_request', 28, NULL, '{\"leave_type_id\":1,\"start_date\":\"2026-05-07\",\"end_date\":\"2026-05-07\",\"start_time\":null,\"end_time\":null,\"total_days\":1,\"request_type\":\"leave\",\"reason\":\"test noti\",\"status\":\"pending\",\"attachments\":[]}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '2026-05-07 10:46:24'),
(82, 17, 'admin', 'leave.create', 'leave_request', 29, NULL, '{\"leave_type_id\":1,\"start_date\":\"2026-05-07\",\"end_date\":\"2026-05-07\",\"start_time\":null,\"end_time\":null,\"total_days\":1,\"request_type\":\"leave\",\"reason\":\"test noti2\\n\",\"status\":\"pending\",\"attachments\":[]}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '2026-05-07 10:47:13'),
(83, 17, 'admin', 'leave.create', 'leave_request', 30, NULL, '{\"leave_type_id\":2,\"start_date\":\"2026-05-07\",\"end_date\":\"2026-05-07\",\"start_time\":null,\"end_time\":null,\"total_days\":1,\"request_type\":\"leave\",\"reason\":\"test noti3\",\"status\":\"pending\",\"attachments\":[]}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '2026-05-07 10:53:20'),
(84, 17, 'admin', 'leave.approve', 'leave_request', 30, '{\"status\":\"pending\",\"approved_by\":null,\"approved_at\":null,\"current_assignee_id\":3}', '{\"status\":\"approved\",\"approved_by\":17,\"approved_at\":\"2026-05-07T04:07:21.003Z\",\"comment\":\"\"}', '', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', '2026-05-07 11:07:21'),
(85, 11, 'user', 'leave.create', 'leave_request', 31, NULL, '{\"leave_type_id\":\"1\",\"start_date\":\"2026-05-07\",\"end_date\":\"2026-05-07\",\"start_time\":null,\"end_time\":null,\"total_days\":\"1\",\"request_type\":\"leave\",\"reason\":\"test noti\",\"status\":\"pending\",\"attachments\":[{\"original_name\":\"ลังน้ำเชื่อมเข้มข้น.png\",\"mime_type\":\"image/png\",\"size\":1558129}]}', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', '2026-05-07 11:19:54'),
(86, 21, 'user', 'leave.create', 'leave_request', 32, NULL, '{\"leave_type_id\":\"1\",\"start_date\":\"2026-05-11\",\"end_date\":\"2026-05-11\",\"start_time\":null,\"end_time\":null,\"total_days\":\"1\",\"request_type\":\"leave\",\"reason\":\"test\",\"status\":\"pending\",\"attachments\":[{\"original_name\":\"receipt.jpg\",\"mime_type\":\"image/jpeg\",\"size\":279726}]}', NULL, '192.168.0.208', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 Edg/148.0.0.0', '2026-05-11 04:26:52'),
(87, 17, 'admin', 'admin.assign_subordinate', 'user', 18, NULL, '{\"supervisor_id\":18,\"full_name\":\"test\"}', 'กำหนด manager 18 เป็นลูกน้อง', '192.168.0.208', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0', '2026-05-11 04:29:16'),
(88, 12, 'user', 'leave.create', 'leave_request', 33, NULL, '{\"leave_type_id\":\"1\",\"start_date\":\"2026-05-11\",\"end_date\":\"2026-05-11\",\"start_time\":null,\"end_time\":null,\"total_days\":\"1\",\"request_type\":\"leave\",\"reason\":\"test\",\"status\":\"pending\",\"attachments\":[{\"original_name\":\"ลังน้ำเชื่อมเข้มข้น.png\",\"mime_type\":\"image/png\",\"size\":1558129}]}', NULL, '192.168.0.208', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36 Edg/148.0.0.0', '2026-05-11 04:32:47'),
(89, 12, 'user', 'leave.cancel', 'leave_request', 33, '{\"status\":\"pending\",\"start_date\":\"2026-05-11T00:00:00.000Z\",\"end_date\":\"2026-05-11T00:00:00.000Z\",\"total_days\":\"1.00\",\"reason\":\"test\"}', NULL, NULL, '192.168.0.208', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36 Edg/148.0.0.0', '2026-05-11 04:36:41'),
(90, 12, 'user', 'leave.create', 'leave_request', 34, NULL, '{\"leave_type_id\":\"1\",\"start_date\":\"2026-05-04\",\"end_date\":\"2026-05-04\",\"start_time\":null,\"end_time\":null,\"total_days\":\"1\",\"request_type\":\"leave\",\"reason\":\"test\",\"status\":\"pending\",\"attachments\":[{\"original_name\":\"ลังน้ำเชื่อมละลายเร็ว.png\",\"mime_type\":\"image/png\",\"size\":2676379}]}', NULL, '192.168.0.208', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36 Edg/148.0.0.0', '2026-05-11 04:37:06'),
(91, 12, 'user', 'leave.cancel', 'leave_request', 34, '{\"status\":\"pending\",\"start_date\":\"2026-05-04T00:00:00.000Z\",\"end_date\":\"2026-05-04T00:00:00.000Z\",\"total_days\":\"1.00\",\"reason\":\"test\"}', NULL, NULL, '192.168.0.208', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36 Edg/148.0.0.0', '2026-05-11 04:46:24'),
(92, 12, 'user', 'leave.create', 'leave_request', 35, NULL, '{\"leave_type_id\":\"1\",\"start_date\":\"2026-05-18\",\"end_date\":\"2026-05-18\",\"start_time\":null,\"end_time\":null,\"total_days\":\"1\",\"request_type\":\"leave\",\"reason\":\"dada\",\"status\":\"pending\",\"attachments\":[{\"original_name\":\"receipt.jpg\",\"mime_type\":\"image/jpeg\",\"size\":279726}]}', NULL, '192.168.0.208', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36 Edg/148.0.0.0', '2026-05-11 04:46:57'),
(93, 12, 'user', 'leave.create', 'leave_request', 36, NULL, '{\"leave_type_id\":\"1\",\"start_date\":\"2026-05-11\",\"end_date\":\"2026-05-11\",\"start_time\":null,\"end_time\":null,\"total_days\":\"1\",\"request_type\":\"leave\",\"reason\":\"test\",\"status\":\"pending\",\"attachments\":[{\"original_name\":\"Screenshot 2026-03-11 082136.png\",\"mime_type\":\"image/png\",\"size\":9249}]}', NULL, '192.168.0.208', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36 Edg/148.0.0.0', '2026-05-11 04:49:56'),
(94, 12, 'user', 'leave.cancel', 'leave_request', 36, '{\"status\":\"pending\",\"start_date\":\"2026-05-11T00:00:00.000Z\",\"end_date\":\"2026-05-11T00:00:00.000Z\",\"total_days\":\"1.00\",\"reason\":\"test\"}', NULL, NULL, '192.168.0.208', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36 Edg/148.0.0.0', '2026-05-11 06:07:36'),
(95, 12, 'user', 'leave.cancel', 'leave_request', 35, '{\"status\":\"pending\",\"start_date\":\"2026-05-18T00:00:00.000Z\",\"end_date\":\"2026-05-18T00:00:00.000Z\",\"total_days\":\"1.00\",\"reason\":\"dada\"}', NULL, NULL, '192.168.0.208', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36 Edg/148.0.0.0', '2026-05-11 06:07:40'),
(96, 12, 'user', 'leave.create', 'leave_request', 37, NULL, '{\"leave_type_id\":\"1\",\"start_date\":\"2026-05-18\",\"end_date\":\"2026-05-18\",\"start_time\":null,\"end_time\":null,\"total_days\":\"1\",\"request_type\":\"leave\",\"reason\":\"aa\",\"status\":\"pending\",\"attachments\":[{\"original_name\":\"Screenshot 2026-03-12 103059.png\",\"mime_type\":\"image/png\",\"size\":98877}]}', NULL, '192.168.0.208', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36 Edg/148.0.0.0', '2026-05-11 06:08:12');

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `name`, `created_at`) VALUES
(2, 'การตลาด', '2026-04-28 06:41:49'),
(6, 'test02', '2026-04-28 06:43:22'),
(7, 'test', '2026-05-05 01:01:03');

-- --------------------------------------------------------

--
-- Table structure for table `leave_approvals`
--

CREATE TABLE `leave_approvals` (
  `id` int NOT NULL,
  `leave_request_id` int DEFAULT NULL,
  `approver_id` int DEFAULT NULL,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `approved_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `leave_approvals`
--

INSERT INTO `leave_approvals` (`id`, `leave_request_id`, `approver_id`, `status`, `comment`, `approved_at`) VALUES
(9, 11, 1, 'approved', '', '2026-04-28 14:07:48'),
(10, 12, 17, 'approved', '', '2026-04-28 14:09:16'),
(11, 14, 3, 'approved', '', '2026-04-28 14:34:36'),
(12, 14, 1, 'approved', '', '2026-04-28 14:34:49'),
(13, 15, 1, 'approved', 'อนุมัติอัตโนมัติ (สิทธิ์ Manager)', '2026-04-30 13:26:19'),
(14, 16, 17, 'approved', '', '2026-05-05 08:35:52'),
(15, 17, 18, 'approved', 'อนุมัติอัตโนมัติ (สิทธิ์ Manager)', '2026-05-05 09:09:38'),
(16, 18, 1, 'approved', 'อนุมัติอัตโนมัติ (สิทธิ์ Manager)', '2026-05-05 13:16:09'),
(17, 19, 17, 'approved', '', '2026-05-05 13:22:37'),
(18, 20, 8, 'approved', '', '2026-05-05 15:32:00'),
(19, 20, 2, 'approved', '', '2026-05-05 15:33:48'),
(20, 20, 1, 'approved', '', '2026-05-05 15:34:17'),
(21, 30, 17, 'approved', '', '2026-05-07 11:07:21');

-- --------------------------------------------------------

--
-- Table structure for table `leave_balances`
--

CREATE TABLE `leave_balances` (
  `id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `leave_type_id` int DEFAULT NULL,
  `total_days` int DEFAULT NULL,
  `used_days` int DEFAULT '0',
  `year` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `leave_balances`
--

INSERT INTO `leave_balances` (`id`, `user_id`, `leave_type_id`, `total_days`, `used_days`, `year`) VALUES
(33, 1, 1, 30, 0, 2026),
(34, 1, 2, 3, 0, 2026),
(35, 1, 3, 10, 0, 2026),
(36, 1, 4, 5, 0, 2026),
(37, 1, 1, 30, 1, 2026),
(38, 18, 1, 30, 0, 2026),
(39, 18, 2, 3, 0, 2026),
(40, 18, 3, 10, 0, 2026),
(41, 18, 4, 5, 0, 2026),
(42, 3, 1, 30, 1, 2026),
(43, 19, 1, 30, 0, 2026),
(44, 19, 2, 3, 0, 2026),
(45, 19, 3, 10, 0, 2026),
(46, 19, 4, 5, 0, 2026),
(47, 20, 1, 30, 0, 2026),
(48, 20, 2, 3, 0, 2026),
(49, 20, 3, 10, 0, 2026),
(50, 20, 4, 5, 0, 2026),
(51, 21, 1, 30, 0, 2026),
(52, 21, 2, 3, 0, 2026),
(53, 21, 3, 10, 0, 2026),
(54, 21, 4, 5, 0, 2026),
(55, 18, 1, 30, 1, 2026),
(56, 1, 1, 30, 1, 2026),
(57, 17, 1, 30, 1, 2026),
(58, 2, 1, 30, 0, 2026),
(59, 2, 2, 3, 0, 2026),
(60, 2, 3, 10, 0, 2026),
(61, 2, 4, 5, 0, 2026),
(62, 3, 1, 30, 1, 2026),
(63, 3, 2, 3, 0, 2026),
(64, 3, 3, 10, 0, 2026),
(65, 3, 4, 5, 0, 2026),
(66, 4, 1, 30, 0, 2026),
(67, 4, 2, 3, 0, 2026),
(68, 4, 3, 10, 0, 2026),
(69, 4, 4, 5, 0, 2026),
(70, 5, 1, 30, 0, 2026),
(71, 5, 2, 3, 0, 2026),
(72, 5, 3, 10, 0, 2026),
(73, 5, 4, 5, 0, 2026),
(74, 6, 1, 30, 0, 2026),
(75, 6, 2, 3, 0, 2026),
(76, 6, 3, 10, 0, 2026),
(77, 6, 4, 5, 0, 2026),
(78, 7, 1, 30, 0, 2026),
(79, 7, 2, 3, 0, 2026),
(80, 7, 3, 10, 0, 2026),
(81, 7, 4, 5, 0, 2026),
(82, 8, 1, 30, 0, 2026),
(83, 8, 2, 3, 0, 2026),
(84, 8, 3, 10, 0, 2026),
(85, 8, 4, 5, 0, 2026),
(86, 9, 1, 30, 0, 2026),
(87, 9, 2, 3, 0, 2026),
(88, 9, 3, 10, 0, 2026),
(89, 9, 4, 5, 0, 2026),
(90, 10, 1, 30, 0, 2026),
(91, 10, 2, 3, 0, 2026),
(92, 10, 3, 10, 0, 2026),
(93, 10, 4, 5, 0, 2026),
(94, 11, 1, 30, 0, 2026),
(95, 11, 2, 3, 0, 2026),
(96, 11, 3, 10, 0, 2026),
(97, 11, 4, 5, 0, 2026),
(98, 12, 1, 30, 0, 2026),
(99, 12, 2, 3, 0, 2026),
(100, 12, 3, 10, 0, 2026),
(101, 12, 4, 5, 0, 2026),
(102, 13, 1, 30, 0, 2026),
(103, 13, 2, 3, 0, 2026),
(104, 13, 3, 10, 0, 2026),
(105, 13, 4, 5, 0, 2026),
(106, 14, 1, 30, 0, 2026),
(107, 14, 2, 3, 0, 2026),
(108, 14, 3, 10, 0, 2026),
(109, 14, 4, 5, 0, 2026),
(110, 15, 1, 30, 0, 2026),
(111, 15, 2, 3, 0, 2026),
(112, 15, 3, 10, 0, 2026),
(113, 15, 4, 5, 0, 2026),
(114, 22, 1, 30, 0, 2026),
(115, 22, 2, 3, 0, 2026),
(116, 22, 3, 10, 0, 2026),
(117, 22, 4, 5, 0, 2026),
(118, 9, 1, 30, 1, 2026),
(119, 17, 2, 3, 1, 2026);

-- --------------------------------------------------------

--
-- Table structure for table `leave_requests`
--

CREATE TABLE `leave_requests` (
  `id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `leave_type_id` int DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `total_days` decimal(5,2) DEFAULT NULL,
  `request_type` enum('leave','late') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'leave',
  `reason` text COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `current_assignee_id` int DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `leave_requests`
--

INSERT INTO `leave_requests` (`id`, `user_id`, `leave_type_id`, `start_date`, `end_date`, `start_time`, `end_time`, `total_days`, `request_type`, `reason`, `status`, `current_assignee_id`, `approved_by`, `approved_at`, `created_at`) VALUES
(11, 16, 1, '2026-04-30', '2026-04-30', NULL, NULL, 1.00, 'leave', ',,', 'approved', NULL, 1, '2026-04-28 14:07:48', '2026-04-28 07:06:14'),
(12, 16, 3, '2026-05-01', '2026-05-01', NULL, NULL, 1.00, 'leave', 'aa', 'approved', NULL, 17, '2026-04-28 14:09:16', '2026-04-28 07:08:57'),
(14, 16, 2, '2026-05-13', '2026-05-13', NULL, NULL, 1.00, 'leave', 'test', 'approved', NULL, 1, '2026-04-28 14:34:49', '2026-04-28 07:33:15'),
(15, 1, 1, '2026-05-01', '2026-05-01', NULL, NULL, 1.00, 'leave', 'tt', 'approved', NULL, 1, '2026-04-30 13:26:19', '2026-04-30 06:26:19'),
(16, 3, 1, '2026-05-05', '2026-05-05', NULL, NULL, 1.00, 'leave', 'test', 'approved', NULL, 17, '2026-05-05 08:35:52', '2026-05-05 01:35:39'),
(17, 18, 1, '2026-05-05', '2026-05-05', NULL, NULL, 1.00, 'leave', 'aa', 'approved', NULL, 18, '2026-05-05 09:09:38', '2026-05-05 02:09:38'),
(18, 1, 1, '2026-05-08', '2026-05-08', NULL, NULL, 1.00, 'leave', 'หห', 'approved', NULL, 1, '2026-05-05 13:16:09', '2026-05-05 06:16:09'),
(19, 17, 1, '2026-05-05', '2026-05-05', NULL, NULL, 1.00, 'leave', 'aa', 'approved', NULL, 17, '2026-05-05 13:22:37', '2026-05-05 06:22:15'),
(20, 9, 1, '2026-05-05', '2026-05-05', NULL, NULL, 1.00, 'leave', 'test', 'approved', NULL, 1, '2026-05-05 15:34:17', '2026-05-05 08:29:40'),
(21, 17, 1, '2026-05-06', '2026-05-06', NULL, NULL, 1.00, 'leave', 'test', 'pending', 3, NULL, NULL, '2026-05-06 02:32:13'),
(22, 17, 4, '2026-05-06', '2026-05-06', NULL, NULL, 1.00, 'leave', '55', 'pending', 3, NULL, NULL, '2026-05-06 03:19:50'),
(23, 17, 1, '2026-05-06', '2026-05-06', NULL, NULL, 1.00, 'leave', 'test', 'pending', 3, NULL, NULL, '2026-05-06 08:05:30'),
(24, 17, 4, '2026-05-07', '2026-05-07', NULL, NULL, 1.00, 'leave', 'test', 'pending', 3, NULL, NULL, '2026-05-06 08:08:26'),
(25, 17, 4, '2026-05-06', '2026-05-06', NULL, NULL, 1.00, 'leave', 'tt', 'pending', 3, NULL, NULL, '2026-05-06 08:11:48'),
(26, 17, 2, '2026-05-06', '2026-05-06', NULL, NULL, 1.00, 'leave', 'ฟฟ', 'pending', 3, NULL, NULL, '2026-05-06 08:54:29'),
(27, 17, 2, '2026-05-07', '2026-05-07', NULL, NULL, 1.00, 'leave', 'test', 'pending', 3, NULL, NULL, '2026-05-07 01:50:26'),
(28, 17, 1, '2026-05-07', '2026-05-07', NULL, NULL, 1.00, 'leave', 'test noti', 'pending', 3, NULL, NULL, '2026-05-07 03:46:24'),
(29, 17, 1, '2026-05-07', '2026-05-07', NULL, NULL, 1.00, 'leave', 'test noti2\n', 'pending', 3, NULL, NULL, '2026-05-07 03:47:13'),
(30, 17, 2, '2026-05-07', '2026-05-07', NULL, NULL, 1.00, 'leave', 'test noti3', 'approved', NULL, 17, '2026-05-07 11:07:21', '2026-05-07 03:53:20'),
(31, 11, 1, '2026-05-07', '2026-05-07', NULL, NULL, 1.00, 'leave', 'test noti', 'pending', 8, NULL, NULL, '2026-05-07 04:19:54'),
(32, 21, 1, '2026-05-11', '2026-05-11', NULL, NULL, 1.00, 'leave', 'test', 'pending', 18, NULL, NULL, '2026-05-11 04:26:52'),
(37, 12, 1, '2026-05-18', '2026-05-18', NULL, NULL, 1.00, 'leave', 'aa', 'pending', 5, NULL, NULL, '2026-05-11 06:08:12');

-- --------------------------------------------------------

--
-- Table structure for table `leave_request_attachments`
--

CREATE TABLE `leave_request_attachments` (
  `id` int NOT NULL,
  `leave_request_id` int NOT NULL,
  `original_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stored_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `size` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `leave_request_attachments`
--

INSERT INTO `leave_request_attachments` (`id`, `leave_request_id`, `original_name`, `stored_name`, `mime_type`, `size`, `created_at`) VALUES
(1, 21, 'à¸¥à¸±à¸à¸à¹à¸³à¹à¸à¸·à¹à¸­à¸¡à¹à¸à¹à¸¡à¸à¹à¸.png', '1778034733324-159577568.png', 'image/png', 1558129, '2026-05-06 02:32:13'),
(2, 22, 'ลังน้ำเชื่อมละลายเร็ว.png', '1778037590172-336102438.png', 'image/png', 2676379, '2026-05-06 03:19:50'),
(3, 23, 'receipt.jpg', '1778054730752-3218114.jpg', 'image/jpeg', 279726, '2026-05-06 08:05:30'),
(4, 31, 'ลังน้ำเชื่อมเข้มข้น.png', '1778127594575-960020349.png', 'image/png', 1558129, '2026-05-07 04:19:54'),
(5, 32, 'receipt.jpg', '1778473612187-920273544.jpg', 'image/jpeg', 279726, '2026-05-11 04:26:52'),
(10, 37, 'Screenshot 2026-03-12 103059.png', '1778479692379-515590589.png', 'image/png', 98877, '2026-05-11 06:08:12');

-- --------------------------------------------------------

--
-- Table structure for table `leave_types`
--

CREATE TABLE `leave_types` (
  `id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `max_days` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `leave_types`
--

INSERT INTO `leave_types` (`id`, `name`, `description`, `max_days`, `created_at`) VALUES
(1, 'ลาป่วย', 'ลาป่วยตามกฎหมายแรงงาน ม.32', 30, '2024-01-01 00:00:00'),
(2, 'ลากิจ', 'ลากิจส่วนตัว', 3, '2024-01-01 00:00:00'),
(3, 'ลาพักผ่อน', 'วันหยุดพักผ่อนประจำปี', 10, '2024-01-01 00:00:00'),
(4, 'ลาอื่นๆ', 'การลาประเภทอื่นนอกเหนือจากที่กำหนด', 5, '2024-01-01 00:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `ot_approvals`
--

CREATE TABLE `ot_approvals` (
  `id` int NOT NULL,
  `ot_request_id` int DEFAULT NULL,
  `approver_id` int DEFAULT NULL,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `approved_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ot_requests`
--

CREATE TABLE `ot_requests` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `ot_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `total_hours` decimal(5,2) DEFAULT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `current_assignee_id` int DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
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
  `id` int NOT NULL,
  `employee_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('user','lead','assistant manager','manager','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  `supervisor_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_2` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `employee_code`, `full_name`, `department`, `password`, `role`, `supervisor_id`, `created_at`, `email`, `email_2`, `phone`) VALUES
(1, 'MKT-0001', 'นางสาวปวิดา  กาญจนางกูล', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'manager', NULL, '2024-01-10 08:00:00', 'pawidackapsweet@outlook.com', '', ''),
(2, 'MKT-0002', 'นางสาวภัทรา  พงษ์การุณ', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'assistant manager', 1, '2024-01-10 08:05:00', 'phatthrackapsweet@outlook.com', '', ''),
(3, 'MKT-0003', 'นายพูนศักดิ์  วงศ์มกรพันธ์', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'lead', 2, '2024-01-15 09:00:00', 'poonsakckapsweet@outlook.com', '', ''),
(4, 'MKT-0004', 'นางสาวอนงค์กานต์  เหียดใส', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'lead', 2, '2024-01-15 09:10:00', 'anongkarnckapsweet@outlook.com', '', ''),
(5, 'MKT-0005', 'นางสาวพรปวีณ์  เทพวิจิตร์', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'lead', 2, '2024-01-16 09:00:00', 'p.paweeckapsweet@outlook.com', '', ''),
(6, 'MKT-0006', 'นางสาวนพวรรณ  ศรีเสริม', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'lead', 2, '2024-01-16 09:15:00', 'noppawanckapsweet@outlook.com', '', ''),
(7, 'MKT-0007', 'นางสาวสุภาภรณ์  จ้อยวงศ์', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'lead', 2, '2024-01-17 09:00:00', 'Team1ckapsweet@outlook.com', '', ''),
(8, 'MKT-0008', 'นางสาวรวิวรรณ  อนุตรี', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'lead', 1, '2024-01-17 09:20:00', 'rawiwunckapsweet@outlook.com', '', ''),
(9, 'MKT-0009', 'นางสาวจันทรรัตน์  อดิศรวรกิจ', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user', 8, '2024-01-18 09:00:00', '', '', ''),
(10, 'MKT-0010', 'นางสาวอาจรีย์  ทุ่งราช', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user', 7, '2024-01-18 09:30:00', 'team2ckapsweet@outlook.com', '', ''),
(11, 'MKT-0011', 'นางสาวพุทธพร  พัดจีบ', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user', 8, '2024-01-18 09:30:00', 'mktcenter@outlook.com', '', ''),
(12, 'MKT-0012', 'นางสาวนัชนก  ไชยแป้น', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user', 5, '2024-01-18 09:30:00', 'salesckapsweet@outlook.com', '', ''),
(13, 'MKT-0013', 'นางสาวปานไพลิน  ปินใจ', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user', 4, '2024-01-18 09:30:00', 'parnpailinckapsweet@outlook.com', '', ''),
(14, 'MKT-0014', 'นางสาวธิษณา  ธัญญวิชยเวช', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user', 8, '2024-01-18 09:30:00', '', '', ''),
(15, 'MKT-0015', 'นายวินัย  ลูกปัด', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user', 3, '2024-01-18 09:30:00', '', '', ''),
(16, 'MKT-0016', 'นายชยพล  อุ่มเจริญ', 'การตลาด', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'user', 3, '2024-01-18 09:30:00', '', '', ''),
(17, 'test-0001', 'นายทดสอบระบบ', 'test', '$2b$10$tmAJpS106x3jW7jLFhbrPOBviIhXp1spJzAybxPR1HOLg6tSbYn8C', 'admin', NULL, '2024-01-18 09:30:00', 'test@test.com', 'test@test.com', '1150'),
(18, 'test-002', 'test', 'test', '$2b$10$1jtjQ2/u4YlNQfU24HLCB.zRM6orFD4ps9xH9P.9sB7g9D7c5I7TO', 'manager', 18, '2026-05-05 01:01:23', '', '', ''),
(19, 'test-003', 'test2', 'test', '$2b$10$7sqPVmdVrV.GHdXdLHD9fuI00inaJlavy.U4Iu31n5My6/E1wK25y', 'assistant manager', 18, '2026-05-05 01:02:06', '', '', ''),
(20, 'test-004', 'test3', 'test', '$2b$10$.qnuWz/AUwkD.Lys8JmS0OkPo551kHvIC3u9DgOsuskRWD.Igw4CS', 'lead', 18, '2026-05-05 01:02:28', '', '', ''),
(21, 'test-005', 'test', 'test', '$2b$10$ZXfnR.282qGOvb7kXH3AAeEBwEG3glsvOFWAuxhW1HG7hK62eRtC6', 'user', 18, '2026-05-05 01:02:47', '', '', ''),
(22, 'MKT-0017', 'นางสาวกนกวรรณ  แซ่ฉั่ว', 'การตลาด', '$2b$10$suCEG1o6.8JvC8h8M7BrleaVdeOIALFRM4cuBwOpUkguyrFA/msv.', 'user', 6, '2026-05-05 06:35:25', 'technicianckapsweet@outlook.com', '', '');

-- --------------------------------------------------------

--
-- Table structure for table `user_leave_pool`
--

CREATE TABLE `user_leave_pool` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `total_days` decimal(6,2) NOT NULL DEFAULT '0.00',
  `used_days` decimal(6,2) NOT NULL DEFAULT '0.00',
  `year` int NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_leave_pool`
--

INSERT INTO `user_leave_pool` (`id`, `user_id`, `total_days`, `used_days`, `year`, `updated_at`) VALUES
(1, 16, 15.00, 3.00, 2026, '2026-04-28 07:34:49'),
(2, 1, 48.00, 2.00, 2026, '2026-05-05 06:16:09'),
(3, 18, 48.00, 1.00, 2026, '2026-05-05 02:09:38'),
(4, 19, 48.00, 0.00, 2026, '2026-05-05 02:03:01'),
(5, 20, 48.00, 0.00, 2026, '2026-05-05 02:03:05'),
(6, 21, 48.00, 0.00, 2026, '2026-05-05 02:03:07'),
(7, 2, 48.00, 0.00, 2026, '2026-05-05 06:41:25'),
(8, 3, 48.00, 1.00, 2026, '2026-05-05 06:41:28'),
(9, 4, 48.00, 0.00, 2026, '2026-05-05 06:41:31'),
(10, 5, 48.00, 0.00, 2026, '2026-05-05 06:41:35'),
(11, 6, 48.00, 0.00, 2026, '2026-05-05 06:41:38'),
(12, 7, 48.00, 0.00, 2026, '2026-05-05 06:41:41'),
(13, 8, 48.00, 0.00, 2026, '2026-05-05 06:41:44'),
(14, 9, 48.00, 1.00, 2026, '2026-05-05 08:34:17'),
(15, 10, 48.00, 0.00, 2026, '2026-05-05 06:41:50'),
(16, 11, 48.00, 0.00, 2026, '2026-05-05 06:41:53'),
(17, 12, 48.00, 0.00, 2026, '2026-05-05 06:41:57'),
(18, 13, 48.00, 0.00, 2026, '2026-05-05 06:42:00'),
(19, 14, 48.00, 0.00, 2026, '2026-05-05 06:42:03'),
(20, 15, 48.00, 0.00, 2026, '2026-05-05 06:42:07'),
(21, 22, 48.00, 0.00, 2026, '2026-05-05 07:29:14');

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_audit_logs`
-- (See below for the actual view)
--
CREATE TABLE `v_audit_logs` (
`id` int
,`created_at` datetime
,`action` varchar(60)
,`target_type` varchar(40)
,`target_id` int
,`before_data` longtext
,`after_data` longtext
,`note` text
,`ip_address` varchar(45)
,`actor_id` int
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

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_audit_logs`  AS SELECT `al`.`id` AS `id`, `al`.`created_at` AS `created_at`, `al`.`action` AS `action`, `al`.`target_type` AS `target_type`, `al`.`target_id` AS `target_id`, `al`.`before_data` AS `before_data`, `al`.`after_data` AS `after_data`, `al`.`note` AS `note`, `al`.`ip_address` AS `ip_address`, `al`.`actor_id` AS `actor_id`, `al`.`actor_role` AS `actor_role`, `u`.`full_name` AS `actor_name`, `u`.`employee_code` AS `actor_code`, `u`.`department` AS `actor_dept` FROM (`audit_logs` `al` join `users` `u` on((`u`.`id` = `al`.`actor_id`))) ORDER BY `al`.`created_at` DESC ;

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
  ADD KEY `leave_type_id` (`leave_type_id`);

--
-- Indexes for table `leave_requests`
--
ALTER TABLE `leave_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `leave_type_id` (`leave_type_id`),
  ADD KEY `approved_by` (`approved_by`);

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
  ADD KEY `approved_by` (`approved_by`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_user_supervisor` (`supervisor_id`),
  ADD KEY `idx_users_is_active` (`is_active`);

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `leave_approvals`
--
ALTER TABLE `leave_approvals`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `leave_balances`
--
ALTER TABLE `leave_balances`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=120;

--
-- AUTO_INCREMENT for table `leave_requests`
--
ALTER TABLE `leave_requests`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `leave_request_attachments`
--
ALTER TABLE `leave_request_attachments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `leave_types`
--
ALTER TABLE `leave_types`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `ot_approvals`
--
ALTER TABLE `ot_approvals`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ot_requests`
--
ALTER TABLE `ot_requests`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `user_leave_pool`
--
ALTER TABLE `user_leave_pool`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_actor_fk` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

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
