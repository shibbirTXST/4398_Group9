import cron from 'node-cron';
import db from '../db/db.js';

export const runStreakJob = async () => {
    const yesterdayStart = new Date();
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);

    const yesterdayEnd = new Date(yesterdayStart);
    yesterdayEnd.setHours(23, 59, 59, 999);

    try {
      const habits = await db.habit.findMany({
        where: { status: 'Active' },
      });

      for (const habit of habits) {
        const last = habit.lastCompletedAt;

        const completedYesterday =
          last &&
          new Date(last) >= yesterdayStart &&
          new Date(last) <= yesterdayEnd;

        if (completedYesterday) continue;

        // Missed day
        if (habit.streakShields > 0) {
          await db.habit.update({
            where: { habitId: habit.habitId },
            data: {
              streakShields: Math.max(0, habit.streakShields - 1),
              // streak stays the same
            },
          });
        } else {
          await db.habit.update({
            where: { habitId: habit.habitId },
            data: {
              currentStreak: 0,
            },
          });
        }
      }

      console.log('Streak cron job completed');
    } catch (err) {
      console.error('Error in streak cron job:', err);
    }
};

export const streakCronJob = () => {
    cron.schedule('0 0 * * *', runStreakJob)
}