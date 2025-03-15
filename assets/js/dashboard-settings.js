/**
 * Dashboard Settings JavaScript
 * Handles functionality for dashboard customization
 */

document.addEventListener('DOMContentLoaded', function() {
    // Load current widgets
    loadCurrentWidgets();
    
    // Set up sortable container for drag-and-drop
    const widgetContainer = document.getElementById('widgetContainer');
    if (widgetContainer) {
        const sortable = new Sortable(widgetContainer, {
            animation: 150,
            ghostClass: 'widget-ghost',
            handle: '.widget-handle',
            onEnd: function(evt) {
                updateWidgetPositions();
            }
        });
    }
    
    // Event listener for the preferences form
    document.getElementById('preferencesForm').addEventListener('submit', function(e) {
        e.preventDefault();
        savePreferences();
    });
    
    // Event listener for adding widgets
    document.querySelectorAll('.add-widget-btn').forEach(button => {
        button.addEventListener('click', function() {
            const widgetType = this.getAttribute('data-type');
            const widgetTitle = this.getAttribute('data-title');
            const widgetSize = this.getAttribute('data-size');
            
            addWidget(widgetType, widgetTitle, widgetSize);
        });
    });
    
    // Event listener for resetting layout
    document.getElementById('resetLayoutBtn').addEventListener('click', function() {
        if (confirm('Are you sure you want to reset your dashboard to default settings? This will remove all custom widgets and layouts.')) {
            resetDashboard();
        }
    });
    
    // Event delegation for widget removal
    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('remove-widget-btn')) {
            const widgetId = e.target.closest('.dashboard-widget').dataset.id;
            removeWidget(widgetId);
        }
    });
});

/**
 * Load current widgets from the server
 */
