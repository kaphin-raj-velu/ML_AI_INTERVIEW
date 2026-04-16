// Interview Copilot Content Script
console.log("Interview Copilot Loaded (Context Menu Mode)");

async function analyzeText(text) {
    try {
        console.log("Analyzing text via context menu...");
        const response = await fetch('http://localhost:8000/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: text, session_id: 'extension_script' })
        });
        const data = await response.json();
        showFeedback(data);
    } catch (e) {
        console.error("Copilot API Error", e);
        alert("Copilot Backend connection failed. Ensure the server is running.");
    }
}

function showFeedback(data) {
    // Remove existing bubble if any
    const existing = document.getElementById('copilot-feedback-bubble');
    if (existing) existing.remove();

    const feedback = document.createElement('div');
    feedback.id = 'copilot-feedback-bubble';
    feedback.style.position = 'fixed';
    feedback.style.bottom = '30px';
    feedback.style.right = '30px';
    feedback.style.width = '320px';
    feedback.style.background = '#030711';
    feedback.style.color = 'white';
    feedback.style.padding = '25px';
    feedback.style.borderRadius = '24px';
    feedback.style.boxShadow = '0 20px 50px rgba(0,0,0,0.6)';
    feedback.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    feedback.style.zIndex = '999999';
    feedback.style.border = '1px solid rgba(255,255,255,0.1)';
    feedback.style.backdropFilter = 'blur(20px)';

    const isBiased = data.is_biased;
    const statusColor = isBiased ? '#ef4444' : '#10b981';
    const statusIcon = isBiased ? '⚠️' : '✓';

    feedback.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
            <div style="width: 40px; height: 40px; background: ${statusColor}20; border-radius: 12px; display: flex; align-items: center; justify-center; font-size: 20px; color: ${statusColor};">
                ${statusIcon}
            </div>
            <div>
                <div style="font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase; font-size: 14px;">${data.classification}</div>
                <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 2px;">${data.bias_type || 'None Detected'}</div>
            </div>
        </div>
        
        <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 15px; margin-bottom: 20px;">
            <div style="font-size: 10px; font-weight: 800; color: #4f46e5; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">Suggested Refinement</div>
            <div style="font-weight: 600; line-height: 1.5; color: #e2e8f0; font-size: 13px;">"${data.suggested_question}"</div>
        </div>

        ${isBiased ? `
            <div style="margin-bottom: 20px;">
                <div style="font-size: 10px; font-weight: 800; color: #ef4444; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">AI Reasoning</div>
                <div style="font-size: 11px; color: #94a3b8; line-height: 1.6;">${data.insights[0]?.explanation || 'Semantic patterns identified.'}</div>
            </div>
        ` : ''}

        <div style="display: flex; gap: 8px;">
            <button id="close-copilot" style="flex: 1; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: #94a3b8; font-weight: 700; font-size: 11px; cursor: pointer; transition: all 0.2s; text-transform: uppercase; letter-spacing: 1px;">Dismiss Audit</button>
            <button id="mic-copilot" style="width: 44px; padding: 12px 0; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 12px; color: #818cf8; cursor: pointer;">🎤</button>
        </div>
    `;

    document.body.appendChild(feedback);

    // Voice Support in Bubble
    const micBtn = document.getElementById('mic-copilot');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            micBtn.innerHTML = '⚡';
            analyzeText(transcript);
        };
        micBtn.onclick = () => {
            recognition.start();
            micBtn.innerHTML = '🔴';
            micBtn.style.borderColor = '#ef4444';
        };
    } else {
        micBtn.style.display = 'none';
    }
    
    document.getElementById('close-copilot').onclick = () => {
        feedback.style.opacity = '0';
        feedback.style.transform = 'translateY(10px)';
        setTimeout(() => feedback.remove(), 200);
    };

    // Auto-hover effect
    const btn = document.getElementById('close-copilot');
    btn.onmouseover = () => btn.style.background = 'rgba(255,255,255,0.08)';
    btn.onmouseout = () => btn.style.background = 'rgba(255,255,255,0.05)';
}

// Expose handle for background script
window.analyzeText = analyzeText;
