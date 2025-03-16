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
                <td>
                    <a href="training.php?id=${session.id}" class="btn btn-sm btn-outline-success">
                        <i class="fas fa-eye"></i>
                    </a>
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
                <p class="mb-0">No activity data available for this period.</p>
            </div>
        `;
        return;
    }
    
    // Group data by week and day
    const weeks = {};
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    data.forEach(day => {
        const date = new Date(day.date);
        const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
        
        // Calculate week number (approximate)
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - dayOfWeek);
        const weekKey = weekStart.toISOString().substring(0, 10);
        
        if (!weeks[weekKey]) {
            weeks[weekKey] = Array(7).fill(null);
        }
        
        weeks[weekKey][dayOfWeek] = {
            date: day.date,
            level: day.activity_level,
            hasTraining: day.has_training,
            hasDaily: day.has_daily
        };
    });
    
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
                const tooltip = `
                    Date: ${formatDate(day.date)}<br>
                    ${day.hasTraining ? '✓ Training' : '✗ No Training'}<br>
                    ${day.hasDaily ? '✓ Daily Metrics' : '✗ No Daily Metrics'}
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
                    <small>None</small>
                </div>
                <div class="d-flex align-items-center me-3">
                    <span class="heatmap-legend-color heatmap-level-1 me-1"></span>
                    <small>Low</small>
                </div>
                <div class="d-flex align-items-center me-3">
                    <span class="heatmap-legend-color heatmap-level-2 me-1"></span>
                    <small>Medium</small>
                </div>
                <div class="d-flex align-items-center">
                    <span class="heatmap-legend-color heatmap-level-3 me-1"></span>
                    <small>High</small>
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
 * Load personal records for the PR modal
 */
function loadPersonalRecords() {
    const prList = document.getElementById('prList');
    
    // Show loading state
    prList.innerHTML = `
        <div class="text-center py-3">
            <div class="spinner-border text-warning" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;
    
    // Load unacknowledged PRs
    fetch('api/personal_records.php?action=get_records')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(result => {
            if (result.success) {
                renderPRList(result.data);
                
                // Set up event listener for the "Acknowledge All" button
                document.getElementById('acknowledgeAllBtn').addEventListener('click', function() {
                    acknowledgeAllPRs(result.data);
                });
            } else {
                prList.innerHTML = `
                    <div class="alert alert-danger">
                        <p>Failed to load personal records: ${result.message}</p>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            prList.innerHTML = `
                <div class="alert alert-danger">
                    <p>Error loading personal records. Please try again later.</p>
                </div>
            `;
        });
}

/**
 * Render the list of personal records in the PR modal
 * @param {Array} records Personal records data
 */
function renderPRList(records) {
    const prList = document.getElementById('prList');
    
    // Filter for unacknowledged PRs
    const unacknowledgedPRs = records.filter(record => !record.is_acknowledged);
    
    if (unacknowledgedPRs.length === 0) {
        prList.innerHTML = `
            <div class="alert alert-info">
                <p>No new personal records to acknowledge.</p>
            </div>
        `;
        document.getElementById('acknowledgeAllBtn').style.display = 'none';
        return;
    }
    
    let html = '';
    
    unacknowledgedPRs.forEach(record => {
        const recordType = formatRecordType(record.record_type);
        const recordValue = formatRecordValue(record.record_value, record.record_type);
        const dateStr = formatDate(record.date);
        
        html += `
            <div class="list-group-item list-group-item-warning" data-record-id="${record.id}">
                <div class="d-flex w-100 justify-content-between">
                    <h5 class="mb-1">${record.exercise_name}</h5>
                    <small>${dateStr}</small>
                </div>
                <p class="mb-1">
                    <span class="badge bg-success">${recordType}</span>
                    ${recordValue}
                </p>
                <div class="d-flex justify-content-between align-items-center mt-2">
                    <small>${record.muscle_group} | ${record.equipment}</small>
                    <button class="btn btn-sm btn-outline-success acknowledge-pr-btn" data-record-id="${record.id}">
                        <i class="fas fa-check"></i> Acknowledge
                    </button>
                </div>
            </div>
        `;
    });
    
    prList.innerHTML = html;
    
    // Add event listeners to acknowledge buttons
    document.querySelectorAll('.acknowledge-pr-btn').forEach(button => {
        button.addEventListener('click', function() {
            const recordId = this.getAttribute('data-record-id');
            acknowledgePR(recordId);
        });
    });
}

