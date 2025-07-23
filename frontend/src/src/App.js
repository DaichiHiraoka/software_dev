import React, { useEffect, useState, useRef } from 'react';
import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Badge } from "./components/ui/badge"
import { Separator } from "./components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog"
import { Label } from "./components/ui/label"
import { Textarea } from "./components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select"
import { ShoppingCart, Search, Plus, Minus, Trash2 } from "lucide-react"

// 環境変数または直接指定
const server_url = process.env.REACT_APP_API_URL || 'http://localhost:3005'

console.log('環境変数 REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('使用するサーバーURL:', server_url);

function App() {
  // State management (customer-focused)

  // Product and search functionality
  const [searchQuery, setSearchQuery] = useState("")
  const [allProducts, setAllProducts] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(true)

  // Cart and order management
  const [cart, setCart] = useState([])
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    address: "",
    contactInfo: "",
  })
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer")

  // Load all products on component mount
  useEffect(() => {
    loadAllProducts()
  }, [])

  // Load all products
  const loadAllProducts = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${server_url}/api/products`)
      const data = await response.json()
      setAllProducts(data)
      setSearchResults(data) // Initially show all products
    } catch (error) {
      console.error("Failed to load products:", error)
      setAllProducts([])
      setSearchResults([])
      alert("商品データの読み込み中にエラーが発生しました。サーバーへの接続を確認してください。")
    } finally {
      setLoading(false)
    }
  }

  // Search functionality (filter products)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(allProducts) // Show all products if search is empty
      return
    }

    const filtered = allProducts.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setSearchResults(filtered)
  }, [searchQuery, allProducts])

  const handleSearch = () => {
    // This function is now mainly for the search button, but filtering happens automatically
  }

  // Cart management
  const addToCart = (product, quantity = 1) => {
    const productId = product.productId || product.ID
    const productName = product.name || product.Name
    const productPrice = product.price || product.Price

    if (!productId || !productName || !productPrice) return

    const existingItem = cart.find((item) => item.productID === productId)
    if (existingItem) {
      setCart(
        cart.map((item) => (item.productID === productId ? { ...item, quantity: item.quantity + quantity } : item)),
      )
    } else {
      setCart([
        ...cart,
        {
          productID: productId,
          name: productName,
          price: productPrice,
          quantity: quantity,
        },
      ])
    }
  }

  const removeFromCart = (productID) => {
    setCart(cart.filter((item) => item.productID !== productID))
  }

  const updateCartQuantity = (productID, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productID)
      return
    }
    setCart(cart.map((item) => (item.productID === productID ? { ...item, quantity: quantity } : item)))
  }

  // Order processing
  const handleOrder = async () => {
    if (cart.length === 0) {
      alert("カートが空です")
      return
    }

    if (!customerInfo.name || !customerInfo.address || !customerInfo.contactInfo) {
      alert("顧客情報をすべて入力してください")
      return
    }

    const orderData = {
      customerInfo: customerInfo,
      items: cart.map((item) => ({
        productID: item.productID,
        quantity: item.quantity,
      })),
      payment: {
        method: paymentMethod,
      },
    }

    try {
      const response = await fetch(`${server_url}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      })

      const result = await response.json()

      if (response.ok) {
        alert(`注文が完了しました！注文番号: ${result.orderId}`)
        setCart([])
        setShowOrderForm(false)
        setCustomerInfo({ name: "", address: "", contactInfo: "" })
      } else {
        alert(`注文エラー: ${result.error}`)
      }
    } catch (error) {
      alert("注文処理中にエラーが発生しました")
      console.error("Order error:", error)
    }
  }


  const totalCartValue = cart.reduce((total, item) => total + item.price * item.quantity, 0)
  const totalCartItems = cart.reduce((total, item) => total + item.quantity, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header with Cart Button */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-light text-gray-900 tracking-wide">PREMIUM STORE</h1>
            <p className="text-sm text-gray-600">Curated Collection & Seamless Experience</p>
          </div>
          
          {/* Cart Button */}
          <Dialog open={showOrderForm} onOpenChange={setShowOrderForm}>
            <DialogTrigger asChild>
              <Button 
                className="relative bg-gray-900 hover:bg-gray-800 text-white p-3 rounded-full"
                size="lg"
              >
                <ShoppingCart className="h-6 w-6" />
                {totalCartItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-medium">
                    {totalCartItems > 99 ? '99+' : totalCartItems}
                  </span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white border-gray-300 max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-gray-900 text-xl font-light flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  ショッピングカート ({totalCartItems}点)
                </DialogTitle>
              </DialogHeader>
              
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">カートに商品がありません</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Cart Items */}
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {cart.map((item) => (
                      <div
                        key={item.productID}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-600 font-mono">¥{item.price.toLocaleString()}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-300 hover:bg-gray-100 bg-transparent h-8 w-8 p-0"
                            onClick={() => updateCartQuantity(item.productID, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="font-mono text-sm font-medium w-8 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-300 hover:bg-gray-100 bg-transparent h-8 w-8 p-0"
                            onClick={() => updateCartQuantity(item.productID, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-400 hover:bg-red-50 text-red-600 bg-transparent h-8 w-8 p-0"
                            onClick={() => removeFromCart(item.productID)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Separator className="bg-gray-300" />
                  
                  {/* Total */}
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xl font-light text-gray-900">合計金額</span>
                    <span className="text-2xl font-mono font-medium text-gray-900">
                      ¥{totalCartValue.toLocaleString()}
                    </span>
                  </div>
                  
                  <Separator className="bg-gray-300" />
                  
                  {/* Customer Information Form */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">お客様情報</h3>
                    <div className="grid gap-4">
                      <div>
                        <Label htmlFor="name" className="text-gray-700 font-medium">
                          お名前 *
                        </Label>
                        <Input
                          id="name"
                          className="border-gray-300 focus:border-gray-500"
                          placeholder="山田 太郎"
                          value={customerInfo.name}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="address" className="text-gray-700 font-medium">
                          お届け先住所 *
                        </Label>
                        <Textarea
                          id="address"
                          className="border-gray-300 focus:border-gray-500"
                          placeholder="〒000-0000 東京都○○区○○ 1-1-1 ○○マンション101"
                          value={customerInfo.address}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact" className="text-gray-700 font-medium">
                          連絡先 *
                        </Label>
                        <Input
                          id="contact"
                          className="border-gray-300 focus:border-gray-500"
                          placeholder="メールアドレスまたは電話番号"
                          value={customerInfo.contactInfo}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, contactInfo: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="payment" className="text-gray-700 font-medium">
                          お支払い方法 *
                        </Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                          <SelectTrigger className="border-gray-300 focus:border-gray-500">
                            <SelectValue placeholder="お支払い方法を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bank_transfer">銀行振込</SelectItem>
                            <SelectItem value="convenience_store">コンビニ決済</SelectItem>
                            <SelectItem value="cash_on_delivery">代金引換</SelectItem>
                            <SelectItem value="credit_card">クレジットカード</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowOrderForm(false)}
                      className="border-gray-300"
                    >
                      キャンセル
                    </Button>
                    <Button 
                      onClick={handleOrder} 
                      className="bg-gray-900 hover:bg-gray-800"
                      disabled={!customerInfo.name || !customerInfo.address || !customerInfo.contactInfo}
                    >
                      注文を確定する
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="container mx-auto p-6 space-y-8">
        {/* Product Catalog */}
        <Card className="bg-white border-gray-300 shadow-lg max-w-4xl mx-auto">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="flex items-center gap-3 text-gray-900 font-light text-xl">
              <Search className="h-5 w-5" />
              商品カタログ
            </CardTitle>
            <div className="text-sm text-gray-600 mt-2">
              {loading ? "商品を読み込み中..." : `${allProducts.length}点の商品を表示中`}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="flex gap-3">
              <Input
                placeholder="商品名で絞り込み検索..."
                className="border-gray-300 focus:border-gray-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button onClick={() => setSearchQuery("")} variant="outline" className="border-gray-300">
                クリア
              </Button>
            </div>

            {searchQuery && (
              <div className="text-sm text-gray-600">
                「{searchQuery}」で絞り込み中 - {searchResults.length}件の商品が見つかりました
              </div>
            )}

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-4 text-gray-600">商品を読み込み中...</p>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((item, index) => (
                  <div
                    key={item.productId || index}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-gray-900 text-lg">{item.name}</div>
                      <div className="text-sm text-gray-500 font-mono">
                        ¥{item.price?.toLocaleString()} | Stock: {item.stock} available
                      </div>
                    </div>
                    <Button
                      onClick={() => addToCart(item)}
                      disabled={!item.stock || item.stock <= 0}
                      size="sm"
                      className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300"
                    >
                      {item.stock && item.stock > 0 ? "Add to Cart" : "Out of Stock"}
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-12 font-light">
                  {searchQuery ? 
                    `「${searchQuery}」に一致する商品が見つかりませんでした。別のキーワードをお試しください。` : 
                    "商品データベースに商品が登録されていません。管理者にお問い合わせください。"
                  }
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default App;