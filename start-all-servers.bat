@echo off
echo ===============================================
echo  通信販売システム Docker Compose起動スクリプト
echo ===============================================
echo.

echo Docker Composeで全システムを起動しています...
echo.

docker-compose up -d

echo.
echo ===============================================
echo  起動完了！以下のURLでアクセスできます:
echo ===============================================
echo.
echo 🛍️  顧客向けフロントエンド: http://localhost:3000
echo 📋 注文受付管理システム:   http://localhost:3001  
echo 💰 会計管理システム:       http://localhost:3002
echo 🚛 商品発送管理システム:   http://localhost:3003
echo 🔧 バックエンドAPI:        http://localhost:3004
echo.
echo ===============================================
echo  Docker Compose操作コマンド:
echo ===============================================
echo.
echo 🔍 コンテナ状況確認: docker-compose ps
echo 📋 ログ確認:         docker-compose logs -f
echo ⏹️  全システム停止:   docker-compose down
echo 🔄 再起動:           docker-compose restart
echo 🔧 リビルド起動:     docker-compose up --build
echo.

echo コンテナの起動状況を確認中...
timeout /t 3 /nobreak > nul
docker-compose ps

echo.
echo 起動が完了したらブラウザでアクセスしてください。
echo Ctrl+C で終了
pause