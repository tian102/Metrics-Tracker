/**
 * Exercise Library JavaScript
 * Provides functionality for the exercise library page
 */

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set up search form
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            searchExercises();
        });

        // Reset form handler
        searchForm.addEventListener('reset', function() {
            setTimeout(function() {
                searchExercises();
            }, 10);
        });
    }
    
    // Load initial data
    loadLibraryStats(); // This function was missing
    searchExercises();
    
    // Set up equipment and muscle group filters
    loadFilterOptions();
    
    // Set up modal forms
    setupAddExerciseForm();
    setupEditExerciseForm();
});

// Global variables
let currentPage = 1;
const perPage = 10; // Number of results per page

/**
 * Load muscle groups and equipment for filter dropdowns
 */
function loadFilterOptions() {
    Promise.all([
        fetch('api/exercise_library.php?action=muscle_groups'),
        fetch('api/exercise_library.php?action=equipment')
    ])
    .then(responses => Promise.all(responses.map(r => r.json())))
    .then(([muscleGroups, equipment]) => {
        if (muscleGroups.success) {
            populateFilterDropdown('muscleGroupFilter', muscleGroups.data);
        }
        
        if (equipment.success) {
            populateFilterDropdown('equipmentFilter', equipment.data);
        }
    })
    .catch(error => {
        console.error('Error loading filter options:', error);
    });
}

/**
 * Populate filter dropdown with options
 * @param {string} elementId - ID of the select element
 * @param {Array} options - Array of option objects
 */
function populateFilterDropdown(elementId, options) {
    const select = document.getElementById(elementId);
    if (!select) return;
    
    // Keep the first option (default "All" option)
    const defaultOption = select.options[0];
    select.innerHTML = '';
    select.appendChild(defaultOption);
    
    // Add options
    options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.name;
        opt.textContent = option.name;
        select.appendChild(opt);
    });
    
    // Add change event listener
    select.addEventListener('change', function() {
        currentPage = 1; // Reset to first page when filter changes
        searchExercises();
    });
}

/**
 * Search exercises based on form inputs
 */
