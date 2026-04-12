import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { MD3LightTheme as DefaultTheme, PaperProvider, Text, List } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../config/firebase';

export default function ProgressScreen() {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [habits, setHabits] = React.useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      // load habits from API
      const load = async () => {
        try {
          const tok = await auth.currentUser?.getIdToken();
          const res = await fetch('http://localhost:5000/api/habits', {
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
      };
      load();
    }, [])
  );

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Text variant="headlineSmall" style={styles.title}>Your Streaks</Text>
            
            {habits.map((habit) => (
              <List.Item
                key={habit.habitId}
                title={habit.habitName}
                right={props => (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text {...props}>Longest Streak: {habit.maxStreak} days</Text>
                    <Text {...props}>Current Streak: {habit.currentStreak} days</Text>
                  </View>
                )}
                style={styles.habitItem}
              />
            ))}
          </View>
        </SafeAreaView>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  habitItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
  },
});
