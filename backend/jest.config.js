// backend/jest.config.js
export default {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  verbose: true,
  forceExit: true,
  transform: {},
  transformIgnorePatterns: [
    'node_modules/(?!(chalk|supports-color)/)',
  ],
}