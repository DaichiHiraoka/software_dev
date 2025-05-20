const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001; // React とデフォルトのポートが競合するので変更。

app.use(cors());
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'public/images')));

const imagesDir = path.join(__dirname, 'public/images');

// 既存DBを参照する
const db = new sqlite3.Database('./Inshokuten.sqlite3', (err) => {
  if (err) {
    console.error('データベース接続エラー:', err.message);
  } else {
    console.log('既存DBに接続成功');
  }
});

// SELECT: TestTable 全データ取得、APIエンドポイントの例（TestTableテーブルから取得）
app.get('/api/TestTable', (req, res) => {
  db.all('SELECT * FROM TestTable', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
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


app.listen(PORT, () => {
  console.log(`サーバー起動: http://localhost:${PORT}`);
});
