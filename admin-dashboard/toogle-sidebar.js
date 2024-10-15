const sidebar = document.querySelector('.sidebar');
const closeButton = document.querySelector('.close-btn');
const menuButton = document.querySelector('.menu-btn');

// Function to toggle the sidebar and update its visibility
function toggleSidebar() {
    sidebar.classList.toggle('collapsed');
    updateButtonVisibility();
    // Save the sidebar state in localStorage
    localStorage.setItem('sidebarState', sidebar.classList.contains('collapsed') ? 'collapsed' : 'expanded');
}

// Function to update button visibility based on the sidebar state
function updateButtonVisibility() {
    if (sidebar.classList.contains('collapsed')) {
        closeButton.style.display = 'none'; // Hide close button
        menuButton.style.display = 'block'; // Show menu button
    } else {
        closeButton.style.display = 'block'; // Show close button
        menuButton.style.display = 'none'; // Hide menu button
    }
}

// Function to initialize sidebar state based on localStorage
function initializeSidebar() {
    const sidebarState = localStorage.getItem('sidebarState');
    if (sidebarState === 'collapsed') {
        sidebar.classList.add('collapsed'); // Collapse sidebar
    } else {
        sidebar.classList.remove('collapsed'); // Expand sidebar
    }
    updateButtonVisibility();
}

// Initialize the sidebar on page load
initializeSidebar();

closeButton.addEventListener('click', toggleSidebar);
menuButton.addEventListener('click', toggleSidebar);
