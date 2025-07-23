"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ShoppingCart, Search, Plus, Minus, Trash2, Edit, Upload, Package } from "lucide-react"

// 環境変数または直接指定
const server_url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

interface Product {
  ID?: number
  productId?: number
  Name?: string
  name?: string
  Price?: number
  price?: number
  stock?: number
}

interface CartItem {
  productID: number
  name: string
  price: number
  quantity: number
}

interface CustomerInfo {
  name: string
  address: string
  contactInfo: string
}

export default function EcommerceSystem() {
  // State management
  const [data, setData] = useState<Product[]>([])
  const [newItem, setNewItem] = useState({ id: "", name: "", price: "" })
  const [editedItems, setEditedItems] = useState<Record<number, { name: string; price: string }>>({})
  const [imageFile, setImageFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Search functionality
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Product[]>([])

  // Cart and order management
  const [cart, setCart] = useState<CartItem[]>([])
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    address: "",
    contactInfo: "",
  })
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer")

  // New product form
  const [newProduct, setNewProduct] = useState({ id: "", name: "", price: "", stock: "" })

  // Data fetching
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch(`${server_url}/api/TestTable`)
      const data = await response.json()
      setData(data)
      const initialEdits: Record<number, { name: string; price: string }> = {}
      data.forEach((item: Product) => {
        if (item.ID) {
          initialEdits[item.ID] = {
            name: item.Name || "",
            price: item.Price != null ? String(item.Price) : "",
          }
        }
      })
      setEditedItems(initialEdits)
    } catch (error) {
      console.error("Failed to fetch data:", error)
      // モックデータを使用
      const mockData = [
        { ID: 1, Name: "プレミアムコーヒー", Price: 2800 },
        { ID: 2, Name: "オーガニックティー", Price: 1500 },
        { ID: 3, Name: "アートブック", Price: 4200 },
        { ID: 4, Name: "ハンドクラフト陶器", Price: 3600 },
        { ID: 5, Name: "ミニマルウォッチ", Price: 12000 },
      ]
      setData(mockData)
      const initialEdits: Record<number, { name: string; price: string }> = {}
      mockData.forEach((item) => {
        initialEdits[item.ID] = {
          name: item.Name || "",
          price: item.Price != null ? String(item.Price) : "",
        }
      })
      setEditedItems(initialEdits)
    }
  }

  // Search functionality
  const handleSearch = async () => {
    if (!searchQuery) {
      setSearchResults([])
      return
    }

    try {
      const response = await fetch(`${server_url}/api/products?q=${searchQuery}`)
      const data = await response.json()
      setSearchResults(data)
    } catch (error) {
      console.error("Search failed:", error)
      // モック検索結果
      const mockResults = [
        { productId: 101, name: "エレガントペン", price: 8500, stock: 15 },
        { productId: 102, name: "レザーノート", price: 3200, stock: 8 },
        { productId: 103, name: "デザイナーマグ", price: 2100, stock: 22 },
      ].filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
      setSearchResults(mockResults)
    }
  }

  // Cart management
  const addToCart = (product: Product, quantity = 1) => {
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

  const removeFromCart = (productID: number) => {
    setCart(cart.filter((item) => item.productID !== productID))
  }

  const updateCartQuantity = (productID: number, quantity: number) => {
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

  // Product management
  const addProduct = async () => {
    if (!newProduct.id || !newProduct.name || !newProduct.price) {
      alert("ID、商品名、価格は必須です")
      return
    }

    try {
      const response = await fetch(`${server_url}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: Number.parseInt(newProduct.id),
          name: newProduct.name,
          price: Number.parseFloat(newProduct.price),
          stock: Number.parseInt(newProduct.stock) || 100,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        alert("商品追加成功！")
        setNewProduct({ id: "", name: "", price: "", stock: "" })
      } else {
        alert(`商品追加エラー: ${result.error}`)
      }
    } catch (error) {
      alert("商品追加エラー: " + error)
    }
  }

  const handleAdd = async () => {
    const currentID = newItem.id

    try {
      await fetch(`${server_url}/api/TestTable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: Number(newItem.id),
          name: newItem.name,
          price: Number(newItem.price),
        }),
      })

      setNewItem({ id: "", name: "", price: "" })

      if (imageFile) {
        const formData = new FormData()
        formData.append("image", imageFile)
        formData.append("id", currentID)
        await fetch(`${server_url}/api/upload`, {
          method: "POST",
          body: formData,
        })
      }

      await fetchData()
      setImageFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Failed to add product:", error)
    }
  }

  const handleUpdate = async (id: number) => {
    try {
      await fetch(`${server_url}/api/TestTable/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editedItems[id].name,
          price: Number(editedItems[id].price),
        }),
      })
      fetchData()
    } catch (error) {
      console.error("Failed to update product:", error)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await fetch(`${server_url}/api/TestTable/${id}`, {
        method: "DELETE",
      })
      fetchData()
    } catch (error) {
      console.error("Failed to delete product:", error)
    }
  }

  const migrateData = async () => {
    try {
      const response = await fetch(`${server_url}/api/migrate-data`, {
        method: "GET",
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      alert(`${result.message} (${result.migrated || 0}件)`)
    } catch (error) {
      console.error("詳細エラー:", error)
      alert("データ移行エラー: " + error)
    }
  }

  const totalCartValue = cart.reduce((total, item) => total + item.price * item.quantity, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto p-6 space-y-8">
        <div className="text-center py-12">
          <h1 className="text-5xl font-light text-gray-900 mb-4 tracking-wide">PREMIUM STORE</h1>
          <div className="w-24 h-0.5 bg-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-light">Curated Collection & Seamless Experience</p>
        </div>

        {/* Shopping Cart */}
        {cart.length > 0 && (
          <Card className="border-gray-300 bg-white shadow-xl">
            <CardHeader className="bg-gray-900 text-white">
              <CardTitle className="flex items-center gap-3 text-xl font-light">
                <ShoppingCart className="h-6 w-6" />
                Shopping Cart ({cart.length} items)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              {cart.map((item) => (
                <div
                  key={item.productID}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-gray-900">{item.name}</span>
                    <Badge variant="secondary" className="bg-gray-200 text-gray-800 font-mono">
                      ¥{item.price.toLocaleString()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-300 hover:bg-gray-100 bg-transparent"
                      onClick={() => updateCartQuantity(item.productID, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-mono text-gray-900">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-300 hover:bg-gray-100 bg-transparent"
                      onClick={() => updateCartQuantity(item.productID, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <span className="ml-4 font-mono text-gray-900 min-w-[100px] text-right">
                      ¥{(item.price * item.quantity).toLocaleString()}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-400 hover:bg-gray-100 text-gray-700 bg-transparent"
                      onClick={() => removeFromCart(item.productID)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Separator className="bg-gray-300" />
              <div className="flex justify-between items-center pt-4">
                <span className="text-2xl font-light text-gray-900">
                  Total: <span className="font-mono">¥{totalCartValue.toLocaleString()}</span>
                </span>
                <Dialog open={showOrderForm} onOpenChange={setShowOrderForm}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3">
                      Proceed to Checkout
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md bg-white border-gray-300">
                    <DialogHeader>
                      <DialogTitle className="text-gray-900 text-xl font-light">Order Information</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name" className="text-gray-700 font-medium">
                          Full Name
                        </Label>
                        <Input
                          id="name"
                          className="border-gray-300 focus:border-gray-500"
                          value={customerInfo.name}
                          onChange={(e) => setCustomerInfo((prev) => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="address" className="text-gray-700 font-medium">
                          Address
                        </Label>
                        <Textarea
                          id="address"
                          className="border-gray-300 focus:border-gray-500"
                          value={customerInfo.address}
                          onChange={(e) => setCustomerInfo((prev) => ({ ...prev, address: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact" className="text-gray-700 font-medium">
                          Contact Information
                        </Label>
                        <Input
                          id="contact"
                          className="border-gray-300 focus:border-gray-500"
                          value={customerInfo.contactInfo}
                          onChange={(e) => setCustomerInfo((prev) => ({ ...prev, contactInfo: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="payment" className="text-gray-700 font-medium">
                          Payment Method
                        </Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                          <SelectTrigger className="border-gray-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-gray-300">
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="convenience_store">Convenience Store</SelectItem>
                            <SelectItem value="cash_on_delivery">Cash on Delivery</SelectItem>
                            <SelectItem value="credit_card">Credit Card</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="font-medium mb-3 text-gray-900">Order Summary</h4>
                        {cart.map((item) => (
                          <div key={item.productID} className="flex justify-between text-sm text-gray-700 mb-1">
                            <span>
                              {item.name} × {item.quantity}
                            </span>
                            <span className="font-mono">¥{(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                        <Separator className="my-3 bg-gray-300" />
                        <div className="flex justify-between font-medium text-gray-900">
                          <span>Total Amount</span>
                          <span className="font-mono">¥{totalCartValue.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-3 pt-4">
                        <Button onClick={handleOrder} className="flex-1 bg-gray-900 hover:bg-gray-800">
                          Confirm Order
                        </Button>
                        <Button
                          variant="outline"
                          className="border-gray-300 bg-transparent"
                          onClick={() => setShowOrderForm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Product Search and Management */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Product Search */}
          <Card className="bg-white border-gray-300 shadow-lg">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <CardTitle className="flex items-center gap-3 text-gray-900 font-light text-xl">
                <Search className="h-5 w-5" />
                Product Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="flex gap-3">
                <Input
                  placeholder="Search products..."
                  className="border-gray-300 focus:border-gray-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch} className="bg-gray-900 hover:bg-gray-800">
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto">
                {searchResults.length > 0 ? (
                  searchResults.map((item, index) => (
                    <div
                      key={item.productId || index}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500 font-mono">
                          ID: {item.productId} | ¥{item.price?.toLocaleString()} | Stock: {item.stock}
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
                    {searchQuery ? `No results found for "${searchQuery}"` : "Search for products to get started"}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* New Product Addition */}
          <Card className="bg-white border-gray-300 shadow-lg">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <CardTitle className="flex items-center gap-3 text-gray-900 font-light text-xl">
                <Package className="h-5 w-5" />
                Add New Product
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Product ID"
                  className="border-gray-300 focus:border-gray-500"
                  value={newProduct.id}
                  onChange={(e) => setNewProduct((prev) => ({ ...prev, id: e.target.value }))}
                />
                <Input
                  placeholder="Price"
                  className="border-gray-300 focus:border-gray-500"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct((prev) => ({ ...prev, price: e.target.value }))}
                />
              </div>
              <Input
                placeholder="Product Name"
                className="border-gray-300 focus:border-gray-500"
                value={newProduct.name}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))}
              />
              <Input
                placeholder="Stock Quantity (Optional)"
                className="border-gray-300 focus:border-gray-500"
                value={newProduct.stock}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, stock: e.target.value }))}
              />
              <Button onClick={addProduct} className="w-full bg-gray-900 hover:bg-gray-800">
                Add Product
              </Button>
              <Button
                onClick={migrateData}
                variant="outline"
                className="w-full border-gray-300 hover:bg-gray-50 bg-transparent"
              >
                Migrate TestTable Data
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Product Management Table */}
        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-gray-900 font-light text-xl">Product Management</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 border-b border-gray-200">
                  <TableHead className="text-gray-700 font-medium">ID</TableHead>
                  <TableHead className="text-gray-700 font-medium">Image</TableHead>
                  <TableHead className="text-gray-700 font-medium">Product Name</TableHead>
                  <TableHead className="text-gray-700 font-medium">Price</TableHead>
                  <TableHead className="text-gray-700 font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.ID} className="border-b border-gray-100 hover:bg-gray-50">
                    <TableCell className="font-mono text-gray-900">{item.ID}</TableCell>
                    <TableCell>
                      <div className="w-16 h-16 bg-gray-200 rounded border border-gray-300 flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        className="border-gray-300 focus:border-gray-500"
                        value={editedItems[item.ID!]?.name ?? ""}
                        onChange={(e) =>
                          setEditedItems((prev) => ({
                            ...prev,
                            [item.ID!]: { ...prev[item.ID!], name: e.target.value },
                          }))
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="border-gray-300 focus:border-gray-500"
                        value={editedItems[item.ID!]?.price ?? ""}
                        onChange={(e) =>
                          setEditedItems((prev) => ({
                            ...prev,
                            [item.ID!]: { ...prev[item.ID!], price: e.target.value },
                          }))
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-gray-700 hover:bg-gray-800"
                          onClick={() => handleUpdate(item.ID!)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-400 hover:bg-gray-100 text-gray-700 bg-transparent"
                          onClick={() => handleDelete(item.ID!)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add New Item Form */}
        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-gray-900 font-light text-xl">Add New Item to Database</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-4 gap-4 items-end">
              <div>
                <Label htmlFor="new-id" className="text-gray-700 font-medium">
                  ID
                </Label>
                <Input
                  id="new-id"
                  className="border-gray-300 focus:border-gray-500"
                  value={newItem.id}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, id: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="new-name" className="text-gray-700 font-medium">
                  Name
                </Label>
                <Input
                  id="new-name"
                  className="border-gray-300 focus:border-gray-500"
                  value={newItem.name}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="new-price" className="text-gray-700 font-medium">
                  Price
                </Label>
                <Input
                  id="new-price"
                  className="border-gray-300 focus:border-gray-500"
                  value={newItem.price}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, price: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="image-upload" className="text-gray-700 font-medium">
                  Image
                </Label>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="border-gray-300 focus:border-gray-500"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  ref={fileInputRef}
                />
              </div>
            </div>
            <Button onClick={handleAdd} className="mt-6 bg-gray-900 hover:bg-gray-800">
              <Upload className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
