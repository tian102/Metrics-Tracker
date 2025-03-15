-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 14, 2025 at 08:20 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `metrics_tracker`
--

-- --------------------------------------------------------

--
-- Table structure for table `correlation_insights`
--

CREATE TABLE `correlation_insights` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `primary_metric` varchar(50) NOT NULL,
  `secondary_metric` varchar(50) NOT NULL,
  `correlation_value` float NOT NULL,
  `correlation_strength` enum('strong','moderate','weak') NOT NULL,
  `direction` enum('positive','negative') NOT NULL,
  `insight_text` text NOT NULL,
  `first_date` date NOT NULL,
  `last_date` date NOT NULL,
  `data_points` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `correlation_insights`
--

INSERT INTO `correlation_insights` (`id`, `user_id`, `primary_metric`, `secondary_metric`, `correlation_value`, `correlation_strength`, `direction`, `insight_text`, `first_date`, `last_date`, `data_points`, `created_at`) VALUES
(1, 1, 'sleep_duration', 'stress_level', -0.75, 'strong', 'negative', 'There is a strong negative relationship between your sleep duration and stress level. When your sleep duration increases, your stress level tends to decrease. Your average sleep duration is 7.5 hours and your average stress level is 6.8/10.', '2025-02-12', '2025-03-14', 6, '2025-03-14 18:29:23');

-- --------------------------------------------------------

--
-- Table structure for table `daily_metrics`
--

CREATE TABLE `daily_metrics` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `sleep_start` datetime DEFAULT NULL,
  `sleep_end` datetime DEFAULT NULL,
  `stress_level` int(11) DEFAULT NULL,
  `energy_level` int(11) DEFAULT NULL,
  `motivation_level` int(11) DEFAULT NULL,
  `weight` float DEFAULT NULL,
  `meals` text DEFAULT NULL,
  `calories` int(11) DEFAULT NULL,
  `protein` float DEFAULT NULL,
  `carbs` float DEFAULT NULL,
  `fats` float DEFAULT NULL,
  `water_intake` float DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `daily_metrics`
--

INSERT INTO `daily_metrics` (`id`, `user_id`, `date`, `sleep_start`, `sleep_end`, `stress_level`, `energy_level`, `motivation_level`, `weight`, `meals`, `calories`, `protein`, `carbs`, `fats`, `water_intake`, `created_at`, `updated_at`) VALUES
(5, 1, '2025-03-10', '2025-03-09 21:00:00', '2025-03-10 06:00:00', 2, 8, 6, 100, 'Not much', 2000, 150, 200, 70, 3, '2025-03-14 17:48:04', '2025-03-14 17:50:00'),
(6, 1, '2025-03-12', '2025-03-11 23:00:00', '2025-03-12 04:30:00', 9, 3, 3, 97, 'A lot', 2200, 200, 250, 60, 1, '2025-03-14 17:48:33', '2025-03-14 18:27:46'),
(7, 1, '2025-03-14', '2025-03-13 23:00:00', '2025-03-14 10:30:00', 5, 5, 5, 95, 'All clean', 1500, 100, 100, 150, 5, '2025-03-14 17:48:56', '2025-03-14 17:50:23'),
(8, 1, '2025-03-11', '2025-03-10 22:00:00', '2025-03-11 06:30:00', 8, 4, 3, 95, '', 1800, 160, 200, 80, 5, '2025-03-14 18:27:20', '2025-03-14 18:27:20'),
(9, 1, '2025-03-13', '2025-03-12 23:00:00', '2025-03-13 04:30:00', 9, 3, 4, 98, '', 2500, 180, 200, 80, 3, '2025-03-14 18:28:18', '2025-03-14 18:28:18'),
(10, 1, '2025-03-09', '2025-03-08 23:00:00', '2025-03-09 06:30:00', 8, 3, 3, 99.9, '', 2000, 150, 150, 150, 6, '2025-03-14 18:28:52', '2025-03-14 18:28:52');

-- --------------------------------------------------------

--
-- Table structure for table `dashboard_preferences`
--

CREATE TABLE `dashboard_preferences` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `default_view` enum('daily','weekly','monthly') DEFAULT 'daily',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `dashboard_preferences`
--

INSERT INTO `dashboard_preferences` (`id`, `user_id`, `default_view`, `created_at`, `updated_at`) VALUES
(1, 1, 'daily', '2025-03-14 15:54:14', '2025-03-14 15:54:14'),
(2, 2, 'daily', '2025-03-14 18:44:24', '2025-03-14 18:44:24');

-- --------------------------------------------------------

--
-- Table structure for table `dashboard_widgets`
--

CREATE TABLE `dashboard_widgets` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `widget_type` varchar(50) NOT NULL,
  `widget_title` varchar(100) NOT NULL,
  `widget_position` int(11) NOT NULL,
  `widget_size` enum('small','medium','large') DEFAULT 'medium',
  `widget_settings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`widget_settings`)),
  `is_visible` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `dashboard_widgets`
--

INSERT INTO `dashboard_widgets` (`id`, `user_id`, `widget_type`, `widget_title`, `widget_position`, `widget_size`, `widget_settings`, `is_visible`, `created_at`, `updated_at`) VALUES
(15, 1, 'sleep_stats', 'Sleep', 1, 'medium', NULL, 1, '2025-03-14 18:19:47', '2025-03-14 18:19:47'),
(16, 1, 'energy_stats', 'Energy & Motivation', 2, 'medium', NULL, 1, '2025-03-14 18:19:47', '2025-03-14 18:19:47'),
(17, 1, 'nutrition_stats', 'Nutrition', 3, 'medium', NULL, 1, '2025-03-14 18:19:47', '2025-03-14 18:19:47'),
(18, 1, 'training_stats', 'Training', 4, 'medium', NULL, 1, '2025-03-14 18:19:47', '2025-03-14 18:19:47'),
(19, 1, 'weight_chart', 'Weight Progress', 5, 'large', NULL, 1, '2025-03-14 18:19:47', '2025-03-14 18:19:47'),
(20, 1, 'recent_daily', 'Recent Daily Metrics', 6, 'large', NULL, 1, '2025-03-14 18:19:47', '2025-03-14 18:19:47'),
(21, 1, 'recent_training', 'Recent Training Sessions', 7, 'large', NULL, 1, '2025-03-14 18:19:47', '2025-03-14 18:19:47'),
(22, 1, 'activity_heatmap', 'Activity Heatmap', 8, 'large', NULL, 1, '2025-03-14 18:20:01', '2025-03-14 18:20:01'),
(23, 1, 'energy_chart', 'Energy Levels', 9, 'large', NULL, 1, '2025-03-14 18:20:07', '2025-03-14 18:20:07'),
(24, 1, 'nutrition_chart', 'Nutrition Intake', 10, 'large', NULL, 1, '2025-03-14 18:26:02', '2025-03-14 18:26:02'),
(25, 1, 'recent_insights', 'Recent Insights', 11, 'large', NULL, 1, '2025-03-14 18:26:07', '2025-03-14 18:26:07'),
(26, 1, 'personal_records', 'Personal Records', 12, 'medium', NULL, 1, '2025-03-14 18:35:22', '2025-03-14 18:35:22'),
(27, 2, 'sleep_stats', 'Sleep', 1, 'medium', NULL, 1, '2025-03-14 18:44:24', '2025-03-14 18:44:24'),
(28, 2, 'energy_stats', 'Energy & Motivation', 2, 'medium', NULL, 1, '2025-03-14 18:44:24', '2025-03-14 18:44:24'),
(29, 2, 'nutrition_stats', 'Nutrition', 3, 'medium', NULL, 1, '2025-03-14 18:44:24', '2025-03-14 18:44:24'),
(30, 2, 'training_stats', 'Training', 4, 'medium', NULL, 1, '2025-03-14 18:44:24', '2025-03-14 18:44:24'),
(31, 2, 'weight_chart', 'Weight Progress', 5, 'large', NULL, 1, '2025-03-14 18:44:24', '2025-03-14 18:44:24'),
(32, 2, 'recent_daily', 'Recent Daily Metrics', 6, 'large', NULL, 1, '2025-03-14 18:44:24', '2025-03-14 18:44:24'),
(33, 2, 'recent_training', 'Recent Training Sessions', 7, 'large', NULL, 1, '2025-03-14 18:44:24', '2025-03-14 18:44:24'),
(34, 2, 'activity_heatmap', 'Activity Heatmap', 8, 'large', NULL, 1, '2025-03-14 18:51:33', '2025-03-14 18:51:33');

-- --------------------------------------------------------

--
-- Table structure for table `equipment`
--

CREATE TABLE `equipment` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `equipment`
--

INSERT INTO `equipment` (`id`, `name`) VALUES
(1, 'Barbell'),
(13, 'Battle Ropes'),
(14, 'Bench'),
(2, 'Bodyweight'),
(8, 'Cable'),
(3, 'Cables'),
(7, 'Dumbbell'),
(4, 'Dumbbells'),
(16, 'EZ Bar'),
(9, 'Kettlebell'),
(5, 'Machine'),
(12, 'Medicine Ball'),
(17, 'Pull-up Bar'),
(10, 'Resistance Band'),
(6, 'Smith Machine'),
(15, 'Stability Ball'),
(11, 'TRX');

-- --------------------------------------------------------

--
-- Table structure for table `exercises`
--

CREATE TABLE `exercises` (
  `id` int(11) NOT NULL,
  `muscle_group_id` int(11) NOT NULL,
  `equipment_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `exercises`
