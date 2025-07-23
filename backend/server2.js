const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3005; // 管理者機能分離のため3005に変更

app.use(cors());
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'public/images')));

app.get('/', (req, res) => {
  res.send('backend OK');
});

const imagesDir = path.join(__dirname, 'public/images');

// 既存DBを参照する
const db = new sqlite3.Database('./Inshokuten.sqlite3', (err) => {
  if (err) {
    console.error('データベース接続エラー:', err.message);
  } else {
    console.log('既存DBに接続成功');
    initializeDatabase();
  }
});

// データベース初期化（新しいテーブル作成）
function initializeDatabase() {
  db.serialize(() => {
    // TestTable（レガシー管理用）
    db.run(`
      CREATE TABLE IF NOT EXISTS TestTable (
        ID INTEGER PRIMARY KEY,
        Name TEXT NOT NULL,
        Price REAL NOT NULL
      )
    `, (err) => {
      if (err) console.error('TestTableテーブル作成エラー:', err.message);
      else console.log('TestTableテーブル準備完了');
    });

    // 商品マスタテーブル（存在しない場合作成）
    db.run(`
      CREATE TABLE IF NOT EXISTS Products (
        ProductID INTEGER PRIMARY KEY,
        Name TEXT NOT NULL,
        Price REAL NOT NULL
      )
    `, (err) => {
      if (err) console.error('Productsテーブル作成エラー:', err.message);
      else console.log('Productsテーブル準備完了');
    });

    // 在庫テーブル（存在しない場合作成）
    db.run(`
      CREATE TABLE IF NOT EXISTS Stocks (
        ProductID INTEGER PRIMARY KEY,
        StockQuantity1 INTEGER DEFAULT 0,
        StockQuantity2 INTEGER DEFAULT 0,
        FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
      )
    `, (err) => {
      if (err) console.error('Stocksテーブル作成エラー:', err.message);
      else console.log('Stocksテーブル準備完了');
    });

    // 顧客マスタテーブル
    db.run(`
      CREATE TABLE IF NOT EXISTS Customers (
        customerID INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        contactInfo TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Customersテーブル作成エラー:', err.message);
      else console.log('Customersテーブル準備完了');
    });

    // 注文データテーブル
    db.run(`
      CREATE TABLE IF NOT EXISTS Orders (
        orderID INTEGER PRIMARY KEY AUTOINCREMENT,
        orderDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        customerID INTEGER NOT NULL,
        paymentMethod TEXT NOT NULL,
        paymentStatus INTEGER DEFAULT 0,
        shippingStatus INTEGER DEFAULT 0,
        totalAmount REAL,
        FOREIGN KEY (customerID) REFERENCES Customers(customerID)
      )
    `, (err) => {
      if (err) console.error('Ordersテーブル作成エラー:', err.message);
      else console.log('Ordersテーブル準備完了');
    });

    // 注文詳細テーブル
    db.run(`
      CREATE TABLE IF NOT EXISTS OrderItems (
        orderItemID INTEGER PRIMARY KEY AUTOINCREMENT,
        orderID INTEGER NOT NULL,
        productID INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (orderID) REFERENCES Orders(orderID),
        FOREIGN KEY (productID) REFERENCES Products(ProductID)
      )
    `, (err) => {
      if (err) console.error('OrderItemsテーブル作成エラー:', err.message);
      else console.log('OrderItemsテーブル準備完了');
    });
  });
}

// SELECT: TestTable 全データ取得、APIエンドポイントの例（TestTableテーブルから取得）
app.get('/api/TestTable', (req, res) => {
  db.all('SELECT * FROM TestTable', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      console.error('データ取得エラー:', err.message);
    } else {
      res.json(rows);
      console.error('データ取得OK:');
    }
  });
});

// 商品一覧・検索 (product_list_and_search)
app.get('/api/products', (req, res) => {
  const { q } = req.query;

  let query = `
    SELECT
      p.ProductID AS productId,
      p.Name AS name,
      p.Price AS price,
      s.StockQuantity1 AS stock,
      s.StockQuantity2 AS availableStock
    FROM
      Products p
    JOIN
      Stocks s ON p.ProductID = s.ProductID
  `;
  
  let params = [];
  
  if (q && q.trim()) {
    query += ` WHERE p.Name LIKE ?`;
    params.push(`%${q}%`);
  }
  
  query += ` ORDER BY p.ProductID ASC`;

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      console.error('商品取得エラー:', err.message);
    } else {
      res.json(rows);
      if (q) {
        console.log(`商品検索成功: "${q}" - ${rows.length}件`);
      } else {
        console.log(`全商品取得成功: ${rows.length}件`);
      }
    }
  });
});

// CREATE: Products 新しい商品を追加
app.post('/api/products', (req, res) => {
  const { id, name, price, stock } = req.body;

  if (!id || !name || !price) {
    return res.status(400).json({ error: '必須項目（ID、名前、価格）が不足しています' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Products テーブルに商品を追加
    db.run(
      'INSERT INTO Products (ProductID, Name, Price) VALUES (?, ?, ?)',
      [id, name, price],
      function (err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: '商品追加エラー: ' + err.message });
        }

        // Stocks テーブルに在庫情報を追加
        db.run(
          'INSERT INTO Stocks (ProductID, StockQuantity1, StockQuantity2) VALUES (?, ?, ?)',
          [id, stock || 100, stock || 100],
          function (stockErr) {
            if (stockErr) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: '在庫追加エラー: ' + stockErr.message });
            }

            db.run('COMMIT');
            res.json({ 
              productId: id, 
              name, 
              price, 
              stock: stock || 100,
              message: '商品が正常に追加されました'
            });
            console.log(`新規商品追加: ID=${id}, Name=${name}, Price=${price}, Stock=${stock || 100}`);
          }
        );
      }
    );
  });
});

// CREATE: TestTable 新しいデータを追加
app.post('/api/TestTable', (req, res) => {
  const { id, name, price } = req.body;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.run(
      'INSERT INTO TestTable (ID, Name, Price) VALUES (?, ?, ?)',
      [id, name, price],
      function (err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: '追加エラー: ' + err.message });
        }

        db.run('COMMIT');
        res.json({ id: this.lastID, name, price });
        console.log(`新規データ追加: ID=${id}, Name=${name}, Price=${price}`);
      }
    );
  });
});

// UPDATE: データのテキストを更新
app.put('/api/TestTable/:id', (req, res) => {
  const { id } = req.params;
  const { name, price } = req.body;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.run(
      'UPDATE TestTable SET Name = ?, Price = ? WHERE ID = ?',
      [name, price, id],
      function (err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: '更新エラー: ' + err.message });
        }

        db.run('COMMIT');
        res.json({ updated: this.changes > 0 });
      }
    );
  });
});

// DELETE: データを削除
app.delete('/api/TestTable/:id', (req, res) => {
  const { id } = req.params;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.run('DELETE FROM TestTable WHERE ID = ?', [id], function (err) {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: '削除エラー: ' + err.message });
      }

      db.run('COMMIT');
      res.json({ deleted: this.changes > 0 });
    });
  });
});

// === 注文管理機能 ===

// 顧客登録/取得 (input_customer_info)
app.post('/api/customers', (req, res) => {
  const { name, address, contactInfo } = req.body;

  if (!name || !address || !contactInfo) {
    return res.status(400).json({ error: '必要な顧客情報が不足しています' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.run(
      'INSERT INTO Customers (name, address, contactInfo) VALUES (?, ?, ?)',
      [name, address, contactInfo],
      function (err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: '顧客登録エラー: ' + err.message });
        }

        db.run('COMMIT');
        res.json({ 
          customerID: this.lastID, 
          name, 
          address, 
          contactInfo 
        });
        console.log(`顧客登録成功: ID=${this.lastID}, Name=${name}`);
      }
    );
  });
});

// 在庫確認 (check_stock)
app.get('/api/products/:id/stock', (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT 
      p.ProductID,
      p.Name,
      p.Price,
      s.StockQuantity1 AS actualStock,
      s.StockQuantity2 AS availableStock
    FROM Products p
    JOIN Stocks s ON p.ProductID = s.ProductID
    WHERE p.ProductID = ?
  `;

  db.get(query, [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      console.error('在庫確認エラー:', err.message);
    } else if (!row) {
      res.status(404).json({ error: '商品が見つかりません' });
    } else {
      res.json(row);
      console.log(`在庫確認成功: ProductID=${id}`);
    }
  });
});

// 注文作成 (register_order, confirm_order)
app.post('/api/orders', (req, res) => {
  const { customerInfo, items, payment } = req.body;

  if (!customerInfo || !items || !Array.isArray(items) || items.length === 0 || !payment) {
    return res.status(400).json({ error: '注文データが不正です' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // 1. 顧客登録
    db.run(
      'INSERT INTO Customers (name, address, contactInfo) VALUES (?, ?, ?)',
      [customerInfo.name, customerInfo.address, customerInfo.contactInfo],
      function (err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: '顧客登録エラー: ' + err.message });
        }

        const customerID = this.lastID;

        // 2. 合計金額計算と在庫確認
        let totalAmount = 0;
        let itemsProcessed = 0;
        let orderValid = true;

        items.forEach((item, index) => {
          db.get(
            'SELECT p.Price, s.StockQuantity2 FROM Products p JOIN Stocks s ON p.ProductID = s.ProductID WHERE p.ProductID = ?',
            [item.productID],
            (err, row) => {
              if (err || !row || row.StockQuantity2 < item.quantity) {
                orderValid = false;
                db.run('ROLLBACK');
                return res.status(400).json({ 
                  error: `商品ID:${item.productID} の在庫が不足しています` 
                });
              }

              totalAmount += row.Price * item.quantity;
              itemsProcessed++;

              // 全商品の確認が完了したら注文作成
              if (itemsProcessed === items.length && orderValid) {
                createOrder();
              }
            }
          );
        });

        function createOrder() {
          // 3. 注文データ作成
          db.run(
            'INSERT INTO Orders (customerID, paymentMethod, totalAmount) VALUES (?, ?, ?)',
            [customerID, payment.method, totalAmount],
            function (err) {
              if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: '注文作成エラー: ' + err.message });
              }

              const orderID = this.lastID;

              // 4. 注文詳細作成
              let itemsInserted = 0;
              items.forEach((item) => {
                db.run(
                  'INSERT INTO OrderItems (orderID, productID, quantity, price) VALUES (?, ?, ?, (SELECT Price FROM Products WHERE ProductID = ?))',
                  [orderID, item.productID, item.quantity, item.productID],
                  function (err) {
                    if (err) {
                      db.run('ROLLBACK');
                      return res.status(500).json({ error: '注文詳細作成エラー: ' + err.message });
                    }

                    itemsInserted++;
                    if (itemsInserted === items.length) {
                      db.run('COMMIT');
                      res.json({ 
                        orderId: orderID, 
                        status: 'success',
                        totalAmount: totalAmount
                      });
                      console.log(`注文作成成功: OrderID=${orderID}, Total=${totalAmount}`);
                    }
                  }
                );
              });
            }
          );
        }
      }
    );
  });
});

