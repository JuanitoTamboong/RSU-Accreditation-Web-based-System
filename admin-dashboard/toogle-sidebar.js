const sidebar = document.querySelector('.sidebar');
const closeButton = document.querySelector('.close-btn');
const menuButton = document.querySelector('.menu-btn');

function toggleSidebar() {
    sidebar.classList.toggle('collapsed');
    updateButtonVisibility();
}

function updateButtonVisibility() {
    if (sidebar.classList.contains('collapsed')) {
        closeButton.style.display = 'none'; // Hide close button
        menuButton.style.display = 'block'; // Show menu button
    } else {
        closeButton.style.display = 'block'; // Show close button
        menuButton.style.display = 'none'; // Hide menu button
    }
}

// Initialize button visibility
updateButtonVisibility();

closeButton.addEventListener('click', toggleSidebar);
menuButton.addEventListener('click', toggleSidebar);
