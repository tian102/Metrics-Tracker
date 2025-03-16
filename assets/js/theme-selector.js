/**
 * Theme Selector JavaScript
 * Enhances the theme selection experience
 */

document.addEventListener('DOMContentLoaded', function() {
    // Make the entire card clickable for theme selection
    const themeCards = document.querySelectorAll('.theme-card');
    
    themeCards.forEach(card => {
        card.addEventListener('click', async function() {
            // Find the radio input within this card
            const radioInput = this.querySelector('input[type="radio"]');
            if (radioInput) {
                // Update visual selection
                radioInput.checked = true;
                themeCards.forEach(c => c.classList.remove('border-primary'));
                this.classList.add('border-primary');

                // Get the selected theme
                const selectedTheme = radioInput.value;
                const formData = new FormData();
                formData.append('theme', selectedTheme);

                try {
                    // Send AJAX request to update theme
                    const response = await fetch('update_theme.php', {
                        method: 'POST',
                        body: formData
                    });

                    const result = await response.json();
                    
                    if (result.success) {
                        // Create new link element
                        const newThemeLink = document.createElement('link');
                        newThemeLink.rel = 'stylesheet';
                        newThemeLink.href = `assets/css/themes/${selectedTheme}.css`;

                        // Replace existing theme stylesheet
                        const oldThemeLink = document.querySelector('link[href*="themes/"]');
                        if (oldThemeLink) {
                            oldThemeLink.parentNode.replaceChild(newThemeLink, oldThemeLink);
                        } else {
                            document.head.appendChild(newThemeLink);
                        }

                        // Get the current tab
                        const activeTab = document.querySelector('#profileTabs .nav-link.active');
                        const tabId = activeTab ? activeTab.id : 'profile-tab';
                        
                        // Reload page with tab parameter
                        window.location.href = 'profile.php?tab=' + tabId;
                    }
                } catch (error) {
                    console.error('Error updating theme:', error);
                }
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