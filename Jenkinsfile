pipeline {
    agent { label 'leave-backend' }

    environment {
        SERVER_IP = '192.168.0.198'
        APP_DIR = '/home/adminis/backend'
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
                    cd /home/adminis

                    # ลบของเก่าถ้ามี
                    if [ -d "backend" ]; then
                        rm -rf backend
                    fi

                    # 🔥 clone แล้วตั้งชื่อเป็น backend
                    GIT_URL="https://${githubUser}:${githubPwd}@github.com/Ckapsweet/Ckap-Leave-Management-System-HR.git"
                    git clone $GIT_URL backend
                    '''
                }
            }
        }

        stage('Install Packages Dependencies') {
            steps {
                configFileProvider([configFile(fileId: 'ckap-backend-env', targetLocation: "${APP_DIR}/.env")])
                sh '''
                cd /home/adminis/backend
                npm install
                '''
            }
        }

        stage('Deploy Application') {
            steps {
                sh '''
                cd /home/adminis/backend

                # หยุด app เดิม (ถ้ามี)
                if pm2 list | grep -q 'app'; then
                    pm2 delete app
                fi

                # start ใหม่
                pm2 start server.js --name app
                pm2 save
                '''
            }
        }
    }

    post {
        success {
            echo "Deployment completed successfully!"
        }
        failure {
            echo "Deployment failed!"
        }
    }
}