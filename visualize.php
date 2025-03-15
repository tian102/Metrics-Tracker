<?php
require_once 'includes/header.php';
require_once 'includes/functions.php';

// Redirect if not logged in
requireLogin();

// Get date range for filters - default to last 30 days
$endDate = date('Y-m-d');
$startDate = isset($_GET['start_date']) ? $_GET['start_date'] : date('Y-m-d', strtotime('-30 days'));
$endDate = isset($_GET['end_date']) ? $_GET['end_date'] : $endDate;

// Get data for the selected period
$dailyMetrics = getDailyMetricsRange($startDate, $endDate);
$trainingSessions = getTrainingSessionsRange($startDate, $endDate);

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
    $sessionWorkouts = getWorkoutDetails($session['id']);
    foreach ($sessionWorkouts as $workout) {
        $workout['session_date'] = $session['date'];
        $workout['mesocycle_name'] = $session['mesocycle_name'];
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
                    <form id="dateRangeForm" class="mb-4">
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
                    <div class="tab-pane fade <?php echo ($activeTab == 'daily-metrics-tab') ? 'show active' : ''; ?>" id="daily-metrics" role="tabpanel" aria-labelledby="daily-metrics-tab">
                        <div class="row">
                            <!-- Weight Progress Chart -->
                            <div class="col-md-6">
                                <div class="card metric-card">
                                    <div class="card-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
                                        <h5 class="card-title mb-2 mb-md-0">Weight Progress</h5>
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
                                <div class="card metric-card">
                                    <div class="card-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
                                        <h5 class="card-title mb-2 mb-md-0">Sleep Duration</h5>
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
                                <div class="card metric-card">
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
                    <div class="tab-pane fade <?php echo ($activeTab == 'nutrition-tab') ? 'show active' : ''; ?>" id="nutrition" role="tabpanel" aria-labelledby="nutrition-tab">
                        <div class="row">
                            <!-- Calories Chart -->
                            <div class="col-md-6">
                                <div class="card metric-card">
                                    <div class="card-header">
                                        <h5 class="card-title">Calorie Intake</h5>
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
                                <div class="card metric-card">
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
                                <div class="card metric-card">
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
                    <div class="tab-pane fade <?php echo ($activeTab == 'training-tab') ? 'show active' : ''; ?>" id="training" role="tabpanel" aria-labelledby="training-tab">
                        <div class="row">
                            <!-- Training Volume by Muscle Group -->
                            <div class="col-md-6">
                                <div class="card metric-card">
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
                                <div class="card metric-card">
                                    <div class="card-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
                                        <h5 class="card-title mb-2 mb-md-0">Exercise Progress</h5>
                                        <div class="d-flex flex-wrap gap-2">
                                            <select id="exerciseSelector" class="form-select" style="width: auto;">
                                                <option value="">Select Exercise</option>
                                                <?php
                                                // Get unique exercises
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
                                    </div>
                                    <div class="card-body">
                                        <div class="chart-container">
                                            <canvas id="exerciseProgressChart"></canvas>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Stimulus & Fatigue Chart -->
                            <div class="col-md-6">
                                <div class="card metric-card">
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
                                <div class="card metric-card">
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

<!-- Visualization JavaScript -->
<script src="assets/js/visualize.js"></script>

<!-- Pass PHP data to JavaScript -->
<script>
// Convert PHP data to JSON for JavaScript use
const dailyMetricsData = <?php echo json_encode($dailyMetrics); ?>;
const trainingSessionsData = <?php echo json_encode($trainingSessions); ?>;
const workoutDetailsData = <?php echo json_encode($workoutDetails); ?>;

// Process data once DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Process and display charts
    processVisualizationData(dailyMetricsData, trainingSessionsData, workoutDetailsData);
});
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
        // Make sure we have the current active tab
        const currentActiveTab = document.querySelector('.nav-tabs .nav-link.active');
        if (currentActiveTab) {
            activeTabInput.value = currentActiveTab.id;
        }
    });
});
</script>
<?php require_once 'includes/footer.php'; ?>