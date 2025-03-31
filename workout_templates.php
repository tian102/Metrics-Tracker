<?php 
require_once 'includes/header.php';
require_once 'includes/functions.php';

// Redirect if not logged in
requireLogin();

// Get user ID
$userId = $_SESSION['user_id'];
?>

<div class="card">
    <div class="card-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
        <h2 class="mb-2 mb-md-0">Workout Templates</h2>
        <div class="d-flex flex-wrap gap-2">
            <button id="createTemplateBtn" class="btn btn-primary"><i class="fas fa-plus"></i> Create Template</button>
        </div>
    </div>
    
    <div class="card-content">
        <!-- Alert container for notifications -->
        <div class="alert-container mb-3"></div>
        
        <div class="section-divider">
            <h3>My Templates</h3>
            <p class="text-muted">Create and manage workout templates to quickly start your training sessions.</p>
            
            <div id="templatesList">
                <!-- Templates will be loaded here via JavaScript -->
                <div class="text-center py-3">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-2">Loading templates...</p>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Template Editor Modal -->
<div class="modal fade" id="templateModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="templateModalTitle">Create Workout Template</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form id="templateForm">
                    <input type="hidden" id="templateId" name="id" value="">
                    
                    <div class="form-group mb-3">
                        <label for="templateName">Template Name:</label>
                        <input type="text" class="form-control" id="templateName" name="name" required>
                    </div>
                    
                    <div class="form-group mb-3">
                        <label for="templateDescription">Description:</label>
                        <textarea class="form-control" id="templateDescription" name="description" rows="2"></textarea>
                    </div>
                    
                    <div class="form-check mb-3">
                        <input type="checkbox" class="form-check-input" id="isFavorite" name="is_favorite" value="1">
                        <label class="form-check-label" for="isFavorite">Mark as favorite</label>
                    </div>
                    
                    <hr>
                    
                    <h5>Exercises</h5>
                    <p class="text-muted">Add exercises to your template:</p>
                    
                    <div id="templateExercises">
                        <!-- Exercises will be listed here -->
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>
                            No exercises added yet. Add your first exercise below.
                        </div>
                    </div>
                    
                    <button type="button" id="addExerciseToTemplateBtn" class="btn btn-secondary mt-3">
                        <i class="fas fa-plus"></i> Add Exercise
                    </button>
                    
                    <div id="newTemplateExercise" style="display: none;" class="mt-3 border p-3 rounded">
                        <h6>New Exercise</h6>
                        
                        <div class="row mb-3">
                            <div class="col-md-4">
                                <div class="form-group">
                                    <label for="newMuscleGroup">Muscle Group:</label>
                                    <select id="newMuscleGroup" name="muscle_group" class="form-select" required>
                                        <option value="">Select Muscle Group</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group">
                                    <label for="newEquipment">Equipment:</label>
                                    <select id="newEquipment" name="equipment" class="form-select" required>
                                        <option value="">Select Equipment</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-group">
                                    <label for="newExerciseName">Exercise Name:</label>
                                    <select id="newExerciseName" name="exercise_name" class="form-select" required>
                                        <option value="">Select Exercise</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row mb-3">
                            <div class="col-md-3">
                                <div class="form-group">
                                    <label for="defaultSets">Default Sets:</label>
                                    <input type="number" class="form-control" id="defaultSets" name="default_sets" min="1">
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <label for="defaultReps">Default Reps:</label>
                                    <input type="number" class="form-control" id="defaultReps" name="default_reps" min="1">
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <label for="defaultWeight">Default Weight (kg):</label>
                                    <input type="number" class="form-control" id="defaultWeight" name="default_weight" min="0" step="0.5">
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <label for="defaultRir">Default RIR:</label>
                                    <input type="number" class="form-control" id="defaultRir" name="default_rir" min="0">
                                </div>
                            </div>
                        </div>
                        
                        <div class="d-flex justify-content-end">
                            <button type="button" id="cancelAddExerciseBtn" class="btn btn-outline-secondary me-2">Cancel</button>
                            <button type="button" id="saveExerciseToTemplateBtn" class="btn btn-success">Add to Template</button>
                        </div>
                    </div>
                    
                    <div class="alert mt-3" id="templateMessage" style="display: none;"></div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" id="saveTemplateBtn" class="btn btn-primary">Save Template</button>
            </div>
        </div>
    </div>
</div>

<script src="assets/js/workout-templates.js"></script>

<!-- Confirmation Modal -->
<div class="modal fade" id="confirmationModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Confirm Action</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <p id="confirmationMessage"></p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" id="confirmActionBtn" class="btn btn-danger">Confirm</button>
            </div>
        </div>
    </div>
</div>

<?php require_once 'includes/footer.php'; ?>