/**
 * Dashboard Settings JavaScript
 * Handles functionality for dashboard customization with fixed drag and drop
 */

document.addEventListener('DOMContentLoaded', function() {
    // Load current widgets
    loadCurrentWidgets();
    
    // Set up sortable container for drag-and-drop
    const widgetContainer = document.getElementById('widgetContainer');
    if (widgetContainer) {
        // Wait for widgets to be rendered
        setTimeout(() => {
            // Find the actual row container that contains the widgets
            const widgetRow = document.getElementById('widgetRow');
            if (widgetRow) {
                const sortable = new Sortable(widgetRow, {
                    animation: 150,
                    ghostClass: 'widget-ghost',
                    handle: '.widget-handle',
                    draggable: '.dashboard-widget',
                    forceFallback: true,  // Force the fallback solution to prevent text selection
                    fallbackClass: 'sortable-fallback',
                    filter: '.widget-actions',
                    preventOnFilter: true,
                    onStart: function(evt) {
                        document.body.classList.add('widget-dragging');
                        evt.item.classList.add('is-dragging');
                    },
                    onEnd: function(evt) {
                        document.body.classList.remove('widget-dragging');
                        evt.item.classList.remove('is-dragging');
                        updateWidgetPositions();
                    }
                });
                console.log('Sortable initialized on widget row');
            } else {
                console.error('Widget row not found');
            }
        }, 500); // Short delay to ensure DOM is ready
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

    // Add tab functionality if not using Bootstrap's native tab handling
    document.querySelectorAll('#settingsTabs .nav-link, #widget-categories .nav-link').forEach(tabLink => {
        tabLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get the target tab content
            const targetId = this.getAttribute('data-bs-target');
            if (!targetId) return;
            
            const targetContent = document.querySelector(targetId);
            if (!targetContent) return;
            
            // Deactivate all tabs in this group
            const tabList = this.closest('.nav');
            tabList.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                link.setAttribute('aria-selected', 'false');
            });
            
            // Hide all tab content in this group
            const tabContents = document.querySelectorAll('.tab-pane');
            tabContents.forEach(content => {
                if (content.getAttribute('aria-labelledby') && 
                    document.querySelector('#' + content.getAttribute('aria-labelledby'))?.closest('.nav') === tabList) {
                    content.classList.remove('show', 'active');
                }
            });
            
            // Activate the selected tab
            this.classList.add('active');
            this.setAttribute('aria-selected', 'true');
            
            // Show the target content
            targetContent.classList.add('show', 'active');
        });
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
        <div class="dashboard-widget ${sizeClass} mb-4" data-id="${widget.id}" data-position="${widget.widget_position}" data-type="${widget.widget_type}" data-size="${widget.widget_size}">
            <div class="card h-100 shadow-sm">
                <div class="card-header d-flex justify-content-between align-items-center widget-handle" style="cursor: grab;">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-grip-vertical me-2 text-muted"></i>
                        <h5 class="mb-0">${widget.widget_title}</h5>
                    </div>
                    <div class="widget-actions">
                        <button type="button" class="btn btn-sm btn-outline-secondary resize-widget-btn me-2" title="Toggle widget size">
                            <i class="fas ${widget.widget_size === 'large' ? 'fa-compress-alt' : 'fa-expand-alt'}"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-danger remove-widget-btn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body widget-preview">
                    <div class="text-center py-5">
                        <i class="fas ${getWidgetIcon(widget.widget_type)} fa-3x text-muted mb-3"></i>
                        <p class="text-muted">${getWidgetDescription(widget.widget_type)}</p>
                        <span class="badge ${widget.widget_size === 'large' ? 'bg-info' : 'bg-secondary'} mt-2 widget-size-badge">
                            ${widget.widget_size === 'large' ? 'Large (Full Width)' : 'Medium (Half Width)'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Add event listeners for the resize buttons after rendering
    document.querySelectorAll('.resize-widget-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const widgetElement = this.closest('.dashboard-widget');
            const widgetId = widgetElement.dataset.id;
            const currentSize = widgetElement.dataset.size;
            const newSize = currentSize === 'large' ? 'medium' : 'large';
            resizeWidget(widgetId, newSize);
        });
    });
}

/**
 * Get appropriate icon for a widget type
 */
function getWidgetIcon(widgetType) {
    const icons = {
        'sleep_stats': 'fa-bed',
        'energy_stats': 'fa-bolt',
        'nutrition_stats': 'fa-apple-alt',
        'training_stats': 'fa-dumbbell',
        'weight_chart': 'fa-weight',
        'sleep_chart': 'fa-bed',
        'energy_chart': 'fa-chart-line',
        'nutrition_chart': 'fa-utensils',
        'recent_daily': 'fa-calendar-day',
        'recent_training': 'fa-list',
        'personal_records': 'fa-trophy',
        'activity_heatmap': 'fa-calendar-alt',
        'recent_insights': 'fa-lightbulb'
    };
    
    return icons[widgetType] || 'fa-chart-bar';
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
            
            // Switch to the Layout tab to show the newly added widget
            if (document.querySelector('#layout-tab')) {
                document.querySelector('#layout-tab').click();
            }
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
 * Resize a widget (toggle between medium and large)
 */
function resizeWidget(widgetId, newSize) {
    fetch('api/dashboard.php?action=update_widget', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            id: widgetId,
            widget_size: newSize
        })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            // Success - reload widgets to reflect new size
            showAlert('widgetAlert', 'success', `Widget ${newSize === 'large' ? 'expanded' : 'reduced'} successfully`);
            loadCurrentWidgets();
        } else {
            showAlert('widgetAlert', 'danger', 'Failed to resize widget: ' + result.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('widgetAlert', 'danger', 'Error resizing widget. Please try again.');
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

// Add CSS for drag and drop visual cues
document.head.insertAdjacentHTML('beforeend', `
<style>
    /* Drag and drop styling */
    .widget-handle {
        cursor: grab;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
    }
    
    .widget-handle:active {
        cursor: grabbing;
    }
    
    .widget-ghost {
        opacity: 0.5;
        background-color: #f8f9fa;
        border: 2px dashed #0d6efd !important;
    }
    
    .is-dragging {
        z-index: 9999;
    }
    
    .is-dragging .card {
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
    }
    
    /* Ensure widget content is visible during drag */
    .sortable-drag .card-body {
        opacity: 0.7;
    }
    
    /* Fallback styling for dragging */
    .sortable-fallback {
        opacity: 0.8;
        transform: rotate(2deg);
    }
    
    /* Visual handle indicator */
    .widget-handle i.fa-grip-vertical {
        opacity: 0.5;
        transition: opacity 0.2s;
    }
    
    .dashboard-widget:hover .widget-handle i.fa-grip-vertical {
        opacity: 1;
    }
    
    /* Prevent text selection during drag */
    .widget-dragging {
        cursor: grabbing !important;
    }
    
    .widget-dragging * {
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
    }
</style>
`);