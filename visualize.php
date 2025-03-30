<?php
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
?>

<?php
require_once 'includes/header.php';
require_once 'includes/functions.php';
require_once 'includes/user_functions.php';

// Redirect if not logged in
requireLogin();

// Ensure we're using the correct user ID from the session
$userId = $_SESSION['user_id'];

// Get date range for filters - default to last 30 days
$endDate = date('Y-m-d');
$startDate = isset($_GET['start_date']) ? $_GET['start_date'] : date('Y-m-d', strtotime('-30 days'));
$endDate = isset($_GET['end_date']) ? $_GET['end_date'] : $endDate;

// Get data for the selected period - make sure we're getting current user's data
$db = new Database();

// Get daily metrics data
$db->query("SELECT * FROM daily_metrics WHERE user_id = :user_id AND date BETWEEN :start_date AND :end_date ORDER BY date");
$db->bind(':user_id', $userId);
$db->bind(':start_date', $startDate);
$db->bind(':end_date', $endDate);
$dailyMetrics = $db->resultSet();

// Get training sessions data
$db->query("SELECT * FROM training_sessions WHERE user_id = :user_id AND date BETWEEN :start_date AND :end_date ORDER BY date DESC");
$db->bind(':user_id', $userId);
$db->bind(':start_date', $startDate);
$db->bind(':end_date', $endDate);
$trainingSessions = $db->resultSet();

// Get active tab from request if available
$activeTab = isset($_GET['active_tab']) ? $_GET['active_tab'] : 'daily-metrics-tab';

// Tab IDs should match what's in your HTML - adjust if necessary
$validTabIds = ['daily-metrics-tab', 'nutrition-tab', 'training-tab']; 

// Validate active tab ID to prevent XSS
if (!in_array($activeTab, $validTabIds)) {
    $activeTab = 'daily-metrics-tab'; // Default to first tab if invalid
}

