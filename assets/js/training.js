/**
 * Training Page JavaScript
 * Handles functionality for the training metrics page
 * Refactored for better organization, performance, and maintainability
 */

document.addEventListener('DOMContentLoaded', function() {
    // Application namespace to prevent global scope pollution
    window.App = {
        // Core state management
        state: {
            exerciseData: {
                muscleGroups: [],
                equipment: [],
                exercises: [],
                equipmentByMuscle: {},
                exercisesByMuscleAndEquipment: {}
            },
            apiCache: new Map(),
            isLoading: false,
            sessionId: new URLSearchParams(window.location.search).get('id'),
            templateId: new URLSearchParams(window.location.search).get('template_id')
        },
        
        // Initialization
        init: function() {
            try {
                console.log('Initializing training page...');
                
                // Check for required DOM elements
                this.checkRequiredElements();
                
                // Add CSS for toast animations
                this.ui.addStylesForToasts();
                
                // Load exercise data from API
                this.data.loadExerciseData()
                    .then(() => {
                        console.log('Exercise data loaded successfully');
                        // Once data is loaded, set up the forms and event handlers
                        this.ui.setupForms();
                        this.ui.setupEventHandlers();
                        
                        // Check if there's a template ID in the URL (for direct template loading)
                        if (this.state.templateId && !this.state.sessionId) {
                            this.data.loadWorkoutTemplate(this.state.templateId);
                        }
                        // Load session-specific data if we're on a session page
                        else if (this.state.sessionId) {
                            this.data.loadWorkoutDetails(this.state.sessionId);
                        } else if (document.getElementById('recentSessions')) {
                            this.data.loadRecentSessions();
                        }
                    })
                    .catch(error => {
                        console.error('Error loading exercise data:', error);
                        this.ui.showToast('danger', 'Failed to load exercise data. Please refresh the page.');
                    });
            } catch (error) {
                console.error('Error during initialization:', error);
                this.ui.showToast('danger', 'An error occurred while initializing the page.');
            }
        },
        
        checkRequiredElements: function() {
            const sessionForm = document.getElementById('sessionForm');
            const exercisesList = document.getElementById('exercisesList') || document.getElementById('existingExercises');
            const recentSessions = document.getElementById('recentSessions');
            
            console.log('Page elements check:', {
                hasSessionForm: !!sessionForm,
                hasExercisesList: !!exercisesList,
                hasRecentSessions: !!recentSessions
            });
        },
        
        // Utility functions
        utils: {
            // Debounce function to limit how often a function can be called
            debounce: function(func, wait) {
                let timeout;
                return function(...args) {
                    const context = this;
                    clearTimeout(timeout);
                    timeout = setTimeout(() => func.apply(context, args), wait);
                };
            }
        },
        
        // UI-related functions
        ui: {
            // Show a toast notification
            showToast: function(type, message) {
                // Check if Bootstrap's toast functionality is available
                if (typeof bootstrap === 'undefined' || !bootstrap.Toast) {
                    // Fallback to alert if toast is not available
                    alert(message);
                    return;
                }
                
                // Get or create toast container
                let toastContainer = document.getElementById('toastContainer');
                if (!toastContainer) {
                    toastContainer = document.createElement('div');
                    toastContainer.id = 'toastContainer';
                    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
                    document.body.appendChild(toastContainer);
                }
                
                // Create unique ID for this toast
                const toastId = 'toast-' + Date.now();
                
                // Create toast HTML
                const toastHtml = `
                    <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                        <div class="toast-header bg-${type} text-white">
                            <strong class="me-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
                        </div>
                        <div class="toast-body">
                            ${message}
                        </div>
                    </div>
                `;
                
                // Add toast to container
                toastContainer.insertAdjacentHTML('beforeend', toastHtml);
                
                // Initialize and show the toast
                const toastElement = document.getElementById(toastId);
                const toast = new bootstrap.Toast(toastElement, {
                    autohide: true,
                    delay: 5000
                });
                toast.show();
                
                // Remove toast from DOM after it's hidden
                toastElement.addEventListener('hidden.bs.toast', function() {
                    toastElement.remove();
                });
            },
            
            // Show session message
            showSessionMessage: function(type, message) {
                const messageContainer = document.getElementById('sessionAlertMessage');
                if (!messageContainer) return;
                
                messageContainer.className = `alert alert-${type} alert-dismissible fade show`;
                messageContainer.innerHTML = `
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                `;
                messageContainer.style.display = 'block';
                
                // Scroll to message
                messageContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            },
            
            // Add styles for toasts and animations
            addStylesForToasts: function() {
                const styleEl = document.createElement('style');
                styleEl.textContent = `
                    .toast-container {
                        z-index: 1050;
                    }
                    .toast {
                        transition: opacity 0.5s ease-out;
                    }
                    .toast.fade-out {
                        opacity: 0;
                    }
                    .loading-overlay {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background-color: rgba(255, 255, 255, 0.7);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        z-index: 10;
                        border-radius: 0.25rem;
                    }
                    .form-select.loading {
                        pointer-events: none;
                        opacity: 0.6;
                    }
                    .submit-button-wrapper {
                        position: relative;
                        display: inline-block;
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
                    .exercise-container {
                        border: 1px solid #ddd;
                        padding: 15px;
                        border-radius: 5px;
                        margin-bottom: 15px;
                        background-color: #fff;
                    }
                `;
                document.head.appendChild(styleEl);
            },
            
            // Setup event handlers
            setupEventHandlers: function() {
                console.log('Setting up event handlers');
                
                // Check if we should show exercise form automatically
                const showExerciseForm = new URLSearchParams(window.location.search).get('show_exercise_form');
                if (showExerciseForm === '1' && App.state.sessionId) {
                    // Use setTimeout to ensure the page has loaded properly
                    setTimeout(() => {
                        const addExerciseBtn = document.getElementById('addExerciseBtn');
                        if (addExerciseBtn) {
                            addExerciseBtn.click();
                        }
                    }, 500);
                }
                
                // Add exercise button
                const addExerciseBtn = document.getElementById('addExerciseBtn');
                if (addExerciseBtn) {
                    addExerciseBtn.addEventListener('click', function() {
                        App.ui.showExerciseForm();
                    });
                }
                
                // Cancel add exercise button
                const cancelAddExerciseBtn = document.getElementById('cancelAddExercise');
                if (cancelAddExerciseBtn) {
                    cancelAddExerciseBtn.addEventListener('click', function() {
                        const form = document.getElementById('newExerciseForm');
                        if (form) {
                            form.style.display = 'none';
                            form.reset();
                        }
                    });
                }
                
                // Optimize the delete session button click handler
                const deleteSessionBtn = document.getElementById('deleteSessionBtn');
                if (deleteSessionBtn) {
                    deleteSessionBtn.addEventListener('click', async function() {
                        const sessionId = App.state.sessionId;
                        if (!sessionId) {
                            App.ui.showToast('danger', 'Session ID is missing. Cannot delete session.');
                            return;
                        }

                        const userConfirmed = confirm('Are you sure you want to delete this training session? This action cannot be undone.');
                        if (!userConfirmed) return;

                        try {
                            const response = await fetch(`api/training_sessions.php`, {
                                method: 'DELETE',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ id: sessionId })
                            });

                            const result = await response.json();
                            if (response.ok && result.success) {
                                App.ui.showToast('success', 'Training session deleted successfully.');
                                window.location.href = 'track_training.php';
                            } else {
                                App.ui.showToast('danger', result.message || 'Failed to delete training session.');
                            }
                        } catch (error) {
                            console.error('Error deleting session:', error);
                            App.ui.showToast('danger', 'An error occurred while deleting the session.');
                        }
                    });
                }
                
                // Load template button
                const loadTemplateBtn = document.getElementById('loadTemplateBtn');
                if (loadTemplateBtn) {
                    console.log('Adding event listener to load template button');
                    loadTemplateBtn.addEventListener('click', function() {
                        App.ui.openTemplateModal();
                    });
                } else if (App.state.sessionId) {
                    console.warn('Load template button not found on session page');
                }
                
                // Set up template modal handlers
                this.setupTemplateModalHandlers();
                
                // Set up keyboard shortcuts
                this.setupKeyboardShortcuts();
            },
            
            showExerciseForm: function() {
                const newExerciseForm = document.getElementById('newExerciseForm');
                
                if (newExerciseForm) {
                    newExerciseForm.style.display = 'block';
                    newExerciseForm.style.maxHeight = '0';
                    newExerciseForm.style.overflow = 'hidden';
                    newExerciseForm.style.transition = 'max-height 0.5s ease-in-out';
                    
                    // Trigger reflow
                    newExerciseForm.offsetHeight;
                    
                    // Expand
                    newExerciseForm.style.maxHeight = '2000px';
                    
                    // Focus on the first input after animation
                    setTimeout(() => {
                        const firstInput = newExerciseForm.querySelector('select, input');
                        if (firstInput) firstInput.focus();
                    }, 500);
                }
            },
            
            setupTemplateModalHandlers: function() {
                const templateModal = document.getElementById('templateModal');
                if (templateModal) {
                    // Listen for clicks on template card actions
                    templateModal.addEventListener('click', function(e) {
                        if (e.target.classList.contains('load-template-btn') || e.target.closest('.load-template-btn')) {
                            const button = e.target.classList.contains('load-template-btn') ? 
                                e.target : e.target.closest('.load-template-btn');
                            const templateId = button.dataset.templateId;
                            
                            if (templateId) {
                                App.data.loadWorkoutTemplate(templateId);
                                
                                // Close the modal
                                const modal = bootstrap.Modal.getInstance(templateModal);
                                if (modal) modal.hide();
                            }
                        }
                    });
                    
                    // Load template confirm button
                    const loadTemplateConfirmBtn = document.getElementById('loadTemplateConfirmBtn');
                    if (loadTemplateConfirmBtn) {
                        loadTemplateConfirmBtn.addEventListener('click', function() {
                            const templateSelect = document.getElementById('templateSelect');
                            if (templateSelect && templateSelect.value) {
                                App.data.loadWorkoutTemplate(templateSelect.value);
                                
                                // Close the modal
                                const modal = bootstrap.Modal.getInstance(templateModal);
                                if (modal) modal.hide();
                            } else {
                                App.ui.showToast('warning', 'Please select a template');
                            }
                        });
                    }
                }
            },
            
            setupKeyboardShortcuts: function() {
                document.addEventListener('keydown', function(event) {
                    // Only process if no modal is open and no input is focused
                    const activeElement = document.activeElement;
                    const isInputFocused = activeElement.tagName === 'INPUT' || 
                                           activeElement.tagName === 'TEXTAREA' || 
                                           activeElement.tagName === 'SELECT';
                    
                    if (isInputFocused) return;
                    
                    // Check if any modal is open
                    const modalOpen = document.querySelector('.modal.show');
                    if (modalOpen) return;
                    
                    // Alt+N = New Exercise (when on session page)
                    if (event.altKey && event.key === 'n') {
                        const addExerciseBtn = document.getElementById('addExerciseBtn');
                        if (addExerciseBtn && addExerciseBtn.style.display !== 'none') {
                            event.preventDefault();
                            addExerciseBtn.click();
                        }
                    }
                    
                    // Alt+T = Load Template (when on session page)
                    if (event.altKey && event.key === 't') {
                        const loadTemplateBtn = document.getElementById('loadTemplateBtn');
                        if (loadTemplateBtn) {
                            event.preventDefault();
                            loadTemplateBtn.click();
                        }
                    }
                    
                    // Alt+S = Save/Update Session
                    if (event.altKey && event.key === 's') {
                        const submitBtn = document.querySelector('#sessionForm button[type="submit"]');
                        if (submitBtn) {
                            event.preventDefault();
                            submitBtn.click();
                        }
                    }
                });
            },
            
            // Set up forms for training data entry
            setupForms: function() {
                console.log('Setting up forms...');
                
                // Set up session form
                const sessionForm = document.getElementById('sessionForm');
                if (sessionForm) {
                    sessionForm.addEventListener('submit', function(event) {
                        App.data.handleSessionFormSubmit(event);
                    });
                }
                
                // Set up new exercise form
                const newExerciseForm = document.getElementById('workoutDetailsForm');
                if (newExerciseForm) {
                    newExerciseForm.addEventListener('submit', function(event) {
                        App.data.handleNewExercise(event);
                    });
                    
                    // Set up cascading dropdowns
                    this.setupCascadingDropdowns();
                }
                
                // Set up range sliders
                this.setupRangeSliders();
            },
            
            // Set up range sliders
            setupRangeSliders: function() {
                // For all range sliders
                const rangeInputs = document.querySelectorAll('.range-slider');
                if (rangeInputs.length === 0) {
                    console.log('No range sliders found');
                    return;
                }
                
                console.log('Setting up range sliders...');
                
                rangeInputs.forEach(input => {
                    // Wrap range slider and value display in a container for better styling
                    const parent = input.parentElement;
                    const valueDisplay = input.nextElementSibling;
                    
                    if (valueDisplay && valueDisplay.classList.contains('range-value') && !parent.classList.contains('range-slider-container')) {
                        // Create container
                        const container = document.createElement('div');
                        container.className = 'range-slider-container';
                        
                        // Move elements into container
                        parent.insertBefore(container, input);
                        container.appendChild(input);
                        container.appendChild(valueDisplay);
                        
                        // Initial value update
                        valueDisplay.textContent = input.value;
                    } else if (valueDisplay && valueDisplay.classList.contains('range-value')) {
                        // Initial value update if already in a container
                        valueDisplay.textContent = input.value;
                    }
                    
                    // Add event listener to update value display when slider changes
                    input.addEventListener('input', function() {
                        if (valueDisplay) {
                            valueDisplay.textContent = this.value;
                        }
                    });
                });
            },
            
            // Setup cascading dropdowns for exercise selection
            setupCascadingDropdowns: function() {
                const muscleGroupSelect = document.getElementById('newMuscleGroup');
                const equipmentSelect = document.getElementById('newEquipment');
                const exerciseSelect = document.getElementById('newExerciseName');
                
                if (!muscleGroupSelect || !equipmentSelect || !exerciseSelect) {
                    console.warn('One or more dropdown elements not found for cascading dropdowns:', {
                        muscleGroupSelect: !!muscleGroupSelect,
                        equipmentSelect: !!equipmentSelect,
                        exerciseSelect: !!exerciseSelect
                    });
                    return;
                }
                
                // Populate muscle group dropdown
                this.populateMuscleGroupDropdown(muscleGroupSelect);
                
                // When muscle group changes, update equipment options
                muscleGroupSelect.addEventListener('change', function() {
                    const muscleGroup = this.value;
                    App.ui.populateEquipmentDropdown(equipmentSelect, muscleGroup);
                    
                    // Clear exercise dropdown when muscle group changes
                    exerciseSelect.innerHTML = '<option value="">Select Exercise</option>';
                    exerciseSelect.disabled = true;
                });
                
                // When equipment changes, update exercise options
                equipmentSelect.addEventListener('change', function() {
                    const muscleGroup = muscleGroupSelect.value;
                    const equipment = this.value;
                    
                    if (muscleGroup && equipment) {
                        App.ui.populateExerciseDropdown(exerciseSelect, muscleGroup, equipment);
                    } else {
                        exerciseSelect.innerHTML = '<option value="">Select Exercise</option>';
                        exerciseSelect.disabled = true;
                    }
                });
            },
            
            // Populate the muscle group dropdown with data
            populateMuscleGroupDropdown: function(select) {
                if (!select) return;
                
                // Clear current options
                select.innerHTML = '<option value="">Select Muscle Group</option>';
                
                // Add loading class
                select.classList.add('loading');
                
                try {
                    // Sort muscle groups alphabetically
                    const sortedMuscleGroups = [...App.state.exerciseData.muscleGroups].sort();
                    
                    // Add options for each muscle group
                    sortedMuscleGroups.forEach(muscleGroup => {
                        const option = document.createElement('option');
                        option.value = muscleGroup;
                        // Make sure muscleGroup is a string before using replace
                        option.textContent = typeof muscleGroup === 'string' 
                            ? muscleGroup.replace('_', ' ') 
                            : muscleGroup;
                        select.appendChild(option);
                    });
                    
                    // Enable select
                    select.disabled = false;
                } catch (error) {
                    console.error('Error populating muscle group dropdown:', error);
                    select.innerHTML = '<option value="">Error loading data</option>';
                    select.disabled = true;
                } finally {
                    // Remove loading class
                    select.classList.remove('loading');
                }
            },
            
            // Populate equipment dropdown based on selected muscle group
            populateEquipmentDropdown: function(select, muscleGroup) {
                if (!select || !muscleGroup) return;
                
                // Clear current options
                select.innerHTML = '<option value="">Select Equipment</option>';
                
                // Add loading class
                select.classList.add('loading');
                
                try {
                    if (App.state.exerciseData.equipmentByMuscle && App.state.exerciseData.equipmentByMuscle[muscleGroup]) {
                        // Sort equipment alphabetically
                        const sortedEquipment = [...App.state.exerciseData.equipmentByMuscle[muscleGroup]].sort();
                        
                        // Add options for each equipment
                        sortedEquipment.forEach(equipment => {
                            const option = document.createElement('option');
                            option.value = equipment;
                            option.textContent = equipment;
                            select.appendChild(option);
                        });
                        
                        // Enable select
                        select.disabled = false;
                    } else {
                        select.innerHTML = '<option value="">No equipment available</option>';
                        select.disabled = true;
                    }
                } catch (error) {
                    console.error('Error populating equipment dropdown:', error);
                    select.innerHTML = '<option value="">Error loading data</option>';
                    select.disabled = true;
                } finally {
                    // Remove loading class
                    select.classList.remove('loading');
                }
            },
            
            // Populate exercise dropdown based on selected muscle group and equipment
            populateExerciseDropdown: function(select, muscleGroup, equipment) {
                if (!select || !muscleGroup || !equipment) return;
                
                // Clear current options
                select.innerHTML = '<option value="">Select Exercise</option>';
                
                // Add loading class
                select.classList.add('loading');
                
                try {
                    const key = `${muscleGroup}|${equipment}`;
                    if (App.state.exerciseData.exercisesByMuscleAndEquipment && App.state.exerciseData.exercisesByMuscleAndEquipment[key]) {
                        // Sort exercises alphabetically by name
                        const sortedExercises = [...App.state.exerciseData.exercisesByMuscleAndEquipment[key]].sort((a, b) => 
                            a.name.localeCompare(b.name)
                        );
                        
                        // Add options for each exercise
                        sortedExercises.forEach(exercise => {
                            const option = document.createElement('option');
                            option.value = exercise.name; // Use name, not ID
                            option.textContent = exercise.name;
                            select.appendChild(option);
                        });
                        
                        // Enable select
                        select.disabled = false;
                    } else {
                        select.innerHTML = '<option value="">No exercises available</option>';
                        select.disabled = true;
                    }
                } catch (error) {
                    console.error('Error populating exercise dropdown:', error);
                    select.innerHTML = '<option value="">Error loading data</option>';
                    select.disabled = true;
                } finally {
                    // Remove loading class
                    select.classList.remove('loading');
                }
            },
            
            // Open template selection modal
            openTemplateModal: function() {
                // Get modal element
                const templateModal = document.getElementById('templateModal');
                if (!templateModal) {
                    console.error('Template modal not found');
                    return;
                }
                
                // Get template container
                const templateContainer = document.getElementById('templatesList');
                if (templateContainer) {
                    // Show loading
                    templateContainer.innerHTML = `
                        <div class="text-center my-5">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Loading templates...</span>
                            </div>
                            <p class="mt-2">Loading workout templates...</p>
                        </div>
                    `;
                }
                
                // Show modal
                const modal = new bootstrap.Modal(templateModal);
                modal.show();
                
                // Load templates
                App.data.loadTemplates(templateContainer);
            },
            
            // Update the session form with session data
            updateSessionForm: function(sessionData) {
                const form = document.getElementById('sessionForm');
                if (!form || !sessionData) return;
                
                // Update each form field with data from the session
                for (const [key, value] of Object.entries(sessionData)) {
                    const input = form.querySelector(`[name="${key}"]`);
                    if (input) {
                        // Handle different input types
                        if (input.type === 'checkbox') {
                            input.checked = !!value;
                        } else if (input.type === 'date' && value) {
                            // Format date as YYYY-MM-DD
                            const date = new Date(value);
                            const formattedDate = date.toISOString().split('T')[0];
                            input.value = formattedDate;
                        } else if (input.type === 'time' && value) {
                            // Extract time portion from datetime
                            const timeMatch = value.match(/\d{2}:\d{2}/);
                            if (timeMatch) {
                                input.value = timeMatch[0];
                            } else {
                                input.value = value;
                            }
                        } else {
                            input.value = value || '';
                        }
                    }
                }
            },
            
            // Render exercises in the exercises list
            renderExercises: function(exercises) {
                const exercisesList = document.getElementById('exercisesList') || document.getElementById('existingExercises');
                if (!exercisesList) {
                    console.error('Exercise list container not found');
                    return;
                }
                
                if (!exercises || exercises.length === 0) {
                    exercisesList.innerHTML = `
                        <div class="alert alert-info">
                            No exercises found for this session. Add your first exercise using the form below.
                        </div>
                    `;
                    return;
                }
                
                // Clear existing content
                exercisesList.innerHTML = '';
                
                // Add each exercise
                exercises.forEach(exercise => {
                    const exerciseElement = App.ui.createExerciseElement(exercise);
                    exercisesList.appendChild(exerciseElement);
                });
            },
            
            // Create HTML element for an exercise
            createExerciseElement: function(exercise) {
                const container = document.createElement('div');
                container.className = 'exercise-container mb-4';
                container.dataset.exerciseId = exercise.id;
                
                container.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h4 class="mb-0">${exercise.exercise_name}</h4>
                        <div class="btn-group">
                            <button type="button" class="btn btn-sm btn-outline-secondary edit-exercise-btn">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-danger delete-exercise-btn">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <p><strong>Muscle Group:</strong> ${exercise.muscle_group}</p>
                            <p><strong>Equipment:</strong> ${exercise.equipment}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Sets:</strong> ${exercise.sets}</p>
                            <p><strong>Reps:</strong> ${exercise.reps}</p>
                            <p><strong>Weight:</strong> ${exercise.load_weight || exercise.weight || '0'} kg</p>
                        </div>
                    </div>
                `;
                
                // Add event listeners to buttons
                const editBtn = container.querySelector('.edit-exercise-btn');
                if (editBtn) {
                    editBtn.addEventListener('click', function() {
                        App.data.editExercise(exercise.id);
                    });
                }
                
                const deleteBtn = container.querySelector('.delete-exercise-btn');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', function() {
                        App.data.deleteExercise(exercise.id);
                    });
                }
                
                return container;
            }
        },
        
        // Data-related functions
        data: {
            // Load exercise data with caching and better error handling
            loadExerciseData: function() {
                console.log('Loading exercise data...');
                
                // Check cache first
                if (App.state.apiCache.has('exercise_library')) {
                    console.log('Using cached exercise data');
                    const cachedData = App.state.apiCache.get('exercise_library');
                    App.state.exerciseData = { ...cachedData };
                    return Promise.resolve();
                }
                
                return fetch('api/exercise_library.php')
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`API error: ${response.status} ${response.statusText}`);
                        }
                        return response.json();
                    })
                    .then(result => {
                        if (!result) {
                            throw new Error('Empty response received');
                        }
                        
                        if (result.success) {
                            // Process and store the data
                            this.processExerciseData(result.data);
                            
                            // Store in cache
                            App.state.apiCache.set('exercise_library', { ...App.state.exerciseData });
                            
                            return Promise.resolve();
                        } else {
                            throw new Error(result.message || 'API returned error status');
                        }
                    })
                    .catch(error => {
                        console.error('Error in loadExerciseData:', error);
                        // Re-throw to allow the calling function to handle it
                        throw error;
                    });
            },
            
            // Process exercise data received from the API
            processExerciseData: function(data) {
                console.log('Processing exercise data...');
                
                // Check if data exists and has expected structure
                if (!data) {
                    console.error('Empty data provided to processExerciseData');
                    return;
                }
                
                try {
                    // Process muscle groups
                    if (Array.isArray(data.muscle_groups)) {
                        // Ensure all muscle group values are strings
                        App.state.exerciseData.muscleGroups = data.muscle_groups.map(mg => 
                            mg ? String(mg) : mg
                        );
                        console.log(`Processed ${App.state.exerciseData.muscleGroups.length} muscle groups`);
                    } else {
                        console.warn('Invalid or missing muscle_groups data');
                        App.state.exerciseData.muscleGroups = [];
                    }
                    
                    // Process equipment
                    if (Array.isArray(data.equipment)) {
                        // Ensure all equipment values are strings
                        App.state.exerciseData.equipment = data.equipment.map(eq => 
                            eq ? String(eq) : eq
                        );
                        console.log(`Processed ${App.state.exerciseData.equipment.length} equipment items`);
                    } else {
                        console.warn('Invalid or missing equipment data');
                        App.state.exerciseData.equipment = [];
                    }
                    
                    // Process exercises
                    if (Array.isArray(data.exercises)) {
                        App.state.exerciseData.exercises = data.exercises;
                        console.log(`Processed ${App.state.exerciseData.exercises.length} exercises`);
                    } else {
                        console.warn('Invalid or missing exercises data');
                        App.state.exerciseData.exercises = [];
                    }
                    
                    // Build lookup tables for quicker access
                    this.buildExerciseLookupTables();
                } catch (error) {
                    console.error('Error processing exercise data:', error);
                    throw new Error('Failed to process exercise data: ' + error.message);
                }
            },
            
            // Build lookup tables for quicker access to exercise data
            buildExerciseLookupTables: function() {
                // Equipment by muscle group lookup
                App.state.exerciseData.equipmentByMuscle = {};
                
                // Exercises by muscle and equipment lookup
                App.state.exerciseData.exercisesByMuscleAndEquipment = {};
                
                // Process each exercise to build the lookup tables
                App.state.exerciseData.exercises.forEach(exercise => {
                    const muscleGroup = exercise.muscle_group;
                    const equipment = exercise.equipment;
                    
                    // Add to equipment by muscle lookup
                    if (!App.state.exerciseData.equipmentByMuscle[muscleGroup]) {
                        App.state.exerciseData.equipmentByMuscle[muscleGroup] = new Set();
                    }
                    App.state.exerciseData.equipmentByMuscle[muscleGroup].add(equipment);
                    
                    // Add to exercises by muscle and equipment lookup
                    const key = `${muscleGroup}|${equipment}`;
                    if (!App.state.exerciseData.exercisesByMuscleAndEquipment[key]) {
                        App.state.exerciseData.exercisesByMuscleAndEquipment[key] = [];
                    }
                    App.state.exerciseData.exercisesByMuscleAndEquipment[key].push(exercise);
                });
                
                // Convert Sets to Arrays
                Object.keys(App.state.exerciseData.equipmentByMuscle).forEach(muscle => {
                    App.state.exerciseData.equipmentByMuscle[muscle] = Array.from(App.state.exerciseData.equipmentByMuscle[muscle]);
                });
                
                console.log('Built exercise lookup tables for quicker access');
            },
            
            // Handle training session form submission
            handleSessionFormSubmit: function(event) {
                console.log('Form submission handler called');
                
                // Always prevent the default form submission
                if (event && event.preventDefault) {
                    event.preventDefault();
                }
                
                // Get form and submit button
                const form = event.target || document.getElementById('sessionForm');
                if (!form) {
                    console.error('Form not found in handleSessionFormSubmit');
                    App.ui.showToast('danger', 'Error: Form not found');
                    return;
                }
                
                const submitBtn = form.querySelector('button[type="submit"]');
                if (!submitBtn) {
                    console.error('Submit button not found in handleSessionFormSubmit');
                    App.ui.showToast('danger', 'Error: Submit button not found');
                    return;
                }
                
                const originalBtnText = submitBtn.innerHTML;
                
                // Show loading state
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
                
                // Get form data
                const formData = new FormData(form);
                const sessionData = Object.fromEntries(formData.entries());
                
                console.log('Submitting session data:', sessionData);
                
                // Determine if this is an update or a new session
                const method = App.state.sessionId ? 'PUT' : 'POST';
                const url = App.state.sessionId ? `api/training_sessions.php?id=${App.state.sessionId}` : 'api/training_sessions.php';
                
                console.log(`Sending ${method} request to ${url}`);
                
                // Send request
                fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify(sessionData)
                })
                .then(response => {
                    console.log('API response received:', response.status);
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(result => {
                    console.log('API result:', result);
                    if (result.success) {
                        App.ui.showToast('success', App.state.sessionId ? 'Session updated successfully' : 'Session created successfully');
                        
                        // For new sessions, redirect to the new session page
                        if (!App.state.sessionId && result.data && result.data.id) {
                            console.log('Redirecting to new session page:', result.data.id);
                            
                            // Redirect with a special flag to auto-show exercise form
                            window.location.href = `track_training.php?id=${result.data.id}&show_exercise_form=1`;
                        } else if (App.state.sessionId) {
                            // For updates, refresh the current page to show updated data
                            console.log('Reloading page to show updated session data');
                            window.location.reload();
                        } else {
                            // Fallback - go to training page
                            console.log('Redirecting to training page (fallback)');
                            window.location.href = 'track_training.php';
                        }
                    } else {
                        // Restore button state
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalBtnText;
                        
                        console.error('API returned error:', result.message);
                        App.ui.showToast('danger', result.message || 'Failed to save session');
                    }
                })
                .catch(error => {
                    console.error('Error saving session:', error);
                    
                    // Restore button state
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                    
                    App.ui.showToast('danger', 'An error occurred while saving the session');
                });
            },
            
            // Load workout details from API
            loadWorkoutDetails: function(sessionId) {
                if (!sessionId) {
                    console.error('Session ID is required to load workout details');
                    return;
                }
                
                console.log('Loading workout details for session:', sessionId);
                
                // Get the container for workout details
                const workoutContainer = document.getElementById('exercisesList') || document.getElementById('existingExercises');
                if (!workoutContainer) {
                    console.error('Workout container not found');
                    return;
                }
                
                // Show loading state
                workoutContainer.innerHTML = `
                    <div class="text-center my-5">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading workout...</span>
                        </div>
                        <p class="mt-2">Loading workout details...</p>
                    </div>
                `;
                
                // Send request to get workout details
                fetch(`api/training_sessions.php?id=${sessionId}&include_exercises=1`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! Status: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(result => {
                        if (result.success) {
                            // Update session form with session details
                            App.ui.updateSessionForm(result.data);
                            
                            // Render exercises
                            App.ui.renderExercises(result.data.exercises || []);
                        } else {
                            workoutContainer.innerHTML = `
                                <div class="alert alert-danger">
                                    Failed to load workout details. ${result.message || ''}
                                </div>
                            `;
                        }
                    })
                    .catch(error => {
                        console.error('Error loading workout details:', error);
                        workoutContainer.innerHTML = `
                            <div class="alert alert-danger">
                                An error occurred while loading workout details.
                            </div>
                        `;
                    });
            },
            
            // Load recent training sessions
            loadRecentSessions: function() {
                console.log('Loading recent training sessions');
                
                const recentSessionsContainer = document.getElementById('recentSessions');
                if (!recentSessionsContainer) {
                    console.error('Recent sessions container not found');
                    return;
                }
                
                // Show loading state
                recentSessionsContainer.innerHTML = `
                    <div class="text-center my-3">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading recent sessions...</span>
                        </div>
                        <p class="mt-2">Loading recent sessions...</p>
                    </div>
                `;
                
                // Fetch recent sessions
                fetch('api/training_sessions.php?limit=5')
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`API error: ${response.status} ${response.statusText}`);
                        }
                        return response.json();
                    })
                    .then(result => {
                        // Clear loading indicator
                        recentSessionsContainer.innerHTML = '';
                        
                        if (result.success && result.data && result.data.length > 0) {
                            this.renderRecentSessions(result.data, recentSessionsContainer);
                        } else {
                            // No sessions found
                            recentSessionsContainer.innerHTML = `
                                <div class="alert alert-info">
                                    No recent training sessions found. 
                                    <a href="track_training.php" class="alert-link">Create your first session</a>.
                                </div>
                            `;
                        }
                    })
                    .catch(error => {
                        console.error('Error loading recent sessions:', error);
                        
                        // Show error message
                        recentSessionsContainer.innerHTML = `
                            <div class="alert alert-danger">
                                Failed to load recent sessions.
                            </div>
                        `;
                    });
            },
            
            // Render recent sessions table
            renderRecentSessions: function(sessions, container) {
                // Create table with recent sessions
                const table = document.createElement('table');
                table.className = 'table table-hover';
                
                // Table header
                table.innerHTML = `
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Session Name</th>
                            <th>Duration</th>
                            <th>Exercises</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                `;
                
                const tbody = table.querySelector('tbody');
                
                // Add each session to the table
                sessions.forEach(session => {
                    const row = document.createElement('tr');
                    row.className = 'session-row';
                    row.dataset.sessionId = session.id;
                    
                    // Format duration if available
                    let duration = 'N/A';
                    if (session.training_start && session.training_end) {
                        const start = new Date(session.training_start);
                        const end = new Date(session.training_end);
                        const diffMs = end - start;
                        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                        const diffMins = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                        
                        duration = `${diffHrs}h ${diffMins}m`;
                    }
                    
                    // Format date
                    const date = new Date(session.date);
                    const formattedDate = date.toLocaleDateString();
                    
                    row.innerHTML = `
                        <td>${formattedDate}</td>
                        <td>${session.mesocycle_name || 'Unnamed Session'}</td>
                        <td>${duration}</td>
                        <td>${session.exercise_count || 0}</td>
                        <td>
                            <a href="track_training.php?id=${session.id}" class="btn btn-sm btn-primary">
                                <i class="fas fa-edit me-1"></i> View/Edit
                            </a>
                        </td>
                    `;
                    
                    tbody.appendChild(row);
                });
                
                container.appendChild(table);
                
                // Add click event for rows
                const rows = tbody.querySelectorAll('.session-row');
                rows.forEach(row => {
                    row.addEventListener('click', function(e) {
                        // Don't trigger if they clicked on the button itself
                        if (e.target.tagName !== 'A' && !e.target.closest('a')) {
                            const sessionId = this.dataset.sessionId;
                            window.location.href = `track_training.php?id=${sessionId}`;
                        }
                    });
                });
            },
            
            // Load templates
            loadTemplates: function(container) {
                // Load templates from API
                fetch('api/workout_templates.php')
                    .then(response => response.json())
                    .then(result => {
                        if (result.success && container) {
                            if (result.data.length === 0) {
                                container.innerHTML = `
                                    <div class="alert alert-info">
                                        No templates found. <a href="workout_templates.php" class="alert-link">Create a template</a>.
                                    </div>
                                `;
                                return;
                            }
                            
                            // Populate template select dropdown
                            const templateSelect = document.getElementById('templateSelect');
                            if (templateSelect) {
                                templateSelect.innerHTML = '<option value="">Select a template</option>';
                                result.data.forEach(template => {
                                    templateSelect.innerHTML += `
                                        <option value="${template.id}">${template.name}</option>
                                    `;
                                });
                            }
                            
                            // Populate template cards
                            this.renderTemplateCards(result.data, container);
                        } else if (container) {
                            container.innerHTML = `
                                <div class="alert alert-danger">
                                    Failed to load templates. ${result.message || ''}
                                </div>
                            `;
                        }
                    })
                    .catch(error => {
                        console.error('Error loading templates:', error);
                        if (container) {
                            container.innerHTML = `
                                <div class="alert alert-danger">
                                    An error occurred while loading templates.
                                </div>
                            `;
                        }
                    });
            },
            
            // Render template cards
            renderTemplateCards: function(templates, container) {
                // Clear container
                container.innerHTML = '';
                
                // Add each template
                templates.forEach(template => {
                    // Create a card for each template
                    const card = document.createElement('div');
                    card.className = 'card mb-3';
                    
                    card.innerHTML = `
                        <div class="card-header">
                            <h5 class="mb-0">${template.name}</h5>
                        </div>
                        <div class="card-body">
                            <p class="card-text">
                                ${template.description || 'No description provided.'}
                            </p>
                            <p class="small text-muted">
                                <strong>Exercise count:</strong> ${template.exercise_count || 0}
                            </p>
                        </div>
                        <div class="card-footer d-flex justify-content-end">
                            <button class="btn btn-primary load-template-btn" data-template-id="${template.id}">
                                <i class="fas fa-plus-circle me-1"></i> Load Template
                            </button>
                        </div>
                    `;
                    
                    container.appendChild(card);
                });
            },
            
            // Load a workout template into the current session
            loadWorkoutTemplate: function(templateId) {
                if (!templateId) {
                    App.ui.showToast('danger', 'No template selected');
                    return;
                }
                
                // Find the load button and store its original text
                const loadButton = document.querySelector(`button[data-template-id="${templateId}"]`) || 
                                   document.querySelector('#loadTemplateConfirmBtn');
                
                if (loadButton) {
                    // Store original button text and disable the button
                    const originalBtnText = loadButton.innerHTML;
                    loadButton.disabled = true;
                    loadButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
                    
                    // Disable all template buttons to prevent multiple clicks
                    const allButtons = document.querySelectorAll('.template-action-btn, .load-template-btn');
                    allButtons.forEach(btn => btn.disabled = true);
                }
                
                // Prepare data for API request
                const requestData = {
                    template_id: templateId
                };
                
                // If we have a session ID, include it in the request
                if (App.state.sessionId) {
                    requestData.session_id = App.state.sessionId;
                }
                
                // Send request to load template
                fetch('api/workout_templates.php?action=load_template', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestData)
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(result => {
                    if (result.success) {
                        App.ui.showToast('success', 'Template loaded successfully! Refreshing...');
                        
                        // If we got back a new session ID, redirect to it
                        if (result.data && result.data.session_id) {
                            window.location.href = `track_training.php?id=${result.data.session_id}`;
                        } else if (App.state.sessionId) {
                            // If we're updating an existing session, refresh the page
                            setTimeout(() => {
                                window.location.reload();
                            }, 1000);
                        } else {
                            // Fallback - go to training page
                            setTimeout(() => {
                                window.location.href = 'track_training.php';
                            }, 1000);
                        }
                    } else {
                        // Restore button states
                        if (loadButton) {
                            loadButton.disabled = false;
                            loadButton.innerHTML = originalBtnText;
                            
                            // Re-enable other buttons
                            const allButtons = document.querySelectorAll('.template-action-btn, .load-template-btn');
                            allButtons.forEach(btn => btn.disabled = false);
                        }
                        
                        App.ui.showToast('danger', result.message || 'Failed to load template');
                    }
                })
                .catch(error => {
                    console.error('Error loading template:', error);
                    
                    // Restore button states if possible
                    if (loadButton) {
                        loadButton.disabled = false;
                        loadButton.innerHTML = originalBtnText;
                        
                        // Re-enable other buttons
                        const allButtons = document.querySelectorAll('.template-action-btn, .load-template-btn');
                        allButtons.forEach(btn => btn.disabled = false);
                    }
                    
                    App.ui.showToast('danger', 'An error occurred while loading the template');
                });
            },
            
            // Handle adding a new exercise
            handleNewExercise: function(event) {
                event.preventDefault();
                
                // Get form and submit button
                const form = event.target;
                const submitBtn = form.querySelector('button[type="submit"]');
                const originalBtnText = submitBtn.innerHTML;
                
                // Show loading state
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
                
                // Get form data
                const formData = new FormData(form);
                const exerciseData = Object.fromEntries(formData.entries());
                
                if (!App.state.sessionId) {
                    App.ui.showToast('danger', 'No session ID found. Please save the session first.');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                    return;
                }
                
                // Add session ID to exercise data
                exerciseData.session_id = App.state.sessionId;
                
                // Send request
                fetch('api/training_exercises.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(exerciseData)
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(result => {
                    if (result.success) {
                        App.ui.showToast('success', 'Exercise added successfully');
                        
                        // Reset form
                        form.reset();
                        
                        // Hide form
                        document.getElementById('newExerciseForm').style.display = 'none';
                        
                        // Refresh exercise list
                        if (result.data && result.data.exercise_id) {
                            this.fetchAndRenderNewExercise(App.state.sessionId, result.data.exercise_id);
                        } else {
                            // Fallback - reload the page
                            window.location.reload();
                        }
                    } else {
                        // Restore button state
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalBtnText;
                        
                        App.ui.showToast('danger', result.message || 'Failed to add exercise');
                    }
                })
                .catch(error => {
                    console.error('Error adding exercise:', error);
                    
                    // Restore button state
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                    
                    App.ui.showToast('danger', 'An error occurred while adding the exercise');
                });
            },
            
            // Fetch and render a newly added exercise without page refresh
            fetchAndRenderNewExercise: function(sessionId, exerciseId) {
                fetch(`api/training_exercises.php?session_id=${sessionId}&exercise_id=${exerciseId}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! Status: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(result => {
                        if (result.success && result.data) {
                            // Check if there's an empty message to remove
                            const exercisesList = document.getElementById('exercisesList') || document.getElementById('existingExercises');
                            if (exercisesList) {
                                const emptyMessage = exercisesList.querySelector('.alert');
                                if (emptyMessage) {
                                    exercisesList.innerHTML = '';
                                }
                                
                                // Add the new exercise to the list
                                const exerciseElement = App.ui.createExerciseElement(result.data);
                                exercisesList.appendChild(exerciseElement);
                            }
                        } else {
                            // If we couldn't fetch the new exercise, just reload the page
                            window.location.reload();
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching new exercise:', error);
                        // Fallback - reload the page
                        window.location.reload();
                    });
            },
            
            // Edit an exercise
            editExercise: function(exerciseId) {
                // Implementation needed
                console.log('Edit exercise:', exerciseId);
                
                // Placeholder - would fetch exercise data and show an edit form
                App.ui.showToast('info', 'Edit functionality to be implemented');
            },
            
            // Delete an exercise
            deleteExercise: function(exerciseId) {
                if (!exerciseId) {
                    App.ui.showToast('danger', 'Invalid exercise ID');
                    return;
                }
                
                if (!confirm('Are you sure you want to delete this exercise? This action cannot be undone.')) {
                    return;
                }
                
                if (!App.state.sessionId) {
                    App.ui.showToast('danger', 'Session ID not found');
                    return;
                }
                
                // Send delete request
                fetch(`api/training_exercises.php?id=${exerciseId}&session_id=${App.state.sessionId}`, {
                    method: 'DELETE'
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(result => {
                    if (result.success) {
                        App.ui.showToast('success', 'Exercise deleted successfully');
                        
                        // Remove exercise from DOM
                        const exerciseElement = document.querySelector(`.exercise-container[data-exercise-id="${exerciseId}"]`);
                        if (exerciseElement) {
                            exerciseElement.remove();
                        }
                        
                        // If no exercises left, show empty message
                        const exercisesList = document.getElementById('exercisesList') || document.getElementById('existingExercises');
                        if (exercisesList && exercisesList.children.length === 0) {
                            exercisesList.innerHTML = `
                                <div class="alert alert-info">
                                    No exercises found for this session. Add your first exercise using the form below.
                                </div>
                            `;
                        }
                    } else {
                        App.ui.showToast('danger', result.message || 'Failed to delete exercise');
                    }
                })
                .catch(error => {
                    console.error('Error deleting exercise:', error);
                    App.ui.showToast('danger', 'An error occurred while deleting the exercise');
                });
            }
        }
    };
    
    // Initialize the application
    App.init();
});