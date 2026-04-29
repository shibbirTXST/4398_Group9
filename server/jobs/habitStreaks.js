import cron from 'node-cron';
import db from '../db/db.js';

export const resetHabitsCronJob = () => {
  cron.schedule('0 0 * * *', async () => {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    try {
      // Find habits NOT completed yesterday
      const yesterday = new Date(startOfDay);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);

      const missedHabits = await db.habit.findMany({
        where: {
          status: 'Active',
          logs: {
            none: {
              logDate: {
                gte: yesterday,
                lt: startOfDay,
              },
              completionStatus: true,
            },
          },
        },
      });

      await db.habit.updateMany({
        where: {
          habitId: { in: missedHabits.map(h => h.habitId) },
        },
        data: {
          currentStreak: 0,
        },
      });

      console.log(`Reset ${missedHabits.length} streaks`);
    } catch (err) {
      console.error('Error resetting streaks:', err);
    }
  });
};