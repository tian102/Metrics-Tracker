<?php
require_once 'includes/header.php';
require_once 'includes/functions.php';

// Redirect if not logged in
requireLogin();

// Get current user data
$user = getCurrentUser();

// Get user's dashboard preferences
$db = new Database();
$db->query("SELECT * FROM dashboard_preferences WHERE user_id = :user_id");
$db->bind(':user_id', $_SESSION['user_id']);
$preferences = $db->single();

// If no preferences exist, create default ones
if (!$preferences) {
    $db->query("INSERT INTO dashboard_preferences (user_id, default_view) VALUES (:user_id, 'daily')");
    $db->bind(':user_id', $_SESSION['user_id']);
    $db->execute();
    
    $preferences = [
        'id' => $db->lastInsertId(),
        'user_id' => $_SESSION['user_id'],
        'default_view' => 'daily'
    ];
}

// Get user's widgets
$db->query("SELECT * FROM dashboard_widgets WHERE user_id = :user_id ORDER BY widget_position");
$db->bind(':user_id', $_SESSION['user_id']);
$widgets = $db->resultSet();

// If no widgets exist, create default ones
if (empty($widgets)) {
    $defaultWidgets = [
        ['widget_type' => 'sleep_stats', 'widget_title' => 'Sleep', 'widget_position' => 1, 'widget_size' => 'medium'],
        ['widget_type' => 'energy_stats', 'widget_title' => 'Energy & Motivation', 'widget_position' => 2, 'widget_size' => 'medium'],
        ['widget_type' => 'nutrition_stats', 'widget_title' => 'Nutrition', 'widget_position' => 3, 'widget_size' => 'medium'],
        ['widget_type' => 'training_stats', 'widget_title' => 'Training', 'widget_position' => 4, 'widget_size' => 'medium'],
        ['widget_type' => 'weight_chart', 'widget_title' => 'Weight Progress', 'widget_position' => 5, 'widget_size' => 'large'],
        ['widget_type' => 'recent_daily', 'widget_title' => 'Recent Daily Metrics', 'widget_position' => 6, 'widget_size' => 'large'],
        ['widget_type' => 'recent_training', 'widget_title' => 'Recent Training Sessions', 'widget_position' => 7, 'widget_size' => 'large']
    ];
    
    foreach ($defaultWidgets as $widget) {
        $db->query("INSERT INTO dashboard_widgets 
                   (user_id, widget_type, widget_title, widget_position, widget_size) 
                   VALUES 
                   (:user_id, :widget_type, :widget_title, :widget_position, :widget_size)");
        $db->bind(':user_id', $_SESSION['user_id']);
        $db->bind(':widget_type', $widget['widget_type']);
        $db->bind(':widget_title', $widget['widget_title']);
        $db->bind(':widget_position', $widget['widget_position']);
        $db->bind(':widget_size', $widget['widget_size']);
        $db->execute();
    }
    
    // Refresh widgets list
    $db->query("SELECT * FROM dashboard_widgets WHERE user_id = :user_id ORDER BY widget_position");
    $db->bind(':user_id', $_SESSION['user_id']);
    $widgets = $db->resultSet();
}

$pageTitle = 'Dashboard Settings';
?>

<!-- Page Header -->
<div class="container-fluid py-4 bg-light mb-4 shadow-sm">
    <div class="container">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
            <h1 class="h2 mb-3 mb-md-0">Dashboard Settings</h1>
            <div>
                <a href="index.php" class="btn btn-outline-primary">
                    <i class="fas fa-arrow-left me-2"></i>Back to Dashboard
                </a>
            </div>
        </div>
        <p class="text-muted mb-0 mt-2">Customize your dashboard layout, widgets, and display preferences</p>
    </div>
</div>

<div class="container mb-5">
    <!-- Tabs Navigation -->
    <ul class="nav nav-tabs mb-4" id="settingsTabs" role="tablist">
        <li class="nav-item" role="presentation">
            <button class="nav-link active" id="layout-tab" data-bs-toggle="tab" data-bs-target="#layout" type="button" role="tab" aria-selected="true">
                <i class="fas fa-columns me-2"></i>Layout
            </button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" id="widgets-tab" data-bs-toggle="tab" data-bs-target="#widgets" type="button" role="tab" aria-selected="false">
                <i class="fas fa-th-large me-2"></i>Add Widgets
            </button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link" id="preferences-tab" data-bs-toggle="tab" data-bs-target="#preferences" type="button" role="tab" aria-selected="false">
                <i class="fas fa-cog me-2"></i>Preferences
            </button>
        </li>
    </ul>
    
    <!-- Tab Content -->
    <div class="tab-content" id="settingsTabsContent">
        <!-- Layout Tab -->
        <div class="tab-pane fade show active" id="layout" role="tabpanel" aria-labelledby="layout-tab">
            <div class="card shadow-sm">
                <div class="card-header bg-white">
                    <div class="d-flex justify-content-between align-items-center">
                        <h3 class="h5 mb-0">Current Dashboard Layout</h3>
                        <button class="btn btn-sm btn-outline-secondary" id="resetLayoutBtn">
                            <i class="fas fa-undo me-1"></i> Reset to Default
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>Drag and drop widgets to reorder them. Use the remove button to delete widgets from your dashboard.
                    </div>
                    
                    <?php if (empty($widgets)): ?>
                        <div class="alert alert-warning text-center py-4">
                            <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                            <p class="mb-0">You don't have any widgets configured yet. Add some from the "Add Widgets" tab.</p>
                        </div>
                    <?php else: ?>
                        <div class="dashboard-preview" id="widgetContainer">
                            <!-- This will be populated by JavaScript with the draggable widgets -->
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
        
        <!-- Widgets Tab -->
        <div class="tab-pane fade" id="widgets" role="tabpanel" aria-labelledby="widgets-tab">
            <div class="card shadow-sm">
                <div class="card-header bg-white">
                    <h3 class="h5 mb-0">Available Widgets</h3>
                </div>
                <div class="card-body">
                    <!-- Organize widgets by category -->
                    <ul class="nav nav-pills mb-4" id="widget-categories" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="nav-link active" id="metrics-tab" data-bs-toggle="pill" data-bs-target="#metrics-widgets" type="button" role="tab" aria-selected="true">
                                Metric Stats
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="charts-tab" data-bs-toggle="pill" data-bs-target="#chart-widgets" type="button" role="tab" aria-selected="false">
                                Charts
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="tables-tab" data-bs-toggle="pill" data-bs-target="#table-widgets" type="button" role="tab" aria-selected="false">
                                Tables & Lists
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="advanced-tab" data-bs-toggle="pill" data-bs-target="#advanced-widgets" type="button" role="tab" aria-selected="false">
                                Advanced
                            </button>
                        </li>
                    </ul>
                    
                    <div class="tab-content" id="widget-categoriesContent">
                        <!-- Metric Stats Widgets -->
                        <div class="tab-pane fade show active" id="metrics-widgets" role="tabpanel" aria-labelledby="metrics-tab">
                            <div class="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4">
                                <div class="col">
                                    <div class="card h-100 border-0 shadow-sm">
                                        <div class="card-body">
                                            <div class="d-flex align-items-center mb-3">
                                                <div class="bg-primary bg-opacity-10 p-3 rounded-3 me-3">
                                                    <i class="fas fa-bed text-primary fa-fw fa-lg"></i>
                                                </div>
                                                <h5 class="card-title mb-0">Sleep Stats</h5>
                                            </div>
                                            <p class="card-text text-muted">Average sleep duration and quality metrics.</p>
                                        </div>
                                        <div class="card-footer bg-transparent border-0 pt-0">
                                            <button class="btn btn-sm btn-outline-primary w-100 add-widget-btn" 
                                                    data-type="sleep_stats" 
                                                    data-title="Sleep" 
                                                    data-size="medium">
                                                <i class="fas fa-plus me-1"></i> Add to Dashboard
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col">
                                    <div class="card h-100 border-0 shadow-sm">
                                        <div class="card-body">
                                            <div class="d-flex align-items-center mb-3">
                                                <div class="bg-warning bg-opacity-10 p-3 rounded-3 me-3">
                                                    <i class="fas fa-bolt text-warning fa-fw fa-lg"></i>
                                                </div>
                                                <h5 class="card-title mb-0">Energy & Motivation</h5>
                                            </div>
                                            <p class="card-text text-muted">Average energy, stress, and motivation levels.</p>
                                        </div>
                                        <div class="card-footer bg-transparent border-0 pt-0">
                                            <button class="btn btn-sm btn-outline-primary w-100 add-widget-btn" 
                                                    data-type="energy_stats" 
                                                    data-title="Energy & Motivation" 
                                                    data-size="medium">
                                                <i class="fas fa-plus me-1"></i> Add to Dashboard
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col">
                                    <div class="card h-100 border-0 shadow-sm">
                                        <div class="card-body">
                                            <div class="d-flex align-items-center mb-3">
                                                <div class="bg-success bg-opacity-10 p-3 rounded-3 me-3">
                                                    <i class="fas fa-apple-alt text-success fa-fw fa-lg"></i>
                                                </div>
                                                <h5 class="card-title mb-0">Nutrition Stats</h5>
                                            </div>
                                            <p class="card-text text-muted">Average calories and macronutrient breakdown.</p>
                                        </div>
                                        <div class="card-footer bg-transparent border-0 pt-0">
                                            <button class="btn btn-sm btn-outline-primary w-100 add-widget-btn" 
                                                    data-type="nutrition_stats" 
                                                    data-title="Nutrition" 
                                                    data-size="medium">
                                                <i class="fas fa-plus me-1"></i> Add to Dashboard
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col">
                                    <div class="card h-100 border-0 shadow-sm">
                                        <div class="card-body">
                                            <div class="d-flex align-items-center mb-3">
                                                <div class="bg-danger bg-opacity-10 p-3 rounded-3 me-3">
                                                    <i class="fas fa-dumbbell text-danger fa-fw fa-lg"></i>
                                                </div>
                                                <h5 class="card-title mb-0">Training Stats</h5>
                                            </div>
                                            <p class="card-text text-muted">Training session count and volume metrics.</p>
                                        </div>
                                        <div class="card-footer bg-transparent border-0 pt-0">
                                            <button class="btn btn-sm btn-outline-primary w-100 add-widget-btn" 
                                                    data-type="training_stats" 
                                                    data-title="Training" 
                                                    data-size="medium">
                                                <i class="fas fa-plus me-1"></i> Add to Dashboard
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Chart Widgets -->
                        <div class="tab-pane fade" id="chart-widgets" role="tabpanel" aria-labelledby="charts-tab">
                            <div class="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4">
                                <div class="col">
                                    <div class="card h-100 border-0 shadow-sm">
                                        <div class="card-body">
                                            <div class="d-flex align-items-center mb-3">
                                                <div class="bg-primary bg-opacity-10 p-3 rounded-3 me-3">
                                                    <i class="fas fa-weight text-primary fa-fw fa-lg"></i>
                                                </div>
                                                <h5 class="card-title mb-0">Weight Progress</h5>
                                            </div>
                                            <p class="card-text text-muted">Line chart tracking weight over time.</p>
                                        </div>
                                        <div class="card-footer bg-transparent border-0 pt-0">
                                            <button class="btn btn-sm btn-outline-primary w-100 add-widget-btn" 
                                                    data-type="weight_chart" 
                                                    data-title="Weight Progress" 
                                                    data-size="large">
                                                <i class="fas fa-plus me-1"></i> Add to Dashboard
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col">
                                    <div class="card h-100 border-0 shadow-sm">
                                        <div class="card-body">
                                            <div class="d-flex align-items-center mb-3">
                                                <div class="bg-info bg-opacity-10 p-3 rounded-3 me-3">
                                                    <i class="fas fa-bed text-info fa-fw fa-lg"></i>
                                                </div>
                                                <h5 class="card-title mb-0">Sleep Duration</h5>
                                            </div>
                                            <p class="card-text text-muted">Chart showing sleep duration trends over time.</p>
                                        </div>
                                        <div class="card-footer bg-transparent border-0 pt-0">
                                            <button class="btn btn-sm btn-outline-primary w-100 add-widget-btn" 
                                                    data-type="sleep_chart" 
                                                    data-title="Sleep Duration" 
                                                    data-size="large">
                                                <i class="fas fa-plus me-1"></i> Add to Dashboard
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col">
                                    <div class="card h-100 border-0 shadow-sm">
                                        <div class="card-body">
                                            <div class="d-flex align-items-center mb-3">
                                                <div class="bg-warning bg-opacity-10 p-3 rounded-3 me-3">
                                                    <i class="fas fa-bolt text-warning fa-fw fa-lg"></i>
                                                </div>
                                                <h5 class="card-title mb-0">Energy Levels</h5>
                                            </div>
                                            <p class="card-text text-muted">Chart tracking energy, stress, and motivation levels.</p>
                                        </div>
                                        <div class="card-footer bg-transparent border-0 pt-0">
                                            <button class="btn btn-sm btn-outline-primary w-100 add-widget-btn" 
                                                    data-type="energy_chart" 
                                                    data-title="Energy Levels" 
                                                    data-size="large">
                                                <i class="fas fa-plus me-1"></i> Add to Dashboard
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col">
                                    <div class="card h-100 border-0 shadow-sm">
                                        <div class="card-body">
                                            <div class="d-flex align-items-center mb-3">
                                                <div class="bg-success bg-opacity-10 p-3 rounded-3 me-3">
                                                    <i class="fas fa-utensils text-success fa-fw fa-lg"></i>
                                                </div>
                                                <h5 class="card-title mb-0">Nutrition Chart</h5>
                                            </div>
                                            <p class="card-text text-muted">Visual breakdown of caloric and macronutrient intake.</p>
                                        </div>
                                        <div class="card-footer bg-transparent border-0 pt-0">
                                            <button class="btn btn-sm btn-outline-primary w-100 add-widget-btn" 
                                                    data-type="nutrition_chart" 
                                                    data-title="Nutrition Intake" 
                                                    data-size="large">
                                                <i class="fas fa-plus me-1"></i> Add to Dashboard
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Table Widgets -->
                        <div class="tab-pane fade" id="table-widgets" role="tabpanel" aria-labelledby="tables-tab">
                            <div class="row row-cols-1 row-cols-md-2 g-4">
                                <div class="col">
                                    <div class="card h-100 border-0 shadow-sm">
                                        <div class="card-body">
                                            <div class="d-flex align-items-center mb-3">
                                                <div class="bg-info bg-opacity-10 p-3 rounded-3 me-3">
                                                    <i class="fas fa-calendar-day text-info fa-fw fa-lg"></i>
                                                </div>
                                                <h5 class="card-title mb-0">Recent Daily Metrics</h5>
                                            </div>
                                            <p class="card-text text-muted">Table showing your most recent daily metric entries.</p>
                                        </div>
                                        <div class="card-footer bg-transparent border-0 pt-0">
                                            <button class="btn btn-sm btn-outline-primary w-100 add-widget-btn" 
                                                    data-type="recent_daily" 
                                                    data-title="Recent Daily Metrics" 
                                                    data-size="large">
                                                <i class="fas fa-plus me-1"></i> Add to Dashboard
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col">
                                    <div class="card h-100 border-0 shadow-sm">
                                        <div class="card-body">
                                            <div class="d-flex align-items-center mb-3">
                                                <div class="bg-danger bg-opacity-10 p-3 rounded-3 me-3">
                                                    <i class="fas fa-dumbbell text-danger fa-fw fa-lg"></i>
                                                </div>
                                                <h5 class="card-title mb-0">Recent Training</h5>
                                            </div>
                                            <p class="card-text text-muted">Table of your most recent training sessions.</p>
                                        </div>
                                        <div class="card-footer bg-transparent border-0 pt-0">
                                            <button class="btn btn-sm btn-outline-primary w-100 add-widget-btn" 
                                                    data-type="recent_training" 
                                                    data-title="Recent Training Sessions" 
                                                    data-size="large">
                                                <i class="fas fa-plus me-1"></i> Add to Dashboard
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col">
                                    <div class="card h-100 border-0 shadow-sm">
                                        <div class="card-body">
                                            <div class="d-flex align-items-center mb-3">
                                                <div class="bg-warning bg-opacity-10 p-3 rounded-3 me-3">
                                                    <i class="fas fa-trophy text-warning fa-fw fa-lg"></i>
                                                </div>
                                                <h5 class="card-title mb-0">Personal Records</h5>
                                            </div>
                                            <p class="card-text text-muted">List of your most recent personal records in training.</p>
                                        </div>
                                        <div class="card-footer bg-transparent border-0 pt-0">
                                            <button class="btn btn-sm btn-outline-primary w-100 add-widget-btn" 
                                                    data-type="personal_records" 
                                                    data-title="Personal Records" 
                                                    data-size="medium">
                                                <i class="fas fa-plus me-1"></i> Add to Dashboard
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Advanced Widgets -->
                        <div class="tab-pane fade" id="advanced-widgets" role="tabpanel" aria-labelledby="advanced-tab">
                            <div class="row row-cols-1 row-cols-md-2 g-4">
                                <div class="col">
                                    <div class="card h-100 border-0 shadow-sm">
                                        <div class="card-body">
                                            <div class="d-flex align-items-center mb-3">
                                                <div class="bg-primary bg-opacity-10 p-3 rounded-3 me-3">
                                                    <i class="fas fa-calendar-alt text-primary fa-fw fa-lg"></i>
                                                </div>
                                                <h5 class="card-title mb-0">Activity Heatmap</h5>
                                            </div>
                                            <p class="card-text text-muted">Calendar heatmap showing activity intensity over time.</p>
                                        </div>
                                        <div class="card-footer bg-transparent border-0 pt-0">
                                            <button class="btn btn-sm btn-outline-primary w-100 add-widget-btn" 
                                                    data-type="activity_heatmap" 
                                                    data-title="Activity Heatmap" 
                                                    data-size="large">
                                                <i class="fas fa-plus me-1"></i> Add to Dashboard
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col">
                                    <div class="card h-100 border-0 shadow-sm">
                                        <div class="card-body">
                                            <div class="d-flex align-items-center mb-3">
                                                <div class="bg-success bg-opacity-10 p-3 rounded-3 me-3">
                                                    <i class="fas fa-lightbulb text-success fa-fw fa-lg"></i>
                                                </div>
                                                <h5 class="card-title mb-0">Recent Insights</h5>
                                            </div>
                                            <p class="card-text text-muted">Automated insights from correlation analysis of your data.</p>
                                        </div>
                                        <div class="card-footer bg-transparent border-0 pt-0">
                                            <button class="btn btn-sm btn-outline-primary w-100 add-widget-btn" 
                                                    data-type="recent_insights" 
                                                    data-title="Recent Insights" 
                                                    data-size="large">
                                                <i class="fas fa-plus me-1"></i> Add to Dashboard
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Preferences Tab -->
        <div class="tab-pane fade" id="preferences" role="tabpanel" aria-labelledby="preferences-tab">
            <div class="row">
                <div class="col-lg-6">
                    <div class="card shadow-sm">
                        <div class="card-header bg-white">
                            <h3 class="h5 mb-0">Display Preferences</h3>
                        </div>
                        <div class="card-body">
                            <form id="preferencesForm">
                                <div class="mb-4">
                                    <label for="defaultView" class="form-label">Default Time Range</label>
                                    <select class="form-select" id="defaultView" name="default_view">
                                        <option value="daily" <?= $preferences['default_view'] === 'daily' ? 'selected' : '' ?>>Daily (last 24 hours)</option>
                                        <option value="weekly" <?= $preferences['default_view'] === 'weekly' ? 'selected' : '' ?>>Weekly (last 7 days)</option>
                                        <option value="monthly" <?= $preferences['default_view'] === 'monthly' ? 'selected' : '' ?>>Monthly (last 30 days)</option>
                                    </select>
                                    <div class="form-text text-muted">Choose the default time period for your dashboard widgets.</div>
                                </div>
                                
                                <button type="submit" class="btn btn-primary">Save Preferences</button>
                            </form>
                            
                            <!-- Alert for preferences form -->
                            <div id="preferencesAlert" class="alert mt-3" style="display: none;"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Alert for widget operations -->
<div id="widgetAlert" class="alert alert-info fixed-bottom m-3" style="display: none;"></div>

<!-- JavaScript -->
<script src="https://cdn.jsdelivr.net/npm/sortablejs@1.14.0/Sortable.min.js"></script>
<script src="assets/js/dashboard-settings.js"></script>

<?php require_once 'includes/footer.php'; ?>