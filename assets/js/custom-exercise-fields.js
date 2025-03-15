/**
 * Enhanced Select with Custom Entry Option
 * Adds "Add New..." option to select dropdowns and handles custom entry creation
 */

/**
 * Converts a select element into an enhanced select with custom entry option
 * @param {HTMLSelectElement} selectElement - The select element to enhance
 * @param {string} entityType - Type of entity ('muscle_group', 'equipment', or 'exercise_name')
 * @param {Function} onCustomEntryAdded - Callback when custom entry is added
 */
function enhanceSelectWithCustomOption(selectElement, entityType, onCustomEntryAdded) {
    if (!selectElement) return;
    
    // Create the "Add New..." option and add it to the end of the select
    const addNewOption = document.createElement('option');
    addNewOption.value = 'add_new_' + entityType;
    addNewOption.textContent = '➕ Add New ' + formatEntityType(entityType) + '...';
    addNewOption.classList.add('text-primary', 'custom-option');
    selectElement.appendChild(addNewOption);
    
    // Create the custom input container (initially hidden)
    const customInputContainer = document.createElement('div');
    customInputContainer.className = 'custom-option-input mt-2';
    customInputContainer.style.display = 'none';
    
    // Create the input field
    const customInput = document.createElement('input');
    customInput.type = 'text';
    customInput.className = 'form-control form-control-sm';
    customInput.placeholder = 'Enter new ' + formatEntityType(entityType) + ' name';
    
    // Create the Add button
    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.className = 'btn btn-sm btn-primary ms-2';
    addButton.textContent = 'Add';
    
    // Create the Cancel button
    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'btn btn-sm btn-outline-secondary ms-1';
    cancelButton.textContent = 'Cancel';
    
    // Assemble the custom input container
    customInputContainer.appendChild(customInput);
    customInputContainer.appendChild(addButton);
    customInputContainer.appendChild(cancelButton);
    
    // Insert the custom input container after the select
    selectElement.parentNode.insertBefore(customInputContainer, selectElement.nextSibling);
    
    // Add event listener to show custom input when "Add New..." is selected
    selectElement.addEventListener('change', function() {
        if (this.value === 'add_new_' + entityType) {
            customInputContainer.style.display = 'flex';
            customInput.focus();
        } else {
            customInputContainer.style.display = 'none';
        }
    });
    
    // Add event listener for the Add button
    addButton.addEventListener('click', function() {
        const newValue = customInput.value.trim();
        if (newValue) {
            // Call API to create new entity
            createCustomEntity(entityType, newValue)
                .then(result => {
                    if (result.success) {
                        // Add the new option to the select
                        const newOption = document.createElement('option');
                        newOption.value = newValue;
                        newOption.textContent = newValue;
                        newOption.selected = true;
                        
                        // Insert before the "Add New..." option
                        selectElement.insertBefore(newOption, addNewOption);
                        
                        // Hide the custom input
                        customInputContainer.style.display = 'none';
                        
                        // Clear the input
                        customInput.value = '';
                        
                        // Call the callback function
                        if (onCustomEntryAdded) {
                            onCustomEntryAdded(entityType, newValue);
                        }
                        
                        // Show success message
                        showLocalMessage(customInputContainer, 'Added successfully!', 'success');
                    } else {
                        showLocalMessage(customInputContainer, result.message || 'Failed to add item', 'danger');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showLocalMessage(customInputContainer, 'Network error occurred', 'danger');
                });
        } else {
            showLocalMessage(customInputContainer, 'Please enter a value', 'warning');
        }
    });
    
    // Add event listener for the Cancel button
    cancelButton.addEventListener('click', function() {
        // Hide the custom input and reset the select
        customInputContainer.style.display = 'none';
        selectElement.selectedIndex = 0;
        customInput.value = '';
    });
    
    // Add event listener for pressing Enter in the input field
    customInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addButton.click();
        }
    });
}

/**
 * Create a custom entity via API
 * @param {string} entityType - Type of entity ('muscle_group', 'equipment', or 'exercise_name')
 * @param {string} name - Name of the new entity
 * @returns {Promise} - Promise that resolves to the API response
 */
function createCustomEntity(entityType, name) {
    let endpoint = 'api/exercise_library.php?action=add_' + entityType;
    
    // If this is an exercise, we need additional data
    if (entityType === 'exercise_name') {
        // Get the selected muscle group and equipment
        const muscleGroupSelect = document.activeElement.closest('form').querySelector('[name="muscle_group"]');
        const equipmentSelect = document.activeElement.closest('form').querySelector('[name="equipment"]');
        
        if (!muscleGroupSelect || !equipmentSelect) {
            return Promise.reject('Cannot add exercise: muscle group or equipment not found');
        }
        
        // Make sure they are selected and not "Add New..."
        if (!muscleGroupSelect.value || muscleGroupSelect.value.startsWith('add_new_') ||
            !equipmentSelect.value || equipmentSelect.value.startsWith('add_new_')) {
            return Promise.reject('Cannot add exercise: please select muscle group and equipment first');
        }
        
        return fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                muscle_group: muscleGroupSelect.value,
                equipment: equipmentSelect.value
            })
        }).then(response => response.json());
    }
    
    // For muscle groups and equipment, just send the name
    return fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: name })
    }).then(response => response.json());
}

/**
 * Format entity type for display
 * @param {string} entityType - Type of entity
 * @returns {string} - Formatted entity type
 */