function searchExercises() {
    const searchInput = document.getElementById('searchInput');
    const muscleGroupFilter = document.getElementById('muscleGroupFilter');
    const equipmentFilter = document.getElementById('equipmentFilter');
    
    // Show loading state
    const loadingSpinner = document.getElementById('loadingSpinner');
    const searchResults = document.getElementById('searchResults');
    const errorMessage = document.getElementById('errorMessage');
    
    if (loadingSpinner) loadingSpinner.style.display = 'block';
    if (searchResults) searchResults.style.display = 'none';
    if (errorMessage) errorMessage.style.display = 'none';
    
    // Build search params
    const params = new URLSearchParams({
        action: 'search',
        page: currentPage,
        per_page: perPage
    });
    
    if (searchInput && searchInput.value) {
        params.append('search', searchInput.value);
    }
    
    if (muscleGroupFilter && muscleGroupFilter.value) {
        params.append('muscle_group', muscleGroupFilter.value);
    }
    
    if (equipmentFilter && equipmentFilter.value) {
        params.append('equipment', equipmentFilter.value);
    }
    
    // Perform search
    fetch(`api/exercise_library.php?${params.toString()}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(result => {
            // Hide loading spinner
            if (loadingSpinner) loadingSpinner.style.display = 'none';
            
            if (result.success) {
                // Display results
                renderSearchResults(result);
                renderPagination(result);
            } else {
                console.error('Search failed:', result.message);
                if (errorMessage) {
                    errorMessage.textContent = result.message || 'Error loading exercises';
                    errorMessage.style.display = 'block';
                }
            }
        })
        .catch(error => {
            console.error('Error searching exercises:', error);
            if (loadingSpinner) loadingSpinner.style.display = 'none';
            if (errorMessage) {
                errorMessage.textContent = 'Error loading exercises. Please try again.';
                errorMessage.style.display = 'block';
            }
        });
}

/**
 * Renders search results in a table
 * @param {Object} result The search result object
 */
function renderSearchResults(result) {
    const resultsBody = document.getElementById('resultsBody');
    const searchResults = document.getElementById('searchResults');
    
    if (!resultsBody || !searchResults) {
        console.error('Results container not found');
        return;
    }
    
    if (!result.data || result.data.length === 0) {
        resultsBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">No exercises found</td>
            </tr>
        `;
        searchResults.style.display = 'block';
        return;
    }
    
    let html = '';
    result.data.forEach(exercise => {
        html += `
            <tr>
                <td>${exercise.name}</td>
                <td>${exercise.muscle_group}</td>
                <td>${exercise.equipment}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-exercise-btn" data-id="${exercise.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary edit-exercise-btn" data-id="${exercise.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    resultsBody.innerHTML = html;
    searchResults.style.display = 'block';
    
    // Add event listeners to buttons
    document.querySelectorAll('.view-exercise-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const exerciseId = this.getAttribute('data-id');
            viewExercise(exerciseId);
        });
    });
    
    document.querySelectorAll('.edit-exercise-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const exerciseId = this.getAttribute('data-id');
            editExercise(exerciseId);
        });
    });
}

/**
 * Renders the search results pagination
 * @param {Object} searchResult The search result object containing pagination info
 */
function renderPagination(searchResult) {
    const paginationContainer = document.getElementById('searchPagination');
    if (!paginationContainer) return;
    
    // Make sure searchResult and its pagination property exist
    if (!searchResult || !searchResult.pagination) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    const pagination = searchResult.pagination;
    
    // Guard against missing properties in pagination
    if (!pagination || typeof pagination !== 'object') {
        console.error('Invalid pagination object:', pagination);
        paginationContainer.innerHTML = '';
        return;
    }
    
    // Safely access total_count with fallback to 0
    const totalCount = (pagination.total_count !== undefined) ? parseInt(pagination.total_count) : 0;
    const perPage = (pagination.per_page !== undefined) ? parseInt(pagination.per_page) : 10;
    const currentPage = (pagination.current_page !== undefined) ? parseInt(pagination.current_page) : 1;
    
    // Calculate total pages with a safe fallback
    const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '<ul class="pagination justify-content-center">';
    
    // Previous page button
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage - 1}" aria-label="Previous">
                <span aria-hidden="true">&laquo;</span>
            </a>
        </li>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `
            <li class="page-item ${currentPage === i ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>
        `;
    }
    
    // Next page button
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage + 1}" aria-label="Next">
                <span aria-hidden="true">&raquo;</span>
            </a>
        </li>
    `;
    
    paginationHTML += '</ul>';
    paginationContainer.innerHTML = paginationHTML;
    
    // Add event listeners to pagination links
    document.querySelectorAll('#searchPagination .page-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = parseInt(this.getAttribute('data-page'));
            currentPage = page;
            searchExercises();
        });
    });
}

/**
 * Renders the library stats
 */
