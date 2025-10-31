/**
 * Content Script for Google Meet Recorder
 * Handles recording capture and indicator display
 */

let recordingState = {
    isRecording: false,
    mediaRecorder: null,
    recordedChunks: [],
    stream: null,
    audioContext: null,
    audioDestination: null,
    indicatorElement: null
};

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'ping':
            console.log('Content script ping received');
            sendResponse({ success: true, message: 'Content script is ready' });
            return true;

        case 'getRecordingStatus':
            console.log('Recording status requested:', recordingState.isRecording);
            sendResponse({ isRecording: recordingState.isRecording });
            return true;

        case 'startRecording':
            startRecording(sendResponse);
            return true; // Keep channel open for async response

        case 'stopRecording':
            stopRecording(sendResponse);
            return true;

        case 'downloadRecording':
            downloadRecording(sendResponse);
            return true;

        default:
            sendResponse({ success: false, error: 'Unknown action' });
    }
});

// Start recording
async function startRecording(sendResponse) {
    try {
        if (recordingState.isRecording) {
            sendResponse({ success: false, error: 'Already recording' });
            return;
        }

        console.log('Starting recording - requesting permissions...');

        // Get microphone audio FIRST
        console.log('Step 1: Requesting microphone access...');
        let micStream;
        try {
            micStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    // High quality audio settings (optional, not required)
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                    // Note: sampleRate, sampleSize, channelCount are not supported in getUserMedia constraints
                }
            });
            console.log('✅ Microphone access granted');
            const micTracks = micStream.getAudioTracks();
            if (micTracks.length > 0) {
                console.log('Microphone settings:', micTracks[0].getSettings());
            }
        } catch (err) {
            console.error('❌ Microphone access denied:', err.message);
            sendResponse({ success: false, error: 'Microphone denied: ' + err.message });
            return;
        }

        // Request screen capture WITH system audio (SECOND)
        console.log('Step 2: Requesting screen capture...');
        let screenStream;
        try {
            screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: 'always',
                    // High quality video settings (ideal, not required)
                    width: { ideal: 1920 },   // 1080p baseline
                    height: { ideal: 1080 },
                    frameRate: { ideal: 30 }  // 30fps
                },
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });
            console.log('✅ Screen capture granted');
            console.log('Screen audio tracks:', screenStream.getAudioTracks().length);
            console.log('Screen video tracks:', screenStream.getVideoTracks().length);
            
            const videoTracks = screenStream.getVideoTracks();
            if (videoTracks.length > 0) {
                console.log('Video resolution:', videoTracks[0].getSettings());
            }
        } catch (err) {
            console.error('❌ Screen capture denied or error:', err.message);
            micStream.getTracks().forEach(track => track.stop());
            sendResponse({ success: false, error: 'Screen capture denied: ' + err.message });
            return;
        }

        // Create audio context and combine streams
        console.log('Creating audio context...');
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Set high sample rate for better audio quality
        console.log('Audio context sample rate:', audioContext.sampleRate, 'Hz');
        
        const audioDestination = audioContext.createMediaStreamDestination();
        recordingState.audioContext = audioContext;
        recordingState.audioDestination = audioDestination;

        // Check what audio tracks we have
        console.log('Available tracks:');
        console.log('  Microphone audio tracks:', micStream.getAudioTracks().length);
        console.log('  Screen audio tracks:', screenStream.getAudioTracks().length);

        // Create audio processing chain: source → gain → compressor → destination
        const micGain = audioContext.createGain();
        const systemGain = audioContext.createGain();
        const compressor = audioContext.createDynamicsCompressor();
        
        // Compressor settings for high-quality audio
        compressor.threshold.value = -50;  // Start compressing from -50dB
        compressor.knee.value = 40;        // Smooth compression curve
        compressor.ratio.value = 12;       // Strong compression ratio
        compressor.attack.value = 0.003;   // Quick attack
        compressor.release.value = 0.25;   // Medium release
        
        // Set appropriate gain levels
        micGain.gain.value = 1.2;    // Microphone slightly boosted
        systemGain.gain.value = 1.0; // System audio normal
        
        console.log('Audio processing chain configured');

        // Add microphone audio to the mix
        console.log('Step 3: Adding microphone to audio mix...');
        const micAudioTracks = micStream.getAudioTracks();
        if (micAudioTracks.length > 0) {
            try {
                const micAudioSource = audioContext.createMediaStreamSource(micStream);
                micAudioSource.connect(micGain);
                micGain.connect(compressor);
                compressor.connect(audioDestination);

                console.log('✅ Microphone audio connected successfully');
            } catch (err) {
                console.error('❌ Error connecting microphone:', err);
            }
        } else {
            console.warn('⚠️ No microphone audio tracks found');
        }

        // Add screen/system audio if available
        console.log('Step 4: Adding system audio to mix (if available)...');
        const screenAudioTrack = screenStream.getAudioTracks()[0];
        if (screenAudioTrack) {
            try {
                console.log('🔊 System audio track found');
                console.log('System audio track enabled:', screenAudioTrack.enabled);
                console.log('System audio track settings:', screenAudioTrack.getSettings());
                
                const screenAudioSource = audioContext.createMediaStreamSource(screenStream);
                screenAudioSource.connect(systemGain);
                systemGain.connect(compressor);
                compressor.connect(audioDestination);
                
                console.log('✅ System audio connected successfully');
            } catch (err) {
                console.error('❌ Error connecting system audio:', err);
            }
        } else {
            console.log('ℹ️ No system audio track - will only record microphone');
            console.log('   (Make sure to check "Share system audio" in the permission dialog)');
        }

        // Combine video from screen with mixed audio
        console.log('Step 5: Combining video and audio streams...');
        const combinedStream = new MediaStream();

        // Add video tracks from screen
        screenStream.getVideoTracks().forEach(track => {
            combinedStream.addTrack(track);
        });

        // Add mixed audio
        audioDestination.stream.getAudioTracks().forEach(track => {
            combinedStream.addTrack(track);
        });

        // Verify combined stream
        console.log('Combined stream tracks:');
        console.log('  Video tracks:', combinedStream.getVideoTracks().length);
        console.log('  Audio tracks:', combinedStream.getAudioTracks().length);

        recordingState.stream = combinedStream;

        // Create MediaRecorder
        console.log('Creating MediaRecorder...');
        const mimeType = getSupportedMimeType();
        console.log('Using MIME type:', mimeType);
        
        // High quality recording options
        const options = {
            mimeType: mimeType,
            audioBitsPerSecond: 256000,  // 256 kbps audio (high quality)
            videoBitsPerSecond: 8000000  // 8 Mbps video (high quality, can go up to 50 Mbps)
        };
        
        console.log('Recording options:', options);
        
        const mediaRecorder = new MediaRecorder(combinedStream, options);

        mediaRecorder.ondataavailable = (event) => {
            console.log('Data available:', event.data.size, 'bytes');
            if (event.data.size > 0) {
                recordingState.recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            console.log('MediaRecorder stopped - total chunks:', recordingState.recordedChunks.length);
            // Cleanup
            cleanupRecording();
        };

        mediaRecorder.start();
        recordingState.mediaRecorder = mediaRecorder;
        recordingState.isRecording = true;

        console.log('Recording started successfully');

        // Show recording indicator
        showRecordingIndicator();

        // Notify background script
        chrome.runtime.sendMessage({ action: 'recordingStarted' }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Error notifying background script:', chrome.runtime.lastError);
            }
        });

        sendResponse({ success: true });
    } catch (error) {
        console.error('Recording error:', error);
        console.error('Error stack:', error.stack);
        sendResponse({ success: false, error: error.message });
    }
}

