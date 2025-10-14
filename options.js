// options.js

// キーは、カテゴリの配列を保存するために使用します
const CATEGORIES_STORAGE_KEY = 'bookmarkScribeCategories';

// DOM要素の取得
const categoryList = document.getElementById('category-list');
const newCategoryInput = document.getElementById('new-category-input');
const addCategoryButton = document.getElementById('add-category-btn');

// 編集モーダル関連のDOM (options.htmlにも追加が必要です)
const editModal = document.getElementById('edit-modal');
const editCategoryInput = document.getElementById('edit-category-input');
const saveEditBtn = document.getElementById('save-category-edit-btn');
const closeEditBtn = document.getElementById('close-category-edit-btn');
let editingCategoryId = null; // 編集対象のカテゴリIDを保持

// ==========================================================
// 1. データの読み込みと表示
// ==========================================================

/**
 * IDベースのカテゴリを読み込み、UIに表示する
 */
async function loadAndDisplayCategories() {
    // リストをクリア
    categoryList.innerHTML = ''; 

    const result = await chrome.storage.local.get(CATEGORIES_STORAGE_KEY);
    // カテゴリは {id: 'cat_...', name: '名前'} の配列
    const categories = result[CATEGORIES_STORAGE_KEY] || [];

    // リストコンテナにコレクションクラスを追加
    categoryList.classList.add('collection');

    if (categories.length === 0) {
        // コレクションアイテムとしてメッセージを表示
        const li = document.createElement('li');
        li.classList.add('collection-item');
        li.textContent = '現在、カテゴリはありません。';
        categoryList.appendChild(li);
        return;
    }

    // 各カテゴリをリストアイテムとして表示
    categories.forEach(category => {
        const li = document.createElement('li');
        li.classList.add('collection-item', 'category-item'); // カスタムクラスとコレクションアイテムクラス
        
        // Flexboxを使用して内容を横並びにするためのコンテナ
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';
        
        // カテゴリ名
        const nameSpan = document.createElement('span');
        nameSpan.textContent = category.name;

        // ボタンコンテナ
        const buttonDiv = document.createElement('div');
        
        // 編集ボタンの作成
        const editBtn = document.createElement('button');
        editBtn.innerHTML = '<i class="material-icons">edit</i>';
        editBtn.classList.add('waves-effect', 'waves-light', 'btn-small');
        editBtn.style.marginRight = '0px'; // ボタン間の余白
        editBtn.onclick = () => openEditModal(category.id, category.name);

        // 削除ボタンの作成
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<i class="material-icons">delete</i>';
        deleteBtn.classList.add('waves-effect', 'waves-light', 'btn-small', 'red', 'lighten-1');
        deleteBtn.onclick = () => deleteCategory(category.id);
        
        // 要素を組み込む
        buttonDiv.appendChild(editBtn);
        buttonDiv.appendChild(deleteBtn);
        
        li.appendChild(nameSpan);
        li.appendChild(buttonDiv);
        categoryList.appendChild(li);
    });
}


// ==========================================================
// 2. データの保存（追加・削除・編集）
// ==========================================================

/**
 * 一意なIDを生成する
 */
function generateUniqueId() {
    // タイムスタンプをベースにしたシンプルなID
    return 'cat_' + Date.now();
}

/**
 * 新しいカテゴリをストレージに追加する
 */
async function addCategory() {
    const newCategoryName = newCategoryInput.value.trim();

    if (!newCategoryName) {
        alert('カテゴリ名を入力してください。');
        return;
    }
    
    const result = await chrome.storage.local.get(CATEGORIES_STORAGE_KEY);
    let categories = result[CATEGORIES_STORAGE_KEY] || [];

    // 名前での重複チェック
    if (categories.some(c => c.name === newCategoryName)) {
        alert(`"${newCategoryName}" は既に追加されています。`);
        return;
    }

    // 新しいカテゴリオブジェクトを作成
    const newCategory = {
        id: generateUniqueId(),
        name: newCategoryName
    };

    // 追加して保存
    categories.push(newCategory);
    await chrome.storage.local.set({ [CATEGORIES_STORAGE_KEY]: categories });

    newCategoryInput.value = '';
    loadAndDisplayCategories();
}

/**
 * 指定されたIDのカテゴリを削除する
 */
async function deleteCategory(idToDelete) {
    if (!confirm('このカテゴリを削除しても、既存のブックマークのカテゴリIDは残ります。よろしいですか？')) {
        return;
    }
    
    const result = await chrome.storage.local.get(CATEGORIES_STORAGE_KEY);
    let categories = result[CATEGORIES_STORAGE_KEY] || [];

    // 削除するカテゴリを除外した新しい配列を作成
    const updatedCategories = categories.filter(category => category.id !== idToDelete);

    // 更新されたリストを保存
    await chrome.storage.local.set({ [CATEGORIES_STORAGE_KEY]: updatedCategories });

    loadAndDisplayCategories();
}

/**
 * 編集モーダルを開く
 */
function openEditModal(id, name) {
    editingCategoryId = id;
    editCategoryInput.value = "";
    editModal.style.display = 'block';
}

/**
 * 編集内容を保存する
 */
async function saveCategoryEdit() {
    const newName = editCategoryInput.value.trim();

    if (!newName) {
        alert('新しいカテゴリ名を入力してください。');
        return;
    }
    if (!editingCategoryId) return;

    const result = await chrome.storage.local.get(CATEGORIES_STORAGE_KEY);
    let categories = result[CATEGORIES_STORAGE_KEY] || [];

    // 既存のカテゴリオブジェクトを検索し、名前を更新
    const categoryToUpdate = categories.find(c => c.id === editingCategoryId);
    if (categoryToUpdate) {
        categoryToUpdate.name = newName;
    } else {
        alert('エラー: 編集対象のカテゴリが見つかりません。');
        return;
    }

    // 更新されたリストを保存
    await chrome.storage.local.set({ [CATEGORIES_STORAGE_KEY]: categories });

    editModal.style.display = 'none';
    loadAndDisplayCategories();
}


// ==========================================================
// 3. イベントリスナーの設定と初期化
// ==========================================================

// 「追加」ボタンにイベントリスナーを設定
addCategoryButton.addEventListener('click', addCategory);

// Enterキーでの追加
newCategoryInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addCategory();
    }
});

// 編集モーダル関連
saveEditBtn.addEventListener('click', saveCategoryEdit);
closeEditBtn.addEventListener('click', () => {
    editModal.style.display = 'none';
});

// 画面ロード時にカテゴリを読み込み表示
loadAndDisplayCategories();