// background.js

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "openList",
        title: "Open Bookmark List",
        contexts: ["action"]
    });

    chrome.contextMenus.create({
        id: "openOptions",
        title: "Set Labels",
        contexts: ["action"]
    });
});

// 右クリックメニューがクリックされたときに実行される
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "openList") {
        chrome.tabs.create({
            url: "list.html"
        });
    } else if (info.menuItemId === "openOptions") {
        chrome.runtime.openOptionsPage();
    }
});