// === 在庫管理機能 ===

// 在庫数量照会 (query_stock_quantity)
app.get('/api/stocks', (req, res) => {
  const query = `
    SELECT 
      p.ProductID,
      p.Name,
      p.Price,
      s.StockQuantity1 AS actualStock,
      s.StockQuantity2 AS availableStock
    FROM Products p
    JOIN Stocks s ON p.ProductID = s.ProductID
    ORDER BY p.ProductID
  `;

  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      console.error('在庫照会エラー:', err.message);
    } else {
      res.json(rows);
      console.log('在庫照会成功');
    }
  });
});

// 在庫数量更新 (update_stock_quantity)
app.put('/api/products/:id/stock', (req, res) => {
  const { id } = req.params;
  const { quantity, operation } = req.body; // operation: 'add', 'subtract', 'set'

  if (!quantity || !operation) {
    return res.status(400).json({ error: '数量と操作タイプが必要です' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    let updateQuery;
    switch (operation) {
      case 'add':
        updateQuery = 'UPDATE Stocks SET StockQuantity1 = StockQuantity1 + ?, StockQuantity2 = StockQuantity2 + ? WHERE ProductID = ?';
        break;
      case 'subtract':
        updateQuery = 'UPDATE Stocks SET StockQuantity1 = StockQuantity1 - ?, StockQuantity2 = StockQuantity2 - ? WHERE ProductID = ?';
        break;
      case 'set':
        updateQuery = 'UPDATE Stocks SET StockQuantity1 = ?, StockQuantity2 = ? WHERE ProductID = ?';
        break;
      default:
        return res.status(400).json({ error: '無効な操作タイプです' });
    }

    db.run(updateQuery, [quantity, quantity, id], function (err) {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: '在庫更新エラー: ' + err.message });
      }

      if (this.changes === 0) {
        db.run('ROLLBACK');
        return res.status(404).json({ error: '商品が見つかりません' });
      }

      db.run('COMMIT');
      res.json({ 
        updated: true, 
        productID: id, 
        operation: operation, 
        quantity: quantity 
      });
      console.log(`在庫更新成功: ProductID=${id}, Operation=${operation}, Quantity=${quantity}`);
    });
  });
});

