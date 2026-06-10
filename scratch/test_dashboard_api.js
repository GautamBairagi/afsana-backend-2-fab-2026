import axios from 'axios';

async function testDashboard() {
    try {
        const response = await axios.get('https://afsana-backend-2-fab-2026-production.up.railway.app/api/processordashboard/302');
        console.log("Dashboard Data:", JSON.stringify(response.data, null, 2));
    } catch (err) {
        console.error("Error:", err.message);
    }
}

testDashboard();
