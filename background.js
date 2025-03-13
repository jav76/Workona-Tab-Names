let workonaTitleCache = {};
let cacheTimeout = 1000 * 60 * 5; // 5 minutes

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.title && tab.url.includes("workona.com") && changeInfo.status === "complete") {
        let spaceName = extractWorkonaSpaceName(changeInfo.title);
        if (spaceName) {
            workonaTitleCache[tab.windowId] = spaceName;
        }
    }
    try {
        updateWindowTitle(tab);
    }
    catch (e) {
        console.error(e);
    }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
    let tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url.includes("workona.com") && tab.title && tab.status === "complete") {
        let spaceName = extractWorkonaSpaceName(tab.title);
        if (spaceName) {
            workonaTitleCache[tab.windowId] = spaceName;
        }
    }
    try {
        updateWindowTitle(tab);
    }
    catch (e) {
        console.error(e);
    }
});

chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        return;
    }
    updateTitleCache();
});

function updateTitleCache() {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            if (tab.url.includes("workona.com") && tab.title && tab.status === "complete") {
                let spaceName = extractWorkonaSpaceName(tab.title);
                if (spaceName) {
                    workonaTitleCache[tab.windowId] = spaceName;
                }
            }
        });
    });
}

setInterval(() => {
    updateTitleCache();
}, cacheTimeout);

chrome.runtime.onStartup.addListener(() => {
    updateTitleCache();
});

updateTitleCache();

function updateWindowTitle(tab) {
    let spaceName = workonaTitleCache[tab.windowId];
    if (spaceName) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: setDocumentTitle,
            args: [spaceName]
        });
    }
}

function extractWorkonaSpaceName(title) {
    let parts = title.split(" - ");
    return parts.length > 1 ? parts[parts.length - 2] : null;
}

function setDocumentTitle(spaceName) {
    if (!document.title) {
        return;
    }
    if (document.title.includes(spaceName)) {
        return;
    }
    document.title = "[" + spaceName + "] " + document.title;
    console.log("Updated document title to: " + spaceName);
}