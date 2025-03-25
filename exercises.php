<?php
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

require_once 'includes/header.php';
require_once 'includes/functions.php';
require_once 'includes/user_functions.php';

// Redirect if not logged in
requireLogin();

// Ensure we're using the correct user ID from the session
$userId = $_SESSION['user_id'];
?>

<div class="row">
    <div class="col-12">
        <div class="card shadow-sm mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h2 class="mb-0">Exercise Library</h2>
                <div>
                    <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addExerciseModal">
                        <i class="fas fa-plus-circle"></i> Add Exercise
                    </button>
                </div>
            </div>
            <div class="card-body">
                <!-- Search and filter form -->
                <form id="searchForm" class="mb-4">
                    <div class="row g-3">
                        <div class="col-md-4">
                            <div class="input-group">
                                <input type="text" class="form-control" id="searchInput" placeholder="Search exercises..." aria-label="Search exercises">
                                <button class="btn btn-outline-secondary" type="submit">Search</button>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <select class="form-select" id="muscleGroupFilter">
                                <option value="">All Muscle Groups</option>
                                <!-- Muscle group options will be loaded dynamically -->
                            </select>
                        </div>
                        <div class="col-md-3">
                            <select class="form-select" id="equipmentFilter">
                                <option value="">All Equipment</option>
                                <!-- Equipment options will be loaded dynamically -->
                            </select>
                        </div>
                        <div class="col-md-2">
                            <button type="reset" class="btn btn-outline-secondary w-100">Reset</button>
                        </div>
                    </div>
                </form>
                
                <h3>Results</h3>
                
                <!-- Loading spinner -->
                <div id="loadingSpinner" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-2">Loading exercise library...</p>
                </div>
                
                <!-- Results table -->
                <div id="searchResults" class="table-responsive" style="display: none;">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Exercise</th>
                                <th>Muscle Group</th>
                                <th>Equipment</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="resultsBody">
                            <!-- Search results will be loaded here -->
                        </tbody>
                    </table>
                    <div id="searchPagination" class="d-flex justify-content-center mt-3">
                        <!-- Pagination will be loaded here -->
                    </div>
                </div>
                
                <!-- Error message -->
                <div id="errorMessage" class="alert alert-danger" style="display: none;">
                    Error loading exercises
                </div>
            </div>
        </div>
        
        <div class="card shadow-sm">
            <div class="card-header">
                <h3 class="mb-0">Library Stats</h3>
            </div>
            <div class="card-body">
                <!-- Loading spinner for stats -->
                <div id="statsLoadingSpinner" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-2">Loading library statistics...</p>
                </div>
                
                <!-- Stats content -->
                <div id="libraryStats">
                    <!-- Stats will be loaded here -->
                </div>
                
                <!-- Error message for stats -->
                <div id="statsErrorMessage" class="alert alert-danger" style="display: none;">
                    Failed to load library stats
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Add Exercise Modal -->
<div class="modal fade" id="addExerciseModal" tabindex="-1" aria-labelledby="addExerciseModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="addExerciseModalLabel">Add New Exercise</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form id="addExerciseForm">
                    <div class="mb-3">
                        <label for="name" class="form-label">Exercise Name</label>
                        <input type="text" class="form-control" id="name" name="name" required>
                    </div>
                    <div class="mb-3">
                        <label for="muscle_group_id" class="form-label">Muscle Group</label>
                        <select class="form-select" id="muscle_group_id" name="muscle_group_id" required>
                            <option value="">Select muscle group</option>
                            <!-- Muscle group options will be loaded dynamically -->
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="equipment_id" class="form-label">Equipment</label>
                        <select class="form-select" id="equipment_id" name="equipment_id" required>
                            <option value="">Select equipment</option>
                            <!-- Equipment options will be loaded dynamically -->
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="description" class="form-label">Description (Optional)</label>
                        <textarea class="form-control" id="description" name="description" rows="3"></textarea>
                    </div>
                    <div class="text-end">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="submit" class="btn btn-primary">Add Exercise</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<!-- Edit Exercise Modal -->
