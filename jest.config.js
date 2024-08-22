/** @type {import('jest').Config} */
const config = {
    verbose: true,
    transform: {
        "^.+\\.jsx?$": "babel-jest"
    },
    testEnvironment: 'node',
    testPathIgnorePatterns: ['/node_modules/'],
};

export default config;