import React, { useState } from 'react';
import { auth } from '../config/firebase';
import { StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, HelperText, Appbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { API_BASE_URL } from '../config/API_base_url';
import ReminderTimePicker from '../components/ReminderTimePicker';

export default function HabitAdditionScreen() {
  const [taskName, setTaskName] = useState('');
  const [reminderTime, setReminderTime] = useState<Date>(new Date(new Date().setHours(9, 0, 0, 0)));
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<StackNavigationProp<any>>();



  const handleCreateHabit = async () => {
    if (!taskName.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    // Format the Date object into a 24-hour string (e.g., "14:30") for the backend
    const formattedTime = `${reminderTime.getHours().toString().padStart(2, '0')}:${reminderTime.getMinutes().toString().padStart(2, '0')}`;

    // Use new payload structure, but add formatted time
    const newHabitPayload = {
      habitName: taskName.trim(),
      reminderTime: formattedTime, // Added time format
      frequencyType: 'Daily',
      status: 'Active',
    };

    try {
      const user = auth.currentUser;
      if (!user) {
        setError('User not authenticated. Please sign in again.');
        setLoading(false);
        return;
      }

      const token = await user.getIdToken();
      setToken(token);

      // Swap out localhost for API_BASE_URL
      const response = await fetch(`${API_BASE_URL}/api/habits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newHabitPayload),
      });

      const jsonResponse = await response.json();

      if (response.status === 201) {
        setTaskName('');
        setReminderTime(new Date(new Date().setHours(9, 0, 0, 0))); // Reset time picker
        navigation.navigate('Dashboard', {
          newHabit: jsonResponse.habit,
          successMessage: 'Habit added successfully!',
        });
      } else {
        setError(jsonResponse.error || 'Failed to create habit');
      }
    } catch (err: any) {
      console.error(err);
      setError('Network Error: Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="New Habit" />
      </Appbar.Header>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={styles.title}>Create a Habit</Text>
            <Text style={styles.subtitle}>What do you want to track today?</Text>

            <TextInput
              label="Habit Name"
              placeholder="e.g., Drink Water"
              value={taskName}
              onChangeText={setTaskName}
              mode="outlined"
              style={styles.input}
            />

            <ReminderTimePicker 
              initialTime={reminderTime} 
              onTimeChange={(newTime) => setReminderTime(newTime)} 
            />

            {error ? <HelperText type="error" visible={true}>{error}</HelperText> : null}

            <Button
              mode="contained"
              onPress={handleCreateHabit}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              Save Habit
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.goBack()}
              style={styles.linkButton}
            >
              Cancel
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    paddingVertical: 6,
  },
  linkButton: {
    marginTop: 16,
  },
});