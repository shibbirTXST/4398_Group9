import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { MD3LightTheme as DefaultTheme, PaperProvider, Text, Appbar, FAB, List, IconButton, Snackbar, Portal, Dialog, TextInput, Button, Menu} from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../config/firebase';

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
  const [plans, setPlans] = useState<any[]>([]);
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
      const { newHabit, successMessage } = route.params;
      // trigger the pop-up message
      setSnackbarMessage(successMessage);
      setSnackbarVisible(true);

      navigation.setParams({ newHabit: undefined, successMessage: undefined });
    }
  }, [route.params?.newHabit]);

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/habits/plans');
        if (!res.ok) throw new Error('Failed to fetch plans');
        const data = await res.json();
        // ensure ids are strings for list keys
        setPlans(data.map((p: any) => ({ ...p, id: String(p.id) })));
      } catch (err) {
        console.warn('Could not load plans:', err);
      }
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
  }, []);

  const habitsByPlan = React.useMemo(() => {
  return habits.reduce((acc, habit) => {
    const planId = habit.planID || 0; // Default of 0 for unassigned
    if (!acc[planId]) acc[planId] = [];
    acc[planId].push(habit);
    return acc;
  }, {} as Record<number, typeof habits>);
}, [habits]);

    const toggleHabit = (id: string) => {
    setHabits(habits.map(h => 
      h.id === id ? { ...h, completed: !h.completed } : h
    ));
  };

  const deleteHabit = async (id: string) => {
    //check if user is authenticated before allowing delete
    const user = auth.currentUser;
    if (!user) {
      console.error('No authenticated user found');
      return;
    }
    const token = await user.getIdToken();
    try {
      const res = await fetch(`http://localhost:5000/api/habits/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Delete failed');
      setHabits(prev => prev.filter(h => h.id !== id));
    } catch (err) {
      console.error('Error deleting habit', err);
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
        <Appbar.Header>
          <Appbar.Content title="Habit Tracker" />
          <Appbar.Action icon="logout" onPress={logout} />
          {/* Account Menu */}
          <Menu
            visible={accMenuVisible}
            onDismiss={closeAccMenu}
            anchor={
              <Appbar.Action icon="account" onPress={openAccMenu} />
            }
          >
            <Menu.Item
              onPress={showDeleteAccDialog}
              title="Delete account"
              leadingIcon="delete"
              titleStyle={{ color: 'red' }}
            />
          </Menu>
          
          {/* Delete Account Dialog */}
          <Portal>
            <Dialog visible={deleteAccDialogVisible} onDismiss={hideDeleteAccDialog}>
            <Dialog.Content>
              <Text>
                Please reenter your account details to delete your account. This action is permanent.
              </Text>
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
              />

              <TextInput
                label="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={hideDeleteAccDialog}>Cancel</Button>
              <Button onPress={deleteAccount} textColor='red'>Delete</Button>
            </Dialog.Actions>
            </Dialog>
          </Portal>

          {/* Delete Account Success Dialog */}
          <Portal>
            <Dialog visible={deleteSuccessDialogVisible} onDismiss={handleFinalLogout}>
            <Dialog.Title>Success</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium">
                Account successfully deleted.
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={handleFinalLogout}>OK</Button>
            </Dialog.Actions>
            </Dialog>
          </Portal>
        </Appbar.Header>
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Text variant="headlineSmall" style={styles.title}>Your Habits Today</Text>
            {/* Independent Habits */}
              {habitsByPlan[0] && habitsByPlan[0].length > 0 && (
                <List.Accordion
                  title="Independent Habits"
                  style={styles.planItem}
                  expanded={true}
                >
                {habitsByPlan[0].map((habit: any) => (
                  <List.Item
                    key={habit.id}
                    title={habit.title}
                    description={habit.completed ? "Done for today!" : "Not done yet"}
                      left={(props) => (
                        <IconButton
                          {...props}
                          icon={habit.completed ? "check-circle" : "circle-outline"}
                          iconColor={habit.completed ? theme.colors.primary : theme.colors.outline}
                          onPress={() => toggleHabit(habit.id)}
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
                              })
                            }
                          />
                          <IconButton icon="delete" onPress={() => deleteHabit(habit.id)} />
                        </View>
                      )}
                    style={styles.habitItem}
                  />
                ))}
                </List.Accordion>
          )}
          {/* Plans (and their sub-habits) */}
            {plans.map((plan) => (
            <List.Accordion 
            key={plan.id}
            title={plan.name}
            style={styles.planItem}
            right={(props) => (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <IconButton
                        icon="pencil"
                      />
                      <IconButton icon="delete" />
                    </View>
                  )}
            >
              {habitsByPlan[plan.id]?.map((habit: any) => (
                <List.Item
                  key={habit.id}
                  title={habit.title}
                  description={habit.completed ? "Done for today!" : "Not done yet"}
                  left={(props) => (
                    <IconButton
                      {...props}
                      icon={habit.completed ? "check-circle" : "circle-outline"}
                      iconColor={habit.completed ? theme.colors.primary : theme.colors.outline}
                      onPress={() => toggleHabit(habit.id)}
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
                            plans: plans,
                          })
                        }
                      />
                      <IconButton icon="delete" onPress={() => deleteHabit(habit.id)} />
                    </View>
                  )}
                  style={styles.habitItem}
                />
              ))}
            </List.Accordion>
          ))}
          </View>
          <FAB
            icon="plus"
            style={styles.fab}
            onPress={() => navigation.navigate('HabitSettingsScreen', {isEditing: false, habit: null, plans: plans})}
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
  planItem: {
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
