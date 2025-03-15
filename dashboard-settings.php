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

<div class="row mb-4">
    <div class="col-12">
        <div class="card shadow-sm">
            <div class="card-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
                <h2 class="mb-2 mb-md-0">Dashboard Settings</h2>
                <div class="d-flex flex-wrap gap-2">
                    <a href="index.php" class="btn btn-outline-primary">
                        <i class="fas fa-arrow-left"></i> Back to Dashboard
                    </a>
                </div>
            </div>
            <div class="card-body">
                <p>Customize your dashboard by selecting which widgets to display and how they're arranged.</p>
            </div>
        </div>
    </div>
</div>

<div class="row">
    <!-- Dashboard Preferences -->
    <div class="col-md-6 mb-4">
        <div class="card shadow-sm">
            <div class="card-header">
                <h3 class="mb-0">General Preferences</h3>
            </div>
            <div class="card-body">
                <form id="preferencesForm">
                    <div class="mb-3">
                        <label for="defaultView" class="form-label">Default Time Period</label>
                        <select class="form-select" id="defaultView" name="default_view">
                            <option value="daily" <?= $preferences['default_view'] === 'daily' ? 'selected' : '' ?>>Daily</option>
                            <option value="weekly" <?= $preferences['default_view'] === 'weekly' ? 'selected' : '' ?>>Weekly</option>
                            <option value="monthly" <?= $preferences['default_view'] === 'monthly' ? 'selected' : '' ?>>Monthly</option>
                        </select>
                        <div class="form-text">Choose how far back to show metrics by default.</div>
                    </div>
                    
                    <button type="submit" class="btn btn-primary">Save Preferences</button>
                </form>
                
                <!-- Alert for preferences form -->
                <div id="preferencesAlert" class="alert mt-3" style="display: none;"></div>
            </div>
        </div>
    </div>
    
    <!-- Available Widgets -->
    <div class="col-md-6 mb-4">
        <div class="card shadow-sm">
            <div class="card-header">
                <h3 class="mb-0">Add Widgets</h3>
            </div>
            <div class="card-body">
                <div class="available-widgets">
                    <div class="row">
                        <!-- Metric Widgets -->
                        <div class="col-md-6 mb-3">
                            <div class="card h-100">
                                <div class="card-body">
                                    <h5 class="card-title">Sleep Stats</h5>
                                    <p class="card-text">Shows your average sleep duration and quality.</p>
                                    <button class="btn btn-sm btn-outline-primary add-widget-btn" 
                                            data-type="sleep_stats" 
                                            data-title="Sleep" 
                                            data-size="medium">
                                        <i class="fas fa-plus"></i> Add
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-6 mb-3">
                            <div class="card h-100">
                                <div class="card-body">
                                    <h5 class="card-title">Energy & Motivation</h5>
                                    <p class="card-text">Shows your average energy, stress, and motivation levels.</p>
                                    <button class="btn btn-sm btn-outline-primary add-widget-btn" 
                                            data-type="energy_stats" 
                                            data-title="Energy & Motivation" 
                                            data-size="medium">
                                        <i class="fas fa-plus"></i> Add
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-6 mb-3">
                            <div class="card h-100">
                                <div class="card-body">
                                    <h5 class="card-title">Nutrition Stats</h5>
                                    <p class="card-text">Shows your average calories and macronutrients.</p>
                                    <button class="btn btn-sm btn-outline-primary add-widget-btn" 
                                            data-type="nutrition_stats" 
                                            data-title="Nutrition" 
                                            data-size="medium">
                                        <i class="fas fa-plus"></i> Add
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-6 mb-3">
                            <div class="card h-100">
                                <div class="card-body">
                                    <h5 class="card-title">Training Stats</h5>
                                    <p class="card-text">Shows your training session count and volume.</p>
                                    <button class="btn btn-sm btn-outline-primary add-widget-btn" 
                                            data-type="training_stats" 
                                            data-title="Training" 
                                            data-size="medium">
                                        <i class="fas fa-plus"></i> Add
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Chart Widgets -->
                        <div class="col-md-6 mb-3">
                            <div class="card h-100">
                                <div class="card-body">
                                    <h5 class="card-title">Weight Progress Chart</h5>
                                    <p class="card-text">Graph of your weight measurements over time.</p>
                                    <button class="btn btn-sm btn-outline-primary add-widget-btn" 
                                            data-type="weight_chart" 
                                            data-title="Weight Progress" 
                                            data-size="large">
                                        <i class="fas fa-plus"></i> Add
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-6 mb-3">
                            <div class="card h-100">
                                <div class="card-body">
                                    <h5 class="card-title">Sleep Chart</h5>
                                    <p class="card-text">Graph of your sleep duration over time.</p>
                                    <button class="btn btn-sm btn-outline-primary add-widget-btn" 
                                            data-type="sleep_chart" 
                                            data-title="Sleep Duration" 
                                            data-size="large">
                                        <i class="fas fa-plus"></i> Add
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-6 mb-3">
                            <div class="card h-100">
                                <div class="card-body">
                                    <h5 class="card-title">Energy Chart</h5>
                                    <p class="card-text">Graph of your energy, stress, and motivation over time.</p>
                                    <button class="btn btn-sm btn-outline-primary add-widget-btn" 
                                            data-type="energy_chart" 
                                            data-title="Energy Levels" 
                                            data-size="large">
                                        <i class="fas fa-plus"></i> Add
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-6 mb-3">
                            <div class="card h-100">
                                <div class="card-body">
                                    <h5 class="card-title">Nutrition Chart</h5>
                                    <p class="card-text">Graph of your caloric and macronutrient intake over time.</p>
                                    <button class="btn btn-sm btn-outline-primary add-widget-btn" 
                                            data-type="nutrition_chart" 
                                            data-title="Nutrition Intake" 
                                            data-size="large">
                                        <i class="fas fa-plus"></i> Add
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Table Widgets -->
                        <div class="col-md-6 mb-3">
                            <div class="card h-100">
                                <div class="card-body">
                                    <h5 class="card-title">Recent Daily Metrics</h5>
                                    <p class="card-text">Table of your most recent daily metrics entries.</p>
                                    <button class="btn btn-sm btn-outline-primary add-widget-btn" 
                                            data-type="recent_daily" 
                                            data-title="Recent Daily Metrics" 
                                            data-size="large">
                                        <i class="fas fa-plus"></i> Add
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-6 mb-3">
                            <div class="card h-100">
                                <div class="card-body">
                                    <h5 class="card-title">Recent Training Sessions</h5>
                                    <p class="card-text">Table of your most recent training sessions.</p>
                                    <button class="btn btn-sm btn-outline-primary add-widget-btn" 
                                            data-type="recent_training" 
                                            data-title="Recent Training Sessions" 
                                            data-size="large">
                                        <i class="fas fa-plus"></i> Add
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Advanced Widgets -->
                        <div class="col-md-6 mb-3">
                            <div class="card h-100">
                                <div class="card-body">
                                    <h5 class="card-title">Personal Records</h5>
                                    <p class="card-text">Shows your most recent personal records in training.</p>
                                    <button class="btn btn-sm btn-outline-primary add-widget-btn" 
                                            data-type="personal_records" 
                                            data-title="Personal Records" 
                                            data-size="medium">
                                        <i class="fas fa-plus"></i> Add
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-6 mb-3">
                            <div class="card h-100">
                                <div class="card-body">
                                    <h5 class="card-title">Activity Heatmap</h5>
                                    <p class="card-text">Calendar heatmap showing your activity intensity over time.</p>
                                    <button class="btn btn-sm btn-outline-primary add-widget-btn" 
                                            data-type="activity_heatmap" 
                                            data-title="Activity Heatmap" 
                                            data-size="large">
                                        <i class="fas fa-plus"></i> Add
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-6 mb-3">
                            <div class="card h-100">
                                <div class="card-body">
                                    <h5 class="card-title">Recent Insights</h5>
                                    <p class="card-text">Shows insights from correlation analysis.</p>
                                    <button class="btn btn-sm btn-outline-primary add-widget-btn" 
                                            data-type="recent_insights" 
                                            data-title="Recent Insights" 
                                            data-size="large">
                                        <i class="fas fa-plus"></i> Add
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

<!-- Dashboard Preview -->
<div class="row mb-4">
    <div class="col-12">
        <div class="card shadow-sm">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h3 class="mb-0">Current Dashboard Layout</h3>
                <button class="btn btn-outline-secondary" id="resetLayoutBtn">
                    <i class="fas fa-undo"></i> Reset to Default
                </button>
            </div>
            <div class="card-body">
                <p class="text-muted">Drag and drop widgets to reorder them. Click the remove button to remove a widget from your dashboard.</p>
                
                <?php if (empty($widgets)): ?>
                    <div class="alert alert-info">
                        You don't have any widgets configured yet. Add some from the options above.
                    </div>
                <?php else: ?>
                    <div class="dashboard-preview" id="widgetContainer">
                        <!-- This will be populated by JavaScript with the draggable widgets -->
                    </div>
                <?php endif; ?>
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