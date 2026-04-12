import cron from 'node-cron';
import db from '../db/db.js';

export const resetHabitsCronJob = () => {
    cron.schedule('7 15 * * *', async () => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    try {
        // Find all active habits that were NOT completed today
        const incompleteHabits = await db.habit.findMany({
        where: {
            status: 'Active',
            logs: {
                none: {
                    logDate: { gte: startOfDay },
                    completionStatus: true,
                },
            },
        },
        });

        // Reset streaks for incomplete habits
        await db.habit.updateMany({
            where: { habitId: { in: incompleteHabits.map(h => h.habitId) } },
            data: { currentStreak: 0 },
        });

        console.log(`Reset streaks for ${incompleteHabits.length} habits.`);
    } catch (err) {
        console.error('Error during habit reset:', err);
    }
    });
}