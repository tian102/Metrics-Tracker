/**
 * Metrics Tracker - Visualization JavaScript
 * Handles the visualization of metrics data using Chart.js
 */

// Add this at the top of your file, after the DOMContentLoaded listener
window.addEventListener('unload', function() {
    // Cleanup all chart instances
    const charts = Object.values(Chart.instances);
    charts.forEach(chart => chart.destroy());
});

/**
 * Main function to process data and create charts
 * @param {Array} dailyMetrics - Array of daily metrics data
 * @param {Array} trainingSessions - Array of training sessions data
 * @param {Array} workoutDetails - Array of workout details data
 */
function processVisualizationData(dailyMetrics, trainingSessions, workoutDetails) {
    // Date range form handling
    document.getElementById('dateRangeForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (startDate && endDate) {
            window.location.href = `visualize.php?start_date=${startDate}&end_date=${endDate}`;
        }
    });
    
    try {
        // Daily Metrics Charts
        if (document.getElementById('weightProgressChart')) {
            createWeightProgressChart(dailyMetrics);
        }
        if (document.getElementById('sleepDurationChart')) {
            createSleepDurationChart(dailyMetrics);
        }
        if (document.getElementById('personalMetricsChart')) {
            createPersonalMetricsChart(dailyMetrics);
        }

        // Nutrition Charts
        if (document.getElementById('caloriesChart')) {
            createCaloriesChart(dailyMetrics);
        }
        if (document.getElementById('macronutrientsChart')) {
            createMacronutrientsChart(dailyMetrics);
        }
        if (document.getElementById('waterIntakeChart')) {
            createWaterIntakeChart(dailyMetrics);
        }

        // Training Charts
        if (document.getElementById('muscleGroupVolumeChart')) {
            createMuscleGroupVolumeChart(workoutDetails);
        }
        if (document.getElementById('exerciseProgressChartWrapper')) {
            setupExerciseProgressChart(workoutDetails);
        }
        if (document.getElementById('stimulusFatigueChart')) {
            createStimulusFatigueChart(workoutDetails);
        }
        if (document.getElementById('trainingDurationChart')) {
            createTrainingDurationChart(trainingSessions);
        }
    } catch (error) {
        console.error('Error initializing charts:', error);
    }
}

/**
 * Formats dates for displaying on charts
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {string} - Formatted date (e.g., "Jan 1")
 */
function formatChartDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Gets a color from the predefined chart color palette
 * @param {number} index - Index to get color for
 * @returns {string} - RGB color string
 */
function getChartColor(index) {
    const colors = [
        'rgb(54, 162, 235)', // Blue
        'rgb(255, 99, 132)', // Red
        'rgb(75, 192, 192)', // Green
        'rgb(255, 159, 64)', // Orange
        'rgb(153, 102, 255)', // Purple
        'rgb(255, 205, 86)', // Yellow
        'rgb(201, 203, 207)', // Grey
        'rgb(255, 99, 71)',   // Tomato
        'rgb(46, 139, 87)',   // SeaGreen
        'rgb(106, 90, 205)'   // SlateBlue
    ];
    
    return colors[index % colors.length];
}

/**
 * Creates a chart for sleep duration
 * @param {Array} dailyMetrics - Array of daily metrics data
 */
