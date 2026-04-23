import 'dotenv/config';
import app from './app.js';
import { startReminderCronJob } from './jobs/reminder.js';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  startReminderCronJob();
  console.log('Background cron jobs initialized.');
});