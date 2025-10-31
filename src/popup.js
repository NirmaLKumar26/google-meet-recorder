// Global state
let recordingState = {
    isRecording: false,
    isPaused: false,
    recordedBlob: null,
    contentScriptReady: false
};

// DOM Elements
const elements = {
    startBtn: document.getElementById('start-recording-btn'),
    pauseBtn: document.getElementById('pause-recording-btn'),
    stopBtn: document.getElementById('stop-recording-btn'),
    downloadBtn: document.getElementById('download-btn'),
    recordingStatus: document.getElementById('recording-status'),
    errorMessage: document.getElementById('error-message')
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    checkContentScriptStatus();
    resetRecordingState();
});

// Reset recording state when popup opens
function resetRecordingState() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || tabs.length === 0) return;
        
        if (!tabs[0].url.includes('meet.google.com')) return;
        
        // Send reset message to content script
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getRecordingStatus' }, (response) => {
            if (chrome.runtime.lastError) {
                console.log('Could not get recording status');
                return;
            }
            
            if (response && response.isRecording) {
                console.log('Recording already active - updating UI');
                recordingState.isRecording = true;
                updateUI();
            }
        });
    });
}

// Check if content script is loaded
function checkContentScriptStatus() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || tabs.length === 0) return;
        
        if (!tabs[0].url.includes('meet.google.com')) {
            showError('⚠️ Open Google Meet');
            return;
        }
        
        chrome.tabs.sendMessage(tabs[0].id, { action: 'ping' }, (response) => {
            if (chrome.runtime.lastError) {
                console.warn('Content script not ready yet');
                recordingState.contentScriptReady = false;
            } else {
                console.log('Content script is ready');
                recordingState.contentScriptReady = true;
            }
        });
    });
}

// Setup event listeners
function setupEventListeners() {
    if (!elements.startBtn) {
        console.error('START button not found!');
        return;
    }
    if (!elements.pauseBtn) {
        console.error('PAUSE button not found!');
        return;
    }
    if (!elements.stopBtn) {
        console.error('STOP button not found!');
        return;
    }
    if (!elements.downloadBtn) {
        console.error('DOWNLOAD button not found!');
        return;
    }
    
    console.log('Setting up event listeners...');
    elements.startBtn.addEventListener('click', handleStartRecording);
    elements.pauseBtn.addEventListener('click', handlePauseRecording);
    elements.stopBtn.addEventListener('click', handleStopRecording);
    elements.downloadBtn.addEventListener('click', handleDownload);
    console.log('Event listeners setup complete');
}

// Start recording
async function handleStartRecording() {
    try {
        console.log('Start button clicked');
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab.url.includes('meet.google.com')) {
            showError('❌ Open Google Meet first!');
            return;
        }

        console.log('Sending startRecording message to tab:', tab.id);

        // Function to send message with retry
        function sendMessageWithRetry(tabId, message, attempt = 1) {
            chrome.tabs.sendMessage(tabId, message, (response) => {
                if (chrome.runtime.lastError) {
                    console.warn(`Attempt ${attempt} failed:`, chrome.runtime.lastError.message);
                    
                    if (attempt < 3) {
                        // Retry after 500ms
                        console.log(`Retrying in 500ms (attempt ${attempt + 1})...`);
                        setTimeout(() => sendMessageWithRetry(tabId, message, attempt + 1), 500);
                    } else {
                        console.error('All retry attempts failed');
                        showError('⚠️ Content script not loaded. Refresh page and try again.');
                    }
                    return;
                }

                console.log('Start response:', response);
                
                if (response && response.success) {
                    console.log('Recording started - updating UI immediately');
                    recordingState.isRecording = true;
                    recordingState.isPaused = false;
                    
                    updateUI();
                    showError('🎥 Recording started!');
                } else {
                    const errorMsg = response?.error || 'Unknown error';
                    console.error('Failed to start recording:', errorMsg);
                    
                    // If already recording, just update the UI
                    if (errorMsg.includes('Already recording')) {
                        console.log('Recording was already active - updating UI');
                        recordingState.isRecording = true;
                        updateUI();
                        showError('🎥 Recording is active!');
                    } else {
                        showError('❌ Failed to start: ' + errorMsg);
                    }
                }
            });
        }

        sendMessageWithRetry(tab.id, { action: 'startRecording' });
    } catch (error) {
        console.error('Start recording error:', error);
        showError('❌ Error: ' + error.message);
    }
}

