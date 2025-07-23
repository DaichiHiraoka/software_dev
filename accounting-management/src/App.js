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
  Calculator, 
  TrendingUp, 
  DollarSign, 
  CreditCard,
  PieChart,
  FileText,
  CheckCircle,
  AlertCircle,
  Search
} from "lucide-react"

// 環境変数またはデフォルト設定
const server_url = process.env.REACT_APP_API_URL || 'http://localhost:3005'

function AccountingManagementApp() {
  const [payments, setPayments] = useState([])
  const [filteredPayments, setFilteredPayments] = useState([])
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState('today')
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    pendingPayments: 0,
    completedPayments: 0,
    failedPayments: 0
  })


  useEffect(() => {
    fetchPayments()
  }, [])

  useEffect(() => {
    filterPayments()
    calculateSummary()
  }, [payments, statusFilter, searchQuery, dateRange])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${server_url}/api/payments`)
      if (response.ok) {
        const data = await response.json()
        setPayments(data)
      } else {
        console.error('Failed to fetch payments: API response not OK')
        setPayments([])
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error)
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  const filterPayments = () => {
    let filtered = payments

    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter)
    }

    if (searchQuery) {
      filtered = filtered.filter(payment =>
        payment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.customerName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // 日付フィルター
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    if (dateRange === 'today') {
      filtered = filtered.filter(payment => 
        new Date(payment.createdAt) >= today
      )
    } else if (dateRange === 'week') {
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      filtered = filtered.filter(payment => 
        new Date(payment.createdAt) >= weekAgo
      )
    } else if (dateRange === 'month') {
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
      filtered = filtered.filter(payment => 
        new Date(payment.createdAt) >= monthAgo
      )
    }

    setFilteredPayments(filtered)
  }

  const calculateSummary = () => {
    const totalRevenue = filteredPayments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0)
    
    const pendingPayments = filteredPayments.filter(p => p.status === 'pending').length
    const completedPayments = filteredPayments.filter(p => p.status === 'completed').length
    const failedPayments = filteredPayments.filter(p => p.status === 'failed').length

    setSummary({
      totalRevenue,
      pendingPayments,
      completedPayments,
      failedPayments
    })
  }

  const updatePaymentStatus = async (paymentId, newStatus, notes = '') => {
    try {
      const response = await fetch(`${server_url}/api/payments/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus, 
          notes,
          processedAt: newStatus === 'completed' ? new Date().toISOString() : null
        })
      })

      if (response.ok) {
        setPayments(payments.map(payment => 
          payment.id === paymentId 
            ? { 
                ...payment, 
                status: newStatus, 
                notes,
                processedAt: newStatus === 'completed' ? new Date().toISOString() : payment.processedAt
              } 
            : payment
        ))
        alert('支払いステータスが更新されました')
      } else {
        // APIが利用できない場合はローカル更新
        setPayments(payments.map(payment => 
          payment.id === paymentId 
            ? { 
                ...payment, 
                status: newStatus, 
                notes,
                processedAt: newStatus === 'completed' ? new Date().toISOString() : payment.processedAt
              } 
            : payment
        ))
        alert('支払いステータスが更新されました（ローカル）')
      }
    } catch (error) {
      console.error('Failed to update payment:', error)
      setPayments(payments.map(payment => 
        payment.id === paymentId 
          ? { 
              ...payment, 
              status: newStatus, 
              notes,
              processedAt: newStatus === 'completed' ? new Date().toISOString() : payment.processedAt
            } 
          : payment
      ))
      alert('支払いステータスが更新されました（ローカル）')
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: '未完了', color: 'bg-yellow-500', icon: AlertCircle },
      completed: { label: '完了', color: 'bg-green-500', icon: CheckCircle },
      failed: { label: '失敗', color: 'bg-red-500', icon: AlertCircle }
    }
    
    const config = statusConfig[status] || { label: status, color: 'bg-gray-500', icon: AlertCircle }
    const IconComponent = config.icon
    
    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    )
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

  const getPaymentMethodIcon = (method) => {
    const icons = {
      bank_transfer: DollarSign,
      convenience_store: FileText,
      cash_on_delivery: CreditCard,
      credit_card: CreditCard
    }
    return icons[method] || CreditCard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="container mx-auto p-6 space-y-8">
        {/* ヘッダー */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-light text-gray-900 mb-4 tracking-wide flex items-center justify-center gap-3">
            <Calculator className="h-10 w-10 text-green-600" />
            会計管理システム
          </h1>
          <div className="w-24 h-0.5 bg-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-light">Accounting Management System</p>
        </div>

        {/* サマリーカード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white border-gray-300 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">総売上</p>
                  <p className="text-2xl font-bold text-green-600">¥{summary.totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-300 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">未完了</p>
                  <p className="text-2xl font-bold text-yellow-600">{summary.pendingPayments}件</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-300 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">完了</p>
                  <p className="text-2xl font-bold text-green-600">{summary.completedPayments}件</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-300 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">失敗</p>
                  <p className="text-2xl font-bold text-red-600">{summary.failedPayments}件</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* フィルター・検索セクション */}
        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader className="bg-green-50 border-b border-gray-200">
            <CardTitle className="flex items-center gap-3 text-gray-900 font-light text-xl">
              <Search className="h-5 w-5" />
              支払い検索・フィルター
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="status-filter">ステータス</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="ステータスを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="pending">未完了</SelectItem>
                    <SelectItem value="completed">完了</SelectItem>
                    <SelectItem value="failed">失敗</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date-filter">期間</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="期間を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="today">今日</SelectItem>
                    <SelectItem value="week">過去7日</SelectItem>
                    <SelectItem value="month">過去30日</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="search">検索（支払いID、注文ID、顧客名）</Label>
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

        {/* 支払い一覧テーブル */}
        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader className="bg-green-50 border-b border-gray-200">
            <CardTitle className="text-gray-900 font-light text-xl">
              支払い一覧 ({filteredPayments.length}件)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">読み込み中...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100 border-b border-gray-200">
                    <TableHead className="text-gray-700 font-medium">支払いID</TableHead>
                    <TableHead className="text-gray-700 font-medium">注文ID</TableHead>
                    <TableHead className="text-gray-700 font-medium">顧客名</TableHead>
                    <TableHead className="text-gray-700 font-medium">金額</TableHead>
                    <TableHead className="text-gray-700 font-medium">支払い方法</TableHead>
                    <TableHead className="text-gray-700 font-medium">ステータス</TableHead>
                    <TableHead className="text-gray-700 font-medium">作成日時</TableHead>
                    <TableHead className="text-gray-700 font-medium">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => {
                    const PaymentIcon = getPaymentMethodIcon(payment.paymentMethod)
                    return (
                      <TableRow key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <TableCell className="font-mono text-green-600">{payment.id}</TableCell>
                        <TableCell className="font-mono text-blue-600">{payment.orderId}</TableCell>
                        <TableCell className="font-medium">{payment.customerName}</TableCell>
                        <TableCell className="font-mono text-lg font-semibold">¥{payment.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <PaymentIcon className="h-4 w-4 text-gray-500" />
                            {getPaymentMethodLabel(payment.paymentMethod)}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(payment.createdAt).toLocaleString('ja-JP')}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                onClick={() => setSelectedPayment(payment)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                詳細
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl bg-white border-gray-300">
                              <DialogHeader>
                                <DialogTitle className="text-gray-900 text-xl font-light">
                                  支払い詳細: {payment.id}
                                </DialogTitle>
                              </DialogHeader>
                              <PaymentDetailModal 
                                payment={payment} 
                                onUpdateStatus={updatePaymentStatus}
                              />
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// 支払い詳細モーダルコンポーネント
function PaymentDetailModal({ payment, onUpdateStatus }) {
  const [notes, setNotes] = useState(payment.notes || '')
  const [newStatus, setNewStatus] = useState(payment.status)

  const handleStatusUpdate = () => {
    onUpdateStatus(payment.id, newStatus, notes)
  }

  const PaymentIcon = getPaymentMethodIcon(payment.paymentMethod)

  return (
    <div className="space-y-6">
      {/* 支払い情報 */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            支払い情報
          </h3>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">支払いID:</span> {payment.id}</div>
            <div><span className="font-medium">注文ID:</span> {payment.orderId}</div>
            <div><span className="font-medium">顧客名:</span> {payment.customerName}</div>
            <div className="flex items-center gap-2">
              <PaymentIcon className="h-4 w-4 text-gray-500" />
              <span className="font-medium">支払い方法:</span> 
              {getPaymentMethodLabel(payment.paymentMethod)}
            </div>
            <div><span className="font-medium">金額:</span> ¥{payment.amount.toLocaleString()}</div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            処理状況
          </h3>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">ステータス:</span> {getStatusBadge(payment.status)}</div>
            <div><span className="font-medium">作成日時:</span> {new Date(payment.createdAt).toLocaleString('ja-JP')}</div>
            {payment.processedAt && (
              <div><span className="font-medium">処理完了:</span> {new Date(payment.processedAt).toLocaleString('ja-JP')}</div>
            )}
            {payment.transactionId && (
              <div><span className="font-medium">取引ID:</span> {payment.transactionId}</div>
            )}
          </div>
        </div>
      </div>

      {/* 備考 */}
      {payment.notes && (
        <div>
          <h3 className="text-lg font-medium mb-2">備考</h3>
          <div className="bg-gray-50 p-3 rounded border text-sm">
            {payment.notes}
          </div>
        </div>
      )}

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
                <SelectItem value="pending">未完了</SelectItem>
                <SelectItem value="completed">完了</SelectItem>
                <SelectItem value="failed">失敗</SelectItem>
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
          className="mt-4 bg-green-600 hover:bg-green-700"
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

function getPaymentMethodIcon(method) {
  const icons = {
    bank_transfer: DollarSign,
    convenience_store: FileText,
    cash_on_delivery: CreditCard,
    credit_card: CreditCard
  }
  return icons[method] || CreditCard
}

function getStatusBadge(status) {
  const statusConfig = {
    pending: { label: '未完了', color: 'bg-yellow-500', icon: AlertCircle },
    completed: { label: '完了', color: 'bg-green-500', icon: CheckCircle },
    failed: { label: '失敗', color: 'bg-red-500', icon: AlertCircle }
  }
  
  const config = statusConfig[status] || { label: status, color: 'bg-gray-500', icon: AlertCircle }
  const IconComponent = config.icon
  
  return (
    <Badge className={`${config.color} text-white flex items-center gap-1`}>
      <IconComponent className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}

export default AccountingManagementApp;