// 発送時の自動在庫減算（発送状態更新時に呼び出される）
function updateStockOnShipment(orderID, callback) {
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // 注文詳細から商品と数量を取得
    db.all(
      'SELECT productID, quantity FROM OrderItems WHERE orderID = ?',
      [orderID],
      (err, items) => {
        if (err) {
          db.run('ROLLBACK');
          return callback(err);
        }

        let itemsProcessed = 0;
        let updateSuccess = true;

        items.forEach((item) => {
          db.run(
            'UPDATE Stocks SET StockQuantity1 = StockQuantity1 - ? WHERE ProductID = ?',
            [item.quantity, item.productID],
            function (err) {
              if (err) {
                updateSuccess = false;
                db.run('ROLLBACK');
                return callback(err);
              }

              itemsProcessed++;
              if (itemsProcessed === items.length && updateSuccess) {
                db.run('COMMIT');
                callback(null);
              }
            }
          );
        });
      }
    );
  });
}

// === 顧客管理機能 ===

// 顧客情報照会 (manage_customer_info - READ)
app.get('/api/customers/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM Customers WHERE customerID = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      console.error('顧客照会エラー:', err.message);
    } else if (!row) {
      res.status(404).json({ error: '顧客が見つかりません' });
    } else {
      res.json(row);
      console.log(`顧客照会成功: CustomerID=${id}`);
    }
  });
});

