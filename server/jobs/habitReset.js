import cron from 'node-cron';
import db from '../db/db.js';

export const resetHabitsCronJob = () => {
    cron.schedule('59 23 * * *', async () => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999)

    try {
        // Find all active habits that were NOT completed today
        const incompleteHabits = await db.habit.findMany({
        where: {
            status: 'Active',
            logs: {
                none: {
                    logDate: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
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