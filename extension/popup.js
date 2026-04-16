// Voice Recognition Integration
const micBtn = document.getElementById('mic');
const inputField = document.getElementById('input');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
        }
        inputField.value = transcript;
        
        if (event.results[0].isFinal) {
            micBtn.style.background = 'rgba(255,255,255,0.05)';
            micBtn.innerHTML = '🎤';
            document.getElementById('analyze').click();
        }
    };

    recognition.onerror = (e) => {
        console.error(e);
        micBtn.style.background = 'rgba(255,255,255,0.05)';
        micBtn.innerHTML = '🎤';
    };

    micBtn.addEventListener('click', () => {
        if (micBtn.classList.contains('recording')) {
            recognition.stop();
            micBtn.classList.remove('recording');
            micBtn.style.background = 'rgba(255,255,255,0.05)';
            micBtn.innerHTML = '🎤';
        } else {
            try {
                recognition.start();
                micBtn.classList.add('recording');
                micBtn.style.background = '#ef4444';
                micBtn.innerHTML = '🔴';
                resultDiv.innerHTML = '<div style="color: #6366f1; font-weight: bold; animate-pulse">Listening... Speak clearly into the microphone.</div>';
            } catch (e) {
                console.error(e);
                resultDiv.innerHTML = '<div style="color: #f87171">Microphone access denied or already in use.</div>';
            }
        }
    });
} else {
    micBtn.style.display = 'none';
}
document.getElementById('analyze').addEventListener('click', async () => {
    const text = document.getElementById('input').value;
    const resultDiv = document.getElementById('result');
    
    if (!text) return;
    
    resultDiv.innerHTML = 'Analyzing...';
    
    try {
        const response = await fetch('http://localhost:8000/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: text, session_id: 'extension_popup' })
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        
        if (data.is_biased) {
            let html = `<div class="bias-tag">BIAS DETECTED</div>`;
            html += `<div style="background: rgba(239, 68, 68, 0.1); padding: 12px; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.2); margin-bottom: 12px;">
                        <div style="font-weight: 800; color: #f87171; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Reasoning</div>
                        <div style="color: #cbd5e1; font-size: 12px; line-height: 1.4;">${data.insights[0]?.explanation || 'Semantic bias detected.'}</div>
                     </div>`;
            html += `<div style="background: rgba(99, 102, 241, 0.1); padding: 12px; border-radius: 8px; border: 1px solid rgba(99, 102, 241, 0.2);">
                        <div style="font-weight: 800; color: #818cf8; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Suggested Refinement</div>
                        <div style="color: #cbd5e1; font-size: 12px; font-style: italic;">"${data.suggested_question}"</div>
                     </div>`;
            resultDiv.innerHTML = html;
        } else {
            resultDiv.innerHTML = `
                <div style="background: rgba(16, 185, 129, 0.1); padding: 15px; border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.2); text-align: center;">
                    <span style="color: #4ade80; font-weight: bold; font-size: 14px;">✓ SAFE QUESTION</span>
                    <div style="color: #94a3b8; font-size: 11px; margin-top: 4px;">Neural engine validated professional context.</div>
                </div>
            `;
        }
    } catch (e) {
        resultDiv.innerHTML = `<div style="color: #f87171; background: rgba(239, 68, 68, 0.1); padding: 12px; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.2); font-size: 11px;">
            <strong>Connection Failed</strong><br>Ensure the backend server is running at localhost:8000
        </div>`;
    }
});
