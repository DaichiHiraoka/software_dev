import React, { useEffect, useState, useRef } from 'react';
import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Badge } from "./components/ui/badge"
import { Label } from "./components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table"
import { Settings, Database, Package, Edit, Trash2, Upload, Plus, BarChart3, AlertTriangle } from "lucide-react"
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from "./components/ui/modal"

// 環境変数または直接指定
const server_url = process.env.REACT_APP_API_URL || 'http://localhost:3005'

console.log('管理者システム - 使用するサーバーURL:', server_url);

function AdminApp() {
  // State management for admin functions
  const [data, setData] = useState([])
  const [newItem, setNewItem] = useState({ id: "", name: "", price: "" })
  const [editedItems, setEditedItems] = useState({})
  const [imageFile, setImageFile] = useState(null)
  const fileInputRef = useRef(null)
  
  // New product form for premium products
  const [newProduct, setNewProduct] = useState({ id: "", name: "", price: "", stock: "" })
  
  // Statistics
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeUsers: 0
  })

  // System Reset Modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [systemCounts, setSystemCounts] = useState({})
  const [isResetting, setIsResetting] = useState(false)

  // Data fetching
  useEffect(() => {
    fetchData()
    fetchStats()
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch(`${server_url}/api/TestTable`)
      const data = await response.json()
      setData(data)
      const initialEdits = {}
      data.forEach((item) => {
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
      setData([])
      setEditedItems({})
    }
  }

  const fetchStats = async () => {
    try {
      // 実際の統計情報をAPIから取得
      const response = await fetch(`${server_url}/api/stats`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        // APIが利用できない場合は0で初期化
        setStats({
          totalProducts: data.length || 0,
          totalOrders: 0,
          totalRevenue: 0,
          activeUsers: 0
        })
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error)
      setStats({
        totalProducts: data.length || 0,
        totalOrders: 0,
        totalRevenue: 0,
        activeUsers: 0
      })
    }
  }

  // Product management functions
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
        fetchStats() // 統計更新
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

  const handleUpdate = async (id) => {
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

  const handleDelete = async (id) => {
    if (!window.confirm("この商品を削除してもよろしいですか？")) {
      return
    }
    
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
      fetchData()
      fetchStats()
    } catch (error) {
      console.error("詳細エラー:", error)
      alert("データ移行エラー: " + error)
    }
  }

  // System Reset Functions
  const fetchSystemCounts = async () => {
    try {
      const response = await fetch(`${server_url}/api/system/count`)
      if (response.ok) {
        const data = await response.json()
        setSystemCounts(data.counts)
      }
    } catch (error) {
      console.error("システムカウント取得エラー:", error)
    }
  }

  const handleResetSystemData = async () => {
    setIsResetting(true)
    try {
      const response = await fetch(`${server_url}/api/system/reset`, {
        method: "DELETE",
      })

      if (response.ok) {
        const result = await response.json()
        alert("システムデータが正常にリセットされました")
        setIsResetModalOpen(false)
        fetchStats() // 統計を更新
      } else {
        const error = await response.json()
        alert(`リセットエラー: ${error.error}`)
      }
    } catch (error) {
      console.error("システムリセットエラー:", error)
      alert("システムリセットエラー: " + error.message)
    } finally {
      setIsResetting(false)
    }
  }

  const openResetModal = async () => {
    await fetchSystemCounts()
    setIsResetModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6 space-y-8">
        <div className="text-center py-8">
          <h1 className="text-4xl font-light text-gray-900 mb-4 tracking-wide">ADMIN MANAGEMENT</h1>
          <div className="w-24 h-0.5 bg-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-light">System Administration & Product Management</p>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white border-blue-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalProducts}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-green-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-green-600">{stats.totalOrders}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-yellow-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-yellow-600">¥{stats.totalRevenue.toLocaleString()}</p>
                </div>
                <Database className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-purple-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.activeUsers}</p>
                </div>
                <Settings className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Product Management Section */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Add Premium Product */}
          <Card className="bg-white border-blue-300 shadow-lg">
            <CardHeader className="bg-blue-50 border-b border-blue-200">
              <CardTitle className="flex items-center gap-3 text-gray-900 font-light text-xl">
                <Plus className="h-5 w-5 text-blue-600" />
                Add Premium Product
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Product ID"
                  className="border-gray-300 focus:border-blue-500"
                  value={newProduct.id}
                  onChange={(e) => setNewProduct((prev) => ({ ...prev, id: e.target.value }))}
                />
                <Input
                  placeholder="Price (¥)"
                  className="border-gray-300 focus:border-blue-500"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct((prev) => ({ ...prev, price: e.target.value }))}
                />
              </div>
              <Input
                placeholder="Product Name"
                className="border-gray-300 focus:border-blue-500"
                value={newProduct.name}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))}
              />
              <Input
                placeholder="Stock Quantity (Optional, default: 100)"
                className="border-gray-300 focus:border-blue-500"
                value={newProduct.stock}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, stock: e.target.value }))}
              />
              <Button onClick={addProduct} className="w-full bg-blue-600 hover:bg-blue-700">
                Add Premium Product
              </Button>
            </CardContent>
          </Card>

          {/* System Operations */}
          <Card className="bg-white border-indigo-300 shadow-lg">
            <CardHeader className="bg-indigo-50 border-b border-indigo-200">
              <CardTitle className="flex items-center gap-3 text-gray-900 font-light text-xl">
                <Settings className="h-5 w-5 text-indigo-600" />
                System Operations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <Button
                onClick={migrateData}
                variant="outline"
                className="w-full border-indigo-300 hover:bg-indigo-50 text-indigo-700"
              >
                <Database className="h-4 w-4 mr-2" />
                Migrate TestTable to Products
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="w-full border-gray-300 hover:bg-gray-50"
              >
                Refresh Data
              </Button>
              <Button
                onClick={openResetModal}
                variant="outline"
                className="w-full border-red-300 hover:bg-red-50 text-red-700"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Reset System Data
              </Button>
              <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
                <p className="font-medium mb-1">System Information:</p>
                <p>API Server: {server_url}</p>
                <p>Admin Panel: Port 3004</p>
                <p>Backend API: Port 3005</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Legacy Product Management Table */}
        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-gray-900 font-light text-xl">Legacy Product Database (TestTable)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 border-b border-gray-200">
                  <TableHead className="text-gray-700 font-medium">ID</TableHead>
                  <TableHead className="text-gray-700 font-medium">Image</TableHead>
                  <TableHead className="text-gray-700 font-medium">Product Name</TableHead>
                  <TableHead className="text-gray-700 font-medium">Price (¥)</TableHead>
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
                        className="border-gray-300 focus:border-blue-500"
                        value={editedItems[item.ID]?.name ?? ""}
                        onChange={(e) =>
                          setEditedItems((prev) => ({
                            ...prev,
                            [item.ID]: { ...prev[item.ID], name: e.target.value },
                          }))
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="border-gray-300 focus:border-blue-500"
                        value={editedItems[item.ID]?.price ?? ""}
                        onChange={(e) =>
                          setEditedItems((prev) => ({
                            ...prev,
                            [item.ID]: { ...prev[item.ID], price: e.target.value },
                          }))
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleUpdate(item.ID)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-400 hover:bg-red-50 text-red-600 bg-transparent"
                          onClick={() => handleDelete(item.ID)}
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

        {/* Add New Legacy Item Form */}
        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-gray-900 font-light text-xl">Add New Legacy Item</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-4 gap-4 items-end">
              <div>
                <Label htmlFor="new-id" className="text-gray-700 font-medium">
                  ID
                </Label>
                <Input
                  id="new-id"
                  className="border-gray-300 focus:border-blue-500"
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
                  className="border-gray-300 focus:border-blue-500"
                  value={newItem.name}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="new-price" className="text-gray-700 font-medium">
                  Price (¥)
                </Label>
                <Input
                  id="new-price"
                  className="border-gray-300 focus:border-blue-500"
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
                  className="border-gray-300 focus:border-blue-500"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  ref={fileInputRef}
                />
              </div>
            </div>
            <Button onClick={handleAdd} className="mt-6 bg-gray-900 hover:bg-gray-800">
              <Upload className="h-4 w-4 mr-2" />
              Add Legacy Item
            </Button>
          </CardContent>
        </Card>

        {/* System Reset Modal */}
        <Modal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)}>
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-6 w-6" />
              システムデータリセット
            </ModalTitle>
          </ModalHeader>
          
          <ModalContent>
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium mb-2">⚠️ 警告</p>
                <p className="text-red-700 text-sm">
                  この操作により、以下のシステムデータが<strong>完全に削除</strong>されます。
                  この操作は<strong>取り消しできません</strong>。
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">削除対象データ:</h4>
                <div className="bg-gray-50 p-3 rounded border text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>📋 注文情報:</span>
                      <span className="font-mono">{systemCounts.orders || 0}件</span>
                    </div>
                    <div className="flex justify-between">
                      <span>📦 注文詳細:</span>
                      <span className="font-mono">{systemCounts.orderItems || 0}件</span>
                    </div>
                    <div className="flex justify-between">
                      <span>👥 顧客情報:</span>
                      <span className="font-mono">{systemCounts.customers || 0}件</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-200">
                      <div className="flex justify-between">
                        <span>💳 支払いステータス付き:</span>
                        <span className="font-mono">{systemCounts.payments || 0}件</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🚚 配送ステータス付き:</span>
                        <span className="font-mono">{systemCounts.shipments || 0}件</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-300">
                    <div className="font-medium">主要データ合計: <span className="font-mono">{(systemCounts.orders || 0) + (systemCounts.orderItems || 0) + (systemCounts.customers || 0)}</span>件が削除されます</div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                <p className="text-blue-800">
                  <strong>データ構造:</strong> 支払い・配送情報は注文テーブル内のステータスフィールドで管理されています。
                </p>
              </div>

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                <p className="text-yellow-800">
                  <strong>保持されるデータ:</strong> 商品情報(Products/TestTable)および在庫情報は削除されません。
                </p>
              </div>
            </div>
          </ModalContent>
          
          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => setIsResetModalOpen(false)}
              disabled={isResetting}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleResetSystemData}
              disabled={isResetting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isResetting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  実行中...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  実行する
                </span>
              )}
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    </div>
  )
}

export default AdminApp;