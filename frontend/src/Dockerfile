# Frontend Dockerfile
FROM node:18-alpine

# アプリケーションディレクトリの作成
WORKDIR /app

# パッケージファイルをコピー
COPY package*.json ./

# 依存関係のインストール
RUN npm install

# React開発サーバー用の環境変数
ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true

# アプリケーションのソースコードをコピー
COPY . .

# 非root ユーザーの作成
RUN addgroup -g 1001 -S nodejs
RUN adduser -S frontend -u 1001
RUN chown -R frontend:nodejs /app
USER frontend

# ポート3000を公開
EXPOSE 3000

# React開発サーバーの起動
CMD ["npm", "start"]