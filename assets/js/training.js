/**
 * Training Metrics JavaScript Enhancements
 * Adds equipment selection and autocomplete functionality to training forms
 */
document.addEventListener('DOMContentLoaded', function() {
    // Load data for autocomplete
    let muscleGroups = [];
    let exerciseNames = [];
    let equipmentTypes = [];
    
    // Fetch data from API
    fetchAutoCompleteData();
    
    // Set up autocomplete for existing forms
    setupAutoComplete();
    
    // Add equipment selection to existing workout forms
    addEquipmentFieldsToExistingForms();
    
    // Modify the event listener for the add exercise button
    const addExerciseBtn = document.getElementById('addExerciseBtn');
    const newExerciseForm = document.getElementById('newExerciseForm');
    const cancelAddExercise = document.getElementById('cancelAddExercise');
    
    if (addExerciseBtn && newExerciseForm) {
        addExerciseBtn.addEventListener('click', function() {
            addExerciseBtn.style.display = 'none';
            newExerciseForm.style.display = 'block';
            
            // Scroll to form
            newExerciseForm.scrollIntoView({ behavior: 'smooth' });
        });
    }
    
    // Modified workout form submission to handle equipment
    const workoutDetailsForm = document.getElementById('workoutDetailsForm');
    if (workoutDetailsForm) {
        workoutDetailsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate form
            if (!validateWorkoutForm(this)) {
                return false;
            }
            
            // Get form data
            const formData = new FormData(this);
            const data = {};
            
            // Convert FormData to JSON object
            formData.forEach((value, key) => {
                data[key] = value;
            });
            
            // Send API request
            fetch('api/workout_details.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(result => {
                const alertElement = document.getElementById('workoutAlertMessage');
                alertElement.style.display = 'block';
                
                if (result.success) {
                    alertElement.className = 'alert alert-success mt-3';
                    alertElement.textContent = result.message;
                    
                    // Reset form
                    workoutDetailsForm.reset();
                    
                    // Reset range sliders to default value
                    document.querySelectorAll('#newExerciseForm input[type="range"]').forEach(range => {
                        range.value = 5;
                        const displayId = range.id + 'Display';
                        const displayElement = document.getElementById(displayId);
                        if (displayElement) {
                            displayElement.textContent = '5';
                        }
                    });
                    
                    // Reload page after a short delay to show the new exercise
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                } else {
                    alertElement.className = 'alert alert-danger mt-3';
                    alertElement.textContent = result.message || 'An error occurred while saving data.';
                }
                
                // Scroll to alert message
                alertElement.scrollIntoView({ behavior: 'smooth' });
            })
            .catch(error => {
                console.error('Error:', error);
                const alertElement = document.getElementById('workoutAlertMessage');
                alertElement.style.display = 'block';
                alertElement.className = 'alert alert-danger mt-3';
                alertElement.textContent = 'Network error occurred. Please try again.';
            });
        });
    }
    
    // Update workout detail forms with equipment handling
    const workoutDetailForms = document.querySelectorAll('.workout-detail-form');
    workoutDetailForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate form
            if (!validateWorkoutForm(this)) {
                return false;
            }
            
            // Get form data
            const formData = new FormData(this);
            const data = {};
            
            // Convert FormData to JSON object
            formData.forEach((value, key) => {
                data[key] = value;
            });
            
            // Send API request
            fetch('api/workout_details.php', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(result => {
                const alertElement = this.querySelector('.workout-alert-message');
                alertElement.style.display = 'block';
                
                if (result.success) {
                    alertElement.className = 'workout-alert-message alert alert-success mt-3';
                    alertElement.textContent = result.message;
                } else {
                    alertElement.className = 'workout-alert-message alert alert-danger mt-3';
                    alertElement.textContent = result.message || 'An error occurred while updating data.';
                }
                
                // Hide message after 3 seconds
                setTimeout(() => {
                    alertElement.style.display = 'none';
                }, 3000);
            })
            .catch(error => {
                console.error('Error:', error);
                const alertElement = this.querySelector('.workout-alert-message');
                alertElement.style.display = 'block';
                alertElement.className = 'workout-alert-message alert alert-danger mt-3';
                alertElement.textContent = 'Network error occurred. Please try again.';
            });
        });
    });
    
    /**
     * Fetch muscle groups, exercise names, and equipment types for autocomplete
     */
    function fetchAutoCompleteData() {
        // Fetch muscle groups
        fetch('api/exercise_library.php?action=muscle_groups')
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    muscleGroups = result.data.map(item => item.name);
                    setupAutoComplete();
                }
            })
            .catch(error => console.error('Error fetching muscle groups:', error));
        
        // Fetch equipment types
        fetch('api/exercise_library.php?action=equipment')
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    equipmentTypes = result.data.map(item => item.name);
                    setupAutoComplete();
                }
            })
            .catch(error => console.error('Error fetching equipment types:', error));
        
        // Get exercise names
        fetch('api/exercise_library.php?action=search')
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    exerciseNames = result.data.map(item => item.exercise_name);
                    console.log("Exercise names loaded:", exerciseNames.length);
                    setupAutoComplete();
                }
            })
            .catch(error => console.error('Error fetching exercises:', error));
    }
    
    /**
     * Setup autocomplete for muscle group, exercise, and equipment fields
     */
    function setupAutoComplete() {
        // Setup for new exercise form
        setupInputWithDatalist('newMuscleGroup', 'muscleGroupList', muscleGroups);
        setupInputWithDatalist('newExerciseName', 'exerciseNameList', exerciseNames);
        setupInputWithDatalist('newEquipment', 'equipmentList', equipmentTypes);
        
        // Setup for existing exercise forms
        document.querySelectorAll('[name="muscle_group"]').forEach(input => {
            if (input.id !== 'newMuscleGroup') {
                setupInputWithDatalist(input.id, `muscleGroupList_${input.id}`, muscleGroups);
            }
        });
        
        document.querySelectorAll('[name="exercise_name"]').forEach(input => {
            if (input.id !== 'newExerciseName') {
                setupInputWithDatalist(input.id, `exerciseNameList_${input.id}`, exerciseNames);
            }
        });
        
        document.querySelectorAll('[name="equipment"]').forEach(input => {
            if (input.id !== 'newEquipment') {
                setupInputWithDatalist(input.id, `equipmentList_${input.id}`, equipmentTypes);
            }
        });
    }
    
    /**
     * Create or update a datalist for an input field
     * @param {string} inputId Input field ID
     * @param {string} datalistId Datalist ID to create
     * @param {Array} options Array of option values
     */
    function setupInputWithDatalist(inputId, datalistId, options) {
        const input = document.getElementById(inputId);
        if (!input) return;
        
        // Create or get datalist
        let datalist = document.getElementById(datalistId);
        if (!datalist) {
            datalist = document.createElement('datalist');
            datalist.id = datalistId;
            document.body.appendChild(datalist);
        }
        
        // Always associate the datalist with the input
        input.setAttribute('list', datalistId);
        
        // Clear and populate options
        datalist.innerHTML = '';
        if (options && options.length) {
            options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                datalist.appendChild(optionElement);
            });
        }
    }
    
    /**
     * Add equipment fields to existing workout forms
     */
    function addEquipmentFieldsToExistingForms() {
        // Add equipment field to new exercise form
        const newEquipmentField = `
            <div class="form-col">
                <div class="form-group">
                    <label for="newEquipment">Equipment:</label>
                    <input type="text" id="newEquipment" name="equipment" placeholder="e.g., Barbell, Dumbbell, Machine">
                </div>
            </div>
        `;
        
        // Add to new exercise form
        const newExerciseFormRow = document.querySelector('#newExerciseForm .form-row:first-child');
        if (newExerciseFormRow) {
            // Make the row wider to accommodate the new field by adjusting the parent layout
            newExerciseFormRow.innerHTML += newEquipmentField;
        }
        
        // Add to existing exercise forms
        document.querySelectorAll('.exercise-container').forEach((container, index) => {
            if (!container.id || container.id !== 'newExerciseForm') {
                const formRow = container.querySelector('.form-row:first-child');
                if (formRow) {
                    // Get the exercise ID to create unique field IDs
                    const exerciseId = container.dataset.id || index;
                    const equipmentField = `
                        <div class="form-col">
                            <div class="form-group">
                                <label for="equipment_${exerciseId}">Equipment:</label>
                                <input type="text" id="equipment_${exerciseId}" name="equipment" 
                                    value="${container.dataset.equipment || ''}" placeholder="e.g., Barbell, Dumbbell, Machine">
                            </div>
                        </div>
                    `;
                    
                    formRow.innerHTML += equipmentField;
                }
            }
        });
    }
});

