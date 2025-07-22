# 画像ファイル配信機能 (Image File Streaming)

## 概要

通信販売システムにおける画像ファイル配信機能の詳細説明書です。商品画像やプレースホルダー画像の効率的な配信を行います。

## 機能仕様

### エンドポイント
```
GET /images/{filename}
```

### 実装場所
- **ファイル**: `backend/server2.js`
- **実装行**: 13行目
- **設定**: Express.js の静的ファイル配信機能を使用

### 実装コード
```javascript
app.use('/images', express.static(path.join(__dirname, 'public/images')));
```

## ディレクトリ構造

```
backend/
├── server2.js
├── public/
│   └── images/           # 画像配信ディレクトリ
│       ├── 1.jpg         # 商品ID:1の画像
│       ├── 2.jpg         # 商品ID:2の画像
│       ├── 3.jpg         # 商品ID:3の画像
│       ├── 4.jpg         # 商品ID:4の画像
│       ├── 5.jpg         # 商品ID:5の画像
│       ├── 6.jpg         # 商品ID:6の画像
│       └── placeholder.jpg # 画像がない場合のプレースホルダー
```

## 画像ファイル命名規則

### 商品画像
- **形式**: `{商品ID}.jpg`
- **例**: 
  - 商品ID 1 → `1.jpg`
  - 商品ID 10 → `10.jpg`
  - 商品ID 100 → `100.jpg`

### プレースホルダー画像
- **ファイル名**: `placeholder.jpg`
- **用途**: 商品画像が存在しない場合の代替画像

## 技術仕様

### サポートファイル形式
- **JPEG**: `.jpg`, `.jpeg`
- **PNG**: `.png`
- **GIF**: `.gif`
- **WebP**: `.webp` (ブラウザサポートによる)

### レスポンス仕様
- **Content-Type**: ファイル拡張子に基づく自動設定
  - `.jpg` → `image/jpeg`
  - `.png` → `image/png`
  - `.gif` → `image/gif`
- **Cache-Control**: Express.js のデフォルト設定
- **ETag**: 自動生成による効率的なキャッシュ

### パフォーマンス特性
- **静的ファイル配信**: Express.js の最適化済み配信
- **ストリーミング**: 大容量画像の効率的な配信
- **キャッシュ**: ブラウザキャッシュとETags対応

## API使用例

### 正常系
```bash
# 商品ID:1の画像取得
GET http://localhost:3001/images/1.jpg

# プレースホルダー画像取得
GET http://localhost:3001/images/placeholder.jpg
```

### レスポンス例
```http
HTTP/1.1 200 OK
Content-Type: image/jpeg
Content-Length: 45127
ETag: "afe8-187b2d1a2c0"
Cache-Control: public, max-age=0
Last-Modified: Mon, 15 Jan 2024 12:00:00 GMT

[画像バイナリデータ]
```

## エラーハンドリング

### 404 Not Found
```http
GET /images/nonexistent.jpg

HTTP/1.1 404 Not Found
Content-Type: text/html
```

### セキュリティ対策
- **パストラバーサル防止**: `../` による上位ディレクトリアクセス制限
- **ファイル拡張子制限**: 画像ファイルのみ配信
- **ディレクトリリスティング無効**: ディレクトリ内容の一覧表示防止

## フロントエンド連携

### React での画像表示
```javascript
// 商品画像の表示
const ProductImage = ({ productId }) => {
  const imageUrl = `${process.env.REACT_APP_API_URL}/images/${productId}.jpg`;
  const placeholderUrl = `${process.env.REACT_APP_API_URL}/images/placeholder.jpg`;
  
  return (
    <img 
      src={imageUrl}
      onError={(e) => { e.target.src = placeholderUrl; }}
      alt={`商品${productId}`}
    />
  );
};
```

### フォールバック機能
```javascript
// 画像読み込みエラー時のフォールバック
const handleImageError = (event) => {
  event.target.src = '/images/placeholder.jpg';
};
```

## 画像アップロード機能との連携

