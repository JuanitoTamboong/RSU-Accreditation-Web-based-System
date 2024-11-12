// Firebase Imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getFirestore, collection, addDoc, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCZbPRkZ7acdO0mx9_sfotDjueh4YioYwM",
    authDomain: "admin-9ee84.firebaseapp.com",
    projectId: "admin-9ee84",
    storageBucket: "admin-9ee84.firebasestorage.app",
    messagingSenderId: "65720582473",
    appId: "1:65720582473:web:48f63f7d4d100d65039a98"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to validate the student ID format (xxx-xxxx-xxxxxx)
function isValidStudentID(studentID) {
    const studentIDRegex = /^\d{3}-\d{4}-\d{6}$/;  // Format: xxx-xxxx-xxxxxx
    return studentIDRegex.test(studentID);
}

// Function to format Student ID (xxx-xxxx-xxxxxx)
function formatStudentId(event) {
    let input = event.target.value.replace(/\D/g, '');
    if (input.length > 3) input = input.substring(0, 3) + '-' + input.substring(3);
    if (input.length > 8) input = input.substring(0, 8) + '-' + input.substring(8);
    event.target.value = input;
}

// Function to check if a student ID already exists in Firestore
async function isStudentIDExist(studentID) {
    const q = query(collection(db, "verified-students"), where("studentID", "==", studentID));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty; // Returns true if studentID exists, false otherwise
}

// Function to add a single student ID and name to both the table and Firestore
async function addStudent() {
    const studentNameInput = document.getElementById("student-name");
    const studentIDInput = document.getElementById("student-id");
    const studentID = studentIDInput.value.trim();
    const studentName = studentNameInput.value.trim();

    if (studentID && studentName) {
        // Validate student ID format
        if (!isValidStudentID(studentID)) {
            Swal.fire("Error", "Invalid student ID format. Please use the format xxx-xxxx-xxxxxx.", "error");
            return;
        }

        // Check if student ID already exists in Firestore
        const studentExists = await isStudentIDExist(studentID);
        if (studentExists) {
            Swal.fire("Error", "This student ID already exists.", "error");
            return;
        }

        try {
            // Add the student ID and name to Firestore
            await addDoc(collection(db, "verified-students"), {
                studentName: studentName,
                studentID: studentID,
                status: "Verified"
            });
            addStudentToTable(studentID, studentName, "Verified");
            Swal.fire("Success", "Student added successfully!", "success");
            studentIDInput.value = "";  // Clear the student ID input field
            studentNameInput.value = ""; // Clear the student name input field
        } catch (error) {
            console.error("Error adding student to Firestore:", error);
            Swal.fire("Error", "Could not add student. Please try again.", "error");
        }
    } else {
        Swal.fire("Error", "Please enter a valid student ID and name.", "error");
    }
}

// Function to import student IDs and names from a CSV file and add them to Firestore
function importStudentList() {
    const fileInput = document.getElementById("file-input");
    if (!fileInput.files.length) {
        Swal.fire("Error", "Please select a CSV file to import.", "error");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async function (e) {
        const contents = e.target.result;
        const rows = contents.split('\n');
        
        let invalidIDs = [];
        
        for (const row of rows) {
            const [studentID, studentName] = row.trim().split(',');
            if (studentID && studentName) {
                // Validate student ID format
                if (!isValidStudentID(studentID)) {
                    invalidIDs.push(`Invalid ID format: ${studentID} for ${studentName}`);
                    continue; // Skip invalid entries
                }

                try {
                    // Check if student ID already exists in Firestore
                    const studentExists = await isStudentIDExist(studentID);
                    if (studentExists) {
                        console.log(`Student with ID ${studentID} already exists. Skipping.`);
                        continue; // Skip this student if ID already exists
                    }

                    await addDoc(collection(db, "verified-students"), {
                        studentName: studentName,
                        studentID: studentID,
                        status: "Verified"
                    });
                    addStudentToTable(studentID, studentName, "Verified");
                } catch (error) {
                    console.error("Error adding student to Firestore:", error);
                    Swal.fire("Error", "Some students could not be added. Check the console for more details.", "error");
                    break;
                }
            }
        }
        
        // If there were invalid IDs, show them in a single Swal message
        if (invalidIDs.length > 0) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Student IDs',
                html: invalidIDs.join('<br>'),
            });
        } else {
            Swal.fire("Success", "Students imported successfully!", "success");
        }
    };

    reader.readAsText(file);
}

// Helper function to add a row to the table
function addStudentToTable(studentID, studentName, status) {
    const tableBody = document.getElementById("student-table-body");
    const newRow = document.createElement("tr");
    newRow.innerHTML = `
        <td>${studentName}</td>
        <td>${studentID}</td>
        <td>${status}</td>
    `;
    tableBody.appendChild(newRow);
}

// Function to load students from Firestore when the page is refreshed
async function loadStudents() {
    const querySnapshot = await getDocs(collection(db, "verified-students"));
    querySnapshot.forEach((doc) => {
        const studentData = doc.data();
        addStudentToTable(studentData.studentID, studentData.studentName, studentData.status);
    });
}

// Load students when the page is refreshed
window.onload = loadStudents;

// Expose functions to the global scope for use in HTML
window.addStudent = addStudent;
window.importStudentList = importStudentList;
window.formatStudentId = formatStudentId; // Expose the formatting function to HTML for real-time input formatting