// Pause recording
function handlePauseRecording() {
    recordingState.isPaused = !recordingState.isPaused;
    updateUI();
    showError('');
}

// Stop recording
async function handleStopRecording() {
    try {
        console.log('Stop button clicked');
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        function sendMessageWithRetry(tabId, message, attempt = 1) {
            chrome.tabs.sendMessage(tabId, message, (response) => {
                if (chrome.runtime.lastError) {
                    console.warn(`Attempt ${attempt} failed:`, chrome.runtime.lastError.message);
                    if (attempt < 2) {
                        setTimeout(() => sendMessageWithRetry(tabId, message, attempt + 1), 300);
                    } else {
                        showError('⚠️ Error stopping recording');
                    }
                    return;
                }

                console.log('Stop response:', response);
                
                if (response && response.success) {
                    recordingState.isRecording = false;
                    recordingState.isPaused = false;
                    recordingState.recordedBlob = true;
                    updateUI();
                    showError('✅ Recording saved! Click SAVE to download');
                } else {
                    showError('❌ Failed to stop recording');
                }
            });
        }

        sendMessageWithRetry(tab.id, { action: 'stopRecording' });
    } catch (error) {
        console.error('Stop recording error:', error);
        showError('❌ Error: ' + error.message);
    }
}

// Download recording
function handleDownload() {
    try {
        console.log('Download button clicked');
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs || tabs.length === 0) {
                showError('❌ No active tab');
                return;
            }
            
            function sendMessageWithRetry(tabId, message, attempt = 1) {
                chrome.tabs.sendMessage(tabId, message, (response) => {
                    if (chrome.runtime.lastError) {
                        console.warn(`Download attempt ${attempt} failed:`, chrome.runtime.lastError.message);
                        if (attempt < 2) {
                            setTimeout(() => sendMessageWithRetry(tabId, message, attempt + 1), 300);
                        } else {
                            showError('❌ Download failed');
                        }
                        return;
                    }
                    
                    console.log('Download response:', response);
                    
                    if (response && response.success) {
                        showError('✅ File downloading...');
                        setTimeout(() => resetDownloadSection(), 2000);
                    } else {
                        showError('❌ Download failed');
                    }
                });
            }

            sendMessageWithRetry(tabs[0].id, { action: 'downloadRecording' });
        });
    } catch (error) {
        console.error('Download error:', error);
        showError('❌ Error: ' + error.message);
    }
}

// Update UI
function updateUI() {
    console.log('updateUI called - isRecording:', recordingState.isRecording);
    
    if (recordingState.isRecording) {
        elements.startBtn.classList.add('hidden');
        elements.pauseBtn.classList.remove('hidden');
        elements.stopBtn.classList.remove('hidden');
        elements.downloadBtn.classList.add('hidden');
        elements.recordingStatus.classList.remove('hidden');
        
        console.log('Recording active - STOP button should be visible');
        
        if (recordingState.isPaused) {
            elements.pauseBtn.textContent = '▶️ RESUME';
        } else {
            elements.pauseBtn.textContent = '⏸️ PAUSE';
        }
    } else {
        elements.startBtn.classList.remove('hidden');
        elements.pauseBtn.classList.add('hidden');
        elements.stopBtn.classList.add('hidden');
        elements.recordingStatus.classList.add('hidden');
        
        console.log('Recording stopped - SAVE button state:', !!recordingState.recordedBlob);
        
        if (recordingState.recordedBlob) {
            elements.downloadBtn.classList.remove('hidden');
        } else {
            elements.downloadBtn.classList.add('hidden');
        }
    }
}

// Utility functions
function showError(message) {
    if (message) {
        elements.errorMessage.textContent = message;
        elements.errorMessage.classList.remove('hidden');
    } else {
        elements.errorMessage.classList.add('hidden');
    }
}

function resetDownloadSection() {
    recordingState.recordedBlob = null;
    elements.downloadBtn.classList.add('hidden');
}