// 全顧客一覧取得
app.get('/api/customers', (req, res) => {
  db.all('SELECT * FROM Customers ORDER BY customerID DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      console.error('顧客一覧取得エラー:', err.message);
    } else {
      res.json(rows);
      console.log('顧客一覧取得成功');
    }
  });
});

// 顧客情報更新 (manage_customer_info - UPDATE)
app.put('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  const { name, address, contactInfo } = req.body;

  if (!name || !address || !contactInfo) {
    return res.status(400).json({ error: '必要な顧客情報が不足しています' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.run(
      'UPDATE Customers SET name = ?, address = ?, contactInfo = ? WHERE customerID = ?',
      [name, address, contactInfo, id],
      function (err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: '顧客更新エラー: ' + err.message });
        }

        if (this.changes === 0) {
          db.run('ROLLBACK');
          return res.status(404).json({ error: '顧客が見つかりません' });
        }

        db.run('COMMIT');
        res.json({ 
          updated: true, 
          customerID: id, 
          name, 
          address, 
          contactInfo 
        });
        console.log(`顧客更新成功: CustomerID=${id}`);
      }
    );
  });
});

// 顧客削除 (manage_customer_info - DELETE)
app.delete('/api/customers/:id', (req, res) => {
  const { id } = req.params;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // 関連する注文がないか確認
    db.get('SELECT COUNT(*) as count FROM Orders WHERE customerID = ?', [id], (err, row) => {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: '顧客確認エラー: ' + err.message });
      }

      if (row.count > 0) {
        db.run('ROLLBACK');
        return res.status(400).json({ error: '注文履歴がある顧客は削除できません' });
      }

      db.run('DELETE FROM Customers WHERE customerID = ?', [id], function (err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: '顧客削除エラー: ' + err.message });
        }

        if (this.changes === 0) {
          db.run('ROLLBACK');
          return res.status(404).json({ error: '顧客が見つかりません' });
        }

        db.run('COMMIT');
        res.json({ deleted: true, customerID: id });
        console.log(`顧客削除成功: CustomerID=${id}`);
      });
    });
  });
});

