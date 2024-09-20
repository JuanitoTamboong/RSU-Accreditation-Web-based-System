import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

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
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth();

// Authentication state listener
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "../index.html";
    }
});


// Function to show the loading spinner
function showLoading() {
    document.getElementById("loading").style.display = "flex";
}

// Function to hide the loading spinner
function hideLoading() {
    document.getElementById("loading").style.display = "none";
}

// Function to save form data to localStorage
function saveFormData() {
    const formData = {
        representativeName: document.getElementById('representative-name').value,
        representativePosition: document.getElementById('representative-position').value,
        schoolYear: document.getElementById('school-year').value,
        studentCourse: document.getElementById('course').value,
        organizationName: document.getElementById('organization-name').value,
        accreditationType: document.getElementById('accreditation-type').value,
        emailAddress: document.getElementById('email-address').value,
        dateFiling: document.getElementById('date-filing').value
    };

    localStorage.setItem('applicationFormData', JSON.stringify(formData));
}

// Function to load form data from localStorage
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
    }
}

// Load the form data when the page loads
window.addEventListener('load', function() {
    loadFormData();
});

// Save form data to localStorage on input change
document.querySelectorAll('#application-form input, #application-form select').forEach(input => {
    input.addEventListener('input', saveFormData);
});

// Handle form submission
document.getElementById('application-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    // Show loading spinner
    showLoading();

    const user = auth.currentUser;
    if (!user) {
        alert('User not authenticated. Please log in.');
        hideLoading(); 
        return;
    }

    // Get form values
    const representativeName = document.getElementById('representative-name').value;
    const representativePosition = document.getElementById('representative-position').value;
    const schoolYear = document.getElementById('school-year').value;
    const studentCourse = document.getElementById('course').value;
    const organizationName = document.getElementById('organization-name').value;
    const accreditationType = document.getElementById('accreditation-type').value;
    const emailAddress = document.getElementById('email-address').value;
    const dateFiling = document.getElementById('date-filing').value;
    const supportingDocuments = document.getElementById('supporting-documents').files;

    // Prepare data for Firestore
    const formData = {
        representativeName,
        representativePosition,
        schoolYear,
        studentCourse,
        organizationName,
        accreditationType,
        emailAddress,
        dateFiling,
        documentURLs: [],
        timestamp: serverTimestamp()
    };

    try {
        // Add form data to Firestore
        const docRef = await addDoc(collection(db, 'accreditation-applications'), formData);

        // Handle file uploads for supporting documents
        const documentURLs = [];
        for (const file of supportingDocuments) {
            const storageRef = ref(storage, `documents/${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            documentURLs.push(downloadURL);
        }

        // Update Firestore document with document URLs
        await updateDoc(docRef, { documentURLs });

        // Clear the localStorage after successful submission
        localStorage.removeItem('applicationFormData');

        // Redirect to the next page
        window.location.href = "../student-profile/list-officers.html";

    } catch (error) {
        console.error('Error submitting form:', error.message);
        alert('Failed to submit the form. Please try again.');
    } finally {
        hideLoading();
    }
});
