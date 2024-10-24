document.addEventListener('DOMContentLoaded', () => {
    const themeIcon = document.getElementById('theme-icon');
    const rootElement = document.documentElement; // or use document.body

    function applySavedTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (savedTheme === 'dark') {
            rootElement.classList.add('dark-theme');
            themeIcon.classList.replace('fa-sun', 'fa-moon');
        } else {
            rootElement.classList.remove('dark-theme');
            themeIcon.classList.replace('fa-moon', 'fa-sun');
        }
    }

    // Apply the saved theme on page load
    applySavedTheme();

    themeIcon.addEventListener('click', () => {
        rootElement.classList.toggle('dark-theme');
        const isDarkTheme = rootElement.classList.contains('dark-theme');

        // Toggle the theme icon
        if (isDarkTheme) {
            themeIcon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('theme', 'dark');
        } else {
            themeIcon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('theme', 'light');
        }
    });
});
