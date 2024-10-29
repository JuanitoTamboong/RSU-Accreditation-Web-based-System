// Function to update the time with AM/PM
function updateTime() {
    const timeContainer = document.querySelector('.time');
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? ' PM' : ' AM';
    hours = hours % 12 || 12; // Convert to 12-hour format
    const formattedTime = `${hours}:${minutes}${ ampm}`; // Include seconds
    timeContainer.textContent = formattedTime;
}

// Expose functions globally
window.changeMonth = changeMonth;
window.addEvent = addEvent;

// Call updateTime every second for real-time update
setInterval(updateTime, 1000);
updateTime(); // Initial call to set the time immediately

// Calendar functionality
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
const events = JSON.parse(localStorage.getItem('events')) || {}; // Load events from localStorage

function renderCalendar(month, year) {
    const monthYear = document.getElementById('month-year');
    const datesGrid = document.getElementById('dates-grid');
    const today = new Date();

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June', 'July',
        'August', 'September', 'October', 'November', 'December'
    ];

    monthYear.textContent = `${monthNames[month]} ${year}`;
    datesGrid.innerHTML = ''; // Clear previous dates

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Add empty boxes for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
        datesGrid.innerHTML += '<div class="empty-date"></div>';
    }

    // Fill the calendar with dates
    for (let day = 1; day <= daysInMonth; day++) {
        const dateBox = document.createElement('div');
        dateBox.classList.add('date-box');
        dateBox.textContent = day;

        // Highlight today
        if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dateBox.classList.add('today');
        }

        dateBox.onclick = () => selectDate(day, month, year);
        datesGrid.appendChild(dateBox);
    }
}

function changeMonth(direction) {
    currentMonth += direction;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar(currentMonth, currentYear);
}

function selectDate(day, month, year) {
    const selectedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    document.getElementById('selected-date').textContent = `Events on ${selectedDate}`;
    document.getElementById('event-list').innerHTML = '';

    // Check if there are events for the selected date
    if (events[selectedDate]) {
        events[selectedDate].forEach((event, index) => {
            const li = document.createElement('li');

            // Create a span for the event name
            const eventNameSpan = document.createElement('span');
            eventNameSpan.textContent = event.name;

            li.appendChild(eventNameSpan); // Append the span to the list item
            li.appendChild(createDeleteButton(event.name, selectedDate, index)); // Append delete button

            document.getElementById('event-list').appendChild(li);
        });
    } else {
        document.getElementById('event-list').innerHTML = '<li>No events for this date</li>';
    }
}

function createDeleteButton(eventName, date, index) {
    const button = document.createElement('button');
    button.textContent = 'Delete';
    button.classList.add('delete-button');
    button.onclick = () => deleteEvent(date, index);
    return button;
}

function addEvent() {
    const selectedDate = document.getElementById('selected-date').textContent.split(' ')[2];

    // Check if the selected date is valid
    if (!selectedDate || selectedDate.includes('undefined')) {
        Swal.fire('Please select a date first.');
        return;
    }

    Swal.fire({
        title: 'Add Event',
        input: 'text',
        inputPlaceholder: 'Enter event name',
        showCancelButton: true,
        confirmButtonText: 'Add',
        cancelButtonText: 'Cancel',
        customClass: 'swal-pop-up',
        preConfirm: (eventName) => {
            if (!eventName) {
                Swal.showValidationMessage('Please enter an event name');
            } else {
                return { name: eventName };
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const eventName = result.value.name;
            if (!events[selectedDate]) {
                events[selectedDate] = [];
            }
            events[selectedDate].push({ name: eventName });
            localStorage.setItem('events', JSON.stringify(events)); // Save to localStorage

            // Update the event list automatically
            selectDate(new Date(selectedDate).getDate(), new Date(selectedDate).getMonth(), new Date(selectedDate).getFullYear());
            Swal.fire({
                title: 'Event added successfully!',
                icon: 'success',
                customClass: 'swal-success',
            });
        }
    });
}

function deleteEvent(date, index) {
    const eventName = events[date][index].name; // Get the event name for the alert
    events[date].splice(index, 1); // Remove the event
    if (events[date].length === 0) {
        delete events[date]; // Remove the date entry if there are no events left
    }
    localStorage.setItem('events', JSON.stringify(events)); // Save to localStorage
    selectDate(new Date(date).getDate(), new Date(date).getMonth(), new Date(date).getFullYear()); // Refresh event list
    Swal.fire({
        title: `Event deleted successfully!`,
        icon: 'success',
        customClass: 'swal-delete',
    }); // Show custom delete message
}

// Call this function after the initial rendering of the calendar
function initializeEvents() {
    const today = new Date();
    selectDate(today.getDate(), today.getMonth(), today.getFullYear());
}

// Initial rendering of the calendar
renderCalendar(currentMonth, currentYear);
initializeEvents(); // Load today's events initially