--

INSERT INTO `exercises` (`id`, `muscle_group_id`, `equipment_id`, `name`, `description`) VALUES
(1, 1, 1, 'Barbell Landmine Side Bend', NULL),
(2, 1, 1, 'Barbell Roll Outs', NULL),
(3, 1, 1, 'Barbell Situp', NULL),
(4, 1, 1, 'Landmine Hollow Hold', NULL),
(5, 1, 1, 'Landmine Kneeling Twist', NULL),
(6, 1, 1, 'Landmine Oblique Twist', NULL),
(7, 1, 1, 'Landmine Russian Twist', NULL),
(8, 1, 1, 'Landmine Sit Up', NULL),
(9, 1, 1, 'Landmine Stationary Twist', NULL),
(10, 1, 2, 'Alternating Bent Leg Raise', NULL),
(11, 1, 2, 'Alternating Heel Touch', NULL),
(12, 1, 2, 'Bicycle Crunch', NULL),
(13, 1, 2, 'Bird Dog', NULL),
(14, 1, 2, 'Bodyweight Hanging Knee Tuck', NULL),
(15, 1, 2, 'Bodyweight Hanging L Sit', NULL),
(16, 1, 2, 'Bodyweight Knee Plank Up Down', NULL),
(17, 1, 2, 'Bodyweight Plank Up Down', NULL),
(18, 1, 2, 'Bodyweight Russian Twist', NULL),
(19, 1, 2, 'Bodyweight Situp', NULL),
(20, 1, 2, 'Burpee', NULL),
(21, 1, 2, 'Crunches', NULL),
(22, 1, 2, 'Dead Bug', NULL),
(23, 1, 2, 'Eccentric Dragonflag', NULL),
(24, 1, 2, 'Elbow Plank Mountain Climber', NULL),
(25, 1, 2, 'Elbow Side Plank', NULL),
(26, 1, 2, 'Forearm Plank', NULL),
(27, 1, 2, 'Frog Crunch', NULL),
(28, 1, 2, 'Frog Sit Up', NULL),
(29, 1, 2, 'Hand Plank', NULL),
(30, 1, 2, 'Hand Side Plank', NULL),
(31, 1, 2, 'Hand Side Plank Reach Through', NULL),
(32, 1, 2, 'Hanging Knee Raises', NULL),
(33, 1, 2, 'Hollow Hold', NULL),
(34, 1, 2, 'Jumping Mountain Climber', NULL),
(35, 1, 2, 'Laying Alternating Leg Raise', NULL),
(36, 1, 2, 'Laying Bent Leg Raise', NULL),
(37, 1, 2, 'Laying Leg Raises', NULL),
(38, 1, 2, 'Long Lever Forearm Plank', NULL),
(39, 1, 2, 'Long Lever Plank', NULL),
(40, 1, 2, 'Mountain Climber', NULL),
(41, 1, 2, 'Oblique Crunch', NULL),
(42, 1, 2, 'Oblique Jackknife', NULL),
(43, 1, 2, 'Plank 2 Saw', NULL),
(44, 1, 2, 'Reach And Catch', NULL),
(45, 1, 2, 'Reverse Crunch', NULL),
(46, 1, 2, 'Reverse Crunch Kick Up', NULL),
(47, 1, 2, 'Ring Standing Roll Out', NULL),
(48, 1, 2, 'Scissor Kick', NULL),
(49, 1, 2, 'Side Plank Reach Through', NULL),
(50, 1, 2, 'Side Plank Up Down', NULL),
(51, 1, 2, 'Sideways Scissor Kick', NULL),
(52, 1, 2, 'Slalom Mountain Climber', NULL),
(53, 1, 2, 'Slow Tempo Mountain Climber', NULL),
(54, 1, 2, 'Switch Jump Mountain Climber', NULL),
(55, 1, 2, 'Windshield Wiper', NULL),
(56, 1, 3, 'Cable Half Kneeling High To Low Wood Chopper', NULL),
(57, 1, 3, 'Cable Half Kneeling Low To High Wood Chopper', NULL),
(58, 1, 3, 'Cable Half Kneeling Wood Chopper', NULL),
(59, 1, 3, 'Cable Oblique Pushdown', NULL),
(60, 1, 3, 'Cable Pallof Press', NULL),
(61, 1, 3, 'Cable Pallof Press Rotation', NULL),
(62, 1, 3, 'Cable Rope Kneeling Crunch', NULL),
(63, 1, 3, 'Cable Rope Kneeling Oblique Crunch', NULL),
(64, 1, 3, 'Cable Row Bar Kneeling Crunch', NULL),
(65, 1, 3, 'Cable Side Bend', NULL),
(66, 1, 3, 'Cable Standing Crunch', NULL),
(67, 1, 3, 'Cable Wood Chopper', NULL),
(68, 1, 4, 'Dumbbell Crunch', NULL),
(69, 1, 4, 'Dumbbell Elbow Side Plank', NULL),
(70, 1, 4, 'Dumbbell Half Kneeling Wood Chopper', NULL),
(71, 1, 4, 'Dumbbell Hand Side Plank', NULL),
(72, 1, 4, 'Dumbbell Hollow Hold', NULL),
(73, 1, 4, 'Dumbbell Kneeling Wood Chopper', NULL),
(74, 1, 4, 'Dumbbell Long Lever Russian Twist', NULL),
(75, 1, 4, 'Dumbbell Overhead Side Bend', NULL),
(76, 1, 4, 'Dumbbell Plank Pullthrough', NULL),
(77, 1, 4, 'Dumbbell Renegade Row', NULL),
(78, 1, 4, 'Dumbbell Russian Twist', NULL),
(79, 1, 4, 'Dumbbell Side Bend', NULL),
(80, 1, 4, 'Dumbbell Side Plank Up Down', NULL),
(81, 1, 4, 'Dumbbell Situp', NULL),
(82, 1, 4, 'Dumbbell Suitcase Crunch', NULL),
(83, 1, 4, 'Dumbbell Wood Chopper', NULL),
(84, 1, 4, 'Plank Iytw', NULL),
(85, 1, 4, 'Pushup To Renegade Row', NULL),
(86, 1, 5, 'Machine Roll Outs', NULL),
(87, 1, 5, 'Rower Knee Tuck', NULL),
(88, 1, 5, 'Rower Pike', NULL),
(89, 1, 6, 'Smith Machine Hanging Knee Tuck', NULL),
(90, 1, 6, 'Smith Machine Oblique Crunch', NULL),
(91, 1, 6, 'Smith Machine Reverse Crunch Hip Raise', NULL),
(92, 1, 6, 'Smith Machine Side Bend', NULL),
(93, 1, 6, 'Smith Machine Side Plank Up Down', NULL),
(94, 1, 6, 'Smith Machine Situp', NULL),
(95, 2, 1, 'Barbell Bent Over Row', NULL),
(96, 2, 1, 'Barbell Curl', NULL),
(97, 2, 1, 'Barbell Drag Curl', NULL),
(98, 2, 1, 'Barbell Landmine Row', NULL),
(99, 2, 1, 'Barbell Long Landmine Row', NULL),
(100, 2, 1, 'Barbell Meadows Row', NULL),
(101, 2, 1, 'Barbell Pronated Pendlay Row', NULL),
(102, 2, 1, 'Barbell Pronated Row', NULL),
(103, 2, 1, 'Barbell Reverse Curl', NULL),
(104, 2, 1, 'Barbell Supinated Pendlay Row', NULL),
(105, 2, 1, 'Barbell Supinated Row', NULL),
(106, 2, 1, 'Ez Bar Preacher Curl', NULL),
(107, 2, 1, 'Ez Bar Reverse Preacher Curl', NULL),
(108, 2, 1, 'Landmine Bicep Curl', NULL),
(109, 2, 1, 'Landmine Concentration Curl', NULL),
(110, 2, 1, 'Landmine T Bar Rows', NULL),
(111, 2, 2, 'Bodyweight Assisted Chin Up', NULL),
(112, 2, 2, 'Bodyweight Assisted Gironda Chin Up', NULL),
(113, 2, 2, 'Bodyweight Assisted Mixed Grip Pullup', NULL),
(114, 2, 2, 'Bodyweight Assisted Pull Up', NULL),
(115, 2, 2, 'Bodyweight Close Grip Inverted Curl', NULL),
(116, 2, 2, 'Bodyweight Concentration Curl', NULL),
(117, 2, 2, 'Bodyweight Inverted Curl', NULL),
(118, 2, 2, 'Bodyweight Underhand Inverted Row', NULL),
(119, 2, 2, 'Chin Ups', NULL),
(120, 2, 2, 'Ring Curl', NULL),
(121, 2, 2, 'Ring Row', NULL),
(122, 2, 3, 'Cable Archer Row', NULL),
(123, 2, 3, 'Cable Bar Curl', NULL),
(124, 2, 3, 'Cable Bilateral Bayesian Curl', NULL),
(125, 2, 3, 'Cable Hammer Bayesian Curl', NULL),
(126, 2, 3, 'Cable Pull In', NULL),
(127, 2, 3, 'Cable Reverse Bayesian Curl', NULL),
(128, 2, 3, 'Cable Rope Hammer Curl', NULL),
(129, 2, 3, 'Cable Row Bar Standing Row', NULL),
(130, 2, 3, 'Cable Seated Bayesian Curl', NULL),
(131, 2, 3, 'Cable Seated Bayesian Hammer Curl', NULL),
(132, 2, 3, 'Cable Seated Bayesian Reverse Curl', NULL),
(133, 2, 3, 'Cable Single Arm Bayesian Curl', NULL),
(134, 2, 3, 'Cable Single Arm Hammer Curl', NULL),
(135, 2, 3, 'Cable Single Arm Neutral Grip Row', NULL),
(136, 2, 3, 'Cable Single Arm Reverse Curl', NULL),
(137, 2, 3, 'Cable Single Arm Underhand Grip Row', NULL),
(138, 2, 3, 'Cable Supinating Row', NULL),
(139, 2, 3, 'Cable Twisting Curl', NULL),
(140, 2, 4, 'Dumbbell Alternating Pendlay Row', NULL),
(141, 2, 4, 'Dumbbell Concentration Curl', NULL),
(142, 2, 4, 'Dumbbell Curl', NULL),
(143, 2, 4, 'Dumbbell Hammer Curl', NULL),
(144, 2, 4, 'Dumbbell Incline Hammer Curl', NULL),
(145, 2, 4, 'Dumbbell Incline Reverse Curl', NULL),
(146, 2, 4, 'Dumbbell Incline Zottman Curl', NULL),
(147, 2, 4, 'Dumbbell Knee Lawnmower Row', NULL),
(148, 2, 4, 'Dumbbell Kneeling Single Arm Row', NULL),
(149, 2, 4, 'Dumbbell Laying Incline Row', NULL),
(150, 2, 4, 'Dumbbell Pendlay Row', NULL),
(151, 2, 4, 'Dumbbell Preacher Curl', NULL),
(152, 2, 4, 'Dumbbell Rear Delt Row', NULL),
(153, 2, 4, 'Dumbbell Reverse Curl', NULL),
(154, 2, 4, 'Dumbbell Single Arm Preacher Curl', NULL),
(155, 2, 4, 'Dumbbell Single Arm Row', NULL),
(156, 2, 4, 'Dumbbell Single Arm Row Knee', NULL),
(157, 2, 4, 'Dumbbell Single Arm Spider Curl', NULL),
(158, 2, 4, 'Dumbbell Spider Curl', NULL),
(159, 2, 4, 'Dumbbell Supinated Row', NULL),
(160, 2, 4, 'Dumbbell Twisting Curl', NULL),
(161, 2, 4, 'Lawnmower Row', NULL),
(162, 2, 5, 'Machine Assisted Chin Up', NULL),
(163, 2, 5, 'Machine Assisted Narrow Pull Up', NULL),
(164, 2, 5, 'Machine Assisted Neutral Chin Up', NULL),
(165, 2, 5, 'Machine Assisted Pull Up', NULL),
(166, 2, 5, 'Machine Seated Cable Row', NULL),
(167, 2, 5, 'Machine Underhand Row', NULL),
(168, 2, 5, 'Narrow Pulldown', NULL),
(169, 2, 5, 'Neutral Pulldown', NULL),
(170, 2, 5, 'Underhand Pulldown', NULL),
(171, 2, 6, 'Smith Machine Drag Curl', NULL),
(172, 2, 6, 'Smith Machine Overhand Row', NULL),
(173, 2, 6, 'Smith Machine Underhand Row', NULL),
(174, 3, 1, 'Barbell Calf Jump', NULL),
(175, 3, 1, 'Barbell Calf Raises', NULL),
(176, 3, 1, 'Barbell Seated Calf Raise', NULL),
(177, 3, 1, 'Barbell Toes Up Calf Raise', NULL),
(178, 3, 1, 'Landmine Calf Raise', NULL),
(179, 3, 1, 'Standing Tibialis Raise', NULL),
(180, 3, 2, 'Bodyweight Donkey Calf Raise', NULL),
(181, 3, 2, 'Calf Raises', NULL),
(182, 3, 2, 'Seated Tibialis Raise', NULL),
(183, 3, 2, 'Tip Toe Walking', NULL),
(184, 3, 2, 'Walking Calf Raises', NULL),
(185, 3, 3, 'Cable Bar Calve Raise', NULL),
(186, 3, 3, 'Cable Calve Raise', NULL),
(187, 3, 4, 'Dumbbell Calf Raise', NULL),
(188, 3, 4, 'Dumbbell Seated Calf Raise', NULL),
(189, 3, 4, 'Dumbbell Seated Tibialis Raise', NULL),
(190, 3, 4, 'Dumbbell Standing Tibialis Raise', NULL),
(191, 3, 5, 'Machine Horizontal Leg Press Calf Jump', NULL),
(192, 3, 5, 'Machine Horizontal Leg Press Calf Raise', NULL),
(193, 3, 5, 'Machine Seated Calf Raises', NULL),
(194, 3, 5, 'Machine Standing Calf Raises', NULL),
(195, 3, 6, 'Smith Machine Calf Raise', NULL),
(196, 3, 6, 'Smith Machine Seated Calf Raise', NULL),
(197, 4, 1, 'Barbell Larsen Bench Press', NULL),
(198, 4, 1, 'Barbell Hooklying Bench Press', NULL),
(199, 4, 1, 'Barbell Bench Press', NULL),
(200, 4, 2, 'Push Up', NULL),
(201, 4, 2, 'Ring Standing Chest Fly', NULL),
(202, 4, 3, 'Cable Bench Chest Fly', NULL),
(203, 4, 3, 'Cable Decline Bench Chest Fly', NULL),
(204, 4, 3, 'Cable Incline Bench Press', NULL),
(205, 4, 3, 'Cable Incline Chest Fly', NULL),
(206, 4, 3, 'Cable Pec Fly', NULL),
(207, 4, 3, 'Cable Single Arm Bench Chest Fly', NULL),
(208, 4, 3, 'Cable Single Arm Decline Bench Chest Fly', NULL),
(209, 4, 3, 'Cable Single Arm Incline Chest Fly', NULL),
(210, 4, 4, 'Dumbbell Chest Fly', NULL),
(211, 4, 4, 'Dumbbell Decline Chest Fly', NULL),
(212, 4, 4, 'Dumbbell Incline Chest Fly', NULL),
(213, 4, 4, 'Dumbbell Internally Rotated Chest Fly', NULL),
(214, 4, 4, 'Dumbbell Internally Rotated Incline Chest Fly', NULL),
(215, 4, 5, 'Machine Pec Fly', NULL),
(216, 4, 6, 'Smith Machine Pushup', NULL),
(217, 4, 4, 'Dumbbell Decline Neutral Bench Press', NULL),
(218, 5, 1, 'Barbell Behind The Back Wrist Curl', NULL),
(219, 5, 1, 'Barbell Wrist Curl', NULL),
(220, 5, 1, 'Barbell Wrist Extension', NULL),
(221, 5, 3, 'Cable Bar Reverse Grip Curl', NULL),
(222, 5, 3, 'Cable Wrist Curl', NULL),
(223, 5, 3, 'Cable Wrist Extension', NULL),
(224, 5, 4, 'Dumbbell Bench Wrist Curl', NULL),
(225, 5, 4, 'Dumbbell Bench Wrist Extension', NULL),
(226, 5, 4, 'Dumbbell Wrist Curl', NULL),
(227, 5, 4, 'Dumbbell Wrist Extension', NULL),
(228, 5, 4, 'Wrist Flexor Curl Dumbbell Kneeling', NULL),
(229, 5, 4, 'Wrist Supinations Pronations', NULL),
(230, 6, 1, 'Barbell Bulgarian Split Squat', NULL),
(231, 6, 1, 'Barbell Curtsy Lunge', NULL),
(232, 6, 1, 'Barbell Feet Elevated Figure Four Glute Bridge', NULL),
(233, 6, 1, 'Barbell Feet Elevated Glute Bridge', NULL),
(234, 6, 1, 'Barbell Feet Elevated Single Leg Glute Bridge', NULL),
(235, 6, 1, 'Barbell Feet Elevated Staggered Glute Bridge', NULL),
(236, 6, 1, 'Barbell Figure Four Heels Elevated Hip Thrust', NULL),
(237, 6, 1, 'Barbell Figure Four Hip Thrust', NULL),
(238, 6, 1, 'Barbell Forward Lunge', NULL),
(239, 6, 1, 'Barbell Front Rack Step Up', NULL),
(240, 6, 1, 'Barbell Front Squat Bodybuilding', NULL),
(241, 6, 1, 'Barbell Front Squat With Straps', NULL),
(242, 6, 1, 'Barbell Glute Bridge', NULL),
(243, 6, 1, 'Barbell Heels Elevated Hip Thrust', NULL),
(244, 6, 1, 'Barbell Heels Up Back Squat', NULL),
(245, 6, 1, 'Barbell Heels Up Front Squat', NULL),
(246, 6, 1, 'Barbell High Bar Squat', NULL),
(247, 6, 1, 'Barbell Hip Thrust', NULL),
(248, 6, 1, 'Barbell Kickstand Squat', NULL),
(249, 6, 1, 'Barbell Lateral Lunge', NULL),
(250, 6, 1, 'Barbell Reverse Lunge', NULL),
(251, 6, 1, 'Barbell Side Step Up', NULL),
(252, 6, 1, 'Barbell Single Leg Heels Elevated Hip Thrust', NULL),
(253, 6, 1, 'Barbell Single Leg Hip Thrust', NULL),
(254, 6, 1, 'Barbell Split Squat', NULL),
(255, 6, 1, 'Barbell Squat', NULL),
(256, 6, 1, 'Barbell Step Up', NULL),
(257, 6, 1, 'Barbell Step Up Balance', NULL),
(258, 6, 1, 'Barbell Stiff Leg Deadlifts', NULL),
(259, 6, 1, 'Barbell Tap Pause Squat', NULL),
(260, 6, 1, 'Landmine Alternating Lunge And Twist', NULL),
(261, 6, 1, 'Landmine Alternating Lunge To Chest Press', NULL),
(262, 6, 1, 'Landmine Curtsy Lunge', NULL),
(263, 6, 1, 'Landmine Glute Kick Back', NULL),
(264, 6, 1, 'Landmine Goblet Curtsy Lunge', NULL),
(265, 6, 1, 'Landmine Goblet Lateral Lunge', NULL),
(266, 6, 1, 'Landmine Hack Squat', NULL),
(267, 6, 1, 'Landmine Lateral Lunge', NULL),
(268, 6, 1, 'Landmine Lunge', NULL),
(269, 6, 1, 'Landmine Lunge To Overhead Press', NULL),
(270, 6, 1, 'Landmine Rotational Lift To Press', NULL),
(271, 6, 1, 'Landmine Single Leg Glute Bridge', NULL),
(272, 6, 1, 'Landmine Squat', NULL),
(273, 6, 1, 'Landmine Sumo Deadlift', NULL),
(274, 6, 1, 'Landmine Thruster', NULL),
(275, 6, 2, 'Assisted Bulgarian Split Squat', NULL),
(276, 6, 2, 'Bodyweight Alternating Curtsy Lunge', NULL),
(277, 6, 2, 'Bodyweight Alternating Jump Lunge', NULL),
(278, 6, 2, 'Bodyweight Alternating Lateral Lunge', NULL),
(279, 6, 2, 'Bodyweight Alternating Reverse Lunges', NULL),
(280, 6, 2, 'Bodyweight Box Squat', NULL),
(281, 6, 2, 'Bodyweight Feet Elevated Figure Four Glute Bridge', NULL),
(282, 6, 2, 'Bodyweight Feet Elevated Glute Bridge', NULL),
(283, 6, 2, 'Bodyweight Feet Elevated Single Leg Glute Bridge', NULL),
(284, 6, 2, 'Bodyweight Feet Elevated Staggered Glute Bridge', NULL),
(285, 6, 2, 'Bodyweight Figure Four Heels Elevated Hip Thrust', NULL),
(286, 6, 2, 'Bodyweight Heels Elevated Hip Thrust', NULL),
(287, 6, 2, 'Bodyweight Hip Abduction', NULL),
(288, 6, 2, 'Bodyweight Kickstand Squat', NULL),
(289, 6, 2, 'Bodyweight Lateral Lunge Jump', NULL),
(290, 6, 2, 'Bodyweight Pop Squat', NULL),
(291, 6, 2, 'Bodyweight Pulse Squat', NULL),
(292, 6, 2, 'Bodyweight Single Leg Heels Elevated Hip Thrust', NULL),
(293, 6, 2, 'Bodyweight Swing Lunge', NULL),
(294, 6, 2, 'Bodyweight Swingthrough Lunge', NULL),
(295, 6, 2, 'Box Jump', NULL),
(296, 6, 2, 'Bulgarian Split Squat', NULL),
(297, 6, 2, 'Curtsy Lunge', NULL),
(298, 6, 2, 'Depth Jump', NULL),
(299, 6, 2, 'Forward Lunge', NULL),
(300, 6, 2, 'Forward Lunges', NULL),
(301, 6, 2, 'Glute Bridge', NULL),
(302, 6, 2, 'Glute Bridge Eccentric Unilateral', NULL),
(303, 6, 2, 'Glute Bridge Isometric Hold Single Alternate', NULL),
(304, 6, 2, 'Hamstring Bridge Isometric Open Angle', NULL),
(305, 6, 2, 'Hamstring Bridge With Elevated Legs Box Bilateral', NULL),
(306, 6, 2, 'Hamstring Bridge With Elevated Legs Box Unilateral', NULL),
(307, 6, 2, 'Heels Up Squat', NULL),
(308, 6, 2, 'In And Out Jump Squat', NULL),
(309, 6, 2, 'Jump Squats', NULL),
(310, 6, 2, 'Kickbacks', NULL),
(311, 6, 2, 'Lateral Lunge', NULL),
(312, 6, 2, 'Lunge Alternate', NULL),
(313, 6, 2, 'Lunge Walking', NULL),
(314, 6, 2, 'Pole Overhead Squat', NULL),
(315, 6, 2, 'Seated Box Jump', NULL),
(316, 6, 2, 'Side Lunges', NULL),
(317, 6, 2, 'Single Leg Box Jump', NULL),
(318, 6, 2, 'Single Leg Glute Bridge', NULL),
(319, 6, 2, 'Split Squat', NULL),
(320, 6, 2, 'Step Up Knee Drive', NULL),
(321, 6, 3, 'Cable Quadruped Hip Abduction', NULL),
(322, 6, 3, 'Cable Split Squat', NULL),
(323, 6, 3, 'Cable Standing Glute Kickback', NULL),
(324, 6, 3, 'Cable Standing Hip Abduction', NULL),
(325, 6, 3, 'Cable Standing Hip Adduction', NULL),
(326, 6, 4, 'Dumbbell Bulgarian Split Squat', NULL),
(327, 6, 4, 'Dumbbell Feet Elevated Figure Four Glute Bridge', NULL),
(328, 6, 4, 'Dumbbell Feet Elevated Glute Bridge', NULL),
(329, 6, 4, 'Dumbbell Feet Elevated Single Leg Glute Bridge', NULL),
(330, 6, 4, 'Dumbbell Feet Elevated Staggered Glute Bridge', NULL),
(331, 6, 4, 'Dumbbell Figure Four Glute Bridge', NULL),
(332, 6, 4, 'Dumbbell Figure Four Heels Elevated Hip Thrust', NULL),
(333, 6, 4, 'Dumbbell Figure Four Hip Thrust', NULL),
(334, 6, 4, 'Dumbbell Forward Lunge', NULL),
(335, 6, 4, 'Dumbbell Front Rack Squat', NULL),
(336, 6, 4, 'Dumbbell Front Rack Step Up', NULL),
(337, 6, 4, 'Dumbbell Glute Bridge', NULL),
(338, 6, 4, 'Dumbbell Goblet Bulgarian Split Squat', NULL),
(339, 6, 4, 'Dumbbell Goblet Curtsy Lunge', NULL),
(340, 6, 4, 'Dumbbell Goblet Forward Lunge', NULL),
(341, 6, 4, 'Dumbbell Goblet Lateral Lunge', NULL),
(342, 6, 4, 'Dumbbell Goblet Pulse Squat', NULL),
(343, 6, 4, 'Dumbbell Goblet Reverse Lunge', NULL),
(344, 6, 4, 'Dumbbell Goblet Side Step Up', NULL),
(345, 6, 4, 'Dumbbell Goblet Split Squat', NULL),
(346, 6, 4, 'Dumbbell Goblet Squat', NULL),
(347, 6, 4, 'Dumbbell Goblet Step Up', NULL),
(348, 6, 4, 'Dumbbell Heels Elevated Hip Thrust', NULL),
(349, 6, 4, 'Dumbbell Heels Up Goblet Squat', NULL),
(350, 6, 4, 'Dumbbell Heels Up Narrow Goblet Squat', NULL),
(351, 6, 4, 'Dumbbell Hip Thrust', NULL),
(352, 6, 4, 'Dumbbell Kickstand Squat', NULL),
(353, 6, 4, 'Dumbbell Lateral Lunge Reach', NULL),
(354, 6, 4, 'Dumbbell Offset Squat', NULL),
(355, 6, 4, 'Dumbbell Overhead Squat', NULL),
(356, 6, 4, 'Dumbbell Reverse Lunge', NULL),
(357, 6, 4, 'Dumbbell Side Step Up', NULL),
(358, 6, 4, 'Dumbbell Single Arm Front Rack Step Up', NULL),
(359, 6, 4, 'Dumbbell Single Arm Step Up', NULL),
(360, 6, 4, 'Dumbbell Single Leg Glute Bridge', NULL),
(361, 6, 4, 'Dumbbell Single Leg Heels Elevated Hip Thrust', NULL),
(362, 6, 4, 'Dumbbell Single Leg Hip Thrust', NULL),
(363, 6, 4, 'Dumbbell Split Squat', NULL),
(364, 6, 4, 'Dumbbell Staggered Glute Bridge', NULL),
(365, 6, 4, 'Dumbbell Staggered Hip Thrust', NULL),
(366, 6, 4, 'Dumbbell Standing Hip Abduction', NULL),
(367, 6, 4, 'Dumbbell Step Up', NULL),
(368, 6, 4, 'Dumbbell Thruster', NULL),
(369, 6, 4, 'Single Arm Overhead Squat', NULL),
(370, 6, 5, 'Machine Hack Squat', NULL),
(371, 6, 5, 'Machine Hip Abduction', NULL),
(372, 6, 5, 'Machine Hip And Glute Abduction', NULL),
(373, 6, 5, 'Machine Hip And Glute Kickback', NULL),
(374, 6, 5, 'Machine Hip Thrust', NULL),
(375, 6, 5, 'Machine Horizontal Leg Press', NULL),
(376, 6, 5, 'Machine Horizontal Sissy Leg Press', NULL),
(377, 6, 5, 'Machine Leg Press', NULL),
(378, 6, 6, 'Smith Machine Glute Kickback', NULL),
(379, 6, 6, 'Smith Machine Hip Thrust', NULL),
(380, 6, 6, 'Smith Machine Leg Press', NULL),
(381, 6, 6, 'Smith Machine Narrow Stance Squat', NULL),
(382, 6, 6, 'Smith Machine Reverse Lunge', NULL),
(383, 6, 6, 'Smith Machine Single Leg Hip Thrust', NULL),
(384, 6, 6, 'Smith Machine Split Squat', NULL),
(385, 6, 6, 'Smith Machine Squat', NULL),
(386, 7, 2, 'Bodyweight Reverse Lunge', NULL),
(387, 7, 2, 'Hamstring Curl 1 Supine Single Leg Slider', NULL),
(388, 7, 2, 'Hamstring Curl 2 Supine Single Leg Slider', NULL),
(389, 7, 2, 'Hamstring Curl Eccentric Supine Bilateral Sliders', NULL),
(390, 7, 2, 'Hamstring Curl Standing Bodyweight Single Leg', NULL),
(391, 7, 2, 'Hamstring Curl Standing Isometric Bodyweight Single Leg', NULL),
(392, 7, 2, 'Hamstring Curl Supine Bilateral Slider', NULL),
(393, 7, 2, 'Nordic Hamstring Curl', NULL),
(394, 7, 3, 'Cable Hamstring Curl', NULL),
(395, 7, 3, 'Cable Seated Leg Curl', NULL),
(396, 7, 3, 'Cable Single Leg Laying Leg Curl', NULL),
(397, 7, 4, 'Dumbbell Leg Curl', NULL),
(398, 7, 5, 'Glute Ham Raise', NULL),
(399, 7, 5, 'Machine Hamstring Curl', NULL),
(400, 7, 5, 'Machine Seated Leg Curl', NULL),
(401, 7, 5, 'Seated Leg Curl', NULL),
(402, 8, 1, 'Barbell Coan Deadlift', NULL),
(403, 8, 1, 'Barbell High Bar Good Morning', NULL),
(404, 8, 1, 'Barbell Low Bar Good Morning', NULL),
(405, 8, 1, 'Barbell Low Bar Squat', NULL),
(406, 8, 1, 'Barbell Pause Box Squat', NULL),
(407, 8, 1, 'Barbell Pause Squat', NULL),
(408, 8, 1, 'Barbell Reverse Deadlift', NULL),
(409, 8, 1, 'Barbell Romanian Deadlift', NULL),
(410, 8, 1, 'Barbell Single Leg Deadlift', NULL),
(411, 8, 1, 'Barbell Snatch Grip Deadlift', NULL),
(412, 8, 1, 'Barbell Snatch Grip Romanian Deadlift', NULL),
(413, 8, 1, 'Barbell Staggered Deadlift', NULL),
(414, 8, 1, 'Barbell Suitcase Deadlift', NULL),
(415, 8, 1, 'Barbell Sumo Deadlift', NULL),
(416, 8, 1, 'Barbell Zercher Good Morning', NULL),
(417, 8, 1, 'Barbell Zercher Squat', NULL),
(418, 8, 1, 'Landmine Romanian Deadlift', NULL),
(419, 8, 1, 'Landmine Single Leg Romanian Deadlift', NULL),
(420, 8, 1, 'Landmine Snatch', NULL),
(421, 8, 1, 'Landmine Staggered Romanian Deadlift', NULL),
(422, 8, 2, 'Good Mornings', NULL),
(423, 8, 2, 'Single Legged Romanian Deadlifts', NULL),
(424, 8, 2, 'Supermans', NULL),
(425, 8, 3, 'Cable Bar Romanian Deadlift', NULL),
(426, 8, 3, 'Cable Bar Staggered Romanian Deadlift', NULL),
(427, 8, 3, 'Cable Bench Straight Leg Kickback', NULL),
(428, 8, 3, 'Cable Elevated Deadlift', NULL),
(429, 8, 3, 'Cable Goblet Squat', NULL),
(430, 8, 3, 'Cable Incline Bench Straight Leg Kickback', NULL),
(431, 8, 3, 'Cable Pull Through', NULL),
(432, 8, 3, 'Cable Single Leg Deadlift', NULL),
(433, 8, 3, 'Cable Standing Mid Kickback', NULL),
(434, 8, 3, 'Cable Standing Straight Leg Glute Glute Kickback', NULL),
(435, 8, 3, 'Cable Standing Straight Leg Mid Kickback', NULL),
(436, 8, 3, 'Cable Zercher Good Morning', NULL),
(437, 8, 3, 'Cable Zercher Squat', NULL),
(438, 8, 4, 'Dumbbell Cross Body Romanian Deadlift', NULL),
(439, 8, 4, 'Dumbbell Front Rack Pause Squat', NULL),
(440, 8, 4, 'Dumbbell Goblet Good Morning', NULL),
(441, 8, 4, 'Dumbbell Romanian Deadlift', NULL),
(442, 8, 4, 'Dumbbell Single Leg Single Arm Deadlift', NULL),
(443, 8, 4, 'Dumbbell Single Leg Stiff Leg Deadlift', NULL),
(444, 8, 4, 'Dumbbell Staggered Deadlift', NULL),
(445, 8, 4, 'Dumbbell Sumo Squat', NULL),
(446, 8, 4, 'Dumbbell Superman', NULL),
(447, 8, 4, 'Dumbbell Superman Hold', NULL),
(448, 8, 4, 'Dumbbell Swing', NULL),
(449, 8, 5, 'Machine 45 Degree Back Extension', NULL),
(450, 8, 6, 'Smith Machine Romanian Deadlift', NULL),
(451, 8, 6, 'Smith Machine Staggered Deadlift', NULL),
(452, 8, 6, 'Smith Machine Sumo Romanian Deadlift', NULL),
(453, 9, 1, 'Barbell Front Squat Olympic', NULL),
(454, 9, 1, 'Barbell Landmine Sissy Squat', NULL),
(455, 9, 2, 'Bodyweight Reverse Step Up', NULL),
(456, 9, 2, 'Bodyweight Squat', NULL),
(457, 9, 3, 'Cable Seated Leg Extension', NULL),
(458, 9, 3, 'Cable Standing Leg Extension', NULL),
(459, 9, 4, 'Dumbbell Leg Extension', NULL),
(460, 9, 5, 'Machine Goblet Sissy Squat', NULL),
(461, 9, 5, 'Machine Hip Adduction', NULL),
(462, 9, 5, 'Machine Hip And Glute Adduction', NULL),
(463, 9, 5, 'Machine Leg Extension', NULL),
(464, 9, 5, 'Machine Sissy Squat', NULL),
(465, 9, 6, 'Smith Machine Sissy Squat', NULL),
(466, 10, 1, 'Barbell Behind The Neck Seated Overhead Press', NULL),
(467, 10, 1, 'Barbell Front Raise', NULL),
(468, 10, 1, 'Barbell High Incline Bench Press', NULL),
(469, 10, 1, 'Barbell Incline Bench Press', NULL),
(470, 10, 1, 'Barbell Overhead Press', NULL),
(471, 10, 1, 'Barbell Upright Row', NULL),
(472, 10, 1, 'Barbell Z Press', NULL),
(473, 10, 1, 'Landmine Alternating Single Arm Press', NULL),
(474, 10, 1, 'Landmine Half Kneeling Single Arm Overhead Press', NULL),
(475, 10, 1, 'Landmine Kneeling Alternating Overhead Press', NULL),
(476, 10, 1, 'Landmine Kneeling Overhead Press', NULL),
(477, 10, 1, 'Landmine Lateral Raise', NULL),
(478, 10, 1, 'Landmine Overhead Press', NULL),
(479, 10, 1, 'Landmine Seated Alternating Overhead Press', NULL),
(480, 10, 1, 'Landmine Seated Overhead Press', NULL),
(481, 10, 1, 'Landmine Seated Single Arm Overhead Press', NULL),
(482, 10, 1, 'Landmine Single Arm Overhead Press', NULL),
(483, 10, 1, 'Landmine Single Arm Push Press', NULL),
(484, 10, 1, 'Landmine Single Arm Staggered Overhead Press', NULL),
(485, 10, 1, 'Landmine Split Jerk', NULL),
(486, 10, 2, 'Backward Arm Circle', NULL),
(487, 10, 2, 'Forward Arm Circle', NULL),
(488, 10, 2, 'Ring Rear Delt Fly', NULL),
(489, 10, 2, 'Ring Standing Pushup', NULL),
(490, 10, 3, 'Cable Bar Front Raise', NULL),
(491, 10, 3, 'Cable Bench Press', NULL),
(492, 10, 3, 'Cable Chest Press', NULL),
(493, 10, 3, 'Cable Decline Bench Press', NULL),
(494, 10, 3, 'Cable Decline Single Arm Bench Press', NULL),
(495, 10, 3, 'Cable High Internally Rotated Reverse Fly', NULL),
(496, 10, 3, 'Cable High Reverse Fly', NULL),
(497, 10, 3, 'Cable High Single Arm Rear Delt Fly', NULL),
(498, 10, 3, 'Cable Low Bilateral Lateral Raise', NULL),
(499, 10, 3, 'Cable Low Single Arm Lateral Raise', NULL),
(500, 10, 3, 'Cable Overhead Press', NULL),
(501, 10, 3, 'Cable Rope Front Raise', NULL),
(502, 10, 3, 'Cable Rope Kneeling Face Pull', NULL),
(503, 10, 3, 'Cable Rope Mid Lateral Raise', NULL),
(504, 10, 3, 'Cable Rope Single Arm Low Lateral Raise', NULL),
(505, 10, 3, 'Cable Rope Upright Row', NULL),
(506, 10, 3, 'Cable Single Arm Bench Press', NULL),
(507, 10, 3, 'Cable Single Arm Internally Rotated High Reverse Fly', NULL),
(508, 10, 3, 'Cable Upright Row', NULL),
(509, 10, 3, 'Machine Face Pulls', NULL),
(510, 10, 4, 'Dumbbell Alternating Arnold Press', NULL),
(511, 10, 4, 'Dumbbell Alternating Overhead Press', NULL),
(512, 10, 4, 'Dumbbell Arnold Press', NULL),
(513, 10, 4, 'Dumbbell Bayesian Lateral Raise', NULL),
(514, 10, 4, 'Dumbbell Bent Arm Lateral Raise', NULL),
(515, 10, 4, 'Dumbbell Front Raise', NULL),
(516, 10, 4, 'Dumbbell High Incline Bench Press', NULL),
(517, 10, 4, 'Dumbbell Incline Bench Press', NULL),
(518, 10, 4, 'Dumbbell Incline Chest Flys', NULL),
(519, 10, 4, 'Dumbbell Internally Rotated Rear Delt Fly', NULL),
(520, 10, 4, 'Dumbbell Lateral Raise', NULL),
(521, 10, 4, 'Dumbbell Laying Reverse Fly', NULL),
(522, 10, 4, 'Dumbbell Laying Reverse Fly Internally Rotated', NULL),
(523, 10, 4, 'Dumbbell Neutral Alternating Overhead Press', NULL),
(524, 10, 4, 'Dumbbell Neutral Bench Press', NULL),
(525, 10, 4, 'Dumbbell Neutral Incline Bench Press', NULL),
(526, 10, 4, 'Dumbbell Neutral Overhead Press', NULL),
(527, 10, 4, 'Dumbbell Neutral Seated Overhead Press', NULL),
(528, 10, 4, 'Dumbbell Overhead Press', NULL),
(529, 10, 4, 'Dumbbell Push Press', NULL),
(530, 10, 4, 'Dumbbell Rear Delt Fly', NULL),
(531, 10, 4, 'Dumbbell Seated Arnold Press', NULL),
(532, 10, 4, 'Dumbbell Seated Overhead Press', NULL),
(533, 10, 4, 'Dumbbell Seated Rear Delt Fly', NULL),
(534, 10, 4, 'Dumbbell Shoulder External Rotation', NULL),
(535, 10, 4, 'Dumbbell Single Arm Arnold Press', NULL),
(536, 10, 4, 'Dumbbell Single Arm Neutral Overhead Press', NULL),
(537, 10, 4, 'Dumbbell Single Arm Overhead Press', NULL),
(538, 10, 4, 'Dumbbell Single Arm Upright Row', NULL),
(539, 10, 4, 'Dumbbell Standing Bayesian Lateral Raise', NULL),
(540, 10, 4, 'Dumbbell Upright Row', NULL),
(541, 10, 4, 'Internally Rotated Seated Rear Delt Fly', NULL),
(542, 10, 4, 'Laying Lateral Raise', NULL),
(543, 10, 4, 'Seated Lateral Raise', NULL),
(544, 10, 5, 'Machine Neutral Overhead Press', NULL),
(545, 10, 5, 'Machine Overhand Overhead Press', NULL),
(546, 10, 5, 'Machine Overhand Row', NULL),
(547, 10, 5, 'Machine Reverse Fly', NULL),
(548, 10, 6, 'Smith Machine Bench Press', NULL),
(549, 10, 6, 'Smith Machine Incline Bench Press', NULL),
(550, 10, 6, 'Smith Machine Seated Overhead Press', NULL),
(551, 10, 6, 'Smith Machine Upright Row', NULL),
(552, 11, 1, 'Barbell Deadlift', NULL),
(553, 11, 1, 'Barbell Shrug', NULL),
(554, 11, 1, 'Barbell Silverback Shrug', NULL),
(555, 11, 2, 'Bodyweight Overhand Inverted Row', NULL),
(556, 11, 2, 'Bodyweight Pike Press', NULL),
(557, 11, 2, 'Bodyweight Pike Shrug', NULL),
(558, 11, 2, 'Bodyweight Standing Inverted Row', NULL),
(559, 11, 2, 'Elevated Pike Press', NULL),
(560, 11, 2, 'Elevated Pike Shoulder Shrug', NULL),
(561, 11, 2, 'Inverted Row', NULL),
(562, 11, 2, 'Pull Ups', NULL),
(563, 11, 3, 'Cable 30 Degree Shrug', NULL),
(564, 11, 3, 'Cable Silverback Shrug', NULL),
(565, 11, 3, 'Cable Single Arm 30 Degree Shrug', NULL),
(566, 11, 3, 'Cable Single Arm Rear Delt Row', NULL),
(567, 11, 4, 'Dumbbell Laying 30 Degree Shrug', NULL),
(568, 11, 4, 'Dumbbell Laying Silverback Shrug', NULL),
(569, 11, 4, 'Dumbbell Row Bilateral', NULL),
(570, 11, 4, 'Dumbbell Row Unilateral', NULL),
(571, 11, 4, 'Dumbbell Seated Rear Delt Row', NULL),
(572, 11, 4, 'Dumbbell Seated Shrug', NULL),
(573, 11, 4, 'Dumbbell Shrug', NULL),
(574, 11, 4, 'Dumbbell Silverback Shrug', NULL),
(575, 11, 5, 'Smith Machine Standing Shrugs', NULL),
(576, 11, 6, 'Smith Machine Assisted Pullup', NULL),
(577, 11, 6, 'Smith Machine Inverted Row', NULL),
(578, 12, 1, 'Barbell Close Grip Bench Press', NULL),
(579, 12, 1, 'Barbell Floor Press', NULL),
(580, 12, 1, 'Barbell Laying Triceps Extensions', NULL),
(581, 12, 1, 'Barbell Overhead Tricep Extension', NULL),
(582, 12, 1, 'Barbell Skullcrusher', NULL),
(583, 12, 1, 'Barbell Spoto Press', NULL),
(584, 12, 1, 'Landmine Lying Tricep Extension', NULL),
(585, 12, 1, 'Landmine Single Arm Chest Press', NULL),
(586, 12, 2, 'Bench Dips', NULL),
(587, 12, 2, 'Bodyweight Box Assisted Dips', NULL),
(588, 12, 2, 'Bodyweight Clapping Push Up', NULL),
(589, 12, 2, 'Bodyweight Diamond Knee Push Ups', NULL),
(590, 12, 2, 'Bodyweight Elevated Push Up', NULL),
(591, 12, 2, 'Bodyweight Explosive Push Up', NULL),
(592, 12, 2, 'Bodyweight Incline Knee Push Up', NULL),
(593, 12, 2, 'Bodyweight Knee Push Ups', NULL),
(594, 12, 2, 'Bodyweight Knee Tricep Extension', NULL),
(595, 12, 2, 'Bodyweight Tricep Extension', NULL),
(596, 12, 2, 'Box Dips', NULL),
(597, 12, 2, 'Decline Push Up', NULL),
(598, 12, 2, 'Diamond Push Ups', NULL),
(599, 12, 2, 'Dips Narrow Elbows', NULL),
(600, 12, 2, 'Incline Push Up', NULL),
(601, 12, 2, 'Parralel Bar Dips', NULL),
(602, 12, 2, 'Ring Skullcrusher', NULL),
(603, 12, 2, 'Ring Standing Archer Pushup', NULL),
(604, 12, 3, 'Cable Bar Pushdown', NULL),
(605, 12, 3, 'Cable Bar Reverse Grip Pushdown', NULL),
(606, 12, 3, 'Cable Cross Pushdown', NULL),
(607, 12, 3, 'Cable Rope Overhead Tricep Extension', NULL),
(608, 12, 3, 'Cable Rope Pushdown', NULL),
(609, 12, 3, 'Cable Rope Skullcrusher', NULL),
(610, 12, 3, 'Cable Single Arm Cross Pushdown', NULL),
(611, 12, 3, 'Cable Single Arm Incline Bench Press', NULL),
(612, 12, 3, 'Cable Single Arm Rope Pushdown', NULL),
(613, 12, 3, 'Cable Single Arm Skullcrusher', NULL),
(614, 12, 3, 'Cable Tricep Kickback', NULL),
(615, 12, 4, 'Dumbbell Alternating Single Arm Press', NULL),
(616, 12, 4, 'Dumbbell Bench Press', NULL),
(617, 12, 4, 'Dumbbell Decline Alternating Single Arm Press', NULL),
(618, 12, 4, 'Dumbbell Decline Bench Press', NULL),
(619, 12, 4, 'Dumbbell Decline Guillotine Bench Press', NULL),
(620, 12, 4, 'Dumbbell Decline Single Arm Bench Press', NULL),
(621, 12, 4, 'Dumbbell Decline Skullcrusher', NULL),
(622, 12, 4, 'Dumbbell Decline Squeeze Press', NULL),
(623, 12, 4, 'Dumbbell Elevated Pushup', NULL),
(624, 12, 4, 'Dumbbell Floor Press', NULL),
(625, 12, 4, 'Dumbbell Guillotine Bench Press', NULL),
(626, 12, 4, 'Dumbbell Guillotine Incline Bench Press', NULL),
(627, 12, 4, 'Dumbbell Incline Skullover', NULL),
(628, 12, 4, 'Dumbbell Overhead Tricep Extension', NULL),
(629, 12, 4, 'Dumbbell Rolling Tricep Extension', NULL),
(630, 12, 4, 'Dumbbell Seated Overhead Tricep Extension', NULL),
(631, 12, 4, 'Dumbbell Single Arm Overhead Tricep Extension', NULL),
(632, 12, 4, 'Dumbbell Single Arm Press', NULL),
(633, 12, 4, 'Dumbbell Skullcrusher', NULL),
(634, 12, 4, 'Dumbbell Squeeze Press', NULL),
(635, 12, 4, 'Dumbbell Tate Press', NULL),
(636, 12, 4, 'Dumbbell Tricep Kickback', NULL),
(637, 12, 5, 'Machine Assisted Parralel Bar Dips', NULL),
(638, 12, 5, 'Machine Cable V Bar Push Downs', NULL),
(639, 12, 5, 'Machine Chest Press', NULL),
(640, 12, 5, 'Neutral Chest Press', NULL),
(641, 12, 6, 'Smith Machine Bodyweight Skullcrusher', NULL),
(642, 12, 6, 'Smith Machine Close Grip Bench Press', NULL),
(643, 12, 6, 'Smith Machine Guillotine Bench Press', NULL),
(644, 12, 6, 'Smith Machine Skullcrusher', NULL),
(645, 13, 3, 'Cable Bent Over Bar Pullover', NULL),
(646, 13, 3, 'Cable Lat Prayer', NULL),
(647, 13, 3, 'Cable Rope Lat Prayer', NULL),
(648, 13, 3, 'Cable Rope Pullover', NULL),
(649, 13, 3, 'Cable Straight Arm Pull In', NULL),
(650, 13, 4, 'Dumbbell Pullover', NULL),
(651, 13, 4, 'Dumbbell Shoulder Extension', NULL),
(652, 13, 5, 'Machine Neutral Row', NULL),
(653, 13, 5, 'Machine Pulldown', NULL),
(654, 13, 5, 'Stretcher', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `muscle_groups`
--

CREATE TABLE `muscle_groups` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `muscle_groups`
--

INSERT INTO `muscle_groups` (`id`, `name`) VALUES
(1, 'Abdominals'),
(16, 'Abs'),
(14, 'Back'),
(2, 'Biceps'),
(3, 'Calves'),
(4, 'Chest'),
(5, 'Forearms'),
(6, 'Glutes'),
(7, 'Hamstrings'),
(15, 'Legs'),
(8, 'Lower_Back'),
(9, 'Quadriceps'),
(10, 'Shoulders'),
(11, 'Trapezius'),
(12, 'Triceps'),
(13, 'Upper_Back');

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `password_reset_tokens`
--

INSERT INTO `password_reset_tokens` (`id`, `user_id`, `token`, `expires_at`) VALUES
(2, 1, '432ecb079aafe206a5ecf24c3f42ee8976acbdbb2f7fa841f8d96874c1ad5683', '2025-03-14 11:54:52');

-- --------------------------------------------------------

--
-- Table structure for table `personal_records`
--

CREATE TABLE `personal_records` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `exercise_id` int(11) NOT NULL,
  `record_value` float NOT NULL,
  `record_type` enum('weight','reps','volume','time') NOT NULL,
  `date` date NOT NULL,
  `workout_detail_id` int(11) DEFAULT NULL,
  `is_acknowledged` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `training_sessions`
--

CREATE TABLE `training_sessions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `mesocycle_name` varchar(50) DEFAULT NULL,
  `session_number` int(11) DEFAULT NULL,
  `training_start` datetime DEFAULT NULL,
  `training_end` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `training_sessions`
--

INSERT INTO `training_sessions` (`id`, `user_id`, `date`, `mesocycle_name`, `session_number`, `training_start`, `training_end`, `created_at`, `updated_at`) VALUES
(6, 1, '2025-03-14', 'Mesocycle 1.3', 2, '2025-03-14 17:54:00', '2025-03-14 18:59:00', '2025-03-14 15:54:49', '2025-03-14 15:54:49'),
(7, 1, '2025-03-09', 'Mesocycle 1.1', 1, '2025-03-09 08:30:00', '2025-03-09 10:30:00', '2025-03-14 18:30:25', '2025-03-14 18:30:25'),
(8, 1, '2025-03-10', 'Mesocycle 1.1', 2, '2025-03-10 09:31:00', '2025-03-10 10:37:00', '2025-03-14 18:31:56', '2025-03-14 18:31:56'),
(9, 1, '2025-03-11', 'Mesocycle 1.1', 3, '2025-03-11 10:00:00', '2025-03-11 12:39:00', '2025-03-14 18:33:53', '2025-03-14 18:33:53'),
(10, 2, '2025-03-14', 'Mesocycle 1.1', 5, '2025-03-14 06:00:00', '2025-03-14 07:00:00', '2025-03-14 18:48:27', '2025-03-14 18:48:27');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `weight_unit` enum('kg','lb') DEFAULT 'kg',
  `height` float DEFAULT NULL,
  `height_unit` enum('cm','in') DEFAULT 'cm',
  `theme` varchar(50) DEFAULT 'default',
  `profile_created` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL,
  `active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `first_name`, `last_name`, `date_of_birth`, `gender`, `weight_unit`, `height`, `height_unit`, `theme`, `profile_created`, `last_login`, `active`) VALUES
