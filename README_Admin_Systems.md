# 管理システム構成 - Docker Compose版

この通信販売システムは、Docker Composeを使用して一括起動できるマイクロサービス構成になっています。

## 🐳 システム構成

### 1. 顧客向けフロントエンド (Port 3000)
- **コンテナ名**: `ecommerce_frontend`
- **アクセス**: http://localhost:3000
- **機能**: 商品検索、カート機能、注文処理

### 2. 注文受付管理システム (Port 3001)
- **コンテナ名**: `ecommerce_order_management`
- **アクセス**: http://localhost:3001
- **担当**: 注文受付係
- **機能**: 
  - 注文一覧表示・検索
  - 注文ステータス管理
  - 顧客情報確認
  - 注文内容詳細表示

### 3. 会計管理システム (Port 3002)
- **コンテナ名**: `ecommerce_accounting_management`
- **アクセス**: http://localhost:3002
- **担当**: 会計係
- **機能**:
  - 支払い状況管理
  - 売上サマリー表示
  - 支払い方法別管理
  - 支払いステータス更新

### 4. 商品発送管理システム (Port 3003)
- **コンテナ名**: `ecommerce_shipping_management`
- **アクセス**: http://localhost:3003
- **担当**: 商品発送係
- **機能**:
  - 配送一覧管理
  - 配送ステータス追跡
  - 運送会社管理
  - 配送履歴表示

### 5. バックエンドAPI (Port 3004)
- **コンテナ名**: `ecommerce_backend`
- **アクセス**: http://localhost:3004
- **機能**: 全システム共通のAPI

### 6. データベース・その他サービス
- **データベース初期化**: `ecommerce_db_init`
- **データベースバックアップ**: `ecommerce_db_backup`

## 🚀 Docker Compose起動方法

### 前提条件
- Docker
- Docker Compose

### 一括起動
```bash
# プロジェクトルートディレクトリで実行
docker-compose up -d

# ログを確認する場合
docker-compose up
```

### 一括停止
```bash
docker-compose down
```

### 特定のサービスのみ起動
```bash
# バックエンドのみ
docker-compose up backend

# フロントエンドのみ
docker-compose up frontend

# 管理画面のみ
docker-compose up order-management accounting-management shipping-management
```

### コンテナの状態確認
```bash
# 実行中のコンテナを確認
docker-compose ps

# ログを確認
docker-compose logs -f [service-name]
```

### 強制リビルド
```bash
# 全サービスを強制リビルド
docker-compose up --build

# 特定のサービスのみリビルド
docker-compose up --build frontend
```

## 📱 アクセスURL

| システム | URL | ポート |
|---------|-----|--------|
| 顧客向けフロントエンド | http://localhost:3000 | 3000 |
| 注文受付管理 | http://localhost:3001 | 3001 |
| 会計管理 | http://localhost:3002 | 3002 |
| 商品発送管理 | http://localhost:3003 | 3003 |
| バックエンドAPI | http://localhost:3004 | 3004 |

## 🏗️ アーキテクチャ

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   顧客フロント   │  │   注文受付管理   │  │    会計管理     │  │   商品発送管理   │
│   (Port 3000)  │  │   (Port 3001)  │  │   (Port 3002)  │  │   (Port 3003)  │
└─────────┬───────┘  └─────────┬───────┘  └─────────┬───────┘  └─────────┬───────┘
          │                    │                    │                    │
          └────────────────────┼────────────────────┼────────────────────┘
                               │                    │
                         ┌─────┴──────┐      ┌─────┴──────┐
                         │ バックエンド │      │ データベース │
                         │ (Port 3004) │      │    SQLite  │
                         └────────────┘      └────────────┘
```

## 🔧 Docker設定詳細

### フロントエンドコンテナ
- **ベースイメージ**: nginx:alpine
- **ビルドステージ**: Node.js 18でReactアプリをビルド
- **本番実行**: Nginxで静的ファイルを配信
- **APIプロキシ**: `/api` リクエストをバックエンドに転送

### バックエンドコンテナ
- **ベースイメージ**: Node.js 18
- **データベース**: SQLiteファイルをボリュームマウント
- **静的ファイル**: 商品画像等の公開ファイル

### ネットワーク
- **ネットワーク名**: `ecommerce_network`
- **ドライバー**: bridge
- **内部通信**: コンテナ間はサービス名で通信可能

### ボリューム
- `db_data`: データベースデータ永続化
- `backend_node_modules`: バックエンドのnode_modules最適化

## 🛠️ 開発・デバッグ

### コンテナ内にアクセス
```bash
# バックエンドコンテナにアクセス
docker-compose exec backend sh

# フロントエンドコンテナにアクセス
docker-compose exec frontend sh
```

### ログの確認
```bash
# 全サービスのログを表示
docker-compose logs -f

# 特定のサービスのログを表示
docker-compose logs -f backend
docker-compose logs -f frontend
```

### ファイル変更の反映
- フロントエンド: コンテナを再ビルドが必要
- バックエンド: ボリュームマウントで自動反映（開発モード時）

## 🚨 トラブルシューティング

### ポートが使用中の場合
```bash
# ポート使用状況を確認
netstat -tulpn | grep :3000

# 使用中のプロセスを停止
sudo lsof -ti:3000 | xargs kill -9
```

### コンテナが起動しない場合
```bash
# エラーログを確認
docker-compose logs [service-name]

# コンテナの状態を確認
docker-compose ps

# 強制削除後に再起動
docker-compose down --volumes --remove-orphans
docker-compose up --build
```

### データベース初期化
```bash
# データベースボリュームを削除
docker-compose down --volumes
docker-compose up
```

## 📋 メンテナンス

### バックアップ
```bash
# データベースバックアップ
docker-compose exec db_backup cp /data/Inshokuten.sqlite3 /backups/backup_$(date +%Y%m%d_%H%M%S).sqlite3
```

### アップデート
```bash
# 最新のイメージをプル
docker-compose pull

# 再ビルドして起動
docker-compose up --build -d
```

## 🔒 セキュリティ注意事項

- 本番環境では適切な環境変数設定が必要
- データベースファイルのアクセス権限に注意
- APIエンドポイントのレート制限を実装推奨
- HTTPSリバースプロキシの使用を推奨