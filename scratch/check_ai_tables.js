import db from '../src/config/db.js';

async function verify() {
  try {
    console.log("=== DB SCHEMA VERIFICATION ===");
    
    // 1. Show all tables
    const [allTables] = await db.query('SHOW TABLES');
    const tableNames = allTables.map(t => Object.values(t)[0]);
    console.log('\nAll tables in database:\n', tableNames.join(', '));
    
    // 2. Check inquiries column extensions
    const [columns] = await db.query(`SHOW COLUMNS FROM inquiries`);
    const columnNames = columns.map(c => c.Field);
    console.log('\ninquiries AI columns status:');
    console.log('- ai_score:', columnNames.includes('ai_score'));
    console.log('- ai_summary:', columnNames.includes('ai_summary'));
    
    // 3. Check seeded settings
    const [settings] = await db.query(`SELECT * FROM ai_settings`);
    console.log('\nSeeded settings count:', settings.length);
    console.log(settings.map(s => `${s.setting_key}: ${s.setting_value}`).join('\n'));
    
    // 4. Check seeded prompts
    const [prompts] = await db.query(`SELECT id, module, name FROM ai_prompt_templates`);
    console.log('\nSeeded prompts count:', prompts.length);
    console.log(prompts.map(p => `[${p.module}] ${p.name}`).join('\n'));

    // 5. Check cost limits
    const [costLimits] = await db.query(`SELECT * FROM ai_cost_limits`);
    console.log('\nSeeded cost limits:', costLimits[0]);

    process.exit(0);
  } catch (err) {
    console.error("Verification failed:", err);
    process.exit(1);
  }
}

verify();