function loadLibraryStats() {
    const statsContainer = document.getElementById('libraryStats');
    const statsLoadingSpinner = document.getElementById('statsLoadingSpinner');
    const statsErrorMessage = document.getElementById('statsErrorMessage');
    
    if (statsLoadingSpinner) statsLoadingSpinner.style.display = 'block';
    if (statsContainer) statsContainer.innerHTML = '';
    if (statsErrorMessage) statsErrorMessage.style.display = 'none';
    
    // Fix: Changed the action parameter to 'stats'
    fetch('api/exercise_library.php?action=stats')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(result => {
            if (statsLoadingSpinner) statsLoadingSpinner.style.display = 'none';
            
            if (result.success && result.data) {
                const stats = result.data;
                
                if (statsContainer) {
                    let html = `
                        <div class="row stats-row">
                            <div class="col-md-4">
                                <div class="stat-card">
                                    <h3>${stats.total_exercises}</h3>
                                    <p>Total Exercises</p>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="stat-card">
                                    <h3>${stats.total_muscle_groups}</h3>
                                    <p>Muscle Groups</p>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="stat-card">
                                    <h3>${stats.total_equipment}</h3>
                                    <p>Equipment Types</p>
                                </div>
                            </div>
                        </div>
                    `;
                    
                    if (stats.exercises_by_muscle_group && stats.exercises_by_muscle_group.length > 0) {
                        html += `
                            <div class="row stats-row mt-4">
                                <div class="col-md-6">
                                    <h5>Exercises by Muscle Group</h5>
                                    <ul class="list-group">
                        `;
                        
                        stats.exercises_by_muscle_group.forEach(item => {
                            html += `
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    ${item.muscle_group}
                                    <span class="badge bg-primary rounded-pill">${item.exercise_count}</span>
                                </li>
                            `;
                        });
                        
                        html += `
                                    </ul>
                                </div>
                        `;
                    }
                    
                    if (stats.exercises_by_equipment && stats.exercises_by_equipment.length > 0) {
                        html += `
                                <div class="col-md-6">
                                    <h5>Exercises by Equipment</h5>
                                    <ul class="list-group">
                        `;
                        
                        stats.exercises_by_equipment.forEach(item => {
                            html += `
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    ${item.equipment}
                                    <span class="badge bg-success rounded-pill">${item.exercise_count}</span>
                                </li>
                            `;
                        });
                        
                        html += `
                                    </ul>
                                </div>
                            </div>
                        `;
                    }
                    
                    statsContainer.innerHTML = html;
                }
            } else {
                console.error('Failed to load library stats:', result.message);
                if (statsErrorMessage) {
                    statsErrorMessage.style.display = 'block';
                }
            }
        })
        .catch(error => {
            console.error('Error loading library stats:', error);
            if (statsLoadingSpinner) statsLoadingSpinner.style.display = 'none';
            if (statsErrorMessage) {
                statsErrorMessage.style.display = 'block';
            }
        });
}

/**
 * Setup the Add Exercise Form
 */
function setupAddExerciseForm() {
    const form = document.getElementById('addExerciseForm');
    if (!form) return;
    
    loadFormOptions(form);
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        fetch('api/exercise_library.php?action=add_exercise', {
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
                showModal('Success', 'Exercise added successfully!', 'success');
                
                // Reset form and close modal
                form.reset();
                const modal = bootstrap.Modal.getInstance(document.getElementById('addExerciseModal'));
                if (modal) modal.hide();
                
                // Refresh data
                loadLibraryStats();
                searchExercises();
            } else {
                showModal('Error', result.message || 'Failed to add exercise', 'danger');
            }
        })
        .catch(error => {
            console.error('Error adding exercise:', error);
            showModal('Error', 'An error occurred. Please try again.', 'danger');
        });
    });
}

/**
 * Setup the Edit Exercise Form
 */
function setupEditExerciseForm() {
    const form = document.getElementById('editExerciseForm');
    if (!form) return;
    
    loadFormOptions(form);
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        fetch('api/exercise_library.php?action=update_exercise', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                // Show success message
                showModal('Success', 'Exercise updated successfully!', 'success');
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('editExerciseModal'));
                if (modal) modal.hide();
                
                // Refresh data
                loadLibraryStats();
                searchExercises();
            } else {
                showModal('Error', result.message || 'Failed to update exercise', 'danger');
            }
        })
        .catch(error => {
            console.error('Error updating exercise:', error);
            showModal('Error', 'An error occurred. Please try again.', 'danger');
        });
    });
}

/**
 * Load muscle groups and equipment options for a form
 * @param {HTMLFormElement} form - The form to load options for
 */
function loadFormOptions(form) {
    Promise.all([
        fetch('api/exercise_library.php?action=muscle_groups'),
        fetch('api/exercise_library.php?action=equipment')
    ])
    .then(responses => Promise.all(responses.map(r => r.json())))
    .then(([muscleGroups, equipment]) => {
        if (muscleGroups.success) {
            populateFormSelect(form.querySelector('[name="muscle_group_id"]'), muscleGroups.data);
        }
        
        if (equipment.success) {
            populateFormSelect(form.querySelector('[name="equipment_id"]'), equipment.data);
        }
    })
    .catch(error => {
        console.error('Error loading form options:', error);
    });
}

