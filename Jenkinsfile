pipeline {
agent { label 'Ckap' }


options {
    timeout(time: 10, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '10'))
}

environment {
    BASE_DIR = '/home/leave-sys'
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

                npm install 
                '''
            }
        }
    }

    stage('Deploy to Server') {
        steps {
            configFileProvider([configFile(fileId: "${CONFIG_FILE_ID}", targetLocation: '.env')]) {
                sh '''
                set -e

                # สร้าง folder (ถ้ายังไม่มี)
                mkdir -p ${BASE_DIR}/backend

                # ลบเฉพาะไฟล์ด้านใน (ไม่ลบ folder)
                rm -rf ${BASE_DIR}/backend/

                # copy source code
                cp -r . ${BASE_DIR}/backend

                # 🔥 สำคัญ: copy .env ไปด้วย
                cp .env ${BASE_DIR}/backend/.env
                '''
            }
        }
    }

    stage('Start / Restart Server') {
        steps {
            sh '''
            set -e

            pm2 delete $APP_NAME || true
            pm2 start ${BASE_DIR}/backend/server.js --name $APP_NAME

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
