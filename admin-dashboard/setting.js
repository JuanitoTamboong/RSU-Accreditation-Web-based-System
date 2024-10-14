const themeIcon = document.getElementById('theme-icon');
const mainContainer = document.querySelector('.main-container');
const topContainer = document.querySelector('.top-container');
const notificationsDropdown = document.querySelector('.notifications-dropdown');
const notificationModal = document.querySelector('.notification-modal');
const leftContent = document.querySelector('.left-content');
const rightContent = document.querySelector('.right-content');
const section = document.querySelector('.section');
themeIcon.addEventListener('click', () => {
    // Apply transition to the icon first
    themeIcon.classList.toggle('icon-transition');

    // Delay the container's theme change slightly
    setTimeout(() => {
        // Toggle theme classes
        section.classList.toggle('dark-theme');
        section.classList.toggle('light-theme');
        mainContainer.classList.toggle('light-theme');
        mainContainer.classList.toggle('dark-theme');
        
        topContainer.classList.toggle('dark-theme'); // Toggle dark theme for the top container
        notificationsDropdown.classList.toggle('dark-theme'); // Toggle for notifications
        notificationModal.classList.toggle('dark-theme'); // Toggle for notification modal
        leftContent.classList.toggle('dark-theme'); // Toggle for left content
        rightContent.classList.toggle('dark-theme'); // Toggle for right content
        
        const isLightTheme = mainContainer.classList.contains('light-theme');
        
        // Toggle between sun and moon icons
        themeIcon.classList.toggle('fa-sun', !isLightTheme);
        themeIcon.classList.toggle('fa-moon', isLightTheme);
        
        // Save theme choice in localStorage
        localStorage.setItem('main-container-theme', isLightTheme ? 'light' : 'dark');
    }, 300); // 300ms delay (matches icon transition timing)
});
