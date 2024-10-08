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
        alert("Student ID format is invalid. Please use the format XXX-XXXX-XXXXXX.");
        return;
    }

    // Check for duplicate Student ID in temporary profiles
    if (tempProfiles.some(profile => profile.studentId === studentId)) {
        alert("A profile with this Student ID already exists in the temporary table.");
        return;
    }

    // Check for duplicate Student ID in Firestore
    const profilesRef = collection(db, "student-org-applications");
    const q = query(profilesRef, where("studentId", "==", studentId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        alert("A profile with this Student ID already exist");
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

// Clear profiles when the clear icon is clicked
document.getElementById('clear-profiles').addEventListener('click', function() {
    if (confirm("Are you sure you want to clear all added profiles?")) {
        tempProfiles = []; // Clear the temporary profiles array
        localStorage.removeItem('tempProfiles'); // Clear localStorage
        updateTable(tempProfiles); // Refresh the table
        alert("All profiles cleared.");
    }
});

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
//search profiles
async function searchProfiles() {
    const searchValue = document.getElementById('search-input').value.toLowerCase();
    const dropdown = document.getElementById('dropdown-list');
    dropdown.innerHTML = ''; // Clear previous results

    if (searchValue.length === 0) {
        dropdown.style.display = 'none'; // Hide dropdown if search input is empty
        return;
    }

    // Filter through tempProfiles to find matches
    const filteredProfiles = tempProfiles.filter(profile =>
        profile.name.toLowerCase().includes(searchValue)
    );

    filteredProfiles.forEach((profile, index) => {
        const option = document.createElement('div');
        option.classList.add('dropdown-item');
        option.textContent = profile.name;
        option.onclick = () => selectProfile(index); // Pass the index of the profile
        dropdown.appendChild(option);
    });

    dropdown.style.display = dropdown.childElementCount > 0 ? 'block' : 'none'; // Show or hide dropdown
}

// Handle selection of a profile from the dropdown
function selectProfile(index) {
    clearStudentProfileForm(); // Clear the form first
    const profile = tempProfiles[index]; // Get the selected profile

    document.getElementById('student-id').value = profile.studentId;
    document.getElementById('name').value = profile.name;
    document.getElementById('address').value = profile.address;

    const preview = document.getElementById('image-preview');
    const uploadText = document.getElementById('upload-text');

    if (profile.imageUrl) {
        preview.src = profile.imageUrl;
        preview.style.display = 'block';
        uploadText.style.display = 'none';
    } else {
        preview.style.display = 'none';
        uploadText.style.display = 'block';
    }

    document.getElementById('search-input').value = ''; // Clear search input
    document.getElementById('dropdown-list').style.display = 'none'; // Hide dropdown
}

// Clear the form for adding/updating profiles
function clearStudentProfileForm() {
    document.getElementById('student-id').value = '';
    document.getElementById('name').value = '';
    document.getElementById('address').value = '';
    document.getElementById('img').value = '';
    document.getElementById('image-preview').style.display = 'none';
    document.getElementById('upload-text').style.display = 'block';
}

// Update the selected profile in the list
function updateProfile() {
    const studentId = document.getElementById('student-id').value;
    const name = document.getElementById('name').value;
    const address = document.getElementById('address').value;
    const imageUrl = document.getElementById('image-preview').src;

    // Validate that a profile exists to update
    const index = tempProfiles.findIndex(profile => profile.studentId === studentId);

    if (index !== -1) {
        // Update the profile details
        tempProfiles[index].name = name;
        tempProfiles[index].address = address;
        tempProfiles[index].imageUrl = imageUrl;

        // Refresh the displayed list of profiles
        updateTable(tempProfiles);
        
        // Clear the form
        clearStudentProfileForm();
        alert('Profile updated successfully!'); // Inform the user
    } else {
        alert('Profile not found!'); // Alert if no matching profile is found
    }
}
// Add this event listener to your script to trigger the updateProfile function when the Update button is clicked
document.querySelector('.update-btn').addEventListener('click', updateProfile);


// Submit all profiles to Firestore
async function submitAllProfiles() {
    if (tempProfiles.length === 0) {
        alert("No profiles to submit.");
        return;
    }

    try {
        showLoading();

        const user = auth.currentUser;
        if (!user) {
            alert("User is not authenticated.");
            hideLoading();
            return;
        }

        // Load application data (t2) from localStorage for the authenticated user
        const applicationData = JSON.parse(localStorage.getItem(`applicationFormData_${user.uid}`)) || {};

        // Check for duplicate Student IDs in Firestore for the temporary profiles
        for (const profile of tempProfiles) {
            const { studentId } = profile;
            const profilesRef = collection(db, "student-org-applications");
            const q = query(profilesRef, where("studentId", "==", studentId));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                alert(`A profile with Student ID ${studentId} already exists in Firestore. Submission aborted.`);
                hideLoading();
                return;
            }
        }

        // Combine application data and profiles
        const combinedData = {
            applicationDetails: applicationData,  // Data from the application form
            profiles: tempProfiles  // Temp profiles stored locally
        };

        // Reference to Firestore collection (using 'student-org-applications')
        const profilesRef = collection(db, "student-org-applications");

        // Add the combined data (profiles + application data) as one document in Firestore
        await addDoc(profilesRef, combinedData);
        console.log("All profiles and application data saved in one document.");

        // Clear temporary profiles and localStorage after successful submission
        tempProfiles = [];
        localStorage.removeItem('tempProfiles');
        localStorage.removeItem(`applicationFormData_${user.uid}`);
        updateTable(tempProfiles); // Update the table after clearing profiles

        alert("All profiles and application data submitted successfully! and please your email");
        window.location.href = "../index.html"; // Redirect after submission
    } catch (error) {
        console.error("Error submitting profiles and application data: ", error);
        alert("Error submitting profiles and application data. Please try again.");
    } finally {
        hideLoading();
    }
}