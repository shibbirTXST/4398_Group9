import React, { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, HelperText, Appbar } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { auth } from '../config/firebase';
import { API_BASE_URL } from '../config/API_base_url';
import AiRoutineWizard from './AiRoutineScreen';

export default function RoutineSettingsScreen() {
  const route = useRoute();
  const { isEditing, routine } = route.params as { isEditing: boolean; routine: any };

  const [routineTitle, setRoutineTitle] = useState(isEditing ? routine.title : '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [showAiWizard, setShowAiWizard] = useState(false);

  // Routine update
  const handleUpdateRoutine = async () => {
    if (!routineTitle.trim()) {
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
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/habits/routines/${routine.ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: routineTitle.trim() }),
      });
      
      if (!res.ok) throw new Error('Update failed');
      const updated = await res.json();
      setRoutineTitle('');
      
      navigation.navigate('Home', { 
        screen: 'Dashboard',
        params: {
          updatedRoutine: updated.routineId,
          successMessage: 'Routine updated successfully!'
        },
      });
    } catch (err) {
      console.error('Error updating routine', err);
      setError('Failed to update routine');
    } finally {
      setLoading(false);
    }
  };

  // New routine creation
  const handleCreateRoutine = async () => {
    if (!routineTitle.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    const newRoutinePayload = {
      title: routineTitle.trim(),
      ID: Date.now(),
      accountID: 1  
    };

    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('No authenticated user found');
        setLoading(false);
        return;
      }
      const token = await user.getIdToken();

      const response = await fetch(`${API_BASE_URL}/api/habits/routines`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newRoutinePayload),
      });

      const jsonResponse = await response.json();

      if (response.status === 201) {
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

  // Callback function for when the AI finishes successfully
  const handleAiSuccess = (newRoutineFromAi: any) => {
    setShowAiWizard(false); // Close the modal
    
    // Send the user directly back to the dashboard with the new AI routine
    navigation.navigate('Home', { 
      screen: 'Dashboard',
      params: {
        newRoutine: newRoutineFromAi,
        successMessage: 'AI Routine generated successfully!'
      }
    }); 
  };

  return (
    <View style={styles.mainContainer}>
      <Appbar.Header style={{ backgroundColor: '#f5f5f5' }}>
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

            {/* Only show the AI button if they are CREATING a new routine */}
            {!isEditing && (
              <Button
                mode="outlined"
                icon="robot-outline"
                onPress={() => setShowAiWizard(true)}
                style={styles.aiButton}
                labelStyle={styles.aiButtonText}
              >
                Auto-Generate with AI
              </Button>
            )}

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

      {/* Render the invisible Modal that waits to be triggered */}
      <AiRoutineWizard 
        visible={showAiWizard} 
        onClose={() => setShowAiWizard(false)} 
        onSuccess={handleAiSuccess} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f5f5f5' },
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  content: { padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { textAlign: 'center', marginBottom: 32, color: '#666' },
  input: { 
    marginBottom: 16,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  
  aiButton: {
    marginBottom: 16,
    borderColor: '#6BA292',
    borderWidth: 2,
    borderStyle: 'dashed',
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  aiButtonText: {
    color: '#6BA292',
    fontWeight: 'bold',
  },

  button: { 
    marginTop: 16, 
    paddingVertical: 6,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  linkButton: { 
    marginTop: 16,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
});