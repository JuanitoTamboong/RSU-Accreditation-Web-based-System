import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

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

async function fetchApplications() {
    try {
        const querySnapshot = await getDocs(collection(db, 'accreditation-applications'));
        const applicationsList = document.getElementById('applications-list');
        applicationsList.innerHTML = ''; // Clear existing list
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <p><strong>Representative Name:</strong> ${data.representativeName}</p>
                <p><strong>Organization Name:</strong> ${data.organizationName}</p>
                <p><strong>Document URLs:</strong></p>
                <ul>
                    ${data.documentURLs.map(url => `<li><a href="${url}" target="_blank">${url}</a></li>`).join('')}
                </ul>
            `;
            applicationsList.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error fetching applications: ', error);
        const applicationsList = document.getElementById('applications-list');
        applicationsList.innerHTML = '<p>Error fetching applications. Please try again later.</p>';
    }
}

fetchApplications();