// list.js

const CATEGORIES_STORAGE_KEY = 'bookmarkScribeCategories';
const BOOKMARKS_STORAGE_KEY = 'scribeBookmarks';
const DEFAULT_CATEGORY_ID = 'cat_uncategorized';

// DOM要素の取得 (一部options.htmlに追加が必要です)
const bookmarkListDiv = document.getElementById('bookmark-list');
const searchInput = document.getElementById('search-input');
const filterCategorySelect = document.getElementById('filter-category-select');

// 編集モーダル関連のDOM
const editModal = document.getElementById('edit-modal');
const editTitle = document.getElementById('edit-title');
const editUrl = document.getElementById('edit-url');
const editCategorySelect = document.getElementById('edit-category-select');
const editSummaryInput = document.getElementById('edit-summary-input');
const saveEditBtn = document.getElementById('save-edit-btn');
const closeEditBtn = document.getElementById('close-edit-btn');
const editingUrl = document.getElementById('editing-url');

let allBookmarksData = []; // 全てのブックマークデータ（フィルタリング前）
let categoryMap = {}; // IDと名前の対応マップ { 'cat_001': 'APIリファレンス', ... }

// ==========================================================
// 1. 初期化: カテゴリの読み込み
// ==========================================================

/**
 * ストレージから全カテゴリを読み込み、マップを作成し、フィルタ/編集ドロップダウンに設定する
 */
async function loadCategoriesAndMap() {
    const result = await chrome.storage.local.get(CATEGORIES_STORAGE_KEY);
    const categories = result[CATEGORIES_STORAGE_KEY] || [];

    // 1. マップの作成とデフォルトカテゴリの追加
    categoryMap = { [DEFAULT_CATEGORY_ID]: '未分類' };
    categories.forEach(c => {
        categoryMap[c.id] = c.name;
    });

    // 2. フィルタ用ドロップダウンの設定
    filterCategorySelect.innerHTML = '<option value="">全てのカテゴリ</option>';
    editCategorySelect.innerHTML = `<option value="${DEFAULT_CATEGORY_ID}">-- 未分類 --</option>`;

    for (const id in categoryMap) {
        if (id === DEFAULT_CATEGORY_ID) continue; // 未分類は最初に追加済み

        // フィルタ用
        const filterOption = document.createElement('option');
        filterOption.value = id;
        filterOption.textContent = categoryMap[id];
        filterCategorySelect.appendChild(filterOption);

        // 編集用
        const editOption = document.createElement('option');
        editOption.value = id;
        editOption.textContent = categoryMap[id];
        editCategorySelect.appendChild(editOption);
    }
}

// ==========================================================
// 2. データ操作 (削除・編集)
// ==========================================================

/**
 * 指定されたURLのブックマークを削除する
 */
async function deleteBookmark(url) {
    if (!confirm('このブックマークを完全に削除してもよろしいですか？')) {
        return;
    }

    const result = await chrome.storage.local.get(BOOKMARKS_STORAGE_KEY);
    let allBookmarks = result[BOOKMARKS_STORAGE_KEY] || {};
    delete allBookmarks[url];

    await chrome.storage.local.set({ [BOOKMARKS_STORAGE_KEY]: allBookmarks });
    loadAndDisplayBookmarks();
}

/**
 * 編集モーダルを開き、データをセットする
 */
function openEditModal(bookmark) {
    editTitle.value = bookmark.title;
    editUrl.value = bookmark.url;
    // カテゴリIDを設定
    editCategorySelect.value = bookmark.categoryId || DEFAULT_CATEGORY_ID; 
    editSummaryInput.value = bookmark.summary;
    editingUrl.value = bookmark.url;

    editModal.style.display = 'block';
}

/**
 * 編集された内容をストレージに保存する
 */
