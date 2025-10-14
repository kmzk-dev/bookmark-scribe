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
 * CSVインポート処理全体を統括し、ストレージに保存する
 * @param {string} csvText - CSVファイルの内容
 * @param {Object} categoryMap - カテゴリIDと名前のマップ
 */
async function importCsvData(csvText, categoryMap) {
    const { data: importData, skipped: skippedInitial } = parseCsv(csvText);
    
    if (importData.length === 0) {
        alert('有効なブックマークデータが見つかりませんでした。');
        return;
    }

    let savedCount = 0;
    let categoryIdToUse = '';
    
    // 1. カテゴリIDの特定: "Import"カテゴリがなければ新規作成
    const existingImportCategory = Object.keys(categoryMap).find(id => categoryMap[id] === IMPORT_CATEGORY_NAME);

    if (existingImportCategory) {
        categoryIdToUse = existingImportCategory;
    } else {
        // 新規カテゴリの作成（ここではカテゴリIDのみ生成し、list.js側でリストに追加する必要がある）
        // 簡素化のため、一時的なIDを使用し、ロード時にカテゴリが存在しない場合は '未分類' にフォールバックする
        categoryIdToUse = 'cat_' + Date.now();
    }
    
    // 2. 既存のブックマークデータを読み込み
    const result = await chrome.storage.local.get(BOOKMARKS_STORAGE_KEY);
    const allBookmarks = result[BOOKMARKS_STORAGE_KEY] || {};

    // 3. データの上書き処理
    importData.forEach(item => {
        // URLをキーとして上書き
        allBookmarks[item.url] = {
            title: item.title,
            url: item.url,
            summary: item.summary,
            categoryId: categoryIdToUse, // 固定カテゴリIDを割り当て
            lastUpdated: item.lastUpdated
        };
        savedCount++;
    });

    // 4. ストレージに保存
    await chrome.storage.local.set({ [BOOKMARKS_STORAGE_KEY]: allBookmarks });

    alert(`CSVインポートが完了しました。\n\n- 成功件数: ${savedCount}件 (既存データを上書き)\n- スキップ件数: ${skippedInitial}件 (タイトルまたはURL不足)`);
    
    // リストの再読み込みを促す
    location.reload(); 
}