function createSleepDurationChart(dailyMetrics) {
    const canvas = document.getElementById('sleepDurationChart');
    if (!canvas) {
        console.error('Sleep Duration Chart canvas not found');
        return;
    }

    const ctx = canvas.getContext('2d');
    
    // Process sleep data
    const labels = [];
    const sleepDurations = [];
    
    // Sort by date
    dailyMetrics.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    dailyMetrics.forEach(day => {
        if (day.sleep_start && day.sleep_end) {
            const start = new Date(day.sleep_start);
            const end = new Date(day.sleep_end);
            const durationHours = (end - start) / (1000 * 60 * 60);
            
            labels.push(formatChartDate(day.date));
            sleepDurations.push(durationHours.toFixed(1));
        }
    });
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sleep Duration (hours)',
                data: sleepDurations,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Hours'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            return 'Date: ' + dailyMetrics[tooltipItems[0].dataIndex].date;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Creates a chart for weight progress
 * @param {Array} dailyMetrics - Array of daily metrics data
 */
function createWeightProgressChart(dailyMetrics) {
    const canvas = document.getElementById('weightProgressChart');
    if (!canvas) {
        console.error('Weight Progress Chart canvas not found');
        return;
    }

    const ctx = canvas.getContext('2d');
    
    // Process weight data
    const labels = [];
    const weights = [];
    
    // Sort by date
    dailyMetrics.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    dailyMetrics.forEach(day => {
        if (day.weight) {
            labels.push(formatChartDate(day.date));
            weights.push(day.weight);
        }
    });
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Weight (kg)',
                data: weights,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                tension: 0.1,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Weight (kg)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            return 'Date: ' + dailyMetrics.filter(d => d.weight)[tooltipItems[0].dataIndex].date;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Creates a chart for personal metrics (stress, energy, motivation)
 * @param {Array} dailyMetrics - Array of daily metrics data
 */
function createPersonalMetricsChart(dailyMetrics) {
    const canvas = document.getElementById('personalMetricsChart');
    if (!canvas) {
        console.error('Personal Metrics Chart canvas not found');
        return;
    }

    const ctx = canvas.getContext('2d');
    
    // Process personal metrics data
    const labels = [];
    const stressLevels = [];
    const energyLevels = [];
    const motivationLevels = [];
    
    // Filter metrics that have at least one of the required values
    const filteredMetrics = dailyMetrics.filter(day => 
        day.stress_level !== null || day.energy_level !== null || day.motivation_level !== null
    );
    
    // Sort by date
    filteredMetrics.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    filteredMetrics.forEach(day => {
        labels.push(formatChartDate(day.date));
        stressLevels.push(day.stress_level !== null ? parseInt(day.stress_level) : null);
        energyLevels.push(day.energy_level !== null ? parseInt(day.energy_level) : null);
        motivationLevels.push(day.motivation_level !== null ? parseInt(day.motivation_level) : null);
    });
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Stress',
                    data: stressLevels,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2,
                    tension: 0.1
                },
                {
                    label: 'Energy',
                    data: energyLevels,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                    tension: 0.1
                },
                {
                    label: 'Motivation',
                    data: motivationLevels,
                    backgroundColor: 'rgba(255, 206, 86, 0.2)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 2,
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    title: {
                        display: true,
                        text: 'Level (1-10)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            return 'Date: ' + dailyMetrics[tooltipItems[0].dataIndex].date;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Creates a chart for calorie intake
 * @param {Array} dailyMetrics - Array of daily metrics data
 */
function createCaloriesChart(dailyMetrics) {
    const canvas = document.getElementById('caloriesChart');
    if (!canvas) {
        console.error('Calories Chart canvas not found');
        return;
    }

    const ctx = canvas.getContext('2d');
    
    // Process calories data
    const labels = [];
    const calories = [];
    
    // Sort by date
    dailyMetrics.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    dailyMetrics.forEach(day => {
        if (day.calories) {
            labels.push(formatChartDate(day.date));
            calories.push(day.calories);
        }
    });
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Calories',
                data: calories,
                backgroundColor: 'rgba(255, 159, 64, 0.7)',
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Calories (kcal)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            return 'Date: ' + dailyMetrics[tooltipItems[0].dataIndex].date;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Creates a chart for macronutrients
 * @param {Array} dailyMetrics - Array of daily metrics data
 */
function createMacronutrientsChart(dailyMetrics) {
    const canvas = document.getElementById('macronutrientsChart');
    if (!canvas) {
        console.error('Macronutrients Chart canvas not found');
        return;
    }

    const ctx = canvas.getContext('2d');
    
    // Process macronutrients data
    const labels = [];
    const proteins = [];
    const carbs = [];
    const fats = [];
    
    // Sort by date
    dailyMetrics.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    dailyMetrics.forEach(day => {
        if (day.protein || day.carbs || day.fats) {
            labels.push(formatChartDate(day.date));
            proteins.push(day.protein || 0);
            carbs.push(day.carbs || 0);
            fats.push(day.fats || 0);
        }
    });
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Protein (g)',
                    data: proteins,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Carbs (g)',
                    data: carbs,
                    backgroundColor: 'rgba(255, 206, 86, 0.7)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Fats (g)',
                    data: fats,
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
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Grams (g)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                }
            }
        }
    });
}

