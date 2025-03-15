<?php 
require_once 'includes/header.php';
require_once 'includes/functions.php';

// Redirect if not logged in
requireLogin();

// Check if a specific date is requested
$selectedDate = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');

// Validate date format
if (!validateDate($selectedDate)) {
    $selectedDate = date('Y-m-d');
}

// Get daily metrics for selected date
$dailyMetrics = getDailyMetrics($selectedDate);
?>

<div class="card">
    <div class="card-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
        <h2 class="mb-2 mb-md-0">Daily Metrics</h2>
        <div class="d-flex flex-wrap gap-2">
            <div class="date-selector">
                <label for="dateSelect" class="me-2">Select Date:</label>
                <input type="date" id="dateSelect" class="form-control" value="<?= $selectedDate ?>" max="<?= date('Y-m-d') ?>">
            </div>
        </div>
    </div>
    
    <div class="card-content">
        <form id="dailyMetricsForm">
            <input type="hidden" id="recordDate" name="date" value="<?= $selectedDate ?>">
            
            <!-- Morning Section -->
            <div class="section-divider">
                <h3>Morning</h3>
                
                <!-- Sleep -->
                <div class="form-row">
                    <div class="form-col">
                        <div class="form-group">
                            <label for="sleepStart">Sleep Time - Start:</label>
                            <input type="datetime-local" id="sleepStart" name="sleep_start" 
                                value="<?= !empty($dailyMetrics['sleep_start']) ? str_replace(' ', 'T', $dailyMetrics['sleep_start']) : date('Y-m-d\TH:i', strtotime($selectedDate . ' -1 day 22:00:00')) ?>">
                        </div>
                    </div>
                    <div class="form-col">
                        <div class="form-group">
                            <label for="sleepEnd">Sleep Time - End:</label>
                            <input type="datetime-local" id="sleepEnd" name="sleep_end" 
                                value="<?= !empty($dailyMetrics['sleep_end']) ? str_replace(' ', 'T', $dailyMetrics['sleep_end']) : date('Y-m-d\TH:i', strtotime($selectedDate . ' 06:30:00')) ?>">
                        </div>
                    </div>
                </div>
                
                <!-- Personal Metrics -->
                <div class="form-row">
                    <div class="form-col">
                        <div class="form-group">
                            <label for="stressLevel">Stress Level (1-10):</label>
                            <input type="range" id="stressLevel" name="stress_level" min="1" max="10" step="1" 
                                value="<?= !empty($dailyMetrics['stress_level']) ? $dailyMetrics['stress_level'] : '5' ?>" class="range-slider">
                            <span id="stressLevelDisplay" class="range-value"><?= !empty($dailyMetrics['stress_level']) ? $dailyMetrics['stress_level'] : '5' ?></span>
                        </div>
                    </div>
                    <div class="form-col">
                        <div class="form-group">
                            <label for="energyLevel">Energy Level (1-10):</label>
                            <input type="range" id="energyLevel" name="energy_level" min="1" max="10" step="1" 
                                value="<?= !empty($dailyMetrics['energy_level']) ? $dailyMetrics['energy_level'] : '5' ?>" class="range-slider">
                            <span id="energyLevelDisplay" class="range-value"><?= !empty($dailyMetrics['energy_level']) ? $dailyMetrics['energy_level'] : '5' ?></span>
                        </div>
                    </div>
                    <div class="form-col">
                        <div class="form-group">
                            <label for="motivationLevel">Motivation Level (1-10):</label>
                            <input type="range" id="motivationLevel" name="motivation_level" min="1" max="10" step="1" 
                                value="<?= !empty($dailyMetrics['motivation_level']) ? $dailyMetrics['motivation_level'] : '5' ?>" class="range-slider">
                            <span id="motivationLevelDisplay" class="range-value"><?= !empty($dailyMetrics['motivation_level']) ? $dailyMetrics['motivation_level'] : '5' ?></span>
                        </div>
                    </div>
                </div>

                <!-- Weight Tracking -->
                <div class="form-row">
                    <div class="form-col">
                        <div class="form-group">
                            <label for="weight">Body Weight (kg):</label>
                            <input type="number" id="weight" name="weight" min="0" step="0.1" 
                                value="<?= !empty($dailyMetrics['weight']) ? $dailyMetrics['weight'] : '' ?>" placeholder="e.g., 75.5">
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Throughout the Day Section -->
            <div class="section-divider">
                <h3>Throughout the Day</h3>
                
                <!-- Nutrition -->
                <div class="form-group">
                    <label for="meals">Meals:</label>
                    <textarea id="meals" name="meals" placeholder="Enter your meals for the day..."><?= !empty($dailyMetrics['meals']) ? $dailyMetrics['meals'] : '' ?></textarea>
                </div>
            </div>
            
            <!-- Evening Section -->
            <div class="section-divider">
                <h3>Evening</h3>
                
                <!-- Nutrition -->
                <div class="form-row">
                    <div class="form-col">
                        <div class="form-group">
                            <label for="calories">Calories:</label>
                            <input type="number" id="calories" name="calories" min="0" 
                                value="<?= !empty($dailyMetrics['calories']) ? $dailyMetrics['calories'] : '' ?>" placeholder="e.g., 2000">
                        </div>
                    </div>
                    <div class="form-col">
                        <div class="form-group">
                            <label for="protein">Protein (g):</label>
                            <input type="number" id="protein" name="protein" min="0" step="0.1" 
                                value="<?= !empty($dailyMetrics['protein']) ? $dailyMetrics['protein'] : '' ?>" placeholder="e.g., 150">
                        </div>
                    </div>
                    <div class="form-col">
                        <div class="form-group">
                            <label for="carbs">Carbs (g):</label>
                            <input type="number" id="carbs" name="carbs" min="0" step="0.1" 
                                value="<?= !empty($dailyMetrics['carbs']) ? $dailyMetrics['carbs'] : '' ?>" placeholder="e.g., 200">
                        </div>
                    </div>
                    <div class="form-col">
                        <div class="form-group">
                            <label for="fats">Fats (g):</label>
                            <input type="number" id="fats" name="fats" min="0" step="0.1" 
                                value="<?= !empty($dailyMetrics['fats']) ? $dailyMetrics['fats'] : '' ?>" placeholder="e.g., 70">
                        </div>
                    </div>
                </div>
                
                <!-- Hydration -->
                <div class="form-group">
                    <label for="waterIntake">Water Intake (liters):</label>
                    <input type="number" id="waterIntake" name="water_intake" min="0" step="0.1" 
                        value="<?= !empty($dailyMetrics['water_intake']) ? $dailyMetrics['water_intake'] : '' ?>" placeholder="e.g., 2.5">
                </div>
            </div>
            
            <!-- Submit Button -->
            <div class="form-group mt-3">
                <button type="submit" class="btn btn-primary btn-block">Save Daily Metrics</button>
            </div>
            
            <!-- Alert Message -->
            <div id="alertMessage" class="alert mt-3" style="display: none;"></div>
        </form>
    </div>
</div>

<!-- JavaScript -->
<script src="assets/js/daily.js"></script>


<?php require_once 'includes/footer.php'; ?>