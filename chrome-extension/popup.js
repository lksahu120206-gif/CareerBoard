// ─── CONFIG ──────────────────────────────────────────────────────────────────
// Replace these two values with your own Supabase project credentials.
const SUPABASE_URL = 'https://oejvnpkvftkfccofvkqx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_46uZUEYFGgrzXtEnhu-5Mw_t8VkZ0T5';
// ─────────────────────────────────────────────────────────────────────────────

// DOM Elements
const stateLoading = document.getElementById('state-loading');
const stateReady = document.getElementById('state-ready');
const stateSuccess = document.getElementById('state-success');
const fieldRole = document.getElementById('field-role');
const fieldCompany = document.getElementById('field-company');
const statusSelect = document.getElementById('status');
const btnSave = document.getElementById('btn-save');

// On load: Ask content.js to scrape the page
document.addEventListener('DOMContentLoaded', () => {
    stateLoading.style.display = 'block';
    stateReady.style.display = 'none';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "scrape_job" }, (response) => {
            
            stateLoading.style.display = 'none';
            stateReady.style.display = 'block';

            if (chrome.runtime.lastError || !response) {
                console.warn("Could not connect to scraper. You can enter details manually.");
                return;
            }

            // Fill inputs ONLY if the scraper found real text (not blanks or dashes)
            if (response.jobTitle && response.jobTitle !== "—") {
                fieldRole.value = response.jobTitle;
            }
            if (response.company && response.company !== "—") {
                fieldCompany.value = response.company;
            }
        });
    });
});

// On click: Save to Supabase
btnSave.addEventListener('click', async () => {
    const companyName = fieldCompany.value.trim();
    const jobRole = fieldRole.value.trim();
    const jobStatus = statusSelect.value;

    if (!companyName || !jobRole) {
        alert("Please enter both a Job Title and a Company.");
        return;
    }

    btnSave.innerText = "Saving...";
    btnSave.disabled = true;

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/jobs`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                company: companyName,
                role: jobRole,
                status: jobStatus
            })
        });

        if (!response.ok) throw new Error('Database Error');

        // Show Success UI
        stateReady.style.display = 'none';
        stateSuccess.style.display = 'block';
        
    } catch (error) {
        console.error("Save Error:", error);
        btnSave.innerText = "Error - Try Again";
        btnSave.disabled = false;
    }
});