/**
 * Validate if a value is numeric and meets minimum requirements
 * @param {string|number} value The value to check
 * @param {number} min The minimum allowed value
 * @returns {boolean} True if valid, false otherwise
 */
function validateNumeric(value, min) {
    // Convert to number and check if it's valid
    const num = parseFloat(value);
    return !isNaN(num) && num >= min;
}

/**
 * Enhanced validation for the workout form that includes equipment
 * @param {HTMLFormElement} form The form to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validateWorkoutForm(form) {
    let isValid = true;
    
    // Validate required fields
    const muscleGroup = form.querySelector('[name="muscle_group"]').value.trim();
    const exerciseName = form.querySelector('[name="exercise_name"]').value.trim();
    const equipment = form.querySelector('[name="equipment"]').value.trim();
    
    if (!muscleGroup) {
        alert('Please enter a muscle group.');
        isValid = false;
        return isValid;
    }
    
    if (!exerciseName) {
        alert('Please enter an exercise name.');
        isValid = false;
        return isValid;
    }
    
    if (!equipment) {
        alert('Please enter equipment used for this exercise.');
        isValid = false;
        return isValid;
    }
    
    // Validate sets and reps
    const sets = form.querySelector('[name="sets"]').value;
    const reps = form.querySelector('[name="reps"]').value;
    
    if (sets && !validateNumeric(sets, 1)) {
        alert('Sets must be a positive number greater than 0.');
        isValid = false;
        return isValid;
    }
    
    if (reps && !validateNumeric(reps, 1)) {
        alert('Reps must be a positive number greater than 0.');
        isValid = false;
        return isValid;
    }
    
    // Validate load weight and RIR
    const loadWeight = form.querySelector('[name="load_weight"]').value;
    const rir = form.querySelector('[name="rir"]').value;
    
    if (loadWeight && !validateNumeric(loadWeight, 0)) {
        alert('Load weight must be a positive number.');
        isValid = false;
        return isValid;
    }
    
    if (rir && !validateNumeric(rir, 0)) {
        alert('RIR must be a positive number.');
        isValid = false;
        return isValid;
    }
    
    return isValid;
}
/**
 * Add session form submission handling to training.js
 * 
 * Add this code to your existing assets/js/training.js file
 */

