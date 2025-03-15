/**
 * Exercise Library JavaScript
 * Handles functionality for the exercise library page
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the page
    loadLibraryStats();
    loadMuscleGroups();
    loadEquipment();
    searchExercises();
    
    // Event listeners
    document.getElementById('exerciseSearchForm').addEventListener('submit', function(e) {
        e.preventDefault();
        searchExercises();
    });
    
    document.getElementById('resetFiltersBtn').addEventListener('click', function() {
        document.getElementById('searchTerm').value = '';
        document.getElementById('muscleGroupFilter').value = '';
        document.getElementById('equipmentFilter').value = '';
        document.getElementById('sortBy').value = 'exercise_name';
        searchExercises();
    });
    
    document.getElementById('showFavoritesBtn').addEventListener('click', function() {
        loadFavoriteExercises();
    });
    
    // Dynamic event listener for exercise cards
    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('exercise-card') || 
            e.target.closest('.exercise-card')) {
            const card = e.target.classList.contains('exercise-card') ? 
                e.target : e.target.closest('.exercise-card');
            
            const exerciseId = card.dataset.id;
            const exerciseName = card.dataset.name;
            const muscleGroup = card.dataset.muscleGroup;
            const equipment = card.dataset.equipment;
            
            showExerciseDetail(exerciseId, exerciseName, muscleGroup, equipment);
        }
    });
    
    document.getElementById('addToWorkoutBtn').addEventListener('click', function() {
        const exerciseId = this.dataset.exerciseId;
        trackExerciseUsage(exerciseId);
        
        // Redirect to training page with pre-selected exercise
        window.location.href = 'training.php?exercise_id=' + exerciseId;
    });
});

/**
 * Load basic stats about the exercise library
 */
