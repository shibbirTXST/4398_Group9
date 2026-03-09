import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { MD3LightTheme as DefaultTheme, PaperProvider, Text, Appbar, FAB, List, IconButton, Snackbar, Portal, Dialog, TextInput, Button, Menu, Divider } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

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
  const [habits, setHabits] = React.useState([
    { id: '1', title: 'Drink Water', completed: false, count: 0 },
    { id: '2', title: 'Read for 30 mins', completed: true, count: 1 },
    { id: '3', title: 'Exercise', completed: false, count: 0 },
  ]);
  const [dialogVisible, setDialogVisible] = React.useState(false);
  const [deleteAccDialogVisible, setDeleteAccDialogVisible] = React.useState(false);
  const [deleteSuccessDialogVisible, setDeleteSuccessDialogVisible] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [isEditing, setIsEditing] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [accMenuVisible, setAccMenuVisible] = React.useState(false);

  // state for the pop-up snackbar message
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // listen for new habits coming back from the HabitAdditionScreen
  useEffect(() => {
    if (route.params?.newHabit) {
      const { newHabit, successMessage } = route.params;

      // add the new habit to the top of our list
      setHabits(prevHabits => [
        // map the backend habit object to our frontend format
        { 
          id: newHabit.taskID.toString(), 
          title: newHabit.taskName,       
          completed: newHabit.isCompleted, 
          count: 0 
        },
        ...prevHabits 
      ]);

      // trigger the pop-up message
      setSnackbarMessage(successMessage);
      setSnackbarVisible(true);

      navigation.setParams({ newHabit: undefined, successMessage: undefined });
    }
  }, [route.params?.newHabit]);

  const toggleHabit = (id: string) => {
    setHabits(habits.map(h => 
      h.id === id ? { ...h, completed: !h.completed } : h
    ));
  };

  React.useEffect(() => {
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
  }, []);

  const createHabit = async () => {
    if (!title.trim()) return;
    try {
      const res = await fetch('http://localhost:5000/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() }),
      });
      if (!res.ok) throw new Error('Create failed');
      const created = await res.json();
      setHabits(prev => [...prev, { ...created, id: String(created.id) }]);
      setTitle('');
      setDialogVisible(false);
    } catch (err) {
      console.error('Error creating habit', err);
    }
  };

  const updateHabit = async () => {
    if (!title.trim() || !editingId) return;
    try {
      const res = await fetch(`http://localhost:5000/api/habits/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() }),
      });
      if (!res.ok) throw new Error('Update failed');
      const updated = await res.json();
      setHabits(prev => prev.map(h => h.id === editingId ? { ...h, title: updated.title } : h));
      setTitle('');
      setDialogVisible(false);
      setIsEditing(false);
      setEditingId(null);
    } catch (err) {
      console.error('Error updating habit', err);
    }
  };

  const deleteHabit = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/habits/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete failed');
      setHabits(prev => prev.filter(h => h.id !== id));
    } catch (err) {
      console.error('Error deleting habit', err);
    }
  };

  const openEditDialog = (habit: any) => {
    setTitle(habit.title);
    setIsEditing(true);
    setEditingId(habit.id);
    setDialogVisible(true);
  };

  const openCreateDialog = () => {
    setTitle('');
    setIsEditing(false);
    setEditingId(null);
    setDialogVisible(true);
  };

  const openAccMenu = () => setAccMenuVisible(true);
  const closeAccMenu = () => setAccMenuVisible(false);

  const showDeleteAccDialog = () => {
    setDeleteAccDialogVisible(true);
    closeAccMenu();
  };

  const hideDeleteAccDialog = () => setDeleteAccDialogVisible(false);

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
              <Text variant="bodyMedium">
                This action is permanent. All your habit data will be lost forever.
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={hideDeleteAccDialog}>Cancel</Button>
              <Button onPress={confirmDelete} textColor='red'>Delete</Button>
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
            
            {habits.map((habit) => (
              <List.Item
                key={habit.id}
                title={habit.title}
                description={habit.completed ? "Done for today!" : "Not done yet"}
                left={props => (
                   <IconButton 
                    {...props} 
                    icon={habit.completed ? "check-circle" : "circle-outline"} 
                    iconColor={habit.completed ? theme.colors.primary : theme.colors.outline}
                    onPress={() => toggleHabit(habit.id)}
                   />
                )}
                right={props => (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text {...props} style={styles.count}>{habit.count}/1</Text>
                    <IconButton icon="pencil" onPress={() => openEditDialog(habit)} />
                    <IconButton icon="delete" onPress={() => deleteHabit(habit.id)} />
                  </View>
                )}
                right={props => (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text {...props} style={styles.count}>{habit.count}/1</Text>
                    <IconButton icon="pencil" onPress={() => openEditDialog(habit)} />
                    <IconButton icon="delete" onPress={() => deleteHabit(habit.id)} />
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
            <Dialog visible={dialogVisible} onDismiss={() => { setDialogVisible(false); setIsEditing(false); setEditingId(null); setTitle(''); }}>
              <Dialog.Title>{isEditing ? 'Edit Habit' : 'New Habit'}</Dialog.Title>
              <Dialog.Content>
                <TextInput
                  label="Title"
                  value={title}
                  onChangeText={setTitle}
                />
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => { setDialogVisible(false); setIsEditing(false); setEditingId(null); setTitle(''); }}>Cancel</Button>
                <Button onPress={isEditing ? updateHabit : createHabit}>{isEditing ? 'Update' : 'Create'}</Button>
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
