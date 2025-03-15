/**
 * Correlations JavaScript
 * Handles functionality for the correlation analysis page
 */

document.addEventListener('DOMContentLoaded', function() {
    // Load metrics for dropdown options
    loadMetrics();
    
    // Load recent insights
    loadRecentInsights();
    
    // Event listeners
    document.getElementById('analyzeNewBtn').addEventListener('click', function() {
        document.getElementById('correlationAnalyzer').style.display = 'block';
        document.getElementById('analyzeNewBtn').style.display = 'none';
    });
    
    document.getElementById('cancelAnalysisBtn').addEventListener('click', function() {
        document.getElementById('correlationAnalyzer').style.display = 'none';
        document.getElementById('analyzeNewBtn').style.display = 'inline-block';
    });
    
    document.getElementById('correlationForm').addEventListener('submit', function(e) {
        e.preventDefault();
        analyzeCorrelation();
    });
    
    // Quick analyze buttons
    document.querySelectorAll('.quick-analyze-btn').forEach(button => {
        button.addEventListener('click', function() {
            const primaryMetric = this.getAttribute('data-primary');
            const secondaryMetric = this.getAttribute('data-secondary');
            
            // Auto-select the metrics in the form
            document.getElementById('primaryMetric').value = primaryMetric;
            document.getElementById('secondaryMetric').value = secondaryMetric;
            
            // Show the form
            document.getElementById('correlationAnalyzer').style.display = 'block';
            document.getElementById('analyzeNewBtn').style.display = 'none';
            
            // Optionally, you could auto-submit the form here
            // analyzeCorrelation();
        });
    });
});

/**
 * Load metrics for the dropdown menus
 */
