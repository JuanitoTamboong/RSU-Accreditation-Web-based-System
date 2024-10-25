document.addEventListener('DOMContentLoaded', () => {
    const themeIcon = document.getElementById('theme-icon');
    const rootElement = document.documentElement;

    function applySavedTheme() {
        // Remove transition temporarily to prevent initial rotation
        themeIcon.style.transition = 'none';
        const savedTheme = localStorage.getItem('theme') || 'light';

        if (savedTheme === 'dark') {
            rootElement.classList.add('dark-theme');
            rootElement.classList.remove('light-theme');
            themeIcon.classList.replace('fa-sun', 'fa-moon');
        } else {
            rootElement.classList.add('light-theme');
            rootElement.classList.remove('dark-theme');
            themeIcon.classList.replace('fa-moon', 'fa-sun');
        }

        // Reapply the CSS transition after initial load
        requestAnimationFrame(() => {
            themeIcon.style.transition = 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out';
        });
    }

    // Apply the saved theme on page load
    applySavedTheme();

    themeIcon.addEventListener('click', () => {
        const isDarkTheme = rootElement.classList.toggle('dark-theme');
        rootElement.classList.toggle('light-theme', !isDarkTheme);

        // Toggle the theme icon and save preference
        if (isDarkTheme) {
            themeIcon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('theme', 'dark');
        } else {
            themeIcon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('theme', 'light');
        }
    });
});
