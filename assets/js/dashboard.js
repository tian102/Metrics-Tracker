/**
 * Dashboard JavaScript
 * Handles functionality for the customizable dashboard
 */

/**
 * Initialize the dashboard with widgets
 * @param {Array} widgets List of widget objects
 * @param {string} defaultView Default time view (daily, weekly, monthly)
 */
function initDashboard(widgets, defaultView) {
    // Set up view selector buttons
    document.querySelectorAll('.view-selector').forEach(button => {
        button.addEventListener('click', function() {
            const view = this.getAttribute('data-view');
            
            // Remove active class from all buttons
            document.querySelectorAll('.view-selector').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Update dashboard with new view
            loadWidgets(widgets, view);
        });
    });
    
    // Load widgets with default view
    loadWidgets(widgets, defaultView);
}

/**
 * Load all widgets into the dashboard
 * @param {Array} widgets List of widget objects
 * @param {string} view Time view (daily, weekly, monthly)
 */
function loadWidgets(widgets, view) {
    const container = document.getElementById('dashboardWidgets');
    
    // Show loading state
    container.innerHTML = `
        <div class="dashboard-loading text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading your dashboard...</p>
        </div>
    `;
    
    if (widgets.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                <p>You don't have any widgets configured yet.</p>
                <a href="dashboard_settings.php" class="btn btn-primary">Customize Dashboard</a>
            </div>
        `;
        return;
    }
    
    // Calculate date range based on view
    const endDate = new Date();
    let startDate = new Date();
    
    switch (view) {
        case 'weekly':
            startDate.setDate(startDate.getDate() - 7);
            break;
        case 'monthly':
            startDate.setDate(startDate.getDate() - 30);
            break;
        case 'daily':
        default:
            startDate.setDate(startDate.getDate() - 1);
            break;
    }
    
    const startDateString = startDate.toISOString().split('T')[0];
    const endDateString = endDate.toISOString().split('T')[0];
    
    // Create rows based on widget sizes
    let html = `<div class="row g-4">`;
    
    widgets.forEach(widget => {
        // Update size class logic to match dashboard-settings.js
        const sizeClass = getSizeClass(widget.widget_size);
        
        html += `
            <div class="${sizeClass} mb-4">
                <div class="card shadow-sm h-100" id="widget-${widget.id}">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">${widget.widget_title}</h5>
                    </div>
                    <div class="card-body widget-content" data-widget-type="${widget.widget_type}">
                        <div class="d-flex justify-content-center align-items-center h-100">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    container.innerHTML = html;

    // Add getSizeClass function at the top of dashboard.js
    function getSizeClass(size) {
        const classes = {
            'small': 'col-md-6 col-xl-3',  // 4 per row on xl, 2 per row on smaller screens
            'medium': 'col-md-6',          // 2 per row on all screens
            'large': 'col-12'              // Full width
        };
        return classes[size] || 'col-md-6 col-xl-3'; // Default to small
    }
    
    // Load content for each widget
    widgets.forEach(widget => {
        loadWidgetContent(widget.id, widget.widget_type, startDateString, endDateString);
    });
}

/**
 * Load content for a specific widget
 * @param {number} widgetId Widget ID
 * @param {string} widgetType Widget type
 * @param {string} startDate Start date (YYYY-MM-DD)
 * @param {string} endDate End date (YYYY-MM-DD)
 */
function loadWidgetContent(widgetId, widgetType, startDate, endDate) {
    const widgetElement = document.querySelector(`#widget-${widgetId} .widget-content`);
    
    // Show loading state
    widgetElement.innerHTML = `
        <div class="d-flex justify-content-center align-items-center h-100">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;
    
    // Load widget data
    fetch(`api/dashboard.php?action=get_data&widget_type=${widgetType}&start_date=${startDate}&end_date=${endDate}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(result => {
            if (result.success) {
                // Render widget content based on type
                switch (widgetType) {
                    case 'sleep_stats':
                        renderSleepStats(widgetElement, result.data, result.date_range);
                        break;
                    
                    case 'energy_stats':
                        renderEnergyStats(widgetElement, result.data, result.date_range);
                        break;
                    
                    case 'nutrition_stats':
                        renderNutritionStats(widgetElement, result.data, result.date_range);
                        break;
                    
                    case 'training_stats':
                        renderTrainingStats(widgetElement, result.data, result.date_range);
                        break;
                    
                    case 'weight_chart':
                        renderWeightChart(widgetElement, result.data, result.date_range);
                        break;
                    
                    case 'sleep_chart':
                        renderSleepChart(widgetElement, result.data, result.date_range);
                        break;
                    
                    case 'energy_chart':
                        renderEnergyChart(widgetElement, result.data, result.date_range);
                        break;
                    
                    case 'nutrition_chart':
                        renderNutritionChart(widgetElement, result.data, result.date_range);
                        break;
                    
                    case 'recent_daily':
                        renderRecentDailyMetrics(widgetElement, result.data, result.date_range);
                        break;
                    
                    case 'recent_training':
                        renderRecentTrainingSessions(widgetElement, result.data, result.date_range);
                        break;
                    
                    case 'personal_records':
                        renderPersonalRecords(widgetElement, result.data);
                        break;
                    
                    case 'activity_heatmap':
                        renderActivityHeatmap(widgetElement, result.data, result.date_range);
                        break;
                    
                    case 'recent_insights':
                        renderRecentInsights(widgetElement, result.data);
                        break;
                    
                    default:
                        widgetElement.innerHTML = `
                            <div class="alert alert-warning">
                                <p>Unknown widget type: ${widgetType}</p>
                            </div>
                        `;
                        break;
                }
            } else {
                widgetElement.innerHTML = `
                    <div class="alert alert-danger">
                        <p>Failed to load widget data: ${result.message}</p>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            widgetElement.innerHTML = `
                <div class="alert alert-danger">
                    <p>Error loading widget data. Please try again later.</p>
                </div>
            `;
        });
}

/**
 * Render activity heatmap widget
 * @param {HTMLElement} element Widget element
 * @param {Array} data Activity data
 * @param {Object} dateRange Date range information
 */
function renderActivityHeatmap(element, data, dateRange) {
    if (!data || data.length === 0) {
        element.innerHTML = `
            <div class="text-center py-3">
                <i class="fas fa-calendar-alt fa-3x text-muted mb-3"></i>
                <p class="mb-0">No training data available for this period.</p>
            </div>
        `;
        return;
    }
    
    // Create a map of dates to make data lookup easier
    const dateMap = {};
    data.forEach(day => {
        // Make sure all properties exist and have default values
        day.total_volume = parseFloat(day.total_volume) || 0;
        day.exercise_count = parseInt(day.exercise_count) || 0;
        day.session_count = parseInt(day.session_count) || 0;
        
        // Store in map for easier lookup
        dateMap[day.date] = day;
    });
    
    // Group data by week and day
    const weeks = {};
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Generate dates for the entire period to ensure all days are included
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
        
        // Calculate week number
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - dayOfWeek);
        const weekKey = weekStart.toISOString().substring(0, 10);
        
        if (!weeks[weekKey]) {
            weeks[weekKey] = Array(7).fill(null);
        }
        
        // Get data for this date or use default values
        let dayData = dateMap[dateStr] || {
            date: dateStr,
            total_volume: 0,
            exercise_count: 0,
            session_count: 0
        };
        
        // Calculate volume level (0-3) based on total exercise volume
        let volumeLevel = 0;
        if (dayData.total_volume > 0) {
            // Determine intensity level based on volume thresholds
            if (dayData.total_volume > 10000) {
                volumeLevel = 3; // High volume
            } else if (dayData.total_volume > 5000) {
                volumeLevel = 2; // Medium volume
            } else {
                volumeLevel = 1; // Low volume
            }
        }
        
        weeks[weekKey][dayOfWeek] = {
            date: dateStr,
            level: volumeLevel,
            totalVolume: dayData.total_volume,
            exerciseCount: dayData.exercise_count,
            sessionCount: dayData.session_count
        };
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Sort weeks by date
    const sortedWeeks = Object.keys(weeks).sort();
    
    // Create heatmap table
    let html = `
        <div class="heatmap-container">
            <table class="heatmap-table">
                <thead>
                    <tr>
                        ${daysOfWeek.map(day => `<th>${day}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
    `;
    
    sortedWeeks.forEach(week => {
        html += '<tr>';
        
        weeks[week].forEach(day => {
            if (day === null) {
                html += '<td class="empty-day"></td>';
            } else {
                const levelClass = getHeatmapColorClass(day.level);
                const formattedVolume = day.totalVolume.toLocaleString();
                
                const tooltip = `
                    Date: ${formatDate(day.date)}<br>
                    Volume: ${formattedVolume} kg<br>
                    Exercises: ${day.exerciseCount}<br>
                    Sessions: ${day.sessionCount}
                `;
                
                html += `
                    <td class="heatmap-day ${levelClass}" 
                        data-bs-toggle="tooltip" 
                        data-bs-html="true"
                        data-bs-placement="top" 
                        title="${tooltip}">
                        <span class="day-number">${new Date(day.date).getDate()}</span>
                    </td>
                `;
            }
        });
        
        html += '</tr>';
    });
    
    html += `
                </tbody>
            </table>
            
            <div class="heatmap-legend mt-3 d-flex justify-content-center">
                <div class="d-flex align-items-center me-3">
                    <span class="heatmap-legend-color heatmap-level-0 me-1"></span>
                    <small>No Volume</small>
                </div>
                <div class="d-flex align-items-center me-3">
                    <span class="heatmap-legend-color heatmap-level-1 me-1"></span>
                    <small>< 5,000 kg</small>
                </div>
                <div class="d-flex align-items-center me-3">
                    <span class="heatmap-legend-color heatmap-level-2 me-1"></span>
                    <small>5,000-10,000 kg</small>
                </div>
                <div class="d-flex align-items-center">
                    <span class="heatmap-legend-color heatmap-level-3 me-1"></span>
                    <small>10,000+ kg</small>
                </div>
            </div>
        </div>
    `;
    
    element.innerHTML = html;
    
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(element.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

/**
 * Get color class for heatmap based on activity level
 * @param {number} level Activity level
 * @returns {string} CSS class for the color
 */
function getHeatmapColorClass(level) {
    if (level >= 3) {
        return 'heatmap-level-3';
    } else if (level >= 2) {
        return 'heatmap-level-2';
    } else if (level > 0) {
        return 'heatmap-level-1';
    } else {
        return 'heatmap-level-0';
    }
}

/**
 * Format a date for display
 * @param {string} dateString Date string in YYYY-MM-DD format
 * @returns {string} Formatted date (e.g., "Jan 1, 2023")
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Add CSS for the heatmap
document.head.insertAdjacentHTML('beforeend', `
<style>
    .heatmap-table {
        width: 100%;
        table-layout: fixed;
        border-collapse: separate;
        border-spacing: 2px;
    }
    
    .heatmap-table th {
        text-align: center;
        font-size: 0.8rem;
    }
    
    .heatmap-day {
        width: 30px;
        height: 30px;
        text-align: center;
        font-size: 0.8rem;
        border-radius: 3px;
        cursor: pointer;
    }
    
    .empty-day {
        background-color: transparent;
    }
    
    .heatmap-level-0 {
        background-color: #ebedf0;
    }
    
    .heatmap-level-1 {
        background-color: #9be9a8;
    }
    
    .heatmap-level-2 {
        background-color: #40c463;
    }
    
    .heatmap-level-3 {
        background-color: #216e39;
        color: white;
    }
    
    .heatmap-legend-color {
        display: inline-block;
        width: 15px;
        height: 15px;
        border-radius: 3px;
    }
    
    .day-number {
        display: inline-block;
        width: 100%;
        height: 100%;
        line-height: 30px;
    }
</style>
`);

/**
 * Render sleep statistics widget
 * @param {HTMLElement} element Widget element
 * @param {Object} data Sleep statistics data
 * @param {Object} dateRange Date range information
 */
function renderSleepStats(element, data, dateRange) {
    if (!data || data.sleep_entries_count === 0) {
        element.innerHTML = `
            <div class="text-center py-3">
                <i class="fas fa-bed fa-3x text-muted mb-3"></i>
                <p class="mb-0">No sleep data available for this period.</p>
            </div>
        `;
        return;
    }
    
    // Convert to numbers and handle null values
    const avgSleepHours = data.avg_sleep_hours !== null ? parseFloat(data.avg_sleep_hours).toFixed(1) : 'N/A';
    const minSleepHours = data.min_sleep_hours !== null ? parseFloat(data.min_sleep_hours).toFixed(1) : 'N/A';
    const maxSleepHours = data.max_sleep_hours !== null ? parseFloat(data.max_sleep_hours).toFixed(1) : 'N/A';
    
    element.innerHTML = `
        <div class="text-center">
            <div class="display-4 fw-bold text-primary mb-3">${avgSleepHours} hrs</div>
            <p class="text-muted mb-2">Average Sleep Duration</p>
            
            <div class="d-flex justify-content-center mt-3">
                <div class="text-center px-3 border-end">
                    <div class="h5 mb-0">${minSleepHours} hrs</div>
                    <div class="small text-muted">Minimum</div>
                </div>
                <div class="text-center px-3">
                    <div class="h5 mb-0">${maxSleepHours} hrs</div>
                    <div class="small text-muted">Maximum</div>
                </div>
            </div>
            
            <div class="text-muted mt-3 small">
                Based on ${data.sleep_entries_count} entries over ${dateRange.days} days
            </div>
        </div>
    `;
}

/**
 * Render energy, stress, and motivation statistics widget
 * @param {HTMLElement} element Widget element
 * @param {Object} data Energy statistics data
 * @param {Object} dateRange Date range information
 */
function renderEnergyStats(element, data, dateRange) {
    if (!data || data.entry_count === 0) {
        element.innerHTML = `
            <div class="text-center py-3">
                <i class="fas fa-bolt fa-3x text-muted mb-3"></i>
                <p class="mb-0">No energy data available for this period.</p>
            </div>
        `;
        return;
    }
    
    const avgEnergy = data.avg_energy ? parseFloat(data.avg_energy).toFixed(1) : 'N/A';
    const avgStress = data.avg_stress ? parseFloat(data.avg_stress).toFixed(1) : 'N/A';
    const avgMotivation = data.avg_motivation ? parseFloat(data.avg_motivation).toFixed(1) : 'N/A';
    
    element.innerHTML = `
        <div class="text-center mb-3">
            <div class="display-4 fw-bold text-warning">${avgEnergy}</div>
            <p class="text-muted">Average Energy (1-10)</p>
        </div>
        
        <div class="d-flex justify-content-center">
            <div class="text-center px-3 border-end">
                <div class="h5 mb-0 text-danger">${avgStress}</div>
                <div class="small text-muted">Stress</div>
            </div>
            <div class="text-center px-3">
                <div class="h5 mb-0 text-success">${avgMotivation}</div>
                <div class="small text-muted">Motivation</div>
            </div>
        </div>
        
        <div class="text-muted mt-3 text-center small">
            Based on ${data.entry_count} entries over ${dateRange.days} days
        </div>
    `;
}

/**
 * Render nutrition statistics widget
 * @param {HTMLElement} element Widget element
 * @param {Object} data Nutrition statistics data
 * @param {Object} dateRange Date range information
 */
function renderNutritionStats(element, data, dateRange) {
    if (!data || data.entry_count === 0) {
        element.innerHTML = `
            <div class="text-center py-3">
                <i class="fas fa-utensils fa-3x text-muted mb-3"></i>
                <p class="mb-0">No nutrition data available for this period.</p>
            </div>
        `;
        return;
    }
    
    const avgCalories = data.avg_calories ? Math.round(data.avg_calories) : 'N/A';
    const avgProtein = data.avg_protein ? parseFloat(data.avg_protein).toFixed(1) : 'N/A';
    const avgCarbs = data.avg_carbs ? parseFloat(data.avg_carbs).toFixed(1) : 'N/A';
    const avgFats = data.avg_fats ? parseFloat(data.avg_fats).toFixed(1) : 'N/A';
    
    element.innerHTML = `
        <div class="text-center mb-3">
            <div class="display-4 fw-bold text-danger">${avgCalories}</div>
            <p class="text-muted">Average Calories</p>
        </div>
        
        <div class="d-flex justify-content-around">
            <div class="text-center">
                <div class="h5 mb-0 text-primary">${avgProtein}g</div>
                <div class="small text-muted">Protein</div>
            </div>
            <div class="text-center">
                <div class="h5 mb-0 text-warning">${avgCarbs}g</div>
                <div class="small text-muted">Carbs</div>
            </div>
            <div class="text-center">
                <div class="h5 mb-0 text-success">${avgFats}g</div>
                <div class="small text-muted">Fats</div>
            </div>
        </div>
        
        <div class="text-muted mt-3 text-center small">
            Based on ${data.entry_count} entries over ${dateRange.days} days
        </div>
    `;
}

/**
 * Render training statistics widget
 * @param {HTMLElement} element Widget element
 * @param {Object} data Training statistics data
 * @param {Object} dateRange Date range information
 */
function renderTrainingStats(element, data, dateRange) {
    if (!data || !data.session_count) {
        element.innerHTML = `
            <div class="text-center py-3">
                <i class="fas fa-dumbbell fa-3x text-muted mb-3"></i>
                <p class="mb-0">No training data available for this period.</p>
            </div>
        `;
        return;
    }
    
    const sessionCount = data.session_count;
    const avgDuration = data.avg_duration ? Math.round(data.avg_duration) : 'N/A';
    const totalVolume = data.total_volume ? Math.round(data.total_volume).toLocaleString() : 'N/A';
    
    element.innerHTML = `
        <div class="text-center mb-3">
            <div class="display-4 fw-bold text-success">${sessionCount}</div>
            <p class="text-muted">Training Sessions</p>
        </div>
        
        <div class="d-flex justify-content-center">
            <div class="text-center px-3 border-end">
                <div class="h5 mb-0">${avgDuration} min</div>
                <div class="small text-muted">Avg. Duration</div>
            </div>
            <div class="text-center px-3">
                <div class="h5 mb-0">${totalVolume}</div>
                <div class="small text-muted">Total Volume</div>
            </div>
        </div>
        
        <div class="text-muted mt-3 text-center small">
            Over ${dateRange.days} days
        </div>
    `;
}

/**
 * Render weight chart widget
 * @param {HTMLElement} element Widget element
 * @param {Array} data Weight data
 * @param {Object} dateRange Date range information
 */
function renderWeightChart(element, data, dateRange) {
    if (!data || data.length === 0) {
        element.innerHTML = `
            <div class="text-center py-3">
                <i class="fas fa-weight fa-3x text-muted mb-3"></i>
                <p class="mb-0">No weight data available for this period.</p>
            </div>
        `;
        return;
    }
    
    // Create a fixed-aspect-ratio container for the chart
    const canvasId = 'weight-chart-' + Math.random().toString(36).substring(2, 15);
    element.innerHTML = `<div class="chart-container"><canvas id="${canvasId}"></canvas></div>`;
    
    // Get dates and weights
    const dates = data.map(item => item.date);
    const weights = data.map(item => item.weight);
    
    // Create chart
    const ctx = document.getElementById(canvasId).getContext('2d');
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Weight',
                data: weights,
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
    
    // Store the chart instance on the canvas for resize handling
    ctx.canvas.chart = chart;
}

/**
 * Render sleep chart widget
 * @param {HTMLElement} element Widget element
 * @param {Array} data Sleep data
 * @param {Object} dateRange Date range information
 */
function renderSleepChart(element, data, dateRange) {
    if (!data || data.length === 0) {
        element.innerHTML = `
            <div class="text-center py-3">
                <i class="fas fa-bed fa-3x text-muted mb-3"></i>
                <p class="mb-0">No sleep data available for this period.</p>
            </div>
        `;
        return;
    }
    
    // Create a fixed-aspect-ratio container for the chart
    const canvasId = 'sleep-chart-' + Math.random().toString(36).substring(2, 15);
    element.innerHTML = `<div class="chart-container"><canvas id="${canvasId}"></canvas></div>`;
    
    // Get dates and sleep hours
    const dates = data.map(item => item.date);
    const sleepHours = data.map(item => item.sleep_hours);
    
    // Create chart
    const ctx = document.getElementById(canvasId).getContext('2d');
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Sleep Hours',
                data: sleepHours,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
    
    // Store the chart instance on the canvas for resize handling
    ctx.canvas.chart = chart;
}

/**
 * Render energy chart widget
 * @param {HTMLElement} element Widget element
 * @param {Array} data Energy data
 * @param {Object} dateRange Date range information
 */
function renderEnergyChart(element, data, dateRange) {
    if (!data || data.length === 0) {
        element.innerHTML = `
            <div class="text-center py-3">
                <i class="fas fa-bolt fa-3x text-muted mb-3"></i>
                <p class="mb-0">No energy data available for this period.</p>
            </div>
        `;
        return;
    }
    
    // Create a fixed-aspect-ratio container for the chart
    const canvasId = 'energy-chart-' + Math.random().toString(36).substring(2, 15);
    element.innerHTML = `<div class="chart-container"><canvas id="${canvasId}"></canvas></div>`;
    
    // Get dates and metrics
    const dates = data.map(item => item.date);
    const energyLevels = data.map(item => item.energy_level);
    const stressLevels = data.map(item => item.stress_level);
    const motivationLevels = data.map(item => item.motivation_level);
    
    // Create chart
    const ctx = document.getElementById(canvasId).getContext('2d');
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Energy',
                    data: energyLevels,
                    borderColor: 'rgba(255, 159, 64, 1)',
                    backgroundColor: 'rgba(255, 159, 64, 0.2)',
                    tension: 0.1,
                    fill: false
                },
                {
                    label: 'Stress',
                    data: stressLevels,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    tension: 0.1,
                    fill: false
                },
                {
                    label: 'Motivation',
                    data: motivationLevels,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10
                }
            }
        }
    });
    
    // Store the chart instance on the canvas for resize handling
    ctx.canvas.chart = chart;
}

/**
 * Render nutrition chart widget
 * @param {HTMLElement} element Widget element
 * @param {Array} data Nutrition data
 * @param {Object} dateRange Date range information
 */
function renderNutritionChart(element, data, dateRange) {
    if (!data || data.length === 0) {
        element.innerHTML = `
            <div class="text-center py-3">
                <i class="fas fa-utensils fa-3x text-muted mb-3"></i>
                <p class="mb-0">No nutrition data available for this period.</p>
            </div>
        `;
        return;
    }
    
    // Create a fixed-aspect-ratio container for the chart
    const canvasId = 'nutrition-chart-' + Math.random().toString(36).substring(2, 15);
    element.innerHTML = `<div class="chart-container"><canvas id="${canvasId}"></canvas></div>`;
    
    // Get dates and metrics
    const dates = data.map(item => item.date);
    const calories = data.map(item => item.calories);
    
    // Create chart
    const ctx = document.getElementById(canvasId).getContext('2d');
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Calories',
                    data: calories,
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    // Store the chart instance on the canvas for resize handling
    ctx.canvas.chart = chart;
}

/**
 * Render recent daily metrics widget
 * @param {HTMLElement} element Widget element
 * @param {Array} data Daily metrics data
 * @param {Object} dateRange Date range information
 */
function renderRecentDailyMetrics(element, data, dateRange) {
    if (!data || data.length === 0) {
        element.innerHTML = `
            <div class="text-center py-3">
                <i class="fas fa-calendar-day fa-3x text-muted mb-3"></i>
                <p class="mb-0">No daily metrics available for this period.</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Sleep</th>
                        <th>Energy</th>
                        <th>Weight</th>
                        <th>Calories</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    data.forEach(metric => {
        let sleepHtml = 'N/A';
        if (metric.sleep_start && metric.sleep_end) {
            const start = new Date(metric.sleep_start);
            const end = new Date(metric.sleep_end);
            const diff = (end - start) / (1000 * 60 * 60);
            sleepHtml = `${diff.toFixed(1)} hrs`;
        }
        
        html += `
            <tr>
                <td>${formatDate(metric.date)}</td>
                <td>${sleepHtml}</td>
                <td>${metric.energy_level ? metric.energy_level + '/10' : 'N/A'}</td>
                <td>${metric.weight ? metric.weight + ' kg' : 'N/A'}</td>
                <td>${metric.calories ? metric.calories : 'N/A'}</td>
                <td>
                    <a href="daily.php?date=${metric.date}" class="btn btn-sm btn-outline-primary">
                        <i class="fas fa-eye"></i>
                    </a>
                    <button type="button" class="btn btn-sm btn-outline-danger delete-metric" data-id="${metric.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
        <div class="text-end mt-2">
            <a href="daily.php" class="btn btn-outline-primary btn-sm">View All</a>
        </div>
    `;
    
    element.innerHTML = html;

    // Add event listeners for delete buttons
    element.querySelectorAll('.delete-metric').forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            const metricId = this.getAttribute('data-id');
            
            if (confirm('Are you sure you want to delete this daily metrics entry? This action cannot be undone.')) {
                deleteMetricsEntry(metricId);
            }
        });
    });
}

/**
 * Render recent training sessions widget
 * @param {HTMLElement} element Widget element
 * @param {Array} data Training sessions data
 * @param {Object} dateRange Date range information
 */
function renderRecentTrainingSessions(element, data, dateRange) {
    if (!data || data.length === 0) {
        element.innerHTML = `
            <div class="text-center py-3">
                <i class="fas fa-dumbbell fa-3x text-muted mb-3"></i>
                <p class="mb-0">No training sessions available for this period.</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Mesocycle</th>
                        <th>Session #</th>
                        <th>Duration</th>
                        <th>Exercises</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    data.forEach(session => {
        let durationHtml = 'N/A';
        if (session.duration_minutes) {
            const hours = Math.floor(session.duration_minutes / 60);
            const minutes = session.duration_minutes % 60;
            durationHtml = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        }
        
        html += `
            <tr>
                <td>${formatDate(session.date)}</td>
                <td>${session.mesocycle_name || 'N/A'}</td>
                <td>${session.session_number || 'N/A'}</td>
                <td>${durationHtml}</td>
                <td>${session.exercise_count || '0'}</td>
                <td class="text-end">
                    <div class="d-flex justify-content-end">
                        <a href="training.php?id=${session.id}" class="btn btn-sm btn-outline-success me-1">
                            <i class="fas fa-eye"></i>
                        </a>
                        <button type="button" class="btn btn-sm btn-outline-danger delete-session" data-id="${session.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
        <div class="text-end mt-2">
            <a href="training.php" class="btn btn-outline-success btn-sm">View All</a>
        </div>
    `;
    
    element.innerHTML = html;

    // Add event listeners for delete buttons
    element.querySelectorAll('.delete-session').forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            const sessionId = this.getAttribute('data-id');
            
            // Pass session ID directly to deleteTrainingSession without showing confirmation dialog here
            deleteTrainingSession(sessionId, true); // Added true parameter to indicate we need confirmation
        });
    });
}

/**
 * Render personal records widget
 * @param {HTMLElement} element Widget element
 * @param {Array} data Personal records data
 */
function renderPersonalRecords(element, data) {
    if (!data || data.length === 0) {
        element.innerHTML = `
            <div class="text-center py-3">
                <i class="fas fa-trophy fa-3x text-muted mb-3"></i>
                <p class="mb-0">No personal records available yet.</p>
                <p class="mt-2">
                    <a href="exercises.php" class="btn btn-sm btn-outline-primary">Browse Exercises</a>
                </p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="list-group">
    `;
    
    data.forEach(record => {
        const recordType = formatRecordType(record.record_type);
        const recordValue = formatRecordValue(record.record_value, record.record_type);
        const dateStr = formatDate(record.date);
        const isNew = !record.is_acknowledged;
        
        html += `
            <div class="list-group-item ${isNew ? 'list-group-item-warning' : ''}">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${record.exercise_name}</h6>
                    <small>${dateStr}</small>
                </div>
                <p class="mb-1">
                    <span class="badge bg-success">${recordType}</span>
                    ${recordValue}
                </p>
                <small>${record.muscle_group} | ${record.equipment}</small>
                ${isNew ? '<span class="badge bg-danger ms-2">NEW</span>' : ''}
            </div>
        `;
    });
    
    html += `
        </div>
    `;
    
    element.innerHTML = html;
}

/**
 * Render recent insights widget
 * @param {HTMLElement} element Widget element
 * @param {Array} data Insights data
 */
function renderRecentInsights(element, data) {
    if (!data || data.length === 0) {
        element.innerHTML = `
            <div class="text-center py-3">
                <i class="fas fa-lightbulb fa-3x text-muted mb-3"></i>
                <p class="mb-0">No insights available yet.</p>
                <p class="mt-2">
                    <a href="correlations.php" class="btn btn-sm btn-outline-primary">Start Analysis</a>
                </p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="list-group">
    `;
    
    data.forEach(insight => {
        const correlationClass = getCorrelationClass(insight.correlation_value, insight.correlation_strength);
        
        html += `
            <div class="list-group-item">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${getMetricName(insight.primary_metric)} & ${getMetricName(insight.secondary_metric)}</h6>
                    <small class="text-${correlationClass}">r = ${insight.correlation_value}</small>
                </div>
                <p class="mb-1 small">${insight.insight_text}</p>
            </div>
        `;
    });
    
    html += `
        </div>
        <div class="text-end mt-2">
            <a href="correlations.php" class="btn btn-outline-primary btn-sm">View All Insights</a>
        </div>
    `;
    
    element.innerHTML = html;
}

/**
 * Format a record type for display
 * @param {string} type Record type
 * @returns {string} Formatted record type
 */
function formatRecordType(type) {
    switch (type) {
        case 'weight':
            return 'Weight PR';
        case 'reps':
            return 'Reps PR';
        case 'volume':
            return 'Volume PR';
        case 'time':
            return 'Time PR';
        default:
            return type;
    }
}

/**
 * Format a record value for display
 * @param {number} value Record value
 * @param {string} type Record type
 * @returns {string} Formatted record value
 */
function formatRecordValue(value, type) {
    switch (type) {
        case 'weight':
            return `${value} kg`;
        case 'reps':
            return `${value} reps`;
        case 'volume':
            return `${value} kg (volume)`;
        case 'time':
            return `${value} seconds`;
        default:
            return value;
    }
}

/**
 * Get CSS class for correlation strength
 * @param {number} correlation Correlation coefficient
 * @param {string} strength Correlation strength
 * @returns {string} Bootstrap CSS class
 */
function getCorrelationClass(correlation, strength) {
    if (correlation >= 0.7) return 'success';
    if (correlation >= 0.4) return 'primary';
    if (correlation >= 0) return 'info';
    if (correlation >= -0.4) return 'warning';
    return 'danger';
}

/**
 * Get a human-readable name for a metric
 * @param {string} metricId Metric ID
 * @returns {string} Human-readable name
 */
function getMetricName(metricId) {
    const metricNames = {
        'sleep_duration': 'Sleep Duration',
        'energy_level': 'Energy Level',
        'stress_level': 'Stress Level',
        'motivation_level': 'Motivation Level',
        'weight': 'Body Weight',
        'calories': 'Calorie Intake',
        'protein': 'Protein Intake',
        'carbs': 'Carbohydrate Intake',
        'fats': 'Fat Intake',
        'water_intake': 'Water Intake',
        'training_volume': 'Training Volume',
        'training_duration': 'Training Duration',
        'exercise_load': 'Exercise Load',
        'stimulus_rating': 'Muscle Stimulus',
        'fatigue_rating': 'Workout Fatigue'
    };
    
    return metricNames[metricId] || metricId;
}

/**
 * Delete a daily metrics entry
 * @param {string} metricId - The ID of the daily metrics entry to delete
 */
function deleteMetricsEntry(metricId) {
    fetch('api/daily_metrics.php', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: metricId })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            // Show success message
            showNotification('success', 'Daily metrics entry deleted successfully.');
            
            // Find and remove the deleted metrics item from the DOM for immediate visual feedback
            const metricItems = document.querySelectorAll(`.delete-metric[data-id="${metricId}"]`);
            metricItems.forEach(btn => {
                const item = btn.closest('.list-group-item');
                if (item) {
                    item.remove();
                }
                
                // Also remove row from table if it exists
                const tableRow = btn.closest('tr');
                if (tableRow) {
                    tableRow.remove();
                }
            });
            
            // Check if there are any metrics left in the widget and update UI accordingly
            const recentMetricsContainer = document.getElementById('recentMetricsContainer');
            const listItems = recentMetricsContainer?.querySelectorAll('.list-group-item');
            const tableRows = document.querySelector('.widget-content[data-widget-type="recent_daily"] tbody')?.querySelectorAll('tr');
            
            // If no more metrics entries in list view
            if (recentMetricsContainer && listItems && listItems.length === 0) {
                recentMetricsContainer.innerHTML = '<p class="text-muted">No daily metrics entries found.</p>';
            }
            
            // If no more metrics entries in table view
            if (tableRows && tableRows.length === 0) {
                const widgetElement = document.querySelector('.widget-content[data-widget-type="recent_daily"]');
                if (widgetElement) {
                    widgetElement.innerHTML = `
                        <div class="text-center py-3">
                            <i class="fas fa-calendar-day fa-3x text-muted mb-3"></i>
                            <p class="mb-0">No daily metrics available for this period.</p>
                        </div>
                    `;
                }
            }
            
            // Refresh all dashboard widgets since metrics data affects multiple widgets
            refreshAllDashboardWidgets();
        } else {
            showNotification('danger', result.message || 'Failed to delete metrics entry.');
        }
    })
    .catch(error => {
        console.error('Error deleting metrics entry:', error);
        showNotification('danger', 'An error occurred while deleting the metrics entry.');
    });
}

