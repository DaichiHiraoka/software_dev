import React, { useEffect, useState, useRef } from 'react';

// 環境変数または直接指定
const server_url = process.env.REACT_APP_API_URL || 'http://localhost:3001'

console.log('環境変数 REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('使用するサーバーURL:', server_url);

// 確実に設定するため、直接指定も可能
// const server_url = 'http://localhost:3001';

function App() {
  // 一覧表示用のデータを保存する変数（サーバーから取得してここに入れる）
  const [data, setData] = useState([]); // 空の状態を代入。

  // フォームで新しいデータを入力するための変数（ID、名前、価格を保持）
  const [newItem, setNewItem] = useState({ id: '', name: '', price: '' });
  
  // 一覧の各行ごとの「編集中の内容」を一時的に保存するための変数
  // IDごとに name と price を持つようなオブジェクトで管理する。
  const [editedItems, setEditedItems] = useState({});

  // アップロード用画像ファイル
  const [imageFile, setImageFile] = useState(null);
  const fileInputRef = useRef(null);

  // New state for search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // 注文フロー用の状態
  const [cart, setCart] = useState([]);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    address: '',
    contactInfo: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');

  // データ取得
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    fetch(`${server_url}/api/TestTable`)
      .then(res => res.json()) // サーバーの応答(JSON形式)をJavaScriptオブジェクトに変換
      .then(data => {
        setData(data); // 取得したデータを React の状態（state）に保存 → 画面に表示されるようになる
        const initialEdits = {}; // 編集用フォームに使う初期値を保存するための空オブジェクトを用意
        data.forEach(item => {   // 取得したデータの1件1件について繰り返し処理（itemは1行分のデータ）
          initialEdits[item.ID] = { // 各行のIDをキーにして、編集フォームで使う初期値をセットする
            name: item.Name || '',  // Nameがnullであれば''
            price: item.Price != null ? String(item.Price) : '' // 数値情報を文字列に変換し表示。(0も表示できる)
          };
        });
        setEditedItems(initialEdits);
      });
  };

  // 新規入力フォーム更新
  const handleNewChange = (e) => { //e：イベント
    const { name, value } = e.target; // イベントにより編集された情報を変数に代入
    setNewItem(prev => ({ 
      ...prev,      // 現在の状態(id, name, price)をすべてコピーする。
      [name]: value // // 編集されたinput の name 属性に対応する値を上書き。
    }));
  };

  // 編集フォーム更新（行ごと）
  const handleEditChange = (id, e) => {
    const { name, value } = e.target;
    setEditedItems(prev => ({ // フォームで1文字入力されるたびに呼ばれる
      ...prev, // その行に入力された値をコピー
      [id]: { // 今回編集された行(id)だけ更新
        ...prev[id],  // その行にすでに入力されていた値をコピー
        [name]: value // 編集されたinput の name 属性に対応する値を上書き。
      },
    }));
  };

  const handleImageUpload = async (id) => {
    if (!imageFile) return;
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('id', id);

    await fetch(`${server_url}/api/upload`, {
      method: 'POST',
      body: formData
    });
  };

  // 新規追加（POST）
  const handleAdd = async () => {
    const currentID = newItem.id;

    await fetch(`${server_url}/api/TestTable`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ // JavaScript のオブジェクトをJSON文字列に変換
        id: Number(newItem.id),
        name: newItem.name,
        price: Number(newItem.price),
      }),
    });
    console.log(`データのpost: ${currentID}`);
    //入力フォーム初期化。
    setNewItem({ id: '', name: '', price: '' }); // 入力フォームを空に戻す
 
    await handleImageUpload(currentID);
    
    await fetchData(); // 登録が完了したら、最新データをもう一度サーバから取得

    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = null; // 🔹 ファイル選択状態をクリア
    }
  };

  // 更新（PUT）
  const handleUpdate = (id) => {
    fetch(`${server_url}/api/TestTable/${id}`, {
      method: 'PUT', // PUT： データ更新
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ // JavaScript のオブジェクトをJSON文字列に変換
        name: editedItems[id].name,
        price: Number(editedItems[id].price),
      }),
    }).then(() => fetchData());
  };

  // 削除（DELETE）
  const handleDelete = (id) => {
    fetch(`${server_url}/api/TestTable/${id}`, {
      method: 'DELETE',
    }).then(() => 
      fetchData() // 更新が完了したら、最新データをもう一度サーバから取得
    );
  };

  // New function for handling search
  const handleSearch = () => {
    console.log('検索開始:', searchQuery);
    console.log('サーバーURL:', server_url);
    
    if (!searchQuery) {
      setSearchResults([]); // Clear results if query is empty
      return;
    }
    
    const searchUrl = `${server_url}/api/products?q=${searchQuery}`;
    console.log('検索URL:', searchUrl);
    
    fetch(searchUrl)
      .then(res => {
        console.log('レスポンス状態:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('検索結果:', data);
        setSearchResults(data);
      })
      .catch(err => {
        console.error("Search failed:", err);
        alert('検索エラー: ' + err.message);
      });
  };

  // カート管理機能
  const addToCart = (product, quantity = 1) => {
    const existingItem = cart.find(item => item.productID === product.productId);
    if (existingItem) {
      setCart(cart.map(item => 
        item.productID === product.productId 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCart([...cart, {
        productID: product.productId,
        name: product.name,
        price: product.price,
        quantity: quantity
      }]);
    }
  };

  const removeFromCart = (productID) => {
    setCart(cart.filter(item => item.productID !== productID));
  };

  const updateCartQuantity = (productID, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productID);
      return;
    }
    setCart(cart.map(item => 
      item.productID === productID 
        ? { ...item, quantity: quantity }
        : item
    ));
  };

  // 注文処理
  const handleOrder = async () => {
    if (cart.length === 0) {
      alert('カートが空です');
      return;
    }

    if (!customerInfo.name || !customerInfo.address || !customerInfo.contactInfo) {
      alert('顧客情報をすべて入力してください');
      return;
    }

    const orderData = {
      customerInfo: customerInfo,
      items: cart.map(item => ({
        productID: item.productID,
        quantity: item.quantity
      })),
      payment: {
        method: paymentMethod
      }
    };

    try {
      const response = await fetch(`${server_url}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();
      
      if (response.ok) {
        alert(`注文が完了しました！注文番号: ${result.orderId}`);
        setCart([]);
        setShowOrderForm(false);
        setCustomerInfo({ name: '', address: '', contactInfo: '' });
      } else {
        alert(`注文エラー: ${result.error}`);
      }
    } catch (error) {
      alert('注文処理中にエラーが発生しました');
      console.error('Order error:', error);
    }
  };

  const handleCustomerInfoChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // データ移行処理
  const migrateData = async () => {
    try {
      const response = await fetch(`${server_url}/api/migrate-data`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      alert(`${result.message} (${result.migrated || 0}件)`);
    } catch (error) {
      console.error('詳細エラー:', error);
      alert('データ移行エラー: ' + error.message);
    }
  };

  // 商品直接追加機能
  const [newProduct, setNewProduct] = useState({ id: '', name: '', price: '', stock: '' });

  const handleNewProductChange = (e) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({ ...prev, [name]: value }));
  };

  const addProduct = async () => {
    if (!newProduct.id || !newProduct.name || !newProduct.price) {
      alert('ID、商品名、価格は必須です');
      return;
    }

    try {
      const response = await fetch(`${server_url}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: parseInt(newProduct.id),
          name: newProduct.name,
          price: parseFloat(newProduct.price),
          stock: parseInt(newProduct.stock) || 100
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        alert('商品追加成功！');
        setNewProduct({ id: '', name: '', price: '', stock: '' });
      } else {
        alert(`商品追加エラー: ${result.error}`);
      }
    } catch (error) {
      alert('商品追加エラー: ' + error.message);
    }
  };

return (
    <div style={{ padding: '20px' }}>
      <h1>通信販売システム</h1>
      
      {/* カート表示 */}
      {cart.length > 0 && (
        <div style={{ background: '#f0f0f0', padding: '10px', marginBottom: '20px' }}>
          <h3>ショッピングカート ({cart.length}件)</h3>
          {cart.map(item => (
            <div key={item.productID} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
              <span>{item.name} - ¥{item.price} x </span>
              <input 
                type="number" 
                value={item.quantity} 
                onChange={(e) => updateCartQuantity(item.productID, parseInt(e.target.value))}
                style={{ width: '50px', margin: '0 5px' }}
                min="1"
              />
              <span>= ¥{item.price * item.quantity}</span>
              <button onClick={() => removeFromCart(item.productID)} style={{ marginLeft: '10px' }}>削除</button>
            </div>
          ))}
          <hr />
          <strong>合計: ¥{cart.reduce((total, item) => total + (item.price * item.quantity), 0)}</strong>
          <br />
          <button onClick={() => setShowOrderForm(true)} style={{ marginTop: '10px' }}>注文に進む</button>
        </div>
      )}

      <h2>商品検索・注文</h2>
      
      {/* 商品直接追加フォーム */}
      <div style={{ background: '#f5f5f5', padding: '15px', marginBottom: '15px', border: '1px solid #ddd' }}>
        <h3>新商品追加</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            name="id"
            placeholder="商品ID"
            value={newProduct.id}
            onChange={handleNewProductChange}
            style={{ width: '80px' }}
          />
          <input
            name="name"
            placeholder="商品名"
            value={newProduct.name}
            onChange={handleNewProductChange}
            style={{ width: '150px' }}
          />
          <input
            name="price"
            placeholder="価格"
            value={newProduct.price}
            onChange={handleNewProductChange}
            style={{ width: '100px' }}
          />
          <input
            name="stock"
            placeholder="在庫数(省略可)"
            value={newProduct.stock}
            onChange={handleNewProductChange}
            style={{ width: '120px' }}
          />
          <button onClick={addProduct} style={{ background: 'green', color: 'white', padding: '5px 15px' }}>
            商品追加
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <button onClick={migrateData} style={{ background: 'orange', marginRight: '10px' }}>
          TestTableデータを商品DBに移行
        </button>
        <span style={{ fontSize: '12px', color: '#666' }}>
          ※初回のみ実行してください
        </span>
      </div>
      <input
        type="text"
        placeholder="商品名で検索"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <button onClick={handleSearch}>検索</button>
      <table border="1" style={{ marginTop: '10px' }}>
        <thead>
          <tr>
            <th>商品ID</th>
            <th>商品名</th>
            <th>価格</th>
            <th>在庫</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {searchResults.length > 0 ? (
            searchResults.map((item, index) => {
              console.log(`商品${index}:`, item);
              return (
                <tr key={item.productId || index}>
                  <td>{item.productId}</td>
                  <td>{item.name}</td>
                  <td>¥{item.price}</td>
                  <td>{item.stock}</td>
                  <td>
                    <button 
                      onClick={() => addToCart(item)}
                      disabled={item.stock <= 0}
                    >
                      {item.stock > 0 ? 'カートに追加' : '在庫なし'}
                    </button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="5">
                {searchQuery ? `"${searchQuery}" の検索結果が見つかりません` : '商品を検索してください'}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* 注文フォーム */}
      {showOrderForm && (
        <div style={{ 
          position: 'fixed', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          background: 'white', 
          border: '2px solid #333', 
          padding: '20px',
          zIndex: 1000,
          maxWidth: '500px',
          width: '90%'
        }}>
          <h3>注文情報入力</h3>
          
          <h4>お客様情報</h4>
          <div style={{ marginBottom: '10px' }}>
            <label>お名前:</label><br />
            <input 
              type="text" 
              name="name"
              value={customerInfo.name}
              onChange={handleCustomerInfoChange}
              style={{ width: '100%', padding: '5px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>住所:</label><br />
            <textarea 
              name="address"
              value={customerInfo.address}
              onChange={handleCustomerInfoChange}
              style={{ width: '100%', padding: '5px', height: '60px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>連絡先:</label><br />
            <input 
              type="text" 
              name="contactInfo"
              value={customerInfo.contactInfo}
              onChange={handleCustomerInfoChange}
              style={{ width: '100%', padding: '5px' }}
            />
          </div>

          <h4>支払い方法</h4>
          <select 
            value={paymentMethod} 
            onChange={(e) => setPaymentMethod(e.target.value)}
            style={{ width: '100%', padding: '5px', marginBottom: '10px' }}
          >
            <option value="bank_transfer">銀行振込</option>
            <option value="convenience_store">コンビニ決済</option>
            <option value="cash_on_delivery">代金引換</option>
            <option value="credit_card">クレジットカード</option>
          </select>

          <h4>注文内容確認</h4>
          {cart.map(item => (
            <div key={item.productID} style={{ marginBottom: '5px' }}>
              {item.name} x {item.quantity} = ¥{item.price * item.quantity}
            </div>
          ))}
          <hr />
          <strong>合計金額: ¥{cart.reduce((total, item) => total + (item.price * item.quantity), 0)}</strong>

          <div style={{ marginTop: '20px' }}>
            <button onClick={handleOrder} style={{ marginRight: '10px' }}>注文確定</button>
            <button onClick={() => setShowOrderForm(false)}>キャンセル</button>
          </div>
        </div>
      )}

      <hr style={{ margin: '20px 0' }} />

      <h2>商品リスト</h2>
      <table border="1">
        <thead>
          <tr>
            <th>ID</th><th>画像</th><th>Name</th><th>Price</th><th>操作</th>
          </tr>
        </thead>
        <tbody>
          {data.map(item => (
            <tr key={item.ID}>
              <td>{item.ID}</td>
              <td>
                <img
                  src={`${server_url}/images/${item.ID}.jpg?${Date.now()}`}
                  alt={`${item.Name}の画像`}
                  style={{ width: '60px', height: '60px', objectFit: 'cover', display: 'block',border: '1px solid #ccc' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `${server_url}/images/placeholder.jpg`;
                  }}
                />
              </td>
              <td>
                <input
                  name="name"
                  value={editedItems[item.ID]?.name ?? ''}
                  onChange={(e) => handleEditChange(item.ID, e)}
                />
              </td>
              <td>
                <input
                  name="price"
                  value={editedItems[item.ID]?.price ?? ''}
                  onChange={(e) => handleEditChange(item.ID, e)}
                />
              </td>
              <td>
                <button onClick={() => handleUpdate(item.ID)}>更新</button>
                <button onClick={() => handleDelete(item.ID)}>削除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>新しいデータを追加</h3>
      <input
        name="id"
        placeholder="ID"
        value={newItem.id}
        onChange={handleNewChange}
      />
      <input
        name="name"
        placeholder="名前"
        value={newItem.name}
        onChange={handleNewChange}
      />
      <input
        name="price"
        placeholder="価格"
        value={newItem.price}
        onChange={handleNewChange}
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files[0])}
        ref={fileInputRef} 
      />
      <button onClick={handleAdd}>追加</button>
    </div>
  );
}

export default App;