function loadLibraryStats() {
    fetch('api/exercise_library.php')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(result => {
            if (result.success) {
                const stats = result.data;
                const statsHtml = `
                    <div class="mb-3">
                        <h2 class="h4 mb-0">${stats.exercise_count}</h2>
                        <p class="text-muted">Exercises</p>
                    </div>
                    <div class="mb-3">
                        <h2 class="h4 mb-0">${stats.muscle_group_count}</h2>
                        <p class="text-muted">Muscle Groups</p>
                    </div>
                    <div class="mb-0">
                        <h2 class="h4 mb-0">${stats.equipment_count}</h2>
                        <p class="text-muted mb-0">Equipment Types</p>
                    </div>
                `;
                
                document.getElementById('libraryStats').innerHTML = statsHtml;
            } else {
                document.getElementById('libraryStats').innerHTML = 
                    '<div class="alert alert-danger">Failed to load library stats</div>';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('libraryStats').innerHTML = 
                '<div class="alert alert-danger">Error loading library stats</div>';
        });
}

/**
 * Load all muscle groups for the filter dropdown
 */
function loadMuscleGroups() {
    fetch('api/exercise_library.php?action=muscle_groups')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(result => {
            if (result.success) {
                const muscleGroups = result.data;
                const dropdown = document.getElementById('muscleGroupFilter');
                
                muscleGroups.forEach(group => {
                    const option = document.createElement('option');
                    option.value = group.name;
                    option.textContent = group.name;
                    dropdown.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

/**
 * Load all equipment types for the filter dropdown
 */
function loadEquipment() {
    fetch('api/exercise_library.php?action=equipment')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(result => {
            if (result.success) {
                const equipment = result.data;
                const dropdown = document.getElementById('equipmentFilter');
                
                equipment.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.name;
                    option.textContent = item.name;
                    dropdown.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

/**
 * Search exercises based on the current filter values
 */
function searchExercises() {
    const searchTerm = document.getElementById('searchTerm').value;
    const muscleGroup = document.getElementById('muscleGroupFilter').value;
    const equipment = document.getElementById('equipmentFilter').value;
    const sortBy = document.getElementById('sortBy').value;
    
    // Show loading state
    document.getElementById('exerciseResults').innerHTML = `
        <div class="d-flex justify-content-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;
    
    // Build URL with query parameters
    let url = 'api/exercise_library.php?action=search';
    if (searchTerm) url += '&search=' + encodeURIComponent(searchTerm);
    if (muscleGroup) url += '&muscle_group=' + encodeURIComponent(muscleGroup);
    if (equipment) url += '&equipment=' + encodeURIComponent(equipment);
    url += '&order_by=' + sortBy;
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(result => {
            if (result.success) {
                const exercises = result.data;
                
                // Update result count
                document.getElementById('resultCount').textContent = exercises.length;
                
                if (exercises.length > 0) {
                    document.getElementById('noResultsMessage').style.display = 'none';
                    renderExerciseResults(exercises);
                } else {
                    document.getElementById('exerciseResults').innerHTML = '';
                    document.getElementById('noResultsMessage').style.display = 'block';
                }
            } else {
                document.getElementById('exerciseResults').innerHTML = 
                    '<div class="alert alert-danger">Failed to load exercises</div>';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('exerciseResults').innerHTML = 
                '<div class="alert alert-danger">Error loading exercises</div>';
        });
}

/**
 * Load user's favorite/most used exercises
 */
function loadFavoriteExercises() {
    // Show loading state
    document.getElementById('exerciseResults').innerHTML = `
        <div class="d-flex justify-content-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;
    
    fetch('api/exercise_library.php?action=favorites')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(result => {
            if (result.success) {
                const exercises = result.data;
                
                // Update result count
                document.getElementById('resultCount').textContent = exercises.length;
                
                if (exercises.length > 0) {
                    document.getElementById('noResultsMessage').style.display = 'none';
                    renderExerciseResults(exercises, true);
                } else {
                    document.getElementById('exerciseResults').innerHTML = 
                        '<div class="alert alert-info">You haven\'t used any exercises yet. Start tracking to build your favorites!</div>';
                    document.getElementById('noResultsMessage').style.display = 'none';
                }
            } else {
                document.getElementById('exerciseResults').innerHTML = 
                    '<div class="alert alert-danger">Failed to load favorite exercises</div>';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('exerciseResults').innerHTML = 
                '<div class="alert alert-danger">Error loading favorite exercises</div>';
        });
}

/**
 * Render exercise results to the page
 * @param {Array} exercises Array of exercise objects
 * @param {boolean} showUsage Whether to show usage count
 */
function renderExerciseResults(exercises, showUsage = false) {
    const resultsContainer = document.getElementById('exerciseResults');
    
    // Create rows of exercise cards
    let html = '<div class="row">';
    
    exercises.forEach(exercise => {
        const usageHtml = exercise.usage_count 
            ? `<span class="badge bg-success">Used ${exercise.usage_count} times</span>` 
            : '';
        
        html += `
        <div class="col-md-4 col-sm-6 mb-4">
            <div class="card h-100 exercise-card" 
                data-id="${exercise.id}" 
                data-name="${exercise.exercise_name}" 
                data-muscle-group="${exercise.muscle_group}" 
                data-equipment="${exercise.equipment}">
                <div class="card-body">
                    <h5 class="card-title">${exercise.exercise_name}</h5>
                    <p class="card-text mb-2">
                        <span class="badge bg-primary">${exercise.muscle_group}</span>
                        <span class="badge bg-secondary">${exercise.equipment}</span>
                    </p>
                    ${showUsage ? usageHtml : ''}
                </div>
                <div class="card-footer bg-transparent">
                    <button class="btn btn-sm btn-outline-primary w-100">View Details</button>
                </div>
            </div>
        </div>
        `;
    });
    
    html += '</div>';
    resultsContainer.innerHTML = html;
}

/**
 * Show exercise detail in modal
 * @param {string} exerciseId Exercise ID
 * @param {string} exerciseName Exercise name
 * @param {string} muscleGroup Muscle group
 * @param {string} equipment Equipment
 */
function showExerciseDetail(exerciseId, exerciseName, muscleGroup, equipment) {
    // Set modal title
    document.getElementById('exerciseModalTitle').textContent = exerciseName;
    
    // Set modal body content
    const modalBody = document.getElementById('exerciseModalBody');
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6>Muscle Group</h6>
                <p>${muscleGroup}</p>
            </div>
            <div class="col-md-6">
                <h6>Equipment</h6>
                <p>${equipment}</p>
            </div>
        </div>
        
        <hr>
        
        <div class="row">
            <div class="col-12">
                <h6>Personal Records</h6>
                <div id="exercisePRs">
                    <p class="text-muted">No personal records yet for this exercise</p>
                </div>
            </div>
        </div>
    `;
    
    // Set the exercise ID for the Add to Workout button
    document.getElementById('addToWorkoutBtn').dataset.exerciseId = exerciseId;
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('exerciseDetailModal'));
    modal.show();
}

/**
 * Track when a user selects an exercise to use
 * @param {string} exerciseId Exercise ID
 */
function trackExerciseUsage(exerciseId) {
    fetch('api/exercise_library.php?action=track_usage', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ exercise_id: exerciseId })
    })
    .then(response => response.json())
    .then(result => {
        console.log('Exercise usage tracked:', result);
    })
    .catch(error => {
        console.error('Error tracking exercise usage:', error);
    });
}