document.addEventListener('DOMContentLoaded', () => {
    const themeIcon = document.getElementById('theme-icon');
    const section = document.querySelector('.section');
    const mainContainer = document.querySelector('.main-container');
    const topContainer = document.querySelector('.top-container');
    const notificationsDropdown = document.querySelector('.notifications-dropdown');
    const notificationModal = document.querySelector('.notification-modal');
    const leftContent = document.querySelector('.left-content');
    const rightContent = document.querySelector('.right-content');

    function applySavedTheme() {
        const savedTheme = localStorage.getItem('main-container-theme');
        if (savedTheme === 'dark') {
            // Apply dark theme
            section.classList.add('dark-theme');
            mainContainer.classList.add('dark-theme');
            topContainer.classList.add('dark-theme');
            notificationsDropdown.classList.add('dark-theme');
            notificationModal.classList.add('dark-theme');
            if (leftContent && rightContent) { // In case these elements exist
                leftContent.classList.add('dark-theme');
                rightContent.classList.add('dark-theme');
            }

            themeIcon.classList.remove('fa-sun'); // Remove sun icon
            themeIcon.classList.add('fa-moon');   // Add moon icon
        } else {
            // Apply light theme
            section.classList.add('light-theme');
            mainContainer.classList.add('light-theme');
            topContainer.classList.remove('dark-theme');
            notificationsDropdown.classList.remove('dark-theme');
            notificationModal.classList.remove('dark-theme');
            if (leftContent && rightContent) { // In case these elements exist
                leftContent.classList.remove('dark-theme');
                rightContent.classList.remove('dark-theme');
            }

            themeIcon.classList.remove('fa-moon'); // Remove moon icon
            themeIcon.classList.add('fa-sun');     // Add sun icon
        }
    }

    // Apply saved theme on load
    applySavedTheme();

    themeIcon.addEventListener('click', () => {
        // Apply transition to the icon first
        themeIcon.classList.toggle('icon-transition');

        // Delay the container's theme change slightly
        setTimeout(() => {
            // Toggle theme classes
            section.classList.toggle('dark-theme');
            section.classList.toggle('light-theme');
            mainContainer.classList.toggle('dark-theme');
            mainContainer.classList.toggle('light-theme');
            topContainer.classList.toggle('dark-theme');
            notificationsDropdown.classList.toggle('dark-theme');
            notificationModal.classList.toggle('dark-theme');

            if (leftContent && rightContent) { // In case these elements exist
                leftContent.classList.toggle('dark-theme');
                rightContent.classList.toggle('dark-theme');
            }

            const isLightTheme = mainContainer.classList.contains('light-theme');

            // Toggle between sun and moon icons
            if (isLightTheme) {
                themeIcon.classList.remove('fa-moon');
                themeIcon.classList.add('fa-sun');
            } else {
                themeIcon.classList.remove('fa-sun');
                themeIcon.classList.add('fa-moon');
            }

            // Save theme choice in localStorage
            localStorage.setItem('main-container-theme', isLightTheme ? 'light' : 'dark');
        }, 300); // 300ms delay
    });
});