document.addEventListener('DOMContentLoaded', function() {
    // Session form submission
    const sessionForm = document.getElementById('sessionForm');
    if (sessionForm) {
        sessionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const data = {};
            
            // Get session ID if it exists
            const sessionId = document.getElementById('sessionId');
            
            // Convert FormData to JSON object
            formData.forEach((value, key) => {
                data[key] = value;
            });
            
            // Handle date and times
            data['date'] = document.getElementById('sessionDate').value;
            
            // Process training times
            const trainingStartTime = document.getElementById('trainingStart').value;
            const trainingEndTime = document.getElementById('trainingEnd').value;
            
            if (trainingStartTime) {
                data['training_start'] = data['date'] + ' ' + trainingStartTime + ':00';
            } else {
                data['training_start'] = null;
            }
            
            if (trainingEndTime) {
                data['training_end'] = data['date'] + ' ' + trainingEndTime + ':00';
            } else {
                data['training_end'] = null;
            }
            
            // Remove the time inputs as we've processed them
            delete data['training_start_time'];
            delete data['training_end_time'];
            
            // Determine whether to create or update
            const method = sessionId ? 'PUT' : 'POST';
            
            // Send API request
            fetch('api/training_sessions.php', {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(result => {
                const alertElement = document.getElementById('sessionAlertMessage');
                alertElement.style.display = 'block';
                
                if (result.success) {
                    alertElement.className = 'alert alert-success mt-3';
                    alertElement.textContent = result.message;
                    
                    // If this was a new session, redirect to edit page after creation
                    if (!sessionId && result.session_id) {
                        setTimeout(() => {
                            window.location.href = 'training.php?id=' + result.session_id;
                        }, 1000);
                    }
                } else {
                    alertElement.className = 'alert alert-danger mt-3';
                    alertElement.textContent = result.message || 'An error occurred while saving data.';
                }
                
                // Scroll to alert message
                alertElement.scrollIntoView({ behavior: 'smooth' });
            })
            .catch(error => {
                console.error('Error:', error);
                const alertElement = document.getElementById('sessionAlertMessage');
                alertElement.style.display = 'block';
                alertElement.className = 'alert alert-danger mt-3';
                alertElement.textContent = 'Network error occurred. Please try again.';
            });
        });
    }
    
    // Delete session button functionality
    const deleteSessionBtn = document.getElementById('deleteSessionBtn');
    if (deleteSessionBtn) {
        deleteSessionBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to delete this training session? This action cannot be undone.')) {
                const sessionId = document.getElementById('sessionId').value;
                
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
                        // Redirect to training page after successful deletion
                        window.location.href = 'training.php';
                    } else {
                        alert(result.message || 'An error occurred while deleting the session.');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Network error occurred. Please try again.');
                });
            }
        });
    }
});
/**
 * Enhanced Exercise Selection Functionality for Training Page
 */

