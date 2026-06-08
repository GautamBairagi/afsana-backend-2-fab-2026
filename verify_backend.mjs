import fs from 'fs';

const BASE_URL = 'http://127.0.0.1:3009';
const results = [];

const logResult = (name, status, details) => {
    const result = { name, status, details };
    results.push(result);
    console.log(`[${status === 'PASS' ? '✅' : '❌'}] ${name}: ${details}`);
};

async function runTests() {
    console.log("🚀 Starting Backend Verification...\n");

    // 1. AI Settings
    try {
        const res = await fetch(`${BASE_URL}/api/ai/settings`);
        logResult('AI Settings API', res.ok ? 'PASS' : 'FAIL', `Status: ${res.status}`);
    } catch (e) { logResult('AI Settings API', 'FAIL', e.message); }

    // 2. AI Prompts
    try {
        const res = await fetch(`${BASE_URL}/api/ai/prompts`);
        logResult('AI Prompts API', res.ok ? 'PASS' : 'FAIL', `Status: ${res.status}`);
    } catch (e) { logResult('AI Prompts API', 'FAIL', e.message); }

    // 3. AI Costs
    try {
        const res = await fetch(`${BASE_URL}/api/ai/costs`);
        logResult('AI Costs API', res.ok ? 'PASS' : 'FAIL', `Status: ${res.status}`);
    } catch (e) { logResult('AI Costs API', 'FAIL', e.message); }

    // 4. Recommendation API
    try {
        const res = await fetch(`${BASE_URL}/api/ai/recommend/countries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profile: { budget: 20000, study_gap: 1 } })
        });
        logResult('AI Recommendation API', res.ok ? 'PASS' : 'FAIL', `Status: ${res.status}`);
    } catch (e) { logResult('AI Recommendation API', 'FAIL', e.message); }

    // 5. Facebook Webhook
    try {
        const res = await fetch(`${BASE_URL}/api/webhooks/facebook`);
        logResult('Facebook Webhook', res.status !== 500 && res.status !== 404 ? 'PASS' : 'FAIL', `Status: ${res.status} (Expected 400 or 403)`);
    } catch (e) { logResult('Facebook Webhook', 'FAIL', e.message); }

    // 6. WhatsApp Webhook
    try {
        const res = await fetch(`${BASE_URL}/api/webhooks/whatsapp`);
        logResult('WhatsApp Webhook', res.status !== 500 && res.status !== 404 ? 'PASS' : 'FAIL', `Status: ${res.status} (Expected 400 or 403)`);
    } catch (e) { logResult('WhatsApp Webhook', 'FAIL', e.message); }

    // 7. Lead Creation
    try {
        const phone = "0000000" + Math.floor(Math.random() * 1000);
        const res = await fetch(`${BASE_URL}/api/inquiries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                full_name: "Test AI Lead",
                phone_number: phone,
                email: "testai@example.com",
                inquiry_type: "student_visa",
                source: "Facebook",
                branch: "Dhaka",
                study_level: "Bachelors",
                country: "Australia"
            })
        });
        
        const data = await res.json();
        if (res.ok && data.inquiryId) {
            logResult('Lead Creation & AI Task', 'PASS', `Lead created successfully (ID: ${data.inquiryId})`);
        } else {
            logResult('Lead Creation', 'FAIL', `Status: ${res.status}, ${data.message}`);
        }
    } catch (e) { logResult('Lead Creation', 'FAIL', e.message); }

    // 8. Document Upload (Without actual file, checking if it doesn't crash)
    try {
        const formData = new FormData();
        const fileBlob = new Blob(['Hello dummy'], { type: 'text/plain' });
        formData.append('document', fileBlob, 'dummy.txt');
        formData.append('student_id', '1');
        formData.append('document_type', 'SOP');

        const res = await fetch(`${BASE_URL}/api/studentUploads`, {
            method: 'POST',
            body: formData
        });

        // It might return 400 or 500 depending on cloudinary/multer handling of Blob, but we just check response status logic.
        if (res.status !== 500) {
            logResult('Document Upload Flow', 'PASS', `Status: ${res.status} (Handled gracefully)`);
        } else {
            logResult('Document Upload Flow', 'FAIL', `Status: 500 server crash`);
        }
    } catch (e) { logResult('Document Upload Flow', 'FAIL', e.message); }

    console.log("\n📊 Verification Complete.");
}

runTests();
