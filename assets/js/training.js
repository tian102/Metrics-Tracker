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
    
    // Cache for API responses to reduce duplicate calls
    const apiCache = new Map();
    
    // Initialize the page
    initializePage();

    /**
     * Debounce function to limit how often a function can be called
     * @param {Function} func - The function to debounce
     * @param {number} wait - The debounce delay in milliseconds
     * @returns {Function} - Debounced function
     */
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    /**
     * Display a toast notification
     * @param {string} type - Alert type (success, danger, warning, info)
     * @param {string} message - Message to display
     * @param {number} duration - Time in ms to show the toast (default: 3000)
     */
    function showToast(type, message, duration = 3000) {
        // Create toast container if it doesn't exist
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(toastContainer);
        }
        
        // Create unique ID for this toast
        const toastId = 'toast-' + new Date().getTime();
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast show border-${type}`;
        toast.id = toastId;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        // Add content to toast
        toast.innerHTML = `
            <div class="toast-header bg-${type} text-white">
                <strong class="me-auto">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
                    ${type === 'success' ? 'Success' : type === 'danger' ? 'Error' : 'Notice'}
                </strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;
        
        // Add to container
        toastContainer.appendChild(toast);
        
        // Close button handler
        const closeBtn = toast.querySelector('.btn-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                toast.remove();
            });
        }
        
        // Auto-remove after duration
        setTimeout(() => {
            const toastElement = document.getElementById(toastId);
            if (toastElement) {
                // Add fade-out effect
                toastElement.classList.add('fade-out');
                setTimeout(() => toastElement.remove(), 500);
            }
        }, duration);
    }

    /**
     * Main initialization function
     */
    function initializePage() {
        try {
            console.log('Initializing training page...');
            
            // Make initialization more robust by checking for required elements
            const sessionForm = document.getElementById('sessionForm');
            const exercisesList = document.getElementById('exercisesList');
            const recentSessions = document.getElementById('recentSessions');
            
            console.log('Page elements check:', {
                hasSessionForm: !!sessionForm,
                hasExercisesList: !!exercisesList,
                hasRecentSessions: !!recentSessions
            });
            
            // Add CSS for toast animations
            addStylesForToasts();
            
            // Load exercise data from API with better error handling
            loadExerciseData()
                .then(() => {
                    console.log('Exercise data loaded successfully');
                    // Once data is loaded, set up the forms
                    setupForms();
                    setupEventHandlers();
                    
                    // Load session-specific data if we're on a session page
                    const sessionId = new URLSearchParams(window.location.search).get('id');
                    if (sessionId) {
                        loadWorkoutDetails(sessionId);
                    } else if (recentSessions) {
                        loadRecentSessions();
                    }
                })
                .catch(error => {
                    console.error('Error loading exercise data:', error);
                    showToast('danger', 'Failed to load exercise data. Please refresh the page.');
                });
        } catch (error) {
            console.error('Error during initialization:', error);
            showToast('danger', 'An error occurred while initializing the page.');
        }
    }

    /**
     * Add styles for toasts and animations
     */
    function addStylesForToasts() {
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
        `;
        document.head.appendChild(styleEl);
    }

    /**
     * Add loading overlay to a container element
     * @param {HTMLElement} container - The container to add loading overlay to
     * @returns {HTMLElement} - The created loading overlay
     */
    function addLoadingOverlay(container) {
        // Make sure container has position relative
        if (getComputedStyle(container).position === 'static') {
            container.style.position = 'relative';
        }
        
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        `;
        
        container.appendChild(overlay);
        return overlay;
    }
    
    /**
     * Remove loading overlay from container
     * @param {HTMLElement} overlay - The overlay to remove
     */
    function removeLoadingOverlay(overlay) {
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    }

    /**
     * Process exercise data received from the API
     * @param {Object} data - Raw exercise data from API
     */
    function processExerciseData(data) {
        console.log('Processing exercise data...');
        
        // Check if data exists and has expected structure
        if (!data) {
            console.error('Empty data provided to processExerciseData');
            return;
        }
        
        try {
            // Process muscle groups
            if (Array.isArray(data.muscle_groups)) {
                exerciseData.muscleGroups = data.muscle_groups;
                console.log(`Processed ${exerciseData.muscleGroups.length} muscle groups`);
            } else {
                console.warn('Invalid or missing muscle_groups data');
                exerciseData.muscleGroups = [];
            }
            
            // Process equipment
            if (Array.isArray(data.equipment)) {
                exerciseData.equipment = data.equipment;
                console.log(`Processed ${exerciseData.equipment.length} equipment items`);
            } else {
                console.warn('Invalid or missing equipment data');
                exerciseData.equipment = [];
            }
            
            // Process exercises
            if (Array.isArray(data.exercises)) {
                exerciseData.exercises = data.exercises;
                console.log(`Processed ${exerciseData.exercises.length} exercises`);
            } else {
                console.warn('Invalid or missing exercises data');
                exerciseData.exercises = [];
            }
            
            // Optional: Build lookup tables for quicker access
            buildExerciseLookupTables();
        } catch (error) {
            console.error('Error processing exercise data:', error);
            throw new Error('Failed to process exercise data: ' + error.message);
        }
    }
    
    /**
     * Build lookup tables for quicker access to exercise data
     * This improves performance for dropdown population
     */
    function buildExerciseLookupTables() {
        // Equipment by muscle group lookup
        exerciseData.equipmentByMuscle = {};
        
        // Exercises by muscle and equipment lookup
        exerciseData.exercisesByMuscleAndEquipment = {};
        
        // Process each exercise to build the lookup tables
        exerciseData.exercises.forEach(exercise => {
            const muscleGroup = exercise.muscle_group;
            const equipment = exercise.equipment;
            
            // Add to equipment by muscle lookup
            if (!exerciseData.equipmentByMuscle[muscleGroup]) {
                exerciseData.equipmentByMuscle[muscleGroup] = new Set();
            }
            exerciseData.equipmentByMuscle[muscleGroup].add(equipment);
            
            // Add to exercises by muscle and equipment lookup
            const key = `${muscleGroup}|${equipment}`;
            if (!exerciseData.exercisesByMuscleAndEquipment[key]) {
                exerciseData.exercisesByMuscleAndEquipment[key] = [];
            }
            exerciseData.exercisesByMuscleAndEquipment[key].push(exercise);
        });
        
        // Convert Sets to Arrays
        Object.keys(exerciseData.equipmentByMuscle).forEach(muscle => {
            exerciseData.equipmentByMuscle[muscle] = Array.from(exerciseData.equipmentByMuscle[muscle]);
        });
        
        console.log('Built exercise lookup tables for quicker access');
    }

    /**
     * Load exercise data with caching and better error handling
     */
    function loadExerciseData() {
        console.log('Loading exercise data...');
        
        // Check cache first
        if (apiCache.has('exercise_library')) {
            console.log('Using cached exercise data');
            const cachedData = apiCache.get('exercise_library');
            exerciseData = { ...cachedData };
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
                    processExerciseData(result.data);
                    
                    // Store in cache
                    apiCache.set('exercise_library', { ...exerciseData });
                    
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
    }

    /**
     * Show session message
     * @param {string} type - Alert type (success, danger, warning, info)
     * @param {string} message - Message to display
     */
    function showSessionMessage(type, message) {
        console.log(`Show session message: ${type} - ${message}`);
        
        // Show toast notification
        showToast(type, message);
        
        // Try to find the session alert message container
        const alertElement = document.getElementById('sessionAlertMessage');
        
        // If the element doesn't exist, try to create it
        if (!alertElement) {
            console.warn('sessionAlertMessage container not found, creating one');
            
            // Find a suitable container to add the alert message
            const container = document.querySelector('.container') || document.body;
            const sessionForm = document.getElementById('sessionForm');
            
            // Create the alert element
            const newAlertElement = document.createElement('div');
            newAlertElement.id = 'sessionAlertMessage';
            newAlertElement.className = `alert alert-${type} mt-3`;
            newAlertElement.style.display = 'block';
            
            // Find the best place to insert the alert
            if (sessionForm) {
                // If session form exists, insert after it
                sessionForm.parentNode.insertBefore(newAlertElement, sessionForm.nextSibling);
            } else {
                // Otherwise insert at the beginning of the container
                container.insertBefore(newAlertElement, container.firstChild);
            }
            
            // Set the message
            newAlertElement.innerHTML = message;
            
            // Auto-hide success messages after 3 seconds
            if (type === 'success') {
                setTimeout(() => {
                    newAlertElement.style.display = 'none';
                }, 3000);
            }
            
            return;
        }
        
        // Update existing alert element
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
     * EVENT HANDLERS
     */
    function setupEventHandlers() {
        console.log('Setting up event handlers');
        
        // Add exercise button
        const addExerciseBtn = document.getElementById('addExerciseBtn');
        if (addExerciseBtn) {
            addExerciseBtn.addEventListener('click', function() {
                const newExerciseForm = document.getElementById('newExerciseForm');
                
                // Use smooth slide-down animation
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
                
                this.style.display = 'none';
            });
        }

        // Cancel add exercise button
        const cancelAddExerciseBtn = document.getElementById('cancelAddExercise');
        if (cancelAddExerciseBtn) {
            cancelAddExerciseBtn.addEventListener('click', function() {
                const newExerciseForm = document.getElementById('newExerciseForm');
                const addExerciseBtn = document.getElementById('addExerciseBtn');
                
                // Use smooth slide-up animation
                if (newExerciseForm) {
                    newExerciseForm.style.maxHeight = '0';
                    
                    // Hide completely after animation
                    setTimeout(() => {
                        newExerciseForm.style.display = 'none';
                        if (addExerciseBtn) addExerciseBtn.style.display = 'block';
                    }, 500);
                } else {
                    // Fallback if animation doesn't work
                    document.getElementById('newExerciseForm').style.display = 'none';
                    document.getElementById('addExerciseBtn').style.display = 'block';
                }
            });
        }

        // Delete session button
        const deleteSessionBtn = document.getElementById('deleteSessionBtn');
        if (deleteSessionBtn) {
            deleteSessionBtn.addEventListener('click', handleDeleteSession);
        }
        
        // Load template button - check if we're on a page that needs this
        const loadTemplateBtn = document.getElementById('loadTemplateBtn');
        if (loadTemplateBtn) {
            console.log('Adding event listener to load template button');
            loadTemplateBtn.addEventListener('click', function() {
                // Show template selection modal
                openTemplateModal();
            });
        } else {
            // Only log the warning if we're on a page that should have this button
            const sessionId = new URLSearchParams(window.location.search).get('id');
            if (sessionId) {
                console.warn('Load template button not found on session page');
            }
        }
        
        // Check for page-specific elements and set up handlers conditionally
        const templateModal = document.getElementById('templateModal');
        if (!templateModal && loadTemplateBtn) {
            console.warn('Template modal not found but load template button exists');
            
            // Create the modal if it doesn't exist but should
            createTemplateModal();
        }
        
        // Add keyboard shortcuts
        setupKeyboardShortcuts();
    }
    
    /**
     * Setup keyboard shortcuts for common actions
     */
    function setupKeyboardShortcuts() {
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
    }

    /**
     * Handle deletion of a training session
     * Shows confirmation dialog before deleting
     */
    function handleDeleteSession() {
        console.log('Delete session button clicked');
        
        // Get session ID from URL
        const sessionId = new URLSearchParams(window.location.search).get('id');
        if (!sessionId) {
            showToast('danger', 'No session ID found');
            return;
        }
        
        // Show confirmation dialog with improved UX
        const confirmDelete = confirm('Are you sure you want to delete this training session? This action cannot be undone.');
        
        if (confirmDelete) {
            console.log(`Deleting session with ID: ${sessionId}`);
            
            // Show loading state on button
            const deleteButton = document.getElementById('deleteSessionBtn');
            if (deleteButton) {
                const originalBtnText = deleteButton.innerHTML;
                deleteButton.disabled = true;
                deleteButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
            }
            
            // Make API call to delete session
            fetch(`api/training_sessions.php?id=${sessionId}`, {
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
                    showToast('success', 'Training session deleted successfully. Redirecting...');
                    
                    // Redirect back to main training page after successful deletion
                    setTimeout(() => {
                        window.location.href = 'training.php';
                    }, 1500);
                } else {
                    showToast('danger', result.message || 'Failed to delete training session');
                    
                    // Restore button state if we stay on the page
                    if (deleteButton) {
                        deleteButton.disabled = false;
                        deleteButton.innerHTML = originalBtnText;
                    }
                }
            })
            .catch(error => {
                console.error('Error deleting session:', error);
                showToast('danger', 'An error occurred while deleting the session');
                
                // Restore button state
                if (deleteButton) {
                    deleteButton.disabled = false;
                    deleteButton.innerHTML = originalBtnText;
                }
            });
        }
    }
    
    /**
     * Fetch and render a newly added exercise without page refresh
     * @param {number|string} sessionId - ID of the current training session
     */
    function fetchAndRenderNewExercise(sessionId) {
        if (!sessionId) {
            console.error('No session ID provided for fetching new exercise');
            return;
        }
        
        console.log(`Fetching latest exercise for session ${sessionId}`);
        
        // Get exercise list container
        const exerciseList = document.getElementById('exercisesList');
        if (!exerciseList) {
            console.error('Exercise list container not found');
            return;
        }
        
        // Add loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'text-center my-3';
        loadingIndicator.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        `;
        exerciseList.appendChild(loadingIndicator);
        
        // Fetch latest exercise data
        fetch(`api/workout_details.php?session_id=${sessionId}&latest=true`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`API error: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(result => {
                // Remove loading indicator
                if (loadingIndicator.parentNode) {
                    loadingIndicator.parentNode.removeChild(loadingIndicator);
                }
                
                if (result.success && result.data && result.data.length > 0) {
                    // Get the latest exercise
                    const newExercise = result.data[0];
                    
                    // Add the new exercise to the list
                    const exerciseItem = createExerciseListItem(newExercise);
                    
                    // Check if the "No exercises yet" message exists and remove it
                    const noExercisesMsg = exerciseList.querySelector('.no-exercises-message');
                    if (noExercisesMsg) {
                        noExercisesMsg.remove();
                    }
                    
                    // Add the new exercise item to the list with a highlighting effect
                    exerciseList.appendChild(exerciseItem);
                    
                    // Add highlight animation
                    setTimeout(() => {
                        exerciseItem.classList.add('bg-light-success');
                        setTimeout(() => {
                            exerciseItem.classList.remove('bg-light-success');
                        }, 2000);
                    }, 100);
                    
                    // Add event listeners to the new exercise item
                    setupExerciseItemEventListeners(exerciseItem);
                } else {
                    console.warn('No new exercise data returned from API');
                }
            })
            .catch(error => {
                console.error('Error fetching new exercise:', error);
                
                // Remove loading indicator
                if (loadingIndicator.parentNode) {
                    loadingIndicator.parentNode.removeChild(loadingIndicator);
                }
                
                // Show error message
                showToast('danger', 'Failed to load new exercise. Please refresh the page.');
            });
    }
    
    /**
     * Create an exercise list item element
     * @param {Object} exercise - Exercise data
     * @returns {HTMLElement} - Exercise list item element
     */
    function createExerciseListItem(exercise) {
        const listItem = document.createElement('div');
        listItem.className = 'card mb-3 exercise-item';
        listItem.dataset.exerciseId = exercise.id;
        listItem.style.transition = 'background-color 0.5s ease';
        
        // Format exercise card with better UI
        listItem.innerHTML = `
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="card-title mb-0">
                    <span class="text-primary">${exercise.muscle_group}</span> - 
                    ${exercise.exercise_name}
                </h5>
                <div class="btn-group">
                    <button type="button" class="btn btn-sm btn-outline-primary edit-exercise" title="Edit Exercise">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger delete-exercise" title="Delete Exercise">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <p class="card-text"><strong>Equipment:</strong> ${exercise.equipment}</p>
                        <p class="card-text"><strong>Sets:</strong> ${exercise.sets || 'N/A'}</p>
                        <p class="card-text"><strong>Reps:</strong> ${exercise.reps || 'N/A'}</p>
                        <p class="card-text"><strong>Weight:</strong> ${exercise.weight ? exercise.weight + ' kg' : 'N/A'}</p>
                    </div>
                    <div class="col-md-6">
                        <p class="card-text"><strong>Pre Energy Level:</strong> ${exercise.pre_energy_level || 'N/A'}/10</p>
                        <p class="card-text"><strong>Pre Soreness Level:</strong> ${exercise.pre_soreness_level || 'N/A'}/10</p>
                        <p class="card-text"><strong>Stimulus Rating:</strong> ${exercise.stimulus_rating || 'N/A'}/10</p>
                        <p class="card-text"><strong>Fatigue Rating:</strong> ${exercise.fatigue_level || 'N/A'}/10</p>
                    </div>
                </div>
                ${exercise.notes ? 
                    `<div class="mt-3">
                        <strong>Notes:</strong>
                        <p class="card-text">${exercise.notes}</p>
                    </div>` : ''}
            </div>
        `;
        
        return listItem;
    }
    
    /**
     * Setup event listeners for an exercise list item
     * @param {HTMLElement} exerciseItem - Exercise list item element
     */
    function setupExerciseItemEventListeners(exerciseItem) {
        // Edit button handler
        const editBtn = exerciseItem.querySelector('.edit-exercise');
        if (editBtn) {
            editBtn.addEventListener('click', function() {
                const exerciseId = exerciseItem.dataset.exerciseId;
                editExercise(exerciseId);
            });
        }
        
        // Delete button handler
        const deleteBtn = exerciseItem.querySelector('.delete-exercise');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function() {
                const exerciseId = exerciseItem.dataset.exerciseId;
                deleteExercise(exerciseId, exerciseItem);
            });
        }
    }
    
    /**
     * Handle editing an exercise
     * @param {string|number} exerciseId - ID of the exercise to edit
     */
    function editExercise(exerciseId) {
        console.log(`Editing exercise with ID: ${exerciseId}`);
        
        // Open exercise edit modal or form
        // This can be implemented based on your UI design
        showToast('info', 'Exercise edit functionality is being implemented');
        
        // For now, refresh the page to the exercise details
        // This should be replaced with a modal or inline editing
        /*
        const sessionId = new URLSearchParams(window.location.search).get('id');
        if (sessionId) {
            window.location.href = `training.php?id=${sessionId}&exercise=${exerciseId}`;
        }
        */
    }
    
    /**
     * Handle deleting an exercise
     * @param {string|number} exerciseId - ID of the exercise to delete
     * @param {HTMLElement} exerciseItem - Exercise list item element to remove
     */
    function deleteExercise(exerciseId, exerciseItem) {
        console.log(`Deleting exercise with ID: ${exerciseId}`);
        
        // Show confirmation dialog
        const confirmDelete = confirm('Are you sure you want to delete this exercise? This action cannot be undone.');
        
        if (confirmDelete) {
            // Show loading state
            exerciseItem.style.opacity = '0.5';
            
            // Make API call to delete exercise
            fetch(`api/workout_details.php?id=${exerciseId}`, {
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
                    // Remove exercise item with animation
                    exerciseItem.style.maxHeight = exerciseItem.scrollHeight + 'px';
                    exerciseItem.style.overflow = 'hidden';
                    exerciseItem.style.transition = 'max-height 0.5s ease-out, opacity 0.5s ease-out, margin-bottom 0.5s ease-out';
                    
                    setTimeout(() => {
                        exerciseItem.style.maxHeight = '0';
                        exerciseItem.style.marginBottom = '0';
                        exerciseItem.style.opacity = '0';
                        
                        setTimeout(() => {
                            exerciseItem.remove();
                            
                            // Check if there are no more exercises
                            const exercisesList = document.getElementById('exercisesList');
                            if (exercisesList && exercisesList.children.length === 0) {
                                // Add "no exercises" message
                                const noExercisesMsg = document.createElement('div');
                                noExercisesMsg.className = 'alert alert-info no-exercises-message';
                                noExercisesMsg.textContent = 'No exercises added to this session yet.';
                                exercisesList.appendChild(noExercisesMsg);
                            }
                        }, 500);
                    }, 10);
                    
                    showToast('success', 'Exercise deleted successfully');
                } else {
                    // Restore exercise item appearance
                    exerciseItem.style.opacity = '1';
                    showToast('danger', result.message || 'Failed to delete exercise');
                }
            })
            .catch(error => {
                console.error('Error deleting exercise:', error);
                
                // Restore exercise item appearance
                exerciseItem.style.opacity = '1';
                showToast('danger', 'An error occurred while deleting the exercise');
            });
        }
    }
    
    /**
     * Load workout details for a specific session
     * @param {string|number} sessionId - ID of the session to load
     */
    function loadWorkoutDetails(sessionId) {
        if (!sessionId) {
            console.error('No session ID provided for loading workout details');
            return;
        }
        
        console.log(`Loading workout details for session ${sessionId}`);
        
        // Get the container for exercises
        const exercisesList = document.getElementById('exercisesList');
        if (!exercisesList) {
            console.error('Exercises list container not found');
            return;
        }
        
        // Show loading state
        exercisesList.innerHTML = `
            <div class="text-center my-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading exercises...</span>
                </div>
                <p class="mt-2">Loading exercises...</p>
            </div>
        `;
        
        // Fetch workout details
        fetch(`api/workout_details.php?session_id=${sessionId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`API error: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(result => {
                // Clear loading indicator
                exercisesList.innerHTML = '';
                
                if (result.success && result.data && result.data.length > 0) {
                    // Render each exercise
                    result.data.forEach(exercise => {
                        const exerciseItem = createExerciseListItem(exercise);
                        exercisesList.appendChild(exerciseItem);
                        setupExerciseItemEventListeners(exerciseItem);
                    });
                    
                    // Also update any session details if needed
                    updateSessionDetails(result.session || {});
                } else {
                    // No exercises found
                    exercisesList.innerHTML = `
                        <div class="alert alert-info no-exercises-message">
                            No exercises added to this session yet.
                        </div>
                    `;
                }
            })
            .catch(error => {
                console.error('Error loading workout details:', error);
                
                // Show error message
                exercisesList.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        Failed to load exercises. Please try refreshing the page.
                        <p class="small mt-2">Error: ${error.message}</p>
                    </div>
                `;
            });
    }
    
    /**
     * Update session details with data from API
     * @param {Object} sessionData - Session data from API
     */
    function updateSessionDetails(sessionData) {
        if (!sessionData) return;
        
        console.log('Updating session details with:', sessionData);
        
        // Update session title if it exists
        const sessionTitle = document.getElementById('sessionTitle');
        if (sessionTitle && sessionData.name) {
            sessionTitle.textContent = sessionData.name;
        }
        
        // Update date field if it exists
        const dateField = document.getElementById('date');
        if (dateField && sessionData.date) {
            dateField.value = sessionData.date;
        }
        
        // Update time fields if they exist
        if (sessionData.training_start) {
            const startTime = sessionData.training_start.split(' ')[1].substring(0, 5);
            const startTimeField = document.getElementById('training_start_time');
            if (startTimeField) {
                startTimeField.value = startTime;
            }
        }
        
        if (sessionData.training_end) {
            const endTime = sessionData.training_end.split(' ')[1].substring(0, 5);
            const endTimeField = document.getElementById('training_end_time');
            if (endTimeField) {
                endTimeField.value = endTime;
            }
        }
        
        // Update session notes
        const notesField = document.getElementById('notes');
        if (notesField && sessionData.notes) {
            notesField.value = sessionData.notes;
        }
    }
    
    /**
     * Load recent training sessions
     */
    function loadRecentSessions() {
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
                    result.data.forEach(session => {
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
                            <td>${session.name || 'Unnamed Session'}</td>
                            <td>${duration}</td>
                            <td>${session.exercise_count || 0}</td>
                            <td>
                                <a href="training.php?id=${session.id}" class="btn btn-sm btn-primary">
                                    <i class="fas fa-edit me-1"></i> View/Edit
                                </a>
                            </td>
                        `;
                        
                        tbody.appendChild(row);
                    });
                    
                    recentSessionsContainer.appendChild(table);
                    
                    // Add click event for rows
                    const rows = tbody.querySelectorAll('.session-row');
                    rows.forEach(row => {
                        row.addEventListener('click', function(e) {
                            // Don't trigger if they clicked on the button itself
                            if (e.target.tagName !== 'A' && !e.target.closest('a')) {
                                const sessionId = this.dataset.sessionId;
                                window.location.href = `training.php?id=${sessionId}`;
                            }
                        });
                    });
                } else {
                    // No sessions found
                    recentSessionsContainer.innerHTML = `
                        <div class="alert alert-info">
                            No recent training sessions found. 
                            <a href="training.php" class="alert-link">Create your first session</a>.
                        </div>
                    `;
                }
            })
            .catch(error => {
                console.error('Error loading recent sessions:', error);
                
                // Show error message
                recentSessionsContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        Failed to load recent sessions. Please try refreshing the page.
                    </div>
                `;
            });
    }
    
    /**
     * Create template modal for loading workout templates
     */
    function createTemplateModal() {
        console.log('Creating template modal');
        
        // Create modal elements
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'templateModal';
        modal.tabIndex = '-1';
        modal.setAttribute('aria-labelledby', 'templateModalLabel');
        modal.setAttribute('aria-hidden', 'true');
        
        // Modal content
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="templateModalLabel">Load Workout Template</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div id="templateList" class="mb-3">
                            <div class="text-center my-3">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Loading templates...</span>
                                </div>
                                <p class="mt-2">Loading templates...</p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to body
        document.body.appendChild(modal);
        
        // Initialize modal (requires Bootstrap JS)
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const templateModal = new bootstrap.Modal(modal);
            templateModal._element = modal;
            return templateModal;
        } else {
            console.warn('Bootstrap JS not available, modal may not function properly');
            return { show: () => modal.style.display = 'block' };
        }
    }
    
    /**
     * Open template modal and load templates
     */
    function openTemplateModal() {
        console.log('Opening template modal');
        
        // Get or create the modal
        let templateModal = document.getElementById('templateModal');
        let bootstrapModal;
        
        if (!templateModal) {
            bootstrapModal = createTemplateModal();
            templateModal = document.getElementById('templateModal');
        } else if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            bootstrapModal = new bootstrap.Modal(templateModal);
        } else {
            bootstrapModal = { show: () => templateModal.style.display = 'block' };
        }
        
        // Show the modal
        bootstrapModal.show();
        
        // Load templates into the modal
        loadTemplates();
    }
    
    /**
     * Load workout templates into template modal
     */
    function loadTemplates() {
        console.log('Loading workout templates');
        
        const templateList = document.getElementById('templateList');
        if (!templateList) {
            console.error('Template list container not found');
            return;
        }
        
        // Fetch templates
        fetch('api/workout_templates.php')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`API error: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(result => {
                // Clear loading indicator
                templateList.innerHTML = '';
                
                if (result.success && result.data && result.data.length > 0) {
                    // Create template cards
                    const templatesContainer = document.createElement('div');
                    templatesContainer.className = 'row row-cols-1 row-cols-md-2 g-4';
                    
                    result.data.forEach(template => {
                        const card = document.createElement('div');
                        card.className = 'col';
                        
                        card.innerHTML = `
                            <div class="card h-100 template-card" data-template-id="${template.id}">
                                <div class="card-body">
                                    <h5 class="card-title">${template.name}</h5>
                                    <p class="card-text">
                                        <strong>Exercises:</strong> ${template.exercise_count || 'Unknown'}
                                    </p>
                                    <p class="card-text small text-muted">
                                        Created: ${new Date(template.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div class="card-footer">
                                    <button class="btn btn-primary btn-sm load-template" data-template-id="${template.id}">
                                        <i class="fas fa-plus-circle me-1"></i> Load Template
                                    </button>
                                </div>
                            </div>
                        `;
                        
                        templatesContainer.appendChild(card);
                    });
                    
                    templateList.appendChild(templatesContainer);
                    
                    // Add event listeners to template cards
                    const loadButtons = templateList.querySelectorAll('.load-template');
                    loadButtons.forEach(button => {
                        button.addEventListener('click', function() {
                            const templateId = this.dataset.templateId;
                            loadWorkoutTemplate(templateId);
                        });
                    });
                } else {
                    // No templates found
                    templateList.innerHTML = `
                        <div class="alert alert-info">
                            No workout templates found. 
                            <a href="workout_templates.php" class="alert-link">Create your first template</a>.
                        </div>
                    `;
                }
            })
            .catch(error => {
                console.error('Error loading templates:', error);
                
                // Show error message
                templateList.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        Failed to load workout templates. Please try refreshing the page.
                    </div>
                `;
            });
    }
    
    /**
     * Load a workout template into the current session
     * @param {string|number} templateId - ID of the template to load
     */
    function loadWorkoutTemplate(templateId) {
        console.log(`Loading workout template: ${templateId}`);
        
        // Get current session ID
        const sessionId = new URLSearchParams(window.location.search).get('id');
        if (!sessionId) {
            showToast('danger', 'No session ID found. Please save the session first.');
            return;
        }
        
        // Get the template load button and show loading state
        const loadButton = document.querySelector(`.load-template[data-template-id="${templateId}"]`);
        if (loadButton) {
            const originalBtnText = loadButton.innerHTML;
            loadButton.disabled = true;
            loadButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            
            // Make all other template buttons disabled
            const allButtons = document.querySelectorAll('.load-template');
            allButtons.forEach(btn => {
                if (btn !== loadButton) btn.disabled = true;
            });
            
            // Make API call to load template
            fetch(`api/workout_templates.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'apply_to_session',
                    template_id: templateId,
                    session_id: sessionId
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(result => {
                if (result.success) {
                    // Close the modal
                    const modal = document.getElementById('templateModal');
                    if (modal && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                        const bootstrapModal = bootstrap.Modal.getInstance(modal);
                        if (bootstrapModal) bootstrapModal.hide();
                    }
                    
                    showToast('success', 'Template loaded successfully! Refreshing...');
                    
                    // Refresh the page to show new exercises
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    // Restore button state
                    loadButton.disabled = false;
                    loadButton.innerHTML = originalBtnText;
                    
                    // Re-enable other buttons
                    allButtons.forEach(btn => btn.disabled = false);
                    
                    showToast('danger', result.message || 'Failed to load template');
                }
            })
            .catch(error => {
                console.error('Error loading template:', error);
                
                // Restore button state
                loadButton.disabled = false;
                loadButton.innerHTML = originalBtnText;
                
                // Re-enable other buttons
                allButtons.forEach(btn => btn.disabled = false);
                
                showToast('danger', 'An error occurred while loading the template');
            });
        } else {
            // Make API call without updating UI
            showToast('info', 'Loading template...');
            
            fetch(`api/workout_templates.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'apply_to_session',
                    template_id: templateId,
                    session_id: sessionId
                })
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    showToast('success', 'Template loaded successfully! Refreshing...');
                    
                    // Refresh the page to show new exercises
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    showToast('danger', result.message || 'Failed to load template');
                }
            })
            .catch(error => {
                console.error('Error loading template without UI updates:', error);
                showToast('danger', 'An error occurred while loading the template');
            });
        }
    }

    /**
     * Handle training session form submission
     * @param {Event} event - Form submit event
     */
    function handleSessionFormSubmit(event) {
        event.preventDefault();
        console.log('Processing training session form submission');
        
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Validate form before submission
        if (!data.date) {
            showToast('danger', 'Please select a date for the training session');
            return;
        }
        
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
        if (!submitBtn) {
            console.error('Submit button not found in form');
            showToast('danger', 'Form error: Submit button not found');
            return;
        }
        
        // Create a wrapper for the button if it doesn't have one already
        let buttonWrapper = submitBtn.closest('.submit-button-wrapper');
        if (!buttonWrapper) {
            buttonWrapper = document.createElement('div');
            buttonWrapper.className = 'submit-button-wrapper';
            submitBtn.parentNode.insertBefore(buttonWrapper, submitBtn);
            buttonWrapper.appendChild(submitBtn);
        }
        
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        const loadingOverlay = addLoadingOverlay(form);
        
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
                    showToast('success', 'Training session updated successfully');
                } else {
                    // Redirect to the new session page for new sessions
                    showToast('success', 'Training session created! Redirecting...');
                    setTimeout(() => {
                        window.location.href = `training.php?id=${result.session_id}`;
                    }, 1000);
                }
            } else {
                showToast('danger', result.message || 'Failed to save training session');
            }
        })
        .catch(error => {
            console.error('Error saving training session:', error);
            showToast('danger', 'An error occurred. Please try again.');
        })
        .finally(() => {
            // Restore button state
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            removeLoadingOverlay(loadingOverlay);
        });
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
        
        // Validate form
        if (!data.muscle_group || !data.equipment || !data.exercise_name) {
            showToast('danger', 'Please complete all required fields');
            return;
        }
        
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        if (!submitBtn) {
            showToast('danger', 'Submit button not found');
            return;
        }
        
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
        const loadingOverlay = addLoadingOverlay(form);
        
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
                showToast('success', 'Exercise added successfully');
                
                // Reset form
                form.reset();
                
                // Reset cascading dropdowns
                if (document.getElementById('newMuscleGroup')) document.getElementById('newMuscleGroup').value = '';
                if (document.getElementById('newEquipment')) clearDropdown(document.getElementById('newEquipment'), 'Select Equipment');
                if (document.getElementById('newExerciseName')) clearDropdown(document.getElementById('newExerciseName'), 'Select Exercise');
                
                // Reset range sliders
                if (document.getElementById('newPreEnergyLevelDisplay')) document.getElementById('newPreEnergyLevelDisplay').textContent = '5';
                if (document.getElementById('newPreSorenessLevelDisplay')) document.getElementById('newPreSorenessLevelDisplay').textContent = '5';
                if (document.getElementById('newStimulusDisplay')) document.getElementById('newStimulusDisplay').textContent = '5';
                if (document.getElementById('newFatigueLevelDisplay')) document.getElementById('newFatigueLevelDisplay').textContent = '5';
                
                // Hide new exercise form with animation
                const newExerciseForm = document.getElementById('newExerciseForm');
                if (newExerciseForm) {
                    newExerciseForm.style.maxHeight = '0';
                    
                    // Hide completely after animation
                    setTimeout(() => {
                        newExerciseForm.style.display = 'none';
                        const addExerciseBtn = document.getElementById('addExerciseBtn');
                        if (addExerciseBtn) addExerciseBtn.style.display = 'block';
                    }, 500);
                } else {
                    document.getElementById('newExerciseForm').style.display = 'none';
                    document.getElementById('addExerciseBtn').style.display = 'block';
                }
                
                // Fetch and add the new exercise to the page without full refresh
                fetchAndRenderNewExercise(data.session_id);
            } else {
                showToast('danger', result.message || 'Failed to add exercise');
            }
        })
        .catch(error => {
            console.error('Error adding exercise:', error);
            showToast('danger', 'An error occurred. Please try again.');
        })
        .finally(() => {
            // Restore button state
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            removeLoadingOverlay(loadingOverlay);
        });
    }

    /**
     * Set up range sliders to update their value displays
     */
    function setupRangeSliders() {
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
                // Just update the initial value
                valueDisplay.textContent = input.value;
            }
            
            // Use debounce for smoother interaction
            const debouncedUpdate = debounce(function(e) {
                const valueDisplay = this.nextElementSibling;
                if (valueDisplay && valueDisplay.classList.contains('range-value')) {
                    valueDisplay.textContent = this.value;
                }
            }, 10);
            
            // Input event listener
            input.addEventListener('input', debouncedUpdate);
        });
    }

    /**
     * Populate the muscle group dropdown with data
     * @param {HTMLSelectElement} select - The muscle group select element
     */
    function populateMuscleGroupDropdown(select) {
        if (!select) {
            console.error('No select element provided for populating muscle groups');
            return;
        }
        
        console.log('Populating muscle group dropdown...');
        
        // Clear current options
        clearDropdown(select, 'Select Muscle Group');
        
        // Add muscle group options
        if (exerciseData.muscleGroups && exerciseData.muscleGroups.length > 0) {
            console.log('Populating with muscle groups:', exerciseData.muscleGroups.length);
            
            // Sort muscle groups alphabetically for better UX
            const sortedGroups = [...exerciseData.muscleGroups].sort((a, b) => {
                const nameA = typeof a === 'object' ? a.name : a;
                const nameB = typeof b === 'object' ? b.name : b;
                return nameA.localeCompare(nameB);
            });
            
            sortedGroups.forEach(group => {
                const option = document.createElement('option');
                option.value = typeof group === 'object' ? group.name : group;
                option.textContent = typeof group === 'object' ? group.name : group;
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
     * Set up forms for training data entry
     */
    function setupForms() {
        console.log('Setting up forms...');
        
        // Set up session form
        const sessionForm = document.getElementById('sessionForm');
        if (sessionForm) {
            sessionForm.addEventListener('submit', handleSessionFormSubmit);
        }
        
        // Set up new exercise form
        const newExerciseForm = document.getElementById('newExerciseForm');
        if (newExerciseForm) {
            newExerciseForm.addEventListener('submit', handleNewExercise);
            
            // Set up cascading dropdowns
            setupCascadingDropdowns();
        }
        
        // Set up range sliders
        setupRangeSliders();
    }
    
    /**
     * Set up cascading dropdowns for muscle group, equipment, and exercise
     */
    function setupCascadingDropdowns() {
        // Get dropdown elements
        const muscleGroupDropdown = document.getElementById('newMuscleGroup');
        const equipmentDropdown = document.getElementById('newEquipment');
        const exerciseDropdown = document.getElementById('newExerciseName');
        
        if (!muscleGroupDropdown || !equipmentDropdown || !exerciseDropdown) {
            console.warn('One or more dropdowns not found for cascade setup');
            return;
        }
        
        // Initial population of muscle groups
        populateMuscleGroupDropdown(muscleGroupDropdown);
        
        // Muscle group change event - updates equipment options
        muscleGroupDropdown.addEventListener('change', function() {
            const selectedMuscle = this.value;
            
            // Clear dependent dropdowns
            clearDropdown(equipmentDropdown, 'Select Equipment');
            clearDropdown(exerciseDropdown, 'Select Exercise');
            
            if (selectedMuscle === '__custom__') {
                // Show custom muscle group input
                showCustomInput(this, 'Enter new muscle group');
                return;
            }
            
            if (!selectedMuscle) return;
            
            // Add loading state
            equipmentDropdown.classList.add('loading');
            
            // Populate equipment dropdown based on selected muscle group
            setTimeout(() => {
                populateEquipmentDropdown(equipmentDropdown, selectedMuscle);
                equipmentDropdown.classList.remove('loading');
            }, 100); // Short delay for better UX
        });
        
        // Equipment change event - updates exercise options
        equipmentDropdown.addEventListener('change', function() {
            const selectedEquipment = this.value;
            const selectedMuscle = muscleGroupDropdown.value;
            
            // Clear exercise dropdown
            clearDropdown(exerciseDropdown, 'Select Exercise');
            
            if (selectedEquipment === '__custom__') {
                // Show custom equipment input
                showCustomInput(this, 'Enter new equipment');
                return;
            }
            
            if (!selectedEquipment || !selectedMuscle) return;
            
            // Add loading state
            exerciseDropdown.classList.add('loading');
            
            // Populate exercise dropdown based on muscle group and equipment
            setTimeout(() => {
                populateExerciseDropdown(exerciseDropdown, selectedMuscle, selectedEquipment);
                exerciseDropdown.classList.remove('loading');
            }, 100); // Short delay for better UX
        });
        
        // Exercise name change event - handle custom exercise
        exerciseDropdown.addEventListener('change', function() {
            if (this.value === '__custom__') {
                // Show custom exercise input
                showCustomInput(this, 'Enter new exercise name');
            }
        });
    }
    
    /**
     * Clear a dropdown and add a default option
     * @param {HTMLSelectElement} select - The select element to clear
     * @param {string} defaultText - Text for the default option
     */
    function clearDropdown(select, defaultText) {
        if (!select) return;
        
        // Remove all options
        while (select.options.length > 0) {
            select.remove(0);
        }
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = defaultText;
        defaultOption.selected = true;
        defaultOption.disabled = true;
        select.appendChild(defaultOption);
    }
    
    /**
     * Show custom input field for dropdown
     * @param {HTMLSelectElement} dropdown - The dropdown to replace
     * @param {string} placeholder - Placeholder for the input
     */
    function showCustomInput(dropdown, placeholder) {
        // Store the original select element's attributes
        const id = dropdown.id;
        const name = dropdown.name;
        const parentElement = dropdown.parentElement;
        
        // Create the input element
        const input = document.createElement('input');
        input.type = 'text';
        input.id = id + 'Custom';
        input.name = name; // Use same name for form submission
        input.className = 'form-control';
        input.placeholder = placeholder;
        input.required = dropdown.required;
        
        // Create a container for the input and cancel button
        const container = document.createElement('div');
        container.className = 'input-group';
        
        // Create cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn btn-outline-secondary';
        cancelBtn.innerHTML = '<i class="fas fa-times"></i>';
        cancelBtn.title = 'Cancel';
        
        // Add elements to the container
        container.appendChild(input);
        container.appendChild(cancelBtn);
        
        // Hide select and show input group
        dropdown.style.display = 'none';
        parentElement.appendChild(container);
        
        // Set focus to the input
        input.focus();
        
        // Cancel button event handler
        cancelBtn.addEventListener('click', function() {
            // Remove the container and show the dropdown again
            parentElement.removeChild(container);
            dropdown.style.display = 'block';
            dropdown.value = '';
        });
    }

    /**
     * Populate equipment dropdown based on selected muscle group
     * @param {HTMLSelectElement} select - The equipment select element
     * @param {string} muscleGroup - Selected muscle group
     */
    function populateEquipmentDropdown(select, muscleGroup) {
        if (!select || !muscleGroup) return;
        
        console.log(`Populating equipment for muscle group: ${muscleGroup}`);
        
        // Clear current options
        clearDropdown(select, 'Select Equipment');
        
        // Get equipment for selected muscle group
        const equipment = exerciseData.equipmentByMuscle?.[muscleGroup] || [];
        
        if (equipment.length > 0) {
            // Sort equipment alphabetically
            const sortedEquipment = [...equipment].sort((a, b) => a.localeCompare(b));
            
            sortedEquipment.forEach(item => {
                const option = document.createElement('option');
                option.value = item;
                option.textContent = item;
                select.appendChild(option);
            });
            
            // Add custom option
            const customOption = document.createElement('option');
            customOption.value = '__custom__';
            customOption.textContent = 'Add New Equipment...';
            customOption.classList.add('text-primary');
            select.appendChild(customOption);
        } else {
            console.warn(`No equipment found for muscle group: ${muscleGroup}`);
            
            // Add custom option anyway
            const customOption = document.createElement('option');
            customOption.value = '__custom__';
            customOption.textContent = 'Add New Equipment...';
            customOption.classList.add('text-primary');
            select.appendChild(customOption);
        }
    }
    
    /**
     * Populate exercise dropdown based on muscle group and equipment
     * @param {HTMLSelectElement} select - The exercise select element
     * @param {string} muscleGroup - Selected muscle group
     * @param {string} equipment - Selected equipment
     */
    function populateExerciseDropdown(select, muscleGroup, equipment) {
        if (!select || !muscleGroup || !equipment) return;
        
        console.log(`Populating exercises for ${muscleGroup} with ${equipment}`);
        
        // Clear current options
        clearDropdown(select, 'Select Exercise');
        
        // Get exercises for selected combination
        const key = `${muscleGroup}|${equipment}`;
        const exercises = exerciseData.exercisesByMuscleAndEquipment?.[key] || [];
        
        if (exercises.length > 0) {
            // Sort exercises alphabetically
            const sortedExercises = [...exercises].sort((a, b) => 
                a.name.localeCompare(b.name));
            
            sortedExercises.forEach(exercise => {
                const option = document.createElement('option');
                option.value = exercise.name;
                option.textContent = exercise.name;
                option.dataset.id = exercise.id || '';  // Store ID if available
                select.appendChild(option);
            });
            
            // Add custom option
            const customOption = document.createElement('option');
            customOption.value = '__custom__';
            customOption.textContent = 'Add New Exercise...';
            customOption.classList.add('text-primary');
            select.appendChild(customOption);
        } else {
            console.warn(`No exercises found for ${muscleGroup} with ${equipment}`);
            
            // Add custom option anyway
            const customOption = document.createElement('option');
            customOption.value = '__custom__';
            customOption.textContent = 'Add New Exercise...';
            customOption.classList.add('text-primary');
            select.appendChild(customOption);
        }
    }
});