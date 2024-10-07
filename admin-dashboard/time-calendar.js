// Import Firebase Authentication


// Function to update the time with AM/PM
function updateTime() {
    const timeContainer = document.querySelector('.time');
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // Convert to 12-hour format
    const formattedTime = `${hours}:${minutes}:${seconds} ${ampm}`;
    timeContainer.textContent = formattedTime;
}

// Call updateTime every second
setInterval(updateTime, 1000);

// Function to generate the calendar for the current month and highlight today's date
function generateCalendar() {
    const calendarContainer = document.querySelector('.calendar');
    const now = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const month = now.getMonth();
    const year = now.getFullYear();
    const today = now.getDate(); // Get today's date

    // Get the first day and the number of days in the current month
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Display the current date above the calendar
    const currentDate = `${monthNames[month]} ${today}, ${year}`;
    let calendarHTML = `<h3 class="current-date">${currentDate}</h3>`;
    calendarHTML += '<table>';
    calendarHTML += '<thead><tr><th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th></tr></thead>';
    calendarHTML += '<tbody><tr>';

    // Fill in the blank days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
        calendarHTML += '<td></td>';
    }

    // Fill in the days of the month and highlight today's date
    for (let day = 1; day <= daysInMonth; day++) {
        if ((firstDay + day - 1) % 7 === 0) {
            calendarHTML += '</tr><tr>'; // Start a new row every Sunday
        }

        // Check if the current day is today's date, apply a class if true
        if (day === today) {
            calendarHTML += `<td class="today">${day}</td>`;
        } else {
            calendarHTML += `<td>${day}</td>`;
        }
    }

    calendarHTML += '</tr></tbody></table>';
    calendarContainer.innerHTML = calendarHTML;
}

// Generate calendar on load
generateCalendar();