document.addEventListener('DOMContentLoaded', function() {
    // Function to load database values and create selects
    function enhanceExerciseForms() {
        // Fetch all data required for the selects
        Promise.all([
            fetch('api/exercise_library.php?action=muscle_groups').then(res => res.json()),
            fetch('api/exercise_library.php?action=equipment').then(res => res.json()),
            fetch('api/exercise_library.php?action=search').then(res => res.json())
        ]).then(([muscleGroupsResponse, equipmentResponse, exercisesResponse]) => {
            // Process data
            const muscleGroups = muscleGroupsResponse.success ? muscleGroupsResponse.data : [];
            const equipment = equipmentResponse.success ? equipmentResponse.data : [];
            const exercises = exercisesResponse.success ? exercisesResponse.data : [];

            // Store the data for later use
            window.exerciseData = {
                muscleGroups: muscleGroups,
                equipment: equipment,
                exercises: exercises
            };

            // Convert existing text inputs to select inputs with options
            enhanceFormInputs();
        }).catch(error => {
            console.error('Error loading exercise data:', error);
        });
    }

    function enhanceFormInputs() {
        // Check if we have the data
        if (!window.exerciseData) return;
        
        // Transform the new exercise form
        enhanceNewExerciseForm();
        
        // Transform existing exercise forms
        enhanceExistingExerciseForms();
    }

    function enhanceNewExerciseForm() {
        const muscleGroupInput = document.getElementById('newMuscleGroup');
        const exerciseNameInput = document.getElementById('newExerciseName');
        const equipmentInput = document.getElementById('newEquipment');
        
        if (muscleGroupInput) {
            replaceWithSelectOrCreate(
                muscleGroupInput, 
                window.exerciseData.muscleGroups.map(mg => mg.name),
                'Muscle Group',
                true
            );
        }
        
        if (equipmentInput) {
            replaceWithSelectOrCreate(
                equipmentInput, 
                window.exerciseData.equipment.map(eq => eq.name),
                'Equipment',
                true
            );
        }
        
        if (exerciseNameInput) {
            replaceWithSelectOrCreate(
                exerciseNameInput, 
                window.exerciseData.exercises.map(ex => ex.exercise_name),
                'Exercise',
                true
            );
            
            // Filter exercises based on selected muscle group
            const muscleGroupSelect = document.getElementById('newMuscleGroup');
            if (muscleGroupSelect) {
                muscleGroupSelect.addEventListener('change', function() {
                    const selectedMuscleGroup = this.value;
                    updateExerciseOptions(selectedMuscleGroup, exerciseNameInput);
                });
            }
        }
    }
    
    function enhanceExistingExerciseForms() {
        document.querySelectorAll('.workout-detail-form').forEach((form, index) => {
            const muscleGroupInput = form.querySelector('[name="muscle_group"]');
            const exerciseNameInput = form.querySelector('[name="exercise_name"]');
            const equipmentInput = form.querySelector('[name="equipment"]');
            
            if (muscleGroupInput) {
                replaceWithSelectOrCreate(
                    muscleGroupInput, 
                    window.exerciseData.muscleGroups.map(mg => mg.name),
                    'Muscle Group',
                    true,
                    `muscleGroup_${index}_select`
                );
            }
            
            if (equipmentInput) {
                replaceWithSelectOrCreate(
                    equipmentInput, 
                    window.exerciseData.equipment.map(eq => eq.name),
                    'Equipment',
                    true,
                    `equipment_${index}_select`
                );
            }
            
            if (exerciseNameInput) {
                // Replace with full dropdown like the other fields
                replaceWithSelectOrCreate(
                    exerciseNameInput, 
                    window.exerciseData.exercises.map(ex => ex.exercise_name),
                    'Exercise',
                    true,
                    `exerciseName_select`
                );

                
                
                // Filter exercises based on selected muscle group
                const muscleGroupSelect = form.querySelector(`[name="muscle_group"]`);
                if (muscleGroupSelect) {
                    muscleGroupSelect.addEventListener('change', function() {
                        const selectedMuscleGroup = this.value;
                        updateExerciseOptions(selectedMuscleGroup, exerciseNameInput);
                    });
                }
            }
        });
    }
    // Add this function to your training.js file
    function updateFilteredExercises(muscleGroupSelect, equipmentSelect, exerciseSelect) {
        if (!window.exerciseData) return;
        
        const selectedMuscleGroup = muscleGroupSelect ? muscleGroupSelect.value : '';
        const selectedEquipment = equipmentSelect ? equipmentSelect.value : '';
        
        // Save current value
        const currentValue = exerciseSelect.value;
        
        // Clear existing options (except Add New and divider at the end)
        const addNewOption = Array.from(exerciseSelect.options).find(opt => opt.value === 'add_new');
        const dividerOption = Array.from(exerciseSelect.options).find(opt => opt.disabled);
        let optionsToKeep = [];
        
        if (dividerOption) optionsToKeep.push(dividerOption);
        if (addNewOption) optionsToKeep.push(addNewOption);
        
        // Remove all options except the empty first one
        while (exerciseSelect.options.length > 1) {
            exerciseSelect.remove(1);
        }
        
        // Filter exercises by muscle group AND equipment
        let filteredExercises = window.exerciseData.exercises;
        
        if (selectedMuscleGroup) {
            filteredExercises = filteredExercises.filter(ex => 
                ex.muscle_group === selectedMuscleGroup);
        }
        
        if (selectedEquipment) {
            filteredExercises = filteredExercises.filter(ex => 
                ex.equipment === selectedEquipment);
        }
        
        // Add filtered exercises
        filteredExercises.forEach(ex => {
            const option = document.createElement('option');
            option.value = ex.exercise_name;
            option.textContent = ex.exercise_name;
            exerciseSelect.insertBefore(option, exerciseSelect.options[1]);
        });
        
        // Re-add divider and Add New option
        optionsToKeep.forEach(opt => exerciseSelect.appendChild(opt));
        
        // Try to restore previous selection
        if (currentValue && currentValue !== 'add_new') {
            exerciseSelect.value = currentValue;
        }
    }
    function replaceWithSelectOrCreate(inputElement, options, placeholder, allowCustom = false, newId = null) {
        if (!inputElement) return;
        
        const currentValue = inputElement.value;
        const id = newId || inputElement.id;
        const name = inputElement.name;
        const isRequired = inputElement.hasAttribute('required');
        const parent = inputElement.parentElement;
        
        // Create the select element
        const selectContainer = document.createElement('div');
        selectContainer.className = 'select-with-option-container';
        
        // Create select element
        const select = document.createElement('select');
        select.className = 'form-select';
        select.id = id;
        select.name = name;
        if (isRequired) select.setAttribute('required', 'required');
        
        // Add empty option
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = `Select ${placeholder}...`;
        select.appendChild(emptyOption);
        
        // Add options from database
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            if (option === currentValue) optionElement.selected = true;
            select.appendChild(optionElement);
        });
        
        // Add custom option if current value isn't in list
        if (currentValue && !options.includes(currentValue) && currentValue !== '') {
            const customOption = document.createElement('option');
            customOption.value = currentValue;
            customOption.textContent = currentValue + ' (Custom)';
            customOption.selected = true;
            select.appendChild(customOption);
        }
        
        // If we allow custom values, add a "Add new" option
        if (allowCustom) {
            const divider = document.createElement('option');
            divider.disabled = true;
            divider.textContent = '──────────';
            select.appendChild(divider);
            
            const addNewOption = document.createElement('option');
            addNewOption.value = 'add_new';
            addNewOption.textContent = `+ Add New ${placeholder}`;
            select.appendChild(addNewOption);
            
            // Add event listener for "Add new" option
            select.addEventListener('change', function() {
                if (this.value === 'add_new') {
                    const customValue = prompt(`Enter new ${placeholder}:`);
                    if (customValue && customValue.trim() !== '') {
                        // Add new option to select
                        const newOption = document.createElement('option');
                        newOption.value = customValue.trim();
                        newOption.textContent = customValue.trim() + ' (Custom)';
                        
                        // Insert before the divider
                        select.insertBefore(newOption, divider);
                        
                        // Select the new option
                        newOption.selected = true;
                    } else {
                        // If cancelled or empty, revert to previous selection
                        this.value = currentValue || '';
                    }
                }
            });
        }
        
        // Replace the input with the select
        selectContainer.appendChild(select);
        
        // Replace the original input with our new container
        parent.replaceChild(selectContainer, inputElement);
        
        return select;
    }
    
    function addDatalistToInput(input, options, listId) {
        if (!input) return;
        
        // Create datalist if it doesn't exist
        let datalist = document.getElementById(listId);
        if (!datalist) {
            datalist = document.createElement('datalist');
            datalist.id = listId;
            document.body.appendChild(datalist);
        } else {
            // Clear existing options
            datalist.innerHTML = '';
        }
        
        // Add options to datalist
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            datalist.appendChild(optionElement);
        });
        
        // Associate datalist with input
        input.setAttribute('list', listId);
    }
    
    function updateExerciseOptions(muscleGroup, exerciseInput) {
        if (!window.exerciseData) return;
        
        // If no muscle group is selected, show all exercises
        if (!muscleGroup) {
            addDatalistToInput(
                exerciseInput,
                window.exerciseData.exercises.map(ex => ex.exercise_name),
                exerciseInput.getAttribute('list')
            );
            return;
        }
        
        // Filter exercises by the selected muscle group
        const filteredExercises = window.exerciseData.exercises.filter(
            ex => ex.muscle_group === muscleGroup
        ).map(ex => ex.exercise_name);
        
        // Update datalist with filtered exercises
        addDatalistToInput(
            exerciseInput,
            filteredExercises,
            exerciseInput.getAttribute('list')
        );
    }
    
    // Initialize exercise selection
    enhanceExerciseForms();
    
    // Setup workout details form submission with exercise data handling
    const workoutDetailsForm = document.getElementById('workoutDetailsForm');
    if (workoutDetailsForm) {
        workoutDetailsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate form
            if (!validateWorkoutForm(this)) {
                return false;
            }
            
            // Get form data
            const formData = new FormData(this);
            const data = {};
            
            // Convert FormData to JSON object
            formData.forEach((value, key) => {
                data[key] = value;
            });
            
            // Send API request
            fetch('api/workout_details.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(result => {
                const alertElement = document.getElementById('workoutAlertMessage');
                alertElement.style.display = 'block';
                
                if (result.success) {
                    alertElement.className = 'alert alert-success mt-3';
                    alertElement.textContent = result.message;
                    
                    // Reset form
                    workoutDetailsForm.reset();
                    
                    // Reset range sliders to default value
                    document.querySelectorAll('#newExerciseForm input[type="range"]').forEach(range => {
                        range.value = 5;
                        const displayId = range.id + 'Display';
                        const displayElement = document.getElementById(displayId);
                        if (displayElement) {
                            displayElement.textContent = '5';
                        }
                    });
                    
                    // Reload page after a short delay to show the new exercise
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                } else {
                    alertElement.className = 'alert alert-danger mt-3';
                    alertElement.textContent = result.message || 'An error occurred while saving data.';
                }
                
                // Scroll to alert message
                alertElement.scrollIntoView({ behavior: 'smooth' });
            })
            .catch(error => {
                console.error('Error:', error);
                const alertElement = document.getElementById('workoutAlertMessage');
                alertElement.style.display = 'block';
                alertElement.className = 'alert alert-danger mt-3';
                alertElement.textContent = 'Network error occurred. Please try again.';
            });
        });
    }
    
    // Update existing workout detail forms with exercise data handling
    document.querySelectorAll('.workout-detail-form').forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate form
            if (!validateWorkoutForm(this)) {
                return false;
            }
            
            // Get form data
            const formData = new FormData(this);
            const data = {};
            
            // Convert FormData to JSON object
            formData.forEach((value, key) => {
                data[key] = value;
            });
            
            // Send API request
            fetch('api/workout_details.php', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(result => {
                const alertElement = this.querySelector('.workout-alert-message');
                alertElement.style.display = 'block';
                
                if (result.success) {
                    alertElement.className = 'workout-alert-message alert alert-success mt-3';
                    alertElement.textContent = result.message;
                } else {
                    alertElement.className = 'workout-alert-message alert alert-danger mt-3';
                    alertElement.textContent = result.message || 'An error occurred while updating data.';
                }
                
                // Hide message after 3 seconds
                setTimeout(() => {
                    alertElement.style.display = 'none';
                }, 3000);
            })
            .catch(error => {
                console.error('Error:', error);
                const alertElement = this.querySelector('.workout-alert-message');
                alertElement.style.display = 'block';
                alertElement.className = 'workout-alert-message alert alert-danger mt-3';
                alertElement.textContent = 'Network error occurred. Please try again.';
            });
        });
    });
});
/**
 * Add delete exercise functionality to training.js
 * Also adds event handlers for range sliders to update display values
 */

