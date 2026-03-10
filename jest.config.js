module.exports = {
  // run tests in a Node-like environment
  testEnvironment: 'node',

  // only look for tests under the server folder
  roots: ['<rootDir>/server'],

  // default matchers work but we'll be explicit
  testMatch: [
    "**/__tests__/**/*.(js|jsx|ts|tsx)",
    "**/?(*.)+(spec|test).(js|jsx|ts|tsx)"
  ],

  // since everything is CommonJS our transforms can be empty
  transform: {}
};