/**
 * Creates a chart for water intake
 * @param {Array} dailyMetrics - Array of daily metrics data
 */
function createWaterIntakeChart(dailyMetrics) {
    const canvas = document.getElementById('waterIntakeChart');
    if (!canvas) {
        console.error('Water Intake Chart canvas not found');
        return;
    }

    const ctx = canvas.getContext('2d');
    
    // Process water intake data
    const labels = [];
    const waterIntakes = [];
    
    // Sort by date
    dailyMetrics.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    dailyMetrics.forEach(day => {
        if (day.water_intake) {
            labels.push(formatChartDate(day.date));
            waterIntakes.push(day.water_intake);
        }
    });
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Water Intake (liters)',
                data: waterIntakes,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Liters'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                }
            }
        }
    });
}

/**
 * Creates a chart for training volume by muscle group
 * @param {Array} workoutDetails - Array of workout details data
 */
function createMuscleGroupVolumeChart(workoutDetails) {
    const ctx = document.getElementById('muscleGroupVolumeChart').getContext('2d');
    
    // Process muscle group volume data
    const muscleGroups = {};
    
    workoutDetails.forEach(workout => {
        if (workout.muscle_group && workout.sets && workout.reps) {
            const muscleGroup = workout.muscle_group;
            const volume = workout.sets * workout.reps * (workout.load_weight || 1);
            
            if (muscleGroups[muscleGroup]) {
                muscleGroups[muscleGroup] += volume;
            } else {
                muscleGroups[muscleGroup] = volume;
            }
        }
    });
    
    const labels = Object.keys(muscleGroups);
    const data = Object.values(muscleGroups);
    const backgroundColors = labels.map((_, i) => getChartColor(i));
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Training Volume',
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + Math.round(context.raw) + ' units';
                        }
                    }
                }
            }
        }
    });
}

/**
 * Sets up the exercise progress chart with selector
 * @param {Array} workoutDetails - Array of workout details data
 */
function setupExerciseProgressChart(workoutDetails) {
    const exerciseSelector = document.getElementById('exerciseSelector');
    const chartContainer = document.getElementById('exerciseProgressChartWrapper');
    let currentChart = null;

    // Add hidden input to form
    const dateRangeForm = document.getElementById('dateRangeForm');
    let exerciseInput = dateRangeForm.querySelector('input[name="selected_exercise"]');
    if (!exerciseInput) {
        exerciseInput = document.createElement('input');
        exerciseInput.type = 'hidden';
        exerciseInput.name = 'selected_exercise';
        dateRangeForm.appendChild(exerciseInput);
    }

    // Function to safely destroy and recreate canvas
    function resetChart() {
        // Destroy any existing chart
        if (currentChart) {
            currentChart.destroy();
        }
        
        // Remove and recreate canvas
        const chartContainer = document.getElementById('exerciseProgressChartWrapper');
        if (!chartContainer) {
            console.error('Chart container not found');
            return null;
        }
        
        // Clear existing canvas
        chartContainer.innerHTML = '';
        
        // Create new canvas
        const newCanvas = document.createElement('canvas');
        newCanvas.id = 'exerciseProgressChart';
        chartContainer.appendChild(newCanvas);
        
        return newCanvas;
    }

    // Initial setup
    if (exerciseSelector.value) {
        const canvas = resetChart();
        currentChart = createExerciseProgressChart(workoutDetails, exerciseSelector.value, canvas);
    }

    // Handle exercise selection changes
    exerciseSelector.addEventListener('change', function() {
        exerciseInput.value = this.value;
        
        const selectedExercise = this.value;
        if (selectedExercise) {
            const canvas = resetChart();
            currentChart = createExerciseProgressChart(workoutDetails, selectedExercise, canvas);
        }
    });
    
    // Check for pre-selected exercise from URL
    const urlParams = new URLSearchParams(window.location.search);
    const preSelectedExercise = urlParams.get('selected_exercise');
    
    if (preSelectedExercise) {
        exerciseSelector.value = preSelectedExercise;
        exerciseInput.value = preSelectedExercise;
        
        // Trigger chart creation
        if (exerciseSelector.value) {
            const canvas = resetChart();
            currentChart = createExerciseProgressChart(workoutDetails, exerciseSelector.value, canvas);
        }
    } else if (exerciseSelector.value) {
        // Default behavior
        exerciseInput.value = exerciseSelector.value;
        const canvas = resetChart();
        currentChart = createExerciseProgressChart(workoutDetails, exerciseSelector.value, canvas);
    }
}