document.addEventListener('DOMContentLoaded', function() {
    // Add event handler for delete exercise buttons
    document.querySelectorAll('.delete-exercise-btn').forEach(button => {
        button.addEventListener('click', function() {
            const container = this.closest('.exercise-container');
            const exerciseId = container.dataset.id;
            
            if (confirm('Are you sure you want to delete this exercise? This action cannot be undone.')) {
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
                        // Remove container from DOM
                        container.remove();
                        
                        // Show success message
                        const alertElement = document.createElement('div');
                        alertElement.className = 'alert alert-success mt-3';
                        alertElement.textContent = result.message;
                        
                        // Add to workout details section and scroll to it
                        const workoutSection = document.querySelector('.section-divider:nth-of-type(2)');
                        workoutSection.appendChild(alertElement);
                        alertElement.scrollIntoView({ behavior: 'smooth' });
                        
                        // Hide message after 3 seconds
                        setTimeout(() => {
                            alertElement.remove();
                        }, 3000);
                    } else {
                        alert(result.message || 'An error occurred while deleting the exercise.');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Network error occurred. Please try again.');
                });
            }
        });
    });
    
    // Add event handler for cancel add exercise button
    const cancelAddExercise = document.getElementById('cancelAddExercise');
    if (cancelAddExercise) {
        cancelAddExercise.addEventListener('click', function() {
            document.getElementById('newExerciseForm').style.display = 'none';
            document.getElementById('addExerciseBtn').style.display = 'inline-block';
        });
    }
    
    // Setup range slider display updates for all range inputs
    setupRangeSliders();
});

