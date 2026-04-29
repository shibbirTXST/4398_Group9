import 'dotenv/config';
import app from './app.js';
import { startReminderCronJob } from './jobs/reminder.js';
import { resetHabitsCronJob } from './jobs/habitStreaks.js';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  startReminderCronJob();
  resetHabitsCronJob();
  console.log('Background cron jobs initialized.');
});