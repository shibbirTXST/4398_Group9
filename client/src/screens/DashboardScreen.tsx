import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MD3LightTheme as DefaultTheme, PaperProvider, Text, Appbar, FAB, List, IconButton } from 'react-native-paper';
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

export default function DashboardScreen() {
  const { logout } = useAuth();
  const [habits, setHabits] = React.useState([
    { id: '1', title: 'Drink Water', completed: false, count: 0 },
    { id: '2', title: 'Read for 30 mins', completed: true, count: 1 },
    { id: '3', title: 'Exercise', completed: false, count: 0 },
  ]);

  const toggleHabit = (id: string) => {
    setHabits(habits.map(h => 
      h.id === id ? { ...h, completed: !h.completed } : h
    ));
  };

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <Appbar.Header>
          <Appbar.Content title="Habit Tracker" />
          <Appbar.Action icon="logout" onPress={logout} />
          <Appbar.Action icon="account" onPress={() => {}} />
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
                right={props => <Text {...props} style={styles.count}>{habit.count}/1</Text>}
                style={styles.habitItem}
              />
            ))}
          </View>
          <FAB
            icon="plus"
            style={styles.fab}
            onPress={() => console.log('Add Habit')}
            label="New Habit"
          />
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
