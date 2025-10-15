// popup.js
const tabTitleEl = document.getElementById('tab-title');
const tabUrlEl = document.getElementById('tab-url');
const categorySelect = document.getElementById('category-select');
const summaryInput = document.getElementById('summary-input');
const saveButton = document.getElementById('save-btn');
const addCategoryButton = document.getElementById('add-category-btn');
// ==========================================================
// 1. 初期化
// ==========================================================

/**
 * 現在のタブ情報を取得し、UI（Inputフィールド）に設定する
 */
async function loadCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    tabTitleEl.value = tab.title;
    tabUrlEl.value = tab.url;

    M.updateTextFields();
}
/**
 * 設定画面からカテゴリリストを読み込み、ドロップダウンに設定する
 */
async function loadCategoriesToSelect() {
    const result = await chrome.storage.local.get(CATEGORIES_STORAGE_KEY);
    const categories = result[CATEGORIES_STORAGE_KEY] || [];

    categorySelect.innerHTML = `<option value="${DEFAULT_CATEGORY_ID}">-- Unclassified --</option>`;

    if (categories.length > 0) {
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    } else {
        categorySelect.innerHTML += '<option disabled>Add label in setting screen</option>';
    }
    
    M.FormSelect.init(categorySelect);
}
// ==========================================================
// 2. データ保存
// ==========================================================
/**
 * ブックマークデータ（サマリーとカテゴリ）をストレージに保存する
 */
async function saveBookmark() {
    const title = tabTitleEl.value.trim();
    const url = tabUrlEl.value.trim();
    const categoryId = categorySelect.value || DEFAULT_CATEGORY_ID; 
    const summary = summaryInput.value.trim();

    if (!url || !title || !summary) {
        alert('Please enter a title, URL, and summary.');
        return;
    }

    const result = await chrome.storage.local.get(BOOKMARKS_STORAGE_KEY);
    const allBookmarks = result[BOOKMARKS_STORAGE_KEY] || {};

    const newBookmarkEntry = {
        title: title,
        url: url,
        summary: summary,
        categoryId: categoryId,
        lastUpdated: new Date().toISOString()
    };
    
    allBookmarks[url] = newBookmarkEntry;

    await chrome.storage.local.set({ [BOOKMARKS_STORAGE_KEY]: allBookmarks });

    alert('Bookmark saved!');
    window.close();
}
// ==========================================================
// 3. イベントリスナーと初期化
// ==========================================================
saveButton.addEventListener('click', saveBookmark);
addCategoryButton.addEventListener('click', () => {
    chrome.tabs.create({ url: 'options.html' }); 
});

loadCurrentTab();
loadCategoriesToSelect();