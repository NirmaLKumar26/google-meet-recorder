/**
 * Background Service Worker for Google Meet Recorder
 * Handles OAuth token management, message routing, and recording coordination
 */

// Initialize service worker
chrome.runtime.onInstalled.addListener(() => {
    console.log('Google Meet Recorder extension installed');
});

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'getAuthToken':
            handleGetAuthToken(sendResponse);
            return true; // Keep channel open for async response

        case 'revokeToken':
            handleRevokeToken(request.token, sendResponse);
            return true;

        case 'recordingStarted':
            handleRecordingStarted(sender.tab.id, sendResponse);
            return true;

        case 'recordingStopped':
            handleRecordingStopped(sender.tab.id, sendResponse);
            return true;

        case 'recordingUpdate':
            // Forward update to popup
            chrome.runtime.sendMessage(request, (response) => {
                if (chrome.runtime.lastError) {
                    console.log('Popup not open');
                }
            });
            sendResponse({ success: true });
            return true;

        default:
            sendResponse({ success: false, error: 'Unknown action' });
    }
});

// Get auth token
function handleGetAuthToken(sendResponse) {
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
        if (chrome.runtime.lastError) {
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
            return;
        }
        sendResponse({ success: true, token: token });
    });
}

// Revoke auth token
function handleRevokeToken(token, sendResponse) {
    if (!token) {
        sendResponse({ success: false, error: 'No token provided' });
        return;
    }

    // Revoke the token
    fetch('https://accounts.google.com/o/oauth2/revoke?token=' + token, {
        method: 'POST'
    })
        .then(response => {
            chrome.identity.removeCachedAuthToken({ token: token }, () => {
                sendResponse({ success: true });
            });
        })
        .catch(error => {
            console.error('Token revocation error:', error);
            sendResponse({ success: false, error: error.message });
        });
}

// Handle recording started
function handleRecordingStarted(tabId, sendResponse) {
    // Update tab badge
    chrome.action.setBadgeText({ text: '🔴', tabId: tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
    sendResponse({ success: true });
}

// Handle recording stopped
function handleRecordingStopped(tabId, sendResponse) {
    // Clear tab badge
    chrome.action.setBadgeText({ text: '', tabId: tabId });
    sendResponse({ success: true });
}

// Context menus - removed for stability
// Alarms - removed for stability
