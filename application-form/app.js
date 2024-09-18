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

// Handle form submission
document.getElementById('application-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    const user = auth.currentUser;
    console.log('Current user:', user);
    
    if (!user) {
        console.log('User not authenticated.');
        alert('User not authenticated. Please log in.');
        return;
    }

    console.log('Form submission with user:', user.uid);

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
    const imgFile = document.getElementById('img').files[0];

    console.log('Form values:', {
        representativeName, representativePosition, schoolYear, studentCourse,
        organizationName, accreditationType, emailAddress, dateFiling
    });

    // Prepare data to be stored in Firestore
    const formData = {
        representativeName,
        representativePosition,
        schoolYear,
        studentCourse,
        organizationName,
        accreditationType,
        emailAddress,
        dateFiling,
        documentURLs: [], // Array to hold document URLs
        imageURL: '', // URL for the image
        timestamp: serverTimestamp()
    };

    try {
        // Add data to Firestore (without document URLs initially)
        console.log('Adding document to Firestore');
        const docRef = await addDoc(collection(db, 'accreditation-applications'), formData);
        console.log('Document added with ID:', docRef.id);

        // Handle file upload for supporting documents
        const documentURLs = [];
        for (const file of supportingDocuments) {
            const storageRef = ref(storage, `documents/${file.name}`);
            console.log('Uploading document:', file.name);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            console.log('Document URL:', downloadURL);
            documentURLs.push(downloadURL);
        }

        // Handle file upload for the image
        if (imgFile) {
            const imgStorageRef = ref(storage, `images/${imgFile.name}`);
            console.log('Uploading image:', imgFile.name);
            await uploadBytes(imgStorageRef, imgFile);
            const imgDownloadURL = await getDownloadURL(imgStorageRef);
            console.log('Image URL:', imgDownloadURL);
            formData.imageURL = imgDownloadURL;
        }

        // Update Firestore document with the URLs of the uploaded files
        console.log('Updating Firestore document with URLs');
        await updateDoc(docRef, { documentURLs, imageURL: formData.imageURL });

        // Store form data in localStorage
        localStorage.setItem('applicationFormData', JSON.stringify(formData));

        // Redirect to the next page
        window.location.href = "../student-profile/list-officers.html";

    } catch (error) {
        console.error('Error submitting form:', error.message);
        alert('Failed to submit the form. Please try again.');
    }
});
