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
      transform: {
        "\\.js$": "babel-jest"
      },
      moduleNameMapper: {
        "^../generated/prisma/client(\\.ts)?$": "<rootDir>/server/__mocks__/prismaClient.js",
        "^../../generated/prisma/client(\\.ts)?$": "<rootDir>/server/__mocks__/prismaClient.js"
      }
    },
    {
      displayName: 'client',
      preset: 'jest-expo',
      roots: ['<rootDir>/client'],
      transformIgnorePatterns: [
        'node_modules/(?!' +
          [
            '(jest-)?react-native',
            '@react-native(-community)?(/.*)?',
            'expo(nent)?(/.*)?',
            '@expo(nent)?(/.*)?',
            '@expo-google-fonts(/.*)?',
            'react-navigation',
            '@react-navigation(/.*)?',
            '@unimodules(/.*)?',
            'unimodules',
            'sentry-expo',
            'native-base',
            'react-native-svg',
            'expo-modules-core',
          ].join('|') +
        ')',
      ],
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
      moduleNameMapper: {
        '^expo/src/winter/(.*)$': '<rootDir>/client/__mocks__/emptyMock.js',
        '^expo/src/(.*)$': '<rootDir>/client/__mocks__/emptyMock.js',
      },
      setupFiles: ['<rootDir>/client/jest.setup.globals.js'],
      setupFilesAfterEnv: ['<rootDir>/client/jest.setup.mocks.js'],
    }
  ]
};