import React, { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, HelperText, Appbar } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { auth } from '../config/firebase';
import { API_BASE_URL } from '../config/API_base_url';
import ReminderTimePicker from '../components/ReminderTimePicker';

export default function HabitSettingsScreen() {
  const route = useRoute();
  const { isEditing, habit, routines } = route.params as { isEditing: boolean; habit: any, routines: any[] };

  // Helper to parse saved "HH:MM" string back into a Date object for the Time Picker
  const getInitialTime = () => {
    const defaultDate = new Date();
    defaultDate.setHours(9, 0, 0, 0);
    if (isEditing && habit?.reminderTime) {
      const [hours, minutes] = habit.reminderTime.split(':');
      if (hours && minutes) {
        defaultDate.setHours(Number(hours), Number(minutes), 0, 0);
      }
    }
    return defaultDate;
  };

  const [habitTitle, setHabitTitle] = useState(isEditing ? habit.title : '');
  const [reminderTime, setReminderTime] = useState<Date>(getInitialTime());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRoutineId, setSelectedRoutineId] = useState(isEditing ? habit.routineID : 0);
  const navigation = useNavigation<StackNavigationProp<any>>();

  // Habit update
  const handleUpdateHabit = async () => {
    if (!habitTitle.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    const user = auth.currentUser;
    if (!user) {
      console.error('No authenticated user found');
      setLoading(false);
      return;
    }
    const token = await user.getIdToken();
    
    // Format the Date object into a 24-hour string for the backend
    const formattedTime = `${reminderTime.getHours().toString().padStart(2, '0')}:${reminderTime.getMinutes().toString().padStart(2, '0')}`;

    try {
      const res = await fetch(`${API_BASE_URL}/api/habits/${habit.ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          title: habitTitle.trim(), 
          reminderTime: formattedTime, 
          routineID: selectedRoutineId 
        }),
      });
      if (!res.ok) throw new Error('Update failed');
      
      setHabitTitle('');
      navigation.navigate('Home', { 
        screen: 'Dashboard',
        params: { successMessage: 'Habit updated successfully!' }
      });
    } catch (err) {
      console.error('Error updating habit', err);
      setError('Failed to update habit');
    } finally {
      setLoading(false);
    }
  };

  // New habit creation
  const handleCreateHabit = async () => {
    if (!habitTitle.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    const user = auth.currentUser;
    if (!user) {
      console.error('No authenticated user found');
      setLoading(false);
      return;
    }
    const token = await user.getIdToken();

    // Format the Date object into a 24-hour string for the backend
    const formattedTime = `${reminderTime.getHours().toString().padStart(2, '0')}:${reminderTime.getMinutes().toString().padStart(2, '0')}`;

    const newHabitPayload = {
      title: habitTitle.trim(),
      reminderTime: formattedTime,
      routineID: selectedRoutineId,
      accountID: 1  
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/habits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(newHabitPayload),
      });

      const jsonResponse = await response.json();

      if (response.status === 201) {
        setHabitTitle('');
        navigation.navigate('Home', { 
          screen: 'Dashboard',
          params: { successMessage: 'Habit added successfully!' }
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

            {/* Custom Reminder Time Picker Injected Here */}
            <ReminderTimePicker 
              initialTime={reminderTime} 
              onTimeChange={(newTime) => setReminderTime(newTime)} 
            />

            <Text style={{ marginBottom: 8, marginTop: 16 }}>Assign to Routine:</Text>
            <Button
              mode={selectedRoutineId === 0 ? "contained" : "outlined"}
              onPress={() => setSelectedRoutineId(0)}
              style={styles.routineButton}
            >
              {'No Routine'}
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
  mainContainer: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  content: { padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { textAlign: 'center', marginBottom: 32, color: '#666' },
  input: { marginBottom: 16 },
  routineButton: { marginBottom: 8 },
  button: { marginTop: 16, paddingVertical: 6 },
  linkButton: { marginTop: 16 },
});