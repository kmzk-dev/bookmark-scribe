// popup.js

const CATEGORIES_STORAGE_KEY = 'bookmarkScribeCategories';
const BOOKMARKS_STORAGE_KEY = 'scribeBookmarks';
const DEFAULT_CATEGORY_ID = 'cat_uncategorized'; // 未分類のID

// DOM要素の取得
const tabTitleEl = document.getElementById('tab-title');
const tabUrlEl = document.getElementById('tab-url');
const categorySelect = document.getElementById('category-select');
const summaryInput = document.getElementById('summary-input');
const saveButton = document.getElementById('save-btn');

let currentTab = {}; // 現在のタブ情報を保持するオブジェクト

// ==========================================================
// 1. 初期化
// ==========================================================

/**
 * 現在のタブ情報を取得し、UIに表示する
 */
async function loadCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    currentTab = { 
        title: tab.title, 
        url: tab.url 
    };

    tabTitleEl.textContent = currentTab.title;
    tabUrlEl.textContent = currentTab.url;
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
}

// ==========================================================
// 2. データ保存
// ==========================================================

/**
 * ブックマークデータ（サマリーとカテゴリ）をストレージに保存する
 */
async function saveBookmark() {
    // 選択されたのはカテゴリ名ではなくカテゴリID
    const categoryId = categorySelect.value || DEFAULT_CATEGORY_ID; 
    const summary = summaryInput.value.trim();
    const url = currentTab.url;

    if (!url || !summary) {
        alert('URLとサマリーの全てを入力してください。');
        return;
    }

    const result = await chrome.storage.local.get(BOOKMARKS_STORAGE_KEY);
    const allBookmarks = result[BOOKMARKS_STORAGE_KEY] || {};

    // 新しいブックマークデータを作成
    const newBookmarkEntry = {
        title: currentTab.title,
        url: url,
        summary: summary,
        categoryId: categoryId, // 👈 IDを保存
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
// 👈 新規カテゴリボタンの処理を追加
const addCategoryButton = document.getElementById('add-category-btn'); 

addCategoryButton.addEventListener('click', () => {
    // options.htmlを新しいタブで開く
    chrome.tabs.create({ url: 'options.html' }); 
});


loadCurrentTab();
loadCategoriesToSelect();