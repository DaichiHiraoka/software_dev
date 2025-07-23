# 顧客向けフロントエンド構成解説書 (Port 3000)

**システム名**：PREMIUM STORE  
**アクセスURL**：http://localhost:3000  
**技術スタック**：React 19.1.0 + Tailwind CSS + shadcn/ui  
**最終更新**：2024-01-15

## 📋 システム概要

PREMIUM STOREは、プレミアムな商品を扱うEコマースサイトとして設計された顧客向けWebアプリケーションです。モダンなReact技術とエレガントなUIデザインを組み合わせ、シームレスなショッピング体験を提供します。

## 🎨 デザインコンセプト

### ビジュアルテーマ
- **コンセプト**: "Curated Collection & Seamless Experience"
- **カラーパレット**: グレースケール中心（#f9fafb～#111827）
- **タイポグラフィ**: ライトフォントによる洗練されたミニマルデザイン
- **UI原則**: クリーンで直感的なインターフェース

### レスポンシブデザイン
- **デスクトップファースト設計**
- **Tailwind CSSによる適応的レイアウト**
- **グリッドシステムの活用** (lg:grid-cols-2)

## 🏗️ 画面構成・コンポーネント解説

### 1. **ヘッダーセクション**
```jsx
<div className="text-center py-12">
  <h1 className="text-5xl font-light text-gray-900 mb-4 tracking-wide">
    PREMIUM STORE
  </h1>
  <div className="w-24 h-0.5 bg-gray-900 mx-auto mb-4"></div>
  <p className="text-gray-600 text-lg font-light">
    Curated Collection & Seamless Experience
  </p>
</div>
```

**特徴**:
- **大型タイトル**: 5xlサイズでブランド感を演出
- **装飾ライン**: 24pxの細いアクセントライン
- **サブタイトル**: ブランドコンセプトを表現

### 2. **ショッピングカート** (条件表示)
```jsx
{cart.length > 0 && (
  <Card className="border-gray-300 bg-white shadow-xl">
    <CardHeader className="bg-gray-900 text-white">
      <CardTitle className="flex items-center gap-3 text-xl font-light">
        <ShoppingCart className="h-6 w-6" />
        Shopping Cart ({cart.length} items)
      </CardTitle>
    </CardHeader>
```

**機能**:
- **条件表示**: カートに商品がある場合のみ表示
- **アイテム数表示**: リアルタイムでカート内商品数を更新
- **価格計算**: 自動的な小計・合計金額計算
- **数量調整**: ±ボタンでの直感的な数量変更

#### カートアイテム詳細
```jsx
<div className="flex items-center gap-4">
  <span className="font-medium text-gray-900">{item.name}</span>
  <Badge variant="secondary" className="bg-gray-200 text-gray-800 font-mono">
    ¥{item.price.toLocaleString()}
  </Badge>
</div>
```

- **価格表示**: font-monoによる数字の統一感
- **バッジUI**: 価格の視認性向上
- **数量コントロール**: Plus/Minusアイコンボタン

### 3. **注文フォーム** (ダイアログモーダル)
```jsx
<Dialog open={showOrderForm} onOpenChange={setShowOrderForm}>
  <DialogContent className="max-w-md bg-white border-gray-300">
    <DialogHeader>
      <DialogTitle className="text-gray-900 text-xl font-light">
        Order Information
      </DialogTitle>
    </DialogHeader>
```

**フォーム項目**:
1. **氏名入力**: 必須項目、フルネーム
2. **住所入力**: テキストエリアで詳細住所
3. **連絡先**: 電話番号またはメールアドレス
4. **支払い方法選択**:
   - Bank Transfer (銀行振込)
   - Convenience Store (コンビニ決済)
   - Cash on Delivery (代金引換)
   - Credit Card (クレジットカード)

#### 注文サマリー
```jsx
<div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
  <h4 className="font-medium mb-3 text-gray-900">Order Summary</h4>
  {cart.map((item) => (
    <div className="flex justify-between text-sm text-gray-700 mb-1">
      <span>{item.name} × {item.quantity}</span>
      <span className="font-mono">¥{(item.price * item.quantity).toLocaleString()}</span>
    </div>
  ))}
  <div className="flex justify-between font-medium text-gray-900">
    <span>Total Amount</span>
    <span className="font-mono">¥{totalCartValue.toLocaleString()}</span>
  </div>
</div>
```