/**
 * Delete a training session
 * @param {string} sessionId - The ID of the training session to delete
 * @param {boolean} needsConfirmation - Whether confirmation is needed before deletion
 */
function deleteTrainingSession(sessionId, needsConfirmation = false) {
    // Show confirmation dialog only if needed (first time)
    if (needsConfirmation) {
        if (!confirm('Are you sure you want to delete this training session? This will also delete all exercises in this session. This action cannot be undone.')) {
            return; // User cancelled, abort deletion
        }
    }
    
    fetch('api/training_sessions.php', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: sessionId })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            // Show success message
            showNotification('success', 'Training session deleted successfully.');
            
            // Find and remove the deleted session item from the DOM for immediate visual feedback
            const sessionItems = document.querySelectorAll(`.delete-session[data-id="${sessionId}"]`);
            sessionItems.forEach(btn => {
                const item = btn.closest('.list-group-item');
                if (item) {
                    item.remove();
                }
                
                // Also remove row from table if it exists
                const tableRow = btn.closest('tr');
                if (tableRow) {
                    tableRow.remove();
                }
            });
            
            // Refresh all dashboard widgets since training data affects multiple widgets
            refreshAllDashboardWidgets();
        } else {
            showNotification('danger', result.message || 'Failed to delete training session.');
        }
    })
    .catch(error => {
        console.error('Error deleting training session:', error);
        showNotification('danger', 'An error occurred while deleting the training session.');
    });
}

