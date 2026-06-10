import cron from 'node-cron';
import { runDripCampaign } from '../services/marketingAutomation.service.js';
import { runDocumentReminder } from '../services/documentReminder.service.js';

export const startCronJobs = () => {
    console.log("[CronManager] Initializing background automated jobs...");

    // Run every day at 9:00 AM server time
    cron.schedule('0 9 * * *', async () => {
        console.log("[CronManager] Running daily tasks at 9:00 AM...");
        await runDripCampaign();
        await runDocumentReminder();
    });

    // We can also add a testing cron that runs every hour (optional, disabled for prod)
    // cron.schedule('0 * * * *', async () => { ... });

    console.log("[CronManager] Background jobs scheduled successfully.");
};
