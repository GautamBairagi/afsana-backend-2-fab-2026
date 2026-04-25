import axios from 'axios';

async function testDashboard() {
    try {
        const response = await axios.get('http://localhost:3009/api/processordashboard/302');
        console.log("Dashboard Data:", JSON.stringify(response.data, null, 2));
    } catch (err) {
        console.error("Error:", err.message);
    }
}

testDashboard();
