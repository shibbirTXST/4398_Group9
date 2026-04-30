import React, { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { API_BASE_URL } from '../config/API_base_url';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<StackNavigationProp<any>>();

  const checkFirstSignIn = async (user: any) => {
    try {
      const tok = await user.getIdToken();
      await fetch(`${API_BASE_URL}/api/auth/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tok}`,
        },
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
          {/* <Image
            source={require('../../assets/favicon.png')}
            style={{ width: 100, height: 100, alignSelf: 'center', marginBottom: 20 }}
          /> */}
          <Text variant="titleLarge" style={styles.title}>goalden</Text>
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
    lineHeight: 48,
    fontSize: 40,
    fontFamily: 'Lobster_400Regular',
    color: '#D3AF37',
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