function loadCurrentWidgets() {
    fetch('api/dashboard.php?action=get_widgets')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(result => {
            if (result.success) {
                renderWidgets(result.data);
            } else {
                showAlert('widgetAlert', 'danger', 'Failed to load widgets: ' + result.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('widgetAlert', 'danger', 'Error loading widgets. Please try again later.');
        });
}

/**
 * Render widgets in the preview container
 */
function renderWidgets(widgets) {
    const container = document.getElementById('widgetContainer');
    container.innerHTML = '';
    
    if (widgets.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                You don't have any widgets configured yet. Add some from the options above.
            </div>
        `;
        return;
    }
    
    // Create a row for the widgets
    let html = '<div class="row" id="widgetRow">';
    
    widgets.forEach(widget => {
        const sizeClass = widget.widget_size === 'large' ? 'col-md-12' : 'col-md-6 col-xl-3';
        
        html += `
        <div class="dashboard-widget ${sizeClass} mb-4" data-id="${widget.id}" data-position="${widget.widget_position}" data-type="${widget.widget_type}">
            <div class="card h-100 shadow-sm">
                <div class="card-header d-flex justify-content-between align-items-center widget-handle" style="cursor: grab;">
                    <h5 class="mb-0">${widget.widget_title}</h5>
                    <div class="widget-actions">
                        <button type="button" class="btn btn-sm btn-outline-danger remove-widget-btn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body widget-preview">
                    <div class="text-center py-5">
                        <i class="fas fa-chart-bar fa-3x text-muted mb-3"></i>
                        <p class="text-muted">${getWidgetDescription(widget.widget_type)}</p>
                    </div>
                </div>
            </div>
        </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

/**
 * Get description text for a widget type
 */
function getWidgetDescription(widgetType) {
    const descriptions = {
        'sleep_stats': 'Displays your average sleep duration and quality.',
        'energy_stats': 'Shows your average energy, stress, and motivation levels.',
        'nutrition_stats': 'Displays your average calories and macronutrients.',
        'training_stats': 'Shows your training session count and volume.',
        'weight_chart': 'Graph of your weight measurements over time.',
        'sleep_chart': 'Graph of your sleep duration over time.',
        'energy_chart': 'Graph of your energy, stress, and motivation over time.',
        'nutrition_chart': 'Graph of your caloric and macronutrient intake over time.',
        'recent_daily': 'Table of your most recent daily metrics entries.',
        'recent_training': 'Table of your most recent training sessions.',
        'personal_records': 'Shows your most recent personal records in training.',
        'activity_heatmap': 'Calendar heatmap showing your activity intensity over time.',
        'recent_insights': 'Shows insights from correlation analysis.'
    };
    
    return descriptions[widgetType] || 'Widget preview';
}

/**
 * Update widget positions after drag-and-drop
 */
function updateWidgetPositions() {
    const widgets = document.querySelectorAll('.dashboard-widget');
    const positions = [];
    
    widgets.forEach((widget, index) => {
        const widgetId = widget.dataset.id;
        positions.push({
            id: widgetId,
            position: index + 1
        });
        
        // Update the position data attribute
        widget.dataset.position = index + 1;
    });
    
    // Send the updated positions to the server
    fetch('api/dashboard.php?action=update_positions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ positions: positions })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            showAlert('widgetAlert', 'success', 'Widget positions updated');
        } else {
            showAlert('widgetAlert', 'danger', 'Failed to update widget positions: ' + result.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('widgetAlert', 'danger', 'Error updating widget positions. Please try again.');
    });
}

/**
 * Add a new widget to the dashboard
 */
function addWidget(widgetType, widgetTitle, widgetSize) {
    fetch('api/dashboard.php?action=add_widget', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            widget_type: widgetType,
            widget_title: widgetTitle,
            widget_size: widgetSize
        })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            showAlert('widgetAlert', 'success', 'Widget added successfully');
            loadCurrentWidgets(); // Refresh the widget list
        } else {
            showAlert('widgetAlert', 'danger', 'Failed to add widget: ' + result.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('widgetAlert', 'danger', 'Error adding widget. Please try again.');
    });
}

/**
 * Remove a widget from the dashboard
 */
function removeWidget(widgetId) {
    fetch('api/dashboard.php?action=remove_widget', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: widgetId })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            showAlert('widgetAlert', 'success', 'Widget removed successfully');
            
            // Remove the widget from the DOM
            const widget = document.querySelector(`.dashboard-widget[data-id="${widgetId}"]`);
            if (widget) {
                widget.remove();
                
                // Check if there are any widgets left
                const remainingWidgets = document.querySelectorAll('.dashboard-widget');
                if (remainingWidgets.length === 0) {
                    document.getElementById('widgetContainer').innerHTML = `
                        <div class="alert alert-info">
                            You don't have any widgets configured yet. Add some from the options above.
                        </div>
                    `;
                } else {
                    // Update positions of remaining widgets
                    updateWidgetPositions();
                }
            }
        } else {
            showAlert('widgetAlert', 'danger', 'Failed to remove widget: ' + result.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('widgetAlert', 'danger', 'Error removing widget. Please try again.');
    });
}

/**
 * Save dashboard preferences
 */
function savePreferences() {
    const defaultView = document.getElementById('defaultView').value;
    
    fetch('api/dashboard.php?action=save_preferences', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ default_view: defaultView })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            showAlert('preferencesAlert', 'success', 'Preferences saved successfully');
        } else {
            showAlert('preferencesAlert', 'danger', 'Failed to save preferences: ' + result.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('preferencesAlert', 'danger', 'Error saving preferences. Please try again.');
    });
}

/**
 * Reset dashboard to default settings
 */
function resetDashboard() {
    fetch('api/dashboard.php?action=reset_dashboard', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            showAlert('widgetAlert', 'success', 'Dashboard reset to default settings');
            
            // Reload the page to show default settings
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            showAlert('widgetAlert', 'danger', 'Failed to reset dashboard: ' + result.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('widgetAlert', 'danger', 'Error resetting dashboard. Please try again.');
    });
}

/**
 * Show an alert message
 */
function showAlert(elementId, type, message) {
    const alertElement = document.getElementById(elementId);
    alertElement.className = `alert alert-${type}`;
    alertElement.textContent = message;
    alertElement.style.display = 'block';
    
    // Auto-hide the alert after 3 seconds
    setTimeout(() => {
        alertElement.style.display = 'none';
    }, 3000);
}