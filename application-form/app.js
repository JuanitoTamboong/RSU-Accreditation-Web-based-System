import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js"; 
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";
import { getFirestore, collection, query, where, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

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
const db = getFirestore(app);

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

    localStorage.setItem(`applicationFormData_${user.uid}`, JSON.stringify(formData));
}

// Handle document upload
let uploadedFiles = []; // Store uploaded files locally

document.getElementById('requirement-documents').addEventListener('change', (event) => {
    const files = Array.from(event.target.files);

    uploadedFiles = []; // Clear previously stored files

    files.forEach(file => {
        if (!uploadedFiles.some(uploadedFile => uploadedFile.name === file.name)) {
            if (file.type !== 'application/pdf') {
                Swal.fire({
                    icon: 'error',
                    title: 'Upload Error',
                    text: `${file.name} is not a PDF.`,
                });
                document.getElementById('preview-documents').disabled = true; // Disable preview button if invalid file
            } else {
                uploadedFiles.push(file); // Store valid files in memory
                document.getElementById('preview-documents').disabled = false; // Enable preview button
            }
        } else {
            Swal.fire({
                icon: 'warning',
                title: 'Duplicate File',
                text: `${file.name} has already been added.`,
            });
        }
    });
});

// Preview button logic
document.getElementById('preview-documents').addEventListener('click', () => {
    const file = uploadedFiles[0]; // Get the first valid file from memory

    if (file && file.type === 'application/pdf') {
        const fileReader = new FileReader();

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
    setSchoolYear();
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
    
    // Get the organization name
    const organizationName = document.getElementById('organization-name-dropdown').value;

    // Check if the organization name exists before starting the loading spinner
    const { exists, representativePosition } = await checkIfOrgExists(organizationName.toUpperCase());
    if (exists) {
        Swal.fire({
            icon: 'warning',
            title: 'Organization Already Registered',
            text: `The organization "${organizationName}" is currently registered by a ${representativePosition} can't procceed`,
        });
        return; // Exit early if the organization is already registered
    }

    // Show loading spinner
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
        return;
    }

    let docUrls = [];

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
                    throw error;
                });
        });

        try {
            docUrls = await Promise.all(uploadPromises);
        } catch (error) {
            toggleLoading(false);
            return;
        }
    }

    // Load previously saved data
    const savedData = JSON.parse(localStorage.getItem(`applicationFormData_${user.uid}`)) || {};
    const allDocUrls = savedData.documents || [];

    // Avoid duplication of document URLs
    docUrls.forEach(url => {
        if (!allDocUrls.includes(url)) {
            allDocUrls.push(url); // Only add unique URLs
        }
    });

    // Save the updated form data
    saveFormData(allDocUrls);

    // Redirect after saving
    window.location.href = '../student-profile/list-officers.html';
    toggleLoading(false);
});
// Check if organization name exists in Firestore under 'student-org-applications' and return representative position if exists
async function checkIfOrgExists(orgName) {
    const orgRef = collection(db, 'student-org-applications');
    const q = query(orgRef, where('applicationDetails.organizationName', '==', orgName));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const orgDoc = querySnapshot.docs[0]; // Get the first document
        const representativePosition = orgDoc.data().applicationDetails.representativePosition; // Adjust path as necessary
        return { exists: true, representativePosition };
    }
    return { exists: false, representativePosition: null };
}

// Add event listener for organization name dropdown selection
document.getElementById('organization-name-dropdown').addEventListener('change', async (event) => {
    const selectedOrgName = event.target.value;

    if (selectedOrgName) {
        const { exists, representativePosition } = await checkIfOrgExists(selectedOrgName.toUpperCase());
        if (exists) {
            Swal.fire({
                icon: 'warning',
                title: 'Organization Already Registered',
                text: `The organization "${selectedOrgName}" is currently registered by a ${representativePosition}`,
            });
        }
    }
});

// Add organization name dynamically if not already existing
document.getElementById('add-organization').addEventListener('click', async () => {
    const { value: newOrgName } = await Swal.fire({
        title: 'Enter the new organization name:',
        input: 'text',
        showCancelButton: true,
        inputPlaceholder: 'New organization name'
    });

    if (newOrgName) {
        // Get the existence status and representative position of the new organization
        const { exists, representativePosition } = await checkIfOrgExists(newOrgName.toUpperCase());
        if (exists) {
            Swal.fire({
                icon: 'warning',
                title: 'Organization Already Registered',
                text: `The organization "${newOrgName}" is currently registered by a ${representativePosition}`,
            });
        } else {
            // Create a new option for the dropdown
            const organizationNameDropdown = document.getElementById('organization-name-dropdown');
            const option = document.createElement('option');
            option.value = newOrgName.toUpperCase();
            option.textContent = newOrgName.toUpperCase();
            organizationNameDropdown.appendChild(option);
            organizationNameDropdown.value = option.value;
        }
    }
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