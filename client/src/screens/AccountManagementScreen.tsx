import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Appbar, Button, Dialog, HelperText, Portal, Text, TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../config/firebase';
import { API_BASE_URL } from '../config/API_base_url';
import { useAuth } from '../context/AuthContext';

export default function AccountManagementScreen() {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { logout } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const [deleteAccDialogVisible, setDeleteAccDialogVisible] = useState(false);
  const [deleteSuccessDialogVisible, setDeleteSuccessDialogVisible] = useState(false);
  const [reauthEmail, setReauthEmail] = useState('');
  const [reauthPassword, setReauthPassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const loadUserProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const token = await user.getIdToken();
        const res = await fetch(`${API_BASE_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error('Failed to load account profile');

        const profile = await res.json();
        setUsername(profile?.username ?? '');
        setEmail(profile?.email ?? user.email ?? '');
        setReauthEmail(profile?.email ?? user.email ?? '');
      } catch (err) {
        console.error('Could not load account profile', err);
      }
    };

    loadUserProfile();
  }, []);

  const saveProfile = async () => {
    const user = auth.currentUser;
    if (!user) return;

    if (!username.trim()) {
      setSaveError('Username is required.');
      return;
    }

    setLoading(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username: username.trim() }),
      });

      if (!res.ok) throw new Error('Failed to save profile');

      setSaveSuccess('Profile updated.');
    } catch (err) {
      console.error('Could not save profile', err);
      setSaveError('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const showDeleteAccDialog = () => {
    setDeleteError('');
    setDeleteAccDialogVisible(true);
  };

  const hideDeleteAccDialog = () => {
    setDeleteAccDialogVisible(false);
  };

  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user) {
      setDeleteError('No user logged in.');
      return;
    }

    if (!reauthEmail.trim() || !reauthPassword) {
      setDeleteError('Email and password are required.');
      return;
    }

    setDeleteError('');

    try {
      const credential = EmailAuthProvider.credential(reauthEmail.trim(), reauthPassword);
      await reauthenticateWithCredential(user, credential);

      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/api/auth/delete-account`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error('Failed to delete account');

      setDeleteAccDialogVisible(false);
      setDeleteSuccessDialogVisible(true);
    } catch (err) {
      console.error('Could not delete account', err);
      setDeleteError('Failed to delete account. Check your credentials and try again.');
    }
  };

  const handleFinalLogout = async () => {
    setDeleteSuccessDialogVisible(false);
    await logout();
  };

  return (
    <View style={styles.mainContainer}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Account Settings" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="headlineSmall" style={styles.title}>
          Manage your profile
        </Text>

        <TextInput label="Email" value={email} disabled mode="outlined" style={styles.input} />
        <TextInput
          label="Username"
          value={username}
          onChangeText={setUsername}
          mode="outlined"
          style={styles.input}
        />

        {saveError ? <HelperText type="error">{saveError}</HelperText> : null}
        {saveSuccess ? <HelperText type="info">{saveSuccess}</HelperText> : null}

        <Button mode="contained" onPress={saveProfile} loading={loading} disabled={loading} style={styles.button}>
          Save Profile
        </Button>

        <Button mode="outlined" onPress={logout} style={styles.button}>
          Log Out
        </Button>

        <Button mode="text" onPress={showDeleteAccDialog} textColor="red" style={styles.button}>
          Delete Account
        </Button>
      </ScrollView>

      <Portal>
        <Dialog visible={deleteAccDialogVisible} onDismiss={hideDeleteAccDialog}>
          <Dialog.Title>Delete Account</Dialog.Title>
          <Dialog.Content>
            <Text>Please re-enter your account credentials. This action is permanent.</Text>
            <TextInput
              label="Email"
              value={reauthEmail}
              onChangeText={setReauthEmail}
              autoCapitalize="none"
              style={styles.dialogInput}
            />
            <TextInput
              label="Password"
              secureTextEntry
              value={reauthPassword}
              onChangeText={setReauthPassword}
              style={styles.dialogInput}
            />
            {deleteError ? <HelperText type="error">{deleteError}</HelperText> : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDeleteAccDialog}>Cancel</Button>
            <Button onPress={handleDeleteAccount} textColor="red">
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog visible={deleteSuccessDialogVisible} onDismiss={handleFinalLogout}>
          <Dialog.Title>Success</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">Account successfully deleted.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleFinalLogout}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 12,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  button: {
    marginTop: 8,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  dialogInput: {
    marginTop: 12,
  },
});