/**
 * Populate a select element with options
 * @param {HTMLSelectElement} select - The select element to populate
 * @param {Array} options - Array of option objects
 */
function populateFormSelect(select, options) {
    if (!select) return;
    
    // Keep the first option (placeholder)
    const defaultOption = select.options[0];
    select.innerHTML = '';
    select.appendChild(defaultOption);
    
    // Add options
    options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.id;
        opt.textContent = option.name;
        select.appendChild(opt);
    });
}

/**
 * View an exercise
 * @param {number} exerciseId - ID of the exercise to view
 */
function viewExercise(exerciseId) {
    fetch(`api/exercise_library.php?action=get_exercise&id=${exerciseId}`)
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                const exercise = result.data;
                
                const content = `
                    <p><strong>Exercise:</strong> ${exercise.name}</p>
                    <p><strong>Muscle Group:</strong> ${exercise.muscle_group}</p>
                    <p><strong>Equipment:</strong> ${exercise.equipment}</p>
                    <p><strong>Description:</strong> ${exercise.description || 'No description available'}</p>
                `;
                
                showModal('Exercise Details', content, 'info');
            } else {
                showModal('Error', result.message || 'Failed to load exercise', 'danger');
            }
        })
        .catch(error => {
            console.error('Error viewing exercise:', error);
            showModal('Error', 'An error occurred. Please try again.', 'danger');
        });
}

/**
 * Edit an exercise
 * @param {number} exerciseId - ID of the exercise to edit
 */
function editExercise(exerciseId) {
    fetch(`api/exercise_library.php?action=get_exercise&id=${exerciseId}`)
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                const exercise = result.data;
                const form = document.getElementById('editExerciseForm');
                
                if (form) {
                    // Set form values
                    form.querySelector('[name="id"]').value = exercise.id;
                    form.querySelector('[name="name"]').value = exercise.name;
                    form.querySelector('[name="description"]').value = exercise.description || '';
                    
                    // Set select values
                    const muscleGroupSelect = form.querySelector('[name="muscle_group_id"]');
                    const equipmentSelect = form.querySelector('[name="equipment_id"]');
                    
                    // Find and select the right options (we might need to wait for options to load)
                    const setSelectValues = function() {
                        // Set muscle group
                        for (let i = 0; i < muscleGroupSelect.options.length; i++) {
                            if (muscleGroupSelect.options[i].textContent === exercise.muscle_group) {
                                muscleGroupSelect.selectedIndex = i;
                                break;
                            }
                        }
                        
                        // Set equipment
                        for (let i = 0; i < equipmentSelect.options.length; i++) {
                            if (equipmentSelect.options[i].textContent === exercise.equipment) {
                                equipmentSelect.selectedIndex = i;
                                break;
                            }
                        }
                    };
                    
                    // Try immediately, then with a slight delay
                    setSelectValues();
                    setTimeout(setSelectValues, 100);
                    
                    // Show modal
                    const modal = new bootstrap.Modal(document.getElementById('editExerciseModal'));
                    modal.show();
                }
            } else {
                showModal('Error', result.message || 'Failed to load exercise', 'danger');
            }
        })
        .catch(error => {
            console.error('Error editing exercise:', error);
            showModal('Error', 'An error occurred. Please try again.', 'danger');
        });
}

/**
 * Show modal with custom content
 * @param {string} title - Modal title
 * @param {string} content - Modal content (HTML allowed)
 * @param {string} type - Alert type (success, danger, warning, info)
 */
function showModal(title, content, type) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('dynamicModal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'dynamicModal';
        modal.className = 'modal fade';
        modal.setAttribute('tabindex', '-1');
        
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title"></h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body"></div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // Set modal content
    modal.querySelector('.modal-title').textContent = title;
    
    const modalBody = modal.querySelector('.modal-body');
    if (typeof content === 'string') {
        const alertClass = type ? `alert alert-${type}` : '';
        modalBody.innerHTML = `<div class="${alertClass}">${content}</div>`;
    } else {
        modalBody.innerHTML = '';
        modalBody.appendChild(content);
    }
    
    // Show modal
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
}