(1, 'Tian102', 'tianpretorius@gmail.com', '$2y$10$MJbUTwjqyqIzGpR67uFUbujEnFXZPJCbDCC2Jeb/INnN6DEc71dFG', 'Tian', 'Pretorius', '1993-12-14', 'male', 'kg', 183, 'cm', 'default', '2025-03-14 08:20:01', '2025-03-14 11:57:18', 1),
(2, 'NETTA', 'fritzreinette@gmail.com', '$2y$10$bLd7vBZMrKUHIyaELuizOOE8/tK0z0a3/3ldFP4P5BUyju9y0euWy', 'Netta', 'Fritz', '1996-08-10', 'female', 'kg', 170, 'cm', 'default', '2025-03-14 18:44:18', '2025-03-14 18:44:24', 1);

-- --------------------------------------------------------

--
-- Table structure for table `user_exercise_history`
--

CREATE TABLE `user_exercise_history` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `exercise_id` int(11) NOT NULL,
  `usage_count` int(11) DEFAULT 1,
  `last_used` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `workout_details`
--

CREATE TABLE `workout_details` (
  `id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `muscle_group` varchar(50) DEFAULT NULL,
  `exercise_name` varchar(100) DEFAULT NULL,
  `equipment` varchar(100) DEFAULT NULL,
  `pre_energy_level` int(11) DEFAULT NULL,
  `pre_soreness_level` int(11) DEFAULT NULL,
  `sets` int(11) DEFAULT NULL,
  `reps` int(11) DEFAULT NULL,
  `load_weight` float DEFAULT NULL,
  `rir` int(11) DEFAULT NULL,
  `stimulus` int(11) DEFAULT NULL,
  `fatigue_level` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `workout_details`
--

INSERT INTO `workout_details` (`id`, `session_id`, `muscle_group`, `exercise_name`, `equipment`, `pre_energy_level`, `pre_soreness_level`, `sets`, `reps`, `load_weight`, `rir`, `stimulus`, `fatigue_level`, `created_at`, `updated_at`) VALUES
(9, 6, 'Shoulders', 'Shoulder Press', 'Unknown', 6, 5, 5, 15, 10, 2, 5, 5, '2025-03-14 15:55:06', '2025-03-14 18:55:27'),
(10, 7, 'Chest', 'Bench Press', 'Unknown', 7, 4, 3, 15, 80, 2, 8, 3, '2025-03-14 18:31:00', '2025-03-14 18:55:27'),
(11, 7, 'Back', 'Lat Pulldown', 'Unknown', 8, 3, 3, 8, 50, 2, 8, 6, '2025-03-14 18:31:28', '2025-03-14 18:55:27'),
(12, 8, 'Chest', 'Bench Press', 'Unknown', 5, 5, 3, 10, 90, 1, 9, 1, '2025-03-14 18:32:17', '2025-03-14 18:55:27'),
(13, 8, 'Back', 'Lat Pulldown', 'Unknown', 8, 5, 3, 5, 60, 2, 5, 5, '2025-03-14 18:32:41', '2025-03-14 18:55:27'),
(14, 8, 'Shoulders', 'Shoulder Press', 'Unknown', 7, 4, 2, 4, 100, 2, 7, 4, '2025-03-14 18:33:10', '2025-03-14 18:55:27'),
(15, 9, 'Chest', 'Bench Press', 'Unknown', 7, 5, 3, 12, 80, 1, 8, 3, '2025-03-14 18:34:23', '2025-03-14 18:55:27'),
(16, 9, 'Shoulders', 'Shoulder Press', 'Unknown', 6, 1, 3, 6, 22, 2, 3, 7, '2025-03-14 18:34:48', '2025-03-14 18:55:27'),
(17, 10, 'Glutes', 'Split squat', 'Unknown', 9, 2, 3, 10, 50, 2, 8, 3, '2025-03-14 18:49:43', '2025-03-14 18:55:27');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `correlation_insights`
--
ALTER TABLE `correlation_insights`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `daily_metrics`
--
ALTER TABLE `daily_metrics`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`,`date`),
  ADD KEY `idx_daily_metrics_date` (`date`),
  ADD KEY `idx_daily_metrics_user_date` (`user_id`,`date`);