function loadMetrics() {
    fetch('api/correlations.php?action=metrics')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(result => {
            if (result.success) {
                const metrics = result.data;
                const primarySelect = document.getElementById('primaryMetric');
                const secondarySelect = document.getElementById('secondaryMetric');
                
                // Group metrics by category
                const dailyMetrics = metrics.filter(metric => metric.category === 'daily');
                const trainingMetrics = metrics.filter(metric => metric.category === 'training');
                
                // Clear existing options
                primarySelect.innerHTML = '<option value="">Select Primary Metric</option>';
                secondarySelect.innerHTML = '<option value="">Select Secondary Metric</option>';
                
                // Add daily metrics group
                if (dailyMetrics.length > 0) {
                    const dailyGroup = document.createElement('optgroup');
                    dailyGroup.label = 'Daily Metrics';
                    
                    dailyMetrics.forEach(metric => {
                        const option = document.createElement('option');
                        option.value = metric.id;
                        option.textContent = metric.name;
                        option.title = metric.description;
                        dailyGroup.appendChild(option);
                    });
                    
                    primarySelect.appendChild(dailyGroup.cloneNode(true));
                    secondarySelect.appendChild(dailyGroup.cloneNode(true));
                }
                
                // Add training metrics group
                if (trainingMetrics.length > 0) {
                    const trainingGroup = document.createElement('optgroup');
                    trainingGroup.label = 'Training Metrics';
                    
                    trainingMetrics.forEach(metric => {
                        const option = document.createElement('option');
                        option.value = metric.id;
                        option.textContent = metric.name;
                        option.title = metric.description;
                        trainingGroup.appendChild(option);
                    });
                    
                    primarySelect.appendChild(trainingGroup.cloneNode(true));
                    secondarySelect.appendChild(trainingGroup.cloneNode(true));
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

/**
 * Load recent correlation insights
 */
function loadRecentInsights() {
    fetch('api/correlations.php?action=insights')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(result => {
            if (result.success) {
                const insights = result.data;
                const container = document.getElementById('recentInsights');
                
                if (insights.length > 0) {
                    // Display recent insights
                    let html = '<div class="list-group">';
                    
                    insights.slice(0, 5).forEach(insight => {
                        const correlationClass = getCorrelationClass(insight.correlation_value, insight.correlation_strength);
                        
                        html += `
                        <a href="#" class="list-group-item list-group-item-action insight-item" 
                           data-insight-id="${insight.id}" 
                           data-primary="${insight.primary_metric}" 
                           data-secondary="${insight.secondary_metric}">
                            <div class="d-flex w-100 justify-content-between">
                                <h5 class="mb-1">${getMetricName(insight.primary_metric)} & ${getMetricName(insight.secondary_metric)}</h5>
                                <small class="text-${correlationClass}">
                                    <span class="correlation-badge">r = ${insight.correlation_value}</span>
                                </small>
                            </div>
                            <p class="mb-1">${insight.insight_text}</p>
                            <small>Based on data from ${formatDate(insight.first_date)} to ${formatDate(insight.last_date)}</small>
                        </a>
                        `;
                    });
                    
                    html += '</div>';
                    container.innerHTML = html;
                    
                    // Make the first insight the featured one
                    if (insights.length > 0) {
                        displayFeaturedCorrelation(insights[0]);
                    }
                    
                    // Add event listeners to insight items
                    document.querySelectorAll('.insight-item').forEach(item => {
                        item.addEventListener('click', function(e) {
                            e.preventDefault();
                            
                            // Find the insight by ID
                            const insightId = this.getAttribute('data-insight-id');
                            const insight = insights.find(i => i.id == insightId);
                            
                            if (insight) {
                                displayFeaturedCorrelation(insight);
                            }
                        });
                    });
                } else {
                    // No insights yet
                    container.innerHTML = `
                    <div class="alert alert-info">
                        <p>You don't have any correlation insights yet. Try analyzing the relationship between two metrics.</p>
                        <button id="startFirstAnalysisBtn" class="btn btn-primary">Start Your First Analysis</button>
                    </div>
                    `;
                    
                    // Event listener for the start first analysis button
                    document.getElementById('startFirstAnalysisBtn').addEventListener('click', function() {
                        document.getElementById('correlationAnalyzer').style.display = 'block';
                        document.getElementById('analyzeNewBtn').style.display = 'none';
                    });
                    
                    // Empty featured correlation as well
                    document.getElementById('featuredCorrelation').innerHTML = `
                    <div class="alert alert-info">
                        <p>Complete your first correlation analysis to see insights here.</p>
                    </div>
                    `;
                }
            } else {
                document.getElementById('recentInsights').innerHTML = 
                    '<div class="alert alert-danger">Failed to load insights</div>';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('recentInsights').innerHTML = 
                '<div class="alert alert-danger">Error loading insights</div>';
        });
}

/**
 * Analyze correlation between selected metrics
 */
function analyzeCorrelation() {
    const primaryMetric = document.getElementById('primaryMetric').value;
    const secondaryMetric = document.getElementById('secondaryMetric').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    // Validate inputs
    if (!primaryMetric || !secondaryMetric) {
        alert('Please select both primary and secondary metrics');
        return;
    }
    
    if (primaryMetric === secondaryMetric) {
        alert('Please select different metrics for comparison');
        return;
    }
    
    if (!startDate || !endDate) {
        alert('Please select a date range');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        alert('Start date must be before end date');
        return;
    }
    
    // Show analysis results section
    document.getElementById('analysisResults').style.display = 'block';
    document.getElementById('analysisResults').scrollIntoView({ behavior: 'smooth' });
    
    // Show loading state
    document.getElementById('analysisResults').querySelector('.card-body').innerHTML = `
    <div class="d-flex justify-content-center">
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    </div>
    `;
    
    // Build URL with query parameters
    let url = 'api/correlations.php?action=analyze';
    url += '&primary_metric=' + encodeURIComponent(primaryMetric);
    url += '&secondary_metric=' + encodeURIComponent(secondaryMetric);
    url += '&start_date=' + encodeURIComponent(startDate);
    url += '&end_date=' + encodeURIComponent(endDate);
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(result => {
            if (result.success) {
                displayAnalysisResults(result.data, primaryMetric, secondaryMetric);
                
                // Reload insights after analysis
                loadRecentInsights();
            } else {
                document.getElementById('analysisResults').querySelector('.card-body').innerHTML = `
                <div class="alert alert-warning">
                    <h4>Analysis Not Possible</h4>
                    <p>${result.message}</p>
                    <p>Try selecting a different date range or different metrics.</p>
                </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('analysisResults').querySelector('.card-body').innerHTML = `
            <div class="alert alert-danger">
                <h4>Error</h4>
                <p>An error occurred while analyzing the correlation. Please try again later.</p>
            </div>
            `;
        });
}

/**
 * Display correlation analysis results
 * @param {Object} data Analysis results data
 * @param {string} primaryMetric Primary metric ID
 * @param {string} secondaryMetric Secondary metric ID
 */
function displayAnalysisResults(data, primaryMetric, secondaryMetric) {
    const correlationClass = getCorrelationClass(data.correlation, data.correlation_strength);
    const correlationDescription = getCorrelationDescription(data.correlation, data.correlation_strength, data.direction);
    
    // Create HTML for the results
    let html = `
    <div class="row">
        <div class="col-md-8">
            <h4>Correlation: ${getMetricName(primaryMetric)} vs. ${getMetricName(secondaryMetric)}</h4>
            <div class="correlation-result mb-4">
                <span class="correlation-value text-${correlationClass}">r = ${data.correlation}</span>
                <span class="correlation-label ms-2">${correlationDescription}</span>
            </div>
            
            <div class="analysis-insight mb-4">
                <h5>Insight</h5>
                <p>${data.insight}</p>
                <small class="text-muted">
                    Based on ${data.data_points} data points from ${formatDate(data.date_range.start)} to ${formatDate(data.date_range.end)}
                </small>
            </div>
            
            <div class="what-this-means mb-4">
                <h5>What This Means</h5>
                <p>${getCorrelationExplanation(data.correlation, data.correlation_strength, data.direction, primaryMetric, secondaryMetric)}</p>
            </div>
            
            <div class="action-items">
                <h5>Action Items</h5>
                <ul>
                    ${getActionItems(data.correlation, data.correlation_strength, data.direction, primaryMetric, secondaryMetric).map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
        </div>
        
        <div class="col-md-4">
            <div class="correlation-visualization mb-4">
                <div class="correlation-gauge">
                    ${createCorrelationGauge(data.correlation)}
                </div>
            </div>
            
            <div class="correlation-strength-card card border-${correlationClass} mb-4">
                <div class="card-body text-center">
                    <h6 class="card-title">Correlation Strength</h6>
                    <p class="card-text h3">${data.correlation_strength.charAt(0).toUpperCase() + data.correlation_strength.slice(1)}</p>
                    <p class="card-text text-muted">${data.direction.charAt(0).toUpperCase() + data.direction.slice(1)} Relationship</p>
                </div>
            </div>
        </div>
    </div>
    `;
    
    document.getElementById('analysisResults').querySelector('.card-body').innerHTML = html;
}

/**
 * Display a featured correlation insight
 * @param {Object} insight Correlation insight data
 */
function displayFeaturedCorrelation(insight) {
    const correlationClass = getCorrelationClass(insight.correlation_value, insight.correlation_strength);
    const correlationDescription = getCorrelationDescription(insight.correlation_value, insight.correlation_strength, insight.direction);
    
    // Create HTML for the featured correlation
    let html = `
    <div class="featured-correlation">
        <h4>${getMetricName(insight.primary_metric)} & ${getMetricName(insight.secondary_metric)}</h4>
        
        <div class="correlation-result mb-3">
            <span class="correlation-value text-${correlationClass}">r = ${insight.correlation_value}</span>
            <span class="correlation-label ms-2">${correlationDescription}</span>
        </div>
        
        <p class="mb-3">${insight.insight_text}</p>
        
        <div class="correlation-visualization mb-3">
            <div class="correlation-gauge">
                ${createCorrelationGauge(insight.correlation_value)}
            </div>
        </div>
        
        <div class="d-flex justify-content-between align-items-center">
            <small class="text-muted">
                Based on data from ${formatDate(insight.first_date)} to ${formatDate(insight.last_date)}
            </small>
            
            <button class="btn btn-sm btn-outline-primary analyze-again-btn"
                    data-primary="${insight.primary_metric}" 
                    data-secondary="${insight.secondary_metric}">
                Analyze Again
            </button>
        </div>
    </div>
    `;
    
    document.getElementById('featuredCorrelation').innerHTML = html;
    
    // Add event listener to the analyze again button
    document.querySelector('.analyze-again-btn').addEventListener('click', function() {
        const primaryMetric = this.getAttribute('data-primary');
        const secondaryMetric = this.getAttribute('data-secondary');
        
        // Auto-select the metrics in the form
        document.getElementById('primaryMetric').value = primaryMetric;
        document.getElementById('secondaryMetric').value = secondaryMetric;
        
        // Show the form
        document.getElementById('correlationAnalyzer').style.display = 'block';
        document.getElementById('analyzeNewBtn').style.display = 'none';
        
        // Scroll to the form
        document.getElementById('correlationAnalyzer').scrollIntoView({ behavior: 'smooth' });
    });
}

/**
 * Create a correlation gauge visualization
 * @param {number} correlation Correlation coefficient (-1 to 1)
 * @returns {string} HTML for the gauge
 */
function createCorrelationGauge(correlation) {
    // Convert correlation (-1 to 1) to a percentage (0 to 100)
    const percentage = (correlation + 1) * 50;
    
    // Determine the color based on correlation strength
    let color;
    if (correlation >= 0.7) color = 'success';
    else if (correlation >= 0.4) color = 'primary';
    else if (correlation >= 0) color = 'info';
    else if (correlation >= -0.4) color = 'warning';
    else color = 'danger';
    
    // Create the gauge HTML
    return `
    <div class="gauge-container">
        <div class="gauge">
            <div class="gauge-backdrop"></div>
            <div class="gauge-needle" style="transform: rotate(${percentage * 1.8 - 90}deg);"></div>
            <div class="gauge-label text-${color}">
                <span class="value">${correlation}</span>
            </div>
        </div>
        <div class="gauge-ticks">
            <div class="gauge-tick-neg-1">-1</div>
            <div class="gauge-tick-neg-05">-0.5</div>
            <div class="gauge-tick-0">0</div>
            <div class="gauge-tick-05">0.5</div>
            <div class="gauge-tick-1">1</div>
        </div>
    </div>
    `;
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
 * Get a description for the correlation
 * @param {number} correlation Correlation coefficient
 * @param {string} strength Correlation strength
 * @param {string} direction Correlation direction
 * @returns {string} Description text
 */
function getCorrelationDescription(correlation, strength, direction) {
    if (Math.abs(correlation) < 0.2) {
        return 'No meaningful correlation';
    }
    
    return `${strength.charAt(0).toUpperCase() + strength.slice(1)} ${direction} correlation`;
}

/**
 * Get a detailed explanation of what the correlation means
 * @param {number} correlation Correlation coefficient
 * @param {string} strength Correlation strength
 * @param {string} direction Correlation direction
 * @param {string} primaryMetric Primary metric ID
 * @param {string} secondaryMetric Secondary metric ID
 * @returns {string} Explanation text
 */
function getCorrelationExplanation(correlation, strength, direction, primaryMetric, secondaryMetric) {
    const primaryName = getMetricName(primaryMetric);
    const secondaryName = getMetricName(secondaryMetric);
    
    if (Math.abs(correlation) < 0.2) {
        return `There doesn't seem to be a meaningful relationship between your ${primaryName.toLowerCase()} and ${secondaryName.toLowerCase()}. One doesn't significantly affect the other based on your current data.`;
    }
    
    if (direction === 'positive') {
        if (strength === 'strong') {
            return `As your ${primaryName.toLowerCase()} increases, your ${secondaryName.toLowerCase()} strongly tends to increase as well. This indicates a reliable connection between these two metrics in your data.`;
        } else if (strength === 'moderate') {
            return `As your ${primaryName.toLowerCase()} increases, your ${secondaryName.toLowerCase()} moderately tends to increase as well. There's a notable pattern, but other factors may also play a role.`;
        } else {
            return `As your ${primaryName.toLowerCase()} increases, your ${secondaryName.toLowerCase()} slightly tends to increase as well. The pattern is present but weak, suggesting many other factors are involved.`;
        }
    } else {
        if (strength === 'strong') {
            return `As your ${primaryName.toLowerCase()} increases, your ${secondaryName.toLowerCase()} strongly tends to decrease. This indicates a reliable inverse connection between these two metrics in your data.`;
        } else if (strength === 'moderate') {
            return `As your ${primaryName.toLowerCase()} increases, your ${secondaryName.toLowerCase()} moderately tends to decrease. There's a notable inverse pattern, but other factors may also play a role.`;
        } else {
            return `As your ${primaryName.toLowerCase()} increases, your ${secondaryName.toLowerCase()} slightly tends to decrease. The inverse pattern is present but weak, suggesting many other factors are involved.`;
        }
    }
}

/**
 * Get action items based on correlation
 * @param {number} correlation Correlation coefficient
 * @param {string} strength Correlation strength
 * @param {string} direction Correlation direction
 * @param {string} primaryMetric Primary metric ID
 * @param {string} secondaryMetric Secondary metric ID
 * @returns {array} Array of action item strings
 */
function getActionItems(correlation, strength, direction, primaryMetric, secondaryMetric) {
    const primaryName = getMetricName(primaryMetric);
    const secondaryName = getMetricName(secondaryMetric);
    
    if (Math.abs(correlation) < 0.2) {
        return [
            `Continue tracking both ${primaryName.toLowerCase()} and ${secondaryName.toLowerCase()} to see if patterns emerge with more data.`,
            `Consider analyzing other factors that might affect your ${secondaryName.toLowerCase()}.`
        ];
    }
    
    const items = [];
    
    // Handle specific metric combinations
    if (primaryMetric === 'sleep_duration' && secondaryMetric === 'training_volume' && direction === 'positive') {
        items.push(`Prioritize getting adequate sleep before heavy training sessions.`);
        items.push(`Consider scheduling your most important workouts after nights when you typically sleep well.`);
    } else if (primaryMetric === 'stress_level' && secondaryMetric === 'energy_level' && direction === 'negative') {
        items.push(`Implement stress reduction strategies to potentially improve your energy levels.`);
        items.push(`Consider tracking specific stressors to identify what most impacts your energy.`);
    } else if (primaryMetric === 'protein' && secondaryMetric === 'fatigue_rating' && direction === 'negative') {
        items.push(`Consider maintaining or increasing your protein intake to potentially improve recovery.`);
        items.push(`Track your protein intake timing relative to workouts to optimize benefits.`);
    } else {
        // Generic action items based on correlation strength and direction
        if (direction === 'positive' && strength !== 'weak') {
            items.push(`Consider optimizing your ${primaryName.toLowerCase()} to potentially improve your ${secondaryName.toLowerCase()}.`);
        } else if (direction === 'negative' && strength !== 'weak') {
            if (isPrimaryMetricNegative(primaryMetric)) {
                items.push(`Consider reducing your ${primaryName.toLowerCase()} to potentially improve your ${secondaryName.toLowerCase()}.`);
            } else {
                items.push(`Be aware that increasing your ${primaryName.toLowerCase()} might negatively impact your ${secondaryName.toLowerCase()}.`);
            }
        }
    }
    
    // Add general action items
    if (strength === 'strong' || strength === 'moderate') {
        items.push(`Continue current tracking to maintain awareness of this relationship.`);
    } else {
        items.push(`Collect more data to confirm if this pattern strengthens over time.`);
    }
    
    return items;
}

/**
 * Check if a metric is something that's typically negative (like stress)
 * @param {string} metric Metric ID
 * @returns {boolean} True if the metric is typically negative
 */
function isPrimaryMetricNegative(metric) {
    const negativeMetrics = ['stress_level', 'fatigue_rating'];
    return negativeMetrics.includes(metric);
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
 * Format a date for display
 * @param {string} dateString Date string in YYYY-MM-DD format
 * @returns {string} Formatted date (e.g., "Jan 1, 2023")
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Add CSS for the gauge visualization
document.head.insertAdjacentHTML('beforeend', `
<style>
    .correlation-value {
        font-size: 1.5rem;
        font-weight: bold;
    }
    
    .correlation-badge {
        font-weight: bold;
    }
    
    .gauge-container {
        width: 100%;
        max-width: 200px;
        margin: 0 auto;
    }
    
    .gauge {
        position: relative;
        height: 100px;
        width: 200px;
        margin: 0 auto;
    }
    
    .gauge-backdrop {
        position: absolute;
        width: 200px;
        height: 100px;
        top: 0;
        border-radius: 100px 100px 0 0;
        background: linear-gradient(90deg, 
            #dc3545 0%, 
            #ffc107 25%, 
            #0dcaf0 50%, 
            #0d6efd 75%, 
            #198754 100%
        );
        overflow: hidden;
    }
    
    .gauge-needle {
        position: absolute;
        width: 4px;
        height: 100px;
        background-color: #212529;
        top: 0;
        left: 98px;
        transform-origin: bottom center;
        transform: rotate(0deg);
        transition: transform 1s ease-out;
    }
    
    .gauge-label {
        position: absolute;
        width: 200px;
        bottom: -20px;
        text-align: center;
        font-weight: bold;
    }
    
    .gauge-ticks {
        position: relative;
        width: 200px;
        margin: 10px auto 0;
        font-size: 0.8rem;
        display: flex;
        justify-content: space-between;
    }
</style>
`);