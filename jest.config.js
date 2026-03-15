module.exports = {
  projects: [
    {
      displayName: 'server',
      testEnvironment: 'node',
      roots: ['<rootDir>/server'],
      testMatch: [
        "**/__tests__/**/*.(js|jsx|ts|tsx)",
        "**/?(*.)+(spec|test).(js|jsx|ts|tsx)"
      ],
      transform: {}
    },
    {
      displayName: 'client',
      preset: 'jest-expo',
      transformIgnorePatterns: [
        "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)"
      ],
      roots: ['<rootDir>/client']
    }
  ]
};
