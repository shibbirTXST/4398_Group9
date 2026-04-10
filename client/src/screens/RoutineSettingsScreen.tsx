import React, { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, HelperText, Appbar } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { auth } from '../config/firebase';

export default function PlanSettingsScreens() {

  const route = useRoute();
  const { isEditing, routine } = route.params as { isEditing: boolean; routine: any };

  const [routineTitle, setRoutineTitle] = useState(isEditing ? routine.title : '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<StackNavigationProp<any>>();

  //Habit update
  const handleUpdateRoutine = async () => {
    // input validation
    if (!routineTitle.trim()) {
      setError('Please fill in all fields');
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
    try {
      const res = await fetch(`http://localhost:5000/api/habits/routines/${routine.ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: routineTitle.trim() }),
      });
      if (!res.ok) throw new Error('Update failed');
      setRoutineTitle('');
      const updated = await res.json();
      navigation.navigate('Home', { 
        screen: 'Dashboard',
        params: {
        updatedRoutine: updated.routineId,
        successMessage: 'Routine updated successfully!'
        },
      });
    } catch (err) {
      console.error('Error updating routine', err);
    }finally {
      setLoading(false);
    }
  };

  //New routine creation
  const handleCreateRoutine = async () => {
    // input validation
    if (!routineTitle.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    // map data to backend variables
    const newRoutinePayload = {
      title: routineTitle.trim(),
      ID: Date.now(),
      // hardcoded for DEMO
      accountID: 1  
    };

    try {
      // send POST request to Express server
      const response = await fetch('http://localhost:5000/api/habits/routines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-firebase-token' 
        },
        body: JSON.stringify(newRoutinePayload),
      });

      const jsonResponse = await response.json();

      // handle backend response
      if (response.status === 201) {
        // clear form and navigate back to the Dashboard on success
        setRoutineTitle('');
        navigation.navigate('Home', { 
            screen: 'Dashboard',
            params: {
                newRoutine: jsonResponse.routine,
                successMessage: 'Routine added successfully!'
            }
        }); 
      } else {
        setError(jsonResponse.error || 'Failed to create routine');
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
        <Appbar.Content title={isEditing ? "Edit Routine" : "New Routine"} />
      </Appbar.Header>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={styles.title}>
              {isEditing ? 'Modify a Routine' : 'Create a Routine'}
            </Text>
            <Text style={styles.subtitle}>
              {isEditing ? 'How would you like to modify this routine?' : 'What routine would you like to create?'}
            </Text>

            <TextInput
              label="Routine Name"
              placeholder={isEditing ? routine.title : "e.g., Workout Routine"}
              value={routineTitle}
              onChangeText={setRoutineTitle}
              mode="outlined"
              style={styles.input}
            />

            {error ? <HelperText type="error" visible={true}>{error}</HelperText> : null}

            <Button
              mode="contained"
              onPress={isEditing ? handleUpdateRoutine : handleCreateRoutine}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              Save Routine
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