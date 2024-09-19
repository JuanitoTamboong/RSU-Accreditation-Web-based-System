// Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
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

let tempProfiles = []; // Global variable to keep track of added profiles

// Authentication state listener
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "../index.html";
    }
});

// Show the loading spinner
function showLoading() {
    document.getElementById("loading").style.display = "flex";
}

// Hide the loading spinner
function hideLoading() {
    document.getElementById("loading").style.display = "none";
}

// Event listeners for profile-related buttons
document.getElementById('img').addEventListener('change', handleImageUpload);
document.querySelector('.update-btn').addEventListener('click', updateProfile);
document.querySelector('.add-btn').addEventListener('click', addProfile);
document.querySelector('.submit-btn button').addEventListener('click', submitAllProfiles);
document.getElementById('search-input').addEventListener('input', searchProfiles);

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

        try {
            return await uploadImage(file);
        } catch (error) {
            console.error('Failed to upload image:', error);
            alert('Failed to upload image.');
            return null;
        }
    } else {
        preview.style.display = 'none';
        uploadText.style.display = 'block';
        return null;
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

// Add a new profile to Firestore
async function addProfile() {
    const studentId = document.getElementById('student-id').value;
    const name = document.getElementById('name').value;
    const address = document.getElementById('address').value;
    const file = document.getElementById('img').files[0];

    if (!studentId || !name || !address) {
        alert("Please fill in all fields.");
        return;
    }

    // Check for duplicate Student IDs in the temporary table
    if (tempProfiles.some(profile => profile.studentId === studentId)) {
        alert("A profile with this Student ID already exists in the temporary table.");
        return;
    }

    let imageUrl = null;
    if (file) {
        imageUrl = await handleImageUpload({ target: { files: [file] } });
    }

    // Add profile to the temporary list
    const newProfile = { studentId, name, address, imageUrl };
    tempProfiles.push(newProfile);

    // Update the profiles-container with the new profile
    updateTable(tempProfiles);

    alert("Profile added successfully!");
    clearStudentProfileForm(); // Clear the form after adding
}

// Update the table with the profiles from the temporary list
function updateTable(profiles) {
    const tableBody = document.querySelector('table tbody');
    tableBody.innerHTML = ''; // Clear the table

    profiles.forEach(profile => {
        const { studentId, name, address, imageUrl } = profile;
        const row = document.createElement('tr');

        row.innerHTML = `
            <td><img src="${imageUrl || ''}" alt="${name}" style="width: 100px; height: auto;"></td>
            <td>${studentId}</td>
            <td>${name}</td>
            <td>${address}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Update an existing profile
async function updateProfile() {
    const studentId = document.getElementById('student-id').value;
    const name = document.getElementById('name').value;
    const address = document.getElementById('address').value;
    const file = document.getElementById('img').files[0];

    if (!studentId || !name || !address) {
        alert("Please fill in all fields.");
        return;
    }

    let imageUrl = null;
    if (file) {
        imageUrl = await handleImageUpload({ target: { files: [file] } });
    }

    try {
        showLoading();

        const profilesRef = collection(db, "profiles");
        const q = query(profilesRef, where("studentId", "==", studentId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            alert("Profile not found.");
            return;
        }

        const docId = querySnapshot.docs[0].id;
        const profileDocRef = doc(db, "profiles", docId);

        await updateDoc(profileDocRef, {
            name,
            address,
            ...(imageUrl && { imageUrl })
        });

        alert("Profile updated successfully!");
        clearStudentProfileForm(); // Clear form after update
        await updateTable(docId); // Update the table with the updated profile
    } catch (error) {
        console.error("Error updating profile: ", error);
        alert("Failed to update profile.");
    } finally {
        hideLoading();
    }
}

// Search and display profile in the dropdown
async function searchProfiles() {
    const searchValue = document.getElementById('search-input').value.toLowerCase();
    const dropdown = document.getElementById('dropdown-list');
    dropdown.innerHTML = ''; // Clear previous results

    if (searchValue.length === 0) {
        dropdown.style.display = 'none'; // Hide dropdown if search input is empty
        return;
    }

    const profilesRef = collection(db, "profiles");
    const querySnapshot = await getDocs(profilesRef);

    // Dynamically populate dropdown with matching names
    querySnapshot.forEach((doc) => {
        const { name } = doc.data();
        if (name.toLowerCase().includes(searchValue)) {
            const option = document.createElement('div');
            option.classList.add('dropdown-item');
            option.textContent = name;
            option.onclick = () => selectProfile(name); // Attach click event to select profile
            dropdown.appendChild(option);
        }
    });

    dropdown.style.display = dropdown.childElementCount > 0 ? 'block' : 'none'; // Show or hide dropdown
}

// Handle selection of a profile from the dropdown
async function selectProfile(selectedName) {
    const profilesRef = collection(db, "profiles");
    const querySnapshot = await getDocs(profilesRef);

    // Clear the "Student Profile" section
    clearStudentProfileForm();

    // Populate form with the selected profile's details
    querySnapshot.forEach((doc) => {
        const { studentId, name, address, imageUrl } = doc.data();
        if (name === selectedName) {
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
    });

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

// Submit all profiles from the temporary list to Firestore
async function submitAllProfiles() {
    if (tempProfiles.length === 0) {
        alert("No profiles to submit.");
        return; // Exit the function if there are no profiles to submit
    }

    try {
        showLoading();

        for (const profile of tempProfiles) {
            const { studentId, name, address, imageUrl } = profile;

            // Check for duplicate Student IDs in Firestore
            const profilesRef = collection(db, "profiles");
            const q = query(profilesRef, where("studentId", "==", studentId));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                console.error(`Profile with Student ID ${studentId} already exists in Firestore.`);
                continue; // Skip this profile if it already exists
            }

            // Add profile to Firestore
            try {
                await addDoc(collection(db, "profiles"), { studentId, name, address, imageUrl });
            } catch (error) {
                console.error("Error adding profile to Firestore: ", error);
                alert("Failed to add some profiles to Firestore.");
                return;
            }
        }

        // Clear the temporary profiles list and table
        tempProfiles = [];
        updateTable(tempProfiles); // Clear the table

        alert("All profiles submitted successfully!");
    } catch (error) {
        console.error("Error submitting all profiles: ", error);
        alert("Failed to submit profiles.");
    } finally {
        hideLoading();
    }
}
