/**
 * Daily Metrics JavaScript
 * Handles functionality for the daily metrics page
 */

document.addEventListener('DOMContentLoaded', function() {
    // Handle date change
    document.getElementById('dateSelect').addEventListener('change', function() {
        window.location.href = 'daily.php?date=' + this.value;
    });
    
    // Range sliders display
    const rangeInputs = document.querySelectorAll('input[type="range"]');
    rangeInputs.forEach(input => {
        input.addEventListener('input', function() {
            const displayElement = document.getElementById(this.id + 'Display');
            if (displayElement) {
                displayElement.textContent = this.value;
            }
        });
    });
    
    // Form submission
    document.getElementById('dailyMetricsForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate form
        if (!validateDailyForm()) {
            return false;
        }
        
        // Get form data
        const formData = new FormData(this);
        const data = {};
        
        // Convert FormData to JSON object
        formData.forEach((value, key) => {
            // Handle date-time inputs
            if (key === 'sleep_start' || key === 'sleep_end') {
                if (value) {
                    // Convert from datetime-local format (YYYY-MM-DDThh:mm) to MySQL datetime format (YYYY-MM-DD hh:mm:ss)
                    data[key] = value.replace('T', ' ') + ':00';
                } else {
                    data[key] = null;
                }
            } else {
                data[key] = value;
            }
        });
        
        // Send API request
        fetch('api/daily_metrics.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            // Check if the response is JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return response.json();
            } else {
                // If not JSON, throw an error with the text response
                return response.text().then(text => {
                    throw new Error(text);
                });
            }
        })
        .then(result => {
            const alertElement = document.getElementById('alertMessage');
            alertElement.style.display = 'block';
            
            if (result.success) {
                alertElement.className = 'alert alert-success mt-3';
                alertElement.textContent = result.message;
            } else {
                alertElement.className = 'alert alert-danger mt-3';
                alertElement.textContent = result.message || 'An error occurred while saving data.';
            }
            
            // Scroll to alert message
            alertElement.scrollIntoView({ behavior: 'smooth' });
            
            // Hide message after 3 seconds
            setTimeout(() => {
                alertElement.style.display = 'none';
            }, 3000);
        })
        .catch(error => {
            console.error('Error:', error);
            const alertElement = document.getElementById('alertMessage');
            alertElement.style.display = 'block';
            alertElement.className = 'alert alert-danger mt-3';
            alertElement.textContent = 'Network error occurred. Please try again.';
        });
    });
    
    // Delete daily metrics
    const deleteButton = document.getElementById('deleteMetricsBtn');
    if (deleteButton) {
        deleteButton.addEventListener('click', function() {
            if (confirm('Are you sure you want to delete metrics for this day?')) {
                const date = document.getElementById('recordDate').value;
                
                fetch('api/daily_metrics.php', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ date: date })
                })
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        // Reset the form
                        document.getElementById('dailyMetricsForm').reset();
                        
                        // Set default values for range sliders
                        rangeInputs.forEach(input => {
                            input.value = 5;
                            const displayElement = document.getElementById(input.id + 'Display');
                            if (displayElement) {
                                displayElement.textContent = '5';
                            }
                        });
                        
                        // Show success message
                        const alertElement = document.getElementById('alertMessage');
                        alertElement.style.display = 'block';
                        alertElement.className = 'alert alert-success mt-3';
                        alertElement.textContent = result.message;
                        
                        // Hide message after 3 seconds
                        setTimeout(() => {
                            alertElement.style.display = 'none';
                        }, 3000);
                    } else {
                        alert(result.message || 'An error occurred while deleting the metrics.');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Network error occurred. Please try again.');
                });
            }
        });
    }
});

/**
 * Validate the daily metrics form
 * @returns {boolean} True if valid, false otherwise
 */
function validateDailyForm() {
    let isValid = true;
    
    // Validate sleep start and end times
    const sleepStart = document.getElementById('sleepStart').value;
    const sleepEnd = document.getElementById('sleepEnd').value;
    
    // If one sleep field is filled, both should be filled
    if ((sleepStart && !sleepEnd) || (!sleepStart && sleepEnd)) {
        alert('Please provide both sleep start and end times, or leave both empty.');
        isValid = false;
    }
    
    // If both sleep fields are filled, ensure sleep start is before sleep end
    if (sleepStart && sleepEnd) {
        const start = new Date(sleepStart);
        const end = new Date(sleepEnd);
        
        if (start >= end) {
            alert('Sleep start time must be before sleep end time.');
            isValid = false;
        }
    }
    
    // Validate numeric fields
    const numericFields = ['calories', 'protein', 'carbs', 'fats', 'waterIntake'];
    numericFields.forEach(field => {
        const element = document.getElementById(field);
        if (element.value && !validateNumeric(element.value, 0)) {
            alert(`Please enter a valid positive number for ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}.`);
            isValid = false;
        }
    });
    
    return isValid;
}

/**
 * Validate if input is a numeric value and greater than or equal to min
 * @param {string} value The value to check
 * @param {number} min The minimum allowed value
 * @returns {boolean} True if valid, false otherwise
 */
function validateNumeric(value, min) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= min;
}