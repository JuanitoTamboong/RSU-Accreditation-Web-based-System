import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDXQCFoaCSWsCV2JI7wrOGZPKEpQuNzENA",
    authDomain: "student-org-5d42a.firebaseapp.com",
    projectId: "student-org-5d42a",
    storageBucket: "student-org-5d42a.appspot.com",
    messagingSenderId: "1073695504078",
    appId: "1:1073695504078:web:eca07da6a1563c46e0829f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const storage = getStorage(app);

// Authentication state listener
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "../index.html";
    } else {
        document.getElementById('email-address').value = user.email || ''; // Prefill user email
        loadFormData(); // Load the user's specific form data
    }
});

// Show/hide loading spinner
function showLoading() {
    document.getElementById("loading").style.display = "flex";
}

function hideLoading() {
    document.getElementById("loading").style.display = "none";
}

// Save form data to localStorage using user's uid as key
function saveFormData(docUrls) {
    const user = auth.currentUser;
    if (!user) return;

    // Collect form data
    const formData = {
        typeOfAccreditation: "New Organization",
        representativeName: document.getElementById('representative-name').value,
        representativePosition: document.getElementById('representative-position-dropdown').value,
        schoolYear: document.getElementById('school-year').value,
        studentCourse: document.getElementById('course-dropdown').value,
        organizationName: document.getElementById('organization-name-dropdown').value,
        emailAddress: document.getElementById('email-address').value,
        dateFiling: document.getElementById('date-filing').value,
        documents: docUrls || [] // Ensure documents are saved
    };

    // Save form data to localStorage with user-specific key
    localStorage.setItem(`applicationFormData_${user.uid}`, JSON.stringify(formData));
}

// Load form data from localStorage using user's uid as key
function loadFormData() {
    const user = auth.currentUser;
    if (!user) return;

    // Retrieve saved data from localStorage
    const savedData = JSON.parse(localStorage.getItem(`applicationFormData_${user.uid}`));
    if (savedData) {
        document.getElementById('representative-name').value = savedData.representativeName || ''; // Correctly load representative name
        document.getElementById('representative-position-dropdown').value = savedData.representativePosition || '';
        document.getElementById('school-year').value = savedData.schoolYear || '';
        document.getElementById('course-dropdown').value = savedData.studentCourse || '';
        document.getElementById('organization-name-dropdown').value = savedData.organizationName || '';
        document.getElementById('email-address').value = savedData.emailAddress || '';
        document.getElementById('date-filing').value = savedData.dateFiling || '';
    }
}

// Handle document upload
document.getElementById('requirement-documents').addEventListener('change', async (event) => {
    const files = Array.from(event.target.files); // Convert FileList to an array
    const maxSize = 5 * 1024 * 1024; // 5 MB
    let documentUrls = []; // Array to hold URLs of uploaded documents

    // Retrieve existing document URLs from localStorage
    const savedData = JSON.parse(localStorage.getItem(`applicationFormData_${auth.currentUser.uid}`));
    const existingDocUrls = savedData?.documents || []; // Use existing URLs or an empty array

    // Iterate over selected files
    for (const file of files) {
        // Check file size and type
        if (file.size <= maxSize && file.type === 'application/pdf') {
            // Create a reference to the storage location
            const storageRef = ref(storage, `documents/${file.name}`);
            try {
                // Upload the file
                await uploadBytes(storageRef, file);
                // Get the download URL for the uploaded file
                const url = await getDownloadURL(storageRef);
                documentUrls.push(url); // Add the download URL to the array
            } catch (error) {
                console.error('Error uploading file:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Upload Error',
                    text: `Failed to upload ${file.name}. Please try again later.`,
                });
            }
        } else {
            // Show an error message if the file exceeds size or type restrictions
            Swal.fire({
                icon: 'error',
                title: 'Upload Error',
                text: `${file.name} exceeds 5MB size or is not a PDF.`,
            });
        }
    }

    // Combine new document URLs with existing ones
    documentUrls = [...existingDocUrls, ...documentUrls];

    // Save the updated URLs to localStorage
    saveFormData(documentUrls); // Function to handle localStorage updates
});


// Set the current year to the school year input
function setCurrentYear() {
    const currentYear = new Date().getFullYear();
    document.getElementById('school-year').value = currentYear;
}

// Load data on page load
window.addEventListener('load', () => {
    setCurrentYear(); // Set the current year on load
});
document.addEventListener('DOMContentLoaded', function() {
    flatpickr("#date-filing", {
        dateFormat: "Y-m-d", // Format as Year-Month-Day
        defaultDate: new Date(), // Set the current date as default
        allowInput: true, // Allow manual input
        altInput: true, // Use an alternate input to show a more user-friendly date
        altFormat: "F j, Y", // Show the user-friendly format
        disableMobile: "true" // Ensures the Flatpickr is used on mobile
    });
});

// Handle form submission
document.getElementById('application-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    showLoading();

    const user = auth.currentUser;
    if (!user) {
        Swal.fire({
            icon: 'error',
            title: 'Authentication Error',
            text: 'User not authenticated. Please log in.',
        }).then(() => {
            hideLoading();
        });
        return;
    }

    // Retrieve the document URLs saved in localStorage if there are any
    let savedData = JSON.parse(localStorage.getItem(`applicationFormData_${user.uid}`));
    let docUrls = savedData?.documents || [];

    saveFormData(docUrls); // Always pass the document URLs

    // Redirect to the next page
    window.location.href = '../student-profile/list-officers.html';
    hideLoading();
});

// Add organization name dynamically
document.getElementById('add-organization').addEventListener('click', () => {
    Swal.fire({
        title: 'Enter the new organization name:',
        input: 'text',
        showCancelButton: true,
        inputPlaceholder: 'New organization name'
    }).then((result) => {
        if (result.isConfirmed && result.value) {
            const organizationNameDropdown = document.getElementById('organization-name-dropdown');
            const option = document.createElement('option');
            option.value = result.value;
            option.textContent = result.value;
            organizationNameDropdown.appendChild(option);
            organizationNameDropdown.value = result.value; // Set it as selected
        }
    });
});

// Add position dynamically
document.getElementById('add-position').addEventListener('click', () => {
    Swal.fire({
        title: 'Enter the new position name:',
        input: 'text',
        showCancelButton: true,
        inputPlaceholder: 'New position name'
    }).then((result) => {
        if (result.isConfirmed && result.value) {
            const positionDropdown = document.getElementById('representative-position-dropdown');
            const option = document.createElement('option');
            option.value = result.value;
            option.textContent = result.value;
            positionDropdown.appendChild(option);
            positionDropdown.value = result.value; // Set it as selected
        }
    });
});

// Add course dynamically
document.getElementById('add-course').addEventListener('click', () => {
    Swal.fire({
        title: 'Enter the new course name:',
        input: 'text',
        showCancelButton: true,
        inputPlaceholder: 'New course name',
        customClass: "swal-wide"
    }).then((result) => {
        if (result.isConfirmed && result.value) {
            const courseDropdown = document.getElementById('course-dropdown');
            const option = document.createElement('option');
            option.value = result.value;
            option.textContent = result.value;
            courseDropdown.appendChild(option);
            courseDropdown.value = result.value; // Set it as selected
        }
    });
});
