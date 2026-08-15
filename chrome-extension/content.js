function scrapeLinkedInJob() {
    let jobTitle = "";
    let company = "";

    try {
        // Try multiple selectors for the Title
        const titleSelectors = [
            '.job-details-jobs-unified-top-card__job-title', 
            'h2.job-details-jobs-unified-top-card__job-title', 
            'h1.t-24', 
            '.job-card-container__title'
        ];

        // Try multiple selectors for the Company
        const companySelectors = [
            '.job-details-jobs-unified-top-card__company-name a', 
            '.job-details-jobs-unified-top-card__company-name', 
            '.job-details-jobs-unified-top-card__primary-description a', 
            '.job-card-container__company-name'
        ];

        for (const selector of titleSelectors) {
            const el = document.querySelector(selector);
            if (el && el.innerText.trim()) {
                jobTitle = el.innerText.trim();
                break;
            }
        }

        for (const selector of companySelectors) {
            const el = document.querySelector(selector);
            if (el && el.innerText.trim()) {
                company = el.innerText.trim();
                break; 
            }
        }

        // Clean up text if LinkedIn adds bullet points
        if (company && company.includes('•')) {
            company = company.split('•')[0].trim();
        }

        // FALLBACK: If standard scraping fails, try grabbing from the browser tab title
        if (!jobTitle || !company) {
            const pageTitle = document.title;
            if (pageTitle.includes("hiring")) {
                const parts = pageTitle.split(" hiring ");
                if (parts.length === 2) {
                    company = company || parts[0].trim();
                    jobTitle = jobTitle || parts[1].split(" in ")[0].trim();
                }
            }
        }

    } catch (error) {
        console.error("CareerBoard Scraper Error:", error);
    }

    return { jobTitle, company };
}

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "scrape_job") {
        const data = scrapeLinkedInJob();
        sendResponse(data);
    }
    return true; 
});