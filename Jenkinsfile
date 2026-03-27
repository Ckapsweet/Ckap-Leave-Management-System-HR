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
                    cd ~
                    pwd && ls -l
                    if [ -d "backend" ]; then
                        rm -rf backend
                    fi
                    GIT_URL="https://${githubUser}:${githubPwd}@github.com/Ckapsweet/Ckap-Leave-Management-System-HR.git"
                    git clone $GIT_URL
                    '''
                }
            }
        }
         stage('Install Packages Dependencies') {
            steps {
                sh 'cd /home/adminis/backend/ && npm install'
            }
        }
         stage('Deploy Application') {
            steps {
                echo "Deploying the application..."
                sh '''
                    cd /home/adminis/ && pwd
                    if pm2 list | grep -q 'app'; then
                        echo "Found 'app' process, stopping it..."
                        pm2 delete app
                    else
                        echo "'app' process not found, nothing to stop."
                    fi
                '''
                sh '''
                    echo "Starting 'app' process..."
                    pm2 start /home/adminis/backend/src/server.js --name app
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