async function saveEdit() {
    const url = editingUrl.value;
    const title = editTitle.value.trim();
    const categoryId = editCategorySelect.value; // 👈 IDを取得
    const summary = editSummaryInput.value.trim();

    if (!title || !categoryId || !summary) {
        alert('タイトル、カテゴリ、サマリーは必須です。');
        return;
    }

    const result = await chrome.storage.local.get(BOOKMARKS_STORAGE_KEY);
    let allBookmarks = result[BOOKMARKS_STORAGE_KEY] || {};

    if (!allBookmarks[url]) {
        alert('エラー: 編集対象のブックマークが見つかりません。');
        return;
    }

    // データを更新
    allBookmarks[url].title = title;
    allBookmarks[url].categoryId = categoryId; // 👈 IDを保存
    allBookmarks[url].summary = summary;
    allBookmarks[url].lastUpdated = new Date().toISOString();

    await chrome.storage.local.set({ [BOOKMARKS_STORAGE_KEY]: allBookmarks });

    editModal.style.display = 'none';
    loadAndDisplayBookmarks();
}

// ==========================================================
// 3. UI: リストの表示とレンダリング
// ==========================================================

async function loadAndDisplayBookmarks() {
    // カテゴリマップの準備を待つ
    await loadCategoriesAndMap(); 
    
    const result = await chrome.storage.local.get(BOOKMARKS_STORAGE_KEY);
    allBookmarksData = Object.values(result[BOOKMARKS_STORAGE_KEY] || {});

    allBookmarksData.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));

    filterAndRenderList();
}

/**
 * 検索とフィルタに基づいてリストをフィルタリングし、HTMLをレンダリングする
 */
function filterAndRenderList() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategoryId = filterCategorySelect.value;
    
    const filteredBookmarks = allBookmarksData.filter(bookmark => {
        // 1. カテゴリフィルタ (IDでフィルタリング)
        if (selectedCategoryId && bookmark.categoryId !== selectedCategoryId) {
            return false;
        }

        // 2. 検索ワードフィルタ
        if (searchTerm) {
            const categoryName = categoryMap[bookmark.categoryId] || 'カテゴリ不明';
            
            // 検索対象にカテゴリ名も追加
            const searchTargets = [
                bookmark.title, 
                bookmark.url, 
                bookmark.summary, 
                categoryName 
            ].join(' ').toLowerCase();

            return searchTargets.includes(searchTerm);
        }

        return true;
    });

    bookmarkListDiv.innerHTML = ''; 

    if (filteredBookmarks.length === 0) {
        bookmarkListDiv.innerHTML = '<p>該当するブックマークは見つかりませんでした。</p>';
        return;
    }

    // リストのレンダリング
    filteredBookmarks.forEach(bookmark => {
        const itemDiv = document.createElement('div');
        itemDiv.style.border = '1px solid #ccc';
        itemDiv.style.marginBottom = '10px';
        itemDiv.style.padding = '10px';
        
        // カテゴリ名を表示
        const categoryName = categoryMap[bookmark.categoryId] || 'カテゴリ不明 (ID: ' + bookmark.categoryId + ')';
        
        itemDiv.innerHTML += `
            <h3><a href="${bookmark.url}" target="_blank">${bookmark.title}</a></h3>
            <p><strong>カテゴリ:</strong> ${categoryName}</p>
            <p><strong>サマリー:</strong> ${bookmark.summary}</p>
            <small><strong>URL:</strong> ${bookmark.url}</small><br>
            <small><strong>最終更新日:</strong> ${new Date(bookmark.lastUpdated).toLocaleString()}</small>
        `;

        // ボタンのイベント設定
        const editBtn = document.createElement('button');
        editBtn.textContent = '編集';
        editBtn.style.marginRight = '10px';
        editBtn.onclick = () => openEditModal(bookmark);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '削除';
        deleteBtn.onclick = () => deleteBookmark(bookmark.url);

        itemDiv.appendChild(editBtn);
        itemDiv.appendChild(deleteBtn);
        
        bookmarkListDiv.appendChild(itemDiv);
    });
}

// ==========================================================
// 4. イベントリスナーと初期化
// ==========================================================

searchInput.addEventListener('input', filterAndRenderList);
filterCategorySelect.addEventListener('change', filterAndRenderList);

saveEditBtn.addEventListener('click', saveEdit);
closeEditBtn.addEventListener('click', () => {
    editModal.style.display = 'none';
});

// 画面ロード時に実行
loadAndDisplayBookmarks();