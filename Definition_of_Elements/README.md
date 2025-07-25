# プロジェクトドキュメント構成

## ディレクトリ構造

```
Definition_of_Elements/
├── README.md                           # このファイル - ドキュメント構成の説明
├── 01_Project_Overview/                # プロジェクト概要
│   ├── Definition_of_Elements.md       # プロジェクト定義書
│   ├── README.md                       # プロジェクト基本情報
│   └── FRONTEND_STRUCTURE_GUIDE.md     # フロントエンド構造説明
├── 02_Architecture_Design/             # アーキテクチャ設計
│   ├── 通信販売システム_ソフトウェア詳細設計書.md
│   └── imagefile_stream.md             # 画像ファイル処理
├── 03_User_Manuals/                    # ユーザーマニュアル
│   ├── USER_MANUAL_Customer.md         # 顧客向けマニュアル
│   ├── USER_MANUAL_OrderManagement.md  # 注文管理マニュアル
│   ├── USER_MANUAL_AccountingManagement.md # 会計管理マニュアル
│   ├── USER_MANUAL_ShippingManagement.md   # 発送管理マニュアル
│   └── SYSTEM_USAGE_GUIDE.md           # システム利用ガイド総合版
├── 04_Development_Guides/              # 開発ガイド
│   ├── CLAUDE.md                       # Claude Code開発指針
│   ├── add_point.md                    # 追加ポイント
│   └── gemini.md                       # Gemini関連
├── 05_Test_Documentation/              # テスト関連文書
│   ├── テスト仕様書_記述形式.md
│   ├── 通信販売システム_単体テスト仕様書兼結果書.md
│   ├── 通信販売システム_結合テスト仕様書兼結果書.md
│   ├── 通信販売システム_総合テスト仕様書兼結果書.md
│   └── PDF_outputs/                    # PDFテスト報告書
├── 06_API_Documentation/               # API関連文書
│   └── ローカル動作テスト用 REST API 一覧.md
├── 07_Deployment_Guides/               # デプロイメントガイド
│   ├── DOCKER_GUIDE.md                 # Docker基本ガイド
│   ├── README_Docker.md                # Docker詳細説明
│   └── Docker_Guides/                  # Docker関連詳細ガイド
└── 08_GitHub_Templates/                # GitHub関連テンプレート
    ├── README.md
    ├── unit_test_issue_template.md
    ├── unit_test_pr_template.md
    ├── integration_test_issue_template.md
    ├── integration_test_pr_template.md
    ├── system_test_issue_template.md
    └── system_test_pr_template.md
```

## 各セクションの説明

### 01_Project_Overview
プロジェクトの基本情報、目的、概要を説明するドキュメント

### 02_Architecture_Design  
システムアーキテクチャ、設計書、技術仕様

### 03_User_Manuals
エンドユーザー向けの操作マニュアル、利用ガイド

### 04_Development_Guides
開発者向けのガイド、開発環境設定、コーディング規約

### 05_Test_Documentation
テスト仕様書、テスト結果、品質保証関連文書

### 06_API_Documentation
REST API仕様、エンドポイント一覧、API利用ガイド

### 07_Deployment_Guides
本番環境へのデプロイ手順、Docker関連、インフラ設定

### 08_GitHub_Templates
GitHub Issue・PR テンプレート、プロジェクト管理関連