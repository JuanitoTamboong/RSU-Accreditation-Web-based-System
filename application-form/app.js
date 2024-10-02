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
        uid: user.uid,
        typeOfAccreditation: "New Organization",
        representativeName: document.getElementById('representative-name').value,
        representativePosition: document.getElementById('representative-position-dropdown').value,
        schoolYear: document.getElementById('school-year').value,
        studentCourse: document.getElementById('course-dropdown').value,
        organizationName: document.getElementById('organization-name-dropdown').value,
        emailAddress: document.getElementById('email-address').value,
        dateFiling: document.getElementById('date-filing').value,
        documents: docUrls || [] // Save document URLs here
    };

    // Save form data to localStorage with user-specific key
    localStorage.setItem(`applicationFormData_${user.uid}`, JSON.stringify(formData));
}

// Handle document upload
let uploadedFiles = []; // Store uploaded files locally

document.getElementById('requirement-documents').addEventListener('change', (event) => {
    const files = Array.from(event.target.files);
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (files.length > 0) {
        document.getElementById('preview-documents').disabled = false; // Enable preview button
    }

    // Clear previously stored files
    uploadedFiles = []; 

    for (const file of files) {
        if (file.size > maxSize || file.type !== 'application/pdf') {
            Swal.fire({
                icon: 'error',
                title: 'Upload Error',
                text: `${file.name} exceeds 5MB or is not a PDF.`,
            });
            document.getElementById('preview-documents').disabled = true; // Disable preview button if invalid file
        } else {
            uploadedFiles.push(file); // Store valid files in memory
        }
    }
});

// Preview button logic
document.getElementById('preview-documents').addEventListener('click', () => {
    const file = uploadedFiles[0]; // Get the first valid file from memory

    if (file && file.type === 'application/pdf') {
        const fileReader = new FileReader();

        // Once the file is loaded, display it in an iframe
        fileReader.onload = function(event) {
            const pdfData = event.target.result;
            Swal.fire({
                title: 'Selected PDF Document',
                html: `<iframe src="${pdfData}" style="width:100%; height:400px;" frameborder="0"></iframe>`,
                icon: 'info',
                showCloseButton: true,
                focusConfirm: false,
                confirmButtonText: 'Close',
                customClass: {
                    popup: "swal-pdf-viewer"
                }
            });
        };

        // Read the file as a data URL
        fileReader.readAsDataURL(file);
    } else {
        Swal.fire({
            icon: 'error',
            title: 'No Valid File',
            text: 'Please select a valid PDF document to preview.',
        });
    }
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

// Date picker initialization
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

    // Array to store the uploaded document URLs
    let docUrls = [];

    // If there are files uploaded, upload them to Firebase Storage
    if (uploadedFiles.length > 0) {
        const uploadPromises = uploadedFiles.map((file, index) => {
            // Create a storage reference for each file
            const fileRef = ref(storage, `documents/${user.uid}/${file.name}`);
            
            // Upload the file and return the promise
            return uploadBytes(fileRef, file)
                .then(snapshot => {
                    // After uploading, get the download URL
                    return getDownloadURL(snapshot.ref).then(url => {
                        return url; // Return the URL
                    });
                })
                .catch(error => {
                    console.error("Error uploading file:", error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Upload Error',
                        text: `Failed to upload file: ${file.name}`,
                    });
                    throw error; // Propagate error to stop form submission
                });
        });

        try {
            // Wait for all files to upload and get their URLs
            docUrls = await Promise.all(uploadPromises);
        } catch (error) {
            hideLoading();
            return; // Stop form submission if file upload fails
        }
    }

    // Get previously saved form data from localStorage
    const savedData = JSON.parse(localStorage.getItem(`applicationFormData_${user.uid}`)) || {};
    const allDocUrls = [...(savedData.documents || []), ...docUrls]; // Combine existing and new document URLs

    // Store the form data and uploaded document URLs in localStorage
    saveFormData(allDocUrls);

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
            const representativePositionDropdown = document.getElementById('representative-position-dropdown');
            const option = document.createElement('option');
            option.value = result.value;
            option.textContent = result.value;
            representativePositionDropdown.appendChild(option);
            representativePositionDropdown.value = result.value; // Set it as selected
        }
    });
});