### 4. **商品検索セクション**
```jsx
<Card className="bg-white border-gray-300 shadow-lg">
  <CardHeader className="bg-gray-50 border-b border-gray-200">
    <CardTitle className="flex items-center gap-3 text-gray-900 font-light text-xl">
      <Search className="h-5 w-5" />
      Product Search
    </CardTitle>
  </CardHeader>
```

**検索機能**:
- **リアルタイム検索**: Enter キーでの即座検索
- **検索結果表示**: カード形式での商品一覧
- **在庫状況表示**: "Out of Stock" バッジ
- **カート追加**: "Add to Cart" ボタン

#### 商品検索結果
```jsx
<div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
  <div>
    <div className="font-medium text-gray-900">{item.name}</div>
    <div className="text-sm text-gray-600">Stock: {item.stock}</div>
  </div>
  <div className="flex items-center gap-3">
    <Badge className="bg-gray-800 text-white font-mono">
      ¥{item.price.toLocaleString()}
    </Badge>
    <Button 
      size="sm" 
      className="bg-gray-900 hover:bg-gray-800"
      onClick={() => addToCart(item)}
    >
      Add to Cart
    </Button>
  </div>
</div>
```

### 5. **商品データベース管理** (管理者向け)
```jsx
<Card className="bg-white border-gray-300 shadow-lg">
  <CardHeader className="bg-gray-50 border-b border-gray-200">
    <CardTitle className="text-gray-900 font-light text-xl">
      Product Database Management
    </CardTitle>
  </CardHeader>
```

**管理機能**:
- **商品一覧表示**: テーブル形式での既存商品表示
- **インライン編集**: テーブル内での直接編集
- **画像管理**: 商品画像のアップロード・表示
- **CRUD操作**: 作成・読取・更新・削除機能

#### 新商品追加フォーム
```jsx
<div className="grid md:grid-cols-4 gap-4 items-end">
  <div>
    <Label htmlFor="new-id" className="text-gray-700 font-medium">ID</Label>
    <Input className="border-gray-300 focus:border-gray-500" />
  </div>
  <div>
    <Label htmlFor="new-name" className="text-gray-700 font-medium">Name</Label>
    <Input className="border-gray-300 focus:border-gray-500" />
  </div>
  <div>
    <Label htmlFor="new-price" className="text-gray-700 font-medium">Price</Label>
    <Input className="border-gray-300 focus:border-gray-500" />
  </div>
  <div>
    <Label htmlFor="image-upload" className="text-gray-700 font-medium">Image</Label>
    <Input type="file" accept="image/*" />
  </div>
</div>
```

### 6. **商品追加フォーム** (プレミアム商品用)
```jsx
<Card className="bg-white border-gray-300 shadow-lg">
  <CardHeader className="bg-gray-50 border-b border-gray-200">
    <CardTitle className="text-gray-900 font-light text-xl">
      Add Premium Product
    </CardTitle>
  </CardHeader>
```

**特徴**:
- **独立したプレミアム商品データベース**
- **在庫管理機能**: 初期在庫数設定
- **統合API**: `/api/products` エンドポイント連携

## 🔧 技術実装詳細

### State Management
```javascript
// 基本データ管理
const [data, setData] = useState([])
const [searchResults, setSearchResults] = useState([])

// カート機能
const [cart, setCart] = useState([])
const [showOrderForm, setShowOrderForm] = useState(false)

// 顧客情報
const [customerInfo, setCustomerInfo] = useState({
  name: "",
  address: "",
  contactInfo: "",
})

// 支払い方法
const [paymentMethod, setPaymentMethod] = useState("bank_transfer")
```

### API連携
```javascript
// バックエンドURL設定
const server_url = process.env.REACT_APP_API_URL || 'http://localhost:3004'

// 商品検索API
const response = await fetch(`${server_url}/api/products?q=${searchQuery}`)

// 注文送信API
const response = await fetch(`${server_url}/api/orders`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(orderData),
})
```

### エラーハンドリング・フォールバック
```javascript
try {
  const response = await fetch(`${server_url}/api/products?q=${searchQuery}`)
  const data = await response.json()
  setSearchResults(data)
} catch (error) {
  console.error("Search failed:", error)
  // モック検索結果を使用
  const mockResults = [
    { productId: 999, name: "エレガントペン", price: 8500, stock: 15 },
    { productId: 998, name: "レザーノート", price: 3200, stock: 8 },
    { productId: 997, name: "デザイナーマグ", price: 2100, stock: 22 }
  ]
  setSearchResults(mockResults)
}
```