// === 会計管理機能 ===

// 支払い状態確認・更新 (confirm_payment_status)
app.put('/api/orders/:id/payment-status', (req, res) => {
  const { id } = req.params;
  const { paymentStatus } = req.body; // 0: 未払い, 1: 支払済

  if (paymentStatus === undefined || (paymentStatus !== 0 && paymentStatus !== 1)) {
    return res.status(400).json({ error: '有効な支払い状態が必要です (0: 未払い, 1: 支払済)' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.run(
      'UPDATE Orders SET paymentStatus = ? WHERE orderID = ?',
      [paymentStatus, id],
      function (err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: '支払い状態更新エラー: ' + err.message });
        }

        if (this.changes === 0) {
          db.run('ROLLBACK');
          return res.status(404).json({ error: '注文が見つかりません' });
        }

        db.run('COMMIT');
        res.json({ 
          updated: true, 
          orderID: id, 
          paymentStatus: paymentStatus 
        });
        console.log(`支払い状態更新成功: OrderID=${id}, Status=${paymentStatus}`);
      }
    );
  });
});

// === 発送管理機能 ===

// 注文一覧取得 (order management)
app.get('/api/orders', (req, res) => {
  const { status } = req.query;
  
  let query = `
    SELECT 
      o.orderID as id,
      o.orderDate as createdAt,
      o.totalAmount as total,
      o.paymentMethod,
      CASE 
        WHEN o.paymentStatus = 0 THEN 'pending'
        WHEN o.paymentStatus = 1 THEN 'confirmed'
        WHEN o.paymentStatus = 2 THEN 'completed'
        ELSE 'cancelled'
      END as status,
      c.name as customerName,
      c.address as customerAddress,
      c.contactInfo as customerEmail,
      c.contactInfo as customerPhone,
      'dummy@email.com' as customerEmailFallback
    FROM Orders o
    JOIN Customers c ON o.customerID = c.customerID
  `;
  
  let params = [];
  
  if (status === 'pending') {
    query += ' WHERE o.paymentStatus = 0';
  } else if (status === 'confirmed') {
    query += ' WHERE o.paymentStatus = 1';
  } else if (status === 'completed') {
    query += ' WHERE o.paymentStatus = 2';
  } else if (status === 'cancelled') {
    query += ' WHERE o.paymentStatus = 3';
  }
  
  query += ' ORDER BY o.orderDate DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      console.error('注文一覧取得エラー:', err.message);
    } else {
      // フロントエンド期待形式に変換
      const formattedRows = rows.map(row => ({
        id: `ORD-${String(row.id).padStart(6, '0')}`,
        total: row.total || 0,
        paymentMethod: row.paymentMethod || 'credit_card',
        status: row.status,
        customerName: row.customerName || '不明な顧客',
        customerEmail: row.customerEmail || 'unknown@email.com',
        customerPhone: row.customerPhone || '000-0000-0000',
        customerAddress: row.customerAddress || '住所不明',
        createdAt: row.createdAt || new Date().toISOString(),
        items: [] // 後で商品詳細を取得
      }));
      
      res.json(formattedRows);
      console.log(`注文一覧取得成功 (filter: ${status || 'all'}) - ${formattedRows.length}件`);
    }
  });
});

