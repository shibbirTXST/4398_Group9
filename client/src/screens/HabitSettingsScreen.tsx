import React, { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, HelperText, Appbar } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { auth } from '../config/firebase';

export default function HabitSettingsScreen() {

  const route = useRoute();
  const { isEditing, habit, routines } = route.params as { isEditing: boolean; habit: any, routines: any[] };

  const [habitTitle, setHabitTitle] = useState(isEditing ? habit.title : '');
  const [reminderTime, setReminderTime] = useState(isEditing ? habit.reminderTime : '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRoutineId, setSelectedRoutineId] = useState(isEditing ? habit.routineID : 0);
  const navigation = useNavigation<StackNavigationProp<any>>();

  //Habit update
  const handleUpdateHabit = async () => {
    // input validation
    if (!habitTitle.trim() || !reminderTime.trim()) {
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

    //check if user is authenticated before allowing update
    const user = auth.currentUser;
    if (!user) {
      console.error('No authenticated user found');
      return;
    }
    const token = await user.getIdToken();
    if (!habitTitle.trim() || !reminderTime.trim()) return;
    try {
      const res = await fetch(`http://localhost:5000/api/habits/${habit.ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: habitTitle.trim(), reminderTime: reminderTime.trim(), routineID: selectedRoutineId }),
      });
      if (!res.ok) throw new Error('Update failed');
      setHabitTitle('');
      setReminderTime('');
      const updated = await res.json();
      navigation.navigate('Home', { 
        screen: 'Dashboard',
        params: {
          successMessage: 'Habit updated successfully!'
        }
      });
    } catch (err) {
      console.error('Error updating habit', err);
    }finally {
      setLoading(false);
    }
  };

  //New habit creation
  const handleCreateHabit = async () => {
    // input validation
    if (!habitTitle.trim() || !reminderTime.trim()) {
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

    // map data to backend variables
    const newHabitPayload = {
      title: habitTitle,
      reminderTime: reminderTime,
      routineID: selectedRoutineId,
      // hardcoded for DEMO
      accountID: 1  
    };

    try {
      // send POST request to Express server
      const response = await fetch('http://localhost:5000/api/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-firebase-token' 
        },
        body: JSON.stringify(newHabitPayload),
      });

      const jsonResponse = await response.json();

      // handle backend response
      if (response.status === 201) {
        // clear form and navigate back to the Home on success
        setHabitTitle('');
        setReminderTime('');
        navigation.navigate('Home', { 
          screen: 'Dashboard',
          params: {
            successMessage: 'Habit added successfully!'
          }
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
        <Appbar.Content title={isEditing ? "Edit Habit" : "New Habit"} />
      </Appbar.Header>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={styles.title}>
              {isEditing ? 'Modify a Habit' : 'Create a Habit'}
            </Text>
            <Text style={styles.subtitle}>
              {isEditing ? 'How would you like to modify this habit?' : 'What habit would you like to track?'}
            </Text>

            <TextInput
              label="Habit Name"
              placeholder={isEditing ? habit.title : "e.g., Drink Water"}
              value={habitTitle}
              onChangeText={setHabitTitle}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Reminder Time"
              placeholder={isEditing ? habit.reminderTime : "e.g., 08:00 AM"}
              value={reminderTime}
              onChangeText={setReminderTime}
              mode="outlined"
              style={styles.input}
            />

            <Text style={{ marginBottom: 8 }}>Assign to Routine:</Text>
            <Button
              mode={selectedRoutineId === 0 ? "contained" : "outlined"}
              onPress={() => setSelectedRoutineId(0)}
              style={styles.routineButton}
            >{'No Routine'}
            </Button>
            {routines && routines.map((routine) => (
              <Button
                key={routine.ID}
                mode={selectedRoutineId === routine.ID ? "contained" : "outlined"}
                onPress={() => setSelectedRoutineId(routine.ID)}
                style={styles.routineButton}
              >
                {routine.title}
              </Button>
            ))}


            {error ? <HelperText type="error" visible={true}>{error}</HelperText> : null}

            <Button
              mode="contained"
              onPress={isEditing ? handleUpdateHabit : handleCreateHabit}
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
  routineButton: {
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
    paddingVertical: 6,
  },
  linkButton: {
    marginTop: 16,
  },
});