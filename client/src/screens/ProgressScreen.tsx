import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MD3LightTheme as DefaultTheme, PaperProvider, Text, List } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200ee',
    secondary: '#03dac6',
  },
};

export default function ProgressScreen() {
  const navigation = useNavigation<StackNavigationProp<any>>();

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Text variant="headlineSmall" style={styles.title}>Your Streaks</Text>
            
          </View>
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
});