/**
 * Creates a chart for an exercise's progress
 * @param {Array} workoutDetails - Array of workout details data
 * @param {string} exerciseName - Name of the exercise to display
 * @param {HTMLCanvasElement} canvas - Canvas element to render the chart on
 * @returns {Chart} The newly created chart instance
 */
function createExerciseProgressChart(workoutDetails, exerciseName, canvas) {
    // Process exercise progress data
    const exerciseData = workoutDetails.filter(workout => workout.exercise_name === exerciseName);
    
    // Sort by date
    exerciseData.sort((a, b) => new Date(a.session_date) - new Date(b.session_date));
    
    const labels = [];
    const weights = [];
    const volumes = []; // sets * reps * weight
    
    exerciseData.forEach(workout => {
        labels.push(formatChartDate(workout.session_date));
        weights.push(workout.load_weight || 0);
        volumes.push((workout.sets || 0) * (workout.reps || 0) * (workout.load_weight || 1));
    });
    
    return new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Weight (kg)',
                    data: weights,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2,
                    tension: 0.1,
                    yAxisID: 'y'
                },
                {
                    label: 'Volume (sets × reps × weight)',
                    data: volumes,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                    tension: 0.1,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Weight (kg)'
                    }
                },
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false
                    },
                    title: {
                        display: true,
                        text: 'Volume'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Progress for ' + exerciseName
                },
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

/**
 * Creates a chart for stimulus and fatigue
 * @param {Array} workoutDetails - Array of workout details data
 */
function createStimulusFatigueChart(workoutDetails) {
    const ctx = document.getElementById('stimulusFatigueChart').getContext('2d');
    
    // Process by date and calculate averages
    const dateData = {};
    
    workoutDetails.forEach(workout => {
        const date = workout.session_date;
        
        if (!dateData[date]) {
            dateData[date] = {
                stimulusSum: 0,
                fatigueSum: 0,
                count: 0
            };
        }
        
        if (workout.stimulus) dateData[date].stimulusSum += parseInt(workout.stimulus);
        if (workout.fatigue_level) dateData[date].fatigueSum += parseInt(workout.fatigue_level);
        dateData[date].count++;
    });
    
    // Calculate averages and prepare data for chart
    const dates = Object.keys(dateData).sort((a, b) => new Date(a) - new Date(b));
    const stimulusAvgs = [];
    const fatigueAvgs = [];
    
    dates.forEach(date => {
        const data = dateData[date];
        stimulusAvgs.push(data.count > 0 ? data.stimulusSum / data.count : 0);
        fatigueAvgs.push(data.count > 0 ? data.fatigueSum / data.count : 0);
    });
    
    // Format dates for display
    const formattedDates = dates.map(date => formatChartDate(date));
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: formattedDates,
            datasets: [
                {
                    label: 'Avg. Stimulus',
                    data: stimulusAvgs,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    tension: 0.1
                },
                {
                    label: 'Avg. Fatigue',
                    data: fatigueAvgs,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2,
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    title: {
                        display: true,
                        text: 'Level (1-10)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                }
            }
        }
    });
}

/**
 * Creates a chart for training duration
 * @param {Array} trainingSessions - Array of training sessions data
 */
function createTrainingDurationChart(trainingSessions) {
    const ctx = document.getElementById('trainingDurationChart').getContext('2d');
    
    // Process training duration data
    const labels = [];
    const durations = [];
    
    // Sort by date
    trainingSessions.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    trainingSessions.forEach(session => {
        if (session.training_start && session.training_end) {
            const start = new Date(session.training_start);
            const end = new Date(session.training_end);
            const durationMinutes = (end - start) / (1000 * 60);
            
            labels.push(formatChartDate(session.date));
            durations.push(durationMinutes);
        }
    });
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Training Duration (minutes)',
                data: durations,
                backgroundColor: 'rgba(153, 102, 255, 0.7)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Minutes'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                }
            }
        }
    });
}