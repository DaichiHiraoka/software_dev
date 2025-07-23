import React, { useEffect, useState } from 'react';
import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Badge } from "./components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog"
import { Label } from "./components/ui/label"
import { Textarea } from "./components/ui/textarea"
import { 
  ClipboardCheck, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  Package,
  Phone,
  Mail,
  MapPin
} from "lucide-react"

// 環境変数またはデフォルト設定
const server_url = process.env.REACT_APP_API_URL || 'http://localhost:3005'

function OrderManagementApp() {
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)


  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    filterOrders()
  }, [orders, statusFilter, searchQuery])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${server_url}/api/orders`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      } else {
        console.error('Failed to fetch orders: API response not OK')
        setOrders([])
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const filterOrders = () => {
    let filtered = orders

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredOrders(filtered)
  }

  const updateOrderStatus = async (orderId, newStatus, notes = '') => {
    try {
      const response = await fetch(`${server_url}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, notes })
      })

      if (response.ok) {
        // 成功時は注文リストを更新
        setOrders(orders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus, notes } 
            : order
        ))
        alert('注文ステータスが更新されました')
      } else {
        // APIが利用できない場合はローカル更新
        setOrders(orders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus, notes } 
            : order
        ))
        alert('注文ステータスが更新されました（ローカル）')
      }
    } catch (error) {
      console.error('Failed to update order:', error)
      // エラーの場合もローカル更新
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus, notes } 
          : order
      ))
      alert('注文ステータスが更新されました（ローカル）')
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: '受付中', color: 'bg-yellow-500' },
      confirmed: { label: '確認済み', color: 'bg-blue-500' },
      processing: { label: '処理中', color: 'bg-orange-500' },
      completed: { label: '完了', color: 'bg-green-500' },
      cancelled: { label: 'キャンセル', color: 'bg-red-500' }
    }
    
    const config = statusConfig[status] || { label: status, color: 'bg-gray-500' }
    return <Badge className={`${config.color} text-white`}>{config.label}</Badge>
  }

  const getPaymentMethodLabel = (method) => {
    const methods = {
      bank_transfer: '銀行振込',
      convenience_store: 'コンビニ決済',
      cash_on_delivery: '代金引換',
      credit_card: 'クレジットカード'
    }
    return methods[method] || method
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6 space-y-8">
        {/* ヘッダー */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-light text-gray-900 mb-4 tracking-wide flex items-center justify-center gap-3">
            <ClipboardCheck className="h-10 w-10 text-blue-600" />
            注文受付管理システム
          </h1>
          <div className="w-24 h-0.5 bg-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-light">Order Reception Management System</p>
        </div>

        {/* フィルター・検索セクション */}
        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader className="bg-blue-50 border-b border-gray-200">
            <CardTitle className="flex items-center gap-3 text-gray-900 font-light text-xl">
              <Search className="h-5 w-5" />
              注文検索・フィルター
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="status-filter">ステータス</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="ステータスを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="pending">受付中</SelectItem>
                    <SelectItem value="confirmed">確認済み</SelectItem>
                    <SelectItem value="processing">処理中</SelectItem>
                    <SelectItem value="completed">完了</SelectItem>
                    <SelectItem value="cancelled">キャンセル</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="search">検索（注文ID、顧客名、メール）</Label>
                <Input
                  id="search"
                  placeholder="検索キーワードを入力..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 注文一覧テーブル */}
        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader className="bg-blue-50 border-b border-gray-200">
            <CardTitle className="text-gray-900 font-light text-xl">
              注文一覧 ({filteredOrders.length}件)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">読み込み中...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100 border-b border-gray-200">
                    <TableHead className="text-gray-700 font-medium">注文ID</TableHead>
                    <TableHead className="text-gray-700 font-medium">顧客名</TableHead>
                    <TableHead className="text-gray-700 font-medium">金額</TableHead>
                    <TableHead className="text-gray-700 font-medium">支払い方法</TableHead>
                    <TableHead className="text-gray-700 font-medium">ステータス</TableHead>
                    <TableHead className="text-gray-700 font-medium">注文日時</TableHead>
                    <TableHead className="text-gray-700 font-medium">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <TableCell className="font-mono text-blue-600">{order.id}</TableCell>
                      <TableCell className="font-medium">{order.customerName}</TableCell>
                      <TableCell className="font-mono">¥{(order.total || 0).toLocaleString()}</TableCell>
                      <TableCell>{getPaymentMethodLabel(order.paymentMethod)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleString('ja-JP')}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              onClick={() => setSelectedOrder(order)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              詳細
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl bg-white border-gray-300">
                            <DialogHeader>
                              <DialogTitle className="text-gray-900 text-xl font-light">
                                注文詳細: {order.id}
                              </DialogTitle>
                            </DialogHeader>
                            <OrderDetailModal 
                              order={order} 
                              onUpdateStatus={updateOrderStatus}
                            />
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// 注文詳細モーダルコンポーネント
function OrderDetailModal({ order, onUpdateStatus }) {
  const [notes, setNotes] = useState(order.notes || '')
  const [newStatus, setNewStatus] = useState(order.status)

  const handleStatusUpdate = () => {
    onUpdateStatus(order.id, newStatus, notes)
  }

  return (
    <div className="space-y-6">
      {/* 顧客情報 */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
            <User className="h-5 w-5" />
            顧客情報
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-medium">氏名:</span> {order.customerName}
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <span className="font-medium">メール:</span> {order.customerEmail}
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <span className="font-medium">電話:</span> {order.customerPhone}
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
              <span className="font-medium">住所:</span> 
              <span className="break-words">{order.customerAddress}</span>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
            <Package className="h-5 w-5" />
            注文情報
          </h3>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">注文ID:</span> {order.id}</div>
            <div><span className="font-medium">注文日時:</span> {new Date(order.createdAt).toLocaleString('ja-JP')}</div>
            <div><span className="font-medium">支払い方法:</span> {getPaymentMethodLabel(order.paymentMethod)}</div>
          </div>
        </div>
      </div>

      {/* 注文商品一覧 */}
      <div>
        <h3 className="text-lg font-medium mb-3">注文商品</h3>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>商品名</TableHead>
                <TableHead>数量</TableHead>
                <TableHead>単価</TableHead>
                <TableHead>小計</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(order.items || []).map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.name || '商品名不明'}</TableCell>
                  <TableCell>{item.quantity || 0}</TableCell>
                  <TableCell className="font-mono">¥{(item.price || 0).toLocaleString()}</TableCell>
                  <TableCell className="font-mono">¥{((item.price || 0) * (item.quantity || 0)).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-gray-50 font-medium">
                <TableCell colSpan={3}>合計金額</TableCell>
                <TableCell className="font-mono">¥{(order.total || 0).toLocaleString()}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ステータス更新 */}
      <div>
        <h3 className="text-lg font-medium mb-3">ステータス更新</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="status">新しいステータス</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">受付中</SelectItem>
                <SelectItem value="confirmed">確認済み</SelectItem>
                <SelectItem value="processing">処理中</SelectItem>
                <SelectItem value="completed">完了</SelectItem>
                <SelectItem value="cancelled">キャンセル</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="notes">備考</Label>
            <Textarea
              id="notes"
              placeholder="備考を入力..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <Button 
          onClick={handleStatusUpdate}
          className="mt-4 bg-blue-600 hover:bg-blue-700"
        >
          ステータスを更新
        </Button>
      </div>
    </div>
  )
}

function getPaymentMethodLabel(method) {
  const methods = {
    bank_transfer: '銀行振込',
    convenience_store: 'コンビニ決済',
    cash_on_delivery: '代金引換',
    credit_card: 'クレジットカード'
  }
  return methods[method] || method
}

export default OrderManagementApp;