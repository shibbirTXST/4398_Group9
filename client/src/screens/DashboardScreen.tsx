import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { MD3LightTheme as DefaultTheme, PaperProvider, Text, FAB, List, IconButton, Snackbar, Button } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { registerForPushNotificationsAsync, savePushTokenToServer } from '../utils/notifications';
import { API_BASE_URL } from '../config/API_base_url';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200ee',
    secondary: '#03dac6',
  },
};

export default function DashboardScreen({ route, navigation }: any) {
  const { logout } = useAuth();
  const [habits, setHabits] = useState<any[]>([]);
  const [routines, setRoutines] = useState<any[]>([]);

  // state for the pop-up snackbar message
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // listen for new habits coming back from the HabitSettingsScreen
  useEffect(() => {
    if (route.params?.newHabit) {
      const { successMessage } = route.params;
      setSnackbarMessage(successMessage);
      setSnackbarVisible(true);
      navigation.setParams({ successMessage: undefined });
    }
  }, [route.params?.newHabit]);

  const completeHabit = async (id: string) => {
    const user = auth.currentUser;
    if (!user) {
      console.error('No authenticated user found');
      return;
    }
    const token = await user.getIdToken();
    const habit = habits.find(h => String(h.ID) === String(id));
    if (!habit || habit.completed) return;

    setHabits(prev => prev.map(h => String(h.ID) === String(id) ? { ...h, completed: true } : h));

    try {
      const res = await fetch(`${API_BASE_URL}/api/habits/comp/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.status === 400) {
        return;
      }

      if (!res.ok) throw new Error('Failed to update habit');
      const updated = await res.json();
      setHabits(prev => prev.map(h => String(h.ID) === String(updated.ID) ? updated : h));
    } catch (err) {
      console.warn('Could not update habit:', err);
      setHabits(prev => prev.map(h => String(h.ID) === String(id) ? habit : h));
    }
  };

  React.useEffect(() => {
    // load habits from API
    const load = async () => {
      try {
        const tok = await auth.currentUser?.getIdToken();
        if (!tok) return;

        // Fetch Routines
        const routinesRes = await fetch(`${API_BASE_URL}/api/habits/routines`, {
          headers: { 'Authorization': `Bearer ${tok}` }
        });
        if (!routinesRes.ok) throw new Error('Failed to fetch routines');
        const routinesData = await routinesRes.json();
        setRoutines(routinesData.map((r: any) => ({ ...r, ID: String(r.ID) })));

        // Fetch Habits
        const habitsRes = await fetch(`${API_BASE_URL}/api/habits`, {
          headers: { 'Authorization': `Bearer ${tok}` }
        });
        if (!habitsRes.ok) throw new Error('Failed to fetch habits');
        const habitsData = await habitsRes.json();
        setHabits(habitsData.map((h: any) => ({ ...h, ID: String(h.ID) })));

      } catch (err) {
        console.warn('Could not load data:', err);
      }
    };
    load();
  }, []);

  // Register push notifications
  useEffect(() => {
    (async () => {
      const result = await registerForPushNotificationsAsync();
      if (!result.token) {
        console.warn('Push registration failed:', result.error);
        return;
      }

      const user = auth.currentUser;
      if (user) {
        try {
          const idToken = await user.getIdToken();
          const saveRes = await savePushTokenToServer(result.token, idToken);
          if (!saveRes.ok) {
            console.warn('Failed to save push token to server:', saveRes.error);
          }
        } catch (err) {
          console.warn('Could not get ID token to save push token:', err);
        }
      } else {
        console.warn('Push token obtained but no authenticated user to attach it to.');
      }
    })();
  }, []);

  const toggleHabit = (ID: string) => {
    setHabits(habits.map(h =>
      h.ID === ID ? { ...h, completed: !h.completed, count: 1 - h.count } : h
    ));
  };

  const habitsByRoutine = React.useMemo(() => {
    return habits.reduce((acc, habit) => {
      const routineId = habit.routineID || 0; // Default of 0 for unassigned
      if (!acc[routineId]) acc[routineId] = [];
      acc[routineId].push(habit);
      return acc;
    }, {} as Record<number, typeof habits>);
  }, [habits]);

  const deleteHabit = async (ID: string) => {
    const user = auth.currentUser;
    if (!user) {
      console.error('No authenticated user found');
      return;
    }
    const token = await user.getIdToken();
    try {
      const res = await fetch(`${API_BASE_URL}/api/habits/${ID}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Delete failed');
      setHabits(prev => prev.filter(h => h.ID !== ID));
    } catch (err) {
      console.error('Error deleting habit', err);
    }
  };

  const deleteRoutine = async (ID: string) => {
    const user = auth.currentUser;
    if (!user) {
      console.error('No authenticated user found');
      return;
    }
    const token = await user.getIdToken();
    try {
      const res = await fetch(`${API_BASE_URL}/api/habits/routines/${ID}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Delete failed');
      setRoutines(prev => prev.filter(r => r.ID !== ID));
    } catch (err) {
      console.error('Error deleting routine', err);
    }
  };

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Text variant="headlineSmall" style={styles.title}>Your Habits Today</Text>

            {/* Independent Habits */}
            {habitsByRoutine[0] && habitsByRoutine[0].length > 0 && (
              <List.Accordion
                title="Independent Habits"
                style={styles.routineItem}
                expanded={true}
              >
                {habitsByRoutine[0].map((habit: any) => (
                  <List.Item
                    key={habit.ID}
                    title={habit.title}
                    description={habit.completed ? "Done for today!" : "Not done yet"}
                    left={(props) => (
                      <IconButton
                        {...props}
                        icon={habit.completed ? "check-circle" : "circle-outline"}
                        iconColor={habit.completed ? theme.colors.primary : theme.colors.outline}
                        onPress={() => completeHabit(habit.ID)}
                      />
                    )}
                    right={(props) => (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text {...props} style={styles.count}>
                          {habit.count}/1
                        </Text>
                        <IconButton
                          icon="pencil"
                          onPress={() => navigation.navigate('HabitSettingsScreen', {
                            isEditing: true,
                            habit: habit,
                            routines: routines,
                          })}
                        />
                        <IconButton icon="delete" onPress={() => deleteHabit(habit.ID)} />
                      </View>
                    )}
                    style={styles.habitItem}
                  />
                ))}
              </List.Accordion>
            )}

            {/* Routines (and their sub-habits) */}
            {routines.map((routine) => (
              <List.Accordion
                key={routine.ID}
                title={routine.title}
                style={styles.routineItem}
                right={(props) => (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <IconButton
                      icon="pencil"
                      onPress={() =>
                        navigation.navigate('RoutineSettingsScreen', {
                          isEditing: true,
                          routine: routine,
                        })
                      }
                    />
                    <IconButton icon="delete" onPress={() => deleteRoutine(routine.ID)} />
                  </View>
                )}
              >
                {habitsByRoutine[routine.ID]?.map((habit: any) => (
                  <List.Item
                    key={habit.ID}
                    title={habit.title}
                    description={habit.completed ? "Done for today!" : "Not done yet"}
                    left={(props) => (
                      <IconButton
                        {...props}
                        icon={habit.completed ? "check-circle" : "circle-outline"}
                        iconColor={habit.completed ? theme.colors.primary : theme.colors.outline}
                        onPress={() => completeHabit(habit.ID)}
                      />
                    )}
                    right={(props) => (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text {...props} style={styles.count}>
                          {habit.count}/1
                        </Text>
                        <IconButton
                          icon="pencil"
                          onPress={() =>
                            navigation.navigate('HabitSettingsScreen', {
                              isEditing: true,
                              habit: habit,
                              routines: routines,
                            })
                          }
                        />
                        <IconButton icon="delete" onPress={() => deleteHabit(habit.ID)} />
                      </View>
                    )}
                    style={styles.habitItem}
                  />
                ))}
              </List.Accordion>
            ))}
            <Button mode="contained" onPress={() => navigation.navigate('RoutineSettingsScreen', { isEditing: false, routine: null })}>Add Routine</Button>
          </View>
          <FAB
            icon="plus"
            style={styles.fab}
            onPress={() => navigation.navigate('HabitSettingsScreen', { isEditing: false, habit: null, routines: routines })}
            label="New Habit"
          />

          {/*the pop-up notification*/}
          <Snackbar
            visible={snackbarVisible}
            onDismiss={() => setSnackbarVisible(false)}
            duration={3000}
            action={{
              label: 'Close',
              onPress: () => {
                setSnackbarVisible(false);
              },
            }}>
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
  routineItem: {
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 8,
  },
  habitItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
  },
  count: {
    alignSelf: 'center',
    marginRight: 16,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});