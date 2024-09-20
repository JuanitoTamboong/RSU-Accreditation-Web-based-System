// Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, query, where, doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

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

let tempProfiles = JSON.parse(localStorage.getItem('tempProfiles')) || [];

// Authentication state listener
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "../index.html";
    }
});

// Load profiles from localStorage on page load
window.addEventListener('load', function() {
    tempProfiles = JSON.parse(localStorage.getItem('tempProfiles')) || [];
    updateTable(tempProfiles);
});

// Show the loading spinner
function showLoading() {
    document.getElementById("loading").style.display = "flex";
}

// Hide the loading spinner
function hideLoading() {
    document.getElementById("loading").style.display = "none";
}

// Event listeners
document.getElementById('img').addEventListener('change', handleImageUpload);
document.querySelector('.add-btn').addEventListener('click', addProfile);
document.querySelector('.submit-btn button').addEventListener('click', submitAllProfiles);
document.getElementById('search-input').addEventListener('input', searchProfiles);
document.getElementById('student-id').addEventListener('input', studentIdNo);

// Student ID formatting
function studentIdNo(event) {
    let input = event.target.value.replace(/\D/g, '');
    if (input.length > 3) {
        input = input.substring(0, 3) + '-' + input.substring(3);
    }
    if (input.length > 8) {
        input = input.substring(0, 8) + '-' + input.substring(8);
    }
    event.target.value = input;
}

// Handle image upload and preview
async function handleImageUpload(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('image-preview');
    const uploadText = document.getElementById('upload-text');

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
            uploadText.style.display = 'none';
        };
        reader.readAsDataURL(file);
    } else {
        preview.style.display = 'none';
        uploadText.style.display = 'block';
    }
}

// Upload image to Firebase Storage
async function uploadImage(file) {
    const storageRef = ref(storage, `images/${file.name}`);
    try {
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
    } catch (error) {
        console.error("Error uploading image: ", error);
        return null;
    }
}

// Add a new profile to the temporary list
async function addProfile() {
    const studentId = document.getElementById('student-id').value;
    const name = document.getElementById('name').value;
    const address = document.getElementById('address').value;
    const file = document.getElementById('img').files[0];

    // Check if all fields are filled, including the image
    if (!studentId || !name || !address || !file) {
        alert("Please fill in all fields, including the image upload.");
        return;
    }

    // Validate Student ID format
    const idFormat = /^\d{3}-\d{4}-\d{6}$/; // Adjust this pattern based on your ID format
    if (!idFormat.test(studentId)) {
        alert("Student ID are not complete");
        return;
    }

    // Check for duplicate Student ID in temporary profiles
    if (tempProfiles.some(profile => profile.studentId === studentId)) {
        alert("A profile with this Student ID already exists in the temporary table.");
        return;
    }

    // Upload image to Firebase
    const imageUrl = await uploadImage(file);
    if (!imageUrl) {
        alert("Failed to upload image. Please try again.");
        return;
    }

    const newProfile = { studentId, name, address, imageUrl };
    tempProfiles.push(newProfile);
    localStorage.setItem('tempProfiles', JSON.stringify(tempProfiles));
    updateTable(tempProfiles);
    alert("Profile added successfully!");
    clearStudentProfileForm();
}

// Update the table with the profiles
function updateTable(profiles) {
    const tableBody = document.querySelector('table tbody');
    tableBody.innerHTML = ''; // Clear the table

    profiles.forEach(profile => {
        const { studentId, name, address, imageUrl } = profile;
        const row = document.createElement('tr');

        row.innerHTML = `
            <td><img src="${imageUrl || ''}" alt="${name}" style="width: 100px; height: 100px; object-fit:contain"></td>
            <td>${studentId}</td>
            <td>${name}</td>
            <td>${address}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Search profiles in Firestore
async function searchProfiles() {
    const searchValue = document.getElementById('search-input').value.toLowerCase();
    const dropdown = document.getElementById('dropdown-list');
    dropdown.innerHTML = ''; // Clear previous results

    if (searchValue.length === 0) {
        dropdown.style.display = 'none'; // Hide dropdown if search input is empty
        return;
    }

    const profilesRef = collection(db, "student-org-applications");
    const q = query(profilesRef, where("name", ">=", searchValue), where("name", "<=", searchValue + '\uf8ff'));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
        const { name } = doc.data();
        const option = document.createElement('div');
        option.classList.add('dropdown-item');
        option.textContent = name;
        option.onclick = () => selectProfile(doc.id);
        dropdown.appendChild(option);
    });

    dropdown.style.display = dropdown.childElementCount > 0 ? 'block' : 'none'; // Show or hide dropdown
}

// Handle selection of a profile from the dropdown
async function selectProfile(selectedId) {
    const profileRef = doc(db, "student-org-applications", selectedId);
    const profileSnapshot = await getDoc(profileRef);

    clearStudentProfileForm();

    if (profileSnapshot.exists()) {
        const { studentId, name, address, imageUrl } = profileSnapshot.data();
        document.getElementById('student-id').value = studentId;
        document.getElementById('name').value = name;
        document.getElementById('address').value = address;

        const preview = document.getElementById('image-preview');
        const uploadText = document.getElementById('upload-text');

        if (imageUrl) {
            preview.src = imageUrl;
            preview.style.display = 'block';
            uploadText.style.display = 'none';
        } else {
            preview.style.display = 'none';
            uploadText.style.display = 'block';
        }
    }

    document.getElementById('search-input').value = ''; // Clear search input
    document.getElementById('dropdown-list').style.display = 'none'; // Hide dropdown
}

// Clear the form for adding/updating profiles
function clearStudentProfileForm() {
    document.getElementById('student-id').value = '';
    document.getElementById('name').value = '';
    document.getElementById('address').value = '';
    document.getElementById('image-preview').style.display = 'none';
    document.getElementById('upload-text').style.display = 'block';
}

// Submit all profiles to Firestore
async function submitAllProfiles() {
    if (tempProfiles.length === 0) {
        alert("No profiles to submit.");
        return;
    }

    try {
        showLoading();
        
        // Load application data from localStorage
        const applicationData = JSON.parse(localStorage.getItem('applicationFormData')) || {};

        for (const profile of tempProfiles) {
            const { studentId, name, address, imageUrl } = profile;

            const profilesRef = collection(db, "student-org-applications");
            const q = query(profilesRef, where("studentId", "==", studentId));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                console.error(`Profile with Student ID ${studentId} already exists in Firestore.`);
                continue; // Skip this profile if it already exists
            }

            // Add the profile along with application data
            await addDoc(profilesRef, {
                studentId,
                name,
                address,
                imageUrl,
                ...applicationData // Include the application data here
                
            });
        }

        // Clear temporary profiles and localStorage
        tempProfiles = [];
        localStorage.removeItem('tempProfiles'); 
        updateTable(tempProfiles); // Clear the table
        alert("All profiles and applications submitted successfully!");
    } catch (error) {
        console.error("Error submitting all profiles: ", error);
        alert("Failed to submit profiles.");
    } finally {
        hideLoading();
    }
}
