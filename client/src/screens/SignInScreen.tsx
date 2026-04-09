import React, { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, Title, HelperText } from 'react-native-paper';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<StackNavigationProp<any>>();

  const checkFirstSignIn = async (user: any) => {
    try {
      const tok = await user.getIdToken();
      // create new user in database if not found  
      await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tok}`
        },
        body: JSON.stringify({
          firebaseUid: user.uid,
          email: user.email,
        }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      await checkFirstSignIn(auth.currentUser);
      // Auth state listener in AuthContext will handle redirection to AppStack
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
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
          <Title style={styles.title}>Welcome Back</Title>
          <Text style={styles.subtitle}>Sign in to continue tracking your habits</Text>

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

          {error ? <HelperText type="error">{error}</HelperText> : null}

          <Button
            mode="contained"
            onPress={handleSignIn}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Sign In
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('SignUp')}
            style={styles.linkButton}
          >
            Don't have an account? Sign Up
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  },
  button: {
    marginTop: 16,
    paddingVertical: 6,
  },
  linkButton: {
    marginTop: 16,
  },
});