// 注文詳細取得（商品情報含む）
app.get('/api/orders/:id', (req, res) => {
  const { id } = req.params;

  const orderQuery = `
    SELECT 
      o.*,
      c.name as customerName,
      c.address as customerAddress,
      c.contactInfo as customerContact
    FROM Orders o
    JOIN Customers c ON o.customerID = c.customerID
    WHERE o.orderID = ?
  `;

  const itemsQuery = `
    SELECT 
      oi.*,
      p.Name as productName
    FROM OrderItems oi
    JOIN Products p ON oi.productID = p.ProductID
    WHERE oi.orderID = ?
  `;

  db.get(orderQuery, [id], (err, order) => {
    if (err) {
      res.status(500).json({ error: err.message });
      console.error('注文詳細取得エラー:', err.message);
    } else if (!order) {
      res.status(404).json({ error: '注文が見つかりません' });
    } else {
      db.all(itemsQuery, [id], (err, items) => {
        if (err) {
          res.status(500).json({ error: err.message });
          console.error('注文商品取得エラー:', err.message);
        } else {
          res.json({ ...order, items });
          console.log(`注文詳細取得成功: OrderID=${id}`);
        }
      });
    }
  });
});

// 発送状態更新 (update_shipping_status)
app.put('/api/orders/:id/shipping-status', (req, res) => {
  const { id } = req.params;
  const { shippingStatus } = req.body; // 0: 未発送, 1: 発送準備中, 2: 発送済

  if (shippingStatus === undefined || ![0, 1, 2].includes(shippingStatus)) {
    return res.status(400).json({ error: '有効な発送状態が必要です (0: 未発送, 1: 発送準備中, 2: 発送済)' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.run(
      'UPDATE Orders SET shippingStatus = ? WHERE orderID = ?',
      [shippingStatus, id],
      function (err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: '発送状態更新エラー: ' + err.message });
        }

        if (this.changes === 0) {
          db.run('ROLLBACK');
          return res.status(404).json({ error: '注文が見つかりません' });
        }

        // 発送済に変更した場合は在庫を減算
        if (shippingStatus === 2) {
          updateStockOnShipment(id, (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: '在庫更新エラー: ' + err.message });
            }

            db.run('COMMIT');
            res.json({ 
              updated: true, 
              orderID: id, 
              shippingStatus: shippingStatus,
              stockUpdated: true
            });
            console.log(`発送状態更新・在庫減算成功: OrderID=${id}, Status=${shippingStatus}`);
          });
        } else {
          db.run('COMMIT');
          res.json({ 
            updated: true, 
            orderID: id, 
            shippingStatus: shippingStatus 
          });
          console.log(`発送状態更新成功: OrderID=${id}, Status=${shippingStatus}`);
        }
      }
    );
  });
});

