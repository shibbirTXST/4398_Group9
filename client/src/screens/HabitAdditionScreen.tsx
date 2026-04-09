import React, { useState } from 'react';
import { auth } from '../config/firebase';
import { StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, HelperText, Appbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

export default function HabitAdditionScreen() {
  const [taskName, setTaskName] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<StackNavigationProp<any>>();



  const handleCreateHabit = async () => {
    // input validation
    if (!taskName.trim()) { //} || !reminderTime.trim()) {
      setError('Please fill in all fields');
      return;
    }

    // format validation for a valid 24-hour time 
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(reminderTime)) {
      setError('Please enter a valid 24-hour time (e.g., 14:30)');
      return;
    }

    setLoading(true);
    setError('');

    /** Look up userID from database using Firebase UID */
    const fuid = auth.currentUser?.uid;

    const resp = await fetch(`http://localhost:5000/api/users/${fuid}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
        // 'Authorization': `Bearer ${tok}`
      }
    });

    const rJson = await resp.json();
    const userId = await rJson['userId'];
    /** */

    // map data to backend variables
    const newHabitPayload = {
      userId: userId,
      habitName: taskName.trim(),
      frequencyType: 'Daily',
      status: 'Active',
    };

    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        setToken(token);
      } else {
        console.log('No authenticated user found');
        setError('User not authenticated. Please sign in again.');
        setLoading(false);
        return;
      }


      // send POST request to Express server
      const response = await fetch('http://localhost:5000/api/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newHabitPayload),
      });

      const jsonResponse = await response.json();

      // handle backend response
      if (response.status === 201) {
        // clear form and navigate back to the Dashboard on success
        setTaskName('');
        setReminderTime('');
        navigation.navigate('Dashboard', {
          newHabit: jsonResponse.task,
          successMessage: 'Habit added successfully!'
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

            <TextInput
              label="Reminder Time"
              placeholder="e.g., 08:00 AM"
              value={reminderTime}
              onChangeText={setReminderTime}
              mode="outlined"
              style={styles.input}
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