/**
 * Refresh all dashboard widgets with current data
 * This ensures all widgets stay in sync when data is deleted
 */
function refreshAllDashboardWidgets() {
    // Find all widgets on the dashboard
    const widgets = document.querySelectorAll('.widget-content');
    if (widgets.length === 0) return;
    
    // Get the current date range from active view selector
    const activeViewSelector = document.querySelector('.view-selector.active');
    let view = 'weekly'; // Default view
    
    if (activeViewSelector) {
        view = activeViewSelector.getAttribute('data-view');
    }
    
    // Calculate date range based on view
    const endDate = new Date();
    let startDate = new Date();
    
    switch (view) {
        case 'weekly':
            startDate.setDate(startDate.getDate() - 7);
            break;
        case 'monthly':
            startDate.setDate(startDate.getDate() - 30);
            break;
        case 'daily':
        default:
            startDate.setDate(startDate.getDate() - 1);
            break;
    }
    
    const startDateString = startDate.toISOString().split('T')[0];
    const endDateString = endDate.toISOString().split('T')[0];
    
    // Show loading state for all widgets
    widgets.forEach(widget => {
        widget.innerHTML = `
            <div class="d-flex justify-content-center align-items-center h-100">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;
    });
    
    // Reload content for each widget
    widgets.forEach(widget => {
        const widgetType = widget.getAttribute('data-widget-type');
        const widgetId = widget.closest('.card').id.replace('widget-', '');
        
        if (widgetType) {
            loadWidgetContent(widgetId, widgetType, startDateString, endDateString);
        }
    });
    
    // Also update the standalone sections if they exist
    if (document.getElementById('recentMetricsContainer')) {
        loadRecentMetrics();
    }
    
    if (document.getElementById('recentSessionsContainer')) {
        loadRecentSessions();
    }
}

/**
 * Show a notification message
 * @param {string} type - The type of notification (success, danger, warning, info)
 * @param {string} message - The message to display
 */
function showNotification(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Insert at the top of the main container
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);
    
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 150);
    }, 3000);
}
