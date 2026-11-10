document.addEventListener('DOMContentLoaded', function() {
    const display = document.getElementById('timerDisplay');
    const minInput = document.getElementById('timerMinutes');
    const secInput = document.getElementById('timerSeconds');
    const startBtn = document.getElementById('timerStartBtn');
    const stopBtn = document.getElementById('timerStopBtn');
    const resetBtn = document.getElementById('timerResetBtn');

    if (!display) return;

    let totalSeconds = 180;
    let timerId = null;
    let isRunning = false;
    let timerSound = new Audio('./sound.mp4');

    // 🔄 タイマーでもIndexedDBからカスタム音声をロード
    async function loadTimerAudio() {
        try {
            const file = await getCustomAudioFromDB();
            if (file) {
                timerSound.src = URL.createObjectURL(file);
            }
        } catch (e) {
            console.warn("タイマー音声ロード失敗:", e);
        }
    }
    loadTimerAudio();

    let timerHistory = JSON.parse(localStorage.getItem('science_club_timer_history') || '[]');

    const cardEl = display.closest('.weather-card');
    let historyContainer = document.getElementById('timerHistoryContainer');
    if (!historyContainer && cardEl) {
        const historyDiv = document.createElement('div');
        historyDiv.style.cssText = 'margin-top: 20px; border-top: 1px solid #ddd; padding-top: 15px; text-align: left;';
        historyDiv.innerHTML = `
            <h4 style="margin-bottom: 8px; font-size: 0.95rem; color: #444;">🕒 直近のタイマー履歴（最大10件）</h4>
            <div id="timerHistoryList" style="display: flex; flex-wrap: wrap; gap: 6px;"></div>
        `;
        cardEl.appendChild(historyDiv);
        historyContainer = document.getElementById('timerHistoryList');
    }

    function renderHistory() {
        if (!historyContainer) return;
        if (timerHistory.length === 0) {
            historyContainer.innerHTML = '<span style="color: #888; font-size: 0.85rem;">履歴はありません</span>';
            return;
        }

        let html = '';
        timerHistory.forEach((item, idx) => {
            html += `<button class="timer-history-chip" data-min="${item.m}" data-sec="${item.s}" style="padding: 4px 10px; background: #f1f3f5; border: 1px solid #ced4da; border-radius: 15px; font-size: 0.85rem; cursor: pointer; color: #333;">${item.label}</button>`;
        });
        historyContainer.innerHTML = html;

        historyContainer.querySelectorAll('.timer-history-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                if (isRunning) return;
                minInput.value = btn.getAttribute('data-min');
                secInput.value = btn.getAttribute('data-sec');
                resetTimer();
            });
        });
    }

    function addHistory(m, s) {
        const label = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        timerHistory = timerHistory.filter(item => item.label !== label);
        timerHistory.unshift({ m, s, label });
        if (timerHistory.length > 10) {
            timerHistory.pop();
        }
        localStorage.setItem('science_club_timer_history', JSON.stringify(timerHistory));
        renderHistory();
    }

    function updateDisplay() {
        const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const s = String(totalSeconds % 60).padStart(2, '0');
        display.textContent = `${m}:${s}`;
    }

    function startTimer() {
        if (isRunning) return;
        if (totalSeconds <= 0) return;

        const currentM = parseInt(minInput.value) || 0;
        const currentS = parseInt(secInput.value) || 0;
        if (currentM > 0 || currentS > 0) {
            addHistory(currentM, currentS);
        }

        isRunning = true;
        minInput.disabled = true;
        secInput.disabled = true;
        startBtn.style.display = 'none';
        stopBtn.style.display = 'inline-block';

        timerId = setInterval(() => {
            totalSeconds--;
            updateDisplay();
            if (totalSeconds <= 0) {
                clearInterval(timerId);
                isRunning = false;
                
                timerSound.currentTime = 0;
                timerSound.play().catch(e => console.warn("音声再生エラー:", e));
                alert('⏲️ タイマー終了です！');
                timerSound.pause();
                timerSound.currentTime = 0;

                resetTimer();
            }
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerId);
        isRunning = false;
        startBtn.style.display = 'inline-block';
        stopBtn.style.display = 'none';
    }

    function resetTimer() {
        stopTimer();
        minInput.disabled = false;
        secInput.disabled = false;
        const m = parseInt(minInput.value) || 0;
        const s = parseInt(secInput.value) || 0;
        totalSeconds = m * 60 + s;
        updateDisplay();
    }

    minInput.addEventListener('change', resetTimer);
    secInput.addEventListener('change', resetTimer);

    startBtn.addEventListener('click', () => {
        if (!isRunning && totalSeconds <= 0) resetTimer();
        startTimer();
    });

    stopBtn.addEventListener('click', stopTimer);
    resetBtn.addEventListener('click', resetTimer);

    resetTimer();
    renderHistory();
});
