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
        
        <!-- Personal Records Card -->
        <div class="card shadow-sm mb-4">
            <div class="card-header">
                <h3 class="mb-0">Personal Records</h3>
            </div>
            <div class="card-body">
                <!-- Loading spinner for PRs -->
                <div id="prLoadingSpinner" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-2">Loading personal records...</p>
                </div>
                
                <!-- PR content -->
                <div id="personalRecords">
                    <!-- PRs will be loaded here -->
                </div>
                
                <!-- Error message for PRs -->
                <div id="prErrorMessage" class="alert alert-danger" style="display: none;">
                    Failed to load personal records
                </div>
            </div>
        </div>
        
        <!-- Library Stats Card -->
        <div class="card shadow-sm mb-4">
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
        
        <!-- Actions Card -->
        <div class="row mt-3">
            <div class="col-12">
                <div class="card shadow-sm">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h3 class="mb-0">Actions</h3>
                    </div>
                    <div class="card-body">
                        <button id="regeneratePRsBtn" class="btn btn-warning">
                            <i class="fas fa-sync-alt"></i> Regenerate Personal Records
                        </button>
                        <small class="text-muted ms-3">Use this if your personal records aren't showing up correctly.</small>
                        <div id="regenerateResult" class="mt-2"></div>
                    </div>
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

