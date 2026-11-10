document.addEventListener('DOMContentLoaded', function() {
    const display = document.getElementById('timerDisplay');
    const minInput = document.getElementById('timerMinutes');
    const secInput = document.getElementById('timerSeconds');
    const startBtn = document.getElementById('timerStartBtn');
    const stopBtn = document.getElementById('timerStopBtn');
    const resetBtn = document.getElementById('timerResetBtn');

    if (!display) return;

    let totalSeconds = 180; // 初期値3分
    let timerId = null;
    let isRunning = false;

    function updateDisplay() {
        const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const s = String(totalSeconds % 60).padStart(2, '0');
        display.textContent = `${m}:${s}`;
    }

    function startTimer() {
        if (isRunning) return;
        if (totalSeconds <= 0) return;

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
                alert('⏲️ タイマー終了です！');
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
});
