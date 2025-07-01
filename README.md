## ソフトウェア開発基礎　webプラットフォーム開発のプロトタイプ


### 自分のPCに全ファイルをダウンロードするコマンド
`git clone -b development0.1.0 https://github.com/DaichiHiraoka/software_dev.git` 
ターミナルに張り付けて実行

### アプリケーション起動について
2つのターミナルを開いて以下をそれぞれ実行

#### フロントエンド<br>
1.`cd frontend/src`<br>
2.`npm start`<br>

#### バックエンド<br>
1.`cd backend`<br>
2.`node server2.js`<br>

### .ebvファイルについて
基本的にはローカルで実行想定
codespaceで実行時には割り当てられたurlの3001番をfrontend/.envに書く
