// list.js


// DOM要素の取得
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
const exportCsvBtn = document.getElementById('export-csv-btn');
const importCsvBtn = document.getElementById('import-csv-btn');
const importFileInput = document.getElementById('import-file-input'); 

let allBookmarksData = []; // 全てのブックマークデータ（フィルタリング前）
let categoryMap = {}; // IDと名前の対応マップ { 'cat_001': 'APIリファレンス', 'cat_uncategorized': '未分類', ... }

// ==========================================================
// 1. 初期化: カテゴリの読み込みとマップ作成
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
    
    // 👈 修正点: 未分類カテゴリのオプションを明示的に追加
    const uncategorizedOption = document.createElement('option');
    uncategorizedOption.value = DEFAULT_CATEGORY_ID; // cat_uncategorized を値として設定
    uncategorizedOption.textContent = categoryMap[DEFAULT_CATEGORY_ID]; // '未分類'
    filterCategorySelect.appendChild(uncategorizedOption);

    editCategorySelect.innerHTML = `<option value="${DEFAULT_CATEGORY_ID}">-- 未分類 --</option>`;

    // 既存カテゴリを追加
    for (const id in categoryMap) {
        if (id === DEFAULT_CATEGORY_ID) continue; // 未分類は既に追加済みなのでスキップ

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
    
    // MaterializeのSelect要素を初期化/更新
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
    // 既存のブックマークデータをフォームにセット
    editTitle.value = bookmark.title;
    editUrl.value = bookmark.url;
    
    // カテゴリIDを設定
    editCategorySelect.value = bookmark.categoryId || DEFAULT_CATEGORY_ID; 
    
    // MaterializeのSelectを更新
    M.FormSelect.init(editCategorySelect);

    editSummaryInput.value = bookmark.summary;
    editingUrl.value = bookmark.url;

    // input要素のラベルをアクティブにする (Materializeの仕様対応)
    M.updateTextFields();

    editModal.style.display = 'block';
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
    allBookmarks[url].categoryId = categoryId;
    allBookmarks[url].summary = summary;
    allBookmarks[url].lastUpdated = new Date().toISOString();

    await chrome.storage.local.set({ [BOOKMARKS_STORAGE_KEY]: allBookmarks });

    editModal.style.display = 'none';
    loadAndDisplayBookmarks(); // リストを再読み込み
}

// ==========================================================
// 3. UI: リストの表示とレンダリング
// ==========================================================

async function loadAndDisplayBookmarks() {
    // カテゴリマップの準備を待つ
    await loadCategoriesAndMap(); 
    
    const result = await chrome.storage.local.get(BOOKMARKS_STORAGE_KEY);
    allBookmarksData = Object.values(result[BOOKMARKS_STORAGE_KEY] || {});

    // 最終更新日で新しい順にソート
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
            const categoryName = categoryMap[bookmark.categoryId] || 'import';
            
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
        bookmarkListDiv.innerHTML = '<p class="center-align">該当するブックマークは見つかりませんでした。</p>';
        return;
    }

    // リストのレンダリング
    filteredBookmarks.forEach(bookmark => {
        // カテゴリ名を取得
        const categoryName = categoryMap[bookmark.categoryId] || 'import';
        const formattedDate = new Date(bookmark.lastUpdated).toLocaleString();
        
        // Materializeのカードパネルを使用
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('card-panel', 'grey', 'lighten-5', 'z-depth-1', 'bookmark-item');

        // Materializeのグリッドで情報を整理
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

                <div class="col s3 right-align grey-text text-darken-1" style="font-size: 0.8rem; padding-top: 5px;">
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

        // 削除・編集ボタンをJSで作成し、アクションコンテナに追加
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

// 編集モーダルのボタンイベント
saveEditBtn.addEventListener('click', saveEdit);
closeEditBtn.addEventListener('click', () => {
    editModal.style.display = 'none';
});


// 👈 CSVエクスポートボタンのイベントリスナーを追加
exportCsvBtn.addEventListener('click', () => {
    // 現在フィルタリングされているデータをエクスポート関数に渡す
    // NOTE: filterAndRenderListでフィルタリングされたデータが欲しいが、
    // ここではグローバルに保持されていないため、再フィルタリングまたは全データを渡す必要がある。
    // 簡単のため、現在は全データを使用するか、またはフィルタリングロジックを再実行する。
    
    // ここでは、リスト表示に使われた最新のフィルタリング結果の配列を再取得
    const bookmarksToExport = getCurrentFilteredBookmarks(); 
    
    exportToCsv(bookmarksToExport, categoryMap);
});

// 👈 getCurrentFilteredBookmarks関数を実装（list.js内に追加）
/**
 * 現在の検索/フィルタリング条件に合致するブックマークリストを返す
 */
function getCurrentFilteredBookmarks() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategoryId = filterCategorySelect.value;
    
    return allBookmarksData.filter(bookmark => {
        // 1. カテゴリフィルタ
        if (selectedCategoryId && bookmark.categoryId !== selectedCategoryId) {
            return false;
        }

        // 2. 検索ワードフィルタ
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

//👈 CSVインポートボタンのイベントリスナーを追加
importCsvBtn.addEventListener('click', () => {
    // 隠されたファイル選択ダイアログを表示
    importFileInput.click();
});

// 👈 ファイル選択後のイベントリスナー
importFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    
    // ファイル読み込みが完了したら実行
    reader.onload = async (e) => {
        const csvText = e.target.result;
        try {
            // importCsvData関数（csv_import.js）を呼び出す
            await importCsvData(csvText, categoryMap);
        } catch (error) {
            console.error('CSVインポートエラー:', error);
            alert('CSVファイルの読み込み中にエラーが発生しました。コンソールを確認してください。');
        }
    };

    // ファイルをテキストとして読み込む
    reader.readAsText(file);
});

// 画面ロード時に実行
document.addEventListener('DOMContentLoaded', loadAndDisplayBookmarks);