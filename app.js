let device;
let currentConnection = null;

// Initialize Twilio Device
async function setupDevice() {
    try {
        // Replace with your Twilio Function URL
        const response = await fetch('https://voice-sdk-service-1507.twil.io/generate-token', {
            method: 'POST'
        });
        const data = await response.json();
        device = new Twilio.Device(data.token, {
            debug: true // Set to false in production
        });
        
        await setupDeviceListeners();
        await setupAudioDevices();
    } catch (err) {
        console.error('Error setting up device:', err);
        updateStatus('Error: ' + err.message);
    }
}

// Set up device event listeners
function setupDeviceListeners() {
    device.on('ready', () => {
        updateStatus('Ready to make calls');
        document.getElementById('call-button').disabled = false;
    });

    device.on('error', (error) => {
        console.error('Device error:', error);
        updateStatus('Error: ' + error.message);
    });

    device.on('connect', (conn) => {
        currentConnection = conn;
        document.getElementById('call-button').disabled = true;
        document.getElementById('hangup-button').disabled = false;
        updateStatus('On call');
    });

    device.on('disconnect', () => {
        currentConnection = null;
        document.getElementById('call-button').disabled = false;
        document.getElementById('hangup-button').disabled = true;
        updateStatus('Call ended');
    });

    device.on('incoming', (conn) => {
        currentConnection = conn;
        updateStatus('Incoming call...');
        
        // Auto-answer for demo purposes
        conn.accept();
    });
}

// Set up audio device selection
async function setupAudioDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    
    const micSelect = document.getElementById('microphone-select');
    const speakerSelect = document.getElementById('speaker-select');
    
    devices.forEach(device => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.text = device.label || `${device.kind} (${device.deviceId.slice(0,5)}...)`;
        
        if (device.kind === 'audioinput') {
            micSelect.appendChild(option);
        } else if (device.kind === 'audiooutput') {
            speakerSelect.appendChild(option);
        }
    });
    
    // Handle device selection
    micSelect.addEventListener('change', (e) => {
        device.audio.setInputDevice(e.target.value);
    });
    
    speakerSelect.addEventListener('change', (e) => {
        device.audio.setOutputDevice(e.target.value);
    });
}

// Make a call
document.getElementById('call-button').addEventListener('click', () => {
    const phoneNumber = document.getElementById('phone-number').value.trim();
    
    if (!phoneNumber) {
        updateStatus('Please enter a phone number');
        return;
    }
    
    const params = {
        To: phoneNumber,
        // Replace with your voice handler function URL
        url: 'https://voice-sdk-service-1507.twil.io/voice-handler'
    };
    
    try {
        device.connect(params);
        updateStatus('Initiating call...');
    } catch (err) {
        console.error('Call error:', err);
        updateStatus('Error: ' + err.message);
    }
});

// Hang up call
document.getElementById('hangup-button').addEventListener('click', () => {
    if (currentConnection) {
        currentConnection.disconnect();
    }
});

// Update status display
function updateStatus(status) {
    document.getElementById('call-status').textContent = status;
}

// Initialize when page loads
window.addEventListener('load', async () => {
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setupDevice();
    } catch (err) {
        console.error('Media access error:', err);
        updateStatus('Error: Microphone access denied');
    }
});
