# Backend Dockerfile
FROM node:18-alpine

# アプリケーションディレクトリの作成
WORKDIR /app

# パッケージファイルをコピー
COPY package*.json ./

# 依存関係のインストール
RUN npm install

# アプリケーションのソースコードをコピー
COPY . .

# 画像ディレクトリの作成と権限設定
RUN mkdir -p public/images && \
    chmod 755 public/images

# SQLiteデータベースファイルの権限設定
RUN if [ -f "Inshokuten.sqlite3" ]; then chmod 664 Inshokuten.sqlite3; fi

# 非root ユーザーの作成
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001
RUN chown -R backend:nodejs /app
USER backend

# ポート3001を公開
EXPOSE 3001

# ヘルスチェック用のcurlをインストール（alpineの場合）
USER root
RUN apk add --no-cache curl
USER backend

# アプリケーションの起動
CMD ["node", "server2.js"]