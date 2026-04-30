import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { MD3LightTheme as DefaultTheme, PaperProvider, Text, List, SegmentedButtons, Button } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../config/firebase';
import { API_BASE_URL } from '../config/API_base_url';
import Ionicons from '@expo/vector-icons/Ionicons';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#D3AF37',
    secondary: '#6BA292',
  },
};

export default function ProgressScreen() {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [loading, setLoading] = useState(false);
  const [habits, setHabits] = React.useState<any[]>([]);
  const [sortby, setSortby] = useState('ID');
  const [Descending, setDescending] = useState(false);

const sortedHabits = React.useMemo(() => {
    const sorted = [...habits];
    switch (sortby) {
      case 'title':
        if(Descending) {
          return sorted.sort((a, b) => b.title.localeCompare(a.title));
        } else {
          return sorted.sort((a, b) => a.title.localeCompare(b.title));
        }
      case 'currentStreak':
        if(Descending) {
          return sorted.sort((a, b) => b.currentStreak - a.currentStreak);
        } else {
          return sorted.sort((a, b) => a.currentStreak - b.currentStreak);
        }
      case 'maxStreak':
        if(Descending) {
          return sorted.sort((a, b) => b.maxStreak - a.maxStreak);
        } else {
          return sorted.sort((a, b) => a.maxStreak - b.maxStreak);
        }
      default:
        if(Descending) {
          return sorted.sort((a, b) => b.habitId - a.habitId);
        } else {
          return sorted.sort((a, b) => a.habitId - b.habitId);
        }
    }
  }, [habits, sortby, Descending]);

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
          <ScrollView>
            <View style={styles.content}>
              <Text variant="headlineSmall" style={styles.title}>Settings</Text>
              <SegmentedButtons
                value={sortby}
                onValueChange={setSortby}
                style= {styles.button}
                buttons={[
                  { label: 'ID', value: 'ID', style: {backgroundColor: sortby === 'ID' ? theme.colors.secondary : undefined}, checkedColor: "white" },
                  { label: 'Title', value: 'title', style: {backgroundColor: sortby === 'title' ? theme.colors.secondary : undefined}, checkedColor: "white" },
                  { label: 'Current Streak', value: 'currentStreak', style: {backgroundColor: sortby === 'currentStreak' ? theme.colors.secondary : undefined}, checkedColor: "white" },
                  { label: 'Max Streak', value: 'maxStreak', style: {backgroundColor: sortby === 'maxStreak' ? theme.colors.secondary : undefined}, checkedColor: "white" },
                ]}
              />
              <Button
                mode="contained"
                onPress={() => setDescending(!Descending)}
                style={styles.button}
              >
                Sort {Descending ? 'Descending' : 'Ascending'}
              </Button>
              <Text variant="headlineSmall" style={styles.title}>Your Streaks</Text>
              {loading ? null : habits.length === 0 ? (
                <Text style={styles.emptyMessage}>Add habits on your dashboard</Text>
              ) : (
                sortedHabits.map((habit) => (
                  <List.Item
                    key={habit.ID}
                    title={habit.title}
                    right={props => (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {[0, 1, 2].map((i) => (
                        <Ionicons
                          key={i}
                          name={i < (habit.streakShields ?? 0) ? "shield" : "shield-outline"}
                          color={i < (habit.streakShields ?? 0) ? "#6200ee" : "#000000"}
                          size={20}
                        />
                      ))}
                      <Text {...props}>Longest Streak: {formatDays(habit.maxStreak)}</Text>
                        <Text {...props}>Current Streak: {formatDays(habit.currentStreak)}</Text>
                      </View>
                    )}
                    style={styles.habitItem}
                  />
                ))
              )}
            </View>
          </ScrollView>
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
  button: {
    marginVertical: 6,
    alignSelf: 'center',
    maxWidth: 800,
    width: '100%',
  }
});