// Process training sessions to get workout details
$workoutDetails = [];
foreach ($trainingSessions as $session) {
    // Get workout details using direct DB query to ensure we get right user's data
    $db->query("SELECT wd.*, ts.date as session_date, ts.mesocycle_name 
                FROM workout_details wd 
                JOIN training_sessions ts ON wd.session_id = ts.id 
                WHERE wd.session_id = :session_id AND ts.user_id = :user_id");
    $db->bind(':session_id', $session['id']);
    $db->bind(':user_id', $userId);
    $sessionWorkouts = $db->resultSet();
    
    foreach ($sessionWorkouts as $workout) {
        $workoutDetails[] = $workout;
    }
}
?>

<div class="row">
    <div class="col-12">
        <div class="card shadow-sm mb-4">
            <div class="card-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
                <h2 class="mb-2 mb-md-0">Data Visualization</h2>
                
                <!-- Date filter form -->
                <div class="d-flex flex-wrap gap-2">
                    <!-- Modified date range form that preserves the active tab -->
                    <form id="dateRangeForm" method="GET" class="mb-4">
                        <div class="row g-3 align-items-end">
                            <div class="col-md-4">
                                <label for="startDate" class="form-label">Start Date</label>
                                <input type="date" class="form-control" id="startDate" name="start_date" 
                                    value="<?php echo isset($_GET['start_date']) ? htmlspecialchars($_GET['start_date']) : date('Y-m-d', strtotime('-30 days')); ?>" 
                                    max="<?php echo date('Y-m-d'); ?>">
                            </div>
                            <div class="col-md-4">
                                <label for="endDate" class="form-label">End Date</label>
                                <input type="date" class="form-control" id="endDate" name="end_date" 
                                    value="<?php echo isset($_GET['end_date']) ? htmlspecialchars($_GET['end_date']) : date('Y-m-d'); ?>" 
                                    max="<?php echo date('Y-m-d'); ?>">
                            </div>
                            <div class="col-md-4">
                                <button type="submit" class="btn btn-primary w-100">Filter</button>
                            </div>
                        </div>
                        <!-- Hidden field for tracking active tab - will be set by JavaScript -->
                        <input type="hidden" name="active_tab" value="<?php echo htmlspecialchars($activeTab); ?>">
                    </form>
                </div>
            </div>
            
            <div class="card-body">
                <!-- Tabs for different chart categories -->
                <ul class="nav nav-tabs" id="visualTabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link <?php echo ($activeTab == 'daily-metrics-tab') ? 'active' : ''; ?>" 
                                id="daily-metrics-tab" 
                                data-bs-toggle="tab" 
                                data-bs-target="#daily-metrics" 
                                type="button" 
                                role="tab" 
                                aria-controls="daily-metrics" 
                                aria-selected="<?php echo ($activeTab == 'daily-metrics-tab') ? 'true' : 'false'; ?>">
                            Daily Metrics
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link <?php echo ($activeTab == 'nutrition-tab') ? 'active' : ''; ?>" 
                                id="nutrition-tab" 
                                data-bs-toggle="tab" 
                                data-bs-target="#nutrition" 
                                type="button" 
                                role="tab" 
                                aria-controls="nutrition" 
                                aria-selected="<?php echo ($activeTab == 'nutrition-tab') ? 'true' : 'false'; ?>">
                            Nutrition
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link <?php echo ($activeTab == 'training-tab') ? 'active' : ''; ?>" 
                                id="training-tab" 
                                data-bs-toggle="tab" 
                                data-bs-target="#training" 
                                type="button" 
                                role="tab" 
                                aria-controls="training" 
                                aria-selected="<?php echo ($activeTab == 'training-tab') ? 'true' : 'false'; ?>">
                            Training
                        </button>
                    </li>
                </ul>
                
                <!-- Tab content -->
                <div class="tab-content" id="visualTabsContent">
                    <!-- Daily Metrics Tab -->
                    <div class="tab-pane fade <?php echo ($activeTab == 'daily-metrics-tab') ? 'show active' : ''; ?>" id="daily-metrics" role="tabpanel">
                        <div class="row g-4">
                            <!-- Weight Progress Chart -->
                            <div class="col-md-6">
                                <div class="metric-card">
                                    <div class="card-header">
                                        <h5 class="card-title">Weight Progress</h5>
                                    </div>
                                    <div class="card-body">
                                        <div class="chart-container">
                                            <canvas id="weightProgressChart"></canvas>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Sleep Duration Chart -->
                            <div class="col-md-6">
                                <div class="metric-card">
                                    <div class="card-header">
                                        <h5 class="card-title">Sleep Duration</h5>
                                    </div>
                                    <div class="card-body">
                                        <div class="chart-container">
                                            <canvas id="sleepDurationChart"></canvas>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Personal Metrics Chart -->
                            <div class="col-md-6">
                                <div class="metric-card">
                                    <div class="card-header">
                                        <h5 class="card-title">Personal Metrics</h5>
                                    </div>
                                    <div class="card-body">
                                        <div class="chart-container">
                                            <canvas id="personalMetricsChart"></canvas>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Nutrition Tab -->
                    <div class="tab-pane fade <?php echo ($activeTab == 'nutrition-tab') ? 'show active' : ''; ?>" id="nutrition" role="tabpanel">
                        <div class="row g-4">
                            <!-- Calories Chart -->
                            <div class="col-md-6">
                                <div class="metric-card">
                                    <div class="card-header">
                                        <h5 class="card-title">Calories</h5>
                                    </div>
                                    <div class="card-body">
                                        <div class="chart-container">
                                            <canvas id="caloriesChart"></canvas>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Macronutrients Chart -->
                            <div class="col-md-6">
                                <div class="metric-card">
                                    <div class="card-header">
                                        <h5 class="card-title">Macronutrients</h5>
                                    </div>
                                    <div class="card-body">
                                        <div class="chart-container">
                                            <canvas id="macronutrientsChart"></canvas>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Water Intake Chart -->
                            <div class="col-md-6">
                                <div class="metric-card">
                                    <div class="card-header">
                                        <h5 class="card-title">Water Intake</h5>
                                    </div>
                                    <div class="card-body">
                                        <div class="chart-container">
                                            <canvas id="waterIntakeChart"></canvas>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Training Tab -->
                    <div class="tab-pane fade <?php echo ($activeTab == 'training-tab') ? 'show active' : ''; ?>" id="training" role="tabpanel">
                        <!-- First row -->
                        <div class="row g-4">
                            <!-- Training Volume Chart -->
                            <div class="col-md-6">
                                <div class="metric-card">
                                    <div class="card-header">
                                        <h5 class="card-title">Training Volume by Muscle Group</h5>
                                    </div>
                                    <div class="card-body">
                                        <div class="chart-container">
                                            <canvas id="muscleGroupVolumeChart"></canvas>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Exercise Progress Chart -->
                            <div class="col-md-6">
                                <div class="metric-card">
                                    <div class="card-header">
                                        <h5 class="card-title">Exercise Progress</h5>
                                        <select id="exerciseSelector" class="form-select mt-2">
                                            <option value="">Select Exercise</option>
                                            <?php
                                            $exercises = [];
                                            foreach ($workoutDetails as $workout) {
                                                if (!in_array($workout['exercise_name'], $exercises)) {
                                                    $exercises[] = $workout['exercise_name'];
                                                    echo '<option value="' . htmlspecialchars($workout['exercise_name']) . '">' . 
                                                         htmlspecialchars($workout['exercise_name']) . '</option>';
                                                }
                                            }
                                            ?>
                                        </select>
                                    </div>
                                    <div class="card-body">
                                        <div id="exerciseProgressChartWrapper" class="chart-container">
                                            <canvas id="exerciseProgressChart"></canvas>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- Second row -->
                        <div class="row g-4 mt-4">
                            <!-- Stimulus & Fatigue Chart -->
                            <div class="col-md-6">
                                <div class="metric-card">
                                    <div class="card-header">
                                        <h5 class="card-title">Stimulus & Fatigue</h5>
                                    </div>
                                    <div class="card-body">
                                        <div class="chart-container">
                                            <canvas id="stimulusFatigueChart"></canvas>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Training Duration Chart -->
                            <div class="col-md-6">
                                <div class="metric-card">
                                    <div class="card-header">
                                        <h5 class="card-title">Training Duration</h5>
                                    </div>
                                    <div class="card-body">
                                        <div class="chart-container">
                                            <canvas id="trainingDurationChart"></canvas>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
</div>

<!-- Add Chart.js library before our custom script -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>

<!-- Custom styling for chart containers -->
<style>
.chart-container {
    position: relative;
    height: 300px;
    width: 100%;
    margin-bottom: 20px;
}

.metric-card {
    border: 1px solid rgba(0,0,0,.125);
    border-radius: 0.25rem;
    margin-bottom: 1.5rem;
    height: 100%;
}

.metric-card .card-header {
    background-color: rgba(0,0,0,.03);
    border-bottom: 1px solid rgba(0,0,0,.125);
    padding: 0.75rem 1.25rem;
}

.metric-card .card-body {
    padding: 1.25rem;
}

.tab-content {
    padding-top: 1.5rem;
}
</style>

<!-- Visualization JavaScript -->
<script src="assets/js/visualize.js"></script>

<!-- Pass PHP data to JavaScript -->
<script>
// Convert PHP data to JSON for JavaScript use
const dailyMetricsData = <?php echo json_encode($dailyMetrics); ?>;
const trainingSessionsData = <?php echo json_encode($trainingSessions); ?>;
const workoutDetailsData = <?php echo json_encode($workoutDetails); ?>;
const currentUserId = <?php echo $userId; ?>;

// Process data once DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Data loaded:', {
        metrics: dailyMetricsData.length + ' records',
        sessions: trainingSessionsData.length + ' records',
        workouts: workoutDetailsData.length + ' records'
    });
    
    // Process and display charts
    processVisualizationData(dailyMetricsData, trainingSessionsData, workoutDetailsData);
});

