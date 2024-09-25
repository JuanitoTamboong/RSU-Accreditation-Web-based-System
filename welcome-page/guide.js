document.addEventListener('DOMContentLoaded', function() {
    const guideSelector = document.getElementById('guide-selector');
    const guideList = document.getElementById('guide-list');
    const proceedBtn = document.getElementById('proceed-btn');

    guideSelector.addEventListener('change', function() {
        guideList.innerHTML = ''; // Clear current list items
        proceedBtn.disabled = true; // Disable the proceed button initially

        if (this.value === '') {
            // If no selection, do not proceed
            Swal.fire({
                icon: 'info',
                title: 'Select Accreditation Type',
                text: 'Please select an accreditation type to see the requirements.',
                customClass: "swal-wide",
            });
            return;
        }

        const guideItems = this.value === 'new-organization' ? [
            "Accomplish the application",
            "Letter of application stating the purpose of accreditation",
            "Recommendation from the SSC President",
            "List of officers and their respective positions",
            "Letter of invitation to chosen faculty adviser",
            "Faculty adviser’s letter of acceptance of responsibility",
            "Proposed activities and project for one year",
            "Constitution and By-laws (include Anti-Hazing)",
            "Parent’s Consent (For Fraternity/Sorority)",
            "Documents should be submitted in four copies"
        ] : [
            "Accomplish the application form (Re-Accreditation)",
            "Letter of application stating the purpose of accreditation",
            "Recommendation from the SSC President",
            "List of officers and their respective positions",
            "Letter of invitation to chosen faculty adviser",
            "Faculty adviser’s letter of acceptance",
            "Photocopy of Certificate of Recognition",
            "Photo of certificate of attendance",
            "Financial statement for the previous year",
            "Proposed activities and project for one year",
            "Constitution and By-laws (include Anti-Hazing)",
            "Parent’s Consent (For Fraternity/Sorority)"
        ];

        addGuideItems(guideItems);
    });

    function addGuideItems(items) {
        items.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<input type="checkbox" class="guide-checkbox"> ${item}`;
            guideList.appendChild(li);
        });
        enableCheckboxes(); // Attach change event listener for checkboxes
    }

    function enableCheckboxes() {
        const checkboxes = document.querySelectorAll('.guide-checkbox');
        checkboxes.forEach((checkbox) => {
            checkbox.addEventListener('change', function() {
                const atLeastOneChecked = Array.from(checkboxes).some(cb => cb.checked);
                proceedBtn.disabled = !atLeastOneChecked; // Enable button if at least one is checked
            });
        });
    }

    proceedBtn.addEventListener('click', function() {
        const checkboxes = document.querySelectorAll('.guide-checkbox');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);

        if (!allChecked) {
            Swal.fire({
                icon: 'error',
                title: 'Incomplete Requirements',
                text: 'Please complete all requirements before proceeding.',
                customClass: "swal-wide",
            });
        } else {
            const selectedOption = guideSelector.value;
            const redirectUrl = selectedOption === 'new-organization'
                ? '../application-form/homepage.html'
                : '../student-profile/list-officers.html';
            window.location.href = redirectUrl;
        }
    });
});