<div class="modal fade" id="editExerciseModal" tabindex="-1" aria-labelledby="editExerciseModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="editExerciseModalLabel">Edit Exercise</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form id="editExerciseForm">
                    <input type="hidden" id="edit_id" name="id">
                    <div class="mb-3">
                        <label for="edit_name" class="form-label">Exercise Name</label>
                        <input type="text" class="form-control" id="edit_name" name="name" required>
                    </div>
                    <div class="mb-3">
                        <label for="edit_muscle_group_id" class="form-label">Muscle Group</label>
                        <select class="form-select" id="edit_muscle_group_id" name="muscle_group_id" required>
                            <option value="">Select muscle group</option>
                            <!-- Muscle group options will be loaded dynamically -->
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="edit_equipment_id" class="form-label">Equipment</label>
                        <select class="form-select" id="edit_equipment_id" name="equipment_id" required>
                            <option value="">Select equipment</option>
                            <!-- Equipment options will be loaded dynamically -->
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="edit_description" class="form-label">Description (Optional)</label>
                        <textarea class="form-control" id="edit_description" name="description" rows="3"></textarea>
                    </div>
                    <div class="text-end">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="submit" class="btn btn-primary">Update Exercise</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<!-- Custom script for the exercise library page -->
<script>
// Page Initialization and Core Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    let currentPage = 1;
    const perPage = 10;

    // Initial data loading
    loadFilterOptions();
    loadLibraryStats();
    searchExercises();

    // Setup event listeners
    setupEventListeners();
    setupForms();

    // Function to load filter options (muscle groups and equipment)
    function loadFilterOptions() {
        Promise.all([
            fetch('api/exercise_library.php?action=muscle_groups'),
            fetch('api/exercise_library.php?action=equipment')
        ])
        .then(responses => Promise.all(responses.map(r => r.json())))
        .then(([muscleGroups, equipment]) => {
            if (muscleGroups.success) {
                populateFilterDropdown('muscleGroupFilter', muscleGroups.data);
                populateFormSelect('muscle_group_id', muscleGroups.data);
                populateFormSelect('edit_muscle_group_id', muscleGroups.data);
            }
            
            if (equipment.success) {
                populateFilterDropdown('equipmentFilter', equipment.data);
                populateFormSelect('equipment_id', equipment.data);
                populateFormSelect('edit_equipment_id', equipment.data);
            }
        })
        .catch(error => {
            console.error('Error loading filter options:', error);
        });
    }
    
    // Function to populate a filter dropdown
    function populateFilterDropdown(elementId, options) {
        const select = document.getElementById(elementId);
        if (!select) return;
        
        // Keep the default option
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
    
    // Function to populate a form select dropdown
    function populateFormSelect(elementId, options) {
        const select = document.getElementById(elementId);
        if (!select) return;
        
        // Keep the default option
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
    
    // Function to search exercises
    function searchExercises() {
        const searchInput = document.getElementById('searchInput');
        const muscleGroupFilter = document.getElementById('muscleGroupFilter');
        const equipmentFilter = document.getElementById('equipmentFilter');
        
        // Show loading state
        document.getElementById('loadingSpinner').style.display = 'block';
        document.getElementById('searchResults').style.display = 'none';
        document.getElementById('errorMessage').style.display = 'none';
        
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
                document.getElementById('loadingSpinner').style.display = 'none';
                
                if (result.success) {
                    renderSearchResults(result);
                    renderPagination(result);
                } else {
                    console.error('Search failed:', result.message);
                    const errorMessage = document.getElementById('errorMessage');
                    errorMessage.textContent = result.message || 'Error loading exercises';
                    errorMessage.style.display = 'block';
                }
            })
            .catch(error => {
                console.error('Error searching exercises:', error);
                document.getElementById('loadingSpinner').style.display = 'none';
                const errorMessage = document.getElementById('errorMessage');
                errorMessage.textContent = 'Error loading exercises. Please try again.';
                errorMessage.style.display = 'block';
            });
    }
    
    // Function to render search results
    function renderSearchResults(result) {
        const resultsBody = document.getElementById('resultsBody');
        const searchResults = document.getElementById('searchResults');
        
        if (!resultsBody || !searchResults) return;
        
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
                        <div class="action-buttons">
                            <button class="btn btn-action btn-outline-primary view-exercise-btn" data-id="${exercise.id}" title="View">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-action btn-outline-secondary edit-exercise-btn" data-id="${exercise.id}" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-action btn-outline-danger delete-exercise-btn" data-id="${exercise.id}" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
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
        
        // Add event listeners for delete buttons
        document.querySelectorAll('.delete-exercise-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const exerciseId = this.getAttribute('data-id');
                deleteExercise(exerciseId);
            });
        });
    }
    
    // Function to render pagination
    function renderPagination(result) {
        const paginationContainer = document.getElementById('searchPagination');
        if (!paginationContainer) return;
        
        // Make sure result and its pagination property exist
        if (!result || !result.pagination) {
            paginationContainer.innerHTML = '';
            return;
        }
        
        const pagination = result.pagination;
        
        // Guard against missing properties in pagination
        if (!pagination || typeof pagination !== 'object') {
            console.error('Invalid pagination object:', pagination);
            paginationContainer.innerHTML = '';
            return;
        }
        
        // Safely access total_count with fallback to 0
        const totalCount = (pagination.total_count !== undefined) ? parseInt(pagination.total_count) : 0;
        const perPage = (pagination.per_page !== undefined) ? parseInt(pagination.per_page) : 10;
        const currentPageNum = (pagination.current_page !== undefined) ? parseInt(pagination.current_page) : 1;
        
        // Calculate total pages with a safe fallback
        const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }
        
        let paginationHTML = '<ul class="pagination justify-content-center">';
        
        // Previous page button
        paginationHTML += `
            <li class="page-item ${currentPageNum === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${currentPageNum - 1}" aria-label="Previous">
                    <span aria-hidden="true">&laquo;</span>
                </a>
            </li>
        `;
        
        // Calculate which page numbers to show with ellipsis for large page counts
        const showEllipsis = totalPages > 7;
        const pageNumbers = [];
        
        if (showEllipsis) {
            // Always show first page
            pageNumbers.push(1);
            
            // Determine range around current page
            let rangeStart = Math.max(2, currentPageNum - 1);
            let rangeEnd = Math.min(totalPages - 1, currentPageNum + 1);
            
            // Adjust range to always show 3 pages if possible
            if (rangeEnd - rangeStart < 2) {
                if (rangeStart === 2) {
                    rangeEnd = Math.min(totalPages - 1, rangeStart + 2);
                } else if (rangeEnd === totalPages - 1) {
                    rangeStart = Math.max(2, rangeEnd - 2);
                }
            }
            
            // Add ellipsis before range if needed
            if (rangeStart > 2) {
                pageNumbers.push('ellipsis-start');
            }
            
            // Add range pages
            for (let i = rangeStart; i <= rangeEnd; i++) {
                pageNumbers.push(i);
            }
            
            // Add ellipsis after range if needed
            if (rangeEnd < totalPages - 1) {
                pageNumbers.push('ellipsis-end');
            }
            
            // Always show last page
            if (totalPages > 1) {
                pageNumbers.push(totalPages);
            }
        } else {
            // Show all pages if there are just a few
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        }
        
        // Generate page number buttons
        pageNumbers.forEach(page => {
            if (page === 'ellipsis-start' || page === 'ellipsis-end') {
                paginationHTML += `
                    <li class="page-item disabled">
                        <span class="page-link">...</span>
                    </li>
                `;
            } else {
                paginationHTML += `
                    <li class="page-item ${currentPageNum === page ? 'active' : ''}">
                        <a class="page-link" href="#" data-page="${page}">${page}</a>
                    </li>
                `;
            }
        });
        
        // Next page button
        paginationHTML += `
            <li class="page-item ${currentPageNum === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${currentPageNum + 1}" aria-label="Next">
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
                if (!isNaN(page) && page > 0) {
                    currentPage = page;
                    searchExercises();
                }
            });
        });
    }
    
    // Function to load library stats
    function loadLibraryStats() {
        const statsContainer = document.getElementById('libraryStats');
        const statsLoadingSpinner = document.getElementById('statsLoadingSpinner');
        const statsErrorMessage = document.getElementById('statsErrorMessage');
        
        if (statsLoadingSpinner) statsLoadingSpinner.style.display = 'block';
        if (statsContainer) statsContainer.innerHTML = '';
        if (statsErrorMessage) statsErrorMessage.style.display = 'none';
        
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
    
    // Function to view exercise details
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
    
    // Function to edit exercise
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
                        
                        // Find and select the right options by matching texts
                        const setSelectByText = function(select, text) {
                            for (let i = 0; i < select.options.length; i++) {
                                if (select.options[i].textContent === text) {
                                    select.selectedIndex = i;
                                    break;
                                }
                            }
                        };
                        
                        setSelectByText(muscleGroupSelect, exercise.muscle_group);
                        setSelectByText(equipmentSelect, exercise.equipment);
                        
                        // Show modal
                        const editModal = new bootstrap.Modal(document.getElementById('editExerciseModal'));
                        editModal.show();
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
    
    // Function to delete exercise
    function deleteExercise(exerciseId) {
        if (!confirm('Are you sure you want to delete this exercise? This action cannot be undone.')) {
            return;
        }
        
        fetch('api/exercise_library.php?action=delete_exercise', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: exerciseId })
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showModal('Success', 'Exercise deleted successfully!', 'success');
                
                // Refresh data
                loadLibraryStats();
                searchExercises();
            } else {
                showModal('Error', result.message || 'Failed to delete exercise', 'danger');
            }
        })
        .catch(error => {
            console.error('Error deleting exercise:', error);
            showModal('Error', 'An error occurred. Please try again.', 'danger');
        });
    }
    
    // Function to set up event listeners
    function setupEventListeners() {
        // Search form submission
        const searchForm = document.getElementById('searchForm');
        if (searchForm) {
            searchForm.addEventListener('submit', function(e) {
                e.preventDefault();
                currentPage = 1;
                searchExercises();
            });
            
            // Reset form handler
            searchForm.addEventListener('reset', function() {
                setTimeout(function() {
                    currentPage = 1;
                    searchExercises();
                }, 10);
            });
        }
    }
    
    // Function to set up form handlers
    function setupForms() {
        // Add Exercise Form
        const addExerciseForm = document.getElementById('addExerciseForm');
        if (addExerciseForm) {
            addExerciseForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const formData = new FormData(this);
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
                        addExerciseForm.reset();
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
        
        // Edit Exercise Form
        const editExerciseForm = document.getElementById('editExerciseForm');
        if (editExerciseForm) {
            editExerciseForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const formData = new FormData(this);
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
    }
    
    // Function to show a modal with custom content
    function showModal(title, content, type) {
        // Create modal if it doesn't exist
        let modal = document.getElementById('dynamicModal');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'dynamicModal';
            modal.className = 'modal fade';
            modal.setAttribute('tabindex', '-1');
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-labelledby', 'dynamicModalTitle');
            
            modal.innerHTML = `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="dynamicModalTitle"></h5>
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
        
        // Create and show modal with proper focus management
        const modalInstance = new bootstrap.Modal(modal, {
            keyboard: true,
            focus: true,
            backdrop: true
        });
        
        // Add event listener to handle focus properly
        modal.addEventListener('hidden.bs.modal', function () {
            // Remove aria-hidden when modal is hidden
            this.removeAttribute('aria-hidden');
        });
        
        // Add event listener for when modal is shown
        modal.addEventListener('shown.bs.modal', function () {
            // Focus the first focusable element in the modal
            const focusableElements = this.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }
        });
        
        modalInstance.show();
    }
});
</script>

<style>
/* Add styles for stats cards */
.stat-card {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 5px;
    text-align: center;
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.stat-card h3 {
    font-size: 2rem;
    margin-bottom: 5px;
    font-weight: bold;
    color: #007bff;
}

.stat-card p {
    color: #6c757d;
    margin-bottom: 0;
}

.stats-row {
    margin-bottom: 20px;
}
</style>

<?php require_once 'includes/footer.php'; ?>