### アップロード処理
```javascript
// POST /api/upload での画像アップロード
app.post('/api/upload', upload.single('image'), (req, res) => {
  const id = req.body.id;
  const oldPath = path.join(imagesDir, req.file.filename);
  const newPath = path.join(imagesDir, `${id}.jpg`);
  
  fs.renameSync(oldPath, newPath); // ID名にリネーム
  res.json({ message: '画像アップロード成功', filename: `${id}.jpg` });
});
```

### ファイル管理フロー
1. **アップロード**: `/api/upload` で画像をアップロード
2. **リネーム**: 商品IDに基づいてファイル名を変更
3. **配信**: `/images/{id}.jpg` で配信開始

## 運用考慮事項

### ディスク容量管理
- **画像サイズ制限**: アップロード時のファイルサイズ制限
- **定期クリーンアップ**: 不要な画像ファイルの削除
- **容量監視**: ディスク使用量の監視

### バックアップ
- **画像ファイルバックアップ**: 定期的な画像ディレクトリのバックアップ
- **復旧手順**: バックアップからの復旧手順

### パフォーマンス最適化
- **画像最適化**: ファイルサイズの最適化
- **CDN導入**: 大規模運用時のCDN活用
- **キャッシュ戦略**: ブラウザキャッシュとサーバーキャッシュ

## セキュリティ考慮事項

### アクセス制御
```javascript
// セキュリティ強化例（必要に応じて実装）
app.use('/images', (req, res, next) => {
  // ファイル拡張子チェック
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
  const ext = path.extname(req.path).toLowerCase();
  
  if (!allowedExtensions.includes(ext)) {
    return res.status(403).send('Forbidden file type');
  }
  
  // パストラバーサルチェック
  if (req.path.includes('..')) {
    return res.status(403).send('Invalid path');
  }
  
  next();
});
```

### ファイル検証
- **ファイル形式検証**: アップロード時のファイル形式チェック
- **ウイルススキャン**: セキュリティスキャン（本番環境）
- **ファイルサイズ制限**: 大容量ファイルの制限

## トラブルシューティング

### よくある問題

#### 1. 画像が表示されない
**原因**: 
- ファイルが存在しない
- ファイル権限の問題
- サーバーが起動していない

**解決方法**:
```bash
# ファイル存在確認
ls -la backend/public/images/

# 権限確認
chmod 644 backend/public/images/*.jpg

# サーバー起動確認
curl -I http://localhost:3001/images/1.jpg
```

#### 2. 404エラーが発生
**原因**: 
- ファイルパスの間違い
- ディレクトリ構造の問題

**解決方法**:
- ファイルパスの確認
- ディレクトリ権限の確認

#### 3. 画像の読み込みが遅い
**原因**: 
- ファイルサイズが大きい
- ネットワークの問題

**解決方法**:
- 画像の最適化
- キャッシュ設定の確認

## テスト項目

### 機能テスト
- [ ] 存在する画像ファイルの正常配信
- [ ] 存在しない画像ファイルの404エラー
- [ ] 異なる拡張子のファイル配信
- [ ] プレースホルダー画像の配信

### セキュリティテスト
- [ ] パストラバーサル攻撃の防止
- [ ] 不正なファイル拡張子のアクセス制限
- [ ] ディレクトリリスティングの無効化

### パフォーマンステスト
- [ ] 大容量画像の配信速度
- [ ] 同時アクセス時の応答速度
- [ ] キャッシュ機能の動作確認

## 今後の拡張予定

### 機能拡張
- **画像リサイズ**: 動的な画像リサイズ機能
- **フォーマット変換**: WebP等への自動変換
- **圧縮機能**: 画像圧縮による高速化

### インフラ強化
- **CDN統合**: CloudFront等のCDN活用
- **ストレージ分離**: S3等の外部ストレージ活用
- **負荷分散**: 複数サーバーでの画像配信

---

**最終更新**: 2024年1月15日  
**作成者**: 開発チーム  
**レビュー**: プロジェクト責任者