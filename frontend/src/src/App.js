import React, { useEffect, useState, useRef } from 'react';

const server_url = process.env.REACT_APP_API_URL

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

  // データ取得
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    fetch(`${server_url}api/TestTable`)
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

return (
    <div style={{ padding: '20px' }}>
      <h2>テストデータ</h2>
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
