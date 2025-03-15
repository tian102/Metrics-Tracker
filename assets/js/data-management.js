/**
 * Data Management JavaScript
 * Handles functionality for the data management tab in the profile page
 */

document.addEventListener('DOMContentLoaded', function() {
    // Export Data Button
    const exportDataBtn = document.getElementById('exportDataBtn');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', function() {
            // Show loading state
            exportDataBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exporting...';
            exportDataBtn.disabled = true;
            
            // Create a function to reset the button after some time
            const resetButton = () => {
                setTimeout(() => {
                    exportDataBtn.innerHTML = '<i class="fas fa-download"></i> Export to CSV';
                    exportDataBtn.disabled = false;
                }, 3000);
            };
            
            try {
                // Create an iframe to trigger the download without navigating away
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                document.body.appendChild(iframe);
                
                // Set src to the export URL to trigger download
                iframe.src = 'api/user_data.php?action=export';
                
                // Show success message
                const alertElement = document.getElementById('dataAlertMessage');
                alertElement.style.display = 'block';
                alertElement.className = 'alert alert-success mt-3';
                alertElement.textContent = 'Your data export has started. The file will download automatically.';
                
                // Hide message after 5 seconds
                setTimeout(() => {
                    alertElement.style.display = 'none';
                    // Remove the iframe after a delay
                    document.body.removeChild(iframe);
                }, 5000);
                
                // Reset button
                resetButton();
                
            } catch (error) {
                console.error('Error:', error);
                
                // Reset button
                resetButton();
                
                // Show error message
                const alertElement = document.getElementById('dataAlertMessage');
                alertElement.style.display = 'block';
                alertElement.className = 'alert alert-danger mt-3';
                alertElement.textContent = 'Error exporting data. Please try again later.';
            }
        });
    }
    
    // Remove All Data Button
    const removeDataBtn = document.getElementById('removeDataBtn');
    if (removeDataBtn) {
        removeDataBtn.addEventListener('click', function() {
            // Show confirmation dialog
            const confirmed = confirm('WARNING: This action cannot be undone. All your metrics data will be permanently deleted from the system. Your account will remain active but empty. Are you sure you want to proceed?');
            
            if (!confirmed) {
                return;
            }
            
            // Show double confirmation
            const confirmation = prompt('FINAL WARNING: You are about to delete ALL your data. This cannot be undone. Type DELETE to confirm:');
            
            if (confirmation === 'DELETE') {
                // Show loading state
                removeDataBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Removing...';
                removeDataBtn.disabled = true;
                
                // Send API request to remove data
                fetch('api/user_data.php?action=remove', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => response.json())
                .then(result => {
                    // Reset button state
                    removeDataBtn.innerHTML = '<i class="fas fa-trash"></i> Remove All Data';
                    removeDataBtn.disabled = false;
                    
                    const alertElement = document.getElementById('dataAlertMessage');
                    alertElement.style.display = 'block';
                    
                    if (result.success) {
                        alertElement.className = 'alert alert-success mt-3';
                        alertElement.textContent = result.message || 'All data has been removed successfully.';
                    } else {
                        alertElement.className = 'alert alert-danger mt-3';
                        alertElement.textContent = result.message || 'An error occurred while removing data.';
                    }
                    
                    // Scroll to alert message
                    alertElement.scrollIntoView({ behavior: 'smooth' });
                })
                .catch(error => {
                    console.error('Error:', error);
                    
                    // Reset button state
                    removeDataBtn.innerHTML = '<i class="fas fa-trash"></i> Remove All Data';
                    removeDataBtn.disabled = false;
                    
                    // Show error message
                    const alertElement = document.getElementById('dataAlertMessage');
                    alertElement.style.display = 'block';
                    alertElement.className = 'alert alert-danger mt-3';
                    alertElement.textContent = 'Error removing data. Please try again later.';
                });
            }
        });
    }
});