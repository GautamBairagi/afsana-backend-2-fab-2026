import fetch from 'node-fetch';

async function testEndpoints() {
  const baseUrl = 'http://localhost:3009/api';
  console.log("=== TESTING AI CONFIG ENDPOINTS ===");
  
  try {
    // 1. Get Settings
    console.log('\nFetching /api/ai/settings...');
    const settingsRes = await fetch(`${baseUrl}/ai/settings`);
    console.log('Status:', settingsRes.status);
    const settingsData = await settingsRes.json();
    console.log('Response:', JSON.stringify(settingsData, null, 2));

    // 2. Get Prompts
    console.log('\nFetching /api/ai/prompts...');
    const promptsRes = await fetch(`${baseUrl}/ai/prompts`);
    console.log('Status:', promptsRes.status);
    const promptsData = await promptsRes.json();
    console.log('Seeded Prompts Count:', promptsData.prompts?.length);
    console.log('Prompts Names:', promptsData.prompts?.map(p => p.name));

    // 3. Get Costs
    console.log('\nFetching /api/ai/costs...');
    const costsRes = await fetch(`${baseUrl}/ai/costs`);
    console.log('Status:', costsRes.status);
    const costsData = await costsRes.json();
    console.log('Response:', JSON.stringify(costsData, null, 2));

  } catch (err) {
    console.error('API Test Request failed:', err.message || err);
  }
}

testEndpoints();
