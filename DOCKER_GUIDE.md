# Docker コンテナ構成・運用ガイド

**システム名**：通信販売システム  
**Docker Compose バージョン**：3.8  
**最終更新**：2024-01-15

## 📋 システム全体構成

本システムは、Docker Composeを使用してマイクロサービス型のアーキテクチャで構成されています。各サービスは独立したコンテナとして実行され、効率的な開発・運用を実現しています。

## 🏗️ コンテナ構成図

```
┌─────────────────────────────────────────────────────────────┐
│                    ecommerce_network                        │
├─────────────────────────────────────────────────────────────┤
│ [Frontend:3000]  [Order:3001]  [Accounting:3002]          │
│                                                             │
│ [Shipping:3003] ← → [Backend:3004] ← → [DB Init]           │
│                                                             │
│                 [DB Backup] ← → [Volumes]                   │
└─────────────────────────────────────────────────────────────┘
```

## 🐳 サービス詳細

### 1. **db_init** - データベース初期化サービス
```yaml
サービス名: db_init
コンテナ名: ecommerce_db_init
用途: SQLiteデータベースの初期化
ビルドコンテキスト: ./backend
Dockerfile: Dockerfile.db
```

**特徴**:
- データベースの初期設定を行う一次的なサービス
- 他のサービスが依存する基盤データを準備
- 完了後は停止する設計

### 2. **backend** - バックエンドAPIサービス
```yaml
サービス名: backend
コンテナ名: ecommerce_backend
ポート: 3004:3004
ベースイメージ: node:18-alpine
主要機能: REST API, データベース操作, ファイル管理
```

**環境変数**:
- `NODE_ENV=development`
- `PORT=3004`

**ボリュームマウント**:
- `./backend/public:/app/public` - 画像ファイル
- `./Inshokuten.sqlite3:/app/Inshokuten.sqlite3` - データベース
- `backend_node_modules:/app/node_modules` - 依存関係

**ヘルスチェック**:
- URL: `http://localhost:3004/`
- 間隔: 30秒
- タイムアウト: 10秒
- リトライ: 3回

### 3. **frontend** - 顧客向けフロントエンド
```yaml
サービス名: frontend
コンテナ名: ecommerce_frontend
ポート: 3000:80
ベースイメージ: nginx:alpine (本番), node:18-alpine (ビルド)
主要機能: 商品検索, カート管理, 注文処理
```

**マルチステージビルド**:
1. **Build Stage**: React アプリケーションをビルド
2. **Production Stage**: Nginx で静的ファイルを配信

**環境変数**:
- `REACT_APP_API_URL=http://localhost:3004`

### 4. **order-management** - 注文管理システム
```yaml
サービス名: order-management
コンテナ名: ecommerce_order_management
ポート: 3001:80
ベースイメージ: nginx:alpine
主要機能: 注文受付, ステータス管理, 顧客対応
担当者: 注文受付係
```

### 5. **accounting-management** - 会計管理システム
```yaml
サービス名: accounting-management
コンテナ名: ecommerce_accounting_management
ポート: 3002:80
ベースイメージ: nginx:alpine
主要機能: 支払い管理, 売上分析, 決済処理
担当者: 会計係
```

### 6. **shipping-management** - 発送管理システム
```yaml
サービス名: shipping-management
コンテナ名: ecommerce_shipping_management
ポート: 3003:80
ベースイメージ: nginx:alpine
主要機能: 配送管理, 追跡番号管理, 配達状況更新
担当者: 発送係
```

### 7. **db_backup** - データベースバックアップサービス
```yaml
サービス名: db_backup
コンテナ名: ecommerce_db_backup
ベースイメージ: alpine:latest
主要機能: 定期バックアップ, データ保護
```

**ボリューム**:
- `db_data:/data` - データベースデータ
- `./backups:/backups` - バックアップファイル

## 🚀 Docker Compose コマンド集

### 基本操作

#### システム全体の起動
```bash
# 全サービス一括起動（バックグラウンド）
docker-compose up -d

# 全サービス一括起動（フォアグラウンド、ログ表示）
docker-compose up

# 特定サービスのみ起動
docker-compose up -d frontend backend
```

#### システム停止
```bash
# 全サービス停止
docker-compose down

# サービス停止 + ボリューム削除
docker-compose down -v

# サービス停止 + イメージ削除
docker-compose down --rmi all
```

#### システム再起動
```bash
# 全サービス再起動
docker-compose restart

# 特定サービスのみ再起動
docker-compose restart backend
```

### ビルド・更新操作

#### イメージのビルド
```bash
# 全サービスのイメージをビルド
docker-compose build

# キャッシュを使わずにビルド
docker-compose build --no-cache

# 特定サービスのみビルド
docker-compose build frontend
```

#### サービス更新
```bash
# コードの更新後、再ビルドして起動
docker-compose up -d --build

# 特定サービスのみ更新
docker-compose up -d --build backend
```

### 監視・デバッグ操作

#### ログ確認
```bash
# 全サービスのログを表示
docker-compose logs

# リアルタイムログを表示
docker-compose logs -f

# 特定サービスのログを表示
docker-compose logs -f backend

# 過去100行のログを表示
docker-compose logs --tail=100 frontend

# 特定時刻以降のログを表示
docker-compose logs --since="2024-01-15T10:00:00" backend
```

