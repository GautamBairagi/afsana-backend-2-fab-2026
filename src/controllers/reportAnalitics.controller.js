import db from '../config/db.js';
import { getCounselorById } from '../models/counselor.model.js';

export const overview = async (req, res) => {
    try {
        const query = `
            SELECT 
                (SELECT COUNT(*) FROM inquiries) AS total_inquiries,
                (SELECT COUNT(*) FROM studentapplicationprocess WHERE Application_stage = true AND Visa_process = false) AS total_Active_Applications,
                (SELECT COUNT(*) FROM studentapplicationprocess WHERE Application_stage = true AND Visa_process = true ) AS total_fulfill_Applications
        `;
        const queryTotal = `SELECT COUNT(*) AS total FROM follow_ups`;
        const queryInProgress = `SELECT COUNT(*) AS inProgress FROM follow_ups WHERE status = 'In Progress'`;

        const [overviewData, totalData, inProgressData] = await Promise.all([
            db.query(query),
            db.query(queryTotal),
            db.query(queryInProgress)
        ]);

        console.log("Overview Data: ", overviewData);
        console.log("Total Data: ", totalData);
        console.log("In Progress Data: ", inProgressData);

        // Extract the data correctly considering the nested structure
        const overview = overviewData[0][0] ?? { total_inquiries: 0, total_Active_Applications: 0, total_fulfill_Applications : 0 };
        const total = totalData[0][0]?.total ?? 0;
        const inProgress = inProgressData[0][0]?.inProgress ?? 0;

        console.log("Parsed Overview: ", overview);
        console.log("Parsed Total: ", total);
        console.log("Parsed In Progress: ", inProgress);

        const percentage = total > 0 ? (inProgress / total) * 100 : 0;

        res.status(200).json({
            total_inquiries: overview.total_inquiries,
            total_Active_Applications: overview.total_Active_Applications,
            total_fulfill_Applications: overview.total_fulfill_Applications,
            follow_up_stats: {
                total,
                inProgress,
                percentage: percentage.toFixed(2) + "%"
            }
        });

    } catch (error) {
        console.error("Error in overview: ", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

export const  CounselorPerformance = async (req, res) =>{
    try {
        const query = `
            SELECT 
                counselor AS counselor_id,
                COUNT(id) AS total_leads,
                SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) AS active,
                SUM(CASE WHEN status = 'Converted' THEN 1 ELSE 0 END) AS converted,
                ROUND(
                    (SUM(CASE WHEN status = 'Converted' THEN 1 ELSE 0 END) / COUNT(id)) * 100, 
                    2
                ) AS conversion_rate,
                ROUND(
                    ABS(AVG(TIMESTAMPDIFF(MINUTE, created_at, follow_up_date)) / 60),
                    2
                ) AS avg_response_time
            FROM leads
            GROUP BY counselor
        `;

        const [data] = await db.query(query);

         const result = await Promise.all(
              data.map(async (task) => {
                

                const counselorID = task.counselor_id;
                const counselor_name = await getCounselorById(counselorID);
                
                return {
                  ...task,
                  counselor_name: counselor_name[0]?.full_name || ''
                };
              })
            );

        res.status(200).json({ result });
        
    } catch (error) {
        console.error("Error in overview: ", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
}

export const applicationPipline = async (req, res) => {
    try {
        const queryTotal = `SELECT COUNT(*) AS total FROM inquiries`;
        const queryInAppProgress = `SELECT COUNT(*) AS total FROM studentapplicationprocess`;
        const queryInAdmissionDecision = `SELECT COUNT(*) AS total FROM admission_decisions WHERE status = 'accepted'`;
        const queryInTask = `SELECT COUNT(*) AS total FROM tasks WHERE status = 'Completed'`;

        const [[totalInquiries], [inAppProgress], [ admissionDecisions ], [ completedTasks]] = await Promise.all([
            db.query(queryTotal),
            db.query(queryInAppProgress),
            db.query(queryInAdmissionDecision),
            db.query(queryInTask)
        ]);

        console.log("Total Inquiries: ", totalInquiries[0].total);
        console.log("In App Progress: ", inAppProgress[0].total);
        console.log("Admission Decisions: ", admissionDecisions);
        console.log("Completed Tasks: ", completedTasks);

        res.status(200).json({
            total_inquiries: totalInquiries[0].total,
            in_app_progress: inAppProgress[0].total,
            admission_decisions: admissionDecisions[0].total,
            completed_tasks: completedTasks[0].total
        });

    } catch (error) {
        console.error('Error in applicationPipline:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
