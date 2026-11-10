document.addEventListener('DOMContentLoaded', function() {
    const display = document.getElementById('swDisplay');
    const startBtn = document.getElementById('swStartBtn');
    const lapBtn = document.getElementById('swLapBtn');
    const resetBtn = document.getElementById('swResetBtn');
    const lapsContainer = document.getElementById('swLaps');

    if (!display) return;

    let startTime = 0;
    let elapsedTime = 0;
    let timerId = null;
    let isRunning = false;
    let laps = [];

    function formatTime(ms) {
        const minutes = String(Math.floor(ms / 60000)).padStart(2, '0');
        const seconds = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
        const centisec = String(Math.floor((ms % 1000) / 10)).padStart(2, '0');
        return `${minutes}:${seconds}.${centisec}`;
    }

    function updateDisplay() {
        display.textContent = formatTime(elapsedTime);
    }

    function startStopwatch() {
        if (isRunning) return;
        isRunning = true;
        startTime = Date.now() - elapsedTime;
        startBtn.textContent = 'ストップ';
        startBtn.style.background = '#ffc107';
        startBtn.style.color = '#333';
        lapBtn.style.display = 'inline-block';

        timerId = setInterval(() => {
            elapsedTime = Date.now() - startTime;
            updateDisplay();
        }, 10);
    }

    function stopStopwatch() {
        clearInterval(timerId);
        isRunning = false;
        startBtn.textContent = 'スタート';
        startBtn.style.background = '#28a745';
        startBtn.style.color = 'white';
    }

    function resetStopwatch() {
        stopStopwatch();
        elapsedTime = 0;
        laps = [];
        updateDisplay();
        lapsContainer.innerHTML = '';
        lapBtn.style.display = 'none';
    }

    function addLap() {
        laps.push(elapsedTime);
        const lapNum = String(laps.length).padStart(2, '0');
        const lapTime = formatTime(elapsedTime);
        const lapDiv = document.createElement('div');
        lapDiv.style.cssText = 'display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed #eee;';
        lapDiv.innerHTML = `<span>ラップ ${lapNum}</span><strong>${lapTime}</strong>`;
        lapsContainer.prepend(lapDiv);
    }

    startBtn.addEventListener('click', () => {
        if (isRunning) {
            stopStopwatch();
        } else {
            startStopwatch();
        }
    });

    lapBtn.addEventListener('click', addLap);
    resetBtn.addEventListener('click', resetStopwatch);
});