// Stop recording
function stopRecording(sendResponse) {
    try {
        if (!recordingState.isRecording || !recordingState.mediaRecorder) {
            sendResponse({ success: false, error: 'Not recording' });
            return;
        }

        recordingState.mediaRecorder.stop();
        recordingState.isRecording = false;

        // Stop all tracks
        if (recordingState.stream) {
            recordingState.stream.getTracks().forEach(track => track.stop());
        }

        // Close audio context
        if (recordingState.audioContext) {
            recordingState.audioContext.close();
        }

        // Hide recording indicator
        hideRecordingIndicator();

        // Notify background script
        chrome.runtime.sendMessage({ action: 'recordingStopped' }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Error notifying background script:', chrome.runtime.lastError);
            }
        });

        sendResponse({ success: true });

        // Trigger download after a short delay to ensure recording is processed
        setTimeout(() => {
            downloadRecording(() => {
                // Download initiated
            });
        }, 500);
    } catch (error) {
        console.error('Stop recording error:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Download recording
function downloadRecording(sendResponse) {
    try {
        if (recordingState.recordedChunks.length === 0) {
            if (sendResponse) {
                sendResponse({ success: false, error: 'No recording data' });
            }
            return;
        }

        // Create blob from recorded chunks
        const blob = new Blob(recordingState.recordedChunks, { type: 'video/webm' });

        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `meet-recording-${new Date().getTime()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Reset recorded chunks
        recordingState.recordedChunks = [];

        if (sendResponse) {
            sendResponse({ success: true });
        }
    } catch (error) {
        console.error('Download error:', error);
        if (sendResponse) {
            sendResponse({ success: false, error: error.message });
        }
    }
}

// Show recording indicator on the page
function showRecordingIndicator() {
    // Remove if already exists
    if (recordingState.indicatorElement) {
        recordingState.indicatorElement.remove();
    }

    // Create indicator element
    const indicator = document.createElement('div');
    indicator.id = 'meet-recorder-indicator';
    indicator.innerHTML = `
        <style>
            #meet-recorder-indicator {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 10px;
                background: rgba(255, 0, 0, 0.95);
                color: white;
                padding: 12px 16px;
                border-radius: 24px;
                font-weight: bold;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                animation: pulse 1s infinite;
            }

            #meet-recorder-indicator .dot {
                width: 12px;
                height: 12px;
                background: white;
                border-radius: 50%;
                animation: blink 1s infinite;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.8; }
            }

            @keyframes blink {
                0%, 50%, 100% { opacity: 1; }
                25%, 75% { opacity: 0.3; }
            }
        </style>
        <div class="dot"></div>
        <span>Recording in progress</span>
    `;

    document.body.appendChild(indicator);
    recordingState.indicatorElement = indicator;
}

// Hide recording indicator
function hideRecordingIndicator() {
    if (recordingState.indicatorElement) {
        recordingState.indicatorElement.remove();
        recordingState.indicatorElement = null;
    }
}

// Get supported MIME type
function getSupportedMimeType() {
    const types = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=h264,opus',
        'video/webm'
    ];

    for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
            return type;
        }
    }

    return 'video/webm'; // Fallback
}

// Cleanup recording resources
function cleanupRecording() {
    console.log('Cleaning up recording resources...');
    
    if (recordingState.stream) {
        console.log('Stopping stream tracks...');
        recordingState.stream.getTracks().forEach(track => {
            try {
                if (track.readyState !== 'ended') {
                    track.stop();
                }
            } catch (err) {
                console.warn('Error stopping track:', err.message);
            }
        });
        recordingState.stream = null;
    }

    // Suspend (don't close) audio context to avoid errors
    if (recordingState.audioContext) {
        try {
            // Suspend instead of close to avoid "Cannot close a closed AudioContext" error
            if (recordingState.audioContext.state === 'running') {
                console.log('Suspending audio context...');
                recordingState.audioContext.suspend();
            } else if (recordingState.audioContext.state !== 'closed') {
                console.log('Audio context state:', recordingState.audioContext.state);
            }
        } catch (err) {
            console.warn('Error suspending audio context:', err.message);
        }
        recordingState.audioContext = null;
    }

    if (recordingState.audioDestination) {
        recordingState.audioDestination = null;
    }

    recordingState.mediaRecorder = null;
    console.log('Cleanup complete');
}

// Listen for page unload to cleanup
window.addEventListener('beforeunload', () => {
    if (recordingState.isRecording) {
        recordingState.mediaRecorder.stop();
        cleanupRecording();
    }
});

console.log('Google Meet Recorder content script loaded');
