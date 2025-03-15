/**
 * Theme Selector JavaScript
 * Enhances the theme selection experience
 */

document.addEventListener('DOMContentLoaded', function() {
    // Make the entire card clickable for theme selection
    const themeCards = document.querySelectorAll('.theme-card');
    
    themeCards.forEach(card => {
        card.addEventListener('click', function() {
            // Find the radio input within this card
            const radioInput = this.querySelector('input[type="radio"]');
            if (radioInput) {
                radioInput.checked = true;
                
                // Remove border-primary class from all cards
                themeCards.forEach(c => c.classList.remove('border-primary'));
                
                // Add border-primary class to selected card
                this.classList.add('border-primary');
            }
        });
    });
    
    // Auto-submit the form when a theme is selected (optional)
    const themeRadios = document.querySelectorAll('input[name="theme"]');
    themeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            // Uncomment this line if you want the form to auto-submit on selection
            // this.closest('form').submit();
        });
    });
});