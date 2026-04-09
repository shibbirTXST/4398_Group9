import React, { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, HelperText, Appbar } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { auth } from '../config/firebase';

export default function PlanSettingsScreens() {

  const route = useRoute();
  const { isEditing, plan } = route.params as { isEditing: boolean; plan: any };

  const [planName, setPlanName] = useState(isEditing ? plan.name : '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<StackNavigationProp<any>>();

  //Habit update
  const handleUpdatePlan = async () => {
    // input validation
    if (!planName.trim()) {
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
      const res = await fetch(`http://localhost:5000/api/habits/plans/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: planName.trim() }),
      });
      if (!res.ok) throw new Error('Update failed');
      setPlanName('');
      const updated = await res.json();
      navigation.navigate('Home', { 
        screen: 'Dashboard',
        params: {
        updatedPlan: updated.planId,
        successMessage: 'Plan updated successfully!'
        },
      });
    } catch (err) {
      console.error('Error updating plan', err);
    }finally {
      setLoading(false);
    }
  };

  //New plan creation
  const handleCreatePlan = async () => {
    // input validation
    if (!planName.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    // map data to backend variables
    const newPlanPayload = {
      name: planName.trim(),
      id: Date.now(),
      // hardcoded for DEMO
      accountID: 1  
    };

    try {
      // send POST request to Express server
      const response = await fetch('http://localhost:5000/api/habits/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-firebase-token' 
        },
        body: JSON.stringify(newPlanPayload),
      });

      const jsonResponse = await response.json();

      // handle backend response
      if (response.status === 201) {
        // clear form and navigate back to the Dashboard on success
        setPlanName('');
        navigation.navigate('Home', { 
            screen: 'Dashboard',
            params: {
                newPlan: jsonResponse.plan,
                successMessage: 'Plan added successfully!'
            }
        }); 
      } else {
        setError(jsonResponse.error || 'Failed to create plan');
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
        <Appbar.Content title={isEditing ? "Edit Plan" : "New Plan"} />
      </Appbar.Header>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={styles.title}>
              {isEditing ? 'Modify a Plan' : 'Create a Plan'}
            </Text>
            <Text style={styles.subtitle}>
              {isEditing ? 'How would you like to modify this plan?' : 'What plan would you like to create?'}
            </Text>

            <TextInput
              label="Plan Name"
              placeholder={isEditing ? plan.name : "e.g., Workout Routine"}
              value={planName}
              onChangeText={setPlanName}
              mode="outlined"
              style={styles.input}
            />

            {error ? <HelperText type="error" visible={true}>{error}</HelperText> : null}

            <Button
              mode="contained"
              onPress={isEditing ? handleUpdatePlan : handleCreatePlan}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              Save Plan
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