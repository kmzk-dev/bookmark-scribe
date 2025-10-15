// csv.js
/**
 * ブックマークデータ配列をCSV文字列に変換し、ダウンロードさせる

 */
function exportToCsv(bookmarks, categoryMap) {
    if (!bookmarks || bookmarks.length === 0) {
        alert('There is no bookmark data to export.');
        return;
    }

    const headers = [
        "Title", "URL", "Comment", "Label", "Last Updated"
    ];

    let csvContent = headers.map(h => `"${h}"`).join(',') + '\n';

    bookmarks.forEach(item => {
        const categoryName = categoryMap[item.categoryId] || 'Unknown Label';
        
        const escapeCsv = (str) => {
            if (str === null || str === undefined) return "";
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

    const BOM = "\uFEFF";
    const blob = new Blob([BOM, csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'bookmark_scribe_export_' + new Date().toISOString().slice(0, 10) + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}