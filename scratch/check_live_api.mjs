const BASE_URL = "https://afsana-backend-2-fab-2026-production.up.railway.app/api/";

try {
  console.log('Fetching:', `${BASE_URL}counselor`);
  const res = await fetch(`${BASE_URL}counselor`);
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Total counselors returned:', data.length);
  if (Array.isArray(data) && data.length > 0) {
    console.table(data.slice(0, 5).map(c => ({
      id: c.id,
      full_name: c.full_name,
      assigned_leads_count: c.assigned_leads_count,
      status: c.status
    })));
  } else {
    console.log('Data:', data);
  }
} catch (err) {
  console.error('Fetch Error:', err);
}
