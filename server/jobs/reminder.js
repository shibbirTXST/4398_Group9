import cron from 'node-cron';
import { Expo } from 'expo-server-sdk';
import db from '../db/db.js';

// Initialize the Expo client
const expo = new Expo();

export const startReminderCronJob = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      // Find all habits that have a reminder set for this exact minute
      const dueReminders = await db.reminder.findMany({
        where: {
          reminderTime: currentTime,
          enabledStatus: true,
        },
        include: {
          habit: {
            include: {
              user: true, 
            },
          },
        },
      });

      if (dueReminders.length === 0) return;

      console.log(`[Cron] Processing ${dueReminders.length} reminder(s) for ${currentTime}...`);

      // Create an array to hold the formatted messages
      const messages = [];

      for (const reminder of dueReminders) {
        const user = reminder.habit.user;
        const habit = reminder.habit;

        // Verify the token actually exists and is a valid Expo format
        if (user.pushToken && Expo.isExpoPushToken(user.pushToken)) {
          messages.push({
            to: user.pushToken,
            sound: 'default',
            title: 'Time for your habit!',
            body: `Don't forget to ${habit.habitName} today.`,
            data: { habitId: habit.habitId }, // Extra data the app can read when tapped
          });
        } else {
          console.log(`[Push Skipped] Invalid or missing token for ${user.username}.`);
        }
      }

      // Expo requires messages to be sent in batches (chunks)
      const chunks = expo.chunkPushNotifications(messages);
      const tickets = [];

      // Send the chunks to the Expo Push Service
      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('[Expo Error] Failed to send push notification chunk:', error);
        }
      }

      console.log(`[Cron] Successfully sent ${tickets.length} notifications.`);
      
    } catch (error) {
      console.error('[Cron Error] Failed to process reminders:', error);
    }
  });
};