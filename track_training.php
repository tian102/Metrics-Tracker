<?php 
require_once 'includes/header.php';
require_once 'includes/functions.php';

// Redirect if not logged in
requireLogin();

// Check if a specific session ID is requested
$sessionId = isset($_GET['id']) ? (int)$_GET['id'] : null;
$sessionData = null;
$workoutDetails = null;
$showExerciseForm = isset($_GET['show_exercise_form']) && $_GET['show_exercise_form'] == 1;

// If session ID is provided, load the session and workout details
if ($sessionId) {
    $db = new Database();
    $db->query("SELECT * FROM training_sessions WHERE id = :id AND user_id = :user_id");
    $db->bind(':id', $sessionId);
    $db->bind(':user_id', $_SESSION['user_id']);
    $sessionData = $db->single();
    
    if (!$sessionData) {
        // Session not found or doesn't belong to current user
        setFlashMessage('danger', 'The requested training session was not found.');
        redirect('track_training.php');
    }
    
    // Load workout exercises
    $workoutDetails = getWorkoutDetails($sessionId);
}

// Set default date to today if creating a new session
$selectedDate = $sessionData ? $sessionData['date'] : date('Y-m-d');
?>

<div class="container-fluid py-3">
    <!-- Page Header with Action Buttons -->
    <div class="row mb-4">
        <div class="col">
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
                <h2 class="mb-2 mb-md-0">
                    <?= $sessionId ? 'Edit Training Session' : 'New Training Session' ?>
                    <?php if ($sessionData && !empty($sessionData['mesocycle_name'])): ?>
                        <span class="text-muted fs-5">(<?= htmlspecialchars($sessionData['mesocycle_name']) ?>)</span>
                    <?php endif; ?>
                </h2>
                <div class="d-flex flex-wrap gap-2">
                    <a href="track_training.php" class="btn btn-primary">
                        <i class="fas fa-plus"></i> New Session
                    </a>
                    <?php if ($sessionId): ?>
                        <button id="deleteSessionBtn" class="btn btn-danger">
                            <i class="fas fa-trash"></i> Delete Session
                        </button>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>

    <!-- Session Form Card -->
    <div class="card mb-4 shadow-sm">
        <div class="card-header bg-light">
            <h3 class="card-title mb-0">Session Details</h3>
        </div>
        <div class="card-body">
            <form id="sessionForm" class="needs-validation" novalidate>
                <?php if ($sessionId): ?>
                    <input type="hidden" name="id" value="<?= $sessionId ?>">
                <?php endif; ?>
                
                <div class="row g-3">
                    <div class="col-md-4">
                        <div class="form-group">
                            <label for="sessionDate" class="form-label">Session Date:</label>
                            <input type="date" id="sessionDate" name="date" class="form-control" required 
                                value="<?= $sessionData ? $sessionData['date'] : $selectedDate ?>" 
                                max="<?= date('Y-m-d') ?>">
                            <div class="invalid-feedback">Please select a valid date.</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="form-group">
                            <label for="mesocycleName" class="form-label">Mesocycle Name:</label>
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
                    <div class="col-md-4">
                        <div class="form-group">
                            <label for="sessionNumber" class="form-label">Session Number:</label>
                            <input type="number" id="sessionNumber" name="session_number" min="1" 
                                class="form-control" value="<?= $sessionData ? $sessionData['session_number'] : '' ?>" 
                                placeholder="e.g., 1">
                        </div>
                    </div>
                </div>
                
                <div class="row g-3 mt-2">
                    <div class="col-md-6">
                        <div class="form-group">
                            <label for="trainingStart" class="form-label">Training Time - Start:</label>
                            <input type="time" id="trainingStart" name="training_start_time" class="form-control" 
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
                    <div class="col-md-6">
                        <div class="form-group">
                            <label for="trainingEnd" class="form-label">Training Time - End:</label>
                            <input type="time" id="trainingEnd" name="training_end_time" class="form-control" 
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
                
                <!-- Optional Notes -->
                <div class="row mt-3">
                    <div class="col-12">
                        <div class="form-group">
                            <label for="sessionNotes" class="form-label">Session Notes:</label>
                            <textarea id="sessionNotes" name="notes" class="form-control" rows="3" 
                                placeholder="Add any notes about this training session..."><?= $sessionData ? htmlspecialchars($sessionData['notes'] ?? '') : '' ?></textarea>
                        </div>
                    </div>
                </div>
                
                <!-- Submit Button for Session -->
                <div class="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save me-1"></i>
                        <?= $sessionId ? 'Update Session' : 'Create Session' ?>
                    </button>
                </div>
                
                <!-- Alert Message for Session -->
                <div id="sessionAlertMessage" class="alert mt-3" style="display: none;"></div>
            </form>
        </div>
    </div>

    <?php if ($sessionId): ?>
        <!-- Workout Exercises Card -->
        <div class="card shadow-sm">
            <div class="card-header bg-light d-flex justify-content-between align-items-center">
                <h3 class="card-title mb-0">Workout Exercises</h3>
                <div class="btn-group">
                    <button type="button" id="addExerciseBtn" class="btn btn-success">
                        <i class="fas fa-plus me-1"></i> Add Exercise
                    </button>
                    <button type="button" id="loadTemplateBtn" class="btn btn-primary">
                        <i class="fas fa-dumbbell me-1"></i> Load Template
                    </button>
                </div>
            </div>
            <div class="card-body">
                <!-- Existing Workout Details -->
                <div id="exercisesList" class="exercise-list mb-4">
                    <?php if ($workoutDetails && count($workoutDetails) > 0): ?>
                        <div class="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4">
                            <?php foreach ($workoutDetails as $index => $workout): ?>
                                <div class="col">
                                    <div class="exercise-container h-100 position-relative" data-exercise-id="<?= $workout['id'] ?>">
                                        <div class="d-flex justify-content-between align-items-center mb-3">
                                            <h4 class="mb-0 fw-bold"><?= htmlspecialchars($workout['exercise_name']) ?></h4>
                                            <div class="dropdown">
                                                <button class="btn btn-sm btn-outline-secondary" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                    <i class="fas fa-ellipsis-v"></i>
                                                </button>
                                                <ul class="dropdown-menu">
                                                    <li>
                                                        <button type="button" class="dropdown-item edit-exercise-btn">
                                                            <i class="fas fa-edit me-2"></i> Edit
                                                        </button>
                                                    </li>
                                                    <li>
                                                        <button type="button" class="dropdown-item delete-exercise-btn text-danger">
                                                            <i class="fas fa-trash me-2"></i> Delete
                                                        </button>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                        
                                        <div class="exercise-details">
                                            <div class="badge bg-primary mb-2"><?= htmlspecialchars($workout['muscle_group']) ?></div>
                                            <?php if (!empty($workout['equipment'])): ?>
                                                <div class="badge bg-secondary mb-2"><?= htmlspecialchars($workout['equipment']) ?></div>
                                            <?php endif; ?>

                                            <div class="row mt-3">
                                                <div class="col">
                                                    <div class="d-flex justify-content-between">
                                                        <span class="fw-bold">Sets:</span>
                                                        <span><?= $workout['sets'] ?: '-' ?></span>
                                                    </div>
                                                </div>
                                                <div class="col">
                                                    <div class="d-flex justify-content-between">
                                                        <span class="fw-bold">Reps:</span>
                                                        <span><?= $workout['reps'] ?: '-' ?></span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div class="row mt-2">
                                                <div class="col">
                                                    <div class="d-flex justify-content-between">
                                                        <span class="fw-bold">Weight:</span>
                                                        <span><?= $workout['load_weight'] ? $workout['load_weight'] . ' kg' : '-' ?></span>
                                                    </div>
                                                </div>
                                                <div class="col">
                                                    <div class="d-flex justify-content-between">
                                                        <span class="fw-bold">RIR:</span>
                                                        <span><?= $workout['rir'] ?: '-' ?></span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <?php if (!empty($workout['notes'])): ?>
                                                <div class="mt-3 small">
                                                    <p class="mb-0"><i class="fas fa-sticky-note me-1"></i> <?= htmlspecialchars($workout['notes']) ?></p>
                                                </div>
                                            <?php endif; ?>
                                        </div>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    <?php else: ?>
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>
                            <?php if ($showExerciseForm): ?>
                                Add your first exercise using the form below.
                            <?php else: ?>
                                No exercises added yet. Use the "Add Exercise" button to add your first exercise or load a template.
                            <?php endif; ?>
                        </div>
                    <?php endif; ?>
                </div>
                
                <!-- New Exercise Form (initially hidden unless auto-show is requested) -->
                <div id="newExerciseForm" style="display: <?= $showExerciseForm ? 'block' : 'none' ?>;" class="exercise-form-container p-4 border rounded mb-4 bg-light">
                    <h4 class="mb-3">Add New Exercise</h4>
                    <form id="workoutDetailsForm" class="needs-validation" novalidate>
                        <input type="hidden" name="session_id" value="<?= $sessionId ?>">
                        
                        <div class="row g-3">
                            <div class="col-md-4">
                                <div class="form-group">
                                    <label for="newMuscleGroup" class="form-label">Muscle Group:</label>
                                    <select id="newMuscleGroup" name="muscle_group" class="form-select" required>
                                        <option value="">Select Muscle Group</option>
                                        <!-- Options will be loaded by JavaScript -->
                                    </select>
                                    <div class="invalid-feedback">Please select a muscle group.</div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group">
                                    <label for="newEquipment" class="form-label">Equipment:</label>
                                    <select id="newEquipment" name="equipment" class="form-select" required>
                                        <option value="">Select Equipment</option>
                                        <!-- Options will be loaded by JavaScript -->
                                    </select>
                                    <div class="invalid-feedback">Please select equipment.</div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group">
                                    <label for="newExerciseName" class="form-label">Exercise Name:</label>
                                    <select id="newExerciseName" name="exercise_name" class="form-select" required>
                                        <option value="">Select Exercise</option>
                                        <!-- Options will be loaded by JavaScript -->
                                    </select>
                                    <div class="invalid-feedback">Please select an exercise.</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Set and Rep Scheme -->
                        <div class="row g-3 mt-3">
                            <div class="col-md-3">
                                <div class="form-group">
                                    <label for="newSets" class="form-label">Sets:</label>
                                    <input type="number" id="newSets" name="sets" min="1" class="form-control" placeholder="e.g., 3" required>
                                    <div class="invalid-feedback">Please enter the number of sets.</div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <label for="newReps" class="form-label">Reps:</label>
                                    <input type="number" id="newReps" name="reps" min="1" class="form-control" placeholder="e.g., 10" required>
                                    <div class="invalid-feedback">Please enter the number of reps.</div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <label for="newLoadWeight" class="form-label">Weight (kg):</label>
                                    <input type="number" id="newLoadWeight" name="load_weight" min="0" step="0.5" class="form-control" placeholder="e.g., 50">
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <label for="newRir" class="form-label">RIR (Reps In Reserve):</label>
                                    <input type="number" id="newRir" name="rir" min="0" class="form-control" placeholder="e.g., 2">
                                </div>
                            </div>
                        </div>
                        
                        <!-- Pre-Exercise Review -->
                        <div class="row g-3 mt-3">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label for="newPreEnergyLevel" class="form-label">Pre-Exercise Energy Level (1-10):</label>
                                    <div class="d-flex align-items-center">
                                        <input type="range" id="newPreEnergyLevel" name="pre_energy_level" min="1" max="10" step="1" value="5" class="form-range range-slider flex-grow-1 me-2">
                                        <span class="range-value badge bg-primary">5</span>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label for="newPreSorenessLevel" class="form-label">Pre-Exercise Soreness Level (1-10):</label>
                                    <div class="d-flex align-items-center">
                                        <input type="range" id="newPreSorenessLevel" name="pre_soreness_level" min="1" max="10" step="1" value="5" class="form-range range-slider flex-grow-1 me-2">
                                        <span class="range-value badge bg-primary">5</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Post-Exercise Review -->
                        <div class="row g-3 mt-3">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label for="newStimulus" class="form-label">Stimulus (1-10):</label>
                                    <div class="d-flex align-items-center">
                                        <input type="range" id="newStimulus" name="stimulus" min="1" max="10" step="1" value="5" class="form-range range-slider flex-grow-1 me-2">
                                        <span class="range-value badge bg-primary">5</span>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label for="newFatigueLevel" class="form-label">Fatigue Level (1-10):</label>
                                    <div class="d-flex align-items-center">
                                        <input type="range" id="newFatigueLevel" name="fatigue_level" min="1" max="10" step="1" value="5" class="form-range range-slider flex-grow-1 me-2">
                                        <span class="range-value badge bg-primary">5</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Notes -->
                        <div class="row mt-3">
                            <div class="col-12">
                                <div class="form-group">
                                    <label for="newExerciseNotes" class="form-label">Notes:</label>
                                    <textarea id="newExerciseNotes" name="notes" class="form-control" rows="2" 
                                        placeholder="Add any notes about this exercise..."></textarea>
                                </div>
                            </div>
                        </div>
                        
                        <div class="d-flex justify-content-end mt-4 gap-2">
                            <button type="button" id="cancelAddExercise" class="btn btn-outline-secondary">
                                <i class="fas fa-times me-1"></i> Cancel
                            </button>
                            <button type="submit" class="btn btn-success">
                                <i class="fas fa-plus me-1"></i> Add Exercise
                            </button>
                        </div>
                        
                        <!-- Alert Message for new Exercise -->
                        <div id="workoutAlertMessage" class="alert mt-3" style="display: none;"></div>
                    </form>
                </div>
            </div>
        </div>
    <?php else: ?>
        <!-- Show recent sessions if we're on the main training page -->
        <div class="card shadow-sm">
            <div class="card-header bg-light">
                <h3 class="card-title mb-0">Recent Training Sessions</h3>
            </div>
            <div class="card-body">
                <div id="recentSessions">
                    <div class="text-center py-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading recent sessions...</span>
                        </div>
                        <p class="mt-2">Loading recent sessions...</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Add Quick Session Card -->
        <div class="card mt-4 shadow-sm">
            <div class="card-header bg-light">
                <h3 class="card-title mb-0">Start from Template</h3>
            </div>
            <div class="card-body">
                <p class="text-muted">Quickly start a new session using one of your saved templates:</p>
                <div id="quickTemplates" class="row g-3">
                    <div class="text-center py-3">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading templates...</span>
                        </div>
                        <p class="mt-2">Loading templates...</p>
                    </div>
                </div>
            </div>
        </div>
    <?php endif; ?>
