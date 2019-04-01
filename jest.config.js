module.exports = {

    // Configure jest-junit reporter on CI. Otherwise use only default reporter
    reporters: [
        "default",
        ... Boolean(process.env.CI) ? [[ "jest-junit", {
            "outputDirectory": "./reports",
            "outputName": "junit.xml",
            "classNameTemplate": "{classname}",
            "titleTemplate": "{title}",
            "ancestorSeparator": " ",
            "suiteNameTemplate": "{filename}"
        } ]] : []
    ],

    projects: [{
        displayName: "unit",
        rootDir: './test/unit',
        preset: 'ts-jest',
        testEnvironment: 'node',

    }, {
        displayName: "int",
        rootDir: './test/integration',
        preset: 'ts-jest',
        testEnvironment: 'node',

    }]
}