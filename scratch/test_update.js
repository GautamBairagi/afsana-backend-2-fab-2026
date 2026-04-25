import axios from 'axios';

async function testUpdate() {
    try {
        const response = await axios.put('http://localhost:3007/api/createVisaProcess/1', {
            tuition_fee_visa_processing_stage: 1
        });
        console.log("Response:", response.data);
    } catch (err) {
        console.error("Error:", err.response?.data || err.message);
    }
}

testUpdate();
