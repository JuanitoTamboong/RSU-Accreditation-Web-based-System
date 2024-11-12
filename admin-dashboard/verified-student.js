// Firebase Imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getFirestore, collection, addDoc, query, where, getDocs, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCZbPRkZ7acdO0mx9_sfotDjueh4YioYwM",
    authDomain: "admin-9ee84.firebaseapp.com",
    projectId: "admin-9ee84",
    storageBucket: "admin-9ee84.firebasestorage.app",
    messagingSenderId: "65720582473",
    appId: "1:65720582473:web:48f63f7d4d100d65039a98"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
const isStudentIDExist = async (studentID) => {
    const q = query(collection(db, "verified-students"), where("studentID", "==", studentID));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
};

const addStudentToFirestore = async (studentID, studentName) => {
    await addDoc(collection(db, "verified-students"), { studentName, studentID, status: "Verified" });
};

const deleteStudentFromFirestore = async (studentID) => {
    const studentRef = query(collection(db, "verified-students"), where("studentID", "==", studentID));
    const querySnapshot = await getDocs(studentRef);
    for (const doc of querySnapshot.docs) {
        await deleteDoc(doc.ref);
    }
};

// DOM Manipulation
const addStudentToTable = (studentID, studentName, status) => {
    const tableBody = document.getElementById("student-table-body");
    const newRow = document.createElement("tr");
    newRow.innerHTML = `
        <td>${studentName}</td>
        <td>${studentID}</td>
        <td>${status}</td>
        <td>
            <button class="delete-btn" onclick="deleteStudent('${studentID}')">
                <i class="fas fa-trash"></i> Delete
            </button>
        </td>
    `;
    tableBody.appendChild(newRow);
};

// Main Functions
const addStudent = async () => {
    const studentName = document.getElementById("student-name").value.trim();
    const studentID = document.getElementById("student-id").value.trim();

    if (!studentName || !studentID || !isValidStudentID(studentID)) {
        return showAlert("error", "Error", "Please enter a valid student name and ID in the format xxx-xxxx-xxxxxx.");
    }

    if (await isStudentIDExist(studentID)) {
        return showAlert("error", "Error", "This student ID already exists.");
    }

    try {
        await addStudentToFirestore(studentID, studentName);
        addStudentToTable(studentID, studentName, "Verified");
        showAlert("success", "Success", "Student added successfully!");
        document.getElementById("student-name").value = "";
        document.getElementById("student-id").value = "";
    } catch (error) {
        console.error("Error adding student:", error);
        showAlert("error", "Error", "Could not add student. Please try again.");
    }
};

// Import student list function with duplicate import check
let isImporting = false;  // Track if the import process is already happening

const importStudentList = () => {
    // Prevent multiple imports at once
    if (isImporting) {
        return showAlert("warning", "Warning", "The CSV file is already being imported.");
    }

    const fileInput = document.getElementById("file-input");
    if (!fileInput.files.length) return showAlert("error", "Error", "Please select a CSV file to import.");

    const reader = new FileReader();
    reader.onload = async (e) => {
        // Set importing flag to true to prevent duplicate imports
        isImporting = true;

        const rows = e.target.result.split('\n').map(row => row.trim()); // Trim all rows to avoid unnecessary spaces
        let invalidIDs = [], missingData = [], successfulImports = [], duplicateIDs = [];

        // Iterate over each row in the CSV
        for (const row of rows) {
            // Skip empty rows
            if (!row) continue;

            const [studentName, studentID] = row.split(',').map(field => field?.trim()); // Trim each field

            // Validate data in the CSV row
            if (!studentName || !studentID) {
                missingData.push(`Missing data in row: ${row}`);
                continue;
            }

            // Check if student ID has a valid format
            if (!isValidStudentID(studentID)) {
                invalidIDs.push(`Invalid format: ${studentID} for ${studentName}`);
                continue;
            }

            // Check if the student already exists (avoiding duplicates)
            if (await isStudentIDExist(studentID)) {
                duplicateIDs.push(`Duplicate: ${studentName} (${studentID})`);
                continue;
            }

            // Add student to Firestore and update the table
            try {
                await addStudentToFirestore(studentID, studentName);
                addStudentToTable(studentID, studentName, "Verified");
                successfulImports.push(`Added: ${studentName} (${studentID})`);
            } catch (error) {
                console.error("Error importing student:", error);
                showAlert("error", "Error", "Some students could not be added. Check console for details.");
                return;
            }
        }

        // Show alerts for different results
        if (invalidIDs.length || missingData.length || duplicateIDs.length) {
            showAlert('error', 'Import Errors', invalidIDs.concat(missingData).concat(duplicateIDs).join('<br>'));
        }
        if (successfulImports.length) {
            showAlert('success', 'Import Success', successfulImports.join('<br>'));
        }

        // Clear the file input and reset the import flag after the import process
        fileInput.value = "";  // Clear file input after import
        isImporting = false;   // Reset the flag to allow further imports
    };
    reader.readAsText(fileInput.files[0]);
};

// Delete student function
const deleteStudent = async (studentID) => {
    try {
        await deleteStudentFromFirestore(studentID);

        const rows = document.querySelectorAll("#student-table-body tr");
        rows.forEach(row => {
            if (row.cells[1].textContent === studentID) row.remove();
        });

        showAlert("success", "Success", "Student deleted successfully!");
    } catch (error) {
        console.error("Error deleting student:", error);
        showAlert("error", "Error", "Could not delete student. Please try again.");
    }
};

// Load existing students when the page loads
window.onload = async () => {
    const querySnapshot = await getDocs(collection(db, "verified-students"));
    querySnapshot.forEach(doc => {
        const { studentID, studentName, status } = doc.data();
        addStudentToTable(studentID, studentName, status);
    });
};

// Expose functions to global scope
window.addStudent = addStudent;
window.importStudentList = importStudentList;
window.formatStudentId = formatStudentId;
window.deleteStudent = deleteStudent;