</div>

<!-- Template selection modal -->
<div class="modal fade" id="templateModal" tabindex="-1" aria-labelledby="templateModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="templateModalLabel">Select Workout Template</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <p class="text-muted">Select a workout template to automatically add its exercises to your training session.</p>
                
                <!-- Template selection dropdown for smaller templates list -->
                <div class="mb-3">
                    <select id="templateSelect" class="form-select mb-3">
                        <option value="">Select a template</option>
                        <!-- Options will be loaded by JavaScript -->
                    </select>
                    <button id="loadTemplateConfirmBtn" class="btn btn-primary">
                        <i class="fas fa-plus-circle me-1"></i> Load Selected Template
                    </button>
                </div>
                
                <hr>
                
                <!-- Template cards for visual selection -->
                <div id="templatesList">
                    <!-- Templates will be loaded here -->
                    <div class="text-center py-3">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-2">Loading templates...</p>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <a href="workout_templates.php" class="btn btn-primary">
                    <i class="fas fa-cog me-1"></i> Manage Templates
                </a>
            </div>
        </div>
    </div>
</div>

<!-- Exercise Edit Modal -->
<div class="modal fade" id="editExerciseModal" tabindex="-1" aria-labelledby="editExerciseModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="editExerciseModalLabel">Edit Exercise</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form id="editExerciseForm" class="needs-validation" novalidate>
                    <input type="hidden" name="id" id="editExerciseId">
                    <input type="hidden" name="session_id" value="<?= $sessionId ?>">
                    
                    <!-- Exercise form fields will be populated dynamically -->
                    <div id="editExerciseFormContent">
                        <div class="text-center py-3">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Loading exercise data...</span>
                            </div>
                            <p class="mt-2">Loading exercise data...</p>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" id="updateExerciseBtn" class="btn btn-primary">
                    <i class="fas fa-save me-1"></i> Update Exercise
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Custom CSS for the training page -->
<style>
.exercise-container {
    border: 1px solid rgba(0,0,0,.125);
    border-radius: 0.25rem;
    padding: 1rem;
    transition: all 0.2s ease-in-out;
    background-color: #fff;
    height: 100%;
}

