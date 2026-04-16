// Interview Copilot Background Service Worker
chrome.runtime.onInstalled.addListener(() => {
    console.log("Interview Copilot Extension Installed");
    chrome.contextMenus.create({
        id: "analyzeBias",
        title: "Analyze for Interview Bias",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "analyzeBias") {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (selectedText) => {
                if (typeof analyzeText === 'function') {
                    analyzeText(selectedText);
                } else {
                    console.error("analyzeText function not found in content script");
                    alert("Please refresh the page to enable Interview Copilot analysis.");
                }
            },
            args: [info.selectionText]
        });
    }
});
