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

// Utility functions
const showLoading = () => document.getElementById("loading").style.display = "flex";
const hideLoading = () => document.getElementById("loading").style.display = "none";
const setSchoolYear = () => {
    const currentYear = new Date().getFullYear();
    document.getElementById('school-year').value = `${currentYear}-${currentYear + 1}`;
};

// Save form data to localStorage
const saveFormData = (docUrl) => {
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
        document: docUrl || ''
    };

    localStorage.setItem(`applicationFormData_${user.uid}`, JSON.stringify(formData));
};

// Handle document upload
let uploadedFile = null;
const handleFileSelection = (event) => {
    const file = event.target.files[0];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (file.size > maxSize || file.type !== 'application/pdf') {
        Swal.fire({ icon: 'error', title: 'Upload Error', text: `${file.name} exceeds 50MB or is not a PDF.` });
        document.getElementById('preview-documents').disabled = true;
        uploadedFile = null;
    } else {
        uploadedFile = file;
        document.getElementById('preview-documents').disabled = false;
    }
};

const previewDocument = () => {
    if (uploadedFile && uploadedFile.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = (event) => {
            Swal.fire({
                title: 'Selected PDF Document',
                html: `<iframe src="${event.target.result}" style="width:100%; min-height:100vh;" frameborder="0"></iframe>`,
                icon: 'info',
                showCloseButton: true,
                focusConfirm: false,
                confirmButtonText: 'Close',
                customClass: { popup: "swal-pdf-viewer" }
            });
        };
        reader.readAsDataURL(uploadedFile);
    } else {
        Swal.fire({ icon: 'error', title: 'No Valid File', text: 'Please select a valid PDF document to preview.' });
    }
};

// Date picker setup
const initDatePicker = () => {
    flatpickr("#date-filing", {
        dateFormat: "Y-m-d",
        defaultDate: new Date(),
        allowInput: true,
        altInput: true,
        altFormat: "F j, Y",
        disableMobile: "true"
    });
};

// Check if all required fields are filled
const allFieldsFilled = () => {
    const requiredFields = ['representative-name', 'representative-position-dropdown', 'school-year', 'course-dropdown', 'organization-name-dropdown', 'email-address', 'date-filing'];
    return requiredFields.every(field => document.getElementById(field).value.trim() !== '') && uploadedFile !== null;
};

// Form submission handler
const submitForm = async (event) => {
    event.preventDefault();

    if (!allFieldsFilled()) {
        Swal.fire({ icon: 'warning', title: 'Incomplete Form', text: 'Please fill in all required fields and upload the document.' });
        return;
    }

    showLoading();
    const user = auth.currentUser;

    try {
        const docUrl = await uploadDocument();
        saveFormData(docUrl);
        window.location.href = '../student-profile/list-officers.html';
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Upload Error', text: 'Failed to upload document.' });
    } finally {
        hideLoading();
    }
};

// Upload a single document to Firebase
const uploadDocument = async () => {
    if (!uploadedFile) return '';

    const user = auth.currentUser;
    const fileRef = ref(storage, `documents/${user.uid}/${uploadedFile.name}`);
    try {
        const snapshot = await uploadBytes(fileRef, uploadedFile);
        return await getDownloadURL(snapshot.ref);
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
};

// Add new option dynamically
const addNewOption = (dropdownId, promptText) => {
    Swal.fire({
        title: promptText,
        input: 'text',
        showCancelButton: true,
        inputPlaceholder: promptText
    }).then((result) => {
        if (result.isConfirmed && result.value) {
            const dropdown = document.getElementById(dropdownId);
            const option = document.createElement('option');
            option.value = result.value;
            option.textContent = result.value;
            dropdown.appendChild(option);
            dropdown.value = result.value;
        }
    });
};

// Event listeners
document.getElementById('requirement-documents').addEventListener('change', handleFileSelection);
document.getElementById('preview-documents').addEventListener('click', previewDocument);
document.getElementById('application-form').addEventListener('submit', submitForm);
document.getElementById('add-organization').addEventListener('click', () => addNewOption('organization-name-dropdown', 'Enter the new organization name:'));
document.getElementById('add-position').addEventListener('click', () => addNewOption('representative-position-dropdown', 'Enter the new position name:'));
document.getElementById('add-course').addEventListener('click', () => addNewOption('course-dropdown', 'Enter the new course name:'));

// Initialize on page load
window.addEventListener('load', () => {
    setSchoolYear();
    initDatePicker();
});
