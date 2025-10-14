module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.js'],
  coveragePathIgnorePatterns: ['node_modules', 'src/data'],
  moduleFileExtensions: ['js', 'json'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};