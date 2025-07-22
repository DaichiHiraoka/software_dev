# 通販システム 実装サマリー

## 概要
設計ドキュメント「Definition_of_Elements.md」に基づき、既存プロトタイプを拡張し、フル機能の通販システムを構築しました。

---

## 追加データベーステーブル

### 1. 顧客テーブル（Customers）
```sql
CREATE TABLE Customers (
  customerID INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  contactInfo TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2. 注文テーブル（Orders）
```sql
CREATE TABLE Orders (
  orderID INTEGER PRIMARY KEY AUTOINCREMENT,
  orderDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  customerID INTEGER NOT NULL,
  paymentMethod TEXT NOT NULL,
  paymentStatus INTEGER DEFAULT 0,  -- 0:未払い, 1:支払い済み
  shippingStatus INTEGER DEFAULT 0, -- 0:未発送, 1:準備中, 2:発送済み
  totalAmount REAL,
  FOREIGN KEY (customerID) REFERENCES Customers(customerID)
);
```

### 3. 注文商品テーブル（OrderItems）
```sql
CREATE TABLE OrderItems (
  orderItemID INTEGER PRIMARY KEY AUTOINCREMENT,
  orderID INTEGER NOT NULL,
  productID INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  price REAL NOT NULL,
  FOREIGN KEY (orderID) REFERENCES Orders(orderID),
  FOREIGN KEY (productID) REFERENCES Products(ProductID)
);
```

---

## 追加APIエンドポイント

### 注文管理系
- `POST /api/customers` … 顧客登録（input_customer_info）
- `GET /api/products/:id/stock` … 在庫確認（check_stock）
- `POST /api/orders` … 注文作成（register_order, confirm_order）

### 在庫管理系
- `GET /api/stocks` … 在庫数一覧取得（query_stock_quantity）
- `PUT /api/products/:id/stock` … 在庫数更新（update_stock_quantity）

### 顧客管理系
- `GET /api/customers` … 顧客一覧取得
- `GET /api/customers/:id` … 顧客詳細取得
- `PUT /api/customers/:id` … 顧客情報更新（manage_customer_info）
- `DELETE /api/customers/:id` … 顧客削除

### 会計管理系
- `PUT /api/orders/:id/payment-status` … 支払状況更新（confirm_payment_status）

### 発送管理系
- `GET /api/orders` … 注文一覧取得（view_unshipped_orders）
- `GET /api/orders/:id` … 注文詳細取得
- `PUT /api/orders/:id/shipping-status` … 発送状況更新（update_shipping_status）
- `POST /api/invoices` … 請求書・領収書発行（create_invoice）

---

## フロントエンド追加機能

### 1. カート機能
- 商品追加・数量変更・削除
- 自動合計金額計算

### 2. 注文フロー
- 商品選択（select_product）
- 顧客情報入力フォーム（input_customer_info）
- 支払い方法選択（manage_payment）
- 注文確認・確定（confirm_order）

### 3. UI改善
- モーダル式注文フォーム
- 在庫切れ商品対応
- リアルタイム合計金額表示

---

## 実装ビジネスフロー

### 注文処理フロー
1. **商品検索・選択** … 既存検索機能を活用
2. **カート管理** … 選択商品をカートに追加・管理
3. **顧客情報入力** … 名前・住所・連絡先入力
4. **支払い方法選択** … 銀行振込、コンビニ、代引、クレジット
5. **注文確認** … 在庫確認後、注文データ生成
6. **状態管理** … 支払・発送状態管理

### 在庫管理フロー
- 注文時の在庫確認
- 発送時に自動在庫減算
- 実在庫・引当在庫管理

---

## 設計ドキュメントとの対応

| 設計機能名          | 実装API／機能           | 概要               |
|-----------------|---------------------|-------------------|
| check_stock     | GET /api/products/:id/stock | 在庫確認           |
| register_order  | POST /api/orders    | 注文登録           |
| select_product  | フロント機能           | 商品選択UI           |
| input_customer_info | POST /api/customers | 顧客情報入力         |
| confirm_order   | POST /api/orders    | 注文確定           |
| update_stock_quantity | PUT /api/products/:id/stock | 在庫更新           |
| query_stock_quantity | GET /api/stocks   | 在庫照会           |
| manage_customer_info | CRUD /api/customers | 顧客管理           |
| confirm_payment_status | PUT /api/orders/:id/payment-status | 支払確定           |
| view_unshipped_orders | GET /api/orders?status=unshipped | 未発送注文一覧       |
| update_shipping_status | PUT /api/orders/:id/shipping-status | 発送状況更新         |
| create_invoice  | POST /api/invoices  | 請求書作成           |

---

## 技術的特徴

- **トランザクション処理**  
　DB更新は全てトランザクション化、エラー時は自動ロールバック
- **外部キー制約**  
　外部キー設定による整合性維持
- **状態管理**  
　設計書で定義した注文・支払・発送ステータス管理
- **エラーハンドリング**  
　在庫不足や不正入力の際は適切なエラー応答・バリデーション

---

## 今後の拡張可能性

1. 認証・認可（ユーザー管理・セキュリティ強化）
2. 決済API連携（実際のクレジット決済対応）
3. PDF生成（請求書・領収書のPDF出力）
4. メール通知（注文確認・発送連絡メール）
5. 管理画面（注文・在庫・顧客の管理UI）
6. 各種集計レポート（売上・在庫分析）

---

## 動作確認方法

1. バックエンド起動:  
　`cd backend && node server2.js`
2. フロントエンド起動:  
　`cd frontend/src && npm start`
3. ブラウザで `http://localhost:3000` にアクセス
4. 商品検索→カート追加→注文フローを実行

---

## 補足
本実装により、設計ドキュメントで定義された主要機能は全て完了し、プロトタイプから本格的な通販システムへの進化が実現しました。

---