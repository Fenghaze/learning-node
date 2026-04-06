export default {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    '**/*.js',
    '!bin/**',
    '!node_modules/**'
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  transform: {}
};
