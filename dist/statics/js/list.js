// list.js
const bookmarkListDiv = document.getElementById('bookmark-list');
const searchInput = document.getElementById('search-input');
const filterCategorySelect = document.getElementById('filter-category-select');
const editModal = document.getElementById('edit-modal');
const editTitle = document.getElementById('edit-title');
const editUrl = document.getElementById('edit-url');
const editCategorySelect = document.getElementById('edit-category-select');
const editSummaryInput = document.getElementById('edit-summary-input');
const saveEditBtn = document.getElementById('save-edit-btn');
const closeEditBtn = document.getElementById('close-edit-btn');
const editingUrl = document.getElementById('editing-url');
const exportCsvBtn = document.getElementById('export-csv-btn');
const importCsvBtn = document.getElementById('import-csv-btn');
const importFileInput = document.getElementById('import-file-input'); 
const importPreviewModal = document.getElementById('import-preview-modal');
const importNewCount = document.getElementById('import-new-count');
const importUpdateCount = document.getElementById('import-update-count');
const importSkippedCount = document.getElementById('import-skipped-count');
const importNewList = document.getElementById('import-new-list');
const importUpdateList = document.getElementById('import-update-list');
const executeImportBtn = document.getElementById('execute-import-btn');
const cancelImportBtn = document.getElementById('cancel-import-btn');

let importPreviewData = {};
let allBookmarksData = [];
let categoryMap = {};
// ==========================================================
// 1. 初期化: カテゴリの読み込みとマップ作成
// ==========================================================
/**
 * ストレージから全カテゴリを読み込み、マップを作成し、フィルタ/編集ドロップダウンに設定する
 */
async function loadCategoriesAndMap() {
    const result = await chrome.storage.local.get(CATEGORIES_STORAGE_KEY);
    const categories = result[CATEGORIES_STORAGE_KEY] || [];

    categoryMap = { [DEFAULT_CATEGORY_ID]: 'Unclassified' };
    categories.forEach(c => {
        categoryMap[c.id] = c.name;
    });

    filterCategorySelect.innerHTML = '<option value="">All Labels</option>';
    
    const uncategorizedOption = document.createElement('option');
    uncategorizedOption.value = DEFAULT_CATEGORY_ID;
    uncategorizedOption.textContent = categoryMap[DEFAULT_CATEGORY_ID];
    filterCategorySelect.appendChild(uncategorizedOption);

    editCategorySelect.innerHTML = `<option value="${DEFAULT_CATEGORY_ID}">-- Unclassified --</option>`;

    for (const id in categoryMap) {
        if (id === DEFAULT_CATEGORY_ID) continue;

        const filterOption = document.createElement('option');
        filterOption.value = id;
        filterOption.textContent = categoryMap[id];
        filterCategorySelect.appendChild(filterOption);

        const editOption = document.createElement('option');
        editOption.value = id;
        editOption.textContent = categoryMap[id];
        editCategorySelect.appendChild(editOption);
    }
    
    M.FormSelect.init(filterCategorySelect);
    M.FormSelect.init(editCategorySelect);
}
// ==========================================================
// 2. データ操作 (削除・編集)
// ==========================================================
/**
 * 指定されたURLのブックマークを削除する
 */
async function deleteBookmark(url) {
    if (!confirm('Are you sure you want to permanently delete this bookmark?')) {
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
    
    editCategorySelect.value = bookmark.categoryId || DEFAULT_CATEGORY_ID; 
    
    M.FormSelect.init(editCategorySelect);

    editSummaryInput.value = bookmark.summary;
    editingUrl.value = bookmark.url;

    M.updateTextFields();
    editModal.style.display = 'block';
    setTimeout(() => {
        M.textareaAutoResize(editSummaryInput);
    }, 10);
}
/**
 * 編集された内容をストレージに保存する
 */
async function saveEdit() {
    const url = editingUrl.value;
    const title = editTitle.value.trim();
    const categoryId = editCategorySelect.value;
    const summary = editSummaryInput.value.trim();

    if (!title || !categoryId || !summary) {
        alert('Title, category, and summary are required.');
        return;
    }

    const result = await chrome.storage.local.get(BOOKMARKS_STORAGE_KEY);
    let allBookmarks = result[BOOKMARKS_STORAGE_KEY] || {};

    if (!allBookmarks[url]) {
        alert('Error: The bookmark to edit was not found.');
        return;
    }

    allBookmarks[url].title = title;
    allBookmarks[url].categoryId = categoryId;
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
        if (selectedCategoryId && bookmark.categoryId !== selectedCategoryId) {
            return false;
        }

        if (searchTerm) {
            const categoryName = categoryMap[bookmark.categoryId] || 'import';
            
            const searchTargets = [
                bookmark.title, 
                bookmark.summary, 
                categoryName 
            ].join(' ').toLowerCase();

            return searchTargets.includes(searchTerm);
        }

        return true;
    });

    bookmarkListDiv.innerHTML = ''; 

    if (filteredBookmarks.length === 0) {
        bookmarkListDiv.innerHTML = '<p class="center-align">No matching bookmarks found.</p>';
        return;
    }

    filteredBookmarks.forEach(bookmark => {
        const categoryName = categoryMap[bookmark.categoryId] || 'import';
        const formattedDate = new Date(bookmark.lastUpdated).toLocaleString();
        
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('card-panel', 'grey', 'lighten-5', 'z-depth-1', 'bookmark-item');

        itemDiv.innerHTML = `
            <div class="row" style="margin-bottom: 5px;">
                <div class="col s5">
                    <h5 style="margin: 0; font-size: 1.2rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        <a href="${bookmark.url}" target="_blank" class="teal-text text-darken-2">${bookmark.title}</a>
                    </h5>
                </div>
                
                <div class="col s2 center-align">
                    <span class="chip blue-grey lighten-4">${categoryName}</span>
                </div>

                <div class="col s3 right-align grey-text text-darken-1" style="font-size: 0.8rem; display: flex; align-items: center; justify-content: flex-end;">
                    <i class="tiny material-icons">access_time</i> ${formattedDate}
                </div>
                
                <div class="col s2 right-align" id="actions-${bookmark.url.replace(/[^a-zA-Z0-9]/g, '-')}" style="padding-top: 0;">
                    </div>
            </div>
            
            <div class="row" style="margin-bottom: 0;">
                <div class="col s12 grey-text text-darken-3" style="font-size: 0.9rem; padding-top: 0;">
                    ${bookmark.summary}
                </div>
            </div>
        `;

        const actionDiv = itemDiv.querySelector(`#actions-${bookmark.url.replace(/[^a-zA-Z0-9]/g, '-')}`);

        const editBtn = document.createElement('button');
        editBtn.innerHTML = '<i class="material-icons">edit</i>';
        editBtn.classList.add('waves-effect', 'waves-light', 'btn-small');
        editBtn.style.marginRight = '5px';
        editBtn.onclick = () => openEditModal(bookmark);

        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<i class="material-icons">delete</i>';
        deleteBtn.classList.add('waves-effect', 'waves-light', 'btn-small', 'red', 'lighten-1');
        deleteBtn.onclick = () => deleteBookmark(bookmark.url);

        actionDiv.appendChild(editBtn);
        actionDiv.appendChild(deleteBtn);
        
        bookmarkListDiv.appendChild(itemDiv);
    });
}
// ==========================================================
// 4. イベントリスナーと初期化
// ==========================================================
// 検索ボックスとフィルタの変更時にリストを更新
searchInput.addEventListener('input', filterAndRenderList);
filterCategorySelect.addEventListener('change', filterAndRenderList);

