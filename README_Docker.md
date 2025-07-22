# Docker 環境構築ガイド

## 概要

通信販売システムをDockerコンテナで動作させるための設定ファイル群です。

## ファイル構成

```
project_root/
├── docker-compose.yml         # メインのDocker Compose設定
├── docker-compose.dev.yml     # 開発環境用オーバーライド
├── docker-compose.prod.yml    # 本番環境用オーバーライド
├── .dockerignore              # プロジェクト全体のDocker ignore
├── backend/
│   ├── Dockerfile            # バックエンド用Dockerfile
│   ├── Dockerfile.db         # DB初期化用Dockerfile
│   ├── .dockerignore         # バックエンド用Docker ignore
│   └── package.json          # 更新されたpackage.json
└── frontend/src/
    ├── Dockerfile            # フロントエンド用Dockerfile
    └── .dockerignore         # フロントエンド用Docker ignore
```

## 起動方法

### 開発環境での起動
```bash
# プロジェクトルートで実行
docker-compose up -d

# または開発環境用設定を明示的に使用
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### 本番環境での起動
```bash
# 本番環境用設定で起動
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### ログ確認
```bash
# 全サービスのログ確認
docker-compose logs -f

# 特定サービスのログ確認
docker-compose logs -f backend
docker-compose logs -f frontend
```

## サービス構成

### backend (Node.js API)
- **ポート**: 3001
- **コンテナ名**: inshokuten_backend
- **ヘルスチェック**: 有効
- **ボリューム**: ソースコード、画像ファイル

### frontend (React)
- **ポート**: 3000
- **コンテナ名**: inshokuten_frontend
- **ホットリロード**: 有効（開発環境）
- **API接続**: backend:3001

### db_init (データベース初期化)
- **目的**: SQLiteデータベースの初期化
- **実行**: 起動時に一度だけ実行

### db_backup (データベースバックアップ)
- **目的**: データベースファイルのバックアップ管理
- **ボリューム**: db_data, backups

## ネットワーク設定

- **ネットワーク名**: inshokuten_network
- **タイプ**: bridge
- **サブネット**: 172.20.0.0/16

## ボリューム設定

- **db_data**: データベースファイル永続化
- **node_modules_backend**: バックエンドの依存関係
- **node_modules_frontend**: フロントエンドの依存関係

## 環境変数

### Backend
- `NODE_ENV`: development/production
- `PORT`: 3001
- `DEBUG`: デバッグ出力レベル

### Frontend
- `REACT_APP_API_URL`: バックエンドAPIのURL
- `CHOKIDAR_USEPOLLING`: ファイル監視設定
- `WATCHPACK_POLLING`: Webpack監視設定

## 開発時の便利コマンド

### コンテナの管理
```bash
# サービス停止
docker-compose down

# ボリュームも含めて完全削除
docker-compose down -v

# 特定サービスの再起動
docker-compose restart backend

# 特定サービスの再ビルド
docker-compose build backend
```

### コンテナ内でのコマンド実行
```bash
# バックエンドコンテナ内でシェル実行
docker-compose exec backend sh

# フロントエンドコンテナ内でコマンド実行
docker-compose exec frontend npm install

# データベースファイルの確認
docker-compose exec backend ls -la /app/
```

### データベース管理
```bash
# データベースバックアップ作成
docker-compose exec db_backup cp /data/Inshokuten.sqlite3 /backups/backup_$(date +%Y%m%d_%H%M%S).sqlite3

# バックアップから復元
docker-compose exec db_backup cp /backups/backup_YYYYMMDD_HHMMSS.sqlite3 /data/Inshokuten.sqlite3
```

## トラブルシューティング

### よくある問題と解決方法

#### 1. ポートが既に使用されている
```bash
# ポート使用状況確認
netstat -tulpn | grep :3001
lsof -i :3000

# 使用中のプロセスを停止
sudo kill -9 <PID>
```

#### 2. ボリュームの権限問題
```bash
# ボリュームの権限確認
docker-compose exec backend ls -la /app/

# 権限修正
sudo chown -R 1001:1001 ./backend/public/images/
```

#### 3. 依存関係の問題
```bash
# node_modulesをクリア
docker-compose down
docker volume prune
docker-compose build --no-cache
docker-compose up -d
```

#### 4. ネットワーク接続の問題
```bash
# ネットワーク状況確認
docker network ls
docker network inspect $(docker-compose ps -q | head -1 | xargs docker inspect --format='{{range .NetworkSettings.Networks}}{{.NetworkID}}{{end}}')

# ネットワーク再作成
docker-compose down
docker network prune
docker-compose up -d
```

## セキュリティ設定

### 非rootユーザーでの実行
- バックエンド: ユーザーID 1001 (backend)
- フロントエンド: ユーザーID 1001 (frontend)
- DB初期化: ユーザーID 1001 (dbinit)

### ファイル権限
- 画像ディレクトリ: 755
- データベースファイル: 664
- アプリケーションディレクトリ: backend:nodejs

## パフォーマンス最適化

### 開発環境
- ファイル監視の最適化 (CHOKIDAR_USEPOLLING)
- ホットリロード有効
- ボリュームマウントでライブ編集

### 本番環境
- マルチステージビルドでイメージサイズ削減
- 静的ファイルの最適化
- Nginxリバースプロキシ

## モニタリング

### ヘルスチェック
```bash
# サービス状態確認
docker-compose ps

# ヘルスチェック状況確認
docker inspect inshokuten_backend | grep -A 10 Health
```

### リソース使用量
```bash
# リソース使用量確認
docker stats

# 特定コンテナの詳細
docker stats inshokuten_backend inshokuten_frontend
```

## 本番環境への展開

### 事前準備
1. 環境変数の設定
2. SSL証明書の配置
3. Nginxの設定
4. データベースの初期化

### 展開手順
```bash
# 本番用イメージのビルド
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# 本番環境での起動
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# サービス状態確認
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

---

**最終更新**: 2024年1月15日  
**作成者**: 開発チーム