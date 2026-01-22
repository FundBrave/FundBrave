module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', {
      isolatedModules: true,
    }],
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  // Handle ES modules from node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)',
  ],
  // Additional ES module handling
  moduleNameMapper: {
    '^uuid$': '<rootDir>/../node_modules/uuid/dist/index.js',
  },
};
