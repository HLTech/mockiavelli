module.exports = {
    collectCoverageFrom: ['./src/**/*.ts'],

    // Configure jest-junit reporter on CI. Otherwise use only default reporter
    reporters: [
        'default',
        ...(Boolean(process.env.CI)
            ? [
                  [
                      'jest-junit',
                      {
                          outputDirectory: './reports',
                          outputName: 'junit.xml',
                          classNameTemplate: '{classname}',
                          titleTemplate: '{title}',
                          ancestorSeparator: ' ',
                          suiteNameTemplate: '{filename}',
                      },
                  ],
              ]
            : []),
    ],

    projects: [
        {
            displayName: 'unit',
            preset: 'ts-jest',
            testEnvironment: 'node',
            roots: ['test/unit'],
            clearMocks: true,
        },
        {
            displayName: 'int',
            preset: 'ts-jest',
            testEnvironment: 'node',
            roots: ['test/integration'],
            globalSetup: './test/integration/test-helpers/global-setup.ts',
            globalTeardown:
                './test/integration/test-helpers/global-teardown.ts',
            globals: {
                'ts-jest': {
                    tsConfig: 'test/integration/tsconfig.json',
                },
            },
            restoreMocks: true,
        },
    ],
};
