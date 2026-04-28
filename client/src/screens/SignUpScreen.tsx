import React, { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<StackNavigationProp<any>>();

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // Redirection logic: on success, go to Sign In
      navigation.navigate('SignIn');
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <MaterialIcons name="account-circle" size={100} color="#666" style={{alignSelf: 'center', marginBottom: 5}} />

          <Text variant="titleLarge" style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start your journey towards better habits</Text>

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry
            style={styles.input}
          />

          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            mode="outlined"
            secureTextEntry
            style={styles.input}
          />

          {error ? <HelperText type="error">{error}</HelperText> : null}

          <Button
            mode="contained"
            onPress={handleSignUp}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Sign Up
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('SignIn')}
            style={styles.linkButton}
          >
            Already have an account? Sign In
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  input: {
    marginBottom: 16,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  button: {
    marginTop: 16,
    paddingVertical: 6,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  linkButton: {
    marginTop: 16,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
});
