import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { MD3LightTheme as DefaultTheme, PaperProvider, Text, Snackbar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../config/firebase';
import { API_BASE_URL } from '../config/API_base_url';
import Ionicons from '@expo/vector-icons/Ionicons';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200ee',
    secondary: '#03dac6',
  },
};

export default function ProgressScreen() {
  const [loading, setLoading] = useState(false);
  const [habits, setHabits] = React.useState<any[]>([]);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useFocusEffect(
    useCallback(() => {
      // load habits from API
      const load = async () => {
        setLoading(true);
        try {
          const tok = await auth.currentUser?.getIdToken();
          const res = await fetch(`${API_BASE_URL}/api/habits?acknowledgeShieldUsage=true`, {
            headers: { 'Authorization': `Bearer ${tok}` }
          });
          if (!res.ok) throw new Error('Failed to fetch habits');
          const data = await res.json();
          console.log('Loaded habits:', data);
          setHabits(
            data.map((h: any) => ({
              ...h,
              id: String(h.habitId),
              maxStreak: h.maxStreak ?? 0,
              currentStreak: h.currentStreak ?? 0,
            }))
          );

          const usedShieldHabit = data.find((h: any) => h.shieldUsedRecently);

          if (usedShieldHabit) {
            setSnackbarMessage(`A streak shield protected "${usedShieldHabit.title}"`);
            setSnackbarVisible(true);
          }
        } catch (err) {
          console.warn('Could not load habits:', err);
        }
        finally {
          setLoading(false);
        }
      };
      load();
    }, [])
  );

  const formatDays = (count: number) => `${count} ${count === 1 ? 'day' : 'days'}`;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <SafeAreaView style={styles.container}>
          <ScrollView style={styles.content}>
            <Text variant="headlineSmall" style={styles.title}>Your Streaks</Text>
            {loading ? null : habits.length === 0 ? (
              <Text style={styles.emptyMessage}>Add habits on your dashboard</Text>
            ) : (
              habits.map((habit) => (
                <View key={habit.ID} style={styles.habitCard}>
                  <Text style={styles.habitTitle}>{habit.title}</Text>

                  <View style={styles.shieldRow}>
                    {[0, 1, 2].map((i) => (
                      <Ionicons
                        key={i}
                        name={i < (habit.streakShields ?? 0) ? "shield" : "shield-outline"}
                        color={i < (habit.streakShields ?? 0) ? "#6200ee" : "#999"}
                        size={22}
                        style={{ marginRight: 4 }}
                      />
                    ))}
                  </View>

                  <Text style={styles.streakText}>
                    Current Streak: {formatDays(habit.currentStreak)}
                  </Text>
                  <Text style={styles.streakText}>
                    Longest Streak: {formatDays(habit.maxStreak)}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>

          <Snackbar
            visible={snackbarVisible}
            onDismiss={() => setSnackbarVisible(false)}
            duration={3000}
          >
            {snackbarMessage}
          </Snackbar>
        </SafeAreaView>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  title: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  habitCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  shieldRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  streakText: {
    fontSize: 14,
    color: '#444',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#999',
  },
});
