import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { MD3LightTheme as DefaultTheme, PaperProvider, Text, List } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

export default function ProgressScreen() {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [habits, setHabits] = React.useState([
    { id: '1', title: 'Drink Water', completed: false, count: 1 },
    { id: '2', title: 'Read for 30 mins', completed: true, count: 1 },
    { id: '3', title: 'Exercise', completed: false, count: 0 },
  ]);

  useFocusEffect(
    useCallback(() => {
      // load habits from API
      const load = async () => {
        try {
          const res = await fetch('http://localhost:5000/api/habits');
          if (!res.ok) throw new Error('Failed to fetch habits');
          const data = await res.json();
          // ensure ids are strings for list keys
          setHabits(data.map((h: any) => ({ ...h, id: String(h.id) })));
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
                key={habit.id}
                title={habit.title}
                right={props => (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text {...props}>Longest Streak: 0 days</Text>
                    <Text {...props}>Current Streak: 0 days</Text>
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
