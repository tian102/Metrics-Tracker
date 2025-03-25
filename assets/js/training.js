/**
 * Training Page JavaScript
 * Handles functionality for the training metrics page
 */

document.addEventListener('DOMContentLoaded', function() {
    // Global state for exercise data
    let exerciseData = {
        muscleGroups: [],
        equipment: [],
        exercises: []
    };

    // Initialize the page
    init();

    /**
     * INITIALIZATION
     */
    function init() {
        // Load exercise data from API
        loadExerciseData()
            .then(() => {
                // Once data is loaded, set up the forms
                setupForms();
                setupEventHandlers();
            })
            .catch(error => {
                console.error('Error initializing training page:', error);
                alert('Error loading exercise data. Please refresh the page.');
            });

        // Load session-specific data if we're on a session page
        const sessionId = new URLSearchParams(window.location.search).get('id');
        if (sessionId) {
            loadWorkoutDetails(sessionId);
        } else {
            loadRecentSessions();
        }
    }

    function loadExerciseData() {
        return fetch('api/exercise_library.php')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(result => {
                if (result.success) {
                    // Process and store the data
                    processExerciseData(result.data);
                    return Promise.resolve();
                } else {
                    return Promise.reject(new Error(result.message || 'Failed to load exercise data'));
                }
            });
    }

    /**
     * Process data from the API and normalize it for our application
     * @param {Object} data The exercise data object to process
     */
    function processExerciseData(data) {
        // Store muscle groups
        exerciseData.muscleGroups = data.muscle_groups || [];
        
        // Store equipment
        exerciseData.equipment = data.equipment || [];
        
        // Store exercises with normalized relationships
        exerciseData.exercises = data.exercises || [];
        
        console.log('Processed exercise data:', exerciseData);
    }

    /**
     * Load recent training sessions
     */
    function loadRecentSessions() {
        console.log('Loading recent training sessions');
        
        const recentSessions = document.getElementById('recentSessions');
        if (!recentSessions) return;
        
        recentSessions.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading recent sessions...</p>
            </div>
        `;
        
        fetch('api/training_sessions.php?action=recent')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(result => {
                if (result.success && result.data && result.data.length > 0) {
                    renderRecentSessions(result.data);
                } else {
                    recentSessions.innerHTML = `
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>
                            No recent training sessions found. Create a new session to get started.
                        </div>
                    `;
                }
            })
            .catch(error => {
                console.error('Error loading recent sessions:', error);
                recentSessions.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        Error loading recent sessions. Please try again.
                    </div>
                `;
            });
    }

    /**
     * Render recent training sessions
     * @param {Array} sessions - List of session data
     */
    function renderRecentSessions(sessions) {
        console.log('Rendering recent sessions:', sessions);
        
        const recentSessions = document.getElementById('recentSessions');
        if (!recentSessions) return;
        
        let html = `
            <div class="list-group">
        `;
        
        sessions.forEach(session => {
            // Format date
            const date = new Date(session.date);
            const formattedDate = date.toLocaleDateString();
            
            // Calculate duration if available
            let durationText = '';
            if (session.training_start && session.training_end) {
                const start = new Date(session.training_start);
                const end = new Date(session.training_end);
                const durationMinutes = Math.round((end - start) / (1000 * 60));
                durationText = `<span class="badge bg-secondary">${durationMinutes} min</span>`;
            }
            
            // Build exercise count badge
            const exerciseCountBadge = session.exercise_count > 0 ? 
                `<span class="badge bg-primary">${session.exercise_count} exercises</span>` : 
                '<span class="badge bg-secondary">No exercises</span>';
            
            html += `
                <a href="training.php?id=${session.id}" class="list-group-item list-group-item-action">
                    <div class="d-flex w-100 justify-content-between">
                        <h5 class="mb-1">${formattedDate}</h5>
                        ${durationText}
                    </div>
                    <p class="mb-1">
                        ${session.mesocycle_name ? session.mesocycle_name : 'Untitled Session'}
                        ${session.session_number ? '- Session ' + session.session_number : ''}
                    </p>
                    <div>
                        ${exerciseCountBadge}
                    </div>
                </a>
            `;
        });
        
        html += `
            </div>
        `;
        
        recentSessions.innerHTML = html;
    }

    /**
     * FORM SETUP
     */
    // Flag to prevent cascade events while restoring state
    let isRestoringState = false;

    function setupForms() {
        console.log('Setting up forms...');
        
        // Setup session form
        const sessionForm = document.getElementById('sessionForm');
        if (sessionForm) {
            sessionForm.addEventListener('submit', handleSessionFormSubmit);
        }

        // Setup new exercise form
        setupNewExerciseForm();
        
        // Setup existing exercise forms
        setupExistingExerciseForms();
        
        // Setup range sliders
        setupRangeSliders();
    }

    /**
     * Set up the new exercise form with cascading dropdowns
     */
    function setupNewExerciseForm() {
        // Get the workout details form - FIXED: Use the ID that matches the HTML
        const workoutDetailsForm = document.getElementById('workoutDetailsForm');
        if (!workoutDetailsForm) {
            console.log('Workout details form not found - may not be on session edit page');
            return;
        }

        console.log('Setting up new exercise form...');
        
        // FIXED: Use the correct IDs from the HTML
        const muscleGroupSelect = document.getElementById('newMuscleGroup');
        const equipmentSelect = document.getElementById('newEquipment');
        const exerciseSelect = document.getElementById('newExerciseName');
        
        if (!muscleGroupSelect || !equipmentSelect || !exerciseSelect) {
            console.error('One or more form elements not found', {
                muscleGroup: !!muscleGroupSelect,
                equipment: !!equipmentSelect,
                exercise: !!exerciseSelect
            });
            return;
        }

        // Populate muscle group dropdown
        populateMuscleGroupDropdown(muscleGroupSelect);

        // Clear equipment and exercise dropdowns initially
        clearDropdown(equipmentSelect, 'Select Equipment');
        clearDropdown(exerciseSelect, 'Select Exercise');

        // Add custom option functionality
        addCustomOptionSupport(muscleGroupSelect, equipmentSelect, exerciseSelect);
        
        // Set up form submission
        workoutDetailsForm.addEventListener('submit', handleNewExercise);
    }

    /**
     * Setup the existing exercise forms
     */
    function setupExistingExerciseForms() {
        const exerciseForms = document.querySelectorAll('.workout-detail-form');
        if (exerciseForms.length === 0) {
            console.log('No existing exercise forms found - may not be on session edit page');
            return;
        }

        console.log('Setting up existing exercise forms...');
        
        // Setup each form
        exerciseForms.forEach(form => {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                handleUpdateExistingExercise(this);
            });
            
            // Setup delete buttons
            const deleteBtn = form.closest('.exercise-container').querySelector('.delete-exercise-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', function() {
                    const exerciseId = form.querySelector('input[name="id"]').value;
                    handleDeleteExistingExercise(exerciseId);
                });
            }
        });
    }

    /**
     * Set up range sliders to update their value displays
     */
    function setupRangeSliders() {
        // For new exercise form
        const rangeInputs = document.querySelectorAll('.range-slider');
        
        rangeInputs.forEach(input => {
            // Initial value update
            const valueDisplay = input.nextElementSibling;
            if (valueDisplay && valueDisplay.classList.contains('range-value')) {
                valueDisplay.textContent = input.value;
            }
            
            // Input event listener
            input.addEventListener('input', function() {
                const valueDisplay = this.nextElementSibling;
                if (valueDisplay && valueDisplay.classList.contains('range-value')) {
                    valueDisplay.textContent = this.value;
                }
            });
        });
        
        // Specific inputs in new exercise form
        const newRangeInputs = [
            { input: 'newPreEnergyLevel', display: 'newPreEnergyLevelDisplay' },
            { input: 'newPreSorenessLevel', display: 'newPreSorenessLevelDisplay' },
            { input: 'newStimulus', display: 'newStimulusDisplay' },
            { input: 'newFatigueLevel', display: 'newFatigueLevelDisplay' }
        ];
        
        newRangeInputs.forEach(item => {
            const input = document.getElementById(item.input);
            const display = document.getElementById(item.display);
            
            if (input && display) {
                // Initial value
                display.textContent = input.value;
                
                // Update on change
                input.addEventListener('input', function() {
                    display.textContent = this.value;
                });
            }
        });
    }

    /**
     * Populate the muscle group dropdown with data
     * @param {HTMLSelectElement} select - The muscle group select element
     */
    function populateMuscleGroupDropdown(select) {
        // Clear current options
        clearDropdown(select, 'Select Muscle Group');
        
        // Add muscle group options
        if (exerciseData.muscleGroups && exerciseData.muscleGroups.length > 0) {
            console.log('Populating muscle groups:', exerciseData.muscleGroups.length);
            
            exerciseData.muscleGroups.forEach(group => {
                const option = document.createElement('option');
                option.value = group.name;
                option.textContent = group.name;
                select.appendChild(option);
            });
            
            // Add custom option
            const customOption = document.createElement('option');
            customOption.value = '__custom__';
            customOption.textContent = 'Add New Muscle Group...';
            customOption.classList.add('text-primary');
            select.appendChild(customOption);
        } else {
            console.warn('No muscle groups available to populate dropdown');
        }
    }

    /**
     * Setup cascading dropdown filters for muscle groups, equipment, and exercises
     * @param {HTMLSelectElement} muscleGroupSelect - Muscle group select element
     * @param {HTMLSelectElement} equipmentSelect - Equipment select element
     * @param {HTMLSelectElement} exerciseSelect - Exercise select element
     */
    function setupCascadingFilters(muscleGroupSelect, equipmentSelect, exerciseSelect) {
        console.log('Setting up cascading filters...');
        
        // When muscle group changes, update equipment options
        muscleGroupSelect.addEventListener('change', function() {
            if (isRestoringState) return;
            if (this.value === '__custom__' || this.value === '__loading__') return;
            
            console.log('Muscle group changed to:', this.value);
            
            const muscleGroupName = this.value;
            
            // Reset dependent dropdowns
            clearDropdown(equipmentSelect, 'Select Equipment');
            clearDropdown(exerciseSelect, 'Select Exercise');
            
            // Add custom options back
            const equipCustomOption = document.createElement('option');
            equipCustomOption.value = '__custom__';
            equipCustomOption.textContent = 'Add New Equipment...';
            equipCustomOption.classList.add('text-primary');
            equipmentSelect.appendChild(equipCustomOption);
            
            const exerCustomOption = document.createElement('option');
            exerCustomOption.value = '__custom__';
            exerCustomOption.textContent = 'Add New Exercise...';
            exerCustomOption.classList.add('text-primary');
            exerciseSelect.appendChild(exerCustomOption);
            
            if (!muscleGroupName) return;
            
            // Find muscle group ID
            const muscleGroup = exerciseData.muscleGroups.find(group => group.name === muscleGroupName);
            
            if (muscleGroup) {
                console.log('Updating equipment options for muscle group:', muscleGroup.name);
                populateEquipmentDropdown(equipmentSelect, muscleGroup.id);
            }
        });
        
        // When equipment changes, update exercise options
        equipmentSelect.addEventListener('change', function() {
            if (isRestoringState) return;
            if (this.value === '__custom__' || this.value === '__loading__') return;
            
            console.log('Equipment changed to:', this.value);
            
            const equipmentName = this.value;
            const muscleGroupName = muscleGroupSelect.value;
            
            // Reset dependent dropdown
            clearDropdown(exerciseSelect, 'Select Exercise');
            
            // Add custom option back
            const customOption = document.createElement('option');
            customOption.value = '__custom__';
            customOption.textContent = 'Add New Exercise...';
            customOption.classList.add('text-primary');
            exerciseSelect.appendChild(customOption);
            
            if (!equipmentName || !muscleGroupName) return;
            
            // Find muscle group and equipment IDs
            const muscleGroup = exerciseData.muscleGroups.find(group => group.name === muscleGroupName);
            const equipment = exerciseData.equipment.find(item => item.name === equipmentName);
            
            if (muscleGroup && equipment) {
                console.log('Updating exercise options for muscle group:', muscleGroup.name, 'and equipment:', equipment.name);
                populateExerciseDropdown(exerciseSelect, muscleGroup.id, equipment.id);
            }
        });
    }

    /**
     * Add custom option functionality to the dropdown menus
     * @param {HTMLSelectElement} muscleGroupSelect - The muscle group select element
     * @param {HTMLSelectElement} equipmentSelect - The equipment select element
     * @param {HTMLSelectElement} exerciseSelect - The exercise select element
     */
    function addCustomOptionSupport(muscleGroupSelect, equipmentSelect, exerciseSelect) {
        // Setup cascading filters first
        setupCascadingFilters(muscleGroupSelect, equipmentSelect, exerciseSelect);
        
        // Add custom option handlers
        addCustomOptionHandler(muscleGroupSelect, 'muscle_group', () => {
            // After adding a new muscle group, repopulate the dropdown
            populateMuscleGroupDropdown(muscleGroupSelect);
        });
        
        addCustomOptionHandler(equipmentSelect, 'equipment', () => {
            // After adding new equipment, get the current muscle group and repopulate
            const muscleGroupName = muscleGroupSelect.value;
            const muscleGroup = exerciseData.muscleGroups.find(g => g.name === muscleGroupName);
            if (muscleGroup) {
                populateEquipmentDropdown(equipmentSelect, muscleGroup.id);
            }
        });
        
        addCustomOptionHandler(exerciseSelect, 'exercise', () => {
            // After adding new exercise, get current muscle group and equipment
            const muscleGroupName = muscleGroupSelect.value;
            const equipmentName = equipmentSelect.value;
            
            const muscleGroup = exerciseData.muscleGroups.find(g => g.name === muscleGroupName);
            const equipment = exerciseData.equipment.find(e => e.name === equipmentName);
            
            if (muscleGroup && equipment) {
                populateExerciseDropdown(exerciseSelect, muscleGroup.id, equipment.id);
            }
        });
    }

    /**
     * Add a custom option handler to a select element
     * @param {HTMLSelectElement} select - The select element
     * @param {string} type - The type of data ('muscle_group', 'equipment', 'exercise')
     * @param {Function} callback - Function to call after adding
     */
    function addCustomOptionHandler(select, type, callback) {
        // Find or add the custom option
        let customOption = Array.from(select.options).find(opt => opt.value === '__custom__');
        
        if (!customOption) {
            customOption = document.createElement('option');
            customOption.value = '__custom__';
            customOption.textContent = `Add New ${type.charAt(0).toUpperCase() + type.slice(1)}...`;
            customOption.classList.add('text-primary');
            select.appendChild(customOption);
        }
        
        // Store original value
        let originalValue = select.value;
        
        // Add change event listener
        select.addEventListener('change', function() {
            if (this.value === '__custom__') {
                // Prompt for new value
                const newValue = prompt(`Enter new ${type} name:`);
                
                if (newValue && newValue.trim()) {
                    // Show loading state
                    this.disabled = true;
                    select.value = '__loading__';
                    
                    // Determine endpoint based on type
                    let endpoint;
                    let data = {};
                    
                    switch (type) {
                        case 'muscle_group':
                            endpoint = 'api/exercise_library.php?action=add_muscle_group';
                            data = { name: newValue };
                            break;
                        case 'equipment':
                            endpoint = 'api/exercise_library.php?action=add_equipment';
                            data = { name: newValue };
                            break;
                        case 'exercise':
                            endpoint = 'api/exercise_library.php?action=add_exercise';
                            const muscleGroupSelect = document.getElementById('newMuscleGroup') || document.getElementById('muscleGroup');
                            const equipmentSelect = document.getElementById('newEquipment') || document.getElementById('equipment');
                            
                            data = {
                                name: newValue,
                                muscle_group: muscleGroupSelect.value,
                                equipment: equipmentSelect.value
                            };
                            break;
                    }
                    
                    // Send API request
                    fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    })
                    .then(response => response.json())
                    .then(result => {
                        if (result.success) {
                            // Reload exercise data
                            return loadExerciseData().then(() => {
                                this.disabled = false;
                                
                                // Call callback to update dropdowns
                                if (callback) callback();
                                
                                // Set to new value if found
                                const option = Array.from(this.options).find(opt => opt.textContent === newValue);
                                if (option) {
                                    this.value = option.value;
                                    originalValue = option.value;
                                    
                                    // Trigger change event
                                    const event = new Event('change');
                                    this.dispatchEvent(event);
                                }
                                
                                return true;
                            });
                        } else {
                            throw new Error(result.message || `Failed to add ${type}`);
                        }
                    })
                    .catch(error => {
                        console.error(`Error adding ${type}:`, error);
                        alert(`Error: ${error.message}`);
                        this.disabled = false;
                        this.value = originalValue;
                    });
                } else {
                    // No value entered, revert to previous selection
                    this.value = originalValue;
                }
            } else {
                // Update original value for next time
                originalValue = this.value;
            }
        });
    }

    /**
     * Populate equipment dropdown based on muscle group selection
     * @param {HTMLSelectElement} equipmentSelect - Equipment select element to update
     * @param {number} muscleGroupId - Selected muscle group ID
     */
    function populateEquipmentDropdown(equipmentSelect, muscleGroupId) {
        // Clear current options but preserve custom option
        const customOption = Array.from(equipmentSelect.options).find(option => option.value === '__custom__');
        clearDropdown(equipmentSelect, 'Select Equipment');
        if (customOption) {
            equipmentSelect.appendChild(customOption);
        }
        
        // Find unique equipment used with this muscle group
        const equipmentUsedWithMuscleGroup = new Set();
        
        // Loop through all exercises with this muscle group
        exerciseData.exercises
            .filter(exercise => exercise.muscle_group_id === muscleGroupId)
            .forEach(exercise => {
                equipmentUsedWithMuscleGroup.add(exercise.equipment_id);
            });
        
        console.log(`Found ${equipmentUsedWithMuscleGroup.size} equipment options for muscle group ID ${muscleGroupId}`);
        
        // Get relevant equipment objects and sort them by name
        const relevantEquipment = exerciseData.equipment
            .filter(equipment => equipmentUsedWithMuscleGroup.has(equipment.id))
            .sort((a, b) => a.name.localeCompare(b.name));
        
        // Add equipment options
        relevantEquipment.forEach(equipment => {
            const option = document.createElement('option');
            option.value = equipment.name;
            option.textContent = equipment.name;
            equipmentSelect.appendChild(option);
        });
    }

    /**
     * Populate exercise dropdown based on muscle group and equipment selection
     * @param {HTMLSelectElement} exerciseSelect - Exercise select element to update
     * @param {number} muscleGroupId - Selected muscle group ID
     * @param {number} equipmentId - Selected equipment ID
     */
    function populateExerciseDropdown(exerciseSelect, muscleGroupId, equipmentId) {
        // Clear current options but preserve custom option
        const customOption = Array.from(exerciseSelect.options).find(option => option.value === '__custom__');
        clearDropdown(exerciseSelect, 'Select Exercise');
        if (customOption) {
            exerciseSelect.appendChild(customOption);
        }
        
        // Find exercises that match both muscle group and equipment
        const filteredExercises = exerciseData.exercises
            .filter(exercise => 
                exercise.muscle_group_id === muscleGroupId && 
                exercise.equipment_id === equipmentId
            )
            .sort((a, b) => a.name.localeCompare(b.name));
        
        console.log(`Found ${filteredExercises.length} exercises for muscle group ID ${muscleGroupId} and equipment ID ${equipmentId}`);
        
        // Add filtered exercise options
        filteredExercises.forEach(exercise => {
            const option = document.createElement('option');
            option.value = exercise.name;
            option.textContent = exercise.name;
            exerciseSelect.appendChild(option);
        });
    }

    /**
     * Clear a dropdown and add a default option
     * @param {HTMLSelectElement} select - The select element to clear
     * @param {string} defaultText - The text for the default option
     */
    function clearDropdown(select, defaultText) {
        select.innerHTML = '';
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = defaultText;
        select.appendChild(defaultOption);
    }

    /**
     * Load workout details for a specific session
     * @param {number} sessionId - The session ID to load details for
     */
    function loadWorkoutDetails(sessionId) {
        console.log('Loading workout details for session ID:', sessionId);
        
        const exercisesList = document.getElementById('exercisesList');
        if (!exercisesList) return;
        
        exercisesList.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading exercises...</p>
            </div>
        `;
        
        fetch(`api/workout_details.php?session_id=${sessionId}`)
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    renderExercisesList(result.data);
                } else {
                    exercisesList.innerHTML = `
                        <div class="alert alert-warning">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            ${result.message || 'No exercises found for this training session'}
                        </div>
                    `;
                }
            })
            .catch(error => {
                console.error('Error loading workout details:', error);
                exercisesList.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        Error loading exercises. Please try again.
                    </div>
                `;
            });
    }

    /**
     * Render exercises list for a training session
     * @param {Array} exercises - List of exercise data
     */
    function renderExercisesList(exercises) {
        console.log('Rendering exercises list:', exercises);
        
        const exercisesList = document.getElementById('exercisesList');
        if (!exercisesList) return;
        
        if (!exercises || exercises.length === 0) {
            exercisesList.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    No exercises added to this training session yet.
                </div>
            `;
            return;
        }
        
        let html = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Exercise</th>
                            <th>Sets</th>
                            <th>Reps</th>
                            <th>Weight</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        exercises.forEach(exercise => {
            html += `
                <tr>
                    <td>
                        <strong>${exercise.exercise_name}</strong><br>
                        <small class="text-muted">${exercise.muscle_group} | ${exercise.equipment}</small>
                    </td>
                    <td>${exercise.sets}</td>
                    <td>${exercise.reps}</td>
                    <td>${exercise.load_weight} kg</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary edit-exercise" data-id="${exercise.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        exercisesList.innerHTML = html;
        
        // Add event listeners to edit buttons
        document.querySelectorAll('.edit-exercise').forEach(button => {
            button.addEventListener('click', function() {
                const exerciseId = this.getAttribute('data-id');
                openEditExerciseModal(exerciseId);
            });
        });
    }

    /**
     * Open exercise edit modal with exercise data
     * @param {number} exerciseId - The exercise ID to edit
     */
    function openEditExerciseModal(exerciseId) {
        console.log('Opening edit modal for exercise ID:', exerciseId);
        
        fetch(`api/workout_details.php?id=${exerciseId}`)
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    const exercise = result.data;
                    
                    // Set form values
                    document.getElementById('editExerciseId').value = exercise.id;
                    
                    // Set form fields
                    isRestoringState = true; // Prevent cascading events during setup
                    
                    // Set muscle group
                    const muscleGroupSelect = document.getElementById('editMuscleGroup');
                    muscleGroupSelect.value = exercise.muscle_group;
                    
                    // Get muscle group ID
                    const muscleGroup = exerciseData.muscleGroups.find(g => g.name === exercise.muscle_group);
                    
                    if (muscleGroup) {
                        // Populate equipment dropdown based on muscle group
                        populateEquipmentDropdown(document.getElementById('editEquipment'), muscleGroup.id);
                        
                        // Set equipment
                        document.getElementById('editEquipment').value = exercise.equipment;
                        
                        // Get equipment ID
                        const equipment = exerciseData.equipment.find(e => e.name === exercise.equipment);
                        
                        if (equipment) {
                            // Populate exercise dropdown based on muscle group and equipment
                            populateExerciseDropdown(
                                document.getElementById('editExerciseName'), 
                                muscleGroup.id, 
                                equipment.id
                            );
                            
                            // Set exercise name
                            document.getElementById('editExerciseName').value = exercise.exercise_name;
                        }
                    }
                    
                    // Set other form fields
                    document.getElementById('editPreEnergyLevel').value = exercise.pre_energy_level || '';
                    document.getElementById('editPreSorenessLevel').value = exercise.pre_soreness_level || '';
                    document.getElementById('editSets').value = exercise.sets;
                    document.getElementById('editReps').value = exercise.reps;
                    document.getElementById('editLoadWeight').value = exercise.load_weight;
                    document.getElementById('editRir').value = exercise.rir || '';
                    document.getElementById('editStimulus').value = exercise.stimulus || '';
                    document.getElementById('editFatigueLevel').value = exercise.fatigue_level || '';
                    
                    // Update range slider displays
                    if (document.getElementById('editEnergyValue')) {
                        document.getElementById('editEnergyValue').textContent = exercise.pre_energy_level || '5';
                    }
                    if (document.getElementById('editSorenessValue')) {
                        document.getElementById('editSorenessValue').textContent = exercise.pre_soreness_level || '5';
                    }
                    if (document.getElementById('editStimulusValue')) {
                        document.getElementById('editStimulusValue').textContent = exercise.stimulus || '5';
                    }
                    
                    // Reset flag
                    isRestoringState = false;
                    
                    // Show modal
                    const modal = new bootstrap.Modal(document.getElementById('editExerciseModal'));
                    modal.show();
                } else {
                    alert(result.message || 'Error loading exercise details');
                }
            })
            .catch(error => {
                console.error('Error loading exercise details:', error);
                alert('Error loading exercise details. Please try again.');
            });
    }

    /**
     * EVENT HANDLERS
     */
    function setupEventHandlers() {
        // Add exercise button
        const addExerciseBtn = document.getElementById('addExerciseBtn');
        if (addExerciseBtn) {
            addExerciseBtn.addEventListener('click', function() {
                document.getElementById('newExerciseForm').style.display = 'block';
                this.style.display = 'none';
            });
        }

        // Cancel add exercise button
        const cancelAddExerciseBtn = document.getElementById('cancelAddExercise');
        if (cancelAddExerciseBtn) {
            cancelAddExerciseBtn.addEventListener('click', function() {
                document.getElementById('newExerciseForm').style.display = 'none';
                document.getElementById('addExerciseBtn').style.display = 'block';
            });
        }

        // Delete session button
        const deleteSessionBtn = document.getElementById('deleteSessionBtn');
        if (deleteSessionBtn) {
            deleteSessionBtn.addEventListener('click', handleDeleteSession);
        }
    }

    /**
     * Handle training session form submission
     * @param {Event} event - Form submit event
     */
    function handleSessionFormSubmit(event) {
        event.preventDefault();
        console.log('Submitting training session form');
        
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Format time fields
        if (data.date && data.training_start_time) {
            data.training_start = `${data.date} ${data.training_start_time}:00`;
            delete data.training_start_time;
        }
        
        if (data.date && data.training_end_time) {
            data.training_end = `${data.date} ${data.training_end_time}:00`;
            delete data.training_end_time;
        }
        
        const isEdit = !!data.id;
        const url = 'api/training_sessions.php';
        const method = isEdit ? 'PUT' : 'POST';
        
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(result => {
            if (result.success) {
                if (isEdit) {
                    // Just show success message for edits
                    showSessionMessage('success', 'Training session updated successfully');
                } else {
                    // Redirect to the new session page for new sessions
                    showSessionMessage('success', 'Training session created! Redirecting...');
                    setTimeout(() => {
                        window.location.href = `training.php?id=${result.session_id}`;
                    }, 1000);
                }
            } else {
                showSessionMessage('danger', result.message || 'Failed to save training session');
            }
        })
        .catch(error => {
            console.error('Error saving training session:', error);
            showSessionMessage('danger', 'An error occurred. Please try again.');
        })
        .finally(() => {
            // Restore button state
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        });
    }

    /**
     * Show session message
     * @param {string} type - Alert type (success, danger, warning, info)
     * @param {string} message - Message to display
     */
    function showSessionMessage(type, message) {
        const alertElement = document.getElementById('sessionAlertMessage');
        if (!alertElement) return;
        
        alertElement.className = `alert alert-${type} mt-3`;
        alertElement.innerHTML = message;
        alertElement.style.display = 'block';
        
        // Auto-hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                alertElement.style.display = 'none';
            }, 3000);
        }
    }

    /**
     * Show workout message
     * @param {string} type - Alert type (success, danger, warning, info)
     * @param {string} message - Message to display
     * @param {Element} container - Element to show message in
     */
    function showWorkoutMessage(type, message, container) {
        if (!container) return;
        
        container.className = `alert alert-${type} mt-3`;
        container.innerHTML = message;
        container.style.display = 'block';
        
        // Auto-hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                container.style.display = 'none';
            }, 3000);
        }
    }

    /**
     * Handle adding a new exercise
     * @param {Event} event - Form submit event
     */
    function handleNewExercise(event) {
        event.preventDefault();
        console.log('Adding new exercise');
        
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
        
        fetch('api/workout_details.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showWorkoutMessage('success', 'Exercise added successfully', document.getElementById('workoutAlertMessage'));
                
                // Reset form
                form.reset();
                
                // Reset cascading dropdowns
                document.getElementById('newMuscleGroup').value = '';
                clearDropdown(document.getElementById('newEquipment'), 'Select Equipment');
                clearDropdown(document.getElementById('newExerciseName'), 'Select Exercise');
                
                // Re-add custom options
                addCustomOptionSupport(
                    document.getElementById('newMuscleGroup'),
                    document.getElementById('newEquipment'),
                    document.getElementById('newExerciseName')
                );
                
                // Reset range sliders
                document.getElementById('newPreEnergyLevelDisplay').textContent = '5';
                document.getElementById('newPreSorenessLevelDisplay').textContent = '5';
                document.getElementById('newStimulusDisplay').textContent = '5';
                document.getElementById('newFatigueLevelDisplay').textContent = '5';
                
                // Hide new exercise form
                document.getElementById('newExerciseForm').style.display = 'none';
                // Show the add exercise button
                document.getElementById('addExerciseBtn').style.display = 'block';
                
                // Fetch and add the new exercise to the page without full refresh
                fetchAndRenderNewExercise(data.session_id);
            } else {
                showWorkoutMessage('danger', result.message || 'Failed to add exercise', document.getElementById('workoutAlertMessage'));
            }
        })
        .catch(error => {
            console.error('Error adding exercise:', error);
            showWorkoutMessage('danger', 'An error occurred. Please try again.', document.getElementById('workoutAlertMessage'));
        })
        .finally(() => {
            // Restore button state
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        });
    }

    /**
     * Fetch and render the newly added exercise
     * @param {number} sessionId - The session ID
     */
    function fetchAndRenderNewExercise(sessionId) {
        fetch(`api/workout_details.php?session_id=${sessionId}`)
            .then(response => response.json())
            .then(result => {
                if (result.success && result.data && result.data.length > 0) {
                    // Get existing exercises container
                    let existingExercises = document.getElementById('existingExercises');
                    
                    // If container doesn't exist, create it
                    if (!existingExercises) {
                        existingExercises = document.createElement('div');
                        existingExercises.id = 'existingExercises';
                        
                        // Insert before the add exercise button
                        const addExerciseBtn = document.getElementById('addExerciseBtn');
                        addExerciseBtn.parentNode.insertBefore(existingExercises, addExerciseBtn);
                        
                        // Remove any "No exercises added yet" message
                        const noExercisesMsg = addExerciseBtn.previousElementSibling;
                        if (noExercisesMsg && noExercisesMsg.tagName === 'P') {
                            noExercisesMsg.remove();
                        }
                    }
                    
                    // Get the most recently added exercise (last in the array)
                    const newExercise = result.data[result.data.length - 1];
                    
                    // Create exercise container
                    renderExerciseItem(newExercise, existingExercises);
                    
                    // Set up event handlers for the new exercise
                    setupExistingExerciseForms();
                }
            })
            .catch(error => {
                console.error('Error fetching new exercise:', error);
            });
    }

    /**
     * Render a single exercise item
     * @param {Object} exercise - The exercise data
     * @param {HTMLElement} container - The container to append to
     */
    function renderExerciseItem(exercise, container) {
        const index = container.children.length;
        
        // Create exercise HTML
        const exerciseHtml = `
            <div class="exercise-container" data-id="${exercise.id}" data-equipment="${exercise.equipment || ''}">
                <div class="exercise-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
                    <h4 class="exercise-title mb-2 mb-md-0">${exercise.exercise_name} (${exercise.muscle_group})</h4>
                    <div class="d-flex flex-wrap gap-2">
                        <button type="button" class="btn btn-danger delete-exercise-btn">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                
                <form class="workout-detail-form">
                    <input type="hidden" name="id" value="${exercise.id}">
                    
                    <div class="form-row">
                        <div class="form-col">
                            <div class="form-group">
                                <label for="muscleGroup_${index}">Muscle Group:</label>
                                <input type="text" id="muscleGroup_${index}" name="muscle_group" 
                                    value="${exercise.muscle_group}" required>
                            </div>
                        </div>
                        <div class="form-col">
                            <div class="form-group">
                                <label for="equipment_${index}">Equipment:</label>
                                <input type="text" id="equipment_${index}" name="equipment" 
                                    value="${exercise.equipment || ''}" required>
                            </div>
                        </div>
                        <div class="form-col">
                            <div class="form-group">
                                <label for="exerciseName_${index}">Exercise Name:</label>
                                <input type="text" id="exerciseName_${index}" name="exercise_name" 
                                    value="${exercise.exercise_name}" required>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Pre-Exercise Review -->
                    <div class="form-row">
                        <div class="form-col">
                            <div class="form-group">
                                <label for="preEnergyLevel_${index}">Pre-Exercise Energy Level (1-10):</label>
                                <input type="range" id="preEnergyLevel_${index}" name="pre_energy_level" min="1" max="10" step="1" 
                                    value="${exercise.pre_energy_level || 5}" class="range-slider">
                                <span class="range-value">${exercise.pre_energy_level || 5}</span>
                            </div>
                        </div>
                        <div class="form-col">
                            <div class="form-group">
                                <label for="preSorenessLevel_${index}">Pre-Exercise Soreness Level (1-10):</label>
                                <input type="range" id="preSorenessLevel_${index}" name="pre_soreness_level" min="1" max="10" step="1" 
                                    value="${exercise.pre_soreness_level || 5}" class="range-slider">
                                <span class="range-value">${exercise.pre_soreness_level || 5}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Exercise Data -->
                    <div class="form-row">
                        <div class="form-col">
                            <div class="form-group">
                                <label for="sets_${index}">Sets:</label>
                                <input type="number" id="sets_${index}" name="sets" min="1" 
                                    value="${exercise.sets || ''}">
                            </div>
                        </div>
                        <div class="form-col">
                            <div class="form-group">
                                <label for="reps_${index}">Reps:</label>
                                <input type="number" id="reps_${index}" name="reps" min="1" 
                                    value="${exercise.reps || ''}">
                            </div>
                        </div>
                        <div class="form-col">
                            <div class="form-group">
                                <label for="loadWeight_${index}">Load Weight (kg):</label>
                                <input type="number" id="loadWeight_${index}" name="load_weight" min="0" step="0.5" 
                                    value="${exercise.load_weight || ''}">
                            </div>
                        </div>
                        <div class="form-col">
                            <div class="form-group">
                                <label for="rir_${index}">RIR (Reps In Reserve):</label>
                                <input type="number" id="rir_${index}" name="rir" min="0" 
                                    value="${exercise.rir || ''}">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Post-Exercise Review -->
                    <div class="form-row">
                        <div class="form-col">
                            <div class="form-group">
                                <label for="stimulus_${index}">Stimulus (1-10):</label>
                                <input type="range" id="stimulus_${index}" name="stimulus" min="1" max="10" step="1" 
                                    value="${exercise.stimulus || 5}" class="range-slider">
                                <span class="range-value">${exercise.stimulus || 5}</span>
                            </div>
                        </div>
                        <div class="form-col">
                            <div class="form-group">
                                <label for="fatigueLevel_${index}">Fatigue Level (1-10):</label>
                                <input type="range" id="fatigueLevel_${index}" name="fatigue_level" min="1" max="10" step="1" 
                                    value="${exercise.fatigue_level || 5}" class="range-slider">
                                <span class="range-value">${exercise.fatigue_level || 5}</span>
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
        `;
        
        // Append to container
        if (container.innerHTML.trim() === '') {
            container.innerHTML = exerciseHtml;
        } else {
            container.insertAdjacentHTML('beforeend', exerciseHtml);
        }
        
        // Setup range sliders for the new exercise
        const newRangeSliders = container.querySelectorAll('.range-slider');
        newRangeSliders.forEach(slider => {
            slider.addEventListener('input', function() {
                const valueDisplay = this.nextElementSibling;
                if (valueDisplay && valueDisplay.classList.contains('range-value')) {
                    valueDisplay.textContent = this.value;
                }
            });
        });
    }

    /**
     * Handle updating an exercise
     */
    function handleUpdateExercise() {
        console.log('Updating exercise');
        
        const form = document.getElementById('editExerciseForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        fetch('api/workout_details.php', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('editExerciseModal'));
                modal.hide();
                
                showSessionMessage('success', 'Exercise updated successfully');
                
                // Reload exercise list
                const sessionId = new URLSearchParams(window.location.search).get('id');
                loadWorkoutDetails(sessionId);
            } else {
                showWorkoutMessage('danger', result.message || 'Failed to update exercise', document.querySelector('.modal-body .alert'));
            }
        })
        .catch(error => {
            console.error('Error updating exercise:', error);
            showWorkoutMessage('danger', 'An error occurred. Please try again.', document.querySelector('.modal-body .alert'));
        });
    }

    /**
     * Handle deleting an exercise
     */
    function handleDeleteExercise() {
        console.log('Deleting exercise');
        
        const exerciseId = document.getElementById('editExerciseId').value;
        
        if (!confirm('Are you sure you want to delete this exercise? This action cannot be undone.')) {
            return;
        }
        
        fetch('api/workout_details.php', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: exerciseId })
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('editExerciseModal'));
                modal.hide();
                
                showSessionMessage('success', 'Exercise deleted successfully');
                
                // Reload exercise list
                const sessionId = new URLSearchParams(window.location.search).get('id');
                loadWorkoutDetails(sessionId);
            } else {
                showWorkoutMessage('danger', result.message || 'Failed to delete exercise', document.querySelector('.modal-body .alert'));
            }
        })
        .catch(error => {
            console.error('Error deleting exercise:', error);
            showWorkoutMessage('danger', 'An error occurred. Please try again.', document.querySelector('.modal-body .alert'));
        });
    }

    /**
     * Handle deleting a training session
     */
    function handleDeleteSession() {
        console.log('Deleting training session');
        
        const sessionId = new URLSearchParams(window.location.search).get('id');
        
        if (!confirm('Are you sure you want to delete this training session? This will also delete all exercises in this session. This action cannot be undone.')) {
            return;
        }
        
        fetch('api/training_sessions.php', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: sessionId })
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showSessionMessage('success', 'Training session deleted successfully');
                
                // Redirect to training page
                setTimeout(() => {
                    window.location.href = 'training.php';
                }, 1000);
            } else {
                showSessionMessage('danger', result.message || 'Failed to delete training session');
            }
        })
        .catch(error => {
            console.error('Error deleting training session:', error);
            showSessionMessage('danger', 'An error occurred. Please try again.');
        });
    }

    /**
     * Show a message to the user
     * @param {string} title - Message title
     * @param {string} message - Message text
     * @param {string} type - Message type (success, danger, warning, info)
     * @param {HTMLElement} container - Optional container to add message to
     */
    function showMessage(title, message, type, container = null) {
        // Create alert element
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `
            <strong>${title}:</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        // Add to container or body
        if (container) {
            container.insertBefore(alert, container.firstChild);
        } else {
            const mainContent = document.querySelector('.row');
            if (mainContent) {
                mainContent.insertBefore(alert, mainContent.firstChild);
            } else {
                document.body.insertBefore(alert, document.body.firstChild);
            }
        }
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    }
});