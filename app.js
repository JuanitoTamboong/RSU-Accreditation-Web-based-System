import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, updateDoc, doc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDXQCFoaCSWsCV2JI7wrOGZPKEpQuNzENA",
    authDomain: "student-org-5d42a.firebaseapp.com",
    databaseURL: "https://student-org-5d42a-default-rtdb.firebaseio.com",
    projectId: "student-org-5d42a",
    storageBucket: "student-org-5d42a.appspot.com",
    messagingSenderId: "1073695504078",
    appId: "1:1073695504078:web:eca07da6a1563c46e0829f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Handle form submission
document.getElementById('application-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    // Get form values
    const representativeName = document.getElementById('representative-name').value;
    const representativePosition = document.getElementById('representative-position').value;
    const yearCourse = document.getElementById('year-course').value;
    const organizationName = document.getElementById('organization-name').value;
    const accreditationType = document.getElementById('accreditation-type').value;
    const contactNumber = document.getElementById('contact-number').value;
    const emailAddress = document.getElementById('email-address').value;
    const dateFiling = document.getElementById('date-filing').value;
    const supportingDocuments = document.getElementById('supporting-documents').files;

    // Basic validation
    if (!representativeName || !representativePosition || !yearCourse || !organizationName || !accreditationType || !contactNumber || !emailAddress || !dateFiling || supportingDocuments.length === 0) {
        alert('Please fill in all fields.');
        return;
    }

    // Prepare data to be stored in Firestore
    const formData = {
        representativeName,
        representativePosition,
        yearCourse,
        organizationName,
        accreditationType,
        contactNumber,
        emailAddress,
        dateFiling,
        documentURLs: [], // Array to hold document URLs
        timestamp: serverTimestamp()
    };

    try {
        // Add data to Firestore
        const docRef = await addDoc(collection(db, 'accreditation-applications'), formData);

        // Handle file upload
        const documentURLs = []; // Array to hold URLs of uploaded documents

        for (const file of supportingDocuments) {
            const storageRef = ref(storage, `documents/${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            // Add document URL to the array
            documentURLs.push(downloadURL);
        }

        // Update Firestore document with the array of URLs
        await updateDoc(docRef, {
            documentURLs: documentURLs
        });

        alert('Application submitted successfully!');
        document.getElementById('application-form').reset(); // Clear the form

        // Update checklist
        document.getElementById('checklist-container').style.display = 'block';
        document.getElementById('name-checkbox').checked = true;
        document.getElementById('position-checkbox').checked = true;
        document.getElementById('course-checkbox').checked = true;
        document.getElementById('organization-checkbox').checked = true;
        document.getElementById('accreditation-checkbox').checked = true;
        document.getElementById('contact-checkbox').checked = true;
        document.getElementById('email-checkbox').checked = true;
        document.getElementById('date-checkbox').checked = true;
        document.getElementById('document-checkbox').checked = true;

        // Display uploaded document URLs
        const documentList = document.getElementById('document-list');
        documentList.innerHTML = ''; // Clear existing list
        documentURLs.forEach(url => {
            const listItem = document.createElement('li');
            listItem.textContent = url;
            documentList.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error submitting application:', error);
        alert('Failed to submit application. Please try again.');
    }
});
