import React, { useState } from 'react';
import { NavigationContainer, useNavigationState } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PaperProvider, MD3LightTheme as DefaultTheme, ActivityIndicator, Appbar, Portal, Dialog, TextInput, Button, Text, IconButton } from 'react-native-paper';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from './src/config/firebase';
import SignInScreen from './src/screens/SignInScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import HabitSettingsScreen from './src/screens/HabitSettingsScreen';
import ProgressScreen from './src/screens/ProgressScreen';  
import { View, Image, StyleSheet } from 'react-native';
import RoutineSettingsScreen from './src/screens/RoutineSettingsScreen';
import AccountManagementScreen from './src/screens/AccountManagementScreen';
import { ComponentProps } from 'react';
import { API_BASE_URL } from './src/config/API_base_url';
import { useFonts, Lobster_400Regular } from '@expo-google-fonts/lobster';

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
      <View style={styles.headerSide}>
        <Image
          source={require('./assets/goldMonoIcon.png')}
          style={styles.headerLogo}
        />
      </View>
      <Appbar.Content title={route.name} titleStyle={styles.headerTitle} />
      <View style={styles.headerSideRight}>
        {/* Account Menu */}
        <IconButton
          icon="account-cog"
          size={25}
          onPress= {() => navigation.navigate('AccountManagementScreen')}
        />
        <Appbar.Action icon="logout" onPress={logout} />
      </View>
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
      <Tab.Screen
        name='Dashboard'
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name='Progress'
        component={ProgressScreen}
        options={{ title: 'Progress' }}
      />
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
          options={{ title: 'Dashboard' }}
        />
        <Stack.Screen
          name="HabitSettingsScreen"
          component={HabitSettingsScreen}
          options={{ title: 'Habit Settings' }}
        />
        <Stack.Screen
          name="RoutineSettingsScreen"
          component={RoutineSettingsScreen}
          options={{ title: 'Routine Settings' }}
        />
        <Stack.Screen
          name="AccountManagementScreen"
          component={AccountManagementScreen}
          options={{ title: 'Account Management' }}
        />
        </>
      ) : (
        <>
          <Stack.Screen
            name="SignIn"
            component={SignInScreen}
            options={{ title: 'Sign In' }}
          />
          <Stack.Screen
            name="SignUp"
            component={SignUpScreen}
            options={{ title: 'Sign Up' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Lobster_400Regular,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer
          documentTitle={{
            formatter: (options, route) =>
              options?.title ?? route?.name ?? "Goalden"
          }}
        >
          <RootNavigation />
        </NavigationContainer>
      </PaperProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  headerSide: {
    width: 96,
    justifyContent: 'center',
    paddingLeft: 12,
  },
  headerSideRight: {
    width: 96,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  headerLogo: {
    width: 30,
    height: 30,
  },
  headerTitle: {
    textAlign: 'center',
  },
});
