import db from './src/config/db.js';

const settings = [
  ['whatsapp_number', '8801712345678', 'Company WhatsApp number for chatbot transfer'],
  ['company_name', 'Afsana Consultancy', 'Company name shown in chatbot'],
  ['chatbot_greeting', 'Hello! I am your AI Study Abroad Assistant from Afsana Consultancy. I can help you find the best country, university and visa guidance. How can I help you today?', 'Opening message of chatbot'],
];

for (const [key, value, desc] of settings) {
  await db.query(
    `INSERT INTO ai_settings (setting_key, setting_value, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE description = ?`,
    [key, value, desc, desc]
  );
  console.log(`✅ Seeded: ${key}`);
}

console.log('\n✅ WhatsApp settings seeded successfully!');
process.exit(0);
