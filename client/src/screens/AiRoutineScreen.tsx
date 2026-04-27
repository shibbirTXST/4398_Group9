import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { auth } from '../config/firebase';
import { API_BASE_URL } from '../config/API_base_url';
import ReminderTimePicker from '../components/ReminderTimePicker';

type FocusArea = 'Fitness' | 'Mental Health' | 'Productivity';
type TimeOfDay = 'Morning' | 'Afternoon' | 'Evening';
type TimeCommitment = '< 15m' | '30m' | '1 hr+';
type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

interface RoutineGenerationResponse {
  routine?: unknown;
  error?: string;
}

interface AiRoutineWizardProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (routine: unknown) => void;
}

export default function AiRoutineWizard({ visible, onClose, onSuccess }: AiRoutineWizardProps) {
  // Survey State
  const [routineName, setRoutineName] = useState<string>('');
  const [focusArea, setFocusArea] = useState<FocusArea | ''>('');
  const [timesOfDay, setTimesOfDay] = useState<TimeOfDay[]>([]);
  const [startTime, setStartTime] = useState(new Date(new Date().setHours(9, 0, 0, 0)));
  const [timeCommitment, setTimeCommitment] = useState<TimeCommitment | ''>('');
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const [additionalDetails, setAdditionalDetails] = useState<string>('');

  // UI State
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [dots, setDots] = useState<string>('');

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (loading) {
      interval = setInterval(() => {
        // If there are 3 dots, reset to 0. Otherwise, add a dot.
        setDots((prev: string) => (prev.length >= 3 ? '' : prev + '.'));
      }, 400); // Speed of the dots (400ms)
    } else {
      setDots(''); // Clear dots when it finishes loading
    }
    
    // Clean up the timer when the component unmounts or loading stops
    return () => clearInterval(interval);
  }, [loading]);

  // Helper to toggle Multi-Select for Times of Day
  const toggleTimeOfDay = (time: TimeOfDay): void => {
    setTimesOfDay((prev: TimeOfDay[]) => 
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
  };

  const handleGenerate = async (): Promise<void> => {
    // Frontend Validation
    if (!routineName || !focusArea || timesOfDay.length === 0 || !timeCommitment || !difficulty) {
      setError('Please fill out all required fields before generating.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get Firebase Token
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('User not authenticated');

      // Format the Date object to "HH:MM AM/PM" for the AI Prompt
      const formattedStartTime = startTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      });

      // POST to the Backend
      const response = await fetch(`${API_BASE_URL}/api/habits/routines/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          routineName,
          focusArea,
          timesOfDay,
          startTime: formattedStartTime,
          timeCommitment,
          difficulty,
          additionalDetails: additionalDetails || 'None',
        }),
      });

      const data: RoutineGenerationResponse = await response.json();

      if (response.status === 201) {
        // Reset form and tell parent component to refresh the dashboard
        setRoutineName('');
        setFocusArea('');
        setTimesOfDay([]);
        setTimeCommitment('');
        setDifficulty('');
        setAdditionalDetails('');
        onSuccess(data.routine as unknown); 
      } else {
        setError(data.error || 'Generation failed. Please try again.');
      }
    } catch (err: unknown) {
      console.error(err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      {/* 1. Dismiss keyboard when tapping anywhere outside an input */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          
          {/* 2. Invisible button covering the background to close the modal when tapped */}
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={onClose} 
          />

          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.headerTitle}>AI Routine Builder</Text>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              {/* Q1: Routine Name */}
              <Text style={styles.label}>1. Routine Name</Text>
              <TextInput style={styles.input} placeholder="e.g., Morning Kickstart" value={routineName} onChangeText={setRoutineName} placeholderTextColor="#888" />

              {/* Q2: Focus Area */}
              <Text style={styles.label}>2. Primary Focus</Text>
              <View style={styles.buttonRow}>
                {(['Fitness', 'Mental Health', 'Productivity'] as const).map((item: FocusArea) => (
                  <TouchableOpacity key={item} style={[styles.optionBtn, focusArea === item && styles.selectedBtn]} onPress={() => setFocusArea(item)}>
                    <Text style={focusArea === item ? styles.selectedText : styles.optionText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Q3: Times of Day (Multi-Select) */}
              <Text style={styles.label}>3. Time(s) of Day</Text>
              <View style={styles.buttonRow}>
                {(['Morning', 'Afternoon', 'Evening'] as const).map((item: TimeOfDay) => (
                  <TouchableOpacity key={item} style={[styles.optionBtn, timesOfDay.includes(item) && styles.selectedBtn]} onPress={() => toggleTimeOfDay(item)}>
                    <Text style={timesOfDay.includes(item) ? styles.selectedText : styles.optionText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Q4: Start Time */}
              <Text style={styles.label}>4. Start Time</Text>
              <ReminderTimePicker 
                initialTime={startTime} 
                onTimeChange={(newTime) => setStartTime(newTime)} 
              />

              {/* Q5: Time Commitment */}
              <Text style={styles.label}>5. Time Commitment</Text>
              <View style={styles.buttonRow}>
                {(['< 15m', '30m', '1 hr+'] as const).map((item: TimeCommitment) => (
                  <TouchableOpacity key={item} style={[styles.optionBtn, timeCommitment === item && styles.selectedBtn]} onPress={() => setTimeCommitment(item)}>
                    <Text style={timeCommitment === item ? styles.selectedText : styles.optionText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Q6: Difficulty */}
              <Text style={styles.label}>6. Difficulty</Text>
              <View style={styles.buttonRow}>
                {(['Beginner', 'Intermediate', 'Advanced'] as const).map((item: Difficulty) => (
                  <TouchableOpacity key={item} style={[styles.optionBtn, difficulty === item && styles.selectedBtn]} onPress={() => setDifficulty(item)}>
                    <Text style={difficulty === item ? styles.selectedText : styles.optionText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Q7: Additional Details */}
              <Text style={styles.label}>7. Additional Details (Optional)</Text>
              <TextInput 
                style={[styles.input, styles.textArea]} 
                placeholder="e.g., I have bad knees, so no heavy lifting." 
                multiline={true} 
                placeholderTextColor="#888"
                value={additionalDetails} 
                onChangeText={setAdditionalDetails} 
              />

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                
                {/* 3. The New Cancel Button */}
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate} disabled={loading}>
                  {loading ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
                        <Text style={styles.generateText}>Generating{dots}</Text>
                      </View>
                  ) : (
                      <Text style={styles.generateText}>Generate</Text>
                  )}
                </TouchableOpacity>
              </View>

            </ScrollView>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// Styles specific to the AI Routine Wizard
const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20, maxHeight: '90%' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  errorText: { color: 'red', marginBottom: 10, textAlign: 'center' },
  label: { fontSize: 16, fontWeight: '600', marginTop: 10, marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#ccc', color: '#333', borderRadius: 8, padding: 10, fontSize: 16 },
  textArea: { height: 80, textAlignVertical: 'top' },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  optionBtn: { paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 20 },
  selectedBtn: { backgroundColor: '#6200ee', borderColor: '#6200ee' },
  optionText: { color: '#333' },
  selectedText: { color: '#fff', fontWeight: 'bold' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  cancelBtn: { padding: 15, borderRadius: 8, backgroundColor: '#eee', flex: 1, marginRight: 10, alignItems: 'center' },
  cancelText: { color: '#333', fontWeight: 'bold' },
  generateBtn: { padding: 15, borderRadius: 8, backgroundColor: '#6200ee', flex: 2, alignItems: 'center' },
  generateText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});