// 請求書・納品書作成 (create_invoice) - 簡易実装
app.post('/api/invoices', (req, res) => {
  const { orderID, type } = req.body; // type: 'invoice' or 'receipt'

  if (!orderID || !type) {
    return res.status(400).json({ error: '注文IDと種類が必要です' });
  }

  // 実際の実装では PDF 生成などを行う
  res.json({ 
    success: true, 
    orderID: orderID, 
    documentType: type,
    message: `${type === 'invoice' ? '請求書' : '納品書'}を作成しました`,
    downloadUrl: `/api/documents/${orderID}/${type}.pdf`
  });
  console.log(`${type === 'invoice' ? '請求書' : '納品書'}作成: OrderID=${orderID}`);
});

// === 商品管理API ===

// 商品直接追加API
app.post('/api/products', (req, res) => {
  const { id, name, price, stock } = req.body;

  if (!id || !name || !price) {
    return res.status(400).json({ error: 'ID、名前、価格は必須です' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Productsテーブルに追加
    db.run(
      'INSERT OR REPLACE INTO Products (ProductID, Name, Price) VALUES (?, ?, ?)',
      [id, name, price],
      function (err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Products追加エラー: ' + err.message });
        }

        // Stocksテーブルに追加
        db.run(
          'INSERT OR REPLACE INTO Stocks (ProductID, StockQuantity1, StockQuantity2) VALUES (?, ?, ?)',
          [id, stock || 100, stock || 100],
          function (err) {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Stocks追加エラー: ' + err.message });
            }

            db.run('COMMIT');
            res.json({ 
              success: true,
              productID: id,
              name: name,
              price: price,
              stock: stock || 100
            });
            console.log(`商品直接追加成功: ID=${id}, Name=${name}`);
          }
        );
      }
    );
  });
});

// === データ初期化用API ===

// TestTableのデータをProductsとStocksにコピー（GET版も追加）
app.get('/api/migrate-data', (req, res) => {
  migrateDataFunction(res);
});

app.post('/api/migrate-data', (req, res) => {
  migrateDataFunction(res);
});

function migrateDataFunction(res) {
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // TestTableからデータを取得
    db.all('SELECT * FROM TestTable', (err, testData) => {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: 'TestTable読み取りエラー: ' + err.message });
      }

      let processedCount = 0;
      let totalCount = testData.length;

      if (totalCount === 0) {
        db.run('COMMIT');
        return res.json({ message: 'TestTableにデータがありません', migrated: 0 });
      }

      testData.forEach((item) => {
        // Productsテーブルに挿入（既存データは無視）
        db.run(
          'INSERT OR IGNORE INTO Products (ProductID, Name, Price) VALUES (?, ?, ?)',
          [item.ID, item.Name, item.Price],
          function (err) {
            if (err) {
              console.error('Products挿入エラー:', err.message);
            }

            // Stocksテーブルに挿入（既存データは無視）
            db.run(
              'INSERT OR IGNORE INTO Stocks (ProductID, StockQuantity1, StockQuantity2) VALUES (?, ?, ?)',
              [item.ID, 100, 100], // デフォルトで在庫100に設定
              function (err) {
                if (err) {
                  console.error('Stocks挿入エラー:', err.message);
                }

                processedCount++;
                if (processedCount === totalCount) {
                  db.run('COMMIT');
                  res.json({ 
                    message: 'データ移行完了', 
                    migrated: totalCount,
                    details: 'TestTableのデータをProductsとStocksテーブルにコピーしました'
                  });
                  console.log(`データ移行完了: ${totalCount}件`);
                }
              }
            );
          }
        );
      });
    });
  });
}


