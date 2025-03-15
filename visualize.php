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
                    <form id="dateRangeForm" class="d-flex flex-wrap gap-2">
                        <div class="input-group">
                            <span class="input-group-text">From</span>
                            <input type="date" id="startDate" name="start_date" class="form-control" value="<?= $startDate ?>">
                        </div>
                        <div class="input-group">
                            <span class="input-group-text">To</span>
                            <input type="date" id="endDate" name="end_date" class="form-control" value="<?= $endDate ?>">
                        </div>
                        <button type="submit" class="btn btn-primary">Filter</button>
                    </form>
                </div>
            </div>
            
            <div class="card-body">
                <!-- Tabs for different chart categories -->
                <ul class="nav nav-tabs mb-4" id="chartTabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" id="daily-tab" data-bs-toggle="tab" 
                            data-bs-target="#daily-charts" type="button" role="tab" 
                            aria-controls="daily-charts" aria-selected="true">Daily Metrics</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="nutrition-tab" data-bs-toggle="tab" 
                            data-bs-target="#nutrition-charts" type="button" role="tab" 
                            aria-controls="nutrition-charts" aria-selected="false">Nutrition</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="training-tab" data-bs-toggle="tab" 
                            data-bs-target="#training-charts" type="button" role="tab" 
                            aria-controls="training-charts" aria-selected="false">Training</button>
                    </li>
                </ul>
                
                <!-- Tab content -->
                <div class="tab-content" id="chartTabContent">
                    <!-- Daily Metrics Tab -->
                    <div class="tab-pane fade show active" id="daily-charts" role="tabpanel" aria-labelledby="daily-tab">
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
                    <div class="tab-pane fade" id="nutrition-charts" role="tabpanel" aria-labelledby="nutrition-tab">
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
                    <div class="tab-pane fade" id="training-charts" role="tabpanel" aria-labelledby="training-tab">
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

<?php require_once 'includes/footer.php'; ?>