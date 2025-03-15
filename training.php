<?php 
require_once 'includes/header.php';
require_once 'includes/functions.php';

// Redirect if not logged in
requireLogin();

// Check if a specific session ID is requested
$sessionId = isset($_GET['id']) ? (int)$_GET['id'] : null;
$sessionData = null;
$workoutDetails = null;

// If session ID is provided, load the session and workout details
if ($sessionId) {
    $db = new Database();
    $db->query("SELECT * FROM training_sessions WHERE id = :id");
    $db->bind(':id', $sessionId);
    $sessionData = $db->single();
    
    if ($sessionData) {
        $workoutDetails = getWorkoutDetails($sessionId);
    }
}

// Set default date to today if creating a new session
$selectedDate = $sessionData ? $sessionData['date'] : date('Y-m-d');
?>

<div class="card">
    <div class="card-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
        <h2 class="mb-2 mb-md-0"><?= $sessionId ? 'Edit Training Session' : 'New Training Session' ?></h2>
        <div class="d-flex flex-wrap gap-2">
            <a href="training.php" class="btn btn-primary"><i class="fas fa-plus"></i> New Session</a>
            <?php if ($sessionId): ?>
                <button id="deleteSessionBtn" class="btn btn-danger"><i class="fas fa-trash"></i> Delete Session</button>
            <?php endif; ?>
        </div>
    </div>
    
    <div class="card-content">
        <!-- Session Form -->
        <form id="sessionForm">
            <?php if ($sessionId): ?>
                <input type="hidden" id="sessionId" name="id" value="<?= $sessionId ?>">
            <?php endif; ?>
            
            <div class="section-divider">
                <h3>Session Details</h3>
                
                <div class="form-row">
                    <div class="form-col">
                        <div class="form-group">
                            <label for="sessionDate">Date:</label>
                            <input type="date" id="sessionDate" name="date" required 
                                value="<?= $sessionData ? $sessionData['date'] : $selectedDate ?>" max="<?= date('Y-m-d') ?>">
                        </div>
                    </div>
                    <div class="form-col">
                        <div class="form-group">
                            <label for="mesocycleName">Mesocycle Name:</label>
                            <select id="mesocycleName" name="mesocycle_name" class="form-select">
                                <option value="">Select Mesocycle</option>
                                <?php
                                $mesocycles = [
                                    'Mesocycle 1.1', 'Mesocycle 1.2', 'Mesocycle 1.3', 'Mesocycle 1.4', 'Mesocycle 1.5', 'Mesocycle 1.6',
                                    'Mesocycle 2.1', 'Mesocycle 2.2', 'Mesocycle 2.3', 'Mesocycle 2.4', 'Mesocycle 2.5', 'Mesocycle 2.6',
                                    'Mesocycle 3.1', 'Mesocycle 3.2', 'Mesocycle 3.3', 'Mesocycle 3.4', 'Mesocycle 3.5', 'Mesocycle 3.6'
                                ];
                                
                                foreach ($mesocycles as $mesocycle) {
                                    $selected = ($sessionData && $sessionData['mesocycle_name'] === $mesocycle) ? 'selected' : '';
                                    echo "<option value=\"$mesocycle\" $selected>$mesocycle</option>";
                                }
                                ?>
                            </select>
                        </div>
                    </div>
                    <div class="form-col">
                        <div class="form-group">
                            <label for="sessionNumber">Session Number:</label>
                            <input type="number" id="sessionNumber" name="session_number" min="1" 
                                value="<?= $sessionData ? $sessionData['session_number'] : '' ?>" placeholder="e.g., 1">
                        </div>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-col">
                        <div class="form-group">
                            <label for="trainingStart">Training Time - Start:</label>
                            <input type="time" id="trainingStart" name="training_start_time" 
                                value="<?php 
                                    if ($sessionData && $sessionData['training_start']) {
                                        $start = new DateTime($sessionData['training_start']);
                                        echo $start->format('H:i');
                                    } else {
                                        echo '';
                                    }
                                ?>">
                        </div>
                    </div>
                    <div class="form-col">
                        <div class="form-group">
                            <label for="trainingEnd">Training Time - End:</label>
                            <input type="time" id="trainingEnd" name="training_end_time" 
                                value="<?php 
                                    if ($sessionData && $sessionData['training_end']) {
                                        $end = new DateTime($sessionData['training_end']);
                                        echo $end->format('H:i');
                                    } else {
                                        echo '';
                                    }
                                ?>">
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Submit Button for Session -->
            <div class="form-group mt-3">
                <button type="submit" class="btn btn-primary btn-block"><?= $sessionId ? 'Update Session' : 'Create Session' ?></button>
            </div>
            
            <!-- Alert Message for Session -->
            <div id="sessionAlertMessage" class="alert mt-3" style="display: none;"></div>
        </form>
        
        <?php if ($sessionId): ?>
            <!-- Workout Details Section -->
            <div class="section-divider">
                <h3>Workout Details</h3>
                
                <!-- Existing Workout Details -->
                <?php if ($workoutDetails && count($workoutDetails) > 0): ?>
                    <div id="existingExercises">
                        <?php foreach ($workoutDetails as $index => $workout): ?>
                            <div class="exercise-container" data-id="<?= $workout['id'] ?>" data-equipment="<?= htmlspecialchars($workout['equipment'] ?: '') ?>">
                                <div class="exercise-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
                                    <h4 class="exercise-title mb-2 mb-md-0"><?= htmlspecialchars($workout['exercise_name']) ?> (<?= htmlspecialchars($workout['muscle_group']) ?>)</h4>
                                    <div class="d-flex flex-wrap gap-2">
                                        <button type="button" class="btn btn-danger delete-exercise-btn">
                                            <i class="fas fa-trash"></i> Delete
                                        </button>
                                    </div>
                                </div>
                                
                                <form class="workout-detail-form">
                                    <input type="hidden" name="id" value="<?= $workout['id'] ?>">
                                    
                                    <div class="form-row">
                                        <div class="form-col">
                                            <div class="form-group">
                                                <label for="muscleGroup_<?= $index ?>">Muscle Group:</label>
                                                <input type="text" id="muscleGroup_<?= $index ?>" name="muscle_group" 
                                                    value="<?= htmlspecialchars($workout['muscle_group']) ?>" required>
                                            </div>
                                        </div>
                                        <div class="form-col">
                                            <div class="form-group">
                                                <label for="equipment_<?= $index ?>">Equipment:</label>
                                                <input type="text" id="equipment_<?= $index ?>" name="equipment" 
                                                    value="<?= htmlspecialchars($workout['equipment'] ?: '') ?>" required>
                                            </div>
                                        </div>
                                        <div class="form-col">
                                            <div class="form-group">
                                                <label for="exerciseName_<?= $index ?>">Exercise Name:</label>
                                                <input type="text" id="exerciseName_<?= $index ?>" name="exercise_name" 
                                                    value="<?= htmlspecialchars($workout['exercise_name']) ?>" required>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Pre-Exercise Review -->
                                    <div class="form-row">
                                        <div class="form-col">
                                            <div class="form-group">
                                                <label for="preEnergyLevel_<?= $index ?>">Pre-Exercise Energy Level (1-10):</label>
                                                <input type="range" id="preEnergyLevel_<?= $index ?>" name="pre_energy_level" min="1" max="10" step="1" 
                                                    value="<?= $workout['pre_energy_level'] ?: 5 ?>" class="range-slider">
                                                <span class="range-value"><?= $workout['pre_energy_level'] ?: 5 ?></span>
                                            </div>
                                        </div>
                                        <div class="form-col">
                                            <div class="form-group">
                                                <label for="preSorenessLevel_<?= $index ?>">Pre-Exercise Soreness Level (1-10):</label>
                                                <input type="range" id="preSorenessLevel_<?= $index ?>" name="pre_soreness_level" min="1" max="10" step="1" 
                                                    value="<?= $workout['pre_soreness_level'] ?: 5 ?>" class="range-slider">
                                                <span class="range-value"><?= $workout['pre_soreness_level'] ?: 5 ?></span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Exercise Data -->
                                    <div class="form-row">
                                        <div class="form-col">
                                            <div class="form-group">
                                                <label for="sets_<?= $index ?>">Sets:</label>
                                                <input type="number" id="sets_<?= $index ?>" name="sets" min="1" 
                                                    value="<?= $workout['sets'] ?>">
                                            </div>
                                        </div>
                                        <div class="form-col">
                                            <div class="form-group">
                                                <label for="reps_<?= $index ?>">Reps:</label>
                                                <input type="number" id="reps_<?= $index ?>" name="reps" min="1" 
                                                    value="<?= $workout['reps'] ?>">
                                            </div>
                                        </div>
                                        <div class="form-col">
                                            <div class="form-group">
                                                <label for="loadWeight_<?= $index ?>">Load Weight (kg):</label>
                                                <input type="number" id="loadWeight_<?= $index ?>" name="load_weight" min="0" step="0.5" 
                                                    value="<?= $workout['load_weight'] ?>">
                                            </div>
                                        </div>
                                        <div class="form-col">
                                            <div class="form-group">
                                                <label for="rir_<?= $index ?>">RIR (Reps In Reserve):</label>
                                                <input type="number" id="rir_<?= $index ?>" name="rir" min="0" 
                                                    value="<?= $workout['rir'] ?>">
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Post-Exercise Review -->
                                    <div class="form-row">
                                        <div class="form-col">
                                            <div class="form-group">
                                                <label for="stimulus_<?= $index ?>">Stimulus (1-10):</label>
                                                <input type="range" id="stimulus_<?= $index ?>" name="stimulus" min="1" max="10" step="1" 
                                                    value="<?= $workout['stimulus'] ?: 5 ?>" class="range-slider">
                                                <span class="range-value"><?= $workout['stimulus'] ?: 5 ?></span>
                                            </div>
                                        </div>
                                        <div class="form-col">
                                            <div class="form-group">
                                                <label for="fatigueLevel_<?= $index ?>">Fatigue Level (1-10):</label>
                                                <input type="range" id="fatigueLevel_<?= $index ?>" name="fatigue_level" min="1" max="10" step="1" 
                                                    value="<?= $workout['fatigue_level'] ?: 5 ?>" class="range-slider">
                                                <span class="range-value"><?= $workout['fatigue_level'] ?: 5 ?></span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="form-group mt-3">
                                        <button type="submit" class="btn btn-secondary">Update Exercise</button>
                                    </div>
                                    
                                    <!-- Alert Message for each Exercise -->
                                    <div class="workout-alert-message alert mt-3" style="display: none;"></div>
                                </form>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php else: ?>
                    <p>No exercises added yet. Add your first exercise below.</p>
                <?php endif; ?>
                
                <!-- New Exercise Form -->
                <button type="button" id="addExerciseBtn" class="btn btn-secondary add-exercise-btn">
                    <i class="fas fa-plus"></i> Add Exercise
                </button>
                
                <div id="newExerciseForm" style="display: none;" class="exercise-container mt-3">
                    <h4>New Exercise</h4>
                    <form id="workoutDetailsForm">
                        <input type="hidden" name="session_id" value="<?= $sessionId ?>">
                        
                        <div class="form-row">
                            <div class="form-col">
                                <div class="form-group">
                                    <label for="newMuscleGroup">Muscle Group:</label>
                                    <select id="newMuscleGroup" name="muscle_group" class="form-select" required>
                                        <option value="">Select Muscle Group</option>
                                        <!-- Options will be loaded by JavaScript -->
                                    </select>
                                </div>
                            </div>
                            <div class="form-col">
                                <div class="form-group">
                                    <label for="newEquipment">Equipment:</label>
                                    <select id="newEquipment" name="equipment" class="form-select" required>
                                        <option value="">Select Equipment</option>
                                        <!-- Options will be loaded by JavaScript -->
                                    </select>
                                </div>
                            </div>
                            <div class="form-col">
                                <div class="form-group">
                                    <label for="newExerciseName">Exercise Name:</label>
                                    <select id="newExerciseName" name="exercise_name" class="form-select" required>
                                        <option value="">Select Exercise</option>
                                        <!-- Options will be loaded by JavaScript -->
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Pre-Exercise Review -->
                        <div class="form-row">
                            <div class="form-col">
                                <div class="form-group">
                                    <label for="newPreEnergyLevel">Pre-Exercise Energy Level (1-10):</label>
                                    <input type="range" id="newPreEnergyLevel" name="pre_energy_level" min="1" max="10" step="1" value="5" class="range-slider">
                                    <span id="newPreEnergyLevelDisplay" class="range-value">5</span>
                                </div>
                            </div>
                            <div class="form-col">
                                <div class="form-group">
                                    <label for="newPreSorenessLevel">Pre-Exercise Soreness Level (1-10):</label>
                                    <input type="range" id="newPreSorenessLevel" name="pre_soreness_level" min="1" max="10" step="1" value="5" class="range-slider">
                                    <span id="newPreSorenessLevelDisplay" class="range-value">5</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Exercise Data -->
                        <div class="form-row">
                            <div class="form-col">
                                <div class="form-group">
                                    <label for="newSets">Sets:</label>
                                    <input type="number" id="newSets" name="sets" min="1" placeholder="e.g., 3">
                                </div>
                            </div>
                            <div class="form-col">
                                <div class="form-group">
                                    <label for="newReps">Reps:</label>
                                    <input type="number" id="newReps" name="reps" min="1" placeholder="e.g., 10">
                                </div>
                            </div>
                            <div class="form-col">
                                <div class="form-group">
                                    <label for="newLoadWeight">Load Weight (kg):</label>
                                    <input type="number" id="newLoadWeight" name="load_weight" min="0" step="0.5" placeholder="e.g., 50">
                                </div>
                            </div>
                            <div class="form-col">
                                <div class="form-group">
                                    <label for="newRir">RIR (Reps In Reserve):</label>
                                    <input type="number" id="newRir" name="rir" min="0" placeholder="e.g., 2">
                                </div>
                            </div>
                        </div>
                        
                        <!-- Post-Exercise Review -->
                        <div class="form-row">
                            <div class="form-col">
                                <div class="form-group">
                                    <label for="newStimulus">Stimulus (1-10):</label>
                                    <input type="range" id="newStimulus" name="stimulus" min="1" max="10" step="1" value="5" class="range-slider">
                                    <span id="newStimulusDisplay" class="range-value">5</span>
                                </div>
                            </div>
                            <div class="form-col">
                                <div class="form-group">
                                    <label for="newFatigueLevel">Fatigue Level (1-10):</label>
                                    <input type="range" id="newFatigueLevel" name="fatigue_level" min="1" max="10" step="1" value="5" class="range-slider">
                                    <span id="newFatigueLevelDisplay" class="range-value">5</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-group mt-3">
                            <button type="submit" class="btn btn-primary">Add Exercise</button>
                            <button type="button" id="cancelAddExercise" class="btn btn-danger">Cancel</button>
                        </div>
                        
                        <!-- Alert Message for new Exercise -->
                        <div id="workoutAlertMessage" class="alert mt-3" style="display: none;"></div>
                    </form>
                </div>
            </div>
        <?php endif; ?>
    </div>
</div>

<!-- Set up datalists for autocompletion -->
<datalist id="muscleGroupList"></datalist>
<datalist id="exerciseNameList"></datalist>
<datalist id="equipmentList"></datalist>



<script src="assets/js/training.js"></script>

<?php require_once 'includes/footer.php'; ?>