/**
 * Workout Templates Management JavaScript
 * Handles functionality for the workout templates page
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the page
    init();

    /**
     * Initialize the page
     */
    function init() {
        // Initialize the page
        setupEventHandlers();
        loadExerciseData();
        loadTemplates();
    }

    /**
     * Set up event handlers
     */
    function setupEventHandlers() {
        // New template button
        const createTemplateBtn = document.getElementById('createTemplateBtn');
        if (createTemplateBtn) {
            createTemplateBtn.addEventListener('click', openNewTemplateModal);
        }

        // Save template button - Use document-level event delegation for dynamically created elements
        document.addEventListener('click', function(e) {
            if (e.target && e.target.id === 'saveTemplateBtn') {
                saveTemplate();
            }
        });
        
        // Add exercise button (toggle form visibility)
        const addExerciseBtn = document.getElementById('addExerciseToTemplateBtn');
        if (addExerciseBtn) {
            addExerciseBtn.addEventListener('click', function() {
                const exerciseForm = document.getElementById('newTemplateExercise');
                if (exerciseForm) {
                    exerciseForm.style.display = 'block';
                    
                    // Populate the muscle group dropdown
                    populateMuscleGroupDropdown('newMuscleGroup');
                }
            });
        }
        
        // Cancel add exercise button
        const cancelAddExerciseBtn = document.getElementById('cancelAddExerciseBtn');
        if (cancelAddExerciseBtn) {
            cancelAddExerciseBtn.addEventListener('click', function() {
                document.getElementById('newTemplateExercise').style.display = 'none';
            });
        }
        
        // Save exercise to template button
        const saveExerciseBtn = document.getElementById('saveExerciseToTemplateBtn');
        if (saveExerciseBtn) {
            saveExerciseBtn.addEventListener('click', addExerciseToTemplate);
        }

        // Setup confirmation modal if it exists
        const confirmActionBtn = document.getElementById('confirmActionBtn');
        if (confirmActionBtn) {
            confirmActionBtn.addEventListener('click', handleConfirmedAction);
        }
        
        // Setup cascading dropdowns for the new exercise form
        setupNewExerciseDropdowns();
    }

    // Global exercise data storage
    let exerciseData = {
        muscleGroups: [],
        equipment: [],
        exercises: []
    };

    // Global template data for current operations
    let currentTemplateId = null;
    let pendingAction = null;

    /**
     * Load exercise data for dropdowns
     */
    function loadExerciseData() {
        fetch('api/exercise_library.php')
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    processExerciseData(result.data);
                    
                    // Initialize dropdowns with this data
                    populateMuscleGroupDropdown();
                    setupExerciseDropdowns();
                }
            })
            .catch(error => {
                console.error('Error loading exercise data:', error);
                showAlert('danger', 'Error loading exercise data. Please try again.');
            });
    }
    
    /**
     * Process exercise data from the API
     */
    function processExerciseData(data) {
        // Check if data is structured as expected
        if (!data || typeof data !== 'object') {
            console.error('Invalid exercise data format received');
            return;
        }

        // Handle both array format and object format with separate properties
        if (Array.isArray(data)) {
            // Extract unique muscle groups and equipment from array
            const muscleGroups = [...new Set(data.map(item => item.muscle_group))].sort();
            const equipment = [...new Set(data.map(item => item.equipment))].sort();
            
            // Store in global object
            exerciseData.muscleGroups = muscleGroups;
            exerciseData.equipment = equipment;
            exerciseData.exercises = data;
        } else {
            // Handle the case where data is an object with properties
            // such as { muscle_groups: [...], equipment: [...], exercises: [...] }
            if (data.muscle_groups) exerciseData.muscleGroups = data.muscle_groups;
            if (data.equipment) exerciseData.equipment = data.equipment;
            if (data.exercises) exerciseData.exercises = data.exercises;
        }

        console.log('Processed exercise data:', exerciseData);
    }
    
    /**
     * Populate muscle group dropdown
     */
    function populateMuscleGroupDropdown(dropdownId = 'exerciseMuscleGroup') {
        const select = document.getElementById(dropdownId);
        if (!select) return;
        
        // Clear options except the first
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        // Add options for each muscle group
        if (Array.isArray(exerciseData.muscleGroups)) {
            exerciseData.muscleGroups.forEach(group => {
                const option = document.createElement('option');
                option.value = typeof group === 'object' ? group.name : group;
                option.textContent = typeof group === 'object' ? group.name : group;
                select.appendChild(option);
            });
        }
    }
    
    /**
     * Set up cascading dropdowns for exercises
     */
    function setupExerciseDropdowns() {
        const muscleGroupSelect = document.getElementById('exerciseMuscleGroup');
        const equipmentSelect = document.getElementById('exerciseEquipment');
        const exerciseSelect = document.getElementById('exerciseName');
        
        if (!muscleGroupSelect || !equipmentSelect || !exerciseSelect) return;
        
        // When muscle group changes, update equipment options
        muscleGroupSelect.addEventListener('change', function() {
            updateEquipmentOptions(this.value);
            clearExerciseOptions();
        });
        
        // When equipment changes, update exercise options
        equipmentSelect.addEventListener('change', function() {
            const muscleGroup = muscleGroupSelect.value;
            const equipment = this.value;
            
            if (muscleGroup && equipment) {
                updateExerciseOptions(muscleGroup, equipment);
            } else {
                clearExerciseOptions();
            }
        });
    }
    
    /**
     * Setup cascading dropdowns for the new exercise form
     */
    function setupNewExerciseDropdowns() {
        const muscleGroupSelect = document.getElementById('newMuscleGroup');
        const equipmentSelect = document.getElementById('newEquipment');
        const exerciseSelect = document.getElementById('newExerciseName');
        
        if (!muscleGroupSelect || !equipmentSelect || !exerciseSelect) return;
        
        // When muscle group changes, update equipment options
        muscleGroupSelect.addEventListener('change', function() {
            updateEquipmentOptions(this.value, 'newEquipment');
            clearExerciseOptions('newExerciseName');
        });
        
        // When equipment changes, update exercise options
        equipmentSelect.addEventListener('change', function() {
            const muscleGroup = muscleGroupSelect.value;
            const equipment = this.value;
            
            if (muscleGroup && equipment) {
                updateExerciseOptions(muscleGroup, equipment, 'newExerciseName');
            } else {
                clearExerciseOptions('newExerciseName');
            }
        });
    }
    
    /**
     * Update equipment options based on selected muscle group
     */
    function updateEquipmentOptions(muscleGroup, dropdownId = 'exerciseEquipment') {
        const equipmentSelect = document.getElementById(dropdownId);
        if (!equipmentSelect) return;
        
        // Clear options except the first
        while (equipmentSelect.options.length > 1) {
            equipmentSelect.remove(1);
        }
        
        if (!muscleGroup || !Array.isArray(exerciseData.exercises)) return;
        
        // Get unique equipment types for this muscle group
        const availableEquipment = [...new Set(
            exerciseData.exercises
                .filter(item => {
                    const itemMuscleGroup = typeof item.muscle_group === 'object' 
                        ? item.muscle_group.name 
                        : item.muscle_group;
                    return itemMuscleGroup === muscleGroup;
                })
                .map(item => typeof item.equipment === 'object' ? item.equipment.name : item.equipment)
        )].sort();
        
        // Add options for each equipment type
        availableEquipment.forEach(eq => {
            const option = document.createElement('option');
            option.value = eq;
            option.textContent = eq;
            equipmentSelect.appendChild(option);
        });
    }
    
    /**
     * Update exercise options based on selected muscle group and equipment
     */
    function updateExerciseOptions(muscleGroup, equipment, dropdownId = 'exerciseName') {
        const exerciseSelect = document.getElementById(dropdownId);
        if (!exerciseSelect) return;
        
        // Clear options except the first
        while (exerciseSelect.options.length > 1) {
            exerciseSelect.remove(1);
        }
        
        if (!muscleGroup || !equipment || !Array.isArray(exerciseData.exercises)) return;
        
        // Get exercises for this muscle group and equipment
        const availableExercises = exerciseData.exercises
            .filter(item => {
                const itemMuscleGroup = typeof item.muscle_group === 'object' 
                    ? item.muscle_group.name 
                    : item.muscle_group;
                const itemEquipment = typeof item.equipment === 'object' 
                    ? item.equipment.name 
                    : item.equipment;
                return itemMuscleGroup === muscleGroup && itemEquipment === equipment;
            })
            .map(item => typeof item.name === 'string' ? item.name : item.exercise_name)
            .filter(name => !!name) // Filter out any undefined or empty values
            .sort();
        
        // Add options for each exercise
        availableExercises.forEach(ex => {
            const option = document.createElement('option');
            option.value = ex;
            option.textContent = ex;
            exerciseSelect.appendChild(option);
        });
    }
    
    /**
     * Clear exercise dropdown options
     */
    function clearExerciseOptions(dropdownId = 'exerciseName') {
        const exerciseSelect = document.getElementById(dropdownId);
        if (!exerciseSelect) return;
        
        // Clear options except the first
        while (exerciseSelect.options.length > 1) {
            exerciseSelect.remove(1);
        }
    }

    /**
     * Load templates from the API
     */
    function loadTemplates() {
        const templatesList = document.getElementById('templatesList');
        if (!templatesList) return;
        
        // Show loading state
        templatesList.innerHTML = `
            <div class="text-center py-3">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading templates...</p>
            </div>
        `;
        
        fetch('api/workout_templates.php')
            .then(response => response.json())
            .then(result => {
                if (result.success && result.data && result.data.length > 0) {
                    renderTemplates(result.data);
                } else {
                    templatesList.innerHTML = `
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>
                            No workout templates found. Create a new template to get started.
                        </div>
                    `;
                }
            })
            .catch(error => {
                console.error('Error loading templates:', error);
                templatesList.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        Error loading templates. Please try again.
                    </div>
                `;
            });
    }

    /**
     * Render templates in the templates list
     */
    function renderTemplates(templates) {
        const templatesList = document.getElementById('templatesList');
        if (!templatesList) return;
        
        let html = '';
        
        templates.forEach(template => {
            const isFavorite = template.is_favorite === '1' || template.is_favorite === 1 || template.is_favorite === true;
            const favoriteClass = isFavorite ? 'text-warning' : 'text-muted';
            
            html += `
                <div class="card mb-3 template-card" data-id="${template.id}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <h5 class="card-title">${template.name}</h5>
                            <div class="template-actions">
                                <button class="btn btn-sm btn-link toggle-favorite-btn" title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                                    <i class="fas fa-star ${favoriteClass}"></i>
                                </button>
                                <button class="btn btn-sm btn-link edit-template-btn" title="Edit template">
                                    <i class="fas fa-edit text-primary"></i>
                                </button>
                                <button class="btn btn-sm btn-link delete-template-btn" title="Delete template">
                                    <i class="fas fa-trash text-danger"></i>
                                </button>
                            </div>
                        </div>
                        
                        ${template.description ? `<p class="card-text text-muted">${template.description}</p>` : ''}
                        
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <span class="badge bg-info">${template.exercise_count} exercises</span>
                            <button class="btn btn-sm btn-primary use-template-btn">
                                <i class="fas fa-dumbbell me-1"></i> Use Template
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        templatesList.innerHTML = html;
        
        // Attach event listeners to the template cards
        attachTemplateCardListeners();
    }

    /**
     * Attach event listeners to template card buttons
     */
    function attachTemplateCardListeners() {
        // Edit template button
        document.querySelectorAll('.edit-template-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const templateId = this.closest('.template-card').dataset.id;
                openEditTemplateModal(templateId);
            });
        });
        
        // Delete template button
        document.querySelectorAll('.delete-template-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const templateId = this.closest('.template-card').dataset.id;
                confirmDeleteTemplate(templateId);
            });
        });
        
        // Toggle favorite button
        document.querySelectorAll('.toggle-favorite-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const templateId = this.closest('.template-card').dataset.id;
                toggleTemplateFavorite(templateId);
            });
        });
        
        // Use template button
        document.querySelectorAll('.use-template-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const templateId = this.closest('.template-card').dataset.id;
                useTemplate(templateId);
            });
        });
    }

    /**
     * Open modal for creating a new template
     */
    function openNewTemplateModal() {
        const modal = document.getElementById('templateModal');
        if (!modal) return;
        
        // Reset form
        const form = document.getElementById('templateForm');
        if (form) form.reset();
        
        // Clear template ID (for new template)
        const templateIdInput = document.getElementById('templateId');
        if (templateIdInput) templateIdInput.value = '';
        
        // Set title
        const modalTitle = document.getElementById('templateModalTitle');
        if (modalTitle) modalTitle.textContent = 'Create Workout Template';
        
        // Clear exercises list
        const templateExercises = document.getElementById('templateExercises');
        if (templateExercises) {
            templateExercises.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    No exercises added yet. Add your first exercise below.
                </div>
            `;
        }
        
        // Show the modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    /**
     * Open modal for editing an existing template
     * @param {string} templateId - ID of the template to edit
     */
    function openEditTemplateModal(templateId) {
        if (!templateId) return;
        
        currentTemplateId = templateId;
        
        // Show loading state
        const templateExercises = document.getElementById('templateExercises');
        if (templateExercises) {
            templateExercises.innerHTML = `
                <div class="text-center py-3">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-2">Loading template data...</p>
                </div>
            `;
        }
        
        // Get template details
        fetch(`api/workout_templates.php?id=${templateId}`)
            .then(response => response.json())
            .then(result => {
                if (result.success && result.data) {
                    // Populate form with template data
                    populateTemplateForm(result.data);
                    
                    // Load template exercises
                    loadTemplateExercises(templateId);
                    
                    // Set title
                    const modalTitle = document.getElementById('templateModalTitle');
                    if (modalTitle) modalTitle.textContent = 'Edit Workout Template';
                    
                    // Show the modal
                    const modal = document.getElementById('templateModal');
                    if (modal) {
                        // Remove any existing event listeners on the save button
                        const saveBtn = document.getElementById('saveTemplateBtn');
                        if (saveBtn) {
                            const newSaveBtn = saveBtn.cloneNode(true);
                            saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
                            newSaveBtn.addEventListener('click', saveTemplate);
                        }
                        
                        const bsModal = new bootstrap.Modal(modal);
                        bsModal.show();
                    }
                } else {
                    showAlert('danger', 'Failed to load template data');
                }
            })
            .catch(error => {
                console.error('Error loading template data:', error);
                showAlert('danger', 'Error loading template data. Please try again.');
            });
    }

    /**
     * Populate the template form with template data
     * @param {Object} templateData - Template data object
     */
    function populateTemplateForm(templateData) {
        const form = document.getElementById('templateForm');
        if (!form) return;
        
        // Set form values
        form.querySelector('#templateId').value = templateData.id;
        form.querySelector('#templateName').value = templateData.name;
        form.querySelector('#templateDescription').value = templateData.description || '';
        
        // Set favorite checkbox
        const isFavorite = templateData.is_favorite === '1' || templateData.is_favorite === 1 || templateData.is_favorite === true;
        form.querySelector('#isFavorite').checked = isFavorite;
    }

    /**
     * Load exercises for a template
     * @param {string} templateId - ID of the template to load exercises for
     */
    function loadTemplateExercises(templateId) {
        if (!templateId) return;
        
        fetch(`api/workout_templates.php?action=get_exercises&template_id=${templateId}`)
            .then(response => response.json())
            .then(result => {
                if (result.success && result.data) {
                    renderTemplateExercises(result.data);
                } else {
                    const templateExercises = document.getElementById('templateExercises');
                    if (templateExercises) {
                        templateExercises.innerHTML = `
                            <div class="alert alert-info">
                                <i class="fas fa-info-circle me-2"></i>
                                No exercises added to this template yet.
                            </div>
                        `;
                    }
                }
            })
            .catch(error => {
                console.error('Error loading template exercises:', error);
                showAlert('danger', 'Error loading template exercises. Please try again.');
            });
    }

    /**
     * Render exercises for a template
     * @param {Array} exercises - Array of exercise objects
     */
    function renderTemplateExercises(exercises) {
        const templateExercises = document.getElementById('templateExercises');
        if (!templateExercises || !exercises.length) return;
        
        let html = '<div class="list-group">';
        
        exercises.forEach(exercise => {
            html += `
                <div class="list-group-item template-exercise" data-id="${exercise.id}">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${exercise.exercise_name}</strong>
                            <div class="text-muted small">
                                ${exercise.muscle_group} / ${exercise.equipment}
                            </div>
                        </div>
                        <div class="d-flex gap-2 align-items-center">
                            <div class="small text-nowrap">
                                ${exercise.default_sets ? exercise.default_sets + ' sets' : ''} 
                                ${exercise.default_reps ? exercise.default_reps + ' reps' : ''}
                                ${exercise.default_weight ? exercise.default_weight + ' kg' : ''}
                            </div>
                            <button class="btn btn-sm btn-outline-danger delete-exercise-btn">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        templateExercises.innerHTML = html;
        
        // Attach event listeners to delete buttons
        document.querySelectorAll('.delete-exercise-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const exerciseId = this.closest('.template-exercise').dataset.id;
                confirmDeleteExercise(exerciseId);
            });
        });
    }

    /**
     * Save the template (create or update)
     * @param {Function} callback - Optional callback function to execute after successful save
     */
    function saveTemplate(callback) {
        const form = document.getElementById('templateForm');
        if (!form) return;
        
        // Get form data
        const templateId = form.querySelector('#templateId').value;
        const name = form.querySelector('#templateName').value.trim();
        const description = form.querySelector('#templateDescription').value.trim();
        const isFavorite = form.querySelector('#isFavorite').checked;
        
        // Validate form
        if (!name) {
            showAlert('danger', 'Template name is required', 'templateMessage');
            return;
        }
        
        // Prepare data
        const data = {
            name: name,
            description: description,
            is_favorite: isFavorite
        };
        
        // Add ID if updating
        if (templateId) {
            data.id = templateId;
        }
        
        // API endpoint and method
        const method = templateId ? 'PUT' : 'POST';
        const url = 'api/workout_templates.php';
        
        // Show loading state
        const saveBtn = document.getElementById('saveTemplateBtn');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
        }
        
        console.log('Saving template with data:', data);
        
        // Send request
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            console.log('Template save result:', result);
            
            if (result.success) {
                // Set current template ID for exercise operations
                if (result.template_id) {
                    currentTemplateId = result.template_id;
                    // Update the form's template ID field
                    const templateIdField = document.getElementById('templateId');
                    if (templateIdField) templateIdField.value = result.template_id;
                } else if (templateId) {
                    currentTemplateId = templateId;
                }
                
                // Show success message
                showAlert('success', result.message, 'templateMessage');
                
                // Check if callback is a function before calling it
                if (typeof callback === 'function') {
                    // Execute callback if provided and it's a function
                    callback();
                } else if (!callback) { // Only close modal and reload if no callback
                    // Close modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('templateModal'));
                    if (modal) modal.hide();
                    
                    // Reload templates
                    loadTemplates();
                }
            } else {
                showAlert('danger', result.message || 'Failed to save template', 'templateMessage');
            }
        })
        .catch(error => {
            console.error('Error saving template:', error);
            showAlert('danger', 'Error saving template. Please try again.', 'templateMessage');
        })
        .finally(() => {
            // Reset button
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = 'Save Template';
            }
        });
    }

    /**
     * Add an exercise to the template
     */
    function addExerciseToTemplate() {
        const muscleGroup = document.getElementById('newMuscleGroup').value;
        const equipment = document.getElementById('newEquipment').value;
        const exerciseName = document.getElementById('newExerciseName').value;
        const defaultSets = document.getElementById('defaultSets').value;
        const defaultReps = document.getElementById('defaultReps').value;
        const defaultWeight = document.getElementById('defaultWeight').value;
        const defaultRir = document.getElementById('defaultRir').value;
        
        // Validate inputs
        if (!muscleGroup || !equipment || !exerciseName) {
            showAlert('danger', 'Muscle group, equipment, and exercise name are required', 'templateMessage');
            return;
        }
        
        // Need a template ID
        if (!currentTemplateId) {
            // If creating a new template, we need to save it first
            if (!document.getElementById('templateId').value) {
                saveTemplate(function() {
                    // After template is saved, try adding the exercise again
                    addExerciseToTemplate();
                });
                return;
            }
            
            showAlert('danger', 'Please save the template first before adding exercises', 'templateMessage');
            return;
        }
        
        // Prepare data
        const data = {
            muscle_group: muscleGroup,
            equipment: equipment,
            exercise_name: exerciseName,
            default_sets: defaultSets || null,
            default_reps: defaultReps || null,
            default_weight: defaultWeight || null,
            default_rir: defaultRir || null
        };
        
        // Show loading state
        const saveBtn = document.getElementById('saveExerciseToTemplateBtn');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Adding...';
        }
        
        // Send request
        fetch(`api/workout_templates.php?action=create_exercise&template_id=${currentTemplateId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                // Show success message
                showAlert('success', result.message, 'templateMessage');
                
                // Reset form
                document.getElementById('newMuscleGroup').selectedIndex = 0;
                document.getElementById('newEquipment').selectedIndex = 0;
                document.getElementById('newExerciseName').selectedIndex = 0;
                document.getElementById('defaultSets').value = '';
                document.getElementById('defaultReps').value = '';
                document.getElementById('defaultWeight').value = '';
                document.getElementById('defaultRir').value = '';
                
                // Hide the form
                document.getElementById('newTemplateExercise').style.display = 'none';
                
                // Reload template exercises
                loadTemplateExercises(currentTemplateId);
            } else {
                showAlert('danger', result.message || 'Failed to add exercise', 'templateMessage');
            }
        })
        .catch(error => {
            console.error('Error adding exercise:', error);
            showAlert('danger', 'Error adding exercise. Please try again.', 'templateMessage');
        })
        .finally(() => {
            // Reset button
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = 'Add to Template';
            }
        });
    }

    /**
     * Confirm deleting a template
     * @param {string} templateId - ID of the template to delete
     */
    function confirmDeleteTemplate(templateId) {
        if (!templateId) return;
        
        // Store pending action
        currentTemplateId = templateId;
        pendingAction = 'deleteTemplate';
        
        // Show confirmation modal
        const confirmationMessage = document.getElementById('confirmationMessage');
        if (confirmationMessage) {
            confirmationMessage.textContent = 'Are you sure you want to delete this template? This action cannot be undone.';
        }
        
        const confirmModal = document.getElementById('confirmationModal');
        if (confirmModal) {
            const bsModal = new bootstrap.Modal(confirmModal);
            bsModal.show();
        }
    }

    /**
     * Confirm deleting an exercise from a template
     * @param {string} exerciseId - ID of the exercise to delete
     */
    function confirmDeleteExercise(exerciseId) {
        if (!exerciseId) return;
        
        // Store pending action
        pendingAction = 'deleteExercise';
        
        // Store exercise ID in the confirmation button data attribute
        const confirmBtn = document.getElementById('confirmActionBtn');
        if (confirmBtn) {
            confirmBtn.dataset.exerciseId = exerciseId;
        }
        
        // Show confirmation modal
        const confirmationMessage = document.getElementById('confirmationMessage');
        if (confirmationMessage) {
            confirmationMessage.textContent = 'Are you sure you want to remove this exercise from the template?';
        }
        
        const confirmModal = document.getElementById('confirmationModal');
        if (confirmModal) {
            const bsModal = new bootstrap.Modal(confirmModal);
            bsModal.show();
        }
    }

    /**
     * Handle confirmed action from confirmation modal
     */
    function handleConfirmedAction() {
        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('confirmationModal'));
        if (modal) modal.hide();
        
        // Perform the pending action
        if (pendingAction === 'deleteTemplate') {
            deleteTemplate(currentTemplateId);
        } else if (pendingAction === 'deleteExercise') {
            const confirmBtn = document.getElementById('confirmActionBtn');
            const exerciseId = confirmBtn ? confirmBtn.dataset.exerciseId : null;
            
            if (exerciseId) {
                deleteExercise(exerciseId);
                // Clean up
                confirmBtn.dataset.exerciseId = '';
            }
        }
        
        // Reset pending action
        pendingAction = null;
    }

    /**
     * Delete a template
     * @param {string} templateId - ID of the template to delete
     */
    function deleteTemplate(templateId) {
        if (!templateId) return;
        
        fetch('api/workout_templates.php', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: templateId })
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showAlert('success', result.message || 'Template deleted successfully');
                loadTemplates();
            } else {
                showAlert('danger', result.message || 'Failed to delete template');
            }
        })
        .catch(error => {
            console.error('Error deleting template:', error);
            showAlert('danger', 'Error deleting template. Please try again.');
        });
    }

    /**
     * Delete an exercise from a template
     * @param {string} exerciseId - ID of the exercise to delete
     */
    function deleteExercise(exerciseId) {
        if (!exerciseId) return;
        
        fetch(`api/workout_templates.php?action=delete_exercise&id=${exerciseId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showAlert('success', result.message || 'Exercise removed successfully', 'templateMessage');
                loadTemplateExercises(currentTemplateId);
            } else {
                showAlert('danger', result.message || 'Failed to remove exercise', 'templateMessage');
            }
        })
        .catch(error => {
            console.error('Error removing exercise:', error);
            showAlert('danger', 'Error removing exercise. Please try again.', 'templateMessage');
        });
    }

    /**
     * Toggle favorite status of a template
     * @param {string} templateId - ID of the template to toggle favorite status
     */
    function toggleTemplateFavorite(templateId) {
        if (!templateId) return;
        
        fetch(`api/workout_templates.php?action=toggle_favorite&template_id=${templateId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                // Just reload the templates to show the updated state
                loadTemplates();
            } else {
                showAlert('danger', result.message || 'Failed to update favorite status');
            }
        })
        .catch(error => {
            console.error('Error toggling favorite status:', error);
            showAlert('danger', 'Error updating favorite status. Please try again.');
        });
    }

    /**
     * Use a template (redirect to training page with template)
     * @param {string} templateId - ID of the template to use
     */
    function useTemplate(templateId) {
        if (!templateId) return;
        
        // Redirect to training page with template ID
        window.location.href = `track_training.php?template_id=${templateId}`;
    }

    /**
     * Show an alert message
     * @param {string} type - Alert type (success, danger, warning, info)
     * @param {string} message - Message to display
     * @param {string} containerId - ID of container to show alert in (default: 'alert-container')
     */
    function showAlert(type, message, containerId = 'alert-container') {
        const container = document.querySelector(`.${containerId}`);
        if (!container) return;
        
        const alertId = 'alert-' + Date.now();
        const alertHtml = `
            <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        
        container.innerHTML = alertHtml;
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            const alert = document.getElementById(alertId);
            if (alert) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, 5000);
    }
});