/**
 * Load chart data from API
 * @param {number} userId - The current user ID
 */
function loadChartData(userId) {
    // Modify all fetch calls to include the user_id parameter
    fetch(`api/visualize.php?action=get_data&metric=${selectedMetric}&user_id=${userId}`)
        .then(response => response.json())
        .then(result => {
            // ...existing code...
        });
    
    // ...existing code...
}
</script>
<script>
    document.addEventListener('DOMContentLoaded', function() {
        // Get tab elements
        const tabLinks = document.querySelectorAll('.nav-tabs .nav-link');
        const dateRangeForm = document.getElementById('dateRangeForm');
        
        // Add hidden input field to the form if it doesn't exist
        let activeTabInput = dateRangeForm.querySelector('input[name="active_tab"]');
        if (!activeTabInput) {
            activeTabInput = document.createElement('input');
            activeTabInput.type = 'hidden';
            activeTabInput.name = 'active_tab';
            dateRangeForm.appendChild(activeTabInput);
        }
        
        // Set initial value from URL parameter or default to first tab
        const urlParams = new URLSearchParams(window.location.search);
        const activeTabId = urlParams.get('active_tab') || 'daily-metrics-tab';
        
        // Activate the correct tab on page load
        const tabToActivate = document.getElementById(activeTabId);
        if (tabToActivate) {
            // Create a new Bootstrap tab instance and show it
            const tab = new bootstrap.Tab(tabToActivate);
            tab.show();
            
            // Set the hidden input value
            activeTabInput.value = activeTabId;
        }
        
        // Update hidden input when a tab is clicked
        tabLinks.forEach(tabLink => {
            tabLink.addEventListener('click', function() {
                activeTabInput.value = this.id;
            });
        });
        
        // Update form action to preserve the active tab when submitting
        dateRangeForm.addEventListener('submit', function(e) {
            // Prevent default form submission
            e.preventDefault();
            
            // Make sure we have the current active tab
            const currentActiveTab = document.querySelector('.nav-tabs .nav-link.active');
            if (currentActiveTab) {
                activeTabInput.value = currentActiveTab.id;
            }
            
            // Now submit the form
            this.submit();
        });
    });
    window.addEventListener('unload', function() {
        // Cleanup all chart instances
        const charts = Object.values(Chart.instances);
        charts.forEach(chart => chart.destroy());
    });
</script>

<?php require_once 'includes/footer.php'; ?>