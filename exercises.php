<?php
require_once 'includes/header.php';
require_once 'includes/functions.php';

// Redirect if not logged in
requireLogin();
?>

<div class="row mb-4">
    <div class="col-12">
        <div class="card shadow-sm">
            <div class="card-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
                <h2 class="mb-2 mb-md-0">Exercise Library</h2>
                <div class="d-flex flex-wrap gap-2">
                    <button type="button" id="showFavoritesBtn" class="btn btn-outline-primary">
                        <i class="fas fa-star"></i> My Favorites
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="row">
    <!-- Search & Filter Panel -->
    <div class="col-md-3 mb-4">
        <div class="card shadow-sm">
            <div class="card-header">
                <h5 class="mb-0">Search & Filter</h5>
            </div>
            <div class="card-body">
                <form id="exerciseSearchForm">
                    <div class="mb-3">
                        <label for="searchTerm" class="form-label">Search</label>
                        <input type="text" class="form-control" id="searchTerm" placeholder="Search exercises...">
                    </div>
                    
                    <div class="mb-3">
                        <label for="muscleGroupFilter" class="form-label">Muscle Group</label>
                        <select class="form-select" id="muscleGroupFilter">
                            <option value="">All Muscle Groups</option>
                            <!-- Options will be loaded by JavaScript -->
                        </select>
                    </div>
                    
                    <div class="mb-3">
                        <label for="equipmentFilter" class="form-label">Equipment</label>
                        <select class="form-select" id="equipmentFilter">
                            <option value="">All Equipment</option>
                            <!-- Options will be loaded by JavaScript -->
                        </select>
                    </div>
                    
                    <div class="mb-3">
                        <label for="sortBy" class="form-label">Sort By</label>
                        <select class="form-select" id="sortBy">
                            <option value="exercise_name">Exercise Name</option>
                            <option value="muscle_group">Muscle Group</option>
                            <option value="equipment">Equipment</option>
                            <option value="usage_count">Most Used</option>
                        </select>
                    </div>
                    
                    <button type="submit" class="btn btn-primary w-100">Search</button>
                    <button type="button" id="resetFiltersBtn" class="btn btn-outline-secondary w-100 mt-2">Reset Filters</button>
                </form>
            </div>
        </div>
        
        <!-- Library Stats -->
        <div class="card shadow-sm mt-4">
            <div class="card-header">
                <h5 class="mb-0">Library Stats</h5>
            </div>
            <div class="card-body">
                <div id="libraryStats">
                    <!-- Stats will be loaded by JavaScript -->
                    <div class="d-flex justify-content-center">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Exercise Results -->
    <div class="col-md-9">
        <div class="card shadow-sm">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Results</h5>
                <span id="resultCount" class="badge bg-primary">0</span>
            </div>
            <div class="card-body">
                <div id="exerciseResults">
                    <!-- Results will be loaded by JavaScript -->
                    <div class="d-flex justify-content-center">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>
                </div>
                
                <!-- No Results Message -->
                <div id="noResultsMessage" class="alert alert-info text-center" style="display: none;">
                    No exercises found matching your criteria. Try adjusting your filters.
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Exercise Detail Modal -->
<div class="modal fade" id="exerciseDetailModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="exerciseModalTitle">Exercise Detail</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body" id="exerciseModalBody">
                <!-- Exercise details will be loaded by JavaScript -->
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary" id="addToWorkoutBtn">Add to Workout</button>
            </div>
        </div>
    </div>
</div>

<!-- JavaScript -->
<script src="assets/js/exercise-library.js"></script>

<?php require_once 'includes/footer.php'; ?>