# ローカル動作テスト用 REST API 一覧

## 📋 API テスト チェックリスト

### 🔧 基本機能
- [x] 1. サーバー動作確認 (`GET /`)
- [ ] 2. 画像配信 (`GET /images/{filename}`)

### 📦 TestTable操作 (開発用)
- [x] 3. 全データ取得 (`GET /api/TestTable`)
- [x] 4. データ追加 (`POST /api/TestTable`)
- [x] 5. データ更新 (`PUT /api/TestTable/{id}`)
- [x] 6. データ削除 (`DELETE /api/TestTable/{id}`)

### 🛍️ 商品管理
- [ ] 7. 商品検索 (`GET /api/products?q={query}`)
- [ ] 8. 商品追加 (`POST /api/products`)
- [ ] 9. 商品在庫確認 (`GET /api/products/{id}/stock`)
- [ ] 10. 在庫一覧 (`GET /api/stocks`)
- [ ] 11. 在庫更新 (`PUT /api/products/{id}/stock`)

### 👥 顧客管理
- [ ] 12. 顧客登録 (`POST /api/customers`)
- [ ] 13. 顧客一覧 (`GET /api/customers`)
- [ ] 14. 顧客詳細 (`GET /api/customers/{id}`)
- [ ] 15. 顧客更新 (`PUT /api/customers/{id}`)
- [ ] 16. 顧客削除 (`DELETE /api/customers/{id}`)

### 🛒 注文管理
- [ ] 17. 注文作成 (`POST /api/orders`)
- [ ] 18. 注文一覧 (`GET /api/orders`)
- [ ] 19. 注文詳細 (`GET /api/orders/{id}`)
- [ ] 20. 支払い状態更新 (`PUT /api/orders/{id}/payment-status`)
- [ ] 21. 発送状態更新 (`PUT /api/orders/{id}/shipping-status`)

### 📄 書類管理
- [ ] 22. 請求書・納品書作成 (`POST /api/invoices`)

### 📁 ファイル管理
- [ ] 23. 画像アップロード (`POST /api/upload`)

### 🔄 データ管理
- [ ] 24. データ移行 (`GET /api/migrate-data`)

---

## 基本情報
### ベースURL: `http://localhost:3001`
### サーバー起動: `cd backend && node server2.js`

## 🔧 基本機能

### 1. サーバー動作確認 
```

GET /

```


### 2. 画像配信
```

GET /images/{filename}

```



## 📦 TestTable操作 (開発用)


### 3. 全データ取得
```

GET /api/TestTable

```



### 4. データ追加
```

POST /api/TestTable

Body: { "id": number, "name": string, "price": number }

```



### 5. データ更新
```

PUT /api/TestTable/{id}

Body: { "name": string, "price": number }

```



### 6. データ削除
```

DELETE /api/TestTable/{id}

```



## 🛍️ 商品管理


### 7. 商品検索
```

GET /api/products?q={query}

```


### 8. 商品追加
```

POST /api/products

Body: { "id": number, "name": string, "price": number, "stock": number }

```


### 9. 商品在庫確認
```

GET /api/products/{id}/stock

```


### 10. 在庫一覧
```

GET /api/stocks

```


### 11. 在庫更新
```

PUT /api/products/{id}/stock

Body: { "quantity": number, "operation": "add"|"subtract"|"set" }

```


## 👥 顧客管理


### 12. 顧客登録
```

POST /api/customers

Body: { "name": string, "address": string, "contactInfo": string }

```


### 13. 顧客一覧
```

GET /api/customers

```


### 14. 顧客詳細
```

GET /api/customers/{id}

```


### 15. 顧客更新
```

PUT /api/customers/{id}

Body: { "name": string, "address": string, "contactInfo": string }

```


### 16. 顧客削除
```

DELETE /api/customers/{id}

```


## 🛒 注文管理


### 17. 注文作成
```

POST /api/orders

Body: {

"customerInfo": { "name": string, "address": string, "contactInfo": string },

"items": [{ "productID": number, "quantity": number }],

"payment": { "method": string }

}

```


### 18. 注文一覧
```

GET /api/orders

GET /api/orders?status=unshipped

GET /api/orders?status=shipped

GET /api/orders?status=preparing

```


### 19. 注文詳細
```

GET /api/orders/{id}

```


### 20. 支払い状態更新
```

PUT /api/orders/{id}/payment-status

Body: { "paymentStatus": 0|1 }

```


### 21. 発送状態更新
```

PUT /api/orders/{id}/shipping-status

Body: { "shippingStatus": 0|1|2 }

```


## 📄 書類管理


### 22. 請求書・納品書作成
```

POST /api/invoices

Body: { "orderID": number, "type": "invoice"|"receipt" }

```



## 📁 ファイル管理


### 23. 画像アップロード
```

POST /api/upload

Form-data: { "image": file, "id": string }

```



## 🔄 データ管理


### 24. データ移行
```

GET /api/migrate-data

POST /api/migrate-data

```


## テスト手順:

``` bash
cd backend && node server2.js
```
* ブラウザで `http://localhost:3001` にアクセス
* 各APIをPostmanやcurlでテスト