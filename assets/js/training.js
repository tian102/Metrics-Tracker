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
    initializePage();

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
                    showErrorMessage('Failed to load exercise data. Please refresh the page or try again later.');
                });
        } catch (error) {
            console.error('Error during initialization:', error);
            showErrorMessage('An error occurred while initializing the page. Please refresh or contact support.');
        }
    }

    /**
     * Load exercise data with better error handling
     */
    function loadExerciseData() {
        console.log('Loading exercise data...');
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
     * Process data from the API and normalize it for our application
     * @param {Object} data The exercise data object to process
     */
    function processExerciseData(data) {
        try {
            // Store muscle groups
            if (data.muscle_groups) {
                exerciseData.muscleGroups = data.muscle_groups;
            } else if (Array.isArray(data)) {
                // Handle array format by extracting unique muscle groups
                const muscleGroups = [...new Set(data
                    .filter(item => item.muscle_group)
                    .map(item => typeof item.muscle_group === 'object' ? item.muscle_group.name : item.muscle_group))];
                exerciseData.muscleGroups = muscleGroups.map(name => ({ id: name, name: name }));
            }
            
            // Store equipment
            if (data.equipment) {
                exerciseData.equipment = data.equipment;
            } else if (Array.isArray(data)) {
                // Handle array format by extracting unique equipment
                const equipment = [...new Set(data
                    .filter(item => item.equipment)
                    .map(item => typeof item.equipment === 'object' ? item.equipment.name : item.equipment))];
                exerciseData.equipment = equipment.map(name => ({ id: name, name: name }));
            }
            
            // Store exercises with normalized relationships
            if (data.exercises) {
                exerciseData.exercises = data.exercises;
            } else if (Array.isArray(data)) {
                exerciseData.exercises = data;
            } else {
                exerciseData.exercises = [];
            }
            
            console.log('Processed exercise data:', exerciseData);
        } catch (error) {
            console.error('Error processing exercise data:', error);
            throw new Error('Failed to process exercise data: ' + error.message);
        }
    }

    /**
     * Show a visible error message to the user
     * @param {string} message - The error message to show
     */
    function showErrorMessage(message) {
        // Try different containers for showing error
        const containers = [
            document.querySelector('.alert-container'),
            document.getElementById('sessionAlertMessage'),
            document.getElementById('workoutAlertMessage'),
            document.querySelector('.card-content')
        ];
        
        // Find first available container
        let container = containers.find(el => el !== null);
        
        // If no container is found, create one
        if (!container) {
            container = document.createElement('div');
            container.className = 'alert-container mt-3';
            
            // Try to insert at beginning of content
            const content = document.querySelector('.container') || document.body;
            content.insertBefore(container, content.firstChild);
        }
        
        // Create and show error message
        const errorAlert = document.createElement('div');
        errorAlert.className = 'alert alert-danger';
        errorAlert.innerHTML = `
            <i class="fas fa-exclamation-circle me-2"></i>
            ${message}
        `;
        
        // Clear container and add error
        container.innerHTML = '';
        container.appendChild(errorAlert);
        container.style.display = 'block';
    }

    /**
     * Show session message
     * @param {string} type - Alert type (success, danger, warning, info)
     * @param {string} message - Message to display
     */
    function showSessionMessage(type, message) {
        console.log(`Show session message: ${type} - ${message}`);
        
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
    }

    /**
     * Create template modal if it doesn't exist
     */
    function createTemplateModal() {
        console.log('Creating template modal dynamically');
        
        // Create modal container
        const modal = document.createElement('div');
        modal.id = 'templateModal';
        modal.className = 'modal fade';
        modal.tabIndex = '-1';
        modal.setAttribute('aria-labelledby', 'templateModalLabel');
        modal.setAttribute('aria-hidden', 'true');
        
        // Set modal content
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="templateModalLabel">Select Workout Template</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div id="templatesList">
                            <!-- Templates will be loaded here -->
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to document body
        document.body.appendChild(modal);
        
        console.log('Template modal created dynamically');
    }

    /**
     * Open the template modal
     */
    function openTemplateModal() {
        console.log('Opening template modal');
        
        // Get or create the modal
        let templateModal = document.getElementById('templateModal');
        if (!templateModal) {
            console.log('Template modal not found, creating it');
            createTemplateModal();
            templateModal = document.getElementById('templateModal');
        }
        
        if (templateModal) {
            // Make sure the modal body exists
            let modalBody = templateModal.querySelector('.modal-body');
            if (!modalBody) {
                console.log('Modal body not found, creating it');
                const modalContent = templateModal.querySelector('.modal-content');
                modalBody = document.createElement('div');
                modalBody.className = 'modal-body';
                
                // Insert before the footer or add to the end
                const modalFooter = templateModal.querySelector('.modal-footer');
                if (modalFooter) {
                    modalContent.insertBefore(modalBody, modalFooter);
                } else {
                    modalContent.appendChild(modalBody);
                }
            }
            
            // Make sure the templates list container exists
            let templatesList = modalBody.querySelector('#templatesList');
            if (!templatesList) {
                console.log('Templates list container not found, creating it');
                templatesList = document.createElement('div');
                templatesList.id = 'templatesList';
                modalBody.appendChild(templatesList);
            }
            
            // Load templates
            loadTemplates();
            
            // Initialize and show the modal with Bootstrap
            try {
                const bsModal = new bootstrap.Modal(templateModal);
                bsModal.show();
            } catch (error) {
                console.error('Error showing modal:', error);
                alert('Error showing template modal. Please try again.');
            }
        } else {
            console.error('Could not find or create template modal');
            showSessionMessage('danger', 'Could not open template selection. Please try again.');
        }
    }

    /**
     * Handle deleting a training session
     */
    function handleDeleteSession() {
        console.log('Deleting training session');
        
        const sessionId = new URLSearchParams(window.location.search).get('id');
        if (!sessionId) {
            showSessionMessage('danger', 'Session ID not found');
            return;
        }
        
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

    function setupForms() {
        console.log('Setting up forms...');
        
        // Setup session form
        const sessionForm = document.getElementById('sessionForm');
        if (sessionForm) {
            // Use an anonymous function instead of directly referencing handleSessionFormSubmit
            sessionForm.addEventListener('submit', function(event) {
                event.preventDefault();
                console.log('Session form submitted');
                
                try {
                    handleSessionFormSubmit(event);
                } catch (error) {
                    console.error('Error in form submission handler:', error);
                    showErrorMessage('Error saving session. Please try again.');
                }
            });
        }

        // Setup new exercise form
        setupNewExerciseForm();
        
        // Setup existing exercise forms
        setupExistingExerciseForms();
        
        // Setup range sliders
        setupRangeSliders();
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
            showSessionMessage('danger', 'Form error: Submit button not found');
            return;
        }
        
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
        if (!submitBtn) {
            showWorkoutMessage('danger', 'Submit button not found', document.getElementById('workoutAlertMessage'));
            return;
        }
        
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
                if (document.getElementById('newMuscleGroup')) document.getElementById('newMuscleGroup').value = '';
                if (document.getElementById('newEquipment')) clearDropdown(document.getElementById('newEquipment'), 'Select Equipment');
                if (document.getElementById('newExerciseName')) clearDropdown(document.getElementById('newExerciseName'), 'Select Exercise');
                
                // Reset range sliders
                if (document.getElementById('newPreEnergyLevelDisplay')) document.getElementById('newPreEnergyLevelDisplay').textContent = '5';
                if (document.getElementById('newPreSorenessLevelDisplay')) document.getElementById('newPreSorenessLevelDisplay').textContent = '5';
                if (document.getElementById('newStimulusDisplay')) document.getElementById('newStimulusDisplay').textContent = '5';
                if (document.getElementById('newFatigueLevelDisplay')) document.getElementById('newFatigueLevelDisplay').textContent = '5';
                
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
     * Show workout message
     * @param {string} type - Alert type (success, danger, warning, info)
     * @param {string} message - Message to display
     * @param {Element} container - Element to show message in
     */
    function showWorkoutMessage(type, message, container) {
        if (!container) {
            console.error('No container provided for workout message');
            return;
        }
        
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
     * Fetch and render the newly added exercise
     * @param {number} sessionId - The session ID
     */
    function fetchAndRenderNewExercise(sessionId) {
        if (!sessionId) {
            console.error('No session ID provided for fetching new exercise');
            return;
        }
        
        fetch(`api/workout_details.php?session_id=${sessionId}`)
            .then(response => response.json())
            .then(result => {
                if (result.success && result.data && result.data.length > 0) {
                    // Reload the exercises list
                    loadWorkoutDetails(sessionId);
                }
            })
            .catch(error => {
                console.error('Error fetching new exercise:', error);
            });
    }

    /**
     * Load templates
     */
    function loadTemplates() {
        console.log('Loading templates');
        
        // Find templates container
        const templatesList = document.getElementById('templatesList');
        if (!templatesList) {
            console.error('Templates list container not found');
            return;
        }
        
        // Show loading indicator
        templatesList.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p>Loading templates...</p>
            </div>
        `;
        
        // Load templates from API
        fetch('api/workout_templates.php')
            .then(response => response.json())
            .then(result => {
                if (result.success && result.data && result.data.length > 0) {
                    renderTemplatesList(result.data, templatesList);
                } else {
                    templatesList.innerHTML = `
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>
                            No workout templates found. <a href="workout_templates.php">Create a template</a> to get started.
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
     * Render templates list
     * @param {Array} templates - Array of template objects
     * @param {HTMLElement} container - Container element for the templates
     */
    function renderTemplatesList(templates, container) {
        console.log('Rendering templates:', templates.length);
        
        let html = '';
        
        templates.forEach(template => {
            const isFavorite = template.is_favorite === '1' || template.is_favorite === 1 || template.is_favorite === true;
            
            html += `
                <div class="card mb-3 template-card" data-id="${template.id}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <h5 class="card-title">
                                ${isFavorite ? '<i class="fas fa-star text-warning me-1"></i>' : ''}
                                ${template.name}
                            </h5>
                            <span class="badge bg-info">${template.exercise_count} exercises</span>
                        </div>
                        
                        ${template.description ? `<p class="card-text text-muted">${template.description}</p>` : ''}
                        
                        <div class="d-flex justify-content-end mt-3">
                            <button class="btn btn-primary use-template-btn" data-id="${template.id}">
                                <i class="fas fa-plus me-1"></i> Use Template
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // Add event listeners to use template buttons
        const buttons = container.querySelectorAll('.use-template-btn');
        console.log(`Found ${buttons.length} template buttons`);
        
        buttons.forEach(btn => {
            btn.addEventListener('click', function() {
                const templateId = this.dataset.id;
                console.log('Use template button clicked for template ID:', templateId);
                useTemplate(templateId);
            });
        });
    }

    /**
     * Use a template to add exercises to the current session
     * @param {string} templateId - ID of the template to use
     */
    function useTemplate(templateId) {
        if (!templateId) {
            console.error('No template ID provided');
            return;
        }
        
        // Get session ID from URL
        const sessionId = new URLSearchParams(window.location.search).get('id');
        if (!sessionId) {
            console.error('No session ID found in URL');
            showSessionMessage('danger', 'Session ID not found. Please save the session first.');
            return;
        }
        
        console.log(`Applying template ID ${templateId} to session ID ${sessionId}`);
        
        // Show loading state
        const btn = document.querySelector(`.use-template-btn[data-id="${templateId}"]`);
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
        }
        
        // Get the session date from the form
        let sessionDate = document.querySelector('input[name="date"]')?.value;
        
        // If we couldn't find the date in the form, try to get it from the existing exercise data
        if (!sessionDate) {
            // Try to get today's date as fallback in YYYY-MM-DD format
            const today = new Date();
            sessionDate = today.toISOString().split('T')[0];
            console.log('Using today as fallback date:', sessionDate);
        }
        
        // Prepare data with date included
        const data = {
            template_id: templateId,
            session_id: sessionId,
            date: sessionDate
        };
        
        console.log('Sending template data:', data);
        
        // Send request to add template exercises to session
        fetch(`api/training_sessions.php?action=apply_template&session_id=${sessionId}&template_id=${templateId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            console.log('Apply template result:', result);
            if (result.success) {
                // Close the modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('templateModal'));
                if (modal) modal.hide();
                
                // Show success message (on current page, will be lost on redirect)
                showSessionMessage('success', result.message || 'Template applied successfully. Redirecting...');
                
                // If a new session was created, redirect to it
                if (result.session_id && result.session_id !== sessionId) {
                    console.log(`New session created with ID ${result.session_id}. Redirecting...`);
                    setTimeout(() => {
                        window.location.href = `training.php?id=${result.session_id}`;
                    }, 1000);
                } else {
                    // No new session, just reload exercises for current session
                    loadWorkoutDetails(sessionId);
                }
            } else {
                showSessionMessage('danger', result.message || 'Failed to add template exercises');
            }
        })
        .catch(error => {
            console.error('Error using template:', error);
            showSessionMessage('danger', 'Error adding template exercises. Please try again.');
        })
        .finally(() => {
            // Reset button
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-plus me-1"></i> Use Template';
            }
        });
    }

    /**
     * Set up the new exercise form with cascading dropdowns
     */
    function setupNewExerciseForm() {
        console.log('Setting up new exercise form...');
        
        // Get the workout details form
        const workoutDetailsForm = document.getElementById('workoutDetailsForm');
        if (!workoutDetailsForm) {
            console.log('Workout details form not found - may not be on session edit page');
            return;
        }

        // Get the form elements
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
            const deleteBtn = form.closest('.exercise-container')?.querySelector('.delete-exercise-btn');
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
        // For all range sliders
        const rangeInputs = document.querySelectorAll('.range-slider');
        if (rangeInputs.length === 0) {
            console.log('No range sliders found');
            return;
        }
        
        console.log('Setting up range sliders...');
        
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
            
            exerciseData.muscleGroups.forEach(group => {
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
     * Add custom option functionality to the dropdown menus
     * @param {HTMLSelectElement} muscleGroupSelect - The muscle group select element
     * @param {HTMLSelectElement} equipmentSelect - The equipment select element
     * @param {HTMLSelectElement} exerciseSelect - The exercise select element
     */
    function addCustomOptionSupport(muscleGroupSelect, equipmentSelect, exerciseSelect) {
        if (!muscleGroupSelect || !equipmentSelect || !exerciseSelect) {
            console.error('Missing select elements for custom option support');
            return;
        }
        
        // Setup cascading filters first
        setupCascadingFilters(muscleGroupSelect, equipmentSelect, exerciseSelect);
        
        // Add custom option handlers for each dropdown
        addCustomOptionHandler(muscleGroupSelect, 'muscle_group', () => {
            populateMuscleGroupDropdown(muscleGroupSelect);
        });
        
        addCustomOptionHandler(equipmentSelect, 'equipment', () => {
            const muscleGroupName = muscleGroupSelect.value;
            const muscleGroup = exerciseData.muscleGroups.find(g => 
                g.name === muscleGroupName || g === muscleGroupName);
            
            if (muscleGroup) {
                const muscleGroupId = typeof muscleGroup === 'object' ? muscleGroup.id : muscleGroup;
                populateEquipmentDropdown(equipmentSelect, muscleGroupId);
            }
        });
        
        addCustomOptionHandler(exerciseSelect, 'exercise', () => {
            const muscleGroupName = muscleGroupSelect.value;
            const equipmentName = equipmentSelect.value;
            
            const muscleGroup = exerciseData.muscleGroups.find(g => 
                g.name === muscleGroupName || g === muscleGroupName);
            const equipment = exerciseData.equipment.find(e => 
                e.name === equipmentName || e === equipmentName);
            
            if (muscleGroup && equipment) {
                const muscleGroupId = typeof muscleGroup === 'object' ? muscleGroup.id : muscleGroup;
                const equipmentId = typeof equipment === 'object' ? equipment.id : equipment;
                populateExerciseDropdown(exerciseSelect, muscleGroupId, equipmentId);
            }
        });
    }

    /**
     * Setup cascading dropdown filters for muscle groups, equipment, and exercises
     * @param {HTMLSelectElement} muscleGroupSelect - Muscle group select element
     * @param {HTMLSelectElement} equipmentSelect - Equipment select element
     * @param {HTMLSelectElement} exerciseSelect - Exercise select element
     */
    function setupCascadingFilters(muscleGroupSelect, equipmentSelect, exerciseSelect) {
        if (!muscleGroupSelect || !equipmentSelect || !exerciseSelect) {
            console.error('Missing select elements for cascading filters');
            return;
        }
        
        console.log('Setting up cascading filters...');
        
        // Flag to prevent cascade events during form restoration
        let isRestoringState = false;
        
        // When muscle group changes, update equipment options
        muscleGroupSelect.addEventListener('change', function() {
            if (isRestoringState) return;
            if (this.value === '__custom__' || this.value === '__loading__') return;
            
            console.log('Muscle group changed to:', this.value);
            
            const muscleGroupName = this.value;
            if (!muscleGroupName) return;
            
            // Reset dependent dropdowns
            clearDropdown(equipmentSelect, 'Select Equipment');
            clearDropdown(exerciseSelect, 'Select Exercise');
            
            // Add custom options back
            addCustomOption(equipmentSelect, 'Add New Equipment...');
            addCustomOption(exerciseSelect, 'Add New Exercise...');
            
            // Find muscle group ID
            const muscleGroup = exerciseData.muscleGroups.find(group => 
                (typeof group === 'object' && group.name === muscleGroupName) || group === muscleGroupName);
            
            if (muscleGroup) {
                const muscleGroupId = typeof muscleGroup === 'object' ? muscleGroup.id : muscleGroup;
                populateEquipmentDropdown(equipmentSelect, muscleGroupId);
            }
        });
        
        // When equipment changes, update exercise options
        equipmentSelect.addEventListener('change', function() {
            if (isRestoringState) return;
            if (this.value === '__custom__' || this.value === '__loading__') return;
            
            console.log('Equipment changed to:', this.value);
            
            const equipmentName = this.value;
            const muscleGroupName = muscleGroupSelect.value;
            if (!equipmentName || !muscleGroupName) return;
            
            // Reset exercise dropdown
            clearDropdown(exerciseSelect, 'Select Exercise');
            addCustomOption(exerciseSelect, 'Add New Exercise...');
            
            // Find muscle group and equipment IDs
            const muscleGroup = exerciseData.muscleGroups.find(group => 
                (typeof group === 'object' && group.name === muscleGroupName) || group === muscleGroupName);
            const equipment = exerciseData.equipment.find(item => 
                (typeof item === 'object' && item.name === equipmentName) || item === equipmentName);
            
            if (muscleGroup && equipment) {
                const muscleGroupId = typeof muscleGroup === 'object' ? muscleGroup.id : muscleGroup;
                const equipmentId = typeof equipment === 'object' ? equipment.id : equipment;
                populateExerciseDropdown(exerciseSelect, muscleGroupId, equipmentId);
            }
        });
    }

    /**
     * Add a custom option to a select element
     * @param {HTMLSelectElement} select - The select element
     * @param {string} text - The text for the custom option
     */
    function addCustomOption(select, text) {
        if (!select) return;
        
        const customOption = document.createElement('option');
        customOption.value = '__custom__';
        customOption.textContent = text;
        customOption.classList.add('text-primary');
        select.appendChild(customOption);
    }

    /**
     * Add a custom option handler to a select element
     * @param {HTMLSelectElement} select - The select element
     * @param {string} type - The type of data ('muscle_group', 'equipment', 'exercise')
     * @param {Function} callback - Function to call after adding
     */
    function addCustomOptionHandler(select, type, callback) {
        if (!select) return;
        
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
                    this.value = '__loading__';
                    
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
                            const muscleGroupSelect = document.getElementById('newMuscleGroup');
                            const equipmentSelect = document.getElementById('newEquipment');
                            
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
                        this.disabled = false;
                        
                        if (result.success) {
                            // Reload exercise data
                            return loadExerciseData().then(() => {
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
     * @param {number|string} muscleGroupId - Selected muscle group ID
     */
    function populateEquipmentDropdown(equipmentSelect, muscleGroupId) {
        if (!equipmentSelect || !muscleGroupId) return;
        
        // Preserve custom option
        const customOption = Array.from(equipmentSelect.options).find(option => option.value === '__custom__');
        clearDropdown(equipmentSelect, 'Select Equipment');
        if (customOption) {
            equipmentSelect.appendChild(customOption);
        }
        
        // Find equipment used with this muscle group
        const equipmentForMuscleGroup = new Set();
        
        exerciseData.exercises.forEach(exercise => {
            const exerciseMuscleGroupId = typeof exercise.muscle_group === 'object' 
                ? exercise.muscle_group.id 
                : exercise.muscle_group_id;
                
            if (exerciseMuscleGroupId == muscleGroupId) { // Use loose equality for string/number matching
                const equipmentId = typeof exercise.equipment === 'object'
                    ? exercise.equipment.id
                    : exercise.equipment_id;
                    
                if (equipmentId) {
                    equipmentForMuscleGroup.add(equipmentId);
                }
            }
        });
        
        // Add equipment options
        exerciseData.equipment
            .filter(equipment => {
                const equipId = typeof equipment === 'object' ? equipment.id : equipment;
                return equipmentForMuscleGroup.has(equipId);
            })
            .sort((a, b) => {
                const nameA = typeof a === 'object' ? a.name : a;
                const nameB = typeof b === 'object' ? b.name : b;
                return nameA.localeCompare(nameB);
            })
            .forEach(equipment => {
                const option = document.createElement('option');
                option.value = typeof equipment === 'object' ? equipment.name : equipment;
                option.textContent = typeof equipment === 'object' ? equipment.name : equipment;
                equipmentSelect.appendChild(option);
            });
    }

    /**
     * Populate exercise dropdown based on muscle group and equipment selection
     * @param {HTMLSelectElement} exerciseSelect - Exercise select element to update
     * @param {number|string} muscleGroupId - Selected muscle group ID
     * @param {number|string} equipmentId - Selected equipment ID
     */
    function populateExerciseDropdown(exerciseSelect, muscleGroupId, equipmentId) {
        if (!exerciseSelect || !muscleGroupId || !equipmentId) return;
        
        // Preserve custom option
        const customOption = Array.from(exerciseSelect.options).find(option => option.value === '__custom__');
        clearDropdown(exerciseSelect, 'Select Exercise');
        if (customOption) {
            exerciseSelect.appendChild(customOption);
        }
        
        // Find exercises matching muscle group and equipment
        const matchingExercises = exerciseData.exercises.filter(exercise => {
            const exerciseMuscleGroupId = typeof exercise.muscle_group === 'object' 
                ? exercise.muscle_group.id 
                : exercise.muscle_group_id;
                
            const exerciseEquipmentId = typeof exercise.equipment === 'object'
                ? exercise.equipment.id
                : exercise.equipment_id;
                
            return (exerciseMuscleGroupId == muscleGroupId) && (exerciseEquipmentId == equipmentId);
        });
        
        // Sort and add exercise options
        matchingExercises
            .sort((a, b) => {
                const nameA = a.name || a.exercise_name;
                const nameB = b.name || b.exercise_name;
                return nameA.localeCompare(nameB);
            })
            .forEach(exercise => {
                const exerciseName = exercise.name || exercise.exercise_name;
                const option = document.createElement('option');
                option.value = exerciseName;
                option.textContent = exerciseName;
                exerciseSelect.appendChild(option);
            });
    }

    /**
     * Load workout details for a specific session
     * @param {number} sessionId - The session ID to load details for
     */
    function loadWorkoutDetails(sessionId) {
        console.log('Loading workout details for session ID:', sessionId);
        
        const exercisesList = document.getElementById('exercisesList');
        if (!exercisesList) {
            console.warn('Exercises list container not found');
            return;
        }
        
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
     * Clear a dropdown and add a default option
     * @param {HTMLSelectElement} select - The select element to clear
     * @param {string} defaultText - The text for the default option
     */
    function clearDropdown(select, defaultText) {
        if (!select) {
            console.error('No select element provided to clearDropdown');
            return;
        }
        
        // Remove all options
        select.innerHTML = '';
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = defaultText || 'Select...';
        select.appendChild(defaultOption);
    }

    /**
     * Handle updating an existing exercise
     * @param {HTMLFormElement} form - The exercise form element
     */
    function handleUpdateExistingExercise(form) {
        console.log('Updating existing exercise');
        
        if (!form) {
            console.error('No form provided to handleUpdateExistingExercise');
            return;
        }
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
            
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
                    const alertContainer = form.querySelector('.workout-alert-message');
                    showWorkoutMessage('success', 'Exercise updated successfully', alertContainer);
                } else {
                    const alertContainer = form.querySelector('.workout-alert-message');
                    showWorkoutMessage('danger', result.message || 'Failed to update exercise', alertContainer);
                }
            })
            .catch(error => {
                console.error('Error updating exercise:', error);
                const alertContainer = form.querySelector('.workout-alert-message');
                showWorkoutMessage('danger', 'An error occurred. Please try again.', alertContainer);
            })
            .finally(() => {
                // Reset button
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            });
        }
    }

    /**
     * Handle deleting an existing exercise
     * @param {string} exerciseId - ID of the exercise to delete
     */
    function handleDeleteExistingExercise(exerciseId) {
        console.log('Deleting exercise ID:', exerciseId);
        
        if (!exerciseId) {
            console.error('No exercise ID provided');
            return;
        }
        
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
                showSessionMessage('success', 'Exercise deleted successfully');
                
                // Reload exercises list
                const sessionId = new URLSearchParams(window.location.search).get('id');
                if (sessionId) {
                    loadWorkoutDetails(sessionId);
                }
            } else {
                showSessionMessage('danger', result.message || 'Failed to delete exercise');
            }
        })
        .catch(error => {
            console.error('Error deleting exercise:', error);
            showSessionMessage('danger', 'An error occurred. Please try again.');
        });
    }

    /**
     * Render exercises list for a training session
     * @param {Array} exercises - List of exercise data
     */
    function renderExercisesList(exercises) {
        console.log('Rendering exercises list:', exercises);
        
        const exercisesList = document.getElementById('exercisesList');
        if (!exercisesList) {
            console.error('Exercises list container not found');
            return;
        }
        
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
                    const modal = document.getElementById('editExerciseModal');
                    
                    if (!modal) {
                        console.error('Edit exercise modal not found');
                        showErrorMessage('Error: Edit exercise modal not found');
                        return;
                    }
                    
                    // Set form values
                    const idField = document.getElementById('editExerciseId');
                    if (idField) idField.value = exercise.id;
                    
                    // Find form fields and populate with exercise data
                    populateEditExerciseForm(exercise);
                    
                    // Show modal
                    try {
                        const bsModal = new bootstrap.Modal(modal);
                        bsModal.show();
                    } catch (error) {
                        console.error('Error showing modal:', error);
                        showErrorMessage('Error displaying exercise edit form');
                    }
                } else {
                    showErrorMessage(result.message || 'Error loading exercise details');
                }
            })
            .catch(error => {
                console.error('Error loading exercise details:', error);
                showErrorMessage('Error loading exercise details. Please try again.');
            });
    }

    /**
     * Populate the edit exercise form with data
     * @param {Object} exercise - Exercise data object
     */
    function populateEditExerciseForm(exercise) {
        // Flag to prevent cascade events
        let isRestoringState = true;
        
        try {
            // Set muscle group
            const muscleGroupSelect = document.getElementById('editMuscleGroup');
            if (muscleGroupSelect) muscleGroupSelect.value = exercise.muscle_group;
            
            // Set equipment
            const equipmentSelect = document.getElementById('editEquipment');
            if (equipmentSelect) {
                clearDropdown(equipmentSelect, 'Select Equipment');
                
                // Add the current equipment
                const option = document.createElement('option');
                option.value = exercise.equipment;
                option.textContent = exercise.equipment;
                equipmentSelect.appendChild(option);
                
                equipmentSelect.value = exercise.equipment;
            }
            
            // Set exercise name
            const exerciseNameSelect = document.getElementById('editExerciseName');
            if (exerciseNameSelect) {
                clearDropdown(exerciseNameSelect, 'Select Exercise');
                
                // Add the current exercise
                const option = document.createElement('option');
                option.value = exercise.exercise_name;
                option.textContent = exercise.exercise_name;
                exerciseNameSelect.appendChild(option);
                
                exerciseNameSelect.value = exercise.exercise_name;
            }
            
            // Set numeric fields
            const fields = [
                { id: 'editPreEnergyLevel', value: exercise.pre_energy_level || '5' },
                { id: 'editPreSorenessLevel', value: exercise.pre_soreness_level || '5' },
                { id: 'editSets', value: exercise.sets || '' },
                { id: 'editReps', value: exercise.reps || '' },
                { id: 'editLoadWeight', value: exercise.load_weight || '' },
                { id: 'editRir', value: exercise.rir || '' },
                { id: 'editStimulus', value: exercise.stimulus || '5' },
                { id: 'editFatigueLevel', value: exercise.fatigue_level || '5' }
            ];
            
            fields.forEach(field => {
                const element = document.getElementById(field.id);
                if (element) element.value = field.value;
            });
            
            // Update range slider displays
            const rangeDisplays = [
                { id: 'editEnergyValue', value: exercise.pre_energy_level || '5' },
                { id: 'editSorenessValue', value: exercise.pre_soreness_level || '5' },
                { id: 'editStimulusValue', value: exercise.stimulus || '5' },
                { id: 'editFatigueValue', value: exercise.fatigue_level || '5' }
            ];
            
            rangeDisplays.forEach(display => {
                const element = document.getElementById(display.id);
                if (element) element.textContent = display.value;
            });
        } finally {
            // Reset flag
            isRestoringState = false;
        }
    }

    /**
     * Load recent training sessions
     */
    function loadRecentSessions() {
        console.log('Loading recent training sessions');
        
        const recentSessions = document.getElementById('recentSessions');
        if (!recentSessions) {
            console.warn('Recent sessions container not found');
            return;
        }
        
        recentSessions.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading recent sessions...</p>
            </div>
        `;
        
        fetch('api/training_sessions.php?action=recent')
            .then(response => response.json())
            .then(result => {
                if (result.success && result.data && result.data.length > 0) {
                    renderRecentSessions(result.data, recentSessions);
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
});