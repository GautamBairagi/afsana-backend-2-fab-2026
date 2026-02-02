// import axios from 'axios';
// import dotenv from 'dotenv';
// dotenv.config();

// export const askAiChatbot = async (req, res) => {
//   const { message } = req.body;

//   if (!message) {
//     return res.status(400).json({ error: 'Message is required' });
//   }

//   try {
//     // Decode the Base64 encoded API key
//     const decodedKey = Buffer.from(process.env.ENCODED_OPENAI_API_KEY, 'base64').toString('utf-8');

//     // Call OpenAI's chat completion endpoint
//     const response = await axios.post(
//       'https://api.openai.com/v1/chat/completions',
//       {
//         model: 'gpt-4',
//         messages: [{ role: 'user', content: message }],
//         temperature: 0.7,
//       },
//       {
//         headers: {
//           'Authorization': `Bearer ${decodedKey}`,
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     // Extract and send back the chatbot's reply
//     const reply = response.data.choices[0].message.content;
//     res.status(200).json({ reply });

//   } catch (err) {
//     console.error('AI Chatbot Error:', err.response?.data || err.message);
//     res.status(500).json({ error: 'AI chatbot failed to respond' });
//   }
// };


import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const faqAnswers = {
  
  "what is the admission process?": "The admission process starts with student registration. After that, you can apply to multiple universities.",
  
  "how can i apply to a university?": "Go to 'Apply University' in the Student Management section. Select your preferred universities and submit the forms. You can apply to multiple universities.",
  
  "how do i track my application view?": "Go to 'Application Management' to view your submitted applications and the related documents.",
  
  "where do i upload documents?": "You can upload documents during the university application and visa process steps. You can also upload them in the 'Student Details' section.",
  
  "how to pay fees?": "Go to the 'Payments & Invoices' section to view and pay your pending fees.",
  
  "how do i track visa process?": "Click on the 'Visa Processing' tab in your dashboard to check your current visa process stage.",
  
  "what is student decision?": "This section shows your admission result from universities — Accepted, Rejected, or Waitlisted.",
  
  "what is task management?": "It shows the tasks assigned to you, such as document uploads or instructions from your counselor.",
  
  "i need help": "You can contact your counselor from the dashboard or reach out to support.",
  
  "how i connect to you": "Click the chat icon at the top or go to the 'Communication' section in the menu to message your assigned counselor."
}

export const askAiChatbot = async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const lowerMessage = message.toLowerCase().trim();

    // Step 1: Check for exact match in FAQ
    if (faqAnswers[lowerMessage]) {
      return res.status(200).json({ reply: faqAnswers[lowerMessage] });
    }

    // Step 2: If not found, fallback to OpenAI
    const decodedKey = Buffer.from(process.env.ENCODED_OPENAI_API_KEY, 'base64').toString('utf-8');

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [{ role: 'user', content: message }],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${decodedKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const reply = response.data.choices[0].message.content;
    res.status(200).json({ reply });

  } catch (err) {
    console.error('AI Chatbot Error:', err.response?.data || err.message);
    res.status(500).json({ error: 'AI chatbot failed to respond' });
  }
};