<!-- Debug script to troubleshoot loading issues -->
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Load personal records
    loadPersonalRecords();
    
    // Set up the regenerate PRs button
    const regeneratePRsBtn = document.getElementById('regeneratePRsBtn');
    if (regeneratePRsBtn) {
        regeneratePRsBtn.addEventListener('click', function() {
            if (confirm('This will regenerate all personal records from your workout history. Proceed?')) {
                regeneratePersonalRecords();
            }
        });
    }
    
    // Define new versions of the functions that match the API's expectations
    window.searchExercises = function(page = 1) {
        // Reset current page when doing a new search
        window.currentExercisePage = 1;
        
        console.log('Custom searchExercises function called');
        
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
        
        // Based on the API's expectations, we'll just use the default endpoint first
        fetch('api/exercise_library.php')
            .then(response => {
                console.log('API response status:', response.status);
                return response.json();
            })
            .then(result => {
                // Hide loading spinner
                if (loadingSpinner) loadingSpinner.style.display = 'none';
                
                if (result.success) {
                    console.log('API data retrieved:', result);
                    // Filter results client-side based on search parameters
                    let filteredData = result.data.exercises;
                    
                    if (searchInput && searchInput.value) {
                        const searchTerm = searchInput.value.toLowerCase();
                        filteredData = filteredData.filter(ex => 
                            ex.name.toLowerCase().includes(searchTerm) || 
                            ex.muscle_group.toLowerCase().includes(searchTerm) || 
                            ex.equipment.toLowerCase().includes(searchTerm)
                        );
                    }
                    
                    if (muscleGroupFilter && muscleGroupFilter.value) {
                        filteredData = filteredData.filter(ex => 
                            ex.muscle_group === muscleGroupFilter.value
                        );
                    }
                    
                    if (equipmentFilter && equipmentFilter.value) {
                        filteredData = filteredData.filter(ex => 
                            ex.equipment === equipmentFilter.value
                        );
                    }
                    
                    // Display results
                    renderSearchResults(filteredData);
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
    };

    window.loadLibraryStats = function() {
        console.log('Custom loadLibraryStats function called');
        
        const statsContainer = document.getElementById('libraryStats');
        const statsLoadingSpinner = document.getElementById('statsLoadingSpinner');
        const statsErrorMessage = document.getElementById('statsErrorMessage');
        
        if (statsLoadingSpinner) statsLoadingSpinner.style.display = 'block';
        if (statsContainer) statsContainer.innerHTML = '';
        if (statsErrorMessage) statsErrorMessage.style.display = 'none';
        
        // We'll use the default API endpoint to get all exercise data
        fetch('api/exercise_library.php')
            .then(response => {
                console.log('Stats API response status:', response.status);
                return response.json();
            })
            .then(result => {
                if (statsLoadingSpinner) statsLoadingSpinner.style.display = 'none';
                
                if (result.success && result.data) {
                    console.log('Stats API data retrieved:', result);
                    
                    // Calculate stats from the data
                    const data = result.data;
                    const muscleGroups = data.muscle_groups;
                    const equipment = data.equipment;
                    const exercises = data.exercises;
                    
                    // Create stats object
                    const stats = {
                        total_exercises: exercises.length,
                        total_muscle_groups: muscleGroups.length,
                        total_equipment: equipment.length,
                        exercises_by_muscle_group: [],
                        exercises_by_equipment: []
                    };
                    
                    // Count exercises by muscle group
                    const mgCounts = {};
                    exercises.forEach(ex => {
                        if (!mgCounts[ex.muscle_group]) {
                            mgCounts[ex.muscle_group] = 0;
                        }
                        mgCounts[ex.muscle_group]++;
                    });
                    
                    // Convert to array
                    Object.keys(mgCounts).forEach(mg => {
                        stats.exercises_by_muscle_group.push({
                            muscle_group: mg,
                            exercise_count: mgCounts[mg]
                        });
                    });
                    
                    // Sort by count (descending)
                    stats.exercises_by_muscle_group.sort((a, b) => b.exercise_count - a.exercise_count);
                    
                    // Count exercises by equipment
                    const eqCounts = {};
                    exercises.forEach(ex => {
                        if (!eqCounts[ex.equipment]) {
                            eqCounts[ex.equipment] = 0;
                        }
                        eqCounts[ex.equipment]++;
                    });
                    
                    // Convert to array
                    Object.keys(eqCounts).forEach(eq => {
                        stats.exercises_by_equipment.push({
                            equipment: eq,
                            exercise_count: eqCounts[eq]
                        });
                    });
                    
                    // Sort by count (descending)
                    stats.exercises_by_equipment.sort((a, b) => b.exercise_count - a.exercise_count);
                    
                    // Render stats
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
                        
                        if (stats.exercises_by_muscle_group.length > 0) {
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
                        
                        if (stats.exercises_by_equipment.length > 0) {
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
    };

    // Load filter options for the form
    window.loadFilterOptions = function() {
        console.log('Custom loadFilterOptions function called');
        
        fetch('api/exercise_library.php')
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    const muscleGroups = result.data.muscle_groups;
                    const equipment = result.data.equipment;
                    
                    // Populate muscle group filter
                    populateFilterDropdown('muscleGroupFilter', muscleGroups);
                    
                    // Populate equipment filter
                    populateFilterDropdown('equipmentFilter', equipment);
                }
            })
            .catch(error => {
                console.error('Error loading filter options:', error);
            });
    };

    // Populate filter dropdown with options
    window.populateFilterDropdown = function(elementId, options) {
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
            searchExercises();
        });
    };

    // Render search results in a table with pagination
    window.renderSearchResults = function(exerciseData) {
        const resultsBody = document.getElementById('resultsBody');
        const searchResults = document.getElementById('searchResults');
        const paginationContainer = document.getElementById('searchPagination');
        
        if (!resultsBody || !searchResults) {
            console.error('Results container not found');
            return;
        }
        
        if (!exerciseData || exerciseData.length === 0) {
            resultsBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">No exercises found</td>
                </tr>
            `;
            searchResults.style.display = 'block';
            if (paginationContainer) {
                paginationContainer.innerHTML = '';
            }
            return;
        }
        
        // Pagination setup
        const itemsPerPage = 10;
        const totalPages = Math.ceil(exerciseData.length / itemsPerPage);
        
        // Get current page from the page state or default to 1
        const currentPage = window.currentExercisePage || 1;
        
        // Calculate start and end indices for the current page
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, exerciseData.length);
        
        // Get data for the current page
        const currentPageData = exerciseData.slice(startIndex, endIndex);
        
        // Render the results
        let html = '';
        currentPageData.forEach(exercise => {
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
        
        // Render pagination if needed
        if (totalPages > 1 && paginationContainer) {
            let paginationHtml = '<ul class="pagination justify-content-center">';
            
            // Previous button
            paginationHtml += `
                <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${currentPage - 1}" aria-label="Previous">
                        <span aria-hidden="true">&laquo;</span>
                    </a>
                </li>
            `;
            
            // Page numbers
            const maxPagesToShow = 5;
            let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
            let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
            
            // Adjust if we're at the end
            if (endPage - startPage + 1 < maxPagesToShow) {
                startPage = Math.max(1, endPage - maxPagesToShow + 1);
            }
            
            // First page
            if (startPage > 1) {
                paginationHtml += `
                    <li class="page-item">
                        <a class="page-link" href="#" data-page="1">1</a>
                    </li>
                `;
                if (startPage > 2) {
                    paginationHtml += `
                        <li class="page-item disabled">
                            <a class="page-link" href="#">...</a>
                        </li>
                    `;
                }
            }
            
            // Page numbers
            for (let i = startPage; i <= endPage; i++) {
                paginationHtml += `
                    <li class="page-item ${currentPage === i ? 'active' : ''}">
                        <a class="page-link" href="#" data-page="${i}">${i}</a>
                    </li>
                `;
            }
            
            // Last page
            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    paginationHtml += `
                        <li class="page-item disabled">
                            <a class="page-link" href="#">...</a>
                        </li>
                    `;
                }
                paginationHtml += `
                    <li class="page-item">
                        <a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a>
                    </li>
                `;
            }
            
            // Next button
            paginationHtml += `
                <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${currentPage + 1}" aria-label="Next">
                        <span aria-hidden="true">&raquo;</span>
                    </a>
                </li>
            `;
            
            paginationHtml += '</ul>';
            paginationContainer.innerHTML = paginationHtml;
            
            // Add click event listeners to pagination links
            paginationContainer.querySelectorAll('.page-link').forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const pageNum = parseInt(this.getAttribute('data-page'));
                    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
                        window.currentExercisePage = pageNum;
                        // Re-render with the same data but different page
                        renderSearchResults(exerciseData);
                        // Scroll to the top of the results
                        searchResults.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            });
        } else if (paginationContainer) {
            paginationContainer.innerHTML = '';
        }
        
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
    };

    // View an exercise
    window.viewExercise = function(exerciseId) {
        fetch(`api/exercise_library.php?action=get_exercise&id=${exerciseId}`)
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    const exercise = result.data;
                    
                    // Get personal records for this exercise
                    fetch(`api/personal_records.php?action=get_exercise_records&exercise_id=${exerciseId}`)
                        .then(response => response.json())
                        .then(recordsResult => {
                            let content = `
                                <div>
                                    <p><strong>Exercise:</strong> ${exercise.name}</p>
                                    <p><strong>Muscle Group:</strong> ${exercise.muscle_group}</p>
                                    <p><strong>Equipment:</strong> ${exercise.equipment}</p>
                                    <p><strong>Description:</strong> ${exercise.description || 'No description available'}</p>
                                </div>
                            `;
                            
                            // Add personal records section if available
                            if (recordsResult.success && recordsResult.data && recordsResult.data.length > 0) {
                                // Filter to only show latest record for each record type
                                const latestRecords = {};
                                
                                recordsResult.data.forEach(record => {
                                    const key = record.record_type;
                                    
                                    if (!latestRecords[key] || new Date(record.date) > new Date(latestRecords[key].date)) {
                                        latestRecords[key] = record;
                                    }
                                });
                                
                                // Convert back to array and sort by date (newest first)
                                const latestRecordsArray = Object.values(latestRecords);
                                latestRecordsArray.sort((a, b) => new Date(b.date) - new Date(a.date));
                                
                                if (latestRecordsArray.length > 0) {
                                    content += `
                                        <div class="mt-4">
                                            <h5>Personal Records</h5>
                                            <div class="table-responsive">
                                                <table class="table table-sm table-striped">
                                                    <thead>
                                                        <tr>
                                                            <th>Type</th>
                                                            <th>Value</th>
                                                            <th>Date</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                    `;
                                    
                                    latestRecordsArray.forEach(record => {
                                        const recordType = formatRecordType(record.record_type);
                                        const recordValue = formatRecordValue(record.record_value, record.record_type);
                                        const dateStr = formatDate(record.date);
                                        const isNew = !record.is_acknowledged;
                                        
                                        content += `
                                            <tr ${isNew ? 'class="table-warning"' : ''}>
                                                <td><span class="badge bg-success">${recordType}</span> ${isNew ? '<span class="badge bg-danger ms-1">NEW</span>' : ''}</td>
                                                <td>${recordValue}</td>
                                                <td>${dateStr}</td>
                                            </tr>
                                        `;
                                    });
                                    
                                    content += `
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    `;
                                }
                            } else {
                                content += `
                                    <div class="mt-4">
                                        <h5>Personal Records</h5>
                                        <p class="text-muted">No personal records available for this exercise.</p>
                                    </div>
                                `;
                            }
                            
                            showModal('Exercise Details', content, 'info');
                        })
                        .catch(error => {
                            console.error('Error loading personal records:', error);
                            showModal('Exercise Details', `
                                <div>
                                    <p><strong>Exercise:</strong> ${exercise.name}</p>
                                    <p><strong>Muscle Group:</strong> ${exercise.muscle_group}</p>
                                    <p><strong>Equipment:</strong> ${exercise.equipment}</p>
                                    <p><strong>Description:</strong> ${exercise.description || 'No description available'}</p>
                                    <div class="mt-4">
                                        <h5>Personal Records</h5>
                                        <p class="text-danger">Error loading personal records</p>
                                    </div>
                                </div>
                            `, 'info');
                        });
                } else {
                    showModal('Error', result.message || 'Failed to load exercise', 'danger');
                }
            })
            .catch(error => {
                console.error('Error viewing exercise:', error);
                showModal('Error', 'An error occurred. Please try again.', 'danger');
            });
    };

    // Edit an exercise
    window.editExercise = function(exerciseId) {
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
                        
                        // Load form options
                        fetch('api/exercise_library.php')
                            .then(response => response.json())
                            .then(optionsResult => {
                                if (optionsResult.success) {
                                    const muscleGroups = optionsResult.data.muscle_groups;
                                    const equipment = optionsResult.data.equipment;
                                    
                                    // Populate form selects
                                    const muscleGroupSelect = form.querySelector('[name="muscle_group_id"]');
                                    const equipmentSelect = form.querySelector('[name="equipment_id"]');
                                    
                                    // Clear existing options
                                    muscleGroupSelect.innerHTML = '<option value="">Select muscle group</option>';
                                    equipmentSelect.innerHTML = '<option value="">Select equipment</option>';
                                    
                                    // Add muscle group options
                                    muscleGroups.forEach(mg => {
                                        const opt = document.createElement('option');
                                        opt.value = mg.id;
                                        opt.textContent = mg.name;
                                        opt.selected = (mg.name === exercise.muscle_group);
                                        muscleGroupSelect.appendChild(opt);
                                    });
                                    
                                    // Add equipment options
                                    equipment.forEach(eq => {
                                        const opt = document.createElement('option');
                                        opt.value = eq.id;
                                        opt.textContent = eq.name;
                                        opt.selected = (eq.name === exercise.equipment);
                                        equipmentSelect.appendChild(opt);
                                    });
                                    
                                    // Show modal
                                    const modal = new bootstrap.Modal(document.getElementById('editExerciseModal'));
                                    modal.show();
                                } else {
                                    showModal('Error', 'Failed to load form options', 'danger');
                                }
                            })
                            .catch(error => {
                                console.error('Error loading form options:', error);
                                showModal('Error', 'An error occurred while loading form options', 'danger');
                            });
                    }
                } else {
                    showModal('Error', result.message || 'Failed to load exercise', 'danger');
                }
            })
            .catch(error => {
                console.error('Error editing exercise:', error);
                showModal('Error', 'An error occurred. Please try again.', 'danger');
            });
    };

    // Show modal with custom content
    window.showModal = function(title, content, type) {
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
    };

    // Form submission handlers
    document.getElementById('searchForm').addEventListener('submit', function(e) {
        e.preventDefault();
        searchExercises();
    });
    
    document.getElementById('searchForm').addEventListener('reset', function() {
        setTimeout(searchExercises, 10);
    });
    
    // Add exercise form setup
    const addExerciseForm = document.getElementById('addExerciseForm');
    if (addExerciseForm) {
        addExerciseForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(addExerciseForm);
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
    
    // Edit exercise form setup
    const editExerciseForm = document.getElementById('editExerciseForm');
    if (editExerciseForm) {
        editExerciseForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(editExerciseForm);
            const data = Object.fromEntries(formData.entries());
            
            fetch('api/exercise_library.php?action=update_exercise', {
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
    
    // Initialize everything
    loadFilterOptions();
    loadLibraryStats();
    searchExercises();
});
</script>

<!-- Script for handling personal records functions -->
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Load personal records
    loadPersonalRecords();
    
    // Set up the regenerate PRs button
    const regeneratePRsBtn = document.getElementById('regeneratePRsBtn');
    if (regeneratePRsBtn) {
        regeneratePRsBtn.addEventListener('click', function() {
            if (confirm('This will regenerate all personal records from your workout history. Proceed?')) {
                regeneratePersonalRecords();
            }
        });
    }
});

/**
 * Load personal records
 */
function loadPersonalRecords() {
    const prContainer = document.getElementById('personalRecords');
    const prLoadingSpinner = document.getElementById('prLoadingSpinner');
    const prErrorMessage = document.getElementById('prErrorMessage');
    
    if (prLoadingSpinner) prLoadingSpinner.style.display = 'block';
    if (prContainer) prContainer.innerHTML = '';
    if (prErrorMessage) prErrorMessage.style.display = 'none';
    
    fetch('api/personal_records.php?action=get_records')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(result => {
            if (prLoadingSpinner) prLoadingSpinner.style.display = 'none';
            
            if (result.success && result.data) {
                renderPersonalRecords(result.data);
            } else {
                console.error('Failed to load personal records:', result.message);
                if (prErrorMessage) {
                    prErrorMessage.textContent = result.message || 'Failed to load personal records';
                    prErrorMessage.style.display = 'block';
                }
            }
        })
        .catch(error => {
            console.error('Error loading personal records:', error);
            if (prLoadingSpinner) prLoadingSpinner.style.display = 'none';
            if (prErrorMessage) {
                prErrorMessage.textContent = 'Error loading personal records. Please try again.';
                prErrorMessage.style.display = 'block';
            }
        });
}

/**
 * Render personal records
 */
function renderPersonalRecords(records) {
    const prContainer = document.getElementById('personalRecords');
    if (!prContainer) return;
    
    if (!records || records.length === 0) {
        prContainer.innerHTML = `
            <div class="text-center py-3">
                <i class="fas fa-trophy fa-3x text-muted mb-3"></i>
                <p class="mb-0">No personal records available yet.</p>
            </div>
        `;
        return;
    }
    
    // Group records by exercise and record type to find latest records
    const latestRecords = {};
    
    records.forEach(record => {
        const key = `${record.exercise_id}_${record.record_type}`;
        
        // If we haven't seen this exercise/record type combo yet, or if this record is newer
        if (!latestRecords[key] || new Date(record.date) > new Date(latestRecords[key].date)) {
            latestRecords[key] = record;
        }
    });
    
    // Convert the object of latest records back to an array
    const latestRecordsArray = Object.values(latestRecords);
    
    // Group records by exercise name for display
    const recordsByExercise = {};
    
    latestRecordsArray.forEach(record => {
        if (!recordsByExercise[record.exercise_name]) {
            recordsByExercise[record.exercise_name] = [];
        }
        recordsByExercise[record.exercise_name].push(record);
    });
    
    let html = `
        <div class="accordion" id="accordionPersonalRecords">
    `;
    
    // Sort exercises alphabetically
    const sortedExercises = Object.keys(recordsByExercise).sort();
    
    sortedExercises.forEach((exerciseName, index) => {
        const recordsList = recordsByExercise[exerciseName];
        const headingId = `heading${index}`;
        const collapseId = `collapse${index}`;
        
        html += `
            <div class="accordion-item">
                <h2 class="accordion-header" id="${headingId}">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}">
                        <strong>${exerciseName}</strong> <span class="badge bg-primary ms-2">${recordsList.length}</span>
                    </button>
                </h2>
                <div id="${collapseId}" class="accordion-collapse collapse" aria-labelledby="${headingId}" data-bs-parent="#accordionPersonalRecords">
                    <div class="accordion-body">
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Type</th>
                                        <th>Value</th>
                                        <th>Date</th>
                                        <th>Muscle Group</th>
                                    </tr>
                                </thead>
                                <tbody>
        `;
        
        // Sort records by date (newest first)
        recordsList.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        recordsList.forEach(record => {
            const recordType = formatRecordType(record.record_type);
            const recordValue = formatRecordValue(record.record_value, record.record_type);
            const dateStr = formatDate(record.date);
            const isNew = !record.is_acknowledged;
            
            html += `
                <tr ${isNew ? 'class="table-warning"' : ''}>
                    <td><span class="badge bg-success">${recordType}</span> ${isNew ? '<span class="badge bg-danger ms-1">NEW</span>' : ''}</td>
                    <td>${recordValue}</td>
                    <td>${dateStr}</td>
                    <td>${record.muscle_group}</td>
                </tr>
            `;
        });
        
        html += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `
        </div>
    `;
    
    prContainer.innerHTML = html;
}

/**
 * Format record type
 */
function formatRecordType(type) {
    switch (type) {
        case 'weight':
            return 'Weight PR';
        case 'reps':
            return 'Reps PR';
        case 'volume':
            return 'Volume PR';
        case 'time':
            return 'Time PR';
        default:
            return type;
    }
}

/**
 * Format record value
 */
function formatRecordValue(value, type) {
    switch (type) {
        case 'weight':
            return `${value} kg`;
        case 'reps':
            return `${value} reps`;
        case 'volume':
            return `${value} kg (volume)`;
        case 'time':
            return `${value} seconds`;
        default:
            return value;
    }
}

/**
 * Format date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Regenerate personal records
 */
function regeneratePersonalRecords() {
    const resultDiv = document.getElementById('regenerateResult');
    const regeneratePRsBtn = document.getElementById('regeneratePRsBtn');
    
    // Show loading indicator
    regeneratePRsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    regeneratePRsBtn.disabled = true;
    
    fetch('api/personal_records.php?action=regenerate_records', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(result => {
        // Reset button state
        regeneratePRsBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Regenerate Personal Records';
        regeneratePRsBtn.disabled = false;
        
        if (result.success) {
            resultDiv.innerHTML = `
                <div class="alert alert-success">
                    ${result.message}
                </div>
            `;
            
            // Reload the personal records
            loadPersonalRecords();
        } else {
            resultDiv.innerHTML = `
                <div class="alert alert-danger">
                    ${result.message}
                </div>
            `;
        }
    })
    .catch(error => {
        console.error('Error regenerating personal records:', error);
        
        // Reset button state
        regeneratePRsBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Regenerate Personal Records';
        regeneratePRsBtn.disabled = false;
        
        resultDiv.innerHTML = `
            <div class="alert alert-danger">
                An error occurred while regenerating personal records: ${error}
            </div>
        `;
    });
}
</script>

<?php require_once 'includes/footer.php'; ?>