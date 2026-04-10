import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { MD3LightTheme as DefaultTheme, PaperProvider, Text, FAB, List, IconButton, Snackbar, Button} from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200ee',
    secondary: '#03dac6',
  },
};

export default function DashboardScreen({route, navigation}: any) {
  const { logout } = useAuth();
  const [habits, setHabits] = useState<any[]>([]);
  const [routines, setRoutines] = useState<any[]>([]);
  const [deleteAccDialogVisible, setDeleteAccDialogVisible] = React.useState(false);
  const [deleteSuccessDialogVisible, setDeleteSuccessDialogVisible] = React.useState(false);
  const [accMenuVisible, setAccMenuVisible] = React.useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // state for the pop-up snackbar message
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // listen for new habits coming back from the HabitSettingsScreen
  useEffect(() => {
    if (route.params?.newHabit) {
      const {successMessage } = route.params;
      // trigger the pop-up message
      setSnackbarMessage(successMessage);
      setSnackbarVisible(true);

      navigation.setParams({successMessage: undefined });
    }
  }, [route.params?.newHabit]);

  const toggleHabit = (ID: string) => {
    setHabits(habits.map(h => 
      h.ID === ID ? { ...h, completed: !h.completed, count: 1-h.count } : h
    ));
  };

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/habits/routines');
        if (!res.ok) throw new Error('Failed to fetch routines');
        const data = await res.json();
        // ensure ids are strings for list keys
        setRoutines(data.map((r: any) => ({ ...r, ID: String(r.ID) })));
      } catch (err) {
        console.warn('Could not load routines:', err);
      }
      try {
        const res = await fetch('http://localhost:5000/api/habits');
        if (!res.ok) throw new Error('Failed to fetch habits');
        const data = await res.json();
        // ensure ids are strings for list keys
        setHabits(data.map((h: any) => ({ ...h, ID: String(h.ID) })));
      } catch (err) {
        console.warn('Could not load habits:', err);
      }
    };
    load();
  }, []);

  const habitsByRoutine = React.useMemo(() => {
  return habits.reduce((acc, habit) => {
    const routineId = habit.routineID || 0; // Default of 0 for unassigned
    if (!acc[routineId]) acc[routineId] = [];
    acc[routineId].push(habit);
    return acc;
  }, {} as Record<number, typeof habits>);
}, [habits]);

  const deleteHabit = async (ID: string) => {
    //check if user is authenticated before allowing delete
    const user = auth.currentUser;
    if (!user) {
      console.error('No authenticated user found');
      return;
    }
    const token = await user.getIdToken();
    try {
      const res = await fetch(`http://localhost:5000/api/habits/${ID}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Delete failed');
      setHabits(prev => prev.filter(h => h.ID !== ID));
    } catch (err) {
      console.error('Error deleting habit', err);
    }
  };

  const deleteRoutine = async (ID: string) => {
    //check if user is authenticated before allowing delete
    const user = auth.currentUser;
    if (!user) {
      console.error('No authenticated user found');
      return;
    }
    const token = await user.getIdToken();
    try {
      const res = await fetch(`http://localhost:5000/api/habits/routines/${ID}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Delete failed');
      setRoutines(prev => prev.filter(r => r.ID !== ID));
    } catch (err) {
      console.error('Error deleting routine', err);
    }
  };


  const openAccMenu = () => setAccMenuVisible(true);
  const closeAccMenu = () => setAccMenuVisible(false);

  const showDeleteAccDialog = () => {
    setDeleteAccDialogVisible(true);
    closeAccMenu();
  };

  const hideDeleteAccDialog = () => setDeleteAccDialogVisible(false);

  const deleteAccount = async () => {
    try {

      const user = auth.currentUser;

      if (!user) throw new Error("No user logged in");

      const credential = EmailAuthProvider.credential(email, password);

      await reauthenticateWithCredential(user, credential);

      const token = await user.getIdToken();

      const res = await fetch("http://localhost:5000/api/delete-account", {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!res.ok) throw new Error("Failed to delete account");

      confirmDelete();
    } catch (err) {
      console.error(err);
    }
  }

  const confirmDelete = () => {
    console.log("Proceeding with account deletion...");
    hideDeleteAccDialog();
    setDeleteSuccessDialogVisible(true);
  }

  const handleFinalLogout = () => {
    setDeleteSuccessDialogVisible(false);
    logout();
  }

  const handleDeleteAccount = () => {
    console.log("Delete account pressed");
    closeAccMenu();
  }

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
                          onPress={() => toggleHabit(habit.ID)}
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
                      <IconButton icon="delete" onPress={() => deleteRoutine(routine.ID)}/>
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
                      onPress={() => toggleHabit(habit.ID)}
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
          <Button mode="contained" onPress={() => navigation.navigate('RoutineSettingsScreen', {isEditing: false, routine: null})}>Add Routine</Button>
          </View>
          <FAB
            icon="plus"
            style={styles.fab}
            onPress={() => navigation.navigate('HabitSettingsScreen', {isEditing: false, habit: null, routines: routines})}
            label="New Habit"
          />

          {/*the pop-up notification*/}
          <Snackbar
            visible={snackbarVisible}
            onDismiss={() => setSnackbarVisible(false)}
            duration={3000} // disappears after 3 seconds
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
