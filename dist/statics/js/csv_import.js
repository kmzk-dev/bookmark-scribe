// csv_import.js

/**
 * CSV文字列をパースし、ブックマークデータオブジェクトの配列に変換する
 * @param {string} csvText - 読み込まれたCSVファイルの内容
 * @returns {Array<Object>} パースされたブックマークデータの配列
 */
function parseCsv(csvText) {
    // 改行コード正規化 (CRLF -> LF)
    csvText = csvText.replace(/\r\n/g, '\n');

    // BOM (Byte Order Mark) の削除
    if (csvText.charCodeAt(0) === 0xFEFF) {
        csvText = csvText.substring(1);
    }

    const lines = csvText.trim().split('\n');
    if (lines.length <= 1) return []; // ヘッダー行のみ、または空の場合

    // ヘッダー行をスキップ (今回はヘッダー解析を省略)
    const dataLines = lines.slice(1);
    const importData = [];
    let skippedCount = 0;
    
    // 正規表現で fields をパース: ダブルクォート内のカンマと改行を無視
    // 正規表現: /,(?=(?:(?:[^"]*"){2})*[^"]*$)/
    // このパースは簡易的なものであり、厳密なCSV標準には対応していません
    const CSV_DELIMITER = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;

    dataLines.forEach((line, index) => {
        if (!line.trim()) return;

        // カンマ区切りで列に分割（"..."の内部のカンマは無視）
        const fields = line.split(CSV_DELIMITER).map(field => 
            // 前後のダブルクォートを削除し、エスケープされた "" を " に戻す
            field.trim().replace(/^"|"$/g, '').replace(/""/g, '"')
        );

        // 必須チェック: 2列目 (URL) と 1列目 (タイトル) が必須
        const title = fields[0] ? fields[0].trim() : '';
        const url = fields[1] ? fields[1].trim() : '';
        const summary = fields[2] ? fields[2].trim() : '';
        const lastUpdated = new Date().toISOString();

        if (!url || !title) {
            skippedCount++;
            return; // URLまたはタイトルがない行はスキップ
        }

        importData.push({
            title: title,
            url: url,
            summary: summary,
            categoryId: '', // IDは後で処理
            lastUpdated: lastUpdated
        });
    });

    return { data: importData, skipped: skippedCount };
}

/**
 * CSVデータと既存のブックマークを比較し、プレビュー用のデータを生成する
 * @param {string} csvText - CSVファイルの内容
 * @returns {Object} { newData: Array, updateData: Array, skippedCount: number }
 */
async function generateImportPreview(csvText) {
    const { data: importData, skipped: skippedCount } = parseCsv(csvText);
    const result = await chrome.storage.local.get(BOOKMARKS_STORAGE_KEY);
    const allBookmarks = result[BOOKMARKS_STORAGE_KEY] || {};

    const newData = [];
    const updateData = [];

    importData.forEach(item => {
        if (allBookmarks[item.url]) {
            updateData.push(item);
        } else {
            newData.push(item);
        }
    });

    return { newData, updateData, skippedCount };
}
/**
 * プレビューされたデータに基づいて、ストレージにブックマークを保存する
 */
async function executeImport(newData, updateData, categoryMap) {
    let savedCount = 0;
    let categoryIdToUse = '';
    
    const existingImportCategory = Object.keys(categoryMap).find(id => categoryMap[id] === IMPORT_CATEGORY_NAME);

    if (existingImportCategory) {
        categoryIdToUse = existingImportCategory;
    } else {
        categoryIdToUse = 'cat_' + Date.now();
        const categoriesResult = await chrome.storage.local.get(CATEGORIES_STORAGE_KEY);
        const categories = categoriesResult[CATEGORIES_STORAGE_KEY] || [];
        categories.push({ id: categoryIdToUse, name: IMPORT_CATEGORY_NAME });
        await chrome.storage.local.set({ [CATEGORIES_STORAGE_KEY]: categories });
    }
    
    const result = await chrome.storage.local.get(BOOKMARKS_STORAGE_KEY);
    const allBookmarks = result[BOOKMARKS_STORAGE_KEY] || {};

    const importData = [...newData, ...updateData];
    importData.forEach(item => {
        allBookmarks[item.url] = {
            title: item.title,
            url: item.url,
            summary: item.summary,
            categoryId: categoryIdToUse,
            lastUpdated: new Date().toISOString()
        };
        savedCount++;
    });

    await chrome.storage.local.set({ [BOOKMARKS_STORAGE_KEY]: allBookmarks });
    
    return savedCount;
}