// multer 設定（保存先とファイル名の指定）
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imagesDir);
  },
  filename: (req, file, cb) => {
    // 一時的なファイル名で保存（元の名前などでOK）
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

app.post('/api/upload', upload.single('image'), (req, res) => {
  const id = req.body.id;

  if (!req.file) {
    return res.status(400).json({ error: 'ファイルがありません' });
  }

  const oldPath = path.join(imagesDir, req.file.filename);
  const newPath = path.join(imagesDir, `${id}.jpg`);

  try {
    //if (fs.existsSync(newPath)) {
    //  fs.unlinkSync(newPath); // 既存のファイル削除
    //}

    fs.renameSync(oldPath, newPath); // リネームしてID名に変更

    res.json({ message: '画像アップロード成功', filename: `${id}.jpg` });
  } catch (err) {
    console.error('ファイル処理エラー:', err);
    res.status(500).json({ error: 'ファイル処理失敗' });
  }
});

// === 不足しているAPIエンドポイント ===

// 支払い情報取得（会計管理用）
app.get('/api/payments', (req, res) => {
  const query = `
    SELECT 
      'PAY-' || printf('%03d', o.orderID) as id,
      'ORD-' || printf('%03d', o.orderID) as orderId,
      c.name as customerName,
      o.totalAmount as amount,
      o.paymentMethod,
      CASE 
        WHEN o.paymentStatus = 1 THEN 'completed'
        WHEN o.paymentStatus = 0 THEN 'pending'
        ELSE 'failed'
      END as status,
      o.orderDate as createdAt,
      '' as notes
    FROM Orders o
    JOIN Customers c ON o.customerID = c.customerID
    ORDER BY o.orderDate DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      console.error('支払い情報取得エラー:', err.message);
    } else {
      res.json(rows);
      console.log('支払い情報取得成功');
    }
  });
});

// 配送情報取得（発送管理用）
app.get('/api/shipments', (req, res) => {
  const query = `
    SELECT 
      'SHIP-' || printf('%03d', o.orderID) as id,
      'ORD-' || printf('%03d', o.orderID) as orderId,
      'TRK-' || printf('%09d', o.orderID) as trackingNumber,
      c.name as customerName,
      c.address as shippingAddress,
      o.totalAmount,
      CASE 
        WHEN o.shippingStatus = 0 THEN 'preparing'
        WHEN o.shippingStatus = 1 THEN 'in_transit'
        WHEN o.shippingStatus = 2 THEN 'delivered'
        ELSE 'preparing'
      END as status,
      'standard' as shippingMethod,
      'yamato' as carrier,
      'normal' as priority,
      date(o.orderDate, '+2 days') as estimatedDelivery,
      o.orderDate as createdAt,
      '' as notes
    FROM Orders o
    JOIN Customers c ON o.customerID = c.customerID
    ORDER BY o.orderDate DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      console.error('配送情報取得エラー:', err.message);
    } else {
      res.json(rows);
      console.log('配送情報取得成功');
    }
  });
});

// 統計情報取得（管理者用）
app.get('/api/stats', (req, res) => {
  db.serialize(() => {
    let stats = {};
    
    // 商品数
    db.get('SELECT COUNT(*) as count FROM Products', [], (err, result) => {
      if (!err) stats.totalProducts = result.count;
    });
    
    // 注文数
    db.get('SELECT COUNT(*) as count FROM Orders', [], (err, result) => {
      if (!err) stats.totalOrders = result.count;
    });
    
    // 売上合計
    db.get('SELECT SUM(totalAmount) as total FROM Orders WHERE paymentStatus = 1', [], (err, result) => {
      if (!err) stats.totalRevenue = result.total || 0;
    });
    
    // TestTable商品数（レガシー）
    db.get('SELECT COUNT(*) as count FROM TestTable', [], (err, result) => {
      if (!err) {
        stats.totalProducts = (stats.totalProducts || 0) + result.count;
        stats.activeUsers = Math.floor(Math.random() * 100) + 50; // 簡易的な値
        
        res.json(stats);
        console.log('統計情報取得成功:', stats);
      } else {
        res.json({
          totalProducts: 0,
          totalOrders: 0,
          totalRevenue: 0,
          activeUsers: 0
        });
      }
    });
  });
});


app.listen(PORT, () => {
  console.log(`サーバー起動: http://localhost:${PORT}`);
});
