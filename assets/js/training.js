document.addEventListener('DOMContentLoaded', function() {
    // Global state for exercise data
    let exerciseData = {
        muscleGroups: [],
        equipment: [],
        exercises: []
    };

    /**
     * INITIALIZATION
     */
    function init() {
        loadExerciseData()
            .then(() => {
                setupForms();
                setupEventHandlers();
            })
            .catch(error => {
                console.error('Failed to initialize:', error);
            });
    }

    function loadExerciseData() {
        return Promise.all([
            fetch('api/exercise_library.php?action=muscle_groups'),
            fetch('api/exercise_library.php?action=equipment'),
            fetch('api/exercise_library.php?action=search')
        ])
        .then(responses => Promise.all(responses.map(r => r.json())))
        .then(([muscleGroups, equipment, exercises]) => {
            console.log('Raw API responses:', { muscleGroups, equipment, exercises });
            
            if (muscleGroups.success) {
                exerciseData.muscleGroups = muscleGroups.data;
            }
            if (equipment.success) {
                exerciseData.equipment = equipment.data;
            }
            if (exercises.success) {
                exerciseData.exercises = exercises.data;
            }
    
            console.log('Processed exercise data:', exerciseData);
        });
    }

    /**
     * FORM SETUP
     */
    function setupForms() {
        setupNewExerciseForm();
        setupExistingExerciseForms();
    }

    function setupNewExerciseForm() {
        const form = document.getElementById('newExerciseForm');
        if (!form) return;

        const muscleGroupSelect = createFilterSelect('muscle_group', exerciseData.muscleGroups);
        const equipmentSelect = createFilterSelect('equipment', exerciseData.equipment);
        const exerciseSelect = createFilterSelect('exercise_name', exerciseData.exercises);

        // Replace existing inputs with new selects
        replaceInput(form, '[name="muscle_group"]', muscleGroupSelect);
        replaceInput(form, '[name="equipment"]', equipmentSelect);
        replaceInput(form, '[name="exercise_name"]', exerciseSelect);

        // Setup cascading filters
        setupCascadingFilters(muscleGroupSelect, equipmentSelect, exerciseSelect);
    }

    function setupExistingExerciseForms() {
        document.querySelectorAll('.workout-detail-form').forEach(form => {
            const muscleGroupSelect = createFilterSelect('muscle_group', exerciseData.muscleGroups);
            const equipmentSelect = createFilterSelect('equipment', exerciseData.equipment);
            const exerciseSelect = createFilterSelect('exercise_name', exerciseData.exercises);

            replaceInput(form, '[name="muscle_group"]', muscleGroupSelect);
            replaceInput(form, '[name="equipment"]', equipmentSelect);
            replaceInput(form, '[name="exercise_name"]', exerciseSelect);

            setupCascadingFilters(muscleGroupSelect, equipmentSelect, exerciseSelect);
        });
    }

    /**
     * FILTER FUNCTIONALITY
     */
    function createFilterSelect(name, options) {
        const select = document.createElement('select');
        select.className = 'form-select';
        select.name = name;
        select.required = true;
    
        // Add default option
        select.appendChild(new Option('Select ' + name.replace('_', ' '), ''));
    
        // Add available options with proper mapping based on select type
        if (name === 'muscle_group') {
            options.forEach(option => {
                select.appendChild(new Option(option.name, option.id));
            });
        } else if (name === 'equipment') {
            options.forEach(option => {
                select.appendChild(new Option(option.name, option.id));
            });
        } else if (name === 'exercise_name') {
            options.forEach(option => {
                select.appendChild(new Option(option.exercise_name, option.id));
            });
        }
    
        console.log(`Created ${name} select with ${options.length} options`);
        return select;
    }

    function setupCascadingFilters(muscleGroupSelect, equipmentSelect, exerciseSelect) {
        muscleGroupSelect.addEventListener('change', () => {
            updateEquipmentOptions(muscleGroupSelect.value, equipmentSelect);
            updateExerciseOptions(muscleGroupSelect.value, equipmentSelect.value, exerciseSelect);
        });

        equipmentSelect.addEventListener('change', () => {
            updateExerciseOptions(muscleGroupSelect.value, equipmentSelect.value, exerciseSelect);
        });
    }

    function updateEquipmentOptions(muscleGroupId, equipmentSelect) {
        console.log('Updating equipment options for muscle group ID:', muscleGroupId);
        console.log('Current exercises data:', exerciseData.exercises);
        
        const filteredEquipment = muscleGroupId ? 
            exerciseData.equipment.filter(eq => 
                exerciseData.exercises.some(ex => 
                    // Compare muscle_group names instead of IDs
                    ex.muscle_group === exerciseData.muscleGroups.find(mg => mg.id === parseInt(muscleGroupId))?.name &&
                    ex.equipment === eq.name
                )
            ) : exerciseData.equipment;
    
        console.log('Filtered equipment:', filteredEquipment);
        updateSelectOptions(equipmentSelect, filteredEquipment, 'equipment');
    }

    function updateExerciseOptions(muscleGroupId, equipmentId, exerciseSelect) {
        console.log('Updating exercise options:', {muscleGroupId, equipmentId});
        console.log('Available exercises:', exerciseData.exercises);
        
        let filteredExercises = exerciseData.exercises;
    
        if (muscleGroupId) {
            const selectedMuscleGroup = exerciseData.muscleGroups.find(mg => mg.id === parseInt(muscleGroupId))?.name;
            filteredExercises = filteredExercises.filter(ex => ex.muscle_group === selectedMuscleGroup);
        }
    
        if (equipmentId) {
            const selectedEquipment = exerciseData.equipment.find(eq => eq.id === parseInt(equipmentId))?.name;
            filteredExercises = filteredExercises.filter(ex => ex.equipment === selectedEquipment);
        }
    
        console.log('Filtered exercises:', filteredExercises);
        updateSelectOptions(exerciseSelect, filteredExercises, 'exercise');
    }

    function updateSelectOptions(select, options, type) {
        const currentValue = select.value;
        select.innerHTML = ''; // Clear existing options
        select.appendChild(new Option('Select ' + select.name.replace('_', ' '), ''));
        
        options.forEach(option => {
            const optionText = type === 'exercise' ? option.exercise_name : option.name;
            const optionValue = option.id;
            const opt = new Option(optionText, optionValue);
            if (optionValue === currentValue) {
                opt.selected = true;
            }
            select.appendChild(opt);
        });
    
        console.log(`Updated ${select.name} options:`, options);
    }

    /**
     * UTILITY FUNCTIONS
     */
    function replaceInput(form, selector, newElement) {
        const input = form.querySelector(selector);
        if (input) {
            input.parentNode.replaceChild(newElement, input);
        }
    }

    /**
     * EVENT HANDLERS
     */
    function setupEventHandlers() {
        // Add Exercise button handler
        const addExerciseBtn = document.getElementById('addExerciseBtn');
        const newExerciseForm = document.getElementById('newExerciseForm');
        if (addExerciseBtn && newExerciseForm) {
            addExerciseBtn.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent default button action
                addExerciseBtn.style.display = 'none';
                newExerciseForm.style.display = 'block';
                newExerciseForm.scrollIntoView({ behavior: 'smooth' });
            });
        }
    
        // Cancel Add Exercise button handler
        const cancelAddExercise = document.getElementById('cancelAddExercise');
        if (cancelAddExercise && newExerciseForm && addExerciseBtn) {
            cancelAddExercise.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent default button action
                newExerciseForm.style.display = 'none';
                addExerciseBtn.style.display = 'inline-block';
            });
        }
    
        // Form submission handlers
        const createSessionForm = document.getElementById('createSessionForm');
        if (createSessionForm) {
            createSessionForm.addEventListener('submit', handleCreateSession);
        }
    
        document.querySelectorAll('form.workout-detail-form').forEach(form => {
            form.addEventListener('submit', handleFormSubmit);
        });
    
        if (newExerciseForm) {
            newExerciseForm.addEventListener('submit', handleNewExercise);
        }
    
        // Delete exercise button handlers
        document.querySelectorAll('.delete-exercise-btn').forEach(btn => {
            btn.addEventListener('click', handleDeleteExercise);
        });
    }

    // Add new handler for Create Session
    function handleCreateSession(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        fetch('api/workout_sessions.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showMessage('Success!', 'Session created successfully.', 'success');
                // Redirect to the new session page if needed
                if (result.session_id) {
                    window.location.href = `training.php?session=${result.session_id}`;
                }
            } else {
                showMessage('Error', result.message || 'Failed to create session.', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('Error', 'Network error occurred. Please try again.', 'error');
        });
    }

    // Add new handler for New Exercise
    function handleNewExercise(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        fetch('api/workout_details.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showMessage('Success!', 'Exercise added successfully.', 'success');
                form.reset();
                form.style.display = 'none';
                document.getElementById('addExerciseBtn').style.display = 'inline-block';
                // Optionally refresh the exercise list
                location.reload();
            } else {
                showMessage('Error', result.message || 'Failed to add exercise.', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('Error', 'Network error occurred. Please try again.', 'error');
        });
    }

    function handleFormSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        fetch('api/workout_details.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showMessage('Success!', 'Exercise details saved successfully.', 'success');
                if (form.id === 'newExerciseForm') {
                    form.reset();
                    form.style.display = 'none';
                    document.getElementById('addExerciseBtn').style.display = 'inline-block';
                }
            } else {
                showMessage('Error', result.message || 'Failed to save exercise details.', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('Error', 'Network error occurred. Please try again.', 'error');
        });
    }

    function handleDeleteExercise(event) {
        const btn = event.target;
        const container = btn.closest('.exercise-container');
        const exerciseId = container.dataset.id;

        if (confirm('Are you sure you want to delete this exercise? This action cannot be undone.')) {
            fetch('api/workout_details.php', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: exerciseId })
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    container.remove();
                    showMessage('Success!', 'Exercise deleted successfully.', 'success');
                } else {
                    showMessage('Error', result.message || 'Failed to delete exercise.', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage('Error', 'Network error occurred. Please try again.', 'error');
            });
        }
    }

    function showMessage(title, message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            <strong>${title}</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        document.querySelector('.container').insertAdjacentElement('afterbegin', alertDiv);
        
        // Auto-dismiss after 3 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }

    // Start initialization
    init();
});