#### サービス状態確認
```bash
# サービス一覧と状態確認
docker-compose ps

# サービスの詳細情報
docker-compose ps -a

# リソース使用量の確認
docker-compose top
```

#### コンテナ内での作業
```bash
# バックエンドコンテナにシェルアクセス
docker-compose exec backend sh

# フロントエンドコンテナでコマンド実行
docker-compose exec frontend ls -la /usr/share/nginx/html

# ファイルのコピー（ホスト→コンテナ）
docker-compose cp ./backup.sqlite3 backend:/app/
```

### メンテナンス操作

#### データベース操作
```bash
# データベースバックアップ
docker-compose exec backend cp /app/Inshokuten.sqlite3 /app/backup/

# バックアップからの復元
docker-compose cp ./backup/Inshokuten.sqlite3 backend:/app/
```

#### クリーンアップ
```bash
# 未使用のイメージ削除
docker-compose down --rmi unused

# 未使用のボリューム削除
docker volume prune

# システム全体のクリーンアップ
docker system prune -a
```

## 🔧 個別サービスの Dockerfile 構成

### Backend Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# 依存関係のインストール
COPY package*.json ./
RUN npm install

# アプリケーションコピー
COPY . .

# ディレクトリとファイル権限の設定
RUN mkdir -p public/images && chmod 755 public/images
RUN if [ -f "Inshokuten.sqlite3" ]; then chmod 664 Inshokuten.sqlite3; fi

# セキュリティ設定（非rootユーザー）
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001
RUN chown -R backend:nodejs /app

# ヘルスチェック用ツールのインストール
USER root
RUN apk add --no-cache curl
USER backend

EXPOSE 3004
CMD ["node", "server2.js"]
```

### Frontend Dockerfile （マルチステージ）
```dockerfile
# Build stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🌐 ネットワーク・ボリューム設定

### ネットワーク設定
```yaml
networks:
  ecommerce_network:
    driver: bridge
```
- 全サービスが同一ネットワークで通信
- サービス名での名前解決が可能
- 外部からのアクセスは指定ポートのみ

### ボリューム設定
```yaml
volumes:
  db_data:          # データベースデータの永続化
    driver: local
  backend_node_modules:  # Node.js依存関係の最適化
    driver: local
```

## 🚨 トラブルシューティング

### よくある問題と対処法

#### 1. ポートの競合
**症状**: `port is already allocated` エラー
**対処**:
```bash
# 使用中のポートを確認
netstat -an | findstr :3000
# または
ss -tulpn | grep :3000

# サービスを停止してから再起動
docker-compose down
docker-compose up -d
```

#### 2. イメージビルドの失敗
**症状**: `build failed` エラー
**対処**:
```bash
# キャッシュをクリアしてビルド
docker-compose build --no-cache

# 古いイメージを削除
docker image prune -a
docker-compose build
```

#### 3. データベース接続エラー
**症状**: SQLite ファイルアクセスエラー
**対処**:
```bash
# データベースファイルの権限確認
docker-compose exec backend ls -la /app/Inshokuten.sqlite3

# 権限の修正
docker-compose exec backend chmod 664 /app/Inshokuten.sqlite3
```

#### 4. フロントエンド表示エラー
**症状**: 画面が表示されない
**対処**:
```bash
# フロントエンドの状態確認
docker-compose logs frontend

# 環境変数の確認
docker-compose exec frontend env | grep REACT_APP

# Nginxの設定確認
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf
```

#### 5. メモリ不足エラー
**症状**: `out of memory` エラー
**対処**:
```bash
# リソース使用量の確認
docker stats

# 未使用リソースの削除
docker system prune -a
```

## 📊 監視・ログ管理

### リアルタイム監視
```bash
# システム全体のリアルタイム監視
docker-compose logs -f

# 特定サービスの詳細監視
docker-compose logs -f --tail=50 backend

# 複数サービスの同時監視
docker-compose logs -f frontend backend
```

### ログローテーション設定
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### メトリクス収集
```bash
# リソース使用量の定期的な収集
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.PIDs}}"
```

## 🔒 セキュリティ設定

### コンテナセキュリティ
- 非rootユーザーでの実行
- 最小権限の原則
- 定期的なイメージ更新

### ネットワークセキュリティ
- 内部ネットワークでのサービス間通信
- 必要なポートのみ外部公開
- ファイアウォール設定の推奨

## 🚀 本番環境デプロイ

### 本番環境用設定
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  backend:
    environment:
      - NODE_ENV=production
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure
```

### デプロイコマンド
```bash
# 本番環境用設定でデプロイ
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 本番環境でのヘルスチェック
docker-compose exec backend curl -f http://localhost:3004/health
```

## 📚 参考資料

### Docker Compose 公式ドキュメント
- [Docker Compose Overview](https://docs.docker.com/compose/)
- [Compose file reference](https://docs.docker.com/compose/compose-file/)

### システム固有のドキュメント
- [SYSTEM_USAGE_GUIDE.md](SYSTEM_USAGE_GUIDE.md) - システム全体の利用ガイド
- [USER_MANUAL_*.md](USER_MANUAL_Customer.md) - 各システムの操作マニュアル

---

**Docker 構成管理** - 効率的なコンテナオーケストレーション

**システム管理者**: docker-admin@company.com  
**最終更新**: 2024-01-15  
**バージョン**: 1.0