/**
 * Acknowledge a personal record
 * @param {string} recordId Personal record ID
 */
function acknowledgePR(recordId) {
    fetch('api/personal_records.php?action=acknowledge', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ record_id: recordId })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            // Remove the item from the list
            const item = document.querySelector(`.list-group-item[data-record-id="${recordId}"]`);
            if (item) {
                item.classList.remove('list-group-item-warning');
                item.classList.add('list-group-item-success');
                
                // Replace the acknowledge button with a success message
                const btnContainer = item.querySelector('.acknowledge-pr-btn').parentNode;
                btnContainer.innerHTML = '<span class="text-success"><i class="fas fa-check"></i> Acknowledged</span>';
            }
            
            // Check if any PRs remain
            const remainingPRs = document.querySelectorAll('.list-group-item-warning');
            if (remainingPRs.length === 0) {
                document.getElementById('acknowledgeAllBtn').style.display = 'none';
            }
            
            // Update PR count in UI
            updatePRCount();
        } else {
            alert('Failed to acknowledge record: ' + result.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error acknowledging record. Please try again.');
    });
}

/**
 * Acknowledge all personal records
 * @param {Array} records Personal records data
 */
function acknowledgeAllPRs(records) {
    const unacknowledgedPRs = records.filter(record => !record.is_acknowledged);
    
    if (unacknowledgedPRs.length === 0) {
        return;
    }
    
    // Show loading state
    const acknowledgeAllBtn = document.getElementById('acknowledgeAllBtn');
    acknowledgeAllBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    acknowledgeAllBtn.disabled = true;
    
    // Create promises for all acknowledgements
    const promises = unacknowledgedPRs.map(record => {
        return fetch('api/personal_records.php?action=acknowledge', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ record_id: record.id })
        }).then(response => response.json());
    });
    
    // Wait for all promises to resolve
    Promise.all(promises)
        .then(results => {
            // Check if all were successful
            const allSuccess = results.every(result => result.success);
            
            if (allSuccess) {
                // Update UI to show all PRs as acknowledged
                document.querySelectorAll('.list-group-item').forEach(item => {
                    item.classList.remove('list-group-item-warning');
                    item.classList.add('list-group-item-success');
                    
                    // Replace the acknowledge button with a success message
                    const btnContainer = item.querySelector('.acknowledge-pr-btn')?.parentNode;
                    if (btnContainer) {
                        btnContainer.innerHTML = '<span class="text-success"><i class="fas fa-check"></i> Acknowledged</span>';
                    }
                });
                
                // Hide the acknowledge all button
                acknowledgeAllBtn.style.display = 'none';
                
                // Update PR count in UI
                updatePRCount();
            } else {
                // Show error message
                alert('Some records could not be acknowledged. Please try again.');
                
                // Reset button state
                acknowledgeAllBtn.innerHTML = '<i class="fas fa-check"></i> Acknowledge All';
                acknowledgeAllBtn.disabled = false;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error acknowledging records. Please try again.');
            
            // Reset button state
            acknowledgeAllBtn.innerHTML = '<i class="fas fa-check"></i> Acknowledge All';
            acknowledgeAllBtn.disabled = false;
        });
}

/**
 * Update the PR count in the UI
 */
function updatePRCount() {
    fetch('api/personal_records.php?action=unacknowledged')
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                const count = result.count;
                
                // Update the PR badge or hide the button if no PRs remain
                const prBtn = document.getElementById('viewPRsBtn');
                if (prBtn) {
                    if (count > 0) {
                        const badge = prBtn.querySelector('.badge');
                        badge.textContent = count;
                    } else {
                        prBtn.style.display = 'none';
                    }
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
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
 * Format a date for display
 * @param {string} dateString Date string in YYYY-MM-DD format
 * @returns {string} Formatted date (e.g., "Jan 1, 2023")
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

// Handle window resize events to redraw charts
window.addEventListener('resize', function() {
    // Get all chart canvases
    const chartCanvases = document.querySelectorAll('.chart-container canvas');
    
    // If there are any charts rendered, give them a moment to adjust
    if (chartCanvases.length > 0) {
        // Add a small delay to let the DOM update
        setTimeout(function() {
            // Force Chart.js to resize all charts
            chartCanvases.forEach(canvas => {
                if (canvas.chart) {
                    canvas.chart.resize();
                }
            });
        }, 100);
    }
});

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
