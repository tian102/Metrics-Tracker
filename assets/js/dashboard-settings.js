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
    if (!container) return;
    
    // Create a row for the widgets
    let html = '<div class="row g-4" id="widgetRow">';
    
    widgets.forEach(widget => {
        html += `
        <div class="dashboard-widget ${getSizeClass(widget.widget_size)}" data-id="${widget.id}" data-position="${widget.widget_position}">
            <div class="card metric-card">
                <div class="card-header d-flex justify-content-between align-items-center widget-handle">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-grip-vertical me-2 text-muted"></i>
                        <h5 class="mb-0">${widget.widget_title}</h5>
                    </div>
                    <div class="widget-actions d-flex align-items-center">
                        <div class="dropdown me-2">
                            <span class="badge bg-secondary dropdown-toggle cursor-pointer" data-bs-toggle="dropdown">
                                ${getSizeLabel(widget.widget_size)}
                            </span>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li><a class="dropdown-item size-option" href="#" data-widget-id="${widget.id}" data-size="medium">Medium (Half Width)</a></li>
                                <li><a class="dropdown-item size-option" href="#" data-widget-id="${widget.id}" data-size="medium-full">Medium (Full Width)</a></li>
                                <li><a class="dropdown-item size-option" href="#" data-widget-id="${widget.id}" data-size="large">Large (Full Width)</a></li>
                            </ul>
                        </div>
                        <button class="btn btn-sm btn-outline-danger remove-widget-btn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="widget-content">
                        <div class="text-center py-4">
                            <i class="fas ${getWidgetIcon(widget.widget_type)} fa-2x text-muted mb-2"></i>
                            <p class="text-muted mb-0">${getWidgetDescription(widget.widget_type)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    });
    
    html += '</div>';
    container.innerHTML = html;

    // Initialize Sortable after rendering widgets
    initializeSortable();

    // Add event listeners for the size options
    document.querySelectorAll('.size-option').forEach(option => {
        option.addEventListener('click', function(e) {
            e.preventDefault();
            const widgetId = this.dataset.widgetId;
            const newSize = this.dataset.size;
            resizeWidget(widgetId, newSize);
        });
    });
}

// Helper function to get the appropriate badge class for widget size
function getSizeBadgeClass(size) {
    switch(size) {
        case 'large':
            return 'bg-info';
        case 'medium-full':
            return 'bg-primary';
        default: // medium (half width)
            return 'bg-secondary';
    }
}

// Helper function to get the label for widget size
function getSizeLabel(size) {
    // Update size label mapping
    const labels = {
        'medium': 'Medium (Half Width)',
        'medium-full': 'Medium (Full Width)',
        'large': 'Large (Full Width)'
    };
    return labels[size] || 'Medium (Half Width)';
}

// Update the resizeWidget function to handle the new size option
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
            let successMessage = 'Widget size updated successfully';
            showAlert('widgetAlert', 'success', successMessage);
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
            loadCurrentWidgets(); // Refresh all widgets
            showAlert('widgetAlert', 'success', 'Widget size updated successfully');
        } else {
            showAlert('widgetAlert', 'danger', 'Failed to update widget size');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('widgetAlert', 'danger', 'Error updating widget size');
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

    /* Style for the size badge dropdown */
    .size-dropdown-toggle {
        cursor: pointer;
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
        transition: background-color 0.2s;
    }

    .size-dropdown-toggle:hover {
        opacity: 0.9;
    }

    /* Dropdown menu styling */
    .size-dropdown-menu {
        min-width: 180px;
    }

    .size-dropdown-menu .dropdown-item {
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
    }

    .size-dropdown-menu .dropdown-item:hover {
        background-color: #f8f9fa;
    }

    /* Active size in dropdown */
    .size-dropdown-menu .dropdown-item.active {
        font-weight: bold;
        background-color: rgba(13, 110, 253, 0.1);
        color: #0d6efd;
    }

    /* Make badge more interactive looking */
    .badge.dropdown-toggle::after {
        display: inline-block;
        margin-left: 0.5em;
        vertical-align: middle;
        content: "";
        border-top: 0.3em solid;
        border-right: 0.3em solid transparent;
        border-bottom: 0;
        border-left: 0.3em solid transparent;
    }

    /* Cursor pointer for all interactive elements */
    .cursor-pointer {
        cursor: pointer;
    }
</style>
`);

// Update getSizeClass function
function getSizeClass(size) {
    // Update size class mapping
    const classes = {
        'medium': 'col-md-6',        // Medium (Half Width)
        'medium-full': 'col-12',     // Medium (Full Width)
        'large': 'col-12'           // Large (Full Width)
    };
    return classes[size] || 'col-md-6';
}

// Update the initializeSortable function
function initializeSortable() {
    const widgetRow = document.getElementById('widgetRow');
    if (!widgetRow) return;

    new Sortable(widgetRow, {
        animation: 150,
        ghostClass: 'widget-ghost',
        handle: '.widget-handle',
        draggable: '.dashboard-widget',
        filter: '.widget-actions, .dropdown-toggle, .size-option', // Prevent drag from these elements
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
}