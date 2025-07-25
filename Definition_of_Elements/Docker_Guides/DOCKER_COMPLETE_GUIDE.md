# Docker完全ガイド

## 概要

このドキュメントでは、飲食店向け通信販売システムのDocker環境について説明します。

## システム構成

### サービス一覧
- **frontend** (Port 3000): 顧客向けフロントエンド
- **order-management** (Port 3001): 注文受付管理システム
- **accounting-management** (Port 3002): 会計管理システム
- **shipping-management** (Port 3003): 商品発送管理システム
- **admin-management** (Port 3004): 管理者システム
- **backend** (Port 3005): バックエンドAPI

### ネットワーク構成
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │ Order Mgmt      │    │ Accounting Mgmt │
│   Port 3000     │    │   Port 3001     │    │   Port 3002     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
         │ Shipping Mgmt   │    │   Admin Mgmt    │    │    Backend      │
         │   Port 3003     │    │   Port 3004     │    │   Port 3005     │
         └─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 起動方法

### 全サービス一括起動
```bash
# Windows
start-services.bat

# Linux/Mac
chmod +x start-services.sh
./start-services.sh

# 手動起動
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 個別サービス起動
```bash
# 特定のサービスのみ起動
docker-compose up -d frontend backend

# 特定のサービスのみ再構築
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

## 開発・運用コマンド

### ログ確認
```bash
# 全サービスのログ
docker-compose logs -f

# 特定のサービスのログ
docker-compose logs -f frontend
docker-compose logs -f backend
```

### サービス状態確認
```bash
# サービス状態一覧
docker-compose ps

# 詳細なサービス情報
docker-compose ps --services
```

### データベース操作
```bash
# データベースコンテナに入る
docker-compose exec backend bash

# SQLiteデータベースに直接アクセス
docker-compose exec backend sqlite3 Inshokuten.sqlite3
```

## トラブルシューティング

### よくある問題

1. **ポート競合エラー**
   ```bash
   # 使用中のポートを確認
   netstat -an | findstr :3000
   
   # サービス停止
   docker-compose down
   ```

2. **ビルドエラー**
   ```bash
   # キャッシュクリア後再ビルド
   docker-compose build --no-cache
   
   # Docker環境のクリーンアップ
   docker system prune -f
   ```

3. **データベース接続エラー**
   ```bash
   # バックエンドサービス再起動
   docker-compose restart backend
   
   # データベース初期化
   docker-compose exec backend node -e "require('./server2.js')"
   ```

## 環境変数設定

各サービスの環境変数:
- `REACT_APP_API_URL`: バックエンドURL (通常 http://localhost:3005)
- `NODE_ENV`: 動作環境 (development/production)
- `PORT`: サービスポート番号

## 本番デプロイ

```bash
# 本番用ビルド
docker-compose -f docker-compose.prod.yml build

# 本番環境起動
docker-compose -f docker-compose.prod.yml up -d
```