saveEditBtn.addEventListener('click', saveEdit);
closeEditBtn.addEventListener('click', () => {
    editModal.style.display = 'none';
});

exportCsvBtn.addEventListener('click', () => {
    const bookmarksToExport = getCurrentFilteredBookmarks(); 
    
    exportToCsv(bookmarksToExport, categoryMap);
});
/**
 * 現在の検索/フィルタリング条件に合致するブックマークリストを返す
 */
function getCurrentFilteredBookmarks() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategoryId = filterCategorySelect.value;
    
    return allBookmarksData.filter(bookmark => {
        if (selectedCategoryId && bookmark.categoryId !== selectedCategoryId) {
            return false;
        }

        if (searchTerm) {
            const categoryName = categoryMap[bookmark.categoryId] || 'import';
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
}
// CSVインポートボタンのイベントリスナー
importCsvBtn.addEventListener('click', () => {
    importFileInput.click();
});
// ファイル選択後のイベントリスナー
importFileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = async (e) => {
        const csvText = e.target.result;
        try {
            const preview = await generateImportPreview(csvText);
            
            importPreviewData = {
                newData: preview.newData,
                updateData: preview.updateData,
            };

            renderImportPreview(preview);

        } catch (error) {
            console.error('CSV import error:', error);
            alert('An error occurred while reading the CSV file. Please check the console.');
        }
    };
    reader.readAsText(file);
    
    event.target.value = '';
});
/**
 * プレビューモーダルにインポート結果を描画する
 */
function renderImportPreview({ newData, updateData, skippedCount }) {
    importNewCount.textContent = newData.length;
    importUpdateCount.textContent = updateData.length;
    importSkippedCount.textContent = skippedCount;

    importNewList.innerHTML = '';
    importUpdateList.innerHTML = '';

    if (newData.length > 0) {
        newData.forEach(item => {
            const li = document.createElement('li');
            li.className = 'collection-item';
            li.textContent = item.title;
            importNewList.appendChild(li);
        });
    } else {
        importNewList.innerHTML = '<li class="collection-item">No new data to add.</li>';
    }

    if (updateData.length > 0) {
        updateData.forEach(item => {
            const li = document.createElement('li');
            li.className = 'collection-item';
            li.textContent = item.title;
            importUpdateList.appendChild(li);
        });
    } else {
        importUpdateList.innerHTML = '<li class="collection-item">No data to update.</li>';
    }
    
    importPreviewModal.style.display = 'block';
}
// インポート実行ボタンのイベントリスナー
executeImportBtn.addEventListener('click', async () => {
    const { newData, updateData } = importPreviewData;

    if (!newData && !updateData) {
        alert('There is no data to import.');
        return;
    }

    try {
        const savedCount = await executeImport(newData, updateData, categoryMap);
        alert(`Import complete.\n\n- Items processed: ${savedCount} items`);
        
        importPreviewModal.style.display = 'none';
        loadAndDisplayBookmarks();

    } catch (error) {
        console.error('Import execution error:', error);
        alert('An error occurred during the import process.');
    }
});
// インポートキャンセルボタンのイベントリスナー
cancelImportBtn.addEventListener('click', () => {
    importPreviewModal.style.display = 'none';
    importPreviewData = {};
});

document.addEventListener('DOMContentLoaded', loadAndDisplayBookmarks);