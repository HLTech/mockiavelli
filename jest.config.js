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
        },
        {
            displayName: 'int',
            preset: 'ts-jest',
            testEnvironment: 'node',
            roots: ['test/integration'],
            globalSetup: './test/integration/utils/global-setup.ts',
            globalTeardown: './test/integration/utils/global-teardown.ts',
            globals: {
                'ts-jest': {
                    tsConfig: 'test/integration/tsconfig.json',
                },
            },
            restoreMocks: true,
        },
    ],
};