.exercise-container:hover {
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.form-range {
    height: 1.5rem;
}

.badge {
    font-weight: 500;
}

.exercise-form-container {
    transition: all 0.3s ease-in-out;
}

.exercise-details {
    font-size: 0.95rem;
}

#quickTemplates .card {
    transition: all 0.2s ease-in-out;
    cursor: pointer;
}

#quickTemplates .card:hover {
    transform: translateY(-5px);
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.range-slider-container {
    display: flex;
    align-items: center;
    width: 100%;
}

.range-slider {
    flex-grow: 1;
    margin-right: 10px;
}

.range-value {
    min-width: 30px;
    text-align: center;
    font-weight: bold;
}
</style>

<!-- Load the training JS -->
<script src="assets/js/training.js"></script>

<!-- Script to ensure all links and form submissions point to track_training.php -->
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Update App.state to use track_training.php instead of training.php
    if (window.App && window.App.state) {
        // When deleting a session, redirect to track_training.php
        const originalDeleteSessionHandler = App.ui.deleteSessionHandler;
        if (originalDeleteSessionHandler) {
            App.ui.deleteSessionHandler = function() {
                const confirmed = confirm('Are you sure you want to delete this training session? This action cannot be undone.');
                if (!confirmed) return;
                
                App.state.isLoading = true;
                App.ui.showLoadingIndicator();
                
                fetch(`api/training_sessions.php?id=${App.state.sessionId}`, {
                    method: 'DELETE'
                })
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        App.ui.showToast('success', 'Training session deleted successfully');
                        window.location.href = 'track_training.php';
                    } else {
                        App.ui.showToast('danger', result.message || 'Failed to delete training session');
                    }
                })
                .catch(error => {
                    console.error('Error deleting session:', error);
                    App.ui.showToast('danger', 'An error occurred while deleting the session');
                })
                .finally(() => {
                    App.state.isLoading = false;
                    App.ui.hideLoadingIndicator();
                });
            };
        }

        // When session form is submitted, redirect to the correct URL
        const originalHandleSessionFormSubmit = App.data.handleSessionFormSubmit;
        if (originalHandleSessionFormSubmit) {
            // The training.js file now handles this logic with the show_exercise_form parameter
        }
    }

    // Fix any template links
    document.querySelectorAll('[data-template-action="start"]').forEach(button => {
        button.addEventListener('click', function(e) {
            const templateId = this.dataset.templateId;
            if (templateId) {
                window.location.href = `track_training.php?template_id=${templateId}`;
            }
        });
    });
});
</script>

<?php require_once 'includes/footer.php'; ?>