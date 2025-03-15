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
    // Flag to prevent cascade events while restoring state
    let isRestoringState = false;

    function setupForms() {
        setupNewExerciseForm();
        setupExistingExerciseForms();
    }

    // Unified function for setting up exercise forms
    function setupExerciseForm(form, existingValues = {}) {
        if (!form) return;
        
        console.log('Setting up form with existing values:', existingValues);
        
        // Create select elements with proper mappings
        const muscleGroupSelect = createSelectElement('muscle_group', exerciseData.muscleGroups, 
            'name', 'name', existingValues.muscle_group);
        
        const equipmentSelect = createSelectElement('equipment', exerciseData.equipment, 
            'name', 'name', existingValues.equipment);
        
        const exerciseSelect = createSelectElement('exercise_name', exerciseData.exercises, 
            'exercise_name', 'exercise_name', existingValues.exercise_name);
        
        // Replace existing inputs with new selects
        replaceInput(form, '[name="muscle_group"]', muscleGroupSelect);
        replaceInput(form, '[name="equipment"]', equipmentSelect);
        replaceInput(form, '[name="exercise_name"]', exerciseSelect);
        
        // Set flag to prevent cascade events while restoring state
        isRestoringState = true;
        
        // Pre-filter options based on existing values - using direct string comparison now
        if (existingValues.muscle_group) {
            // Get all equipment used with this muscle group
            const compatibleEquipment = exerciseData.exercises
                .filter(ex => ex.muscle_group === existingValues.muscle_group)
                .map(ex => ex.equipment);
            
            // Create unique list
            const uniqueEquipment = [...new Set(compatibleEquipment)];
            
            // Filter equipment options
            filterSelectOptions(equipmentSelect, uniqueEquipment);
            
            // Ensure the existing equipment is selected
            if (existingValues.equipment) {
                selectOptionByValue(equipmentSelect, existingValues.equipment);
            }
        }
        
        if (existingValues.muscle_group && existingValues.equipment) {
            // Filter exercises by both muscle group and equipment
            const filteredExercises = exerciseData.exercises
                .filter(ex => 
                    ex.muscle_group === existingValues.muscle_group && 
                    ex.equipment === existingValues.equipment
                )
                .map(ex => ex.exercise_name);
                
            // Filter exercise options
            filterSelectOptions(exerciseSelect, filteredExercises);
            
            // Ensure the existing exercise is selected
            if (existingValues.exercise_name) {
                selectOptionByValue(exerciseSelect, existingValues.exercise_name);
            }
        }
        
        // Reset flag after restoration is complete
        isRestoringState = false;
        
        // Setup cascading filters for this form
        setupCascadingFilters(muscleGroupSelect, equipmentSelect, exerciseSelect);
        
        return {
            muscleGroupSelect,
            equipmentSelect,
            exerciseSelect
        };
    }

    // Create a select element with proper value/text mapping
    function createSelectElement(name, options, valueField, textField, selectedValue = '') {
        const select = document.createElement('select');
        select.className = 'form-select';
        select.name = name;
        select.required = true;
        select.id = name + '_' + Math.random().toString(36).substring(2, 7); // Add unique ID
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = `Select ${name.replace('_', ' ')}`;
        select.appendChild(defaultOption);
        
        // Add available options
        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option[valueField];
            opt.textContent = option[textField];
            
            // If this matches the selected value, mark it as selected
            if (option[valueField] === selectedValue) {
                opt.selected = true;
            }
            
            select.appendChild(opt);
        });
        
        return select;
    }

    function setupNewExerciseForm() {
        const form = document.getElementById('newExerciseForm');
        if (!form) return;
        
        return setupExerciseForm(form);
    }

    function setupExistingExerciseForms() {
        const forms = document.querySelectorAll('.workout-detail-form');
        
        forms.forEach(form => {
            // Extract existing values
            const existingValues = {
                muscle_group: form.querySelector('[name="muscle_group"]')?.value,
                equipment: form.querySelector('[name="equipment"]')?.value,
                exercise_name: form.querySelector('[name="exercise_name"]')?.value
            };
            
            console.log('Existing values for form:', existingValues);
            setupExerciseForm(form, existingValues);
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
            if (!isRestoringState) {
                console.log('Muscle group changed to:', muscleGroupSelect.value);
                
                // Get all equipment used with this muscle group
                const compatibleEquipment = exerciseData.exercises
                    .filter(ex => ex.muscle_group === muscleGroupSelect.value)
                    .map(ex => ex.equipment);
                
                // Create unique list
                const uniqueEquipment = [...new Set(compatibleEquipment)];
                
                console.log('Compatible equipment:', uniqueEquipment);
                
                // Reset equipment dropdown
                resetSelect(equipmentSelect);
                
                // Filter equipment options
                filterSelectOptions(equipmentSelect, uniqueEquipment);
                
                // Reset exercise dropdown
                resetSelect(exerciseSelect);
            }
        });
    
        equipmentSelect.addEventListener('change', () => {
            if (!isRestoringState) {
                console.log('Equipment changed to:', equipmentSelect.value);
                
                // Filter exercises by both muscle group and equipment
                const filteredExercises = exerciseData.exercises
                    .filter(ex => 
                        ex.muscle_group === muscleGroupSelect.value && 
                        ex.equipment === equipmentSelect.value
                    )
                    .map(ex => ex.exercise_name);
                    
                console.log('Compatible exercises:', filteredExercises);
                
                // Reset exercise dropdown
                resetSelect(exerciseSelect);
                
                // Filter exercise options
                filterSelectOptions(exerciseSelect, filteredExercises);
            }
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
    // Helper function to filter select options
    function filterSelectOptions(selectElement, allowedValues) {
        const options = selectElement.options;
        
        // Skip the first option (the placeholder)
        for (let i = 1; i < options.length; i++) {
            if (!allowedValues.includes(options[i].value)) {
                options[i].disabled = true;
                options[i].style.display = 'none';
            } else {
                options[i].disabled = false;
                options[i].style.display = '';
            }
        }
    }

    // Helper function to select option by value
    function selectOptionByValue(selectElement, value) {
        const options = selectElement.options;
        
        for (let i = 0; i < options.length; i++) {
            if (options[i].value === value) {
                selectElement.selectedIndex = i;
                return true;
            }
        }
        
        return false;
    }

    // Helper to reset a select to its default state
    function resetSelect(selectElement) {
        selectElement.selectedIndex = 0;
        
        // Re-enable all options
        const options = selectElement.options;
        for (let i = 1; i < options.length; i++) {
            options[i].disabled = false;
            options[i].style.display = '';
        }
    }

    /**
     * Restore previous selections for cascading dropdowns
     * @param {HTMLSelectElement} muscleGroupSelect The muscle group select element
     * @param {HTMLSelectElement} equipmentSelect The equipment select element
     * @param {HTMLSelectElement} exerciseSelect The exercise select element
     */
    function restorePreviousSelections(muscleGroupSelect, equipmentSelect, exerciseSelect) {
        if (!muscleGroupSelect || !equipmentSelect || !exerciseSelect) return;
        
        // Get currently selected values (if any)
        const muscleGroup = muscleGroupSelect.value;
        const equipment = equipmentSelect.value;
        
        // Set flag to prevent cascade events while restoring
        isRestoringState = true;
        
        // If a muscle group is selected, filter equipment options
        if (muscleGroup) {
            // Get all equipment used with this muscle group
            const compatibleEquipment = exerciseData.exercises
                .filter(ex => ex.muscle_group === muscleGroup)
                .map(ex => ex.equipment);
                
            const uniqueEquipment = [...new Set(compatibleEquipment)];
            filterSelectOptions(equipmentSelect, uniqueEquipment);
        }
        
        // If both muscle group and equipment are selected, filter exercise options
        if (muscleGroup && equipment) {
            const filteredExercises = exerciseData.exercises
                .filter(ex => 
                    ex.muscle_group === muscleGroup && 
                    ex.equipment === equipment
                )
                .map(ex => ex.exercise_name);
                
            filterSelectOptions(exerciseSelect, filteredExercises);
        }
        
        // Reset flag after restoration
        isRestoringState = false;
    }

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
        // Session form submission
        const sessionForm = document.getElementById('sessionForm');
        if (sessionForm) {
            sessionForm.addEventListener('submit', handleSessionFormSubmit);
        }
        
        // Add Exercise button handler
        const addExerciseBtn = document.getElementById('addExerciseBtn');
        const newExerciseForm = document.getElementById('newExerciseForm');
        if (addExerciseBtn && newExerciseForm) {
            addExerciseBtn.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent default button action
                addExerciseBtn.style.display = 'none';
                newExerciseForm.style.display = 'block';
                
                // After the form is visible, restore previous selections for dropdowns
                const muscleGroupSelect = newExerciseForm.querySelector('[name="muscle_group"]');
                const equipmentSelect = newExerciseForm.querySelector('[name="equipment"]');
                const exerciseSelect = newExerciseForm.querySelector('[name="exercise_name"]');
                
                if (muscleGroupSelect && equipmentSelect && exerciseSelect) {
                    restorePreviousSelections(muscleGroupSelect, equipmentSelect, exerciseSelect);
                }
                
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
    
        // Exercise form submission
        if (newExerciseForm) {
            newExerciseForm.addEventListener('submit', handleNewExercise);
        }
    
        // Update existing exercise forms
        document.querySelectorAll('.workout-detail-form').forEach(form => {
            form.addEventListener('submit', handleUpdateExercise);
        });
    
        // Delete exercise button handlers
        document.querySelectorAll('.delete-exercise-btn').forEach(btn => {
            btn.addEventListener('click', handleDeleteExercise);
        });
        
        // Delete session button handler
        const deleteSessionBtn = document.getElementById('deleteSessionBtn');
        if (deleteSessionBtn) {
            deleteSessionBtn.addEventListener('click', handleDeleteSession);
        }

        // Handle sliders to update displayed values
        document.querySelectorAll('input[type="range"]').forEach(slider => {
            slider.addEventListener('input', function() {
                const valueDisplay = this.nextElementSibling;
                if (valueDisplay && valueDisplay.classList.contains('range-value')) {
                    valueDisplay.textContent = this.value;
                }
            });
        });
    }

    function handleSessionFormSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const data = {};
        
        // Process form data
        formData.forEach((value, key) => {
            // Process date and time fields
            if (key === 'training_start_time' || key === 'training_end_time') {
                // We'll process these later
                data[key] = value;
            } else {
                data[key] = value;
            }
        });
        
        // Process training times
        if (data.date && data.training_start_time) {
            data.training_start = data.date + ' ' + data.training_start_time + ':00';
            delete data.training_start_time;
        } else {
            data.training_start = null;
        }
        
        if (data.date && data.training_end_time) {
            data.training_end = data.date + ' ' + data.training_end_time + ':00';
            delete data.training_end_time;
        } else {
            data.training_end = null;
        }
        
        // Determine if we're creating a new session or updating an existing one
        const isUpdate = data.id ? true : false;
        const endpoint = 'api/training_sessions.php';
        const method = isUpdate ? 'PUT' : 'POST';
        
        fetch(endpoint, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showMessage('Success!', result.message, 'success');
                // If this was a new session, redirect to the session page
                if (!isUpdate && result.session_id) {
                    window.location.href = `training.php?id=${result.session_id}`;
                }
            } else {
                showMessage('Error', result.message || 'Failed to save session.', 'danger');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('Error', 'Network error occurred. Please try again.', 'danger');
        });
    }

    function handleNewExercise(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Store the current selections before submitting
        const muscleGroupSelect = form.querySelector('[name="muscle_group"]');
        const exerciseSelect = form.querySelector('[name="exercise_name"]');
        const equipmentSelect = form.querySelector('[name="equipment"]');
        
        // Get text values from the selected options
        const muscleGroupText = muscleGroupSelect.options[muscleGroupSelect.selectedIndex]?.text || '';
        const exerciseText = exerciseSelect.options[exerciseSelect.selectedIndex]?.text || '';
        const equipmentText = equipmentSelect.options[equipmentSelect.selectedIndex]?.text || '';
        
        // Save IDs for backend processing
        const muscleGroupId = muscleGroupSelect.value;
        const exerciseId = exerciseSelect.value;
        const equipmentId = equipmentSelect.value;
        
        // Format the muscle_group and exercise_name as user-friendly strings for display
        data.muscle_group = muscleGroupText;
        data.exercise_name = exerciseText;
        data.equipment = equipmentText;
        
        // Store selections in sessionStorage to restore later
        sessionStorage.setItem('lastMuscleGroup', muscleGroupId);
        sessionStorage.setItem('lastEquipment', equipmentId);
        sessionStorage.setItem('lastExercise', exerciseId);

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
                
                // Don't reset form - this will keep our selections
                // Instead, just hide the form
                const addExerciseBtn = document.getElementById('addExerciseBtn');
                form.style.display = 'none';
                addExerciseBtn.style.display = 'inline-block';
                
                // Reload the page to show the new exercise, but after a longer delay
                // to let the user see the success message
                setTimeout(() => {
                    location.reload();
                }, 1500);
            } else {
                showMessage('Error', result.message || 'Failed to add exercise.', 'danger');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('Error', 'Network error occurred. Please try again.', 'danger');
        });
    }

    function handleUpdateExercise(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Get text values from the selected options
        const muscleGroupSelect = form.querySelector('[name="muscle_group"]');
        const exerciseSelect = form.querySelector('[name="exercise_name"]');
        const equipmentSelect = form.querySelector('[name="equipment"]');
        
        if (muscleGroupSelect && exerciseSelect && equipmentSelect) {
            // Get text values from the selected options
            const muscleGroupText = muscleGroupSelect.options[muscleGroupSelect.selectedIndex]?.text || '';
            const exerciseText = exerciseSelect.options[exerciseSelect.selectedIndex]?.text || '';
            const equipmentText = equipmentSelect.options[equipmentSelect.selectedIndex]?.text || '';
            
            // Format the muscle_group and exercise_name as user-friendly strings
            data.muscle_group = muscleGroupText;
            data.exercise_name = exerciseText;
            data.equipment = equipmentText;
        }

        fetch('api/workout_details.php', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showMessage('Success!', 'Exercise updated successfully.', 'success', form);
            } else {
                showMessage('Error', result.message || 'Failed to update exercise.', 'danger', form);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage('Error', 'Network error occurred. Please try again.', 'danger', form);
        });
    }

    function handleDeleteExercise(event) {
        const btn = event.target.closest('.delete-exercise-btn');
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
                    showMessage('Error', result.message || 'Failed to delete exercise.', 'danger');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage('Error', 'Network error occurred. Please try again.', 'danger');
            });
        }
    }
    
    function handleDeleteSession(event) {
        if (confirm('Are you sure you want to delete this entire training session? This will also delete all exercises in this session.')) {
            const sessionId = document.getElementById('sessionId').value;
            
            fetch('api/training_sessions.php', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: sessionId })
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    showMessage('Success!', 'Training session deleted successfully.', 'success');
                    // Redirect to the training page after a short delay
                    setTimeout(() => {
                        window.location.href = 'training.php';
                    }, 1500);
                } else {
                    showMessage('Error', result.message || 'Failed to delete training session.', 'danger');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage('Error', 'Network error occurred. Please try again.', 'danger');
            });
        }
    }

    function showMessage(title, message, type, container = null) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            <strong>${title}</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        if (container && container.querySelector('.workout-alert-message')) {
            // If this is an exercise form, use its dedicated alert container
            const alertContainer = container.querySelector('.workout-alert-message');
            alertContainer.innerHTML = '';
            alertContainer.appendChild(alertDiv);
            alertContainer.style.display = 'block';
        } else {
            // Otherwise use the global alert container
            document.querySelector('.container').insertAdjacentElement('afterbegin', alertDiv);
        }
        
        // Auto-dismiss after 3 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 3000);
    }

    // Start initialization
    init();
});