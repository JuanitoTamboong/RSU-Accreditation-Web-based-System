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
function toggleLoading(show) {
    document.getElementById("loading").style.display = show ? "flex" : "none";
}

// Save form data to localStorage using user's uid as key
function saveFormData(docUrls) {
    const user = auth.currentUser;
    if (!user) return;

    const formData = {
        uid: user.uid,
        typeOfAccreditation: "Renewal",
        representativeName: document.getElementById('representative-name').value,
        representativePosition: document.getElementById('representative-position-dropdown').value,
        schoolYear: document.getElementById('school-year').value,
        studentCourse: document.getElementById('course-dropdown').value,
        organizationName: document.getElementById('organization-name-dropdown').value,
        emailAddress: document.getElementById('email-address').value,
        dateFiling: document.getElementById('date-filing').value,
        documents: docUrls || [] // Save document URLs here
    };

    localStorage.setItem(`applicationFormData_${user.uid}`, JSON.stringify(formData));
}

// Handle document upload
let uploadedFiles = []; // Store uploaded files locally

document.getElementById('requirement-documents').addEventListener('change', (event) => {
    const files = Array.from(event.target.files);
    const maxSize = 50 * 1024 * 1024; // 50MB

    uploadedFiles = []; // Clear previously stored files

    files.forEach(file => {
        if (file.size > maxSize || file.type !== 'application/pdf') {
            Swal.fire({
                icon: 'error',
                title: 'Upload Error',
                text: `${file.name} exceeds 50MB or is not a PDF.`,
            });
            document.getElementById('preview-documents').disabled = true; // Disable preview button if invalid file
        } else {
            uploadedFiles.push(file); // Store valid files in memory
            document.getElementById('preview-documents').disabled = false; // Enable preview button
        }
    });
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
                html: `<iframe src="${pdfData}" style="width:100%; min-height:100vh;" frameborder="0"></iframe>`,
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

// Set the current year and next year for the school-year input
function setSchoolYear() {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    document.getElementById('school-year').value = `${currentYear}-${nextYear}`;
}
window.addEventListener('load', () => {
    setSchoolYear(); // Set the school year on load
});

// Date picker initialization
document.addEventListener('DOMContentLoaded', function() {
    flatpickr("#date-filing", {
        dateFormat: "Y-m-d",
        defaultDate: new Date(),
        allowInput: true,
        altInput: true,
        altFormat: "F j, Y",
        disableMobile: "true"
    });
});

// Validate required fields
function validateFields() {
    const fields = [
        'representative-name', 
        'representative-position-dropdown', 
        'school-year', 
        'course-dropdown', 
        'organization-name-dropdown', 
        'email-address', 
        'date-filing'
    ];
    
    for (const field of fields) {
        if (!document.getElementById(field).value) {
            Swal.fire({
                icon: 'error',
                title: 'Validation Error',
                text: `Please fill in the ${field.replace(/-/g, ' ')} field.`,
            });
            return false;
        }
    }
    return true;
}

// Handle form submission
document.getElementById('application-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    toggleLoading(true);

    const user = auth.currentUser;
    if (!user) {
        Swal.fire({
            icon: 'error',
            title: 'Authentication Error',
            text: 'User not authenticated. Please log in.',
        }).then(() => {
            toggleLoading(false);
        });
        return;
    }

    if (!validateFields()) {
        toggleLoading(false);
        return; // Stop form submission if validation fails
    }

    let docUrls = [];

    // If there are files uploaded, upload them to Firebase Storage
    if (uploadedFiles.length > 0) {
        const uploadPromises = uploadedFiles.map((file) => {
            const fileRef = ref(storage, `documents/${user.uid}/${file.name}`);
            return uploadBytes(fileRef, file)
                .then(snapshot => getDownloadURL(snapshot.ref))
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
            docUrls = await Promise.all(uploadPromises);
        } catch (error) {
            toggleLoading(false);
            return; // Stop form submission if file upload fails
        }
    }

    // Get previously saved form data from localStorage
    const savedData = JSON.parse(localStorage.getItem(`applicationFormData_${user.uid}`)) || {};
    const allDocUrls = [...(savedData.documents || []), ...docUrls];

    // Store the form data and uploaded document URLs in localStorage
    saveFormData(allDocUrls);

    // Redirect to the next page
    window.location.href = '../student-profile/list-officers.html';
    toggleLoading(false);
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

// Add course dynamically
document.getElementById('add-course').addEventListener('click', () => {
    Swal.fire({
        title: 'Enter the new course name:',
        input: 'text',
        showCancelButton: true,
        inputPlaceholder: 'New course name'
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
// Fill form with organization data
function fillFormWithOrganizationData() {
    const orgData = JSON.parse(localStorage.getItem('selectedOrganization'));

    if (orgData) {
        // Assuming your form fields have specific IDs
        document.getElementById('representative-name').value = orgData.applicationDetails.organizationName || '';
        document.getElementById('filing-date-field').value = orgData.applicationDetails.dateFiling || '';
        document.getElementById('officer-name-field').value = orgData.applicationDetails.officerName || '';
        // Add more fields as necessary...
    } else {
        showInfoAlert('No Data Found', 'No organization data found. Please go back and search for your organization.');
    }
}