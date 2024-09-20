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
    }
});

// Show/hide loading spinner
function showLoading() {
    document.getElementById("loading").style.display = "flex";
}

function hideLoading() {
    document.getElementById("loading").style.display = "none";
}

// Save form data to localStorage
function saveFormData(docUrls) {
    const formData = {
        representativeName: document.getElementById('representative-name').value,
        representativePosition: document.getElementById('representative-position').value,
        schoolYear: document.getElementById('school-year').value,
        studentCourse: document.getElementById('course').value,
        organizationName: document.getElementById('organization-name').value,
        accreditationType: document.getElementById('accreditation-type').value,
        emailAddress: document.getElementById('email-address').value,
        dateFiling: document.getElementById('date-filing').value,
        documents: docUrls // Store document URLs
    };
    localStorage.setItem('applicationFormData', JSON.stringify(formData));
}

// Load form data from localStorage
function loadFormData() {
    const savedData = JSON.parse(localStorage.getItem('applicationFormData'));
    if (savedData) {
        document.getElementById('representative-name').value = savedData.representativeName || '';
        document.getElementById('representative-position').value = savedData.representativePosition || '';
        document.getElementById('school-year').value = savedData.schoolYear || '';
        document.getElementById('course').value = savedData.studentCourse || '';
        document.getElementById('organization-name').value = savedData.organizationName || '';
        document.getElementById('accreditation-type').value = savedData.accreditationType || '';
        document.getElementById('email-address').value = savedData.emailAddress || '';
        document.getElementById('date-filing').value = savedData.dateFiling || '';

        // Load documents if available
        const documentsList = document.getElementById('documents-list');
        if (savedData.documents && savedData.documents.length > 0) {
            documentsList.innerHTML = savedData.documents.map(docUrl => `<li><a href="${docUrl}" target="_blank">View Document</a></li>`).join('');
        }
    }
}

// Handle document upload and validate size
document.getElementById('requirement-documents').addEventListener('change', async function (event) {
    const files = Array.from(event.target.files);
    const maxSize = 5 * 1024 * 1024; // 5 MB
    const documentUrls = []; // To store the URLs

    for (const file of files) {
        if (file.size <= maxSize && file.type === 'application/pdf') {
            const storageRef = ref(storage, `documents/${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            documentUrls.push(url); // Store the URL of the uploaded file
            console.log('Uploaded Document URL:', url); // Debugging step
        } else {
            alert(`${file.name} exceeds 5MB size or is not a PDF.`);
        }
    }

    // Save valid files to localStorage
    saveFormData(documentUrls);
    loadFormData(); // Refresh the displayed documents
});

// Load data on page load
window.addEventListener('load', loadFormData);

// Save form data on input change
document.querySelectorAll('#application-form input, #application-form select').forEach(input => {
    input.addEventListener('input', () => {
        const savedData = JSON.parse(localStorage.getItem('applicationFormData'));
        const currentDocUrls = savedData ? savedData.documents : [];
        saveFormData(currentDocUrls); // Save document URLs when form data changes
    });
});

// Handle form submission
document.getElementById('application-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    showLoading();

    const user = auth.currentUser;
    if (!user) {
        alert('User not authenticated. Please log in.');
        hideLoading();
        return;
    }

    // Finalize saving the form data including document URLs
    const savedData = JSON.parse(localStorage.getItem('applicationFormData'));
    const currentDocUrls = savedData ? savedData.documents : [];
    saveFormData(currentDocUrls);

    // Redirect to the next page
    window.location.href = '../student-profile/list-officers.html';
    hideLoading();
});
