<?php
require_once 'includes/header.php';
require_once 'includes/functions.php';

// Redirect if not logged in
requireLogin();

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
$db->query("SELECT * FROM dashboard_widgets WHERE user_id = :user_id AND is_visible = 1 ORDER BY widget_position");
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
                   (user_id, widget_type, widget_title, widget_position, widget_size, is_visible) 
                   VALUES 
                   (:user_id, :widget_type, :widget_title, :widget_position, :widget_size, 1)");
        $db->bind(':user_id', $_SESSION['user_id']);
        $db->bind(':widget_type', $widget['widget_type']);
        $db->bind(':widget_title', $widget['widget_title']);
        $db->bind(':widget_position', $widget['widget_position']);
        $db->bind(':widget_size', $widget['widget_size']);
        $db->execute();
    }
    
    // Refresh widgets list
    $db->query("SELECT * FROM dashboard_widgets WHERE user_id = :user_id AND is_visible = 1 ORDER BY widget_position");
    $db->bind(':user_id', $_SESSION['user_id']);
    $widgets = $db->resultSet();
}

// Get unacknowledged personal records count
$db->query("SELECT COUNT(*) AS count FROM personal_records WHERE user_id = :user_id AND is_acknowledged = 0");
$db->bind(':user_id', $_SESSION['user_id']);
$prCount = $db->single()['count'];
?>

<div class="row mb-4">
    <div class="col-12">
        <div class="card shadow-sm">
            <div class="card-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
                <h2 class="mb-2 mb-md-0">Dashboard</h2>
                <div class="d-flex flex-wrap gap-2">
                    <!-- View Selector -->
                    <div class="btn-group">
                        <button type="button" class="btn btn-outline-primary view-selector <?= $preferences['default_view'] === 'daily' ? 'active' : '' ?>" data-view="daily">Daily</button>
                        <button type="button" class="btn btn-outline-primary view-selector <?= $preferences['default_view'] === 'weekly' ? 'active' : '' ?>" data-view="weekly">Weekly</button>
                        <button type="button" class="btn btn-outline-primary view-selector <?= $preferences['default_view'] === 'monthly' ? 'active' : '' ?>" data-view="monthly">Monthly</button>
                    </div>
                    
                    <!-- Action Buttons -->
                    <a href="daily.php" class="btn btn-primary"><i class="fas fa-plus"></i> Add Daily Metrics</a>
                    <a href="training.php" class="btn btn-success"><i class="fas fa-plus"></i> Add Training Session</a>
                    <?php if ($prCount > 0): ?>
                        <a href="#" id="viewPRsBtn" class="btn btn-warning position-relative">
                            <i class="fas fa-trophy"></i> New PRs
                            <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                <?= $prCount ?>
                                <span class="visually-hidden">New Personal Records</span>
                            </span>
                        </a>
                    <?php endif; ?>
                    <a href="dashboard_settings.php" class="btn btn-outline-secondary"><i class="fas fa-cog"></i> Customize</a>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Dashboard Widgets -->
<div id="dashboardWidgets">
    <div class="dashboard-loading text-center py-5">
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Loading your dashboard...</p>
    </div>
</div>

<!-- PR Modal -->
<div class="modal fade" id="prModal" tabindex="-1" aria-labelledby="prModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header bg-warning text-dark">
                <h5 class="modal-title" id="prModalLabel">
                    <i class="fas fa-trophy"></i> New Personal Records
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div id="prList" class="list-group">
                    <!-- PRs will be loaded here -->
                    <div class="text-center py-3">
                        <div class="spinner-border text-warning" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-success" id="acknowledgeAllBtn">
                    <i class="fas fa-check"></i> Acknowledge All
                </button>
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>

<!-- JavaScript -->
<script src="assets/js/dashboard.js"></script>

<!-- Initialize dashboard with user widgets -->
<script>
document.addEventListener('DOMContentLoaded', function() {
    const widgets = <?= json_encode($widgets) ?>;
    const defaultView = "<?= $preferences['default_view'] ?>";
    
    initDashboard(widgets, defaultView);
    
    // If there are PRs, show the PR notification
    <?php if ($prCount > 0): ?>
    document.getElementById('viewPRsBtn').addEventListener('click', function(e) {
        e.preventDefault();
        loadPersonalRecords();
        const prModal = new bootstrap.Modal(document.getElementById('prModal'));
        prModal.show();
    });
    <?php endif; ?>
});
</script>

<?php require_once 'includes/footer.php'; ?>