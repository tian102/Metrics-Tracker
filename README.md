# Metrics Tracker - Personal Health & Training Analytics

A comprehensive web application for tracking daily health metrics and workout data, designed to run on shared hosting environments with PHP and MySQL.

## Features

### Daily Health Metrics
- **Sleep Tracking**: Monitor sleep duration and patterns over time
- **Physical & Mental Wellness**: Track stress, energy, and motivation levels (1-10 scale)
- **Nutrition**: Log meals, calories, macronutrients (protein, carbs, fats), and water intake
- **Weight Management**: Record and visualize weight changes

### Training Analytics
- **Workout Logging**: Record training sessions with detailed exercise information
- **Exercise Library**: Access a comprehensive database of exercises categorized by muscle group and equipment
- **Custom Exercises**: Add your own exercises with muscle group and equipment associations
- **Performance Tracking**: Monitor sets, reps, weight, and personal records
- **Feedback Loop**: Record stimulus and fatigue levels for each exercise

### Data Visualization & Analysis
- **Customizable Dashboard**: Personalize your metrics view with drag-and-drop widgets
- **Interactive Charts**: Visualize trends in health and training metrics
- **Correlation Analysis**: Discover relationships between different metrics
- **Activity Heatmap**: View your activity patterns over time
- **Personal Records**: Track and celebrate your training achievements

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript with Bootstrap 5
- **Backend**: PHP (compatible with PHP 7.0+)
- **Database**: MySQL/MariaDB
- **Charts**: Chart.js for visualization
- **UI Enhancements**: SortableJS for drag-and-drop, custom form elements
- **Themes**: Multiple color themes (Default, Blue, Green, Purple, Dark)

## Installation

### Prerequisites
- Web server with PHP 7.0 or higher
- MySQL or MariaDB database
- phpMyAdmin or similar database management tool

### Database Setup
1. Access phpMyAdmin through your hosting control panel
2. Create a new database (e.g., `metrics_tracker`)
3. Import the `metrics_tracker.sql` file to create the schema

### Application Setup
1. Upload all application files to your web hosting directory
2. Configure database connection in `includes/config.php`:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_USER', 'your_username');
   define('DB_PASS', 'your_password');
   define('DB_NAME', 'metrics_tracker');
   define('APP_URL', 'http://yourdomain.com/metrics-tracker');
   ```
3. Set appropriate file permissions:
   - Directories: 755 (drwxr-xr-x)
   - Files: 644 (-rw-r--r--)

## Usage Guide

### Dashboard
- View your key metrics at a glance
- Customize layout by adding/removing widgets
- Toggle between daily, weekly, and monthly views

### Daily Tracking
1. Navigate to "Daily Tracking" → "Health"
2. Select a date using the date picker
3. Enter sleep times, stress/energy/motivation levels, weight, meals, and nutrition data
4. Save your daily metrics

### Training Tracking
1. Navigate to "Daily Tracking" → "Training"
2. Create a new training session with date and time
3. Add exercises from the library or create custom exercises
4. Record sets, reps, weight, and feedback (stimulus/fatigue)
5. Personal records are automatically detected and highlighted

### Analytics
1. Navigate to "Analytics"
2. Use the date range selector to specify your analysis period
3. View charts for health metrics, nutrition, and training data
4. Select specific exercises to track progress over time

### Customization
- Change your theme in the profile settings
- Personalize your dashboard layout in dashboard settings
- Add custom exercises to the exercise library

## Data Management

### Data Export
- Export all your data as CSV files for backup or external analysis
- Access this feature from your profile settings

### Data Privacy
- All data is stored locally on your hosting server
- No third-party services or tracking involved
- Full control over your personal health and fitness information

## Security Considerations

For enhanced security:

1. Enable HTTPS for your domain
2. Keep PHP updated to the latest version
3. Set up regular database backups
4. Consider implementing user authentication if multiple people will use the application

## Support & Contributions

If you encounter issues or have suggestions for improvements, feel free to contribute by:

1. Submitting bug reports
2. Suggesting new features
3. Contributing code enhancements
4. Improving documentation

## License

This application is provided for personal use. You are free to modify it to suit your needs.