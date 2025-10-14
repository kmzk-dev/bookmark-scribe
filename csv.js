// csv.js

/**
 * ブックマークデータ配列をCSV文字列に変換し、ダウンロードさせる
 * @param {Array<Object>} bookmarks - エクスポート対象のブックマークデータの配列
 * @param {Object} categoryMap - カテゴリIDと名前のマップ
 */
function exportToCsv(bookmarks, categoryMap) {
    if (!bookmarks || bookmarks.length === 0) {
        alert('エクスポートするブックマークデータがありません。');
        return;
    }

    // CSVヘッダーの定義
    const headers = [
        "タイトル", "URL", "サマリー", "カテゴリ", "最終更新日"
    ];

    // ヘッダーをCSV形式の文字列にする
    let csvContent = headers.map(h => `"${h}"`).join(',') + '\n';

    // データ行の処理
    bookmarks.forEach(item => {
        // カテゴリ名を取得
        const categoryName = categoryMap[item.categoryId] || 'カテゴリ不明';
        
        // CSVエスケープ処理 (ダブルクォーテーションをエスケープし、全体をダブルクォーテーションで囲む)
        const escapeCsv = (str) => {
            if (str === null || str === undefined) return "";
            // 改行やダブルクォーテーションのエスケープ
            return `"${String(str).replace(/"/g, '""')}"`;
        };

        const row = [
            escapeCsv(item.title),
            escapeCsv(item.url),
            escapeCsv(item.summary),
            escapeCsv(categoryName),
            escapeCsv(item.lastUpdated)
        ].join(',');

        csvContent += row + '\n';
    });

    // BOM (Byte Order Mark) を追加して日本語文字化けを防ぐ
    const BOM = "\uFEFF";
    const blob = new Blob([BOM, csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // ダウンロードリンクを作成し、クリックイベントを発生させる
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'bookmark_scribe_export_' + new Date().toISOString().slice(0, 10) + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}