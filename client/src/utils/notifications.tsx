import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../config/API_base_url';

export type PushTokenResult = {
  token: string | null;
  error?: string;
};

// Ask the user for permission and generate the token
export async function registerForPushNotificationsAsync(): Promise<PushTokenResult> {
  let token;

  // Android requires a "channel" to be set up before it will receive notifications
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // Push notifications only work on real phones, not computer simulators
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    // If they haven't been asked yet, pop up the native iOS/Android permission prompt
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return { token: null, error: 'User denied push notification permissions.' };
    }
    
    try {
      // Fetch the Project ID dynamically 
      const projectId = 
        Constants?.expoConfig?.extra?.eas?.projectId ?? 
        Constants?.easConfig?.projectId;

      // Generate the actual string token to save to the database
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: 'Habit-tracker-app',
      })).data;
      
      console.log("Successfully generated Expo Push Token:", token);
    } catch (e: any) {
       return { token: null, error: e.message };
    }
  } else {
    return { token: null, error: 'Must use a physical phone for Push Notifications' };
  }

  return { token };
}

// Send the token to backend
export async function savePushTokenToServer(pushToken: string, idToken: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/push-token`, { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({ pushToken }),
    });
    
    if (!response.ok) {
       return { ok: false, error: 'Backend failed to save the token' };
    }
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}