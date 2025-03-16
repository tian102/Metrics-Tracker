// Add touch event handling
document.addEventListener('DOMContentLoaded', function() {
    // Enable touch gestures for modals
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        let touchstartX = 0;
        let touchendX = 0;
        
        modal.addEventListener('touchstart', e => {
            touchstartX = e.changedTouches[0].screenX;
        });

        modal.addEventListener('touchend', e => {
            touchendX = e.changedTouches[0].screenX;
            handleSwipe(modal);
        });

        function handleSwipe(modal) {
            if (touchendX < touchstartX - 50) {
                const modalInstance = bootstrap.Modal.getInstance(modal);
                modalInstance.hide();
            }
        }
    });

    // Fix iOS double-tap issues
    document.addEventListener('touchend', function(event) {
        if (event.target.tagName === 'A' || event.target.tagName === 'BUTTON') {
            event.preventDefault();
            event.target.click();
        }
    });

    // Fix sticky hover states on mobile
    document.addEventListener('touchstart', function() {}, true);
});

// Improve chart responsiveness
window.addEventListener('resize', debounce(function() {
    if (typeof Chart !== 'undefined') {
        Chart.instances.forEach(chart => {
            chart.resize();
        });
    }
}, 250));

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}