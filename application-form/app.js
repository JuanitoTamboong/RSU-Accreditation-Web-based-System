import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js"; 
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";
import { getFirestore, collection, query, where, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { verifyStudentId, isValidStudentIdFormat } from './verify-student-org.js'; // Import verification functions

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
        typeOfService: "Accreditation",
        representativeId: document.getElementById('representative-id').value, // Added student ID
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
                // Disable the "Next" button if invalid file is uploaded
                document.querySelector("button[type='submit']").disabled = true;
            } else {
                uploadedFiles.push(file); // Store valid files in memory
                // Enable the "Next" button when a valid file is uploaded
                document.querySelector("button[type='submit']").disabled = false;
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

function setSchoolYear() {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    document.getElementById('school-year').value = `${currentYear}-${nextYear}`;
}

// Automatically set the current date for the 'date-filing' field in a readable format
function setCurrentDate() {
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' }; // Formatting options
    const formattedDate = today.toLocaleDateString('en-US', options); // Format as 'Month Day, Year'
    document.getElementById('date-filing').value = formattedDate;
}

// Call the function to set the current date when the page loads
window.addEventListener('load', () => {
    setSchoolYear(); // Set the school year
    setCurrentDate(); // Set the current date
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
    event.preventDefault(); // Prevent form submission until validation is complete
    
    const studentID = document.getElementById('representative-id').value;
    
    // Validate the student ID format first
    if (!isValidStudentIdFormat(studentID)) {
        Swal.fire({
            icon: 'error',
            title: 'Invalid Student ID',
            text: 'Please enter a valid student ID in the format xxx-xxxx-xxxxxx.',
        });
        return; // Exit the function if the ID format is invalid
    }

    // Check the verification status of the student ID
    const verificationStatus = await verifyStudentId(studentID);
    if (verificationStatus !== "verified") {
        Swal.fire({
            icon: 'error',
            title: 'ID Not Verified',
            text: 'Your student ID has not been verified by the admin. You need to verify it before proceeding.',
        });
        return; // Exit the function if the student ID is not verified
    }

    // Get the organization name
    const organizationName = document.getElementById('organization-name-dropdown').value;

    // Check if the organization name exists before starting the loading spinner
    const { exists, representativePosition, uid: registeredUid } = await checkIfOrgExists(organizationName.toUpperCase());
    
    // Get the current user's ID
    const user = auth.currentUser;
    const currentUserId = user ? user.uid : null;

    if (exists && registeredUid !== currentUserId) { // Check if the registered user is not the current user
        Swal.fire({
            icon: 'warning',
            title: 'Organization Already Registered',
            text: `The organization "${organizationName}" is currently registered by a ${representativePosition}. Can't proceed.`,
        });
        return; // Exit early if the organization is already registered
    }

    // Show loading spinner
    toggleLoading(true);

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

    // Save the form data with only the newly uploaded documents
    saveFormData(docUrls);

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
        const uid = orgDoc.data().applicationDetails.uid; // Get the registered user's UID
        return { exists: true, representativePosition, uid };
    }
    return { exists: false, representativePosition: null, uid: null };
}

// Add event listener for organization name dropdown selection
document.getElementById('organization-name-dropdown').addEventListener('change', async (event) => {
    const selectedOrgName = event.target.value;

    if (selectedOrgName) {
        const { exists, representativePosition, uid } = await checkIfOrgExists(selectedOrgName.toUpperCase());
        const currentUser = auth.currentUser;

        // Show warning only if the organization exists and the current user is not the representative
        if (exists && uid !== currentUser.uid) {
            Swal.fire({
                icon: 'warning',
                title: 'Organization Already Registered',
                text: `The organization "${selectedOrgName}" is currently registered by a ${representativePosition}.`,
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
                text: `The organization "${newOrgName}" is currently registered by a ${representativePosition}.`,
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