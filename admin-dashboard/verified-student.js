// Firebase Imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, updateDoc, query, where, onSnapshot } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js';

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDXQCFoaCSWsCV2JI7wrOGZPKEpQuNzENA",
    authDomain: "student-org-5d42a.firebaseapp.com",
    projectId: "student-org-5d42a",
    storageBucket: "student-org-5d42a.appspot.com",
    messagingSenderId: "1073695504078",
    appId: "1:1073695504078:web:eca07da6a1563c46e0829f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Utility Functions
const showAlert = (icon, title, message) => {
    Swal.fire({
        icon,
        title,
        html: message,  // Changed to 'html' to allow <br> tags for line breaks
        customClass: 'swal-pop-up'
    });
};

const isValidStudentID = (studentID) => /^\d{3}-\d{4}-\d{6}$/.test(studentID);

function formatStudentId(event) {
    let input = event.target.value.replace(/\D/g, '');
    if (input.length > 3) input = input.substring(0, 3) + '-' + input.substring(3);
    if (input.length > 8) input = input.substring(0, 8) + '-' + input.substring(8);
    event.target.value = input;
}

// Firestore Operations
const addStudentToFirestore = async (studentID, storagePath) => {
    await addDoc(collection(db, "unverified-requests"), { 
        studentID, 
        storagePath, 
        status: "pending",
        uploadedAt: new Date()
    });
};

const deleteStudentFromFirestore = async (studentID) => {
    const studentRef = query(collection(db, "unverified-requests"), where("studentID", "==", studentID));
    const querySnapshot = await getDocs(studentRef);
    for (const doc of querySnapshot.docs) {
        await deleteDoc(doc.ref);
    }
};

const verifyStudentInFirestore = async (studentID) => {
    const studentRef = query(collection(db, "unverified-requests"), where("studentID", "==", studentID));
    const querySnapshot = await getDocs(studentRef);

    if (!querySnapshot.empty) {
        const studentDoc = querySnapshot.docs[0];
        await updateDoc(studentDoc.ref, { status: "verified" });  // Update the student's status to 'verified'
    } else {
        showAlert("error", "Error", "Student not found.");
    }
};

// DOM Manipulation
const addStudentToTable = (studentID, storagePath, status) => {
    const tableBody = document.getElementById("student-table-body");
    const storageBaseUrl = "https://firebasestorage.googleapis.com/v0/b/student-org-5d42a.appspot.com/o/"; // Base URL for Firebase Storage
    const imageUrl = encodeURIComponent(storagePath); // Make sure the storage path is correctly encoded
    const fullImageUrl = `${storageBaseUrl}${imageUrl}?alt=media`; // Construct the full URL

    const newRow = document.createElement("tr");
    newRow.innerHTML = `
        <td><img src="${fullImageUrl}" alt="Student Image" width="60" height="60"></td>
        <td>${studentID}</td>
        <td>${status}</td>
        <td>
            <button class="view-btn" onclick="viewStudent('${studentID}', '${fullImageUrl}')">
                <i class="fas fa-eye"></i> View
            </button>
        </td>
        <td>
            <button class="delete-btn" onclick="deleteStudent('${studentID}')">
                <i class="fas fa-trash"></i> Delete
            </button>
        </td>
    `;
    tableBody.appendChild(newRow);
};

const viewStudent = (studentID, imageUrl) => {
    Swal.fire({
        title: `Student ID: ${studentID}`,
        imageUrl: imageUrl,
        imageAlt: 'Student Image',
        showCancelButton: true,
        confirmButtonText: 'Verify Student',
        cancelButtonText: 'Close',
        imageWidth: 400,  // Set fixed width for the image
        imageHeight: 400, // Set fixed height for the image
        customClass: 'swal-verified',
        preConfirm: async () => {
            try {
                // Verify the student only when the user confirms the verification
                await verifyStudentInFirestore(studentID);
                
                // After verification, update the table status and hide the "View" button
                updateStudentStatusInTable(studentID, "verified");

                // Show success alert after verification
                showAlert("success", "Success", "Student verified successfully!");
            } catch (error) {
                // Handle errors during the verification process
                showAlert("error", "Error", "Verification failed. Please try again.");
            }
        }
    });
};
// Delete student function
const deleteStudent = async (studentID) => {
    try {
        await deleteStudentFromFirestore(studentID);

        const rows = document.querySelectorAll("#student-table-body tr");
        rows.forEach(row => {
            if (row.cells[1].textContent === studentID) row.remove();
        });

        showAlert("success", "Success", "Student ID deleted successfully!");
    } catch (error) {
        console.error("Error deleting student:", error);
        showAlert("error", "Error", "Could not delete student. Please try again.");
    }
};

// Update student status in the table (without removing)
const updateStudentStatusInTable = (studentID, newStatus) => {
    const rows = document.querySelectorAll("#student-table-body tr");
    rows.forEach(row => {
        if (row.cells[1].textContent === studentID) {
            row.cells[2].textContent = newStatus;  // Update status column
            
            // Conditionally hide the "View" button only if the status is "verified"
            const viewButton = row.querySelector(".view-btn");
            if (newStatus === "verified") {
            } else {
                viewButton.style.display = "inline-block"; // Ensure the "View" button is visible if not verified
            }
        }
    });
};

// Upload student file and get the URL
const uploadStudentFile = async (studentID, file) => {
    const fileRef = ref(storage, `unverified-ids/${studentID}.jpg`);  // Path in Firebase Storage
    await uploadBytes(fileRef, file);  // Upload the file to Firebase
    const fileUrl = await getDownloadURL(fileRef);  // Get the file's public URL
    return fileUrl;
};

// Add student to Firestore and table
const addStudent = async () => {
    const studentID = document.getElementById("student-id").value.trim();
    const fileInput = document.getElementById("file-upload");
    const file = fileInput.files[0];

    if (!studentID || !file || !isValidStudentID(studentID)) {
        return showAlert("error", "Error", "Please enter a valid student ID and upload a file.");
    }

    try {
        const fileUrl = await uploadStudentFile(studentID, file);
        await addStudentToFirestore(studentID, fileUrl);
        addStudentToTable(studentID, fileUrl, "pending");
        showAlert("success", "Success", "Student added successfully!");
        document.getElementById("student-id").value = "";
        document.getElementById("file-upload").value = "";
    } catch (error) {
        console.error("Error adding student:", error);
        showAlert("error", "Error", "Could not add student. Please try again.");
    }
};

// Real-time listener for changes in Firestore (unverified-requests)
const listenForStudentUpdates = () => {
    const studentRef = collection(db, "unverified-requests");

    onSnapshot(studentRef, (querySnapshot) => {
        const tableBody = document.getElementById("student-table-body");
        tableBody.innerHTML = '';  // Clear the existing table body

        querySnapshot.forEach((doc) => {
            const { studentID, storagePath, status } = doc.data();
            addStudentToTable(studentID, storagePath, status);  // Add each document to the table
        });
    });
};

// Start listening for real-time updates
window.onload = () => {
    listenForStudentUpdates();  // Set up real-time listener for updates
};

// Expose functions to global scope
window.addStudent = addStudent;
window.formatStudentId = formatStudentId;
window.deleteStudent = deleteStudent;
window.viewStudent = viewStudent;
