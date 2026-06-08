import axios from 'axios';

async function test() {
    try {
        const res = await axios.post('http://localhost:3009/api/aichat/conversational-ask', {
            sessionToken: 'sess_123',
            message: 'My name is John Doe, phone 1234567890, email john@doe.com, i want to go to UK, budget 15000, IELTS 6.5, BBA'
        });
        console.log("Success:", res.data);
    } catch (err) {
        console.error("Error:", err.response?.data || err.message);
    }
}
test();
