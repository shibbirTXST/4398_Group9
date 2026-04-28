import React, { useState } from 'react';
import { NavigationContainer, useNavigationState } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PaperProvider, MD3LightTheme as DefaultTheme, ActivityIndicator, Appbar, Menu, Portal, Dialog, TextInput, Button, Text } from 'react-native-paper';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from './src/config/firebase';
import SignInScreen from './src/screens/SignInScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import HabitSettingsScreen from './src/screens/HabitSettingsScreen';
import ProgressScreen from './src/screens/ProgressScreen';  
import { View, Image } from 'react-native';
import RoutineSettingsScreen from './src/screens/RoutineSettingsScreen';
import { ComponentProps } from 'react';
import { API_BASE_URL } from './src/config/API_base_url';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#D3AF37',
    secondary: '#6BA292',
  },
};

function HomeAppbar({ route, navigation }: any) {
  const { logout } = useAuth();
  const [deleteAccDialogVisible, setDeleteAccDialogVisible] = useState(false);
  const [deleteSuccessDialogVisible, setDeleteSuccessDialogVisible] = useState(false);
  const [accMenuVisible, setAccMenuVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
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
    hideDeleteAccDialog();
    setDeleteSuccessDialogVisible(true);
  }

  const handleFinalLogout = () => {
    setDeleteSuccessDialogVisible(false);
    logout();
  }

  return (
    <Appbar.Header style={{ backgroundColor: '#f5f5f5' }}>
      <Image
        source={require('./assets/goldMonoIcon.png')}
        style={{ width: 30, height: 30, marginRight: 10 }}
      />
      <Appbar.Content title={route.name} />
      {/* Account Menu */}
          <Menu
            visible={accMenuVisible}
            onDismiss={closeAccMenu}
            anchor={
              <Appbar.Action icon="account-cog" onPress={openAccMenu} />
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
      <Appbar.Action icon="logout" onPress={logout} />
    </Appbar.Header>
  )
}

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size}) => {
          type Props = ComponentProps<typeof Ionicons>;
          type IconName = Props["name"];

          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused
              ? 'home'
              : 'home-outline';
          } else if (route.name === 'Progress') {
            iconName = focused
              ? 'bar-chart'
              : 'bar-chart-outline';
          }

          return <Ionicons name={iconName as IconName} size={size} color={color} />;
        },
        tabBarLabelStyle: {
          fontSize: 16,
        },
        header: ({ route, navigation }) => <HomeAppbar route={route} navigation={navigation} />,
      })}
    >
      <Tab.Screen name='Dashboard' component={DashboardScreen} />
      <Tab.Screen name='Progress' component={ProgressScreen} />
    </Tab.Navigator>
  );
}

function RootNavigation() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
        <Stack.Screen
          name="Home"
          component={HomeTabs}
        />
        <Stack.Screen name="HabitSettingsScreen" component={HabitSettingsScreen} />
        <Stack.Screen name="RoutineSettingsScreen" component={RoutineSettingsScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="SignIn" component={SignInScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <RootNavigation />
        </NavigationContainer>
      </PaperProvider>
    </AuthProvider>
  );
}
