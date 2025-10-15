// options.js
const categoryList = document.getElementById('category-list');
const newCategoryInput = document.getElementById('new-category-input');
const addCategoryButton = document.getElementById('add-category-btn');
const editModal = document.getElementById('edit-modal');
const editCategoryInput = document.getElementById('edit-category-input');
const saveEditBtn = document.getElementById('save-category-edit-btn');
const closeEditBtn = document.getElementById('close-category-edit-btn');
let editingCategoryId = null;
// ==========================================================
// 1. データの読み込みと表示
// ==========================================================
/**
 * IDベースのカテゴリを読み込み、UIに表示する
 */
async function loadAndDisplayCategories() {
    categoryList.innerHTML = ''; 

    const result = await chrome.storage.local.get(CATEGORIES_STORAGE_KEY);
    const categories = result[CATEGORIES_STORAGE_KEY] || [];

    categoryList.classList.add('collection');

    if (categories.length === 0) {
        const li = document.createElement('li');
        li.classList.add('collection-item');
        li.textContent = 'No labels added yet.';
        categoryList.appendChild(li);
        return;
    }

    categories.forEach(category => {
        const li = document.createElement('li');
        li.classList.add('collection-item', 'category-item');
        
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = category.name;

        const buttonDiv = document.createElement('div');
        
        const editBtn = document.createElement('button');
        editBtn.innerHTML = '<i class="material-icons">edit</i>';
        editBtn.classList.add('waves-effect', 'waves-light', 'btn-small');
        editBtn.style.marginRight = '0px';
        editBtn.onclick = () => openEditModal(category.id, category.name);

        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<i class="material-icons">delete</i>';
        deleteBtn.classList.add('waves-effect', 'waves-light', 'btn-small', 'red', 'lighten-1');
        deleteBtn.onclick = () => deleteCategory(category.id);
        
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
    return 'cat_' + Date.now();
}
/**
 * 新しいカテゴリをストレージに追加する
 */
async function addCategory() {
    const newCategoryName = newCategoryInput.value.trim();

    if (!newCategoryName) {
        alert('Please enter a label name.');
        return;
    }

    if (newCategoryName.length > CATEGORY_MAX_LENGTH) {
        alert(`Label name must be within ${CATEGORY_MAX_LENGTH} characters.`);
        return;
    }
    
    const result = await chrome.storage.local.get(CATEGORIES_STORAGE_KEY);
    let categories = result[CATEGORIES_STORAGE_KEY] || [];

    if (categories.some(c => c.name === newCategoryName)) {
        alert(`"${newCategoryName}" already exists.`);
        return;
    }

    const newCategory = {
        id: generateUniqueId(),
        name: newCategoryName
    };

    categories.push(newCategory);
    await chrome.storage.local.set({ [CATEGORIES_STORAGE_KEY]: categories });

    newCategoryInput.value = '';
    loadAndDisplayCategories();
}
/**
 * 指定されたIDのカテゴリを削除する
 */
async function deleteCategory(idToDelete) {
    if (!confirm('Deleting this label will not remove it from existing bookmarks. Are you sure?')) {
        return;
    }
    
    const result = await chrome.storage.local.get(CATEGORIES_STORAGE_KEY);
    let categories = result[CATEGORIES_STORAGE_KEY] || [];

    const updatedCategories = categories.filter(category => category.id !== idToDelete);

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
        alert('Please enter a new label name.');
        return;
    }

    if (newName.length > CATEGORY_MAX_LENGTH) {
        alert(`Label name must be within ${CATEGORY_MAX_LENGTH} characters.`);
        return;
    }

    if (!editingCategoryId) return;

    const result = await chrome.storage.local.get(CATEGORIES_STORAGE_KEY);
    let categories = result[CATEGORIES_STORAGE_KEY] || [];

    const categoryToUpdate = categories.find(c => c.id === editingCategoryId);
    if (categoryToUpdate) {
        categoryToUpdate.name = newName;
    } else {
        alert('Error: The label to edit was not found.');
        return;
    }

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