pipeline {
    agent { label 'leave-backend' }

    triggers {
        pollSCM('H/5 * * * *')
        githubPush()
    }

    environment {
        SERVER_IP = '192.168.0.198'
        APP_DIR = '/home/adminis/backend'
    }

    stages {
        stage('Check Branch') {
            steps {
                script {
                    def branch = env.GIT_BRANCH?.replaceAll('origin/', '')
                    if (branch != 'main') {
                        currentBuild.result = 'ABORTED'
                        error("⛔ Branch '${branch}' is not main — skipping deploy")
                    }
                    echo "✅ Branch is main — proceeding with deploy"
                }
            }
        }

        stage('Clone Repository') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'github-leave-backend',  // ✅ แก้ d ซ้ำ
                        usernameVariable: 'githubUser',
                        passwordVariable: 'githubPwd'
                    )
                ]) {
                    sh '''
                    cd /home/adminis
                    if [ -d "backend" ]; then
                        rm -rf backend
                    fi
                    GIT_URL="https://${githubUser}:${githubPwd}@github.com/Ckapsweet/Ckap-Leave-Management-System-HR.git"
                    git clone $GIT_URL backend
                    '''
                }
            }
        }

        stage('Install Packages Dependencies') {
            steps {
                configFileProvider([configFile(fileId: 'ckap-backend-env', targetLocation: "${APP_DIR}/.env")]) {
                    sh '''
                    cd /home/adminis/backend
                    npm install
                    '''
                }
            }
        }

        stage('Deploy Application') {
            steps {
                sh '''
                cd /home/adminis/backend
                if pm2 list | grep -q 'app'; then
                    pm2 delete app
                fi
                pm2 start server.js --name app
                pm2 save
                '''
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo "✅ Deployment completed successfully! Build #${BUILD_NUMBER}"
        }
        failure {
            echo "❌ Deployment failed! Build #${BUILD_NUMBER}"
        }
    }
}