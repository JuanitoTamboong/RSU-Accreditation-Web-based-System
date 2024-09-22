document.addEventListener('DOMContentLoaded', function() {
    const guideSelector = document.getElementById('guide-selector');
    const guideList = document.getElementById('guide-list');
    const proceedBtn = document.getElementById('proceed-btn');

    guideSelector.addEventListener('change', function() {
        guideList.innerHTML = ''; // Clear current list items
        proceedBtn.disabled = true; // Disable the proceed button initially

        // Populate the guide list based on the selected accreditation type
        if (this.value === 'new-organization') {
            guideList.innerHTML = `
                <li><input type="checkbox" class="guide-checkbox"> Accomplish the application</li>
                <li><input type="checkbox" class="guide-checkbox"> Letter of application stating the purpose of accreditation</li>
                <li><input type="checkbox" class="guide-checkbox"> Recommendation from the SSC President</li>
                <li><input type="checkbox" class="guide-checkbox"> List of officers and their respective positions</li>
                <li><input type="checkbox" class="guide-checkbox"> Letter of invitation to chosen faculty adviser</li>
                <li><input type="checkbox" class="guide-checkbox"> Faculty adviser’s letter of acceptance of responsibility</li>
                <li><input type="checkbox" class="guide-checkbox"> Proposed activities and project for one year</li>
                <li><input type="checkbox" class="guide-checkbox"> Constitution and By-laws (include Anti-Hazing)</li>
                <li><input type="checkbox" class="guide-checkbox"> Parent’s Consent (For Fraternity/Sorority)</li>
                <li><input type="checkbox" class="guide-checkbox"> Documents should be submitted in four copies</li>
            `;
        } else if (this.value === 're-accreditation') {
            guideList.innerHTML = `
                <li><input type="checkbox" class="guide-checkbox"> Accomplish the application form (Re-Accreditation)</li>
                <li><input type="checkbox" class="guide-checkbox"> Letter of application stating the purpose of accreditation</li>
                <li><input type="checkbox" class="guide-checkbox"> Recommendation from the SSC President</li>
                <li><input type="checkbox" class="guide-checkbox"> List of officers and their respective positions</li>
                <li><input type="checkbox" class="guide-checkbox"> Letter of invitation to chosen faculty adviser</li>
                <li><input type="checkbox" class="guide-checkbox"> Faculty adviser’s letter of acceptance</li>
                <li><input type="checkbox" class="guide-checkbox"> Photocopy of Certificate of Recognition</li>
                <li><input type="checkbox" class="guide-checkbox"> Photo of certificate of attendance</li>
                <li><input type="checkbox" class="guide-checkbox"> Financial statement for the previous year</li>
                <li><input type="checkbox" class="guide-checkbox"> Proposed activities and project for one year</li>
                <li><input type="checkbox" class="guide-checkbox"> Constitution and By-laws (include Anti-Hazing)</li>
                <li><input type="checkbox" class="guide-checkbox"> Parent’s Consent (For Fraternity/Sorority)</li>
            `;
        }
        enableProceedButton(); // Call function to check checkboxes
    });

    function enableProceedButton() {
        const checkboxes = document.querySelectorAll('.guide-checkbox');

        checkboxes.forEach((checkbox) => {
            checkbox.addEventListener('change', function() {
                // Check if all checkboxes are checked
                const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                proceedBtn.disabled = !allChecked; // Enable button if all are checked
            });
        });
    }

    proceedBtn.addEventListener('click', function() {
        const checkboxes = document.querySelectorAll('.guide-checkbox');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);

        if (!allChecked) {
            // Show SweetAlert if not all checkboxes are checked
            Swal.fire({
                icon: 'error',
                title: 'Incomplete Requirements',
                text: 'Please complete all requirements before proceeding.'
            });
        } else {
            const selectedOption = guideSelector.value;
            // Redirect based on selection
            if (selectedOption === 'new-organization') {
                window.location.href = '../application-form/homepage.html';
            } else if (selectedOption === 're-accreditation') {
                window.location.href = '../student-profile/list-officers.html';
            }
        }
    });
});
