import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { MD3LightTheme as DefaultTheme, PaperProvider, Text, Appbar, FAB, List, IconButton, Snackbar, Portal, Dialog, TextInput, Button, Menu } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../config/firebase';
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
  const [habits, setHabits] = React.useState<any[]>([]);
  const [dialogVisible, setDialogVisible] = React.useState(false);
  const [deleteAccDialogVisible, setDeleteAccDialogVisible] = React.useState(false);
  const [deleteSuccessDialogVisible, setDeleteSuccessDialogVisible] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [accMenuVisible, setAccMenuVisible] = React.useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // state for the pop-up snackbar message
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // listen for new habits coming back from the HabitAdditionScreen
  useEffect(() => {
    if (route.params?.newHabit) {
      const { newHabit, successMessage } = route.params;
      // trigger the pop-up message
      setSnackbarMessage(successMessage);
      setSnackbarVisible(true);

      navigation.setParams({ newHabit: undefined, successMessage: undefined });
    }
  }, [route.params?.newHabit]);

  const toggleHabit = (id: string | number) => {
    setHabits(habits.map(h =>
      Number(h.habitId) === Number(id) ? { ...h, completed: !h.completed } : h
    ));
  };

  React.useEffect(() => {
    // load habits from API
    const load = async () => {
      try {
        const tok = await auth.currentUser?.getIdToken();
        const res = await fetch(`${API_BASE_URL}/api/habits`, {
          headers: { 'Authorization': `Bearer ${tok}` }
        });
        if (!res.ok) throw new Error('Failed to fetch habits');
        const data = await res.json();
        console.log('Loaded habits:', data);
        setHabits(
          data.map((h: any) => ({
            ...h,
            completed: Boolean(h.completed),
          }))
        );
      } catch (err) {
        console.warn('Could not load habits:', err);
      }
    };
    load();
  }, []);

  React.useEffect(() => {
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

  const updateHabit = async () => {
    //check if user is authenticated before allowing update
    const user = auth.currentUser;
    if (!user) {
      console.error('No authenticated user found');
      return;
    }
    const token = await user.getIdToken();
    if (!title.trim() || !editingId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/habits/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: title.trim() }),
      });
      if (!res.ok) throw new Error('Update failed');
      const updated = await res.json();
      const eid = Number(editingId);
      setHabits(prev =>
        prev.map(h =>
          h.habitId === eid ? { ...h, habitName: updated.habitName } : h
        )
      );
      setTitle('');
      setDialogVisible(false);
      setEditingId(null);
    } catch (err) {
      console.error('Error updating habit', err);
    }
  };

  const deleteHabit = async (id: string | number) => {
    //check if user is authenticated before allowing delete
    const user = auth.currentUser;
    if (!user) {
      console.error('No authenticated user found');
      return;
    }
    const token = await user.getIdToken();
    try {
      const res = await fetch(`${API_BASE_URL}/api/habits/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Delete failed');
      setHabits(prev =>
        prev.filter(h => Number(h.habitId) !== Number(id))
      );
    } catch (err) {
      console.error('Error deleting habit', err);
    }
  };

  const openEditDialog = (habit: any) => {
    setTitle(habit.habitName ?? '');
    setEditingId(String(habit.habitId));
    setDialogVisible(true);
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

      const res = await fetch(`${API_BASE_URL}/api/delete-account`, {
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

            {habits.map((habit: any) => (
              <List.Item
                key={habit.habitId}
                title={habit.habitName}
                description={habit.completed ? "Done for today!" : "Not done yet"}
                left={props => (
                  <IconButton
                    {...props}
                    icon={habit.completed ? "check-circle" : "circle-outline"}
                    iconColor={habit.completed ? theme.colors.primary : theme.colors.outline}
                    onPress={() => toggleHabit(habit.habitId)}
                  />
                )}
                right={props => (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text {...props} style={styles.count}>{habit.count}/1</Text>
                    <IconButton icon="pencil" onPress={() => openEditDialog(habit)} />
                    <IconButton icon="delete" onPress={() => deleteHabit(habit.habitId)} />
                  </View>
                )}
                style={styles.habitItem}
              />
            ))}
          </View>
          <FAB
            icon="plus"
            style={styles.fab}
            onPress={() => navigation.navigate('HabitAdditionScreen')}
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

          <Portal>
            <Dialog visible={dialogVisible} onDismiss={() => { setDialogVisible(false); setEditingId(null); setTitle(''); }}>
              <Dialog.Title>{'Edit Habit'}</Dialog.Title>
              <Dialog.Content>
                <TextInput
                  label="Title"
                  value={title}
                  onChangeText={setTitle}
                />
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => { setDialogVisible(false); setEditingId(null); setTitle(''); }}>Cancel</Button>
                <Button onPress={updateHabit}>Update</Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
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
