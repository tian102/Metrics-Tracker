/**
 * Track Training JavaScript
 * Handles all client-side functionality for the training tracking page
 */

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Main application object
    const TrainingApp = {
        // State management
        state: {
            sessionId: null,
            userId: null,
            exercises: [],
            templates: [],
            muscleGroups: [],
            equipment: [],
            loading: false,
            currentExerciseId: null
        },

        // Initialize the application
        init: function() {
            // Get PHP variables passed to JavaScript
            if (typeof jsVars !== 'undefined') {
                this.state.sessionId = jsVars.sessionId;
                this.state.userId = jsVars.userId;
                
                // We've moved the template loading to PHP side for more reliable processing
                // The auto-loading code has been removed from here
            }
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize data
            this.loadInitialData();
        },

        // Set up all event listeners
        setupEventListeners: function() {
            // Session form submission
            const sessionForm = document.getElementById('sessionForm');
            if (sessionForm) {
                sessionForm.addEventListener('submit', this.handleSessionFormSubmit.bind(this));
            }
            
            // Delete session button
            const deleteSessionBtn = document.getElementById('deleteSessionBtn');
            if (deleteSessionBtn) {
                deleteSessionBtn.addEventListener('click', this.handleDeleteSession.bind(this));
            }
            
            // Add exercise button
            const addExerciseBtn = document.getElementById('addExerciseBtn');
            if (addExerciseBtn) {
                addExerciseBtn.addEventListener('click', this.toggleExerciseForm.bind(this));
            }
            
            // Cancel add exercise button
            const cancelAddExerciseBtn = document.getElementById('cancelAddExercise');
            if (cancelAddExerciseBtn) {
                cancelAddExerciseBtn.addEventListener('click', this.toggleExerciseForm.bind(this));
            }
            
            // Exercise form submission
            const exerciseForm = document.getElementById('workoutDetailsForm');
            if (exerciseForm) {
                exerciseForm.addEventListener('submit', this.handleExerciseFormSubmit.bind(this));
            }
            
            // Load template button
            const loadTemplateBtn = document.getElementById('loadTemplateBtn');
            if (loadTemplateBtn) {
                loadTemplateBtn.addEventListener('click', this.openTemplateModal.bind(this));
            }
            
            // Load template confirm button
            const loadTemplateConfirmBtn = document.getElementById('loadTemplateConfirmBtn');
            if (loadTemplateConfirmBtn) {
                loadTemplateConfirmBtn.addEventListener('click', this.loadSelectedTemplate.bind(this));
            }
            
            // Update exercise button
            const updateExerciseBtn = document.getElementById('updateExerciseBtn');
            if (updateExerciseBtn) {
                updateExerciseBtn.addEventListener('click', this.handleUpdateExercise.bind(this));
            }
            
            // Set up range slider value updates
            this.setupRangeSliders();
            
            // Set up dropdown change handlers
            this.setupDropdowns();
            
            // Set up exercise edit/delete buttons
            this.setupExerciseCardButtons();
        },
        
        // Load initial data
        loadInitialData: function() {
            // Check if we need to load recent sessions or not
            if (!this.state.sessionId) {
                this.loadRecentSessions();
                this.loadTemplatesForQuickStart();
            } else {
                // If muscle groups dropdown is populated from PHP, load them
                const muscleGroupSelect = document.getElementById('newMuscleGroup');
                if (muscleGroupSelect) {
                    Array.from(muscleGroupSelect.options).forEach(option => {
                        if (option.value) this.state.muscleGroups.push(option.value);
                    });
                } else {
                    // Otherwise load from API
                    this.loadMuscleGroups();
                }
                
                // If equipment dropdown is populated from PHP, load them
                const equipmentSelect = document.getElementById('newEquipment');
                if (equipmentSelect) {
                    Array.from(equipmentSelect.options).forEach(option => {
                        if (option.value) this.state.equipment.push(option.value);
                    });
                } else {
                    // Otherwise load from API
                    this.loadEquipment();
                }
            }
        },
        
        // Load recent training sessions
        loadRecentSessions: function() {
            const recentSessionsContainer = document.getElementById('recentSessions');
            if (!recentSessionsContainer) return;
            
            fetch('api/training_sessions.php?action=recent')
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`API error: ${response.status} ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(result => {
                    if (result.success && result.data && result.data.length > 0) {
                        this.renderRecentSessions(result.data, recentSessionsContainer);
                    } else {
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
                    recentSessionsContainer.innerHTML = `
                        <div class="alert alert-danger">
                            Failed to load recent sessions. ${error.message}
                        </div>
                    `;
                });
        },
        
        // Render recent sessions as a table
        renderRecentSessions: function(sessions, container) {
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
                    
                    duration = diffHrs > 0 
                        ? `${diffHrs}h ${diffMins}m` 
                        : `${diffMins}m`;
                }
                
                // Format session name
                const sessionName = session.mesocycle_name 
                    ? `${session.mesocycle_name} - Session ${session.session_number || '?'}`
                    : `Session ${session.session_number || '?'}`;
                
                // Add row content
                row.innerHTML = `
                    <td>${this.formatDate(session.date)}</td>
                    <td>${sessionName}</td>
                    <td>${duration}</td>
                    <td>${session.exercise_count || 0} exercises</td>
                    <td>
                        <a href="track_training.php?id=${session.id}" class="btn btn-sm btn-primary">
                            <i class="fas fa-edit"></i>
                        </a>
                    </td>
                `;
                
                // Add click handler to navigate to session edit page
                row.addEventListener('click', function(e) {
                    // Don't navigate if clicking on the edit button
                    if (e.target.closest('.btn')) return;
                    
                    window.location.href = `track_training.php?id=${session.id}`;
                });
                
                tbody.appendChild(row);
            });
            
            container.innerHTML = '';
            container.appendChild(table);
        },
        
        // Load templates for quick start
        loadTemplatesForQuickStart: function() {
            const templatesContainer = document.getElementById('quickTemplates');
            if (!templatesContainer) return;
            
            fetch('api/workout_templates.php?action=list')
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`API error: ${response.status} ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(result => {
                    if (result.success && result.data && result.data.length > 0) {
                        this.renderQuickStartTemplates(result.data, templatesContainer);
                    } else {
                        templatesContainer.innerHTML = `
                            <div class="col-12">
                                <div class="alert alert-info">
                                    No workout templates found.
                                    <a href="workout_templates.php" class="alert-link">Create your first template</a>.
                                </div>
                            </div>
                        `;
                    }
                })
                .catch(error => {
                    console.error('Error loading templates:', error);
                    templatesContainer.innerHTML = `
                        <div class="col-12">
                            <div class="alert alert-danger">
                                Failed to load templates. ${error.message}
                            </div>
                        </div>
                    `;
                });
        },
        
        // Render templates for quick start
        renderQuickStartTemplates: function(templates, container) {
            container.innerHTML = '';
            
            // Keep only the first 6 templates for the quick start
            templates = templates.slice(0, 6);
            
            templates.forEach(template => {
                const templateCard = document.createElement('div');
                templateCard.className = 'col-md-4';
                
                templateCard.innerHTML = `
                    <div class="card h-100 quick-template-card" data-template-id="${template.id}">
                        <div class="card-body">
                            <h5 class="card-title">${template.name}</h5>
                            <p class="card-text">
                                <span class="badge bg-secondary">${template.exercise_count || 0} exercises</span>
                            </p>
                            <button class="btn btn-primary btn-sm w-100 mt-2 load-template-btn" data-template-id="${template.id}">
                                Start Session
                            </button>
                        </div>
                    </div>
                `;
                
                // Add click handler to load template
                const loadBtn = templateCard.querySelector('.load-template-btn');
                loadBtn.addEventListener('click', () => {
                    this.createSessionFromTemplate(template.id);
                });
                
                container.appendChild(templateCard);
            });
            
            // Add a "View More" card if there are more templates
            const viewMoreCard = document.createElement('div');
            viewMoreCard.className = 'col-md-4';
            viewMoreCard.innerHTML = `
                <div class="card h-100 text-center">
                    <div class="card-body d-flex flex-column justify-content-center">
                        <h5 class="card-title">View All Templates</h5>
                        <a href="workout_templates.php" class="btn btn-outline-primary mt-2">
                            <i class="fas fa-th-list me-2"></i> Browse All
                        </a>
                    </div>
                </div>
            `;
            
            container.appendChild(viewMoreCard);
        },
        
        // Create a new session from a template
        createSessionFromTemplate: function(templateId) {
            this.showLoading();
            
            console.log(`Creating new session from template ${templateId}`);
            
            // First create a new blank session
            const sessionData = {
                date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
                training_start: null,
                training_end: null
            };
            
            fetch('api/training_sessions.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(sessionData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`API error: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(result => {
                console.log('Create session result:', result);
                
                if (result.success && result.session_id) {
                    // Now redirect to load the template - we'll use the PHP processing
                    window.location.href = `track_training.php?id=${result.session_id}&template_id=${templateId}`;
                } else {
                    this.hideLoading();
                    this.showToast('danger', result.message || 'Failed to create session');
                }
            })
            .catch(error => {
                console.error('Error creating session:', error);
                this.hideLoading();
                this.showToast('danger', `Error: ${error.message}`);
            });
        },
        
        // Handle session form submission
        handleSessionFormSubmit: function(e) {
            e.preventDefault();
            
            const form = e.target;
            const formData = new FormData(form);
            const formDataObj = {};
            
            // Convert FormData to regular object
            formData.forEach((value, key) => {
                formDataObj[key] = value;
            });
            
            // Check if this is an update or create
            const isUpdate = this.state.sessionId !== null;
            
            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> ${isUpdate ? 'Updating...' : 'Creating...'}`;
            
            // Prepare fetch options
            const fetchOptions = {
                method: isUpdate ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formDataObj)
            };
            
            // Send the request
            fetch('api/training_sessions.php', fetchOptions)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`API error: ${response.status} ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(result => {
                    // Restore button state
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                    
                    if (result.success) {
                        const alertBox = document.getElementById('sessionAlertMessage');
                        alertBox.className = 'alert alert-success mt-3';
                        alertBox.style.display = 'block';
                        alertBox.innerHTML = `<i class="fas fa-check-circle me-2"></i> ${result.message}`;
                        
                        // If this was a create, redirect to the edit page
                        if (!isUpdate && result.session_id) {
                            setTimeout(() => {
                                window.location.href = `track_training.php?id=${result.session_id}`;
                            }, 1000);
                        } else if (isUpdate) {
                            // If this was an update, reload the data after a short delay
                            setTimeout(() => {
                                window.location.reload();
                            }, 1000);
                        }
                    } else {
                        const alertBox = document.getElementById('sessionAlertMessage');
                        alertBox.className = 'alert alert-danger mt-3';
                        alertBox.style.display = 'block';
                        alertBox.innerHTML = `<i class="fas fa-exclamation-circle me-2"></i> ${result.message || 'An error occurred'}`;
                    }
                })
                .catch(error => {
                    console.error('Error saving session:', error);
                    
                    // Restore button state
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                    
                    // Show error message
                    const alertBox = document.getElementById('sessionAlertMessage');
                    alertBox.className = 'alert alert-danger mt-3';
                    alertBox.style.display = 'block';
                    alertBox.innerHTML = `<i class="fas fa-exclamation-circle me-2"></i> ${error.message}`;
                });
        },
        
        // Handle delete session
        handleDeleteSession: function() {
            if (!this.state.sessionId) return;
            
            if (confirm('Are you sure you want to delete this training session? This action cannot be undone.')) {
                // Show loading state
                this.showLoading();
                
                fetch('api/training_sessions.php', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ id: this.state.sessionId })
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`API error: ${response.status} ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(result => {
                    this.hideLoading();
                    
                    if (result.success) {
                        this.showToast('success', result.message);
                        
                        // Redirect back to main training page
                        setTimeout(() => {
                            window.location.href = 'track_training.php';
                        }, 1000);
                    } else {
                        this.showToast('danger', result.message || 'Failed to delete session');
                    }
                })
                .catch(error => {
                    console.error('Error deleting session:', error);
                    this.hideLoading();
                    this.showToast('danger', `Error: ${error.message}`);
                });
            }
        },
        
        // Toggle exercise form visibility
        toggleExerciseForm: function() {
            const form = document.getElementById('newExerciseForm');
            if (!form) return;
            
            if (form.style.display === 'none' || form.style.display === '') {
                form.style.display = 'block';
                // Load muscle groups and equipment if needed
                this.loadMuscleGroups();
                this.loadEquipment();
                
                // Scroll to the form
                form.scrollIntoView({ behavior: 'smooth' });
            } else {
                form.style.display = 'none';
            }
        },
        
        // Handle exercise form submission
        handleExerciseFormSubmit: function(e) {
            e.preventDefault();
            
            const form = e.target;
            
            // Check form validity
            if (!form.checkValidity()) {
                form.classList.add('was-validated');
                return;
            }
            
            const formData = new FormData(form);
            const formDataObj = {};
            
            // Convert FormData to regular object
            formData.forEach((value, key) => {
                formDataObj[key] = value;
            });
            
            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Adding...`;
            
            // Send the request
            fetch('api/workout_details.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formDataObj)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`API error: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(result => {
                // Restore button state
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                
                if (result.success) {
                    // Show success message
                    const alertBox = document.getElementById('workoutAlertMessage');
                    alertBox.className = 'alert alert-success mt-3';
                    alertBox.style.display = 'block';
                    alertBox.innerHTML = `<i class="fas fa-check-circle me-2"></i> ${result.message}`;
                    
                    // Reset form
                    form.reset();
                    form.classList.remove('was-validated');
                    
                    // Reload the page after a short delay
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    // Show error message
                    const alertBox = document.getElementById('workoutAlertMessage');
                    alertBox.className = 'alert alert-danger mt-3';
                    alertBox.style.display = 'block';
                    alertBox.innerHTML = `<i class="fas fa-exclamation-circle me-2"></i> ${result.message || 'An error occurred'}`;
                }
            })
            .catch(error => {
                console.error('Error adding exercise:', error);
                
                // Restore button state
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                
                // Show error message
                const alertBox = document.getElementById('workoutAlertMessage');
                alertBox.className = 'alert alert-danger mt-3';
                alertBox.style.display = 'block';
                alertBox.innerHTML = `<i class="fas fa-exclamation-circle me-2"></i> ${error.message}`;
            });
        },
        
        // Load muscle groups
        loadMuscleGroups: function() {
            // Skip if already loaded
            if (this.state.muscleGroups.length > 0) {
                this.populateMuscleGroupDropdown();
                return;
            }
            
            fetch('api/exercise_library.php?action=get_muscle_groups')
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`API error: ${response.status} ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(result => {
                    if (result.success && result.data) {
                        this.state.muscleGroups = result.data.map(item => item.name);
                        this.populateMuscleGroupDropdown();
                    }
                })
                .catch(error => {
                    console.error('Error loading muscle groups:', error);
                    this.showToast('danger', `Error loading muscle groups: ${error.message}`);
                });
        },
        
        // Populate muscle group dropdown
        populateMuscleGroupDropdown: function() {
            const dropdown = document.getElementById('newMuscleGroup');
            if (!dropdown) return;
            
            // Clear existing options but keep the first placeholder option
            const placeholder = dropdown.querySelector('option[value=""]');
            dropdown.innerHTML = '';
            if (placeholder) dropdown.appendChild(placeholder);
            
            // Add muscle group options
            this.state.muscleGroups.forEach(group => {
                const option = document.createElement('option');
                option.value = group;
                option.textContent = group;
                dropdown.appendChild(option);
            });
        },
        
        // Load equipment
        loadEquipment: function() {
            // Skip if already loaded
            if (this.state.equipment.length > 0) {
                this.populateEquipmentDropdown();
                return;
            }
            
            fetch('api/exercise_library.php?action=get_equipment')
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`API error: ${response.status} ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(result => {
                    if (result.success && result.data) {
                        this.state.equipment = result.data.map(item => item.name);
                        this.populateEquipmentDropdown();
                    }
                })
                .catch(error => {
                    console.error('Error loading equipment:', error);
                    this.showToast('danger', `Error loading equipment: ${error.message}`);
                });
        },
        
        // Populate equipment dropdown
        populateEquipmentDropdown: function() {
            const dropdown = document.getElementById('newEquipment');
            if (!dropdown) return;
            
            // Clear existing options but keep the first placeholder option
            const placeholder = dropdown.querySelector('option[value=""]');
            dropdown.innerHTML = '';
            if (placeholder) dropdown.appendChild(placeholder);
            
            // Add equipment options
            this.state.equipment.forEach(item => {
                const option = document.createElement('option');
                option.value = item;
                option.textContent = item;
                dropdown.appendChild(option);
            });
        },
        
        // Open template modal
        openTemplateModal: function() {
            // Find the modal element
            const modal = document.getElementById('templateModal');
            if (!modal) return;
            
            // Show the modal
            const bootstrapModal = new bootstrap.Modal(modal);
            bootstrapModal.show();
            
            // Load templates
            this.loadTemplates();
        },
        
        // Load templates
        loadTemplates: function() {
            const templatesContainer = document.getElementById('templatesList');
            const templateSelect = document.getElementById('templateSelect');
            
            if (!templatesContainer || !templateSelect) return;
            
            // Show loading state
            templatesContainer.innerHTML = `
                <div class="text-center py-3">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-2">Loading templates...</p>
                </div>
            `;
            
            fetch('api/workout_templates.php?action=list')
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`API error: ${response.status} ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(result => {
                    if (result.success && result.data && result.data.length > 0) {
                        this.state.templates = result.data;
                        this.renderTemplates(result.data, templatesContainer, templateSelect);
                    } else {
                        templatesContainer.innerHTML = `
                            <div class="alert alert-info">
                                No workout templates found.
                                <a href="workout_templates.php" class="alert-link">Create your first template</a>.
                            </div>
                        `;
                        templateSelect.innerHTML = '<option value="">No templates available</option>';
                    }
                })
                .catch(error => {
                    console.error('Error loading templates:', error);
                    templatesContainer.innerHTML = `
                        <div class="alert alert-danger">
                            Failed to load templates. ${error.message}
                        </div>
                    `;
                    templateSelect.innerHTML = '<option value="">Error loading templates</option>';
                });
        },
        
        // Render templates
        renderTemplates: function(templates, container, selectElement) {
            // Clear containers
            container.innerHTML = '';
            selectElement.innerHTML = '<option value="">Select a template</option>';
            
            if (templates.length === 0) {
                container.innerHTML = `
                    <div class="alert alert-info">
                        No workout templates found.
                        <a href="workout_templates.php" class="alert-link">Create your first template</a>.
                    </div>
                `;
                return;
            }
            
            // Create template cards
            const row = document.createElement('div');
            row.className = 'row g-3';
            
            templates.forEach(template => {
                // Add to dropdown
                const option = document.createElement('option');
                option.value = template.id;
                option.textContent = template.name;
                selectElement.appendChild(option);
                
                // Create card
                const col = document.createElement('div');
                col.className = 'col-md-4';
                
                col.innerHTML = `
                    <div class="card h-100 template-card" data-template-id="${template.id}">
                        <div class="card-body">
                            <h5 class="card-title">${template.name}</h5>
                            <p class="card-text">
                                <span class="badge bg-secondary">${template.exercise_count || 0} exercises</span>
                            </p>
                            <button class="btn btn-primary btn-sm w-100 mt-2 load-template-card-btn" data-template-id="${template.id}">
                                Load Template
                            </button>
                        </div>
                    </div>
                `;
                
                row.appendChild(col);
            });
            
            container.appendChild(row);
            
            // Add event listeners to Load Template buttons
            const loadButtons = container.querySelectorAll('.load-template-card-btn');
            loadButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const templateId = button.dataset.templateId;
                    this.loadTemplate(templateId);
                });
            });
        },
        
        // Load selected template
        loadSelectedTemplate: function() {
            const templateSelect = document.getElementById('templateSelect');
            if (!templateSelect) return;
            
            const templateId = templateSelect.value;
            
            if (!templateId) {
                this.showToast('warning', 'Please select a template');
                return;
            }
            
            this.loadTemplate(templateId);
        },
        
        // Load template
        loadTemplate: function(templateId) {
            if (!this.state.sessionId) {
                this.showToast('danger', 'You must create a session first');
                return;
            }
            
            // Close the modal
            const modal = document.getElementById('templateModal');
            if (modal) {
                const bootstrapModal = bootstrap.Modal.getInstance(modal);
                if (bootstrapModal) bootstrapModal.hide();
            }
            
            // Show loading state
            this.showLoading();
            
            console.log(`Loading template ${templateId} for session ${this.state.sessionId}`);
            
            // Instead of using the API, redirect to the PHP version which is more reliable
            window.location.href = `track_training.php?id=${this.state.sessionId}&template_id=${templateId}`;
        },
        
        // Setup exercise card buttons (edit/delete)
        setupExerciseCardButtons: function() {
            // Edit buttons
            document.querySelectorAll('.edit-exercise-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const card = e.target.closest('.exercise-card');
                    if (!card) return;
                    
                    const exerciseId = card.dataset.exerciseId;
                    this.openEditExerciseModal(exerciseId);
                });
            });
            
            // Delete buttons
            document.querySelectorAll('.delete-exercise-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const card = e.target.closest('.exercise-card');
                    if (!card) return;
                    
                    const exerciseId = card.dataset.exerciseId;
                    this.deleteExercise(exerciseId);
                });
            });
        },
        
        // Open edit exercise modal
        openEditExerciseModal: function(exerciseId) {
            // Set current exercise ID
            this.state.currentExerciseId = exerciseId;
            
            // Find the modal element
            const modal = document.getElementById('editExerciseModal');
            if (!modal) return;
            
            // Set the exercise ID in the form
            const idInput = document.getElementById('editExerciseId');
            if (idInput) idInput.value = exerciseId;
            
            // Show the modal
            const bootstrapModal = new bootstrap.Modal(modal);
            bootstrapModal.show();
            
            // Load exercise data
            this.loadExerciseData(exerciseId);
        },
        
        // Load exercise data for editing
        loadExerciseData: function(exerciseId) {
            const contentDiv = document.getElementById('editExerciseFormContent');
            if (!contentDiv) return;
            
            // Show loading state
            contentDiv.innerHTML = `
                <div class="text-center py-3">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading exercise data...</span>
                    </div>
                    <p class="mt-2">Loading exercise data...</p>
                </div>
            `;
            
            fetch(`api/workout_details.php?id=${exerciseId}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`API error: ${response.status} ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(result => {
                    if (result.success && result.data) {
                        this.renderExerciseEditForm(result.data, contentDiv);
                    } else {
                        contentDiv.innerHTML = `
                            <div class="alert alert-danger">
                                Failed to load exercise data. ${result.message || ''}
                            </div>
                        `;
                    }
                })
                .catch(error => {
                    console.error('Error loading exercise data:', error);
                    contentDiv.innerHTML = `
                        <div class="alert alert-danger">
                            Error: ${error.message}
                        </div>
                    `;
                });
        },
        
        // Render exercise edit form
        renderExerciseEditForm: function(exercise, container) {
            // Create the form HTML
            const html = `
                <div class="row g-3">
                    <div class="col-md-4">
                        <div class="form-group">
                            <label for="editMuscleGroup" class="form-label">Muscle Group:</label>
                            <input type="text" id="editMuscleGroup" name="muscle_group" class="form-control" 
                                value="${exercise.muscle_group || ''}" required>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="form-group">
                            <label for="editEquipment" class="form-label">Equipment:</label>
                            <input type="text" id="editEquipment" name="equipment" class="form-control" 
                                value="${exercise.equipment || ''}" required>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="form-group">
                            <label for="editExerciseName" class="form-label">Exercise Name:</label>
                            <input type="text" id="editExerciseName" name="exercise_name" class="form-control" 
                                value="${exercise.exercise_name || ''}" required>
                        </div>
                    </div>
                </div>
                
                <!-- Set and Rep Scheme -->
                <div class="row g-3 mt-3">
                    <div class="col-md-3">
                        <div class="form-group">
                            <label for="editSets" class="form-label">Sets:</label>
                            <input type="number" id="editSets" name="sets" min="1" class="form-control" 
                                value="${exercise.sets || ''}" required>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="form-group">
                            <label for="editReps" class="form-label">Reps:</label>
                            <input type="number" id="editReps" name="reps" min="1" class="form-control" 
                                value="${exercise.reps || ''}" required>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="form-group">
                            <label for="editLoadWeight" class="form-label">Weight (kg):</label>
                            <input type="number" id="editLoadWeight" name="load_weight" min="0" step="0.5" class="form-control" 
                                value="${exercise.load_weight || ''}">
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="form-group">
                            <label for="editRir" class="form-label">RIR:</label>
                            <input type="number" id="editRir" name="rir" min="0" class="form-control" 
                                value="${exercise.rir || ''}">
                        </div>
                    </div>
                </div>
                
                <!-- Pre-Exercise Review -->
                <div class="row g-3 mt-3">
                    <div class="col-md-6">
                        <div class="form-group">
                            <label for="editPreEnergyLevel" class="form-label">Pre-Exercise Energy Level (1-10):</label>
                            <div class="d-flex align-items-center">
                                <input type="range" id="editPreEnergyLevel" name="pre_energy_level" min="1" max="10" step="1" 
                                    value="${exercise.pre_energy_level || 5}" class="form-range range-slider flex-grow-1 me-2">
                                <span class="range-value badge bg-primary">${exercise.pre_energy_level || 5}</span>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <label for="editPreSorenessLevel" class="form-label">Pre-Exercise Soreness Level (1-10):</label>
                            <div class="d-flex align-items-center">
                                <input type="range" id="editPreSorenessLevel" name="pre_soreness_level" min="1" max="10" step="1" 
                                    value="${exercise.pre_soreness_level || 5}" class="form-range range-slider flex-grow-1 me-2">
                                <span class="range-value badge bg-primary">${exercise.pre_soreness_level || 5}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Post-Exercise Review -->
                <div class="row g-3 mt-3">
                    <div class="col-md-6">
                        <div class="form-group">
                            <label for="editStimulus" class="form-label">Stimulus (1-10):</label>
                            <div class="d-flex align-items-center">
                                <input type="range" id="editStimulus" name="stimulus" min="1" max="10" step="1" 
                                    value="${exercise.stimulus || 5}" class="form-range range-slider flex-grow-1 me-2">
                                <span class="range-value badge bg-primary">${exercise.stimulus || 5}</span>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <label for="editFatigueLevel" class="form-label">Fatigue Level (1-10):</label>
                            <div class="d-flex align-items-center">
                                <input type="range" id="editFatigueLevel" name="fatigue_level" min="1" max="10" step="1" 
                                    value="${exercise.fatigue_level || 5}" class="form-range range-slider flex-grow-1 me-2">
                                <span class="range-value badge bg-primary">${exercise.fatigue_level || 5}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Notes -->
                <div class="row mt-3">
                    <div class="col-12">
                        <div class="form-group">
                            <label for="editExerciseNotes" class="form-label">Notes:</label>
                            <textarea id="editExerciseNotes" name="notes" class="form-control" rows="2">${exercise.notes || ''}</textarea>
                        </div>
                    </div>
                </div>
            `;
            
            // Set the HTML
            container.innerHTML = html;
            
            // Setup range sliders
            this.setupRangeSliders();
        },
        
        // Handle update exercise
        handleUpdateExercise: function() {
            // Get the form
            const form = document.getElementById('editExerciseForm');
            if (!form) return;
            
            // Check form validity
            if (!form.checkValidity()) {
                form.classList.add('was-validated');
                return;
            }
            
            const formData = new FormData(form);
            const formDataObj = {};
            
            // Convert FormData to regular object
            formData.forEach((value, key) => {
                formDataObj[key] = value;
            });
            
            // Show loading state
            const submitBtn = document.getElementById('updateExerciseBtn');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating...`;
            
            // Send the request
            fetch('api/workout_details.php', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formDataObj)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`API error: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(result => {
                // Restore button state
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                
                if (result.success) {
                    // Close the modal
                    const modal = document.getElementById('editExerciseModal');
                    if (modal) {
                        const bootstrapModal = bootstrap.Modal.getInstance(modal);
                        if (bootstrapModal) bootstrapModal.hide();
                    }
                    
                    // Show success message
                    this.showToast('success', result.message || 'Exercise updated successfully');
                    
                    // Reload the page after a short delay
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    // Show error message
                    this.showToast('danger', result.message || 'An error occurred');
                }
            })
            .catch(error => {
                console.error('Error updating exercise:', error);
                
                // Restore button state
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                
                // Show error message
                this.showToast('danger', `Error: ${error.message}`);
            });
        },
        
        // Delete exercise
        deleteExercise: function(exerciseId) {
            if (confirm('Are you sure you want to delete this exercise? This action cannot be undone.')) {
                // Show loading state
                this.showLoading();
                
                fetch('api/workout_details.php', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ id: exerciseId })
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`API error: ${response.status} ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(result => {
                    this.hideLoading();
                    
                    if (result.success) {
                        this.showToast('success', result.message || 'Exercise deleted successfully');
                        
                        // Remove the exercise card from the DOM
                        const card = document.querySelector(`.exercise-card[data-exercise-id="${exerciseId}"]`);
                        if (card) {
                            const col = card.closest('.col');
                            if (col) col.remove();
                            
                            // If there are no more exercises, show the empty message
                            const exercisesList = document.getElementById('exercisesList');
                            if (exercisesList && exercisesList.querySelectorAll('.exercise-card').length === 0) {
                                exercisesList.innerHTML = `
                                    <div class="alert alert-info">
                                        <i class="fas fa-info-circle me-2"></i>
                                        No exercises added yet. Use the "Add Exercise" button to add your first exercise or load a template.
                                    </div>
                                `;
                            }
                        } else {
                            // If we can't find the card, reload the page
                            setTimeout(() => {
                                window.location.reload();
                            }, 1000);
                        }
                    } else {
                        this.showToast('danger', result.message || 'Failed to delete exercise');
                    }
                })
                .catch(error => {
                    console.error('Error deleting exercise:', error);
                    this.hideLoading();
                    this.showToast('danger', `Error: ${error.message}`);
                });
            }
        },
        
        // Setup range sliders
        setupRangeSliders: function() {
            const rangeSliders = document.querySelectorAll('.range-slider');
            rangeSliders.forEach(slider => {
                // Find the corresponding badge
                const badge = slider.nextElementSibling;
                if (!badge) return;
                
                // Update the badge value when the slider changes
                slider.addEventListener('input', function() {
                    badge.textContent = this.value;
                });
            });
        },
        
        // Setup dropdown change handlers
        setupDropdowns: function() {
            // Muscle group change handler
            const muscleGroupSelect = document.getElementById('newMuscleGroup');
            if (muscleGroupSelect) {
                muscleGroupSelect.addEventListener('change', this.handleMuscleGroupChange.bind(this));
            }
            
            // Equipment change handler
            const equipmentSelect = document.getElementById('newEquipment');
            if (equipmentSelect) {
                equipmentSelect.addEventListener('change', this.handleEquipmentChange.bind(this));
            }
        },
        
        // Handle muscle group change
        handleMuscleGroupChange: function() {
            this.loadExerciseOptions();
        },
        
        // Handle equipment change
        handleEquipmentChange: function() {
            this.loadExerciseOptions();
        },
        
        // Load exercise options based on selected muscle group and equipment
        loadExerciseOptions: function() {
            const muscleGroupSelect = document.getElementById('newMuscleGroup');
            const equipmentSelect = document.getElementById('newEquipment');
            const exerciseSelect = document.getElementById('newExerciseName');
            
            if (!muscleGroupSelect || !equipmentSelect || !exerciseSelect) return;
            
            const muscleGroup = muscleGroupSelect.value;
            const equipment = equipmentSelect.value;
            
            if (!muscleGroup || !equipment) return;
            
            // Show loading state
            exerciseSelect.innerHTML = '<option value="">Loading exercises...</option>';
            exerciseSelect.disabled = true;
            
            // Build query string
            const params = new URLSearchParams({
                action: 'search',
                muscle_group: muscleGroup,
                equipment: equipment
            });
            
            fetch(`api/exercise_library.php?${params}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`API error: ${response.status} ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(result => {
                    exerciseSelect.disabled = false;
                    
                    if (result.success && result.data && result.data.length > 0) {
                        // Clear dropdown
                        exerciseSelect.innerHTML = '<option value="">Select Exercise</option>';
                        
                        // Add exercise options
                        result.data.forEach(exercise => {
                            const option = document.createElement('option');
                            option.value = exercise.name;
                            option.textContent = exercise.name;
                            exerciseSelect.appendChild(option);
                        });
                    } else {
                        exerciseSelect.innerHTML = '<option value="">No exercises found</option>';
                    }
                })
                .catch(error => {
                    console.error('Error loading exercises:', error);
                    exerciseSelect.disabled = false;
                    exerciseSelect.innerHTML = '<option value="">Error loading exercises</option>';
                });
        },
        
        // Show loading overlay
        showLoading: function() {
            // Create loading overlay if it doesn't exist
            let loadingOverlay = document.querySelector('.loading-overlay');
            if (!loadingOverlay) {
                loadingOverlay = document.createElement('div');
                loadingOverlay.className = 'loading-overlay';
                loadingOverlay.style.position = 'fixed'; // Make sure it covers the entire viewport
                loadingOverlay.style.zIndex = '9999'; // Ensure it's on top of everything
                loadingOverlay.innerHTML = `
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                `;
                document.body.appendChild(loadingOverlay);
            }
            
            loadingOverlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        },
        
        // Hide loading overlay
        hideLoading: function() {
            const loadingOverlay = document.querySelector('.loading-overlay');
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
                document.body.style.overflow = '';
            }
        },
        
        // Show toast notification
        showToast: function(type, message) {
            const toastContainer = document.getElementById('toastContainer');
            if (!toastContainer) return;
            
            // Create toast element
            const toast = document.createElement('div');
            toast.className = `toast align-items-center text-white bg-${type} border-0`;
            toast.setAttribute('role', 'alert');
            toast.setAttribute('aria-live', 'assertive');
            toast.setAttribute('aria-atomic', 'true');
            
            toast.innerHTML = `
                <div class="d-flex">
                    <div class="toast-body">
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            `;
            
            toastContainer.appendChild(toast);
            
            // Initialize and show toast
            const bootstrapToast = new bootstrap.Toast(toast, {
                autohide: true,
                delay: 5000
            });
            
            bootstrapToast.show();
            
            // Remove toast from DOM after it's hidden
            toast.addEventListener('hidden.bs.toast', function() {
                toast.remove();
            });
        },
        
        // Format date for display
        formatDate: function(dateStr) {
            const date = new Date(dateStr);
            return date.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    };
    
    // Initialize the application
    TrainingApp.init();
    
    // Make TrainingApp available globally for debugging
    window.TrainingApp = TrainingApp;
});
