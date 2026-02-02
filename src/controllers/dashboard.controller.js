import db from '../config/db.js';

import moment from "moment";
export const getDashboardData = async (req, res) => {
  const { counselor_id } = req.params;
  try {
    const [totalLeads] = await db.query('SELECT COUNT(*) AS totalleads FROM leads WHERE counselor = ?', [counselor_id]);
    const [totalStudents] = await db.query('SELECT COUNT(*) AS totalstudents FROM students');
    const [totalCounselors] = await db.query('SELECT COUNT(*) AS totalcounselors FROM counselors');

    const [totalFollowUps] = await db.query('SELECT COUNT(*) AS totalFollowUps FROM follow_ups');
    const [totalTasks] = await db.query('SELECT COUNT(*) AS totalTasks FROM tasks WHERE counselor_id =?', [counselor_id]);
    const [totalInquiries] = await db.query('SELECT COUNT(*) AS totalInquiries FROM inquiries WHERE counselor_id =?', [counselor_id]);
    res.status(200).json({
      totalleads: totalLeads[0].totalleads,
      totalstudents: totalStudents[0].totalstudents,
      totalcounselors: totalCounselors[0].totalcounselors,
      totalFollowUps: totalFollowUps[0].totalFollowUps,
      totalTasks: totalTasks[0].totalTasks,
      totalInquiries: totalInquiries[0].totalInquiries
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


export const getDashboardDataAdmin = async (req, res) => {
  try {
    const { startDate, endDate, country, source, leadStatus, intake , counselor_id  } = req.query;
  
    // Common date filter
    const getDateFilter = (alias = '') =>
      startDate && endDate
        ? `${alias}created_at BETWEEN '${startDate} 00:00:00' AND '${endDate} 23:59:59'`
        : '';
    // Table-specific filters
    const leadFilters = [];
    const inquiryFilters = [];
    const counselorsFilter = [];
    const commonFilters = [];

    if (startDate && endDate) {
      leadFilters.push(getDateFilter());
      inquiryFilters.push(getDateFilter());
      counselorsFilter.push(getDateFilter('c.'));
      commonFilters.push(getDateFilter());
    }
    if (country) {
      leadFilters.push(`country = '${country}'`);
      inquiryFilters.push(`country = '${country}'`);
    }
    if (source) {
      leadFilters.push(`source = '${source}'`);
      inquiryFilters.push(`source = '${source}'`);
    }
    if (counselor_id) {
      leadFilters.push(`counselor = '${counselor_id}'`);
      inquiryFilters.push(`counselor_id = '${counselor_id}'`);
      counselorsFilter.push(`c.id = '${counselor_id}'`);
    }
    if (leadStatus) {
      inquiryFilters.push(`lead_status = '${leadStatus}'`);
    }
    if (intake) {

      inquiryFilters.push(`intake = '${intake}'`);
    }
    // rehna code // const buildWhereClause = (filters) => filters.length ? `WHERE ${filters.join(' AND ')}` : ''; rehna code 

    const buildWhereClause = (filters, hasExistingWhere = false) => {
      if (!filters.length) return '';
      return `${hasExistingWhere ? ' AND ' : 'WHERE'} ${filters.join(' AND ')}`;
    };

    // rehan code   // const [totalLeads] = await db.query(`SELECT COUNT(*) AS totalleads FROM inquiries WHERE lead_status = 'Converted to Lead' ${buildWhereClause(leadFilters)}`);

    const [totalLeads] = await db.query(`
  SELECT COUNT(*) AS totalleads 
  FROM inquiries 
  WHERE lead_status = 'Converted to Lead'
  ${buildWhereClause(leadFilters, true)}
`);

    const [totalStudents] = await db.query(`SELECT COUNT(*) AS totalstudents FROM students ${buildWhereClause(commonFilters)}`);
    // const [totalCounselors] = await db.query(`SELECT COUNT(*) AS totalcounselors FROM counselors ${buildWhereClause(counselorsFilter)}`);

    const [totalCounselors] = await db.query(`
  SELECT COUNT(*) AS totalcounselors 
  FROM counselors c 
  JOIN users u ON c.id = u.counselor_id 
  ${buildWhereClause(counselorsFilter)}
`);
    const [totalFollowUps] = await db.query(`SELECT COUNT(*) AS totalFollowUps FROM follow_ups ${buildWhereClause(commonFilters)}`);
    const [totalTasks] = await db.query(`SELECT COUNT(*) AS totalTasks FROM tasks ${buildWhereClause(commonFilters)}`);
    const [totalInquiries] = await db.query(`SELECT COUNT(*) AS totalInquiries FROM inquiries ${buildWhereClause(inquiryFilters)}`);
    const [totalUniversities] = await db.query(`SELECT COUNT(*) AS totalUniversities FROM universities ${buildWhereClause(commonFilters)}`);
    res.status(200).json({
      totalleads: totalLeads[0].totalleads,
      totalstudents: totalStudents[0].totalstudents,
      totalcounselors: totalCounselors[0].totalcounselors,
      totalFollowUps: totalFollowUps[0].totalFollowUps,
      totalTasks: totalTasks[0].totalTasks,
      totalInquiries: totalInquiries[0].totalInquiries,
      totalUniversities: totalUniversities[0].totalUniversities,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getDashboardInfo = async (req, res) => {
  try {
    const [result] = await db.query(`
      SELECT
        -- This Month
        SUM(CASE WHEN MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) THEN 1 ELSE 0 END) AS this_month_total,
        SUM(CASE WHEN MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) AND lead_status = 'Converted to Lead' THEN 1 ELSE 0 END) AS this_month_converted,

        -- Last Month
        SUM(CASE WHEN MONTH(created_at) = MONTH(CURDATE() - INTERVAL 1 MONTH) AND YEAR(created_at) = YEAR(CURDATE() - INTERVAL 1 MONTH) THEN 1 ELSE 0 END) AS last_month_total,
        SUM(CASE WHEN MONTH(created_at) = MONTH(CURDATE() - INTERVAL 1 MONTH) AND YEAR(created_at) = YEAR(CURDATE() - INTERVAL 1 MONTH) AND lead_status = 'Converted to Lead' THEN 1 ELSE 0 END) AS last_month_converted
      FROM inquiries
    `);

    const {
      this_month_total,
      this_month_converted,
      last_month_total,
      last_month_converted,
    } = result[0];

    const thisMonthRate = this_month_total > 0 ? (this_month_converted / this_month_total) * 100 : 0;
    const lastMonthRate = last_month_total > 0 ? (last_month_converted / last_month_total) * 100 : 0;

    const growthRate = thisMonthRate - lastMonthRate;

    const [weeklyInquiries] = await db.query(`
  SELECT 
  d.day,
  COUNT(i.id) AS total_inquiries
FROM (
  SELECT 'Monday' AS day UNION
  SELECT 'Tuesday' UNION
  SELECT 'Wednesday' UNION
  SELECT 'Thursday' UNION
  SELECT 'Friday' UNION
  SELECT 'Saturday' UNION
  SELECT 'Sunday'
) AS d
LEFT JOIN inquiries i ON DAYNAME(i.created_at) = d.day 
  AND YEARWEEK(i.created_at, 1) = YEARWEEK(CURDATE(), 1)
GROUP BY d.day
ORDER BY FIELD(d.day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');

`);

    const [topCounselors] = await db.query(`
  SELECT
    IFNULL(c.counselor_id, i.counselor_id) AS counselor_id,
    IFNULL(c.full_name, 'Admin') AS full_name,
    COUNT(*) AS converted_leads
  FROM inquiries i
  LEFT JOIN users c ON i.counselor_id = c.counselor_id
  WHERE i.lead_status = 'Converted to Lead'
  GROUP BY counselor_id, full_name
  ORDER BY converted_leads DESC
  LIMIT 3
`);

    const [countryWiseConvertedLeads] = await db.query(`
      SELECT
        country,
        COUNT(*) AS inquiries
      FROM inquiries
      GROUP BY country
      ORDER BY inquiries DESC
    `);


    const [leadCount] = await db.query(`SELECT COUNT(*) AS totalleads FROM inquiries  WHERE lead_status = 'Converted to Lead'`)
    const [studentCount] = await db.query("SELECT COUNT(*) AS totalleads FROM students WHERE role = 'student'");
    const [inquiries] = await db.query('SELECT COUNT(*) AS totalleads FROM inquiries')
    const [application] = await db.query('SELECT COUNT(*) AS application FROM studentapplicationprocess')

    res.status(200).json({
      this_month_conversion_rate: `${thisMonthRate.toFixed(2)}%`,
      last_month_conversion_rate: `${lastMonthRate.toFixed(2)}%`,
      growth_rate: `${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(2)}%`,
      top_counselors: topCounselors,
      country_wise_converted_leads: countryWiseConvertedLeads,
      conversion_funnel: {
        leadCount: leadCount[0].totalleads,
        inquiries: inquiries[0].totalleads,
        application: application[0].application,
        studentCount: studentCount[0].totalleads
      },
      weekly_inquiries_by_day: weeklyInquiries


    });

  } catch (error) {
    console.error("Dashboard Info Error:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getDashboardDataUniversity = async (req, res) => {
  const { university_id, studentId } = req.params;

  try {
    const query = `
        SELECT 
          Application_stage, 
          Interview,
          Visa_process
        FROM 
          studentapplicationprocess 
        WHERE 
          student_id = ? 
          AND university_id = ?`;

    const [data] = await db.query(query, [studentId, university_id]);

    if (data.length === 0) {
      return res.status(404).json({ message: "No data found for the given student and university" });
    }

    res.status(200).json(data[0]);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


export const getCounselorDashboardData = async (req, res) => {
  try {
    const {
      dateRange,
      startDate,
      endDate,
      country,
      intake,
      leadStatus,
      counselor_id,
    } = req.query;

    const now = new Date();
    const formatDate = (date) =>
      date.toISOString().slice(0, 19).replace("T", " ");

    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const currentDay = now.getDay();
    const firstDayOfWeek = new Date(now);
    firstDayOfWeek.setDate(now.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    firstDayOfWeek.setHours(0, 0, 0, 0);
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
    lastDayOfWeek.setHours(23, 59, 59, 999);

    let dateCondition = "";
    switch (dateRange) {
      case "Today":
        dateCondition = `DATE(created_at) = CURDATE()`;
        break;
      case "ThisWeek":
        dateCondition = `created_at BETWEEN '${formatDate(firstDayOfWeek)}' AND '${formatDate(lastDayOfWeek)}'`;
        break;
      case "ThisMonth":
        dateCondition = `created_at BETWEEN '${formatDate(firstDayOfMonth)}' AND '${formatDate(lastDayOfMonth)}'`;
        break;
      case "LastMonth":
        dateCondition = `created_at BETWEEN '${formatDate(firstDayOfLastMonth)}' AND '${formatDate(lastDayOfLastMonth)}'`;
        break;
      case "Custom":
        if (startDate && endDate) {
          dateCondition = `created_at BETWEEN '${startDate} 00:00:00' AND '${endDate} 23:59:59'`;
        }
        break;
    }

    // Helper: table-specific filters
    const buildWhere = (tableName) => {
      const filters = [];
      if (dateCondition) filters.push(dateCondition);
      if (counselor_id) filters.push(`counselor_id = '${counselor_id}'`);

      // Only add these for inquiries (and related tables that have them)
      if (tableName === "inquiries") {
        if (country) filters.push(`country = '${country}'`);
        if (intake) filters.push(`intake = '${intake}'`);
        if (leadStatus) filters.push(`lead_status = '${leadStatus}'`);
      }

      return filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    };

    // ---- Dashboard KPIs ----
    const [leads] = await db.query(`
      SELECT COUNT(*) AS totalLeads 
      FROM inquiries 
      ${buildWhere("inquiries")}
    `);

    const [students] = await db.query(`
      SELECT COUNT(*) AS totalStudents 
      FROM students 
      ${buildWhere("students")}
    `);

    const [tasks] = await db.query(`
      SELECT COUNT(*) AS totalTasks 
      FROM tasks 
      ${buildWhere("tasks")}
    `);

    const [applications] = await db.query(`
      SELECT COUNT(*) AS total 
      FROM visa_process
      ${buildWhere("visa_process")}
    `);

    // ---- University count (you can adjust as needed) ----
    const [universities] = await db.query(`
      SELECT COUNT(*) AS totalUniversities 
      FROM counselors 
      ${counselor_id ? `WHERE id = '${counselor_id}'` : ""}
    `);

    // ---- Conversion Rate ----
    const conversionRate =
      leads[0].totalLeads > 0
        ? ((students[0].totalStudents / leads[0].totalLeads) * 100).toFixed(2)
        : "0.00";

    // ---- Recent Leads ----
    // const [recentLeads] = await db.query(`
    //   SELECT full_name AS name, country, intake, lead_status AS status, follow_up_date AS last_follow_up
    //   FROM inquiries
    //   ${buildWhere("inquiries")}
    //   ORDER BY created_at DESC
    //   LIMIT 5
    // `);
    


    const [recentLeads] = await db.query(`
  SELECT 
    i.full_name AS name, 
    i.country, 
    i.intake, 
    i.lead_status AS status,
    (
      SELECT MAX(f.last_followup_date) 
      FROM followuphistory f 
      WHERE f.inquiry_id = i.id
    ) AS last_follow_up
  FROM inquiries i
  ${buildWhere("inquiries")}
  ORDER BY i.created_at DESC
  LIMIT 5
`);








    

    // ---- Student Applications ----
    // const [studentApps] = await db.query(`
    //   SELECT 
    //     s.full_name AS name, 
    //     u.name AS university, 
    //     a.Application_stage AS stage, 
    //     a.created_at AS assigned_date 
    //   FROM visa_process a
    //   JOIN students s ON a.student_id = s.id
    //   JOIN universities u ON a.university_id = u.id
    //   ${counselor_id ? `WHERE a.counselor_id = '${counselor_id}'` : ""}
    //   ORDER BY a.created_at DESC
    //   LIMIT 5
    // `);

//     const [studentApps] = await db.query(
//   `
//   SELECT vp.*, 
//          s.full_name AS student_name, 
//          u.name AS university_name
//   FROM visa_process vp
//   JOIN students s ON vp.student_id = s.id
//   JOIN universities u ON vp.university_id = u.id
//    ${counselor_id ? `WHERE a.counselor_id = '${counselor_id}'` : ""}
//   ORDER BY vp.created_at DESC
//   LIMIT 5
//   `,
// );



    const [studentApps] = await db.query(
  `
  SELECT vp.*,
         u.name AS university_name
  FROM visa_process vp
  JOIN universities u ON vp.university_id = u.id
   ${counselor_id ? `WHERE vp.counselor_id = '${counselor_id}'` : ""}
  ORDER BY vp.created_at DESC
  LIMIT 5
  `,
);



    // ---- Final Response ----
    res.status(200).json({
      kpi: {
        totalLeads: leads[0].totalLeads,
        totalStudents: students[0].totalStudents,
        totalUniversities: universities[0].totalUniversities,
        totalTasks: tasks[0].totalTasks,
        conversionRate: `${conversionRate}%`,
        inquiries: leads[0].totalLeads,
        applications: applications[0].total,
      },
      recentLeads,
      studentApplications: studentApps,
    });
  } catch (error) {
    console.error("❌ Counselor Dashboard Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


export const sataffdashboard = async (req, res) => {
  try {
    const { branch, created_at } = req.query;
    const timeZone = '+05:30'; // IST

    // Base queries
    let leadQuery = `SELECT COUNT(*) AS totalleads FROM inquiries WHERE lead_status = 'Converted to Lead'`;
    let inquiryQuery = `SELECT COUNT(*) AS totalinquiries FROM inquiries`;
    const leadParams = [];
    const inquiryParams = [];

    // Branch filter
    if (branch && branch.trim() !== "") {
      leadQuery += " AND branch = ?";
      inquiryQuery += " WHERE branch = ?";
      leadParams.push(branch);
      inquiryParams.push(branch);
    }

    // Created_at filter (IST)
    if (created_at) {
      leadQuery += ` AND DATE(CONVERT_TZ(created_at, '+00:00', '${timeZone}')) >= ?`;
      inquiryQuery += ` AND DATE(CONVERT_TZ(created_at, '+00:00', '${timeZone}')) >= ?`;
      leadParams.push(created_at);
      inquiryParams.push(created_at);
    }

    // Run the queries
    const [totalLeads] = await db.query(leadQuery, leadParams);
    const [totalInquiries] = await db.query(inquiryQuery, inquiryParams);

    // Response
    res.status(200).json({
      success: true,
      data: {
        branch: branch || "All Branches",
        total_leads: totalLeads[0].totalleads,
        total_inquiries: totalInquiries[0].totalinquiries,
        chart_data: [
          { label: "Leads", value: totalLeads[0].totalleads },
          { label: "Inquiries", value: totalInquiries[0].totalinquiries }
        ]
      }
    });
  } catch (error) {
    console.error("❌ Dashboard summary error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


export const studentsdashboard = async (req, res) => {
  try {
    const { student_id } = req.params;

    // Total tasks for this student
    const [taskCount] = await db.query(
      `SELECT COUNT(*) AS totaltasks FROM tasks WHERE student_id = ?`,
      [student_id]
    );

    // Total payments for this student
    const [paymentCount] = await db.query(
      `SELECT COUNT(*) AS totalpayments FROM payments WHERE name = ?`,
      [student_id]
    );

     const [Todalvisa_processCount] = await db.query(
      `SELECT COUNT(*) AS totalvisa_process FROM visa_process WHERE student_id = ?`,
      [student_id]
    );

    res.status(200).json({
      success: true,
      data: {
        totaltasks: taskCount[0].totaltasks,
        totalpayments: paymentCount[0].totalpayments,
        totalvisa_process: Todalvisa_processCount[0].totalvisa_process,
      }
    });
  } catch (error) {
    console.error("❌ Dashboard summary error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};



export const processordashboard = async (req, res) => {
  try {
    const { processor_id } = req.params;

    const [applicationCount] = await db.query(
      `SELECT COUNT(*) AS totalapplication FROM students WHERE processor_id = ?`,
      [processor_id] // ✅ fixed: added comma before this line
    );
    const [documentCount] = await db.query(
      `SELECT COUNT(*) AS totaldocumentCount FROM visa_process WHERE processor_id = ?`,
      [processor_id] // ✅ fixed: added comma before this line
    );

    res.status(200).json({
      success: true,
      data: {
        totalapplication: applicationCount[0].totalapplication,
        totaldocumentCount: documentCount[0].totaldocumentCount,
        chart_data: [
          { label: 'Assign Students', value: applicationCount[0].totalapplication },
          { label: 'Assign Visa Processing Student', value: documentCount[0].totaldocumentCount },
        ]
      }
    });
  } catch (error) {
    console.error("❌ Dashboard summary error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};



export const masteradmindashboard = async (req, res) => {
  try {
    const [totaladminCount] = await db.query(
      `SELECT COUNT(*) AS totaladmin FROM users WHERE role = 'admin'` // ✅ fixed: added comma before this line
    );


    res.status(200).json({
      success: true,
      data: {
        totaladmin: totaladminCount[0].totaladmin,
        chart_data: [
          { label: 'Admin', value: totaladminCount[0].totaladmin },
        ]
      }
    });
  } catch (error) {
    console.error("❌ Dashboard summary error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};






