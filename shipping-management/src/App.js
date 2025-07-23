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
  Truck, 
  Package, 
  MapPin, 
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  User,
  Phone,
  Mail,
  Calendar,
  FileText,
  Box
} from "lucide-react"

// 環境変数またはデフォルト設定
const server_url = process.env.REACT_APP_API_URL || 'http://localhost:3005'

function ShippingManagementApp() {
  const [shipments, setShipments] = useState([])
  const [filteredShipments, setFilteredShipments] = useState([])
  const [selectedShipment, setSelectedShipment] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState({
    pendingShipments: 0,
    inTransitShipments: 0,
    deliveredShipments: 0,
    todayDeliveries: 0
  })


  useEffect(() => {
    fetchShipments()
  }, [])

  useEffect(() => {
    filterShipments()
    calculateSummary()
  }, [shipments, statusFilter, searchQuery, priorityFilter])

  const fetchShipments = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${server_url}/api/shipments`)
      if (response.ok) {
        const data = await response.json()
        setShipments(data)
      } else {
        console.error('Failed to fetch shipments: API response not OK')
        setShipments([])
      }
    } catch (error) {
      console.error('Failed to fetch shipments:', error)
      setShipments([])
    } finally {
      setLoading(false)
    }
  }

  const filterShipments = () => {
    let filtered = shipments

    if (statusFilter !== 'all') {
      filtered = filtered.filter(shipment => shipment.status === statusFilter)
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(shipment => shipment.priority === priorityFilter)
    }

    if (searchQuery) {
      filtered = filtered.filter(shipment =>
        shipment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shipment.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shipment.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shipment.customerName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredShipments(filtered)
  }

  const calculateSummary = () => {
    const pendingShipments = filteredShipments.filter(s => s.status === 'preparing').length
    const inTransitShipments = filteredShipments.filter(s => s.status === 'in_transit').length
    const deliveredShipments = filteredShipments.filter(s => s.status === 'delivered').length
    
    // 今日配達予定の件数
    const today = new Date().toISOString().split('T')[0]
    const todayDeliveries = filteredShipments.filter(s => 
      s.estimatedDelivery === today || 
      (s.actualDelivery && s.actualDelivery.startsWith(today))
    ).length

    setSummary({
      pendingShipments,
      inTransitShipments,
      deliveredShipments,
      todayDeliveries
    })
  }

  const updateShipmentStatus = async (shipmentId, newStatus, notes = '', trackingNumber = '') => {
    try {
      const updateData = { 
        status: newStatus, 
        notes,
        shippedAt: newStatus === 'in_transit' && !shipments.find(s => s.id === shipmentId)?.shippedAt 
          ? new Date().toISOString() : undefined,
        actualDelivery: newStatus === 'delivered' ? new Date().toISOString() : undefined
      }

      if (trackingNumber) {
        updateData.trackingNumber = trackingNumber
      }

      const response = await fetch(`${server_url}/api/shipments/${shipmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        setShipments(shipments.map(shipment => 
          shipment.id === shipmentId 
            ? { ...shipment, ...updateData } 
            : shipment
        ))
        alert('配送ステータスが更新されました')
      } else {
        // APIが利用できない場合はローカル更新
        setShipments(shipments.map(shipment => 
          shipment.id === shipmentId 
            ? { ...shipment, ...updateData } 
            : shipment
        ))
        alert('配送ステータスが更新されました（ローカル）')
      }
    } catch (error) {
      console.error('Failed to update shipment:', error)
      setShipments(shipments.map(shipment => 
        shipment.id === shipmentId 
          ? { 
              ...shipment, 
              status: newStatus, 
              notes,
              shippedAt: newStatus === 'in_transit' && !shipment.shippedAt 
                ? new Date().toISOString() : shipment.shippedAt,
              actualDelivery: newStatus === 'delivered' ? new Date().toISOString() : shipment.actualDelivery
            } 
          : shipment
      ))
      alert('配送ステータスが更新されました（ローカル）')
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      preparing: { label: '準備中', color: 'bg-yellow-500', icon: Package },
      in_transit: { label: '配送中', color: 'bg-blue-500', icon: Truck },
      delivered: { label: '配達完了', color: 'bg-green-500', icon: CheckCircle },
      delayed: { label: '遅延', color: 'bg-red-500', icon: AlertCircle },
      returned: { label: '返送', color: 'bg-gray-500', icon: AlertCircle }
    }
    
    const config = statusConfig[status] || { label: status, color: 'bg-gray-500', icon: Package }
    const IconComponent = config.icon
    
    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: { label: '低', color: 'bg-gray-400' },
      normal: { label: '標準', color: 'bg-blue-500' },
      high: { label: '高', color: 'bg-orange-500' },
      urgent: { label: '緊急', color: 'bg-red-500' }
    }
    
    const config = priorityConfig[priority] || { label: priority, color: 'bg-gray-500' }
    return <Badge className={`${config.color} text-white`}>{config.label}</Badge>
  }

  const getCarrierLabel = (carrier) => {
    const carriers = {
      yamato: 'ヤマト運輸',
      sagawa: '佐川急便',
      jppost: '日本郵便',
      fedex: 'FedEx',
      dhl: 'DHL'
    }
    return carriers[carrier] || carrier
  }

  const getShippingMethodLabel = (method) => {
    const methods = {
      standard: '通常配送',
      express: '速達',
      overnight: '翌日配達',
      pickup: '店舗受取'
    }
    return methods[method] || method
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="container mx-auto p-6 space-y-8">
        {/* ヘッダー */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-light text-gray-900 mb-4 tracking-wide flex items-center justify-center gap-3">
            <Truck className="h-10 w-10 text-purple-600" />
            商品発送管理システム
          </h1>
          <div className="w-24 h-0.5 bg-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-light">Shipping Management System</p>
        </div>

        {/* サマリーカード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white border-gray-300 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">準備中</p>
                  <p className="text-2xl font-bold text-yellow-600">{summary.pendingShipments}件</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-300 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Truck className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">配送中</p>
                  <p className="text-2xl font-bold text-blue-600">{summary.inTransitShipments}件</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-300 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">配達完了</p>
                  <p className="text-2xl font-bold text-green-600">{summary.deliveredShipments}件</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-300 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">今日配達</p>
                  <p className="text-2xl font-bold text-purple-600">{summary.todayDeliveries}件</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* フィルター・検索セクション */}
        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader className="bg-purple-50 border-b border-gray-200">
            <CardTitle className="flex items-center gap-3 text-gray-900 font-light text-xl">
              <Search className="h-5 w-5" />
              配送検索・フィルター
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="status-filter">ステータス</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="ステータスを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="preparing">準備中</SelectItem>
                    <SelectItem value="in_transit">配送中</SelectItem>
                    <SelectItem value="delivered">配達完了</SelectItem>
                    <SelectItem value="delayed">遅延</SelectItem>
                    <SelectItem value="returned">返送</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority-filter">優先度</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="優先度を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="low">低</SelectItem>
                    <SelectItem value="normal">標準</SelectItem>
                    <SelectItem value="high">高</SelectItem>
                    <SelectItem value="urgent">緊急</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3">
                <Label htmlFor="search">検索（配送ID、注文ID、追跡番号、顧客名）</Label>
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

        {/* 配送一覧テーブル */}
        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader className="bg-purple-50 border-b border-gray-200">
            <CardTitle className="text-gray-900 font-light text-xl">
              配送一覧 ({filteredShipments.length}件)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">読み込み中...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100 border-b border-gray-200">
                    <TableHead className="text-gray-700 font-medium">配送ID</TableHead>
                    <TableHead className="text-gray-700 font-medium">顧客名</TableHead>
                    <TableHead className="text-gray-700 font-medium">配送先</TableHead>
                    <TableHead className="text-gray-700 font-medium">運送会社</TableHead>
                    <TableHead className="text-gray-700 font-medium">ステータス</TableHead>
                    <TableHead className="text-gray-700 font-medium">優先度</TableHead>
                    <TableHead className="text-gray-700 font-medium">配達予定</TableHead>
                    <TableHead className="text-gray-700 font-medium">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShipments.map((shipment) => (
                    <TableRow key={shipment.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <TableCell className="font-mono text-purple-600">{shipment.id}</TableCell>
                      <TableCell className="font-medium">{shipment.customerName}</TableCell>
                      <TableCell className="text-sm max-w-48 truncate">{shipment.shippingAddress}</TableCell>
                      <TableCell>{getCarrierLabel(shipment.carrier)}</TableCell>
                      <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                      <TableCell>{getPriorityBadge(shipment.priority)}</TableCell>
                      <TableCell className="text-sm">
                        {shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery).toLocaleDateString('ja-JP') : '-'}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              onClick={() => setSelectedShipment(shipment)}
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              詳細
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl bg-white border-gray-300">
                            <DialogHeader>
                              <DialogTitle className="text-gray-900 text-xl font-light">
                                配送詳細: {shipment.id}
                              </DialogTitle>
                            </DialogHeader>
                            <ShipmentDetailModal 
                              shipment={shipment} 
                              onUpdateStatus={updateShipmentStatus}
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

// 配送詳細モーダルコンポーネント
function ShipmentDetailModal({ shipment, onUpdateStatus }) {
  const [notes, setNotes] = useState(shipment.notes || '')
  const [newStatus, setNewStatus] = useState(shipment.status)
  const [trackingNumber, setTrackingNumber] = useState(shipment.trackingNumber || '')

  const handleStatusUpdate = () => {
    onUpdateStatus(shipment.id, newStatus, notes, trackingNumber)
  }

  return (
    <div className="space-y-6">
      {/* 顧客・配送情報 */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
            <User className="h-5 w-5" />
            顧客情報
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-medium">氏名:</span> {shipment.customerName}
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <span className="font-medium">メール:</span> {shipment.customerEmail}
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <span className="font-medium">電話:</span> {shipment.customerPhone}
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
              <span className="font-medium">住所:</span> 
              <span className="break-words">{shipment.shippingAddress}</span>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
            <Package className="h-5 w-5" />
            配送情報
          </h3>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">配送ID:</span> {shipment.id}</div>
            <div><span className="font-medium">注文ID:</span> {shipment.orderId}</div>
            <div><span className="font-medium">追跡番号:</span> {shipment.trackingNumber}</div>
            <div><span className="font-medium">運送会社:</span> {getCarrierLabel(shipment.carrier)}</div>
            <div><span className="font-medium">配送方法:</span> {getShippingMethodLabel(shipment.shippingMethod)}</div>
            <div><span className="font-medium">総重量:</span> {shipment.totalWeight}g</div>
            <div><span className="font-medium">配達予定日:</span> {shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery).toLocaleDateString('ja-JP') : '-'}</div>
            {shipment.actualDelivery && (
              <div><span className="font-medium">配達完了日時:</span> {new Date(shipment.actualDelivery).toLocaleString('ja-JP')}</div>
            )}
          </div>
        </div>
      </div>

      {/* 配送商品一覧 */}
      <div>
        <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
          <Box className="h-5 w-5" />
          配送商品
        </h3>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>商品名</TableHead>
                <TableHead>数量</TableHead>
                <TableHead>重量</TableHead>
                <TableHead>小計重量</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipment.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.weight}g</TableCell>
                  <TableCell>{item.weight * item.quantity}g</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-gray-50 font-medium">
                <TableCell colSpan={3}>総重量</TableCell>
                <TableCell>{shipment.totalWeight}g</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 配送履歴・タイムライン */}
      <div>
        <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          配送履歴
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
            <Package className="h-5 w-5 text-blue-500" />
            <div>
              <div className="font-medium">注文受付</div>
              <div className="text-sm text-gray-600">
                {new Date(shipment.createdAt).toLocaleString('ja-JP')}
              </div>
            </div>
          </div>
          {shipment.shippedAt && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded">
              <Truck className="h-5 w-5 text-blue-500" />
              <div>
                <div className="font-medium">発送完了</div>
                <div className="text-sm text-gray-600">
                  {new Date(shipment.shippedAt).toLocaleString('ja-JP')}
                </div>
              </div>
            </div>
          )}
          {shipment.actualDelivery && (
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="font-medium">配達完了</div>
                <div className="text-sm text-gray-600">
                  {new Date(shipment.actualDelivery).toLocaleString('ja-JP')}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 特別指示・備考 */}
      {(shipment.specialInstructions || shipment.notes) && (
        <div className="grid md:grid-cols-2 gap-6">
          {shipment.specialInstructions && (
            <div>
              <h3 className="text-lg font-medium mb-2">特別指示</h3>
              <div className="bg-yellow-50 p-3 rounded border text-sm">
                {shipment.specialInstructions}
              </div>
            </div>
          )}
          {shipment.notes && (
            <div>
              <h3 className="text-lg font-medium mb-2">備考</h3>
              <div className="bg-gray-50 p-3 rounded border text-sm">
                {shipment.notes}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ステータス更新 */}
      <div>
        <h3 className="text-lg font-medium mb-3">ステータス更新</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="status">新しいステータス</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="preparing">準備中</SelectItem>
                <SelectItem value="in_transit">配送中</SelectItem>
                <SelectItem value="delivered">配達完了</SelectItem>
                <SelectItem value="delayed">遅延</SelectItem>
                <SelectItem value="returned">返送</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="tracking">追跡番号</Label>
            <Input
              id="tracking"
              placeholder="追跡番号を入力..."
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />
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
          className="mt-4 bg-purple-600 hover:bg-purple-700"
        >
          ステータスを更新
        </Button>
      </div>
    </div>
  )
}

function getCarrierLabel(carrier) {
  const carriers = {
    yamato: 'ヤマト運輸',
    sagawa: '佐川急便',
    jppost: '日本郵便',
    fedex: 'FedEx',
    dhl: 'DHL'
  }
  return carriers[carrier] || carrier
}

function getShippingMethodLabel(method) {
  const methods = {
    standard: '通常配送',
    express: '速達',
    overnight: '翌日配達',
    pickup: '店舗受取'
  }
  return methods[method] || method
}

export default ShippingManagementApp;