pipeline {
    agent { label 'Ckap' }

    environment {
        BASE_DIR = '/home/Ckap'
        APP_NAME = 'leave-backend'
    }

    stages {

        stage('Clone Repository') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'github',
                        usernameVariable: 'githubUser',
                        passwordVariable: 'githubPwd'
                    )
                ]) {
                    sh '''
                    set -e
                    cd ${BASE_DIR}

                    rm -rf backend

                    GIT_URL="https://${githubUser}:${githubPwd}@github.com/Ckapsweet/Ckap-Leave-Management-System-HR.git"
                    git clone $GIT_URL backend
                    '''
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                set -e
                cd ${BASE_DIR}/backend

                npm install
                '''
            }
        }

        stage('Start / Restart Server') {
            steps {
                sh '''
                set -e
                cd ${BASE_DIR}/backend

                # ถ้ามี pm2 อยู่แล้ว → restart
                pm2 describe $APP_NAME > /dev/null 2>&1
                if [ $? -eq 0 ]; then
                    pm2 restart $APP_NAME
                else
                    pm2 start index.js --name $APP_NAME
                fi

                pm2 save
                '''
            }
        }
    }

    post {
        success {
            echo "Backend deployed successfully!"
        }
        failure {
            echo "Backend deployment failed!"
        }
    }
}