function formatEntityType(entityType) {
    switch (entityType) {
        case 'muscle_group':
            return 'Muscle Group';
        case 'equipment':
            return 'Equipment';
        case 'exercise_name':
            return 'Exercise';
        default:
            return entityType.replace('_', ' ');
    }
}

/**
 * Show a local message near an element
 * @param {HTMLElement} element - Element to show message near
 * @param {string} message - Message to show
 * @param {string} type - Message type ('success', 'danger', 'warning')
 */
function showLocalMessage(element, message, type) {
    // Remove any existing message
    const existingMessage = element.parentNode.querySelector('.local-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create new message
    const messageElement = document.createElement('div');
    messageElement.className = `local-message alert alert-${type} mt-2 py-1 px-2 small`;
    messageElement.textContent = message;
    
    // Insert after the element
    element.parentNode.insertBefore(messageElement, element.nextSibling);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.remove();
        }
    }, 3000);
}

/**
 * Update the createSelectElement function to include the custom option enhancement
 * @param {string} name - Name of the select element 
 * @param {Array} options - Array of options for the select
 * @param {string} valueField - Field to use for option values
 * @param {string} textField - Field to use for option text
 * @param {string} selectedValue - Value to select by default
 * @returns {HTMLSelectElement} - The enhanced select element
 */
function createSelectElementWithCustomOption(name, options, valueField, textField, selectedValue = '') {
    // Create the basic select element
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
    
    // Enhance the select with custom option capabilities
    enhanceSelectWithCustomOption(select, name, onCustomEntryAdded);
    
    return select;
}

/**
 * Callback when a custom entry is added
 * @param {string} entityType - Type of entity that was added
 * @param {string} value - Value of the new entity
 */
function onCustomEntryAdded(entityType, value) {
    console.log(`Added new ${entityType}: ${value}`);
    
    // Refresh exercise data if needed
    if (entityType === 'muscle_group' || entityType === 'equipment') {
        // We might need to refresh exercise data after adding a new muscle group or equipment
        // This depends on how your application is structured
        loadExerciseData()
            .then(() => {
                console.log('Exercise data refreshed after adding new ' + entityType);
            })
            .catch(error => {
                console.error('Failed to refresh exercise data:', error);
            });
    }
}

/**
 * New setupFormsWithCustomOptions function to replace setupForms
 */
function setupFormsWithCustomOptions() {
    setupNewExerciseFormWithCustomOptions();
    setupExistingExerciseFormsWithCustomOptions();
}

/**
 * Setup the new exercise form with custom options
 */
function setupNewExerciseFormWithCustomOptions() {
    const form = document.getElementById('newExerciseForm');
    if (!form) return;
    
    const muscleGroupSelect = createSelectElementWithCustomOption('muscle_group', exerciseData.muscleGroups, 
        'name', 'name');
    
    const equipmentSelect = createSelectElementWithCustomOption('equipment', exerciseData.equipment, 
        'name', 'name');
    
    const exerciseSelect = createSelectElementWithCustomOption('exercise_name', exerciseData.exercises, 
        'exercise_name', 'exercise_name');
    
    // Replace existing inputs with new selects
    replaceInput(form, '[name="muscle_group"]', muscleGroupSelect);
    replaceInput(form, '[name="equipment"]', equipmentSelect);
    replaceInput(form, '[name="exercise_name"]', exerciseSelect);
    
    // Setup cascading filters
    setupCascadingFilters(muscleGroupSelect, equipmentSelect, exerciseSelect);
}

/**
 * Setup existing exercise forms with custom options
 */
function setupExistingExerciseFormsWithCustomOptions() {
    const forms = document.querySelectorAll('.workout-detail-form');
    
    forms.forEach(form => {
        // Extract existing values
        const existingValues = {
            muscle_group: form.querySelector('[name="muscle_group"]')?.value,
            equipment: form.querySelector('[name="equipment"]')?.value,
            exercise_name: form.querySelector('[name="exercise_name"]')?.value
        };
        
        console.log('Existing values for form:', existingValues);
        
        const muscleGroupSelect = createSelectElementWithCustomOption('muscle_group', exerciseData.muscleGroups, 
            'name', 'name', existingValues.muscle_group);
        
        const equipmentSelect = createSelectElementWithCustomOption('equipment', exerciseData.equipment, 
            'name', 'name', existingValues.equipment);
        
        const exerciseSelect = createSelectElementWithCustomOption('exercise_name', exerciseData.exercises, 
            'exercise_name', 'exercise_name', existingValues.exercise_name);
        
        // Replace existing inputs with new selects
        replaceInput(form, '[name="muscle_group"]', muscleGroupSelect);
        replaceInput(form, '[name="equipment"]', equipmentSelect);
        replaceInput(form, '[name="exercise_name"]', exerciseSelect);
        
        // Set flag to prevent cascade events while restoring state
        isRestoringState = true;
        
        // Pre-filter options based on existing values
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
    });
}

/**
 * Modified init function to use the enhanced form setup
 */
function initWithCustomOptions() {
    loadExerciseData()
        .then(() => {
            setupFormsWithCustomOptions();
            setupEventHandlers();
        })
        .catch(error => {
            console.error('Failed to initialize:', error);
        });
}

// Add the CSS for custom option styling
document.head.insertAdjacentHTML('beforeend', `
<style>
    .custom-option {
        font-style: italic;
        border-top: 1px dashed #ccc;
        margin-top: 4px;
        padding-top: 4px;
    }
    
    .custom-option-input {
        display: flex;
        align-items: center;
    }
    
    .local-message {
        font-size: 0.85rem;
    }
</style>
`);

