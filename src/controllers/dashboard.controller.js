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
  
    const getDateFilter = (alias = '') =>
      startDate && endDate
        ? `${alias}created_at BETWEEN '${startDate} 00:00:00' AND '${endDate} 23:59:59'`
        : '';
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

    const buildWhereClause = (filters, hasExistingWhere = false) => {
      if (!filters.length) return '';
      return `${hasExistingWhere ? ' AND ' : 'WHERE'} ${filters.join(' AND ')}`;
    };

    const [totalLeads] = await db.query(`
      SELECT COUNT(*) AS totalleads 
      FROM inquiries 
      WHERE lead_status = 'Converted to Lead'
      ${buildWhereClause(leadFilters, true)}
    `);

    const [totalStudents] = await db.query(`SELECT COUNT(*) AS totalstudents FROM students ${buildWhereClause(commonFilters)}`);

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
        SUM(CASE WHEN MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) THEN 1 ELSE 0 END) AS this_month_total,
        SUM(CASE WHEN MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) AND lead_status = 'Converted to Lead' THEN 1 ELSE 0 END) AS this_month_converted,
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
      SELECT country, COUNT(*) AS inquiries
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
        SELECT Application_stage, Interview, Visa_process
        FROM studentapplicationprocess 
        WHERE student_id = ? AND university_id = ?`;
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
    const { dateRange, startDate, endDate, country, intake, leadStatus, counselor_id } = req.query;

    const now = new Date();
    const formatDate = (date) => date.toISOString().slice(0, 19).replace("T", " ");

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
      case "Today": dateCondition = `DATE(created_at) = CURDATE()`; break;
      case "ThisWeek": dateCondition = `created_at BETWEEN '${formatDate(firstDayOfWeek)}' AND '${formatDate(lastDayOfWeek)}'`; break;
      case "ThisMonth": dateCondition = `created_at BETWEEN '${formatDate(firstDayOfMonth)}' AND '${formatDate(lastDayOfMonth)}'`; break;
      case "LastMonth": dateCondition = `created_at BETWEEN '${formatDate(firstDayOfLastMonth)}' AND '${formatDate(lastDayOfLastMonth)}'`; break;
      case "Custom": if (startDate && endDate) dateCondition = `created_at BETWEEN '${startDate} 00:00:00' AND '${endDate} 23:59:59'`; break;
    }

    const buildWhere = (tableName) => {
      const filters = [];
      if (dateCondition) filters.push(dateCondition);
      if (counselor_id) filters.push(`counselor_id = '${counselor_id}'`);
      if (tableName === "inquiries") {
        if (country) filters.push(`country = '${country}'`);
        if (intake) filters.push(`intake = '${intake}'`);
        if (leadStatus) filters.push(`lead_status = '${leadStatus}'`);
      }
      return filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    };

    // KPIs
    const [leads] = await db.query(`SELECT COUNT(*) AS totalLeads FROM inquiries ${buildWhere("inquiries")}`);
    const [students] = await db.query(`SELECT COUNT(*) AS totalStudents FROM students ${buildWhere("students")}`);
    const [tasksCount] = await db.query(`
      SELECT COUNT(*) AS totalTasks FROM tasks t
      JOIN students s ON t.student_id = s.id
      WHERE s.counselor_id = ?`, [counselor_id]);

    const [recentTasks] = await db.query(`
      SELECT t.id, t.title, t.due_date, t.status, s.full_name AS student_name
      FROM tasks t
      JOIN students s ON t.student_id = s.id
      WHERE s.counselor_id = ?
      ORDER BY t.created_at DESC LIMIT 10`, [counselor_id]);

    const [applications] = await db.query(`SELECT COUNT(*) AS total FROM visa_process ${buildWhere("visa_process")}`);

    const [universities] = await db.query(`
      SELECT COUNT(DISTINCT university_id) AS totalUniversities 
      FROM visa_process WHERE counselor_id = ?`, [counselor_id]);

    const totalLeads = leads[0].totalLeads || 0;
    const totalApplications = applications[0].total || 0;
    const conversionRate = totalLeads > 0 ? ((totalApplications / totalLeads) * 100).toFixed(2) : "0.00";

    const [recentLeads] = await db.query(`
      SELECT i.id, i.full_name AS name, i.country, i.intake, i.lead_status AS status,
        (SELECT MAX(f.last_followup_date) FROM followuphistory f WHERE f.inquiry_id = i.id) AS last_follow_up
      FROM inquiries i WHERE i.counselor_id = ? ORDER BY i.created_at DESC LIMIT 10`, [counselor_id]);

    const [studentApps] = await db.query(`
      SELECT vp.*, u.name AS university_name
      FROM visa_process vp
      JOIN universities u ON vp.university_id = u.id
      WHERE vp.counselor_id = ? ORDER BY vp.created_at DESC LIMIT 5`, [counselor_id]);

    res.status(200).json({
      kpi: {
        totalLeads: leads[0].totalLeads,
        totalStudents: students[0].totalStudents,
        totalUniversities: universities[0].totalUniversities,
        totalTasks: tasksCount[0].totalTasks,
        conversionRate,
        inquiries: leads[0].totalLeads,
        applications: applications[0].total,
      },
      recentLeads,
      studentApplications: studentApps,
      recentTasks,
    });
  } catch (error) {
    console.error("❌ Counselor Dashboard Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const staffdashboard = async (req, res) => {
  try {
    const { branch, created_at, fromDate, toDate, country, counselor_id, staff_id } = req.query;
    const timeZone = '+05:30';

    let baseConditions = [];
    let params = [];

    // Base Staff filter
    if (staff_id) {
      baseConditions.push("(assigned_staff_id = ? OR created_by = (SELECT id FROM users WHERE staff_id = ?))");
      params.push(staff_id, staff_id);
    } else if (branch && branch.trim() !== "") {
      // Fallback to branch if staff_id is missing (legacy behavior)
      baseConditions.push("branch = ?");
      params.push(branch);
    }

    if (fromDate && toDate) {
      baseConditions.push(`DATE(CONVERT_TZ(created_at, '+00:00', '${timeZone}')) BETWEEN ? AND ?`);
      params.push(fromDate, toDate);
    } else if (created_at) {
      baseConditions.push(`DATE(CONVERT_TZ(created_at, '+00:00', '${timeZone}')) >= ?`);
      params.push(created_at);
    }

    if (country && country.trim() !== "") {
      baseConditions.push("country = ?");
      params.push(country);
    }

    if (counselor_id) {
      baseConditions.push("counselor_id = ?");
      params.push(counselor_id);
    }

    let whereClause = baseConditions.length > 0 ? "WHERE " + baseConditions.join(" AND ") : "";
    let leadWhereClause = whereClause ? whereClause + " AND lead_status = 'Converted to Lead'" : "WHERE lead_status = 'Converted to Lead'";

    const leadQuery = `SELECT COUNT(*) AS totalleads FROM inquiries ${leadWhereClause}`;
    const inquiryQuery = `SELECT COUNT(*) AS totalinquiries FROM inquiries ${whereClause}`;
    const officeVisitedQuery = `SELECT COUNT(*) AS office_visited FROM inquiries ${whereClause ? whereClause + " AND " : "WHERE "} new_leads IN ('Visited Office', 'Office Visit Confirmed')`;
    const scheduledVisitsQuery = `SELECT COUNT(*) AS scheduled_visits FROM inquiries ${whereClause ? whereClause + " AND " : "WHERE "} new_leads = 'Office Visit Scheduled'`;
    
    // Total follow-ups for these inquiries
    const followUpQuery = `
      SELECT COUNT(*) AS total_follow_ups 
      FROM followuphistory 
      WHERE inquiry_id IN (SELECT id FROM inquiries ${whereClause})
    `;

    // Monthly Target (Current Month Office Visits)
    const currentMonthCondition = `MONTH(office_visit_date) = MONTH(CURRENT_DATE()) AND YEAR(office_visit_date) = YEAR(CURRENT_DATE())`;
    const targetAchievedQuery = `
      SELECT COUNT(*) AS monthly_achieved 
      FROM inquiries 
      ${whereClause ? whereClause + " AND " : "WHERE "} 
      new_leads IN ('Visited Office', 'Office Visit Confirmed') AND ${currentMonthCondition}
    `;

    // params are used multiple times for the first queries
    const [totalLeads] = await db.query(leadQuery, params);
    const [totalInquiries] = await db.query(inquiryQuery, params);
    const [officeVisited] = await db.query(officeVisitedQuery, params);
    const [scheduledVisits] = await db.query(scheduledVisitsQuery, params);
    const [totalFollowUps] = await db.query(followUpQuery, params);
    const [monthlyAchieved] = await db.query(targetAchievedQuery, params);

    const leadsCount = totalLeads[0].totalleads || 0;
    const inquiriesCount = totalInquiries[0].totalinquiries || 0;
    const visitedCount = officeVisited[0].office_visited || 0;
    const scheduledCount = scheduledVisits[0].scheduled_visits || 0;
    const followUpsCount = totalFollowUps[0].total_follow_ups || 0;
    const achievedCount = monthlyAchieved[0].monthly_achieved || 0;

    const conversionRate = leadsCount > 0 ? ((visitedCount / leadsCount) * 100).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      data: {
        branch: branch || "All Branches",
        total_leads: leadsCount,
        total_inquiries: inquiriesCount,
        office_visited: visitedCount,
        scheduled_visits: scheduledCount,
        total_follow_ups: followUpsCount,
        monthly_achieved: achievedCount,
        monthly_target: 100, // Hardcoded target
        conversion_rate: parseFloat(conversionRate),
        chart_data: [
          { label: "Leads", value: leadsCount }, 
          { label: "Inquiries", value: inquiriesCount }
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
    
    // Count tasks that are NOT completed/complete
    const [pendingTaskCount] = await db.query(
      `SELECT COUNT(*) AS pendingtasks FROM tasks WHERE student_id = ? AND status NOT IN ('Completed', 'Complete', 'completed', 'complete')`, 
      [student_id]
    );

    // Count payments that are NOT paid/approved
    const [pendingPaymentCount] = await db.query(
      `SELECT COUNT(*) AS pendingpayments FROM payments p 
       INNER JOIN students s ON CAST(p.name AS UNSIGNED) = s.id 
       WHERE s.id = ? AND p.payment_status NOT IN ('Paid', 'paid', 'Approved', 'Approve', 'approved', 'approve')`, 
      [student_id]
    );

    const [visaProcessCount] = await db.query(
      `SELECT COUNT(*) AS totalvisa_process FROM visa_process WHERE student_id = ?`, 
      [student_id]
    );
    
    res.status(200).json({
      success: true,
      data: {
        totaltasks: pendingTaskCount[0].pendingtasks,
        totalpayments: pendingPaymentCount[0].pendingpayments,
        totalvisa_process: visaProcessCount[0].totalvisa_process,
      }
    });
  } catch (error) {
    console.error("❌ Dashboard summary error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getRecentUpdates = async (req, res) => {
  try {
    const { student_id } = req.params;
    
    // Fetch recent tasks, visa status changes, and notifications
    const [tasks] = await db.query(`
      SELECT 'task' as type, title as title, description as description, created_at as date 
      FROM tasks WHERE student_id = ? ORDER BY created_at DESC LIMIT 3
    `, [student_id]);

    const [notifications] = await db.query(`
      SELECT 'notification' as type, 
             IF(u.full_name IS NOT NULL, REPLACE(dn.message, dn.user_id, u.full_name), dn.message) as title, 
             '' as description, dn.created_at as date 
      FROM dashboard_notifications dn
      LEFT JOIN users u ON dn.user_id = u.id
      WHERE dn.student_id = ? ORDER BY dn.created_at DESC LIMIT 3
    `, [student_id]);

    const updates = [...tasks, ...notifications]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    res.status(200).json({
      success: true,
      data: updates
    });
  } catch (error) {
    console.error("❌ Recent updates error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const processordashboard = async (req, res) => {
  try {
    const { processor_id } = req.params;
    const { search, fromDate, toDate, country, university } = req.query;
    console.log("Fetching dashboard for processor:", processor_id, req.query);

    // Build base conditions for students table
    let studentConditions = ["processor_id = ?"];
    let studentParams = [processor_id];

    if (search) {
      studentConditions.push("(full_name LIKE ? OR student_email LIKE ?)");
      studentParams.push(`%${search}%`, `%${search}%`);
    }
    if (fromDate && toDate) {
      studentConditions.push("created_at >= ? AND created_at <= ?");
      studentParams.push(`${fromDate} 00:00:00`, `${toDate} 23:59:59`);
    }
    if (country) {
      studentConditions.push("country = ?");
      studentParams.push(country);
    }
    if (university) {
      // Assuming university_name exists in students or we join.
      // But simpler: just filter students who have applications in this university
      studentConditions.push("id IN (SELECT student_id FROM studentapplicationprocess WHERE university_name = ?)");
      studentParams.push(university);
    }

    const studentWhereClause = studentConditions.join(" AND ");

    // Build base conditions for visa_process table
    let visaConditions = ["processor_id = ?"];
    let visaParams = [processor_id];

    if (search) {
      visaConditions.push("(full_name LIKE ? OR email LIKE ?)");
      visaParams.push(`%${search}%`, `%${search}%`);
    }
    if (fromDate && toDate) {
      visaConditions.push("created_at >= ? AND created_at <= ?");
      visaParams.push(`${fromDate} 00:00:00`, `${toDate} 23:59:59`);
    }
    if (university) {
      visaConditions.push("applied_program = ?");
      visaParams.push(university);
    }
    // Note: visa_process doesn't have country directly, so we might skip it or join students.
    if (country) {
      visaConditions.push("student_id IN (SELECT id FROM students WHERE country = ?)");
      visaParams.push(country);
    }

    const visaWhereClause = visaConditions.join(" AND ");

    // Build base conditions for tasks table
    let taskConditions = ["s.processor_id = ?"];
    let taskParams = [processor_id];

    if (search) {
      taskConditions.push("(s.full_name LIKE ? OR t.title LIKE ?)");
      taskParams.push(`%${search}%`, `%${search}%`);
    }
    if (fromDate && toDate) {
      taskConditions.push("t.created_at >= ? AND t.created_at <= ?");
      taskParams.push(`${fromDate} 00:00:00`, `${toDate} 23:59:59`);
    }
    if (country) {
      taskConditions.push("s.country = ?");
      taskParams.push(country);
    }

    const taskWhereClause = taskConditions.join(" AND ");


    // Queries
    const [applicationCount] = await db.query(`SELECT COUNT(*) AS totalapplication FROM students WHERE ${studentWhereClause}`, studentParams);
    const [documentCount] = await db.query(`SELECT COUNT(*) AS totaldocumentCount FROM visa_process WHERE ${visaWhereClause}`, visaParams);
    const [taskCount] = await db.query(`SELECT COUNT(*) AS totaltasks FROM tasks t JOIN students s ON t.student_id = s.id WHERE ${taskWhereClause}`, taskParams);
    const [recentTasks] = await db.query(`SELECT t.id, t.title as name, t.due_date, t.status, s.full_name AS student_name FROM tasks t JOIN students s ON t.student_id = s.id WHERE ${taskWhereClause} ORDER BY t.created_at DESC LIMIT 10`, taskParams);

    // All Stages Overview Query
    const [stagesOverview] = await db.query(`
      SELECT 
        SUM(registration_visa_processing_stage) as registration,
        SUM(documents_visa_processing_stage) as documents,
        SUM(university_application_visa_processing_stage) as applied,
        SUM(university_interview_visa_processing_stage) as interview,
        SUM(offer_letter_visa_processing_stage) as offer_letter,
        SUM(tuition_fee_visa_processing_stage) as tuition_fee,
        SUM(visa_approval_visa_processing_stage) as visa_approved
      FROM visa_process 
      WHERE ${visaWhereClause}
    `, visaParams);

    // Helper to extract stage counts safely
    const stageData = stagesOverview[0] || {};
    const all_stages = {
      "Registration": stageData.registration || 0,
      "Documents": stageData.documents || 0,
      "Applied": stageData.applied || 0,
      "Interview": stageData.interview || 0,
      "Offer Letter": stageData.offer_letter || 0,
      "Tuition Fee": stageData.tuition_fee || 0,
      "Visa Approved": stageData.visa_approved || 0
    };

    console.log("Dashboard Stats for ID", processor_id, ":", {
      apps: applicationCount[0].totalapplication,
      docs: documentCount[0].totaldocumentCount,
      tasks: taskCount[0].totaltasks
    });

    res.status(200).json({
      success: true,
      data: {
        totalapplication: applicationCount[0].totalapplication,
        totaldocumentCount: documentCount[0].totaldocumentCount,
        totaltasks: taskCount[0].totaltasks,
        chart_data: [
          { label: 'Students', value: applicationCount[0].totalapplication },
          { label: 'Visa Processes', value: documentCount[0].totaldocumentCount },
          { label: 'Tasks', value: taskCount[0].totaltasks },
        ],
        recentTasks: recentTasks,
        all_stages: all_stages
      }
    });
  } catch (error) {
    console.error("❌ Processor Dashboard Error:", error);
    res.status(500).json({ success: false, message: "Failed to load dashboard statistics", error: error.message });
  }
};

export const masteradmindashboard = async (req, res) => {
  try {
    const [totaladminCount] = await db.query(`SELECT COUNT(*) AS totaladmin FROM users WHERE role = 'admin'`);
    res.status(200).json({
      success: true,
      data: {
        totaladmin: totaladminCount[0].totaladmin,
        chart_data: [{ label: 'Admin', value: totaladminCount[0].totaladmin }]
      }
    });
  } catch (error) {
    console.error("❌ Dashboard summary error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