--
-- Indexes for table `dashboard_preferences`
--
ALTER TABLE `dashboard_preferences`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `dashboard_widgets`
--
ALTER TABLE `dashboard_widgets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `equipment`
--
ALTER TABLE `equipment`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `exercises`
--
ALTER TABLE `exercises`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `muscle_group_id` (`muscle_group_id`,`equipment_id`,`name`),
  ADD KEY `equipment_id` (`equipment_id`);

--
-- Indexes for table `muscle_groups`
--
ALTER TABLE `muscle_groups`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `personal_records`
--
ALTER TABLE `personal_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `exercise_id` (`exercise_id`),
  ADD KEY `workout_detail_id` (`workout_detail_id`);

--
-- Indexes for table `training_sessions`
--
ALTER TABLE `training_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_training_sessions_date` (`date`),
  ADD KEY `idx_training_sessions_user_date` (`user_id`,`date`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `user_exercise_history`
--
ALTER TABLE `user_exercise_history`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`,`exercise_id`),
  ADD KEY `exercise_id` (`exercise_id`);

--
-- Indexes for table `workout_details`
--
ALTER TABLE `workout_details`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_workout_details_session` (`session_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `correlation_insights`
--
ALTER TABLE `correlation_insights`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `daily_metrics`
--
ALTER TABLE `daily_metrics`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `dashboard_preferences`
--
ALTER TABLE `dashboard_preferences`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `dashboard_widgets`
--
ALTER TABLE `dashboard_widgets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `equipment`
--
ALTER TABLE `equipment`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `exercises`
--
ALTER TABLE `exercises`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=655;

--
-- AUTO_INCREMENT for table `muscle_groups`
--
ALTER TABLE `muscle_groups`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `personal_records`
--
ALTER TABLE `personal_records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `training_sessions`
--
ALTER TABLE `training_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `user_exercise_history`
--
ALTER TABLE `user_exercise_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `workout_details`
--
ALTER TABLE `workout_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `correlation_insights`
--
ALTER TABLE `correlation_insights`
  ADD CONSTRAINT `correlation_insights_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `daily_metrics`
--
ALTER TABLE `daily_metrics`
  ADD CONSTRAINT `daily_metrics_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `dashboard_preferences`
--
ALTER TABLE `dashboard_preferences`
  ADD CONSTRAINT `dashboard_preferences_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `dashboard_widgets`
--
ALTER TABLE `dashboard_widgets`
  ADD CONSTRAINT `dashboard_widgets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `exercises`
--
ALTER TABLE `exercises`
  ADD CONSTRAINT `exercises_ibfk_1` FOREIGN KEY (`muscle_group_id`) REFERENCES `muscle_groups` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `exercises_ibfk_2` FOREIGN KEY (`equipment_id`) REFERENCES `equipment` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD CONSTRAINT `password_reset_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `personal_records`
--
ALTER TABLE `personal_records`
  ADD CONSTRAINT `personal_records_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `personal_records_ibfk_2` FOREIGN KEY (`exercise_id`) REFERENCES `exercises` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `personal_records_ibfk_3` FOREIGN KEY (`workout_detail_id`) REFERENCES `workout_details` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `training_sessions`
--
ALTER TABLE `training_sessions`
  ADD CONSTRAINT `training_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_exercise_history`
--
ALTER TABLE `user_exercise_history`
  ADD CONSTRAINT `user_exercise_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_exercise_history_ibfk_2` FOREIGN KEY (`exercise_id`) REFERENCES `exercises` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `workout_details`
--
ALTER TABLE `workout_details`
  ADD CONSTRAINT `workout_details_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `training_sessions` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
