#!/usr/bin/env groovy

pipeline {
    agent {
        docker {
            image 'jenkins-pipeline-agent-ui:latest'
            reuseNode true
        }
    }
    environment {
        GIT_COMMIT_SHORT = "${GIT_COMMIT}".substring(0, 7)
        NPM_EMAIL = "jenkins@hltech.com"
        CI = true
    }
    options {
        timestamps()
        ansiColor('xterm')
    }
    stages {
        stage('install') {
            steps {
                sh 'yarn install'
            }
        }
        stage('build') {
            steps {
                sh 'yarn build'
            }
        }
        stage('tests') {
            agent {
                docker {
                    image 'buildkite/puppeteer:v1.13.0'
                    reuseNode true
                }
            }
            steps {
                sh 'yarn test --ci'
            }
        }
    }
}