/**
 * Set up range slider display value updates
 */
function setupRangeSliders() {
    // Update range slider display values on input
    document.querySelectorAll('input[type="range"]').forEach(slider => {
        // Update on initial load
        const displayId = slider.id + 'Display';
        const displayEl = document.getElementById(displayId);
        
        if (displayEl) {
            displayEl.textContent = slider.value;
        } else {
            // If no specific display element, use the next sibling span
            const displaySpan = slider.nextElementSibling;
            if (displaySpan && displaySpan.classList.contains('range-value')) {
                displaySpan.textContent = slider.value;
            }
        }
        
        // Update on input change
        slider.addEventListener('input', function() {
            const displayId = this.id + 'Display';
            const displayEl = document.getElementById(displayId);
            
            if (displayEl) {
                displayEl.textContent = this.value;
            } else {
                // If no specific display element, use the next sibling span
                const displaySpan = this.nextElementSibling;
                if (displaySpan && displaySpan.classList.contains('range-value')) {
                    displaySpan.textContent = this.value;
                }
            }
        });
    });
}
/**
 * Enhanced exercise filtering based on both muscle group and equipment
 * Add this to your assets/js/training.js file
 */
/**
 * Exercise Filtering Fix
 * Replace the existing filtering code in training.js with this version
 */
