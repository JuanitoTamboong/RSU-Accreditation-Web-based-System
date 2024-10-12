
  const themeIcon = document.getElementById('theme-icon');
  const bodyElement = document.body;

  // Check localStorage for saved theme and apply it
  const savedTheme = localStorage.getItem('theme') || 'dark'; // Default to dark theme
  if (savedTheme === 'light') {
      bodyElement.classList.add('light-theme');
      themeIcon.classList.remove('fa-sun');
      themeIcon.classList.add('fa-moon');
  }

  themeIcon.addEventListener('click', () => {
    bodyElement.classList.toggle('light-theme');
    
    const isLightTheme = bodyElement.classList.contains('light-theme');

    // Toggle between sun and moon icons
    themeIcon.classList.toggle('fa-sun', !isLightTheme);
    themeIcon.classList.toggle('fa-moon', isLightTheme);

    // Save theme choice to localStorage
    localStorage.setItem('theme', isLightTheme ? 'light' : 'dark');
  });
