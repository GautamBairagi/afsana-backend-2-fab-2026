import db from '../src/config/db.js';

async function runPhase1Migration() {
    try {
        console.log("🚀 Phase 1: AI Infrastructure Migration Starting...\n");

        // Drop existing conflicting tables first to clean up schema mismatch
        console.log("Cleanup: Dropping existing conflicting tables...");
        await db.query(`DROP TABLE IF EXISTS ai_settings`);
        await db.query(`DROP TABLE IF EXISTS ai_logs`);
        await db.query(`DROP TABLE IF EXISTS ai_cost_limits`);
        await db.query(`DROP TABLE IF EXISTS ai_prompt_templates`);
        await db.query(`DROP TABLE IF EXISTS lead_score_history`);
        console.log("Cleanup complete.\n");

        // ============================================================
        // 1. ai_settings
        // ============================================================
        await db.query(`
            CREATE TABLE IF NOT EXISTS ai_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                setting_key VARCHAR(100) NOT NULL UNIQUE,
                setting_value TEXT NOT NULL,
                description VARCHAR(255) NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log("✅ ai_settings table created.");

        // Seed default settings
        const defaultSettings = [
            ['model', 'gpt-4o', 'OpenAI model to use'],
            ['temperature', '0.7', 'Response creativity (0-1)'],
            ['max_tokens', '2000', 'Maximum tokens per response'],
            ['enabled_modules', '{"chat":true,"scoring":true,"qualification":true,"recommendation":true,"counselor":true,"visa":true}', 'Active AI modules'],
            ['system_prompt_chat', 'You are Study First Info AI Assistant. You help students with international education queries about universities, visa processes, IELTS requirements, scholarships, and admission procedures. Always be professional, accurate, and helpful. Never fabricate university names or guarantee visa approvals.', 'Default chat system prompt'],
        ];
        for (const [key, value, desc] of defaultSettings) {
            await db.query(
                `INSERT IGNORE INTO ai_settings (setting_key, setting_value, description) VALUES (?, ?, ?)`,
                [key, value, desc]
            );
        }
        console.log("✅ ai_settings defaults seeded.");

        // ============================================================
        // 2. ai_logs
        // ============================================================
        await db.query(`
            CREATE TABLE IF NOT EXISTS ai_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                lead_id INT NULL,
                module VARCHAR(100) NOT NULL,
                prompt TEXT NOT NULL,
                response TEXT NOT NULL,
                tokens_used INT NOT NULL DEFAULT 0,
                prompt_tokens INT NOT NULL DEFAULT 0,
                completion_tokens INT NOT NULL DEFAULT 0,
                cost_estimate DECIMAL(10, 6) NOT NULL DEFAULT 0.000000,
                model_used VARCHAR(100) NULL,
                status VARCHAR(20) DEFAULT 'success',
                error_message TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_module (module),
                INDEX idx_user_id (user_id),
                INDEX idx_lead_id (lead_id),
                INDEX idx_created_at (created_at)
            )
        `);
        console.log("✅ ai_logs table created.");

        // ============================================================
        // 3. ai_cost_limits
        // ============================================================
        await db.query(`
            CREATE TABLE IF NOT EXISTS ai_cost_limits (
                id INT AUTO_INCREMENT PRIMARY KEY,
                daily_limit DECIMAL(10, 2) NOT NULL DEFAULT 10.00,
                monthly_limit DECIMAL(10, 2) NOT NULL DEFAULT 200.00,
                per_request_limit DECIMAL(10, 4) NOT NULL DEFAULT 0.5000,
                alert_threshold_percent INT NOT NULL DEFAULT 80,
                is_hard_limit TINYINT(1) NOT NULL DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        const [costRows] = await db.query(`SELECT id FROM ai_cost_limits LIMIT 1`);
        if (costRows.length === 0) {
            await db.query(`INSERT INTO ai_cost_limits (daily_limit, monthly_limit, per_request_limit, alert_threshold_percent) VALUES (10.00, 200.00, 0.5000, 80)`);
        }
        console.log("✅ ai_cost_limits table created.");

        // ============================================================
        // 4. ai_prompt_templates
        // ============================================================
        await db.query(`
            CREATE TABLE IF NOT EXISTS ai_prompt_templates (
                id INT AUTO_INCREMENT PRIMARY KEY,
                module VARCHAR(100) NOT NULL,
                name VARCHAR(255) NOT NULL,
                prompt_text TEXT NOT NULL,
                variables JSON NULL,
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_module (module),
                UNIQUE KEY unique_module_name (module, name)
            )
        `);

        // Seed default prompt templates
        const defaultPrompts = [
            ['chat', 'Website Chat Assistant', 'You are Study First Info AI Assistant. Help students with queries about international education, universities, visa processes, IELTS/PTE requirements, scholarships, tuition fees, and admission procedures. Use the provided context to give accurate answers. Never fabricate university names. Never guarantee visa approvals. Be professional, friendly, and concise.', '["student_name","country","course"]'],
            ['lead_qualification', 'Lead Qualification Prompt', 'Analyze the following student profile and determine eligibility for international education. Consider: education level, GPA, IELTS/PTE scores, budget, study gap, and preferred country. Return a JSON response with: {"score": 0-100, "category": "Hot Lead|Warm Lead|Cold Lead|Low Quality", "risks": [], "strengths": [], "next_steps": [], "reasoning": ""}', '["gpa","ielts_score","budget","country","study_gap"]'],
            ['country_recommendation', 'Country Recommendation Prompt', 'Based on the student profile provided, recommend suitable countries for study abroad. Consider: academic profile, budget, IELTS score, study gap, and career goals. Only recommend from the provided list of available countries. Return JSON: {"recommended": [], "risky": [], "budget_analysis": "", "reasoning": ""}', '["profile","available_countries"]'],
            ['counselor_draft', 'Counselor Email/WhatsApp Draft', 'Draft a professional and friendly message for the counselor to send to the student. Context: {{context}}. Intent: {{intent}}. Keep it concise, warm, and action-oriented.', '["context","intent","student_name"]'],
            ['visa_analysis', 'Visa Risk Analysis Prompt', 'Analyze the visa application risk for the following student profile applying to {{country}}. Consider: financial documents, study gap, academic scores, and previous visa history. Return JSON: {"risk_level": "Low|Medium|High", "risk_factors": [], "recommendations": [], "interview_tips": []}', '["country","profile","documents"]'],
        ];
        for (const [mod, name, prompt, vars] of defaultPrompts) {
            await db.query(
                `INSERT IGNORE INTO ai_prompt_templates (module, name, prompt_text, variables) VALUES (?, ?, ?, ?)`,
                [mod, name, prompt, vars]
            );
        }
        console.log("✅ ai_prompt_templates table created and seeded.");

        // ============================================================
        // 5. lead_score_history
        // ============================================================
        await db.query(`
            CREATE TABLE IF NOT EXISTS lead_score_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                lead_id INT NOT NULL,
                score INT NOT NULL,
                category VARCHAR(50) NULL,
                reason TEXT NULL,
                scored_by VARCHAR(50) DEFAULT 'ai',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_lead_id (lead_id),
                INDEX idx_created_at (created_at)
            )
        `);
        console.log("✅ lead_score_history table created.");

        // ============================================================
        // 6. Add ai_score column to inquiries (if not exists)
        // ============================================================
        const [columns] = await db.query(`SHOW COLUMNS FROM inquiries`);
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('ai_score')) {
            await db.query(`ALTER TABLE inquiries ADD COLUMN ai_score INT NULL DEFAULT NULL`);
            console.log("✅ ai_score column added to inquiries.");
        } else {
            console.log("ℹ️  ai_score column already exists in inquiries.");
        }

        if (!columnNames.includes('ai_summary')) {
            await db.query(`ALTER TABLE inquiries ADD COLUMN ai_summary TEXT NULL`);
            console.log("✅ ai_summary column added to inquiries.");
        } else {
            console.log("ℹ️  ai_summary column already exists in inquiries.");
        }

        // ============================================================
        console.log("\n🎉 Phase 1 Migration Complete! All tables created successfully.");
        process.exit(0);

    } catch (err) {
        console.error("❌ Migration Error:", err.message);
        process.exit(1);
    }
}

runPhase1Migration();
