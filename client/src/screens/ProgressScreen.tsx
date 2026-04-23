import React, { useState, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { MD3LightTheme as DefaultTheme, PaperProvider, Text, List } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../config/firebase';
import { API_BASE_URL } from '../config/API_base_url';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200ee',
    secondary: '#03dac6',
  },
};

export default function ProgressScreen() {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [loading, setLoading] = useState(false);
  const [habits, setHabits] = React.useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      // load habits from API
      const load = async () => {
        setLoading(true);
        try {
          const tok = await auth.currentUser?.getIdToken();
          const res = await fetch(`${API_BASE_URL}/api/habits/`, {
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
          <View style={styles.content}>
            <Text variant="headlineSmall" style={styles.title}>Your Streaks</Text>
            {loading ? null : habits.length === 0 ? (
              <Text style={styles.emptyMessage}>Add habits on your dashboard</Text>
            ) : (
              habits.map((habit) => (
                <List.Item
                  key={habit.ID}
                  title={habit.title}
                  right={props => (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text {...props}>Longest Streak: {formatDays(habit.maxStreak)}</Text>
                      <Text {...props}>Current Streak: {formatDays(habit.currentStreak)}</Text>
                    </View>
                  )}
                  style={styles.habitItem}
                />
              ))
            )}
          </View>
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
  habitItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#999',
  },
});
