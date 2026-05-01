import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { MD3LightTheme as DefaultTheme, PaperProvider, Text, Snackbar, SegmentedButtons, Button } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
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
  const [loading, setLoading] = useState(false);
  const [habits, setHabits] = React.useState<any[]>([]);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
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
          const res = await fetch(`${API_BASE_URL}/api/habits?progressScreen=true`, {
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

          const shieldedHabits = data.filter((h: any) => h.shieldUsedRecently);

          if (shieldedHabits.length > 0) {
            setSnackbarMessage(buildShieldMessage(shieldedHabits));
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

  const buildShieldMessage = (habits: any[]) => {
  if (habits.length === 1) {
    return `${habits[0].title} was protected by a streak shield`;
  }

  if (habits.length === 2) {
    return `${habits[0].title} and ${habits[1].title} were protected by streak shields`;
  }

  const names = habits.map(h => h.title);
    return `${names.slice(0, -1).join(', ')}, and ${names.slice(-1)} were protected by streak shields`;
  };

  const badgeConfig: Record<number, { icon: string; color: string; label: string }> = {
    7:   { icon: 'ribbon', color: '#CD7F32', label: '7-day streak' },   // bronze
    30:  { icon: 'ribbon', color: '#C0C0C0', label: '30-day streak' },  // silver
    100: { icon: 'ribbon', color: '#FFD700', label: '100-day streak' }, // gold
  };

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <SafeAreaView style={styles.container}>
          <ScrollView style={styles.content}>
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

                  <View style={{ flexDirection: 'row', marginTop: 4 }}>
                    {habit.badges.map((milestone: number) => {
                      const config = badgeConfig[milestone] ?? {
                        icon: 'ribbon',
                        color: '#888',
                        label: `${milestone}-day streak`,
                      };

                      return (
                        <Ionicons
                          key={milestone}
                          name={config.icon as any}
                          size={16}
                          color={config.color}
                          style={{ marginRight: 6 }}
                        />
                      );
                    })}
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          <Snackbar
            visible={snackbarVisible}
            onDismiss={() => setSnackbarVisible(false)}
            duration={5000}
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
  button: {
    marginVertical: 6,
    alignSelf: 'center',
    maxWidth: 800,
    width: '100%',
  }
});