## 🎯 ユーザーエクスペリエンス (UX)

### ユーザージャーニー

#### 1. **商品発見フェーズ**
```
商品検索 → 検索結果表示 → 商品詳細確認 → カートに追加
```

#### 2. **購入検討フェーズ**
```
カート内容確認 → 数量調整 → 価格確認 → 購入決定
```

#### 3. **注文完了フェーズ**
```
顧客情報入力 → 支払い方法選択 → 注文内容最終確認 → 注文送信
```

### UXの工夫点

#### インタラクション設計
- **即座フィードバック**: ボタンクリック時のホバーエフェクト
- **視覚的階層**: カードコンポーネントによる情報整理
- **一貫性**: 全体を通じたデザインシステムの統一

#### アクセシビリティ
- **キーボードナビゲーション**: Enter キーでの検索実行
- **セマンティックHTML**: 適切なaria-labelの使用
- **カラーコントラスト**: WCAGガイドライン準拠

## 🚀 パフォーマンス最適化

### コンポーネント最適化
```javascript
// useEffect による効率的なデータフェッチ
useEffect(() => {
  fetchData()
}, [])

// 条件付きレンダリングによる不要な処理の削減
{cart.length > 0 && (
  <ShoppingCart />
)}
```

### 画像最適化
- **lazy loading**: 必要時のみ画像読み込み
- **placeholder画像**: 読み込み失敗時のフォールバック
- **最適化されたサイズ**: 表示サイズに応じた画像圧縮

## 📱 モバイル対応

### レスポンシブブレークポイント
```css
/* Tailwind CSS ブレークポイント */
sm: 640px    /* スマートフォン */
md: 768px    /* タブレット */
lg: 1024px   /* デスクトップ */
xl: 1280px   /* 大型デスクトップ */
```

### モバイル特有の最適化
- **タッチフレンドリー**: 44px以上のタップターゲット
- **スワイプジェスチャー**: カルーセル・リスト操作
- **縦画面レイアウト**: 単一カラム設計

## 🔒 セキュリティ機能

### データ検証
```javascript
// 入力値検証
if (!customerInfo.name || !customerInfo.address || !customerInfo.contactInfo) {
  alert("必須項目をすべて入力してください")
  return
}

// XSS対策
const sanitizedInput = DOMPurify.sanitize(userInput)
```

### API通信セキュリティ
- **HTTPS通信**: 本番環境での暗号化通信
- **CSRFトークン**: Cross-Site Request Forgery対策
- **入力値サニタイゼーション**: 悪意のある入力の無害化

## 📊 品質保証・テスト

### テスト戦略
```javascript
// ユニットテスト（推奨実装）
describe('Cart functionality', () => {
  test('should add item to cart', () => {
    const item = { productId: 1, name: 'Test Product', price: 1000 }
    addToCart(item)
    expect(cart).toContain(item)
  })
})

// インテグレーションテスト
test('should complete order flow', async () => {
  // 検索 → カート追加 → 注文完了までの流れをテスト
})
```

### エラー監視
- **コンソールエラー**: 開発者ツールでの詳細ログ
- **ユーザーフィードバック**: alert によるエラー通知
- **graceful degradation**: API 障害時のモックデータ使用

## 🚀 今後の拡張可能性

### 機能拡張候補
1. **ユーザーアカウント機能**: 会員登録・ログイン
2. **商品レビューシステム**: 評価・コメント機能
3. **お気に入り機能**: ウィッシュリスト
4. **リアルタイム在庫表示**: WebSocket連携
5. **推奨商品機能**: AI による商品レコメンド

### 技術スタック拡張
- **状態管理**: Redux Toolkit 導入
- **PWA化**: オフライン対応・アプリインストール
- **国際化**: React i18n による多言語対応
- **アニメーション**: Framer Motion 導入

---

**PREMIUM STORE Frontend** - 洗練されたユーザーエクスペリエンスによる高品質なEコマースプラットフォーム

**開発チーム**: frontend-dev@company.com  
**最終更新**: 2024-01-15  
**バージョン**: 1.0