// popup.js

const CATEGORIES_STORAGE_KEY = 'bookmarkScribeCategories';
const BOOKMARKS_STORAGE_KEY = 'scribeBookmarks';
const DEFAULT_CATEGORY_ID = 'cat_uncategorized';

// DOM要素の取得
const tabTitleEl = document.getElementById('tab-title'); // 👈 input要素になった
const tabUrlEl = document.getElementById('tab-url');     // 👈 input要素になった
const categorySelect = document.getElementById('category-select');
const summaryInput = document.getElementById('summary-input');
const saveButton = document.getElementById('save-btn');
const addCategoryButton = document.getElementById('add-category-btn'); // 新規カテゴリボタン
// let currentTab = {}; // 削除: グローバル変数として保持せず、DOMから直接読み取る

// ==========================================================
// 1. 初期化
// ==========================================================

/**
 * 現在のタブ情報を取得し、UI（Inputフィールド）に設定する
 */
async function loadCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // 👈 取得した値をInputフィールドに設定
    tabTitleEl.value = tab.title;
    tabUrlEl.value = tab.url;

    // Materializeのinputラベルをアクティブにする
    M.updateTextFields();
}

/**
 * 設定画面からカテゴリリストを読み込み、ドロップダウンに設定する
 */
async function loadCategoriesToSelect() {
    const result = await chrome.storage.local.get(CATEGORIES_STORAGE_KEY);
    const categories = result[CATEGORIES_STORAGE_KEY] || [];

    // デフォルトオプション
    categorySelect.innerHTML = `<option value="${DEFAULT_CATEGORY_ID}">-- 未分類 --</option>`;

    if (categories.length > 0) {
        categories.forEach(category => {
            const option = document.createElement('option');
            // IDをvalueに、名前をtextContentに設定
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    } else {
        // カテゴリが設定されていない場合のメッセージ
        categorySelect.innerHTML += '<option disabled>設定画面でカテゴリを追加してください</option>';
    }
    
    // MaterializeのSelect要素を初期化
    M.FormSelect.init(categorySelect);
}

// ==========================================================
// 2. データ保存
// ==========================================================

/**
 * ブックマークデータ（サマリーとカテゴリ）をストレージに保存する
 */
async function saveBookmark() {
    // 👈 Inputフィールドから値を取得
    const title = tabTitleEl.value.trim();
    const url = tabUrlEl.value.trim();
    const categoryId = categorySelect.value || DEFAULT_CATEGORY_ID; 
    const summary = summaryInput.value.trim();

    if (!url || !title || !summary) {
        alert('タイトル、URL、サマリーの全てを入力してください。');
        return;
    }

    const result = await chrome.storage.local.get(BOOKMARKS_STORAGE_KEY);
    const allBookmarks = result[BOOKMARKS_STORAGE_KEY] || {};

    // URLをキーとしてデータを追加・上書き
    const newBookmarkEntry = {
        title: title, // 👈 編集されたタイトル
        url: url,     // 👈 編集されたURL (キーとなる)
        summary: summary,
        categoryId: categoryId,
        lastUpdated: new Date().toISOString()
    };
    
    allBookmarks[url] = newBookmarkEntry;

    await chrome.storage.local.set({ [BOOKMARKS_STORAGE_KEY]: allBookmarks });

    alert('ブックマークが保存されました！');
    window.close();
}

// ==========================================================
// 3. イベントリスナーと初期化
// ==========================================================

saveButton.addEventListener('click', saveBookmark);

addCategoryButton.addEventListener('click', () => {
    // options.htmlを新しいタブで開く
    chrome.tabs.create({ url: 'options.html' }); 
});

loadCurrentTab();
loadCategoriesToSelect();