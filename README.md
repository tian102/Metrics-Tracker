# Metrics Tracker - Daily & Training Metrics Tracker Web App

A lightweight web application for tracking daily personal metrics and workout/training data, designed specifically to run on shared hosting environments with PHP and MySQL.

## Features

### Daily Metrics Tracking
- **Morning Metrics**: Track sleep times, stress level, energy level, and motivation level
- **Throughout the Day**: Log meals and nutrition information
- **Evening**: Track calories, macronutrients (protein, carbs, fats), and water intake

### Training Metrics Tracking
- **Session Details**: Track mesocycle, session number, and training times
- **Workout Details**: Log exercises by muscle group with sets, reps, load, and RIR (Reps In Reserve)
- **Pre/Post Exercise Reviews**: Track energy levels, soreness, stimulus, and fatigue

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript (vanilla)
- **Backend**: PHP (compatible with PHP 7.0+)
- **Database**: MySQL/MariaDB
- **Hosting Requirements**: Shared hosting environment with PHP and MySQL support (e.g., Afrihost)

## Installation Instructions

### Prerequisites
- Web server with PHP 7.0 or higher
- MySQL or MariaDB database
- phpMyAdmin or another MySQL management tool (for database setup)

### Step 1: Database Setup
1. Log in to your hosting control panel and access phpMyAdmin
2. Create a new database (e.g., `metrics_tracker`)
3. Import the database schema from `database_schema.sql`

### Step 2: Application Setup
1. Download the application files
2. Configure the database connection:
   - Open `includes/config.php`
   - Update the database credentials:
     ```php
     define('DB_HOST', 'localhost');
     define('DB_USER', 'your_username'); // Change this
     define('DB_PASS', 'your_password'); // Change this
     define('DB_NAME', 'metrics_tracker'); // Change if you used a different database name
     ```
   - Update the application URL:
     ```php
     define('APP_URL', 'http://yourdomain.com/metrics-tracker'); // Change this to your actual URL
     ```

3. Upload all files to your web hosting:
   - You can use FTP, SFTP, or your hosting control panel's file manager
   - Upload to the public_html directory or a subdirectory (e.g., public_html/metrics-tracker)

### Step 3: Security Configuration
1. Ensure proper file permissions:
   - Directories: 755 (drwxr-xr-x)
   - Files: 644 (-rw-r--r--)
   - PHP files: 644 (-rw-r--r--)

2. Configure `.htaccess` (if using Apache):
   ```
   # Disable directory listing
   Options -Indexes
   
   # Protect configuration files
   <FilesMatch "^\.">
     Order allow,deny
     Deny from all
   </FilesMatch>
   
   # Protect includes directory
   <FilesMatch "^(config|db)\.php$">
     Order allow,deny
     Deny from all
   </FilesMatch>
   
   # Redirect all requests to index.php except for files that exist
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule ^(.*)$ index.php [L]
   </IfModule>
   ```

### Step 4: Testing the Installation
1. Navigate to your application URL (e.g., http://yourdomain.com/metrics-tracker)
2. You should see the dashboard page
3. Try adding a daily metric entry to verify database connectivity

## Deployment on Afrihost Shared Hosting

Afrihost shared hosting is well-suited for this application as it provides all the required technologies.

### Specific Afrihost Instructions:

1. **Accessing cPanel**:
   - Log in to your Afrihost Client Zone
   - Navigate to your hosting package
   - Click on "cPanel Login"

2. **Creating a Database**:
   - In cPanel, find the "Databases" section
   - Click on "MySQL Databases"
   - Create a new database
   - Create a new user
   - Add the user to the database with all privileges

3. **File Upload**:
   - In cPanel, find the "Files" section
   - Click on "File Manager"
   - Navigate to public_html or create a subdirectory
   - Upload all application files

4. **Setting Up Subdomain (Optional)**:
   - In cPanel, find the "Domains" section
   - Click on "Subdomains"
   - Create a new subdomain (e.g., metrics.yourdomain.com)
   - Point it to the directory containing your application files

## Usage Guide

### Daily Metrics
1. Click on "Daily Metrics" in the navigation menu
2. Select a date using the date picker
3. Fill in the metrics for the selected date
4. Click "Save Daily Metrics" to store the data

### Training Metrics
1. Click on "Training Metrics" in the navigation menu
2. Click "New Session" to create a new training session
3. Fill in the session details and click "Create Session"
4. After creating a session, you can add exercises:
   - Click "Add Exercise"
   - Fill in the exercise details
   - Click "Add Exercise" to save
5. You can edit or delete exercises as needed

## Security Considerations

This application is designed for personal use. For enhanced security:

1. **Password Protection**: Consider adding HTTP authentication or a simple login system
2. **Regular Backups**: Set up regular database backups through cPanel
3. **Keep PHP Updated**: Ensure your hosting provider keeps PHP updated
4. **HTTPS**: Enable SSL/TLS for your domain through your hosting provider

## Customization

### Adding New Metrics
To add new metrics, you'll need to:

1. Modify the database schema (add new columns to the appropriate tables)
2. Update the form fields in the PHP files
3. Update the JavaScript validation if needed
4. Update the API endpoints to handle the new fields

### Styling Changes
- Modify `assets/css/styles.css` to change the visual appearance
- The application uses a responsive design that should work well on mobile devices

## Troubleshooting

### Common Issues
1. **Database Connection Errors**:
   - Verify your database credentials in `includes/config.php`
   - Check if the database user has proper permissions

2. **Permission Issues**:
   - Ensure proper file permissions as outlined in the installation section

3. **API Errors**:
   - Check browser console for JavaScript errors
   - Enable PHP error reporting in `includes/config.php` for development:
     ```php
     ini_set('display_errors', 1);
     ini_set('display_startup_errors', 1);
     error_reporting(E_ALL);
     ```

## License

This application is provided for personal use. You are free to modify it to suit your needs.

## Support

For issues or questions, please contact the developer.

## Future Enhancements

Possible future improvements:
- Data visualization and reporting
- User authentication system
- Export/import functionality
- Mobile app integration