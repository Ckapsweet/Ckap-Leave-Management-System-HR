pipeline {
    agent { label 'Ckap' }

    options {
        timeout(time: 10, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        BASE_DIR = '/var/lib/jenkins'
        APP_NAME = 'leave-backend'
        CONFIG_FILE_ID = 'ckap-backend-env'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                configFileProvider([configFile(fileId: "${CONFIG_FILE_ID}", targetLocation: '.env')]) {
                    sh '''
                    set -e
                    echo "Node version: $(node -v)"
                    echo "NPM version: $(npm -v)"
                    npm install --omit=dev
                    '''
                }
            }
        }

        stage('Deploy to Server') {
            steps {
                configFileProvider([configFile(fileId: "${CONFIG_FILE_ID}", targetLocation: '.env')]) {
                    sh '''
                    set -e

                    # สร้าง directory ถ้ายังไม่มี
                    mkdir -p ${BASE_DIR}/backend

                    # ลบโค้ดเก่าและก๊อปปี้โค้ดใหม่ไปที่ deploy path
                    rm -rf ${BASE_DIR}/backend
                    cp -r . ${BASE_DIR}/backend
                    '''
                }
            }
        }

        stage('Start / Restart Server') {
            steps {
                sh '''
                set -e
                if pm2 describe $APP_NAME > /dev/null 2>&1; then
                    pm2 restart $APP_NAME
                else
                    pm2 start ${BASE_DIR}/backend/server.js --name $APP_NAME
                fi
                pm2 save
                '''
            }
        }
    }

    post {
        always { cleanWs() }
        success { echo "✅ Backend deployed! Build #${BUILD_NUMBER}" }
        failure  { echo "❌ Deployment failed! Build #${BUILD_NUMBER}" }
    }
}