# Metrics Tracker Database Schema Summary

## Core User Tables
- **users**
  - User accounts with preferences
  - Fields: id, username, email, password, first_name, last_name, gender, weight_unit, height_unit, theme
- **password_reset_tokens**
  - For password reset functionality
  - Fields: id, user_id, token, expires_at

## Fitness Metrics
- **daily_metrics**
  - Daily health tracking
  - Fields: id, user_id, date, sleep_start/end, stress_level, energy_level, motivation_level, weight, meals, nutrition data
- **correlation_insights**
  - Calculated correlations between metrics
  - Fields: id, user_id, primary_metric, secondary_metric, correlation_value, strength, direction, insight_text

## Workout System
- **training_sessions**
  - Workout sessions
  - Fields: id, user_id, date, mesocycle_name, session_number, training_start/end
- **workout_details**
  - Exercises done in each session
  - Fields: id, session_id, muscle_group, exercise_name, equipment, sets, reps, load_weight, rir, stimulus, fatigue_level
- **personal_records**
  - User's best performances
  - Fields: id, user_id, exercise_id, record_value, record_type, date

## Exercise Library
- **exercises**
  - Exercise catalog
  - Fields: id, muscle_group_id, equipment_id, name, description
- **muscle_groups**
  - Muscle categories (e.g., Abdominals, Biceps, Chest, Shoulders)
  - Fields: id, name
- **equipment**
  - Equipment types (e.g., Barbell, Dumbbells, Machine, Cables)
  - Fields: id, name
- **user_exercise_history**
  - Tracks exercise usage
  - Fields: id, user_id, exercise_id, usage_count, last_used

## UI Customization
- **dashboard_preferences**
  - User dashboard settings
  - Fields: id, user_id, default_view
- **dashboard_widgets**
  - Configurable dashboard widgets
  - Fields: id, user_id, widget_type, widget_title, widget_position, widget_size, is_visible

## Key Relationships
- Users have daily metrics, training sessions, and dashboard preferences
- Training sessions contain workout details
- Exercises are categorized by muscle group and equipment type
- Personal records are tied to specific exercises and users

This database supports a comprehensive fitness tracking application with workout logging, metrics analysis, and a customizable dashboard interface.