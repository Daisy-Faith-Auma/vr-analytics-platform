module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    testMatch: [
        '<rootDir>/tests/**/*.test.js'
    ],
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/**/*.test.js'
    ],
    // Fix: Changed moduleNameMapping to moduleNameMapper
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    },
    verbose: true,
    // Add transform for ES6 modules
    transform: {
        '^.+\\.js$': 'babel-jest'
    }
};