document.addEventListener('DOMContentLoaded', function() {
    // Global variables to store exercise data
    let allExercises = [];
    let muscleGroups = [];
    let equipmentTypes = [];
    
    // Main initialization function
    function initExerciseFiltering() {
        console.log("Initializing exercise filtering...");
        
        // Load all exercise data first
        Promise.all([
            fetch('api/exercise_library.php?action=muscle_groups').then(res => res.json()),
            fetch('api/exercise_library.php?action=equipment').then(res => res.json()),
            fetch('api/exercise_library.php?action=search').then(res => res.json())
        ]).then(([muscleGroupsResponse, equipmentResponse, exercisesResponse]) => {
            if (muscleGroupsResponse.success && equipmentResponse.success && exercisesResponse.success) {
                // Store the fetched data
                muscleGroups = muscleGroupsResponse.data;
                equipmentTypes = equipmentResponse.data;
                allExercises = exercisesResponse.data;
                
                console.log(`Loaded ${muscleGroups.length} muscle groups, ${equipmentTypes.length} equipment types, and ${allExercises.length} exercises`);
                
                // Setup filtering for new exercise form
                setupFormFiltering(
                    'newMuscleGroup',
                    'newEquipment',
                    'newExerciseName',
                    'exerciseNameList'
                );
                
                // Setup filtering for existing exercise forms
                document.querySelectorAll('.workout-detail-form').forEach((form, index) => {
                    const muscleGroupId = form.querySelector('[name="muscle_group"]').id;
                    const equipmentId = form.querySelector('[name="equipment"]').id;
                    const exerciseNameId = form.querySelector('[name="exercise_name"]').id;
                    
                    if (muscleGroupId && equipmentId && exerciseNameId) {
                        setupFormFiltering(
                            muscleGroupId,
                            equipmentId,
                            exerciseNameId,
                            `exerciseNameList_${index}`
                        );
                    }
                });
            } else {
                console.error("Failed to load exercise data from API");
            }
        }).catch(error => {
            console.error("Error loading exercise data:", error);
        });
    }
    
    // Function to set up filtering for a specific form
    function setupFormFiltering(muscleGroupId, equipmentId, exerciseNameId, datalistId) {
        const muscleGroupElement = document.getElementById(muscleGroupId);
        const equipmentElement = document.getElementById(equipmentId);
        const exerciseNameElement = document.getElementById(exerciseNameId);
        
        if (!muscleGroupElement || !equipmentElement || !exerciseNameElement) {
            console.warn(`Cannot find elements for filtering: ${muscleGroupId}, ${equipmentId}, ${exerciseNameId}`);
            return;
        }
        
        console.log(`Setting up filtering for ${muscleGroupId}, ${equipmentId}, ${exerciseNameId}`);
        
        // Create datalist if it doesn't exist
        let datalist = document.getElementById(datalistId);
        if (!datalist) {
            datalist = document.createElement('datalist');
            datalist.id = datalistId;
            document.body.appendChild(datalist);
            exerciseNameElement.setAttribute('list', datalistId);
        }
        
        // Function to update exercise options based on selected muscle group and equipment
        const updateExerciseOptions = () => {
            const selectedMuscleGroup = muscleGroupElement.value;
            const selectedEquipment = equipmentElement.value;
            
            console.log(`Filtering exercises - Muscle: "${selectedMuscleGroup}", Equipment: "${selectedEquipment}"`);
            
            // Filter exercises based on selections
            let filteredExercises = [...allExercises];
            
            if (selectedMuscleGroup) {
                filteredExercises = filteredExercises.filter(ex => 
                    ex.muscle_group.toLowerCase() === selectedMuscleGroup.toLowerCase()
                );
            }
            
            if (selectedEquipment) {
                filteredExercises = filteredExercises.filter(ex => 
                    ex.equipment.toLowerCase() === selectedEquipment.toLowerCase()
                );
            }
            
            // Clear and update datalist
            datalist.innerHTML = '';
            
            // Add filtered options
            filteredExercises.forEach(exercise => {
                const option = document.createElement('option');
                option.value = exercise.exercise_name;
                datalist.appendChild(option);
            });
            
            console.log(`Filtered to ${filteredExercises.length} exercises`);
        };
        
        // Add event listeners
        muscleGroupElement.addEventListener('change', updateExerciseOptions);
        equipmentElement.addEventListener('change', updateExerciseOptions);
        
        // Initial update
        updateExerciseOptions();
    }
    
    // Start initialization
    initExerciseFiltering();
});