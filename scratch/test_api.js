import axios from 'axios';

const BASE_URL = "https://afsana-backend-2-fab-2026-production.up.railway.app/api/";

async function checkEndpoints() {
    const endpoints = [
        'auth/getAllStudents',
        'counselor',
        'getAllProcessors',
        'getAllStaff'
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`Checking ${BASE_URL}${endpoint}...`);
            const response = await axios.get(`${BASE_URL}${endpoint}`);
            console.log(`✅ ${endpoint}: Success (${response.data.length || response.data.data?.length || 0} items)`);
        } catch (error) {
            console.log(`❌ ${endpoint}: Failed (${error.response?.status || error.message})`);
            if (error.response?.data) {
                console.log('   Data:', error.response.data);
            }
        }
    }
}

checkEndpoints();
