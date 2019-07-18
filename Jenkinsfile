#!/usr/bin/env groovy

pipeline {
    agent {
        docker {
            image 'jenkins-pipeline-agent-ui:latest'
            alwaysPull true
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
            post {
                always {
                    junit 'reports/*.xml'
                    publishHTML(target: [
                            allowMissing         : true,
                            alwaysLinkToLastBuild: true,
                            keepAll              : true,
                            reportDir            : 'reports',
                            reportFiles          : '**/*.html',
                            reportName           : 'Test Report'
                    ])
                }
            }
        }
        stage('release') {
            when { branch 'master' }
            steps {
                sshagent(['frontend-rw']) {
                    withCredentials([usernamePassword(credentialsId: 'frontend-npm', passwordVariable: 'NPM_PASSWORD', usernameVariable: 'NPM_USERNAME')]) {
                        sh "yarn release"
                    }
                }
            }
        }
    }
}
