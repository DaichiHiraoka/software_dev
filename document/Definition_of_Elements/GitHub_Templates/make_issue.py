#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GitHub Issue自動作成スクリプト
implemented_features.txtを元に、機能別のissueを自動生成します。
"""

import subprocess
import sys
import os
import re

def read_implemented_features(file_path):
    """implemented_features.txtを読み込み、セクション別に分析"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return content
    except FileNotFoundError:
        print(f"エラー: {file_path} が見つかりません")
        sys.exit(1)

def create_github_issue(title, body, labels=None):
    """gh CLIを使用してGitHub Issueを作成"""
    try:
        # まずラベルなしでIssueを作成
        cmd = ['gh', 'issue', 'create', '--title', title, '--body', body]
        
        # subprocessでgh コマンドを実行
        result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
        
        if result.returncode == 0:
            print(f"✅ Issue作成成功: {title}")
            print(f"   URL: {result.stdout.strip()}")
            
            # ラベルが指定されている場合は、後からラベルを追加を試行
            if labels:
                issue_url = result.stdout.strip()
                issue_number = issue_url.split('/')[-1]
                for label in labels:
                    label_cmd = ['gh', 'issue', 'edit', issue_number, '--add-label', label]
                    subprocess.run(label_cmd, capture_output=True, text=True, encoding='utf-8')
                print(f"   ラベル追加を試行: {', '.join(labels)}")
            
            return True
        else:
            print(f"❌ Issue作成失敗: {title}")
            print(f"   エラー: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Issue作成でエラーが発生: {title}")
        print(f"   例外: {str(e)}")
        return False

def create_labels_if_not_exist():
    """必要なラベルが存在しない場合は作成"""
    required_labels = {
        'architecture': '#0e8a16',
        'database': '#1d76db', 
        'frontend': '#fbca04',
        'backend': '#d93f0b',
        'infrastructure': '#0052cc',
        'testing': '#5319e7',
        'enhancement': '#a2eeef',
        'system-design': '#c2e0c6',
        'migration': '#f9d0c4',
        'customer-facing': '#e99695',
        'React': '#61dafb',
        'order-management': '#f0ad4e',
        'admin': '#d73a49',
        'accounting': '#28a745',
        'analytics': '#17a2b8',
        'shipping': '#ffc107',
        'workflow': '#6f42c1',
        'dashboard': '#fd7e14',
        'API': '#20c997',
        'Express': '#6c757d',
        'Docker': '#007bff',
        'deployment': '#dc3545',
        'automation': '#6610f2',
        'CI/CD': '#e83e8c',
        'priority-high': '#b60205',
        'priority-medium': '#fbca04',
        'priority-low': '#0e8a16'
    }
    
    print("🏷️  必要なラベルを確認・作成中...")
    for label_name, color in required_labels.items():
        try:
            # ラベルを作成（既存の場合はエラーになるが無視）
            cmd = ['gh', 'label', 'create', label_name, '--color', color, '--description', f'Auto-created label for {label_name}']
            subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
        except:
            pass  # エラーは無視（既存ラベルの場合）
    print("✅ ラベル確認完了")

def generate_issues_from_features():
    """implemented_features.txtから機能別issueを生成"""
    
    # ファイルパスを構築
    script_dir = os.path.dirname(os.path.abspath(__file__))
    features_file = os.path.join(script_dir, 'implemented_features.txt')
    
    if not os.path.exists(features_file):
        print(f"エラー: implemented_features.txt が見つかりません: {features_file}")
        sys.exit(1)
    
    content = read_implemented_features(features_file)
    
    # 必要なラベルを作成
    create_labels_if_not_exist()
    
    # Issue定義リスト
    issues = [
        {
            "title": "【アーキテクチャ】マルチシステム構成の実装",
            "body": """## 📋 機能概要

### 目的
単一のCRUDアプリケーションから、5つの専門管理システムを持つ包括的なe-commerceプラットフォームへの拡張

### 概要
origin_srcの基本機能を拡張し、顧客・管理者それぞれに特化したシステム群を構築

## ✨ 機能詳細

### 実装されたシステム
- **顧客購入システム** (frontend/) - 商品カタログ、カート機能、注文受付
- **注文受付管理システム** (order-management/) - 注文一覧、ステータス管理
- **会計管理システム** (accounting-management/) - 支払い管理、売上統計
- **発送管理システム** (shipping-management/) - 配送管理、追跡番号管理
- **管理者システム** (admin-management/) - 総合管理、統計ダッシュボード

### 技術的な詳細
- React + TailwindCSSによるモダンフロントエンド
- Docker composeによるマルチサービス管理
- 共通バックエンドAPI (port 3005) による統合

## 🚀 開発タスク

### 完了済みタスク
- [x] 顧客向け購入システムの構築
- [x] 注文管理システムの実装
- [x] 会計管理システムの実装
- [x] 発送管理システムの実装
- [x] 管理者総合システムの実装
- [x] Docker化対応
- [x] ネットワーク設計・実装

## ✅ 受け入れ基準

- 5つのシステムが独立して動作する
- 共通バックエンドAPIを通じてデータ連携が行われる
- Docker環境で全システムが正常起動する
- レスポンシブデザインでモバイル対応済み

## 🔗 関連情報

- origin_src: 基本CRUD機能の雛型
- docker-compose.yml: サービス構成定義
- 各システムのREADME.md

## Labels
`architecture` `enhancement` `system-design` `priority-high`""",
            "labels": ["architecture", "enhancement", "system-design", "priority-high"]
        },
        
        {
            "title": "【データベース】スキーマ設計とマスターデータ管理",
            "body": """## 📋 機能概要

### 目的
origin_srcの単一TestTableから、正規化されたe-commerceデータベーススキーマへの拡張

### 概要
商品管理、顧客管理、注文管理、在庫管理を分離した適切なデータベース設計の実装

## ✨ 機能詳細

### 新規テーブル設計
- **Products/Stocks**: 商品マスターと在庫管理の分離設計
- **Customers**: 顧客情報管理（顧客ID、名前、住所、連絡先）
- **Orders**: 注文ヘッダ情報（支払い・配送ステータス含む）
- **OrderItems**: 注文明細情報（商品別数量・価格）

### データ整合性の向上
- 外部キー制約による参照整合性確保
- トランザクション管理による複数テーブル更新の安全性
- paymentStatus, shippingStatusによる進捗管理

### レガシーデータ対応
- TestTable保持による origin_src との完全互換性維持
- データ移行機能: TestTable → Products の段階的移行
- Premium Items（新規）とLegacy Items（従来）の並行運用

## 🚀 開発タスク

### 完了済みタスク
- [x] 正規化されたテーブル設計
- [x] 外部キー制約の実装
- [x] トランザクション管理の実装
- [x] データ移行ツールの作成
- [x] レガシーデータ互換性の確保

## ✅ 受け入れ基準

- 全テーブルが適切に正規化されている
- 外部キー制約によりデータ整合性が保たれている
- TestTableからProductsへのデータ移行が正常動作する
- トランザクションエラー時の適切なロールバック

## Labels
`database` `schema` `migration` `priority-high`""",
            "labels": ["database", "schema", "migration", "priority-high"]
        },
        
        {
            "title": "【フロントエンド】顧客購入システムの実装",
            "body": """## 📋 機能概要

### 目的
顧客が商品を閲覧・購入できる使いやすいWebインターフェースの提供

### 概要
商品検索、ショッピングカート、注文処理を含む包括的な購入システム

## ✨ 機能詳細

### 主要機能
- **商品検索**: 名前による部分一致検索
- **ショッピングカート**: 商品追加・削除・数量変更
- **注文処理**: 顧客情報入力から注文確定まで
- **レスポンシブデザイン**: TailwindCSSによるモダンUI

### 技術的な詳細
- React functional components with hooks
- TailwindCSS for responsive design
- Real-time cart updates
- Form validation and error handling

## 🚀 開発タスク

### 完了済みタスク
- [x] 商品カタログ表示
- [x] リアルタイム商品検索
- [x] ショッピングカート機能
- [x] 注文フォーム実装
- [x] レスポンシブデザイン対応
- [x] エラーハンドリング実装

## ✅ 受け入れ基準

- 商品検索が部分一致で正常動作
- カート操作がリアルタイムで反映される
- 注文プロセスが最後まで完了できる
- モバイル・デスクトップで適切に表示される

## Labels
`frontend` `customer-facing` `React` `priority-high`""",
            "labels": ["frontend", "customer-facing", "React", "priority-high"]
        },
        
        {
            "title": "【管理システム】注文受付管理システムの実装",
            "body": """## 📋 機能概要

### 目的
受注状況の一元管理と効率的な注文処理ワークフローの提供

### 概要
注文一覧表示、検索・フィルター、ステータス管理を含む注文管理システム

## ✨ 機能詳細

### 主要機能
- **注文一覧表示**: ページネーション対応
- **検索・フィルター**: 顧客名、注文日、ステータスによる絞り込み
- **注文詳細表示**: モーダルウィンドウでの詳細確認
- **ステータス更新**: 注文進捗の管理

### 技術的な詳細
- React with hooks for state management
- Modal components for detail views
- Pagination for large datasets
- Real-time status updates

## 🚀 開発タスク

### 完了済みタスク
- [x] 注文一覧表示機能
- [x] 検索・フィルター機能
- [x] 注文詳細モーダル
- [x] ステータス更新機能
- [x] ページネーション実装

## ✅ 受け入れ基準

- 注文一覧が適切にページング表示される
- 検索・フィルターが正常動作する
- ステータス更新が即座に反映される
- 注文詳細が正確に表示される

## Labels
`frontend` `order-management` `admin` `priority-high`""",
            "labels": ["frontend", "order-management", "admin", "priority-high"]
        },
        
        {
            "title": "【管理システム】会計管理システムの実装",
            "body": """## 📋 機能概要

### 目的
支払い状況の管理と売上分析による経営判断支援

### 概要
支払い管理、売上統計、収益分析を含む包括的な会計管理システム

## ✨ 機能詳細

### 主要機能
- **支払い管理**: 支払いステータスの更新・確認
- **売上統計**: 期間別売上集計・グラフ表示
- **収益分析**: 商品別・顧客別の収益分析
- **レポート機能**: CSV形式での売上データ出力

### 技術的な詳細
- Chart.js for data visualization
- CSV export functionality
- Date range filtering
- Statistical calculations

## 🚀 開発タスク

### 完了済みタスク
- [x] 支払いステータス管理
- [x] 売上統計表示
- [x] グラフ表示機能
- [x] CSV出力機能
- [x] 期間別集計機能

## ✅ 受け入れ基準

- 支払いステータスが正確に管理される
- 売上統計が正しく計算・表示される
- CSVエクスポートが正常動作する
- グラフが適切に可視化される

## Labels
`frontend` `accounting` `analytics` `priority-high`""",
            "labels": ["frontend", "accounting", "analytics", "priority-high"]
        },
        
        {
            "title": "【管理システム】発送管理システムの実装",
            "body": """## 📋 機能概要

### 目的
配送業務の効率化と追跡管理による顧客サービス向上

### 概要
配送ステータス管理、追跡番号管理、配送ラベル発行を含む発送管理システム

## ✨ 機能詳細

### 主要機能
- **配送一覧**: 配送待ち注文の一覧表示
- **配送ステータス管理**: 準備中→発送済み→配達完了
- **追跡番号管理**: ヤマト運輸追跡番号の登録・更新
- **配送ラベル**: 配送情報の印刷対応

### 技術的な詳細
- Status workflow management
- Tracking number validation
- Print-friendly layouts
- Integration with shipping providers

## 🚀 開発タスク

### 完了済みタスク
- [x] 配送一覧表示
- [x] ステータス管理機能
- [x] 追跡番号管理
- [x] 配送ラベル印刷対応
- [x] ワークフロー実装

## ✅ 受け入れ基準

- 配送ステータスが適切に管理される
- 追跡番号が正しく登録・更新される
- 配送ラベルが印刷可能な形式で出力される
- ワークフローが論理的に動作する

## Labels
`frontend` `shipping` `workflow` `priority-high`""",
            "labels": ["frontend", "shipping", "workflow", "priority-high"]
        },
        
        {
            "title": "【管理システム】総合管理者システムの実装",
            "body": """## 📋 機能概要

### 目的
全システムの統合管理と運用効率化のための管理者ダッシュボード

### 概要
統計ダッシュボード、商品管理、システム運用機能を含む総合管理システム

## ✨ 機能詳細

### 主要機能
- **統合ダッシュボード**: 全システムの統計情報
- **商品管理**: Premium Items / Legacy Items の二重管理
- **バッチ操作**: 一括削除・システムリセット機能
- **データ移行**: TestTable → Products テーブルへの移行機能

### 技術的な詳細
- Complex dashboard with multiple data sources
- Modal confirmation dialogs
- Batch processing capabilities
- Data migration tools

## 🚀 開発タスク

### 完了済みタスク
- [x] 統合ダッシュボード
- [x] 商品管理機能
- [x] バッチ削除機能
- [x] システムリセット機能
- [x] データ移行ツール
- [x] 統計情報表示

## ✅ 受け入れ基準

- 全システムの統計情報が正確に表示される
- バッチ操作が安全に実行される
- データ移行が正常に完了する
- システムリセットが適切に動作する

## Labels
`frontend` `admin` `dashboard` `priority-high`""",
            "labels": ["frontend", "admin", "dashboard", "priority-high"]
        },
        
        {
            "title": "【API】バックエンドAPI機能の大幅拡張",
            "body": """## 📋 機能概要

### 目的
origin_srcの基本CRUD APIから40以上のエンドポイントを持つ包括的なREST APIへの拡張

### 概要
商品、注文、顧客、統計、システム管理を含む全機能をサポートするAPI群

## ✨ 機能詳細

### API機能群
- **商品管理API**: 商品検索、Premium/Legacy Items管理
- **注文管理API**: 注文登録、ステータス管理、詳細取得
- **顧客管理API**: 顧客情報CRUD操作
- **統計・分析API**: 売上統計、商品別・顧客別分析
- **システム管理API**: リセット、移行、バッチ削除

### 技術的な詳細
- Express.js framework
- SQLite with transaction management
- Error handling and validation
- CORS configuration

## 🚀 開発タスク

### 完了済みタスク
- [x] 40+ API endpoints implementation
- [x] Transaction management
- [x] Error handling
- [x] Input validation
- [x] CORS setup
- [x] Database optimization

## ✅ 受け入れ基準

- 全APIエンドポイントが正常動作する
- エラーハンドリングが適切に実装されている
- トランザクション管理が正しく動作する
- APIドキュメントが整備されている

## Labels
`backend` `API` `Express` `priority-high`""",
            "labels": ["backend", "API", "Express", "priority-high"]
        },
        
        {
            "title": "【インフラ】Docker化と本番環境対応",
            "body": """## 📋 機能概要

### 目的
開発・本番環境の一元管理とデプロイメントの自動化

### 概要
Docker composeによる5システム統合管理と本番運用対応

## ✨ 機能詳細

### Docker化対応
- **マルチサービス構成**: docker-compose.ymlによる5システム統合管理
- **ネットワーク分離**: ecommerce_networkによる内部通信
- **データ永続化**: db_dataボリュームによるデータ保護
- **ヘルスチェック**: サービス監視・自動復旧機能

### 本番運用対応
- **静的ファイル配信**: nginxによる画像・アセット配信
- **環境変数管理**: .envファイルによる設定管理
- **エラーハンドリング**: 包括的エラー処理・ユーザーフィードバック
- **セキュリティ**: CORS設定・ファイルアップロード制限

## 🚀 開発タスク

### 完了済みタスク
- [x] Docker compose設定
- [x] ネットワーク設計
- [x] データ永続化設定
- [x] ヘルスチェック実装
- [x] nginx設定
- [x] 環境変数管理

## ✅ 受け入れ基準

- 全サービスがDocker環境で正常起動する
- データの永続化が確保されている
- ヘルスチェックが正常動作する
- 本番環境デプロイが可能である

## Labels
`infrastructure` `Docker` `deployment` `priority-high`""",
            "labels": ["infrastructure", "Docker", "deployment", "priority-high"]
        },
        
        {
            "title": "【テスト】包括的テストスイートの構築",
            "body": """## 📋 機能概要

### 目的
システム全体の品質保証と継続的インテグレーション環境の構築

### 概要
Python/Rustによる単体・結合・システムテストの包括的テストスイート

## ✨ 機能詳細

### テスト体制
- **統合テストスイート**: Python/Rustによる包括的テスト
- **自動テスト実行**: run_all_tests.pyによるCI/CD対応
- **テスト結果出力**: CSV + TXTによる結果レポート
- **デバッグ支援**: 詳細ログ・エラーハンドリング

### テスト範囲
- Unit tests for individual components
- Integration tests for API endpoints
- System tests for end-to-end workflows
- Performance tests for scalability

## 🚀 開発タスク

### 完了済みタスク
- [x] テストスイート構築
- [x] 自動実行スクリプト
- [x] レポート機能
- [x] ログ出力機能
- [x] CI/CD対応
- [x] コンソール出力ログ実装

## ✅ 受け入れ基準

- 全テストが自動実行される
- テスト結果が適切にレポートされる
- ログ出力が正常動作する
- CI/CD環境で実行可能である

## Labels
`testing` `automation` `CI/CD` `priority-medium`""",
            "labels": ["testing", "automation", "CI/CD", "priority-medium"]
        }
    ]
    
    print("🚀 GitHub Issue自動作成を開始します...")
    print(f"📄 対象ファイル: {features_file}")
    print(f"📝 作成予定Issue数: {len(issues)}")
    print()
    
    success_count = 0
    failed_count = 0
    
    for i, issue in enumerate(issues, 1):
        print(f"[{i}/{len(issues)}] {issue['title']} を作成中...")
        
        if create_github_issue(issue['title'], issue['body'], issue['labels']):
            success_count += 1
        else:
            failed_count += 1
        
        print()
    
    print("=" * 60)
    print(f"✅ Issue作成完了")
    print(f"   成功: {success_count}件")
    print(f"   失敗: {failed_count}件")
    print(f"   合計: {len(issues)}件")
    
    if failed_count > 0:
        print(f"\n⚠️  {failed_count}件のIssue作成に失敗しました。")
        print("   gh CLIの認証状態やリポジトリ権限を確認してください。")
        sys.exit(1)
    else:
        print("\n🎉 全てのIssueが正常に作成されました！")

def main():
    """メイン関数"""
    print("GitHub Issue自動作成ツール")
    print("=" * 40)
    
    # gh CLIがインストールされているかチェック
    try:
        result = subprocess.run(['gh', '--version'], capture_output=True, text=True)
        if result.returncode != 0:
            print("❌ gh CLI が見つかりません。GitHub CLIをインストールしてください。")
            sys.exit(1)
        print(f"✅ GitHub CLI: {result.stdout.strip()}")
    except FileNotFoundError:
        print("❌ gh CLI が見つかりません。GitHub CLIをインストールしてください。")
        sys.exit(1)
    
    # 認証状態チェック
    try:
        result = subprocess.run(['gh', 'auth', 'status'], capture_output=True, text=True)
        if result.returncode != 0:
            print("❌ GitHub CLIの認証が必要です。 'gh auth login' を実行してください。")
            sys.exit(1)
        print("✅ GitHub CLI認証: OK")
    except Exception as e:
        print(f"❌ 認証チェックでエラー: {e}")
        sys.exit(1)
    
    print()
    
    # Issue作成実行
    generate_issues_from_features()

if __name__ == "__main__":
    main()