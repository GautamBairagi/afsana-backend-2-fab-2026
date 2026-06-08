import db from '../src/config/db.js';

/**
 * Phase 2 – Knowledge Base Migration
 * Creates: country_requirements, visa_requirements, kb_scholarships, kb_faq_articles
 * Populates with sample data for 10 popular study-abroad countries.
 */

async function runKnowledgeBaseMigration() {
    try {
        console.log('🚀 Phase 2: Knowledge Base Migration Starting...\n');

        // ============================================================
        // 1. country_requirements
        // ============================================================
        await db.query(`
            CREATE TABLE IF NOT EXISTS country_requirements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                country_name VARCHAR(100) NOT NULL UNIQUE,
                education_requirements TEXT NULL,
                ielts_min_overall DECIMAL(3,1) NULL DEFAULT 6.0,
                ielts_min_each DECIMAL(3,1) NULL DEFAULT 5.5,
                pte_min INT NULL DEFAULT 50,
                budget_min_usd INT NULL,
                budget_max_usd INT NULL,
                visa_difficulty ENUM('Easy', 'Moderate', 'Hard', 'Very Hard') DEFAULT 'Moderate',
                study_gap_policy TEXT NULL,
                intake_months VARCHAR(255) NULL,
                post_study_work VARCHAR(255) NULL,
                notes TEXT NULL,
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ country_requirements table created.');

        // Seed 10 countries
        const countries = [
            {
                country_name: 'Australia',
                education_requirements: 'Minimum 60% in HSC/A-Levels. Bachelor requires 65%+. Masters requires 60%+.',
                ielts_min_overall: 6.0, ielts_min_each: 5.5, pte_min: 50,
                budget_min_usd: 20000, budget_max_usd: 45000,
                visa_difficulty: 'Moderate',
                study_gap_policy: 'Up to 5 years gap acceptable with strong explanation. Large gaps require documentation.',
                intake_months: 'February, July',
                post_study_work: '2–4 years Temporary Graduate visa (subclass 485)',
                notes: 'Very popular destination. Strong employment outcomes. Regional areas offer extra benefits.'
            },
            {
                country_name: 'United Kingdom',
                education_requirements: 'Minimum 55% in HSC/A-Levels. Bachelor requires 60%+. Masters requires 55%+.',
                ielts_min_overall: 6.0, ielts_min_each: 5.5, pte_min: 51,
                budget_min_usd: 25000, budget_max_usd: 50000,
                visa_difficulty: 'Moderate',
                study_gap_policy: 'Study gaps up to 3 years are generally acceptable with justification.',
                intake_months: 'September, January',
                post_study_work: '2 years Graduate Route visa (3 years for PhD)',
                notes: 'Shorter course durations (3-year Bachelor, 1-year Master) make it cost-effective.'
            },
            {
                country_name: 'Canada',
                education_requirements: 'Minimum 60% in Secondary Education. University requires 65–70%.',
                ielts_min_overall: 6.0, ielts_min_each: 5.5, pte_min: 58,
                budget_min_usd: 18000, budget_max_usd: 40000,
                visa_difficulty: 'Moderate',
                study_gap_policy: 'Up to 3 years acceptable. Longer gaps need strong justification and employment proof.',
                intake_months: 'January, May, September',
                post_study_work: 'PGWP up to 3 years. PR pathway through Express Entry.',
                notes: 'Strong immigration pathway. PR-friendly. High demand destination.'
            },
            {
                country_name: 'USA',
                education_requirements: 'GPA 2.5+ (4.0 scale). Most universities require 3.0+.',
                ielts_min_overall: 6.5, ielts_min_each: 6.0, pte_min: 58,
                budget_min_usd: 30000, budget_max_usd: 70000,
                visa_difficulty: 'Hard',
                study_gap_policy: 'Study gaps are generally NOT accepted. Continuous education strongly preferred.',
                intake_months: 'August/September, January',
                post_study_work: 'OPT: 12 months (STEM: 36 months). No direct PR pathway.',
                notes: 'Visa interview required. Very strict on study gap. SAT/GRE/GMAT often required.'
            },
            {
                country_name: 'New Zealand',
                education_requirements: 'Minimum 50% in HSC. Bachelor requires 55%+.',
                ielts_min_overall: 6.0, ielts_min_each: 5.5, pte_min: 50,
                budget_min_usd: 18000, budget_max_usd: 35000,
                visa_difficulty: 'Easy',
                study_gap_policy: 'Study gaps up to 5 years usually accepted. Flexible policy.',
                intake_months: 'February, July',
                post_study_work: 'Post Study Work Visa: 1–3 years depending on qualification.',
                notes: 'Safe country. Growing tech and agriculture sectors. Good PR pathway.'
            },
            {
                country_name: 'Ireland',
                education_requirements: 'Minimum 55% in HSC. University requires 60%+.',
                ielts_min_overall: 6.0, ielts_min_each: 5.5, pte_min: 55,
                budget_min_usd: 20000, budget_max_usd: 40000,
                visa_difficulty: 'Moderate',
                study_gap_policy: 'Up to 3–4 years generally acceptable.',
                intake_months: 'September, January',
                post_study_work: 'Stay Back Visa: 1 year (Degree), 2 years (Masters/PhD)',
                notes: 'Gateway to EU. English-speaking. Tech hub (Google, Facebook HQ in Dublin).'
            },
            {
                country_name: 'Germany',
                education_requirements: 'Strong academic background required. GPA equivalent minimum 2.5 German scale.',
                ielts_min_overall: 6.5, ielts_min_each: 6.0, pte_min: 58,
                budget_min_usd: 12000, budget_max_usd: 25000,
                visa_difficulty: 'Moderate',
                study_gap_policy: 'Study gaps up to 2 years acceptable with good justification.',
                intake_months: 'April (Summer), October (Winter)',
                post_study_work: '18 months job-seeker visa after graduation.',
                notes: 'Many tuition-free public universities. German language knowledge can be advantageous.'
            },
            {
                country_name: 'Malaysia',
                education_requirements: 'Minimum 45% in HSC. Very flexible entry requirements.',
                ielts_min_overall: 5.5, ielts_min_each: 5.0, pte_min: 45,
                budget_min_usd: 8000, budget_max_usd: 18000,
                visa_difficulty: 'Easy',
                study_gap_policy: 'Very flexible. Gaps up to 7+ years often accepted.',
                intake_months: 'January, May, September (rolling)',
                post_study_work: 'Limited work rights post-study.',
                notes: 'Budget-friendly option. Good for students with lower scores or study gaps.'
            },
            {
                country_name: 'Japan',
                education_requirements: 'HSC pass with decent grades. JLPT N4/N5 helpful for non-English programs.',
                ielts_min_overall: 6.0, ielts_min_each: 5.5, pte_min: 50,
                budget_min_usd: 12000, budget_max_usd: 28000,
                visa_difficulty: 'Moderate',
                study_gap_policy: 'Study gaps up to 2–3 years acceptable.',
                intake_months: 'April, October',
                post_study_work: 'Job change visa available. Growing international graduate demand.',
                notes: 'Technology, engineering, and arts programs popular. Safe country.'
            },
            {
                country_name: 'Finland',
                education_requirements: 'Strong academic record. No strict GPA but competitive programs.',
                ielts_min_overall: 6.0, ielts_min_each: 5.5, pte_min: 50,
                budget_min_usd: 12000, budget_max_usd: 25000,
                visa_difficulty: 'Moderate',
                study_gap_policy: 'Relatively flexible. Up to 3 years generally fine.',
                intake_months: 'September',
                post_study_work: 'Extended residence permit available for job search after graduation.',
                notes: 'Many English-taught programs. High quality of life. Part of Schengen zone.'
            },
        ];

        for (const country of countries) {
            await db.query(
                `INSERT IGNORE INTO country_requirements 
                 (country_name, education_requirements, ielts_min_overall, ielts_min_each, pte_min, 
                  budget_min_usd, budget_max_usd, visa_difficulty, study_gap_policy, intake_months, 
                  post_study_work, notes)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [country.country_name, country.education_requirements, country.ielts_min_overall,
                 country.ielts_min_each, country.pte_min, country.budget_min_usd, country.budget_max_usd,
                 country.visa_difficulty, country.study_gap_policy, country.intake_months,
                 country.post_study_work, country.notes]
            );
        }
        console.log('✅ country_requirements seeded with 10 countries.');

        // ============================================================
        // 2. visa_requirements
        // ============================================================
        await db.query(`
            CREATE TABLE IF NOT EXISTS visa_requirements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                country_id INT NOT NULL,
                document_type VARCHAR(255) NOT NULL,
                is_mandatory TINYINT(1) NOT NULL DEFAULT 1,
                description TEXT NULL,
                notes TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_country_id (country_id),
                FOREIGN KEY (country_id) REFERENCES country_requirements(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ visa_requirements table created.');

        // Seed visa documents for Australia (id=1) as example
        const [australiaRow] = await db.query(`SELECT id FROM country_requirements WHERE country_name = 'Australia'`);
        if (australiaRow.length > 0) {
            const australiaId = australiaRow[0].id;
            const ausDocs = [
                ['Valid Passport', 1, 'Must be valid for at least 6 months beyond intended stay'],
                ['Confirmation of Enrolment (CoE)', 1, 'Official letter from Australian university confirming enrollment'],
                ['Genuine Temporary Entrant (GTE) Statement', 1, 'Written statement explaining why you want to study in Australia'],
                ['English Proficiency (IELTS/PTE)', 1, 'Official test score report, usually within 2–3 years'],
                ['Financial Evidence', 1, 'Bank statements showing sufficient funds (AUD 21,041/year minimum)'],
                ['Overseas Student Health Cover (OSHC)', 1, 'Health insurance required for duration of study'],
                ['Academic Transcripts', 1, 'Previous education records (HSC, Bachelor etc.)'],
                ['Overseas Police Clearance', 0, 'Required if staying more than 12 months in some cases'],
                ['Sponsor Letter (if applicable)', 0, 'If someone else is funding the studies'],
                ['Birth Certificate', 0, 'May be required for identity verification'],
            ];
            for (const [docType, mandatory, desc] of ausDocs) {
                await db.query(
                    `INSERT IGNORE INTO visa_requirements (country_id, document_type, is_mandatory, description) VALUES (?, ?, ?, ?)`,
                    [australiaId, docType, mandatory, desc]
                );
            }
            console.log('✅ visa_requirements seeded for Australia.');
        }

        // ============================================================
        // 3. kb_scholarships
        // ============================================================
        await db.query(`
            CREATE TABLE IF NOT EXISTS kb_scholarships (
                id INT AUTO_INCREMENT PRIMARY KEY,
                country_name VARCHAR(100) NOT NULL,
                scholarship_name VARCHAR(255) NOT NULL,
                provider VARCHAR(255) NOT NULL,
                amount_usd INT NULL,
                coverage_type ENUM('Full', 'Partial', 'Tuition Only', 'Living Only') DEFAULT 'Partial',
                eligibility TEXT NULL,
                min_ielts DECIMAL(3,1) NULL,
                min_gpa VARCHAR(50) NULL,
                deadline_notes VARCHAR(255) NULL,
                application_url VARCHAR(500) NULL,
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const scholarships = [
            ['Australia', 'Australia Awards Scholarship', 'Australian Government', 40000, 'Full', 'Open to developing country citizens. Must return home after studies.', 6.5, '70%+', 'Annual – usually April', 'https://www.dfat.gov.au/people-to-people/australia-awards'],
            ['United Kingdom', 'Chevening Scholarship', 'UK Government', 35000, 'Full', 'For emerging leaders. Minimum 2 years work experience. IELTS 6.5+.', 6.5, '60%+', 'Annual – November', 'https://www.chevening.org/'],
            ['Canada', 'Vanier Canada Graduate Scholarships', 'Government of Canada', 50000, 'Full', 'PhD students only. Must be nominated by university.', 7.0, '80%+', 'Annual – November', 'https://vanier.gc.ca/'],
            ['New Zealand', 'NZ Development Scholarships', 'NZ Government', 30000, 'Full', 'For Pacific and developing countries. Priority for development sectors.', 6.0, '60%+', 'Annual – March', 'https://www.mfat.govt.nz/en/aid-and-development/new-zealand-scholarships/'],
            ['Germany', 'DAAD Scholarship', 'DAAD Germany', 18000, 'Full', 'For international Masters and PhD students. German/English proficiency.', 6.0, '65%+', 'Annual – October/November', 'https://www.daad.de/en/'],
            ['Australia', 'Destination Australia Scholarship', 'Australian Government', 15000, 'Partial', 'For studying at regional Australian institutions. Renewable annually.', 5.5, '55%+', 'Varies by institution', null],
            ['United Kingdom', 'Commonwealth Scholarship', 'Commonwealth Secretariat', 30000, 'Full', 'For commonwealth country citizens. Masters and PhD level.', 6.5, '65%+', 'Annual – December', 'https://cscuk.fcdo.gov.uk/'],
        ];

        for (const [country, name, provider, amount, coverage, eligibility, ielts, gpa, deadline, url] of scholarships) {
            await db.query(
                `INSERT IGNORE INTO kb_scholarships (country_name, scholarship_name, provider, amount_usd, coverage_type, eligibility, min_ielts, min_gpa, deadline_notes, application_url) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [country, name, provider, amount, coverage, eligibility, ielts, gpa, deadline, url]
            );
        }
        console.log('✅ kb_scholarships table created and seeded.');

        // ============================================================
        // 4. kb_faq_articles
        // ============================================================
        await db.query(`
            CREATE TABLE IF NOT EXISTS kb_faq_articles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                category VARCHAR(100) NOT NULL,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                tags VARCHAR(500) NULL,
                view_count INT DEFAULT 0,
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_category (category)
            )
        `);

        const faqs = [
            ['IELTS', 'What is the minimum IELTS score required to study abroad?', 'Most countries require a minimum IELTS overall score of 6.0 with no band below 5.5. However, top universities in the UK, USA, and Canada may require 6.5 or 7.0. Australia and New Zealand generally accept 6.0+. Always check the specific university requirement as it varies.', 'ielts,score,requirement'],
            ['IELTS', 'How many times can I take the IELTS exam?', 'There is no limit on how many times you can take IELTS. You can retake it as often as you like. Most universities accept your best score. We recommend waiting at least 3 months between attempts to properly prepare.', 'ielts,retake,exam'],
            ['Visa', 'What documents are required for an Australian student visa?', 'Key documents include: Valid passport, Confirmation of Enrolment (CoE), IELTS/PTE results, bank statements showing sufficient funds, Overseas Student Health Cover (OSHC), academic transcripts, and a GTE (Genuine Temporary Entrant) statement.', 'visa,australia,documents'],
            ['Visa', 'What is a GTE statement?', 'A GTE (Genuine Temporary Entrant) statement is a written document required for Australian student visa. It explains why you want to study in Australia, your ties to your home country, and your intention to return after completing your studies. A strong GTE significantly improves visa approval chances.', 'gte,visa,australia'],
            ['Study Gap', 'How does a study gap affect my visa application?', 'A study gap is a period between your last formal education and when you plan to study again. For Australia and New Zealand, gaps up to 5 years are generally acceptable with proper explanation. For the USA, study gaps are viewed negatively. Always provide a clear, documented explanation for any gap period.', 'study gap,visa,education'],
            ['Budget', 'How much money do I need to study in Australia?', 'For Australia, you typically need AUD 21,041 per year for living expenses plus tuition fees (AUD 20,000–45,000/year). Total annual budget: approximately AUD 41,000–66,000 (USD 27,000–44,000). You must show proof of sufficient funds in your bank account.', 'budget,australia,cost,money'],
            ['Scholarship', 'Are there scholarships available for international students?', 'Yes! Major scholarships include: Australia Awards (Full), Chevening UK (Full), DAAD Germany (Full), Vanier Canada (Full PhD), Commonwealth Scholarship (Full), and many university-specific partial scholarships. Contact our counselors for personalized scholarship guidance based on your profile.', 'scholarship,funding,award'],
            ['Application', 'How long does the university application process take?', 'Typically 4–8 weeks for most universities. Some competitive programs at top universities may take 3–4 months. We recommend applying at least 6 months before your intended intake date to allow time for visa processing (4–8 weeks additional).', 'application,timeline,process'],
            ['Post-Study Work', 'Can I work after completing my studies?', 'Yes, most countries offer post-study work rights. Australia offers 2–4 years (subclass 485). UK offers 2 years Graduate Route. Canada offers up to 3 years PGWP with PR pathway. New Zealand offers 1–3 years. USA offers 12 months OPT (36 months for STEM).', 'work,post-study,visa,employment'],
            ['General', 'What is the best country to study abroad?', 'The best country depends on your profile, budget, career goals, and visa history. Australia and Canada are top choices for PR pathways. UK offers shorter course durations. Germany has low tuition fees. Malaysia and New Zealand are budget-friendly. Our AI and counselors can give you personalized recommendations.', 'country,recommendation,best'],
        ];

        for (const [category, question, answer, tags] of faqs) {
            await db.query(
                `INSERT IGNORE INTO kb_faq_articles (category, question, answer, tags) VALUES (?, ?, ?, ?)`,
                [category, question, answer, tags]
            );
        }
        console.log('✅ kb_faq_articles table created and seeded with 10 FAQs.');

        console.log('\n🎉 Phase 2 Knowledge Base Migration Complete!');
        process.exit(0);

    } catch (err) {
        console.error('❌ Knowledge Base Migration Error:', err.message);
        process.exit(1);
    }
}

runKnowledgeBaseMigration();
