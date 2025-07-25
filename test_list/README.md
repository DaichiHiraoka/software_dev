# テスト表一覧

このディレクトリには、通信販売システムの各種テスト表が含まれています。

## テスト表の種類

### 1. 単体テスト表 (Unit Test)
- **ファイル**: `unit_test_table.md`
- **目的**: 個別のプログラムユニット・関数・コンポーネントの動作確認
- **対象**: バックエンドAPI、フロントエンドコンポーネント、データベース操作

### 2. 結合テスト表 (Integration Test)
- **ファイル**: `integration_test_table.md`
- **目的**: 複数のコンポーネント間の連携動作確認
- **対象**: API-データベース連携、フロントエンド-バックエンド通信

### 3. 総合テスト表 (System Test)
- **ファイル**: `system_test_table.md`
- **目的**: システム全体の機能・性能・ユーザビリティ確認
- **対象**: エンドツーエンドのワークフロー、各管理画面の動作

## 自動APIテストツール

### 🦀 API Test Runner (Rust版) - 最高性能
- **実行ファイル**: `cargo run --release`
- **言語**: Rust (最高性能を実現)
- **特徴**: 超高速並行処理、最小メモリ使用量
- **推奨**: 性能重視の場合

### 🐍 API Test Runner (Python版) - 高機能
- **実行ファイル**: `python api_test_runner.py`
- **言語**: Python + aiohttp (非同期処理)
- **特徴**: 高速・豊富な機能・カラー出力
- **推奨**: バランス重視の場合

### 🚀 Simple API Test (Python版) - 簡単実行
- **実行ファイル**: `python simple_api_test.py`
- **言語**: Python標準ライブラリのみ
- **特徴**: 依存関係なし・確実動作・初心者向け
- **推奨**: シンプルさ重視の場合

### 共通機能
- GUIを介しないAPIテストの自動実行
- 並行処理による高速テスト実行
- CSV形式での結果出力
- リアルタイム進捗表示
- エラーハンドリング・タイムアウト制御

#### 使用方法

```bash
# 🦀 Rust版 (最高性能)
cargo run --release -- --verbose

# 🐍 Python版 (高機能)
python api_test_runner.py --verbose

# 🚀 Simple Python版 (依存関係なし)
python simple_api_test.py

# Windows簡単実行
run_tests.bat          # 対話式選択
run_simple_test.bat     # シンプル版直接実行
```

#### 共通オプション
- `--base-url, -b`: APIサーバーのベースURL (デフォルト: http://localhost:3005)
- `--output, -o`: 結果出力CSVファイル名 (デフォルト: api_test_results.csv)
- `--timeout, -t`: リクエストタイムアウト秒数 (デフォルト: 30)
- `--verbose, -v`: 詳細ログ表示

#### テスト対象API
1. **商品管理API** (UT-API-001〜007)
   - 商品検索 (正常系・異常系)
   - TestTable CRUD操作

2. **注文管理API** (UT-API-008〜011)
   - 注文一覧取得・フィルタリング
   - 注文作成・ステータス更新

3. **支払い管理API** (UT-API-012〜013)
   - 支払い一覧取得
   - 支払いステータス更新

4. **発送管理API** (UT-API-014〜015)
   - 発送一覧取得
   - 発送ステータス更新

5. **統計情報API** (UT-API-016)
   - システム統計データ取得

6. **システムAPI** (UT-API-018〜020)
   - ヘルスチェック
   - エラーハンドリング確認

#### 出力CSV形式
```csv
test_id,test_name,method,endpoint,status_code,response_time_ms,success,error_message,timestamp,response_size_bytes
UT-API-001,商品検索API,GET,/api/products?q=プレミアム,200,45,true,,2025-01-24T10:30:15Z,1024
```

#### パフォーマンス特徴
- **並行実行**: 全テストケース同時実行
- **最適化コンパイル**: Release buildで最高性能
- **メモリ効率**: 最小限のメモリ使用量
- **高速CSV出力**: ストリーミング書き込み

## テスト実行手順

1. **単体テスト** → **結合テスト** → **総合テスト** の順で実行
2. 各テストで不具合が発見された場合は修正後に再テスト
3. 全テストが完了するまで次の工程に進まない

### 自動APIテスト実行手順

```bash
# 1. Rustツールチェーンのインストール (初回のみ)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 2. プロジェクトディレクトリに移動
cd test_list

# 3. 依存関係のインストール
cargo build --release

# 4. バックエンドサーバー起動 (別ターミナル)
cd ../backend
node server2.js  # Port 3005で起動

# 5. APIテスト実行
cargo run --release -- --verbose

# 6. 結果確認
cat api_test_results.csv
```

## テスト環境

- **ローカル環境**: `http://localhost:3000-3005`
- **Docker環境**: Docker Compose による統合環境
- **データベース**: テスト用SQLiteデータベース

## 品質基準

- **単体テスト**: 全テストケース成功率 100%
- **結合テスト**: 主要シナリオ成功率 95%以上
- **総合テスト**: 業務フロー完走率 100%
- **APIテスト**: レスポンス時間 1秒以内、成功率 100%