pipeline {
    agent { label 'Ckap' }

    options {
        timeout(time: 10, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        BASE_DIR = '/home/adminis'
        APP_NAME = 'leave-backend'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                set -e
                npm install --omit=dev
                '''
            }
        }

        stage('Deploy to Server') {
            steps {
                sh '''
                set -e

                # สร้าง directory ถ้ายังไม่มี
                mkdir -p ${BASE_DIR}/backend

                # ก๊อปปี้โค้ดจาก workspace ไปที่ deploy path
                rm -rf ${BASE_DIR}/backend
                cp -r . ${BASE_DIR}/backend
                '''
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
        // always { cleanWs() }
        success { echo "✅ Backend deployed! Build #${BUILD_NUMBER}" }
        failure  { echo "❌ Deployment failed! Build #${BUILD_NUMBER}" }
    }
}