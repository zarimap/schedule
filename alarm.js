document.addEventListener('DOMContentLoaded', function() {
    const clockEl = document.getElementById('currentClock');
    const timeInput = document.getElementById('alarmTimeInput');
    const setBtn = document.getElementById('setAlarmBtn');
    const listEl = document.getElementById('alarmList');

    if (!clockEl) return;

    let alarms = JSON.parse(localStorage.getItem('science_club_alarms') || '[]');

    function updateClock() {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');
        clockEl.textContent = `${h}:${m}:${s}`;

        // アラームチェック
        const currentHm = `${h}:${m}`;
        alarms.forEach(alarm => {
            if (alarm.time === currentHm && alarm.active && s === '00') {
                alert(`⏰ アラーム時刻です！（${alarm.time}）`);
                alarm.active = false; // 鳴ったら一度無効化
                saveAndRender();
            }
        });
    }

    setInterval(updateClock, 1000);
    updateClock();

    function saveAndRender() {
        localStorage.setItem('science_club_alarms', JSON.stringify(alarms));
        renderAlarms();
    }

    function renderAlarms() {
        if (!listEl) return;
        if (alarms.length === 0) {
            listEl.innerHTML = '<div style="color: #666; font-size: 0.9rem;">設定されたアラームはありません</div>';
            return;
        }

        let html = '';
        alarms.forEach((alarm, index) => {
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; background: #f8f9fa; padding: 8px 12px; border-radius: 6px; border: 1px solid #e0e0e0;">
                    <span style="font-size: 1.2rem; font-weight: bold; color: ${alarm.active ? '#007bff' : '#888'};">${alarm.time}</span>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="window.toggleAlarm(${index})" style="padding: 4px 8px; font-size: 0.8rem; background: ${alarm.active ? '#28a745' : '#6c757d'}; color: white; border: none; border-radius: 4px; cursor: pointer;">${alarm.active ? '有効' : '無効'}</button>
                        <button onclick="window.deleteAlarm(${index})" style="padding: 4px 8px; font-size: 0.8rem; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">削除</button>
                    </div>
                </div>
            `;
        });
        listEl.innerHTML = html;
    }

    if (setBtn) {
        setBtn.addEventListener('click', () => {
            const val = timeInput.value;
            if (!val) {
                alert('時刻を入力してください');
                return;
            }
            alarms.push({ time: val, active: true });
            alarms.sort((a, b) => a.time.localeCompare(b.time));
            saveAndRender();
            timeInput.value = '';
        });
    }

    window.toggleAlarm = function(index) {
        alarms[index].active = !alarms[index].active;
        saveAndRender();
    };

    window.deleteAlarm = function(index) {
        alarms.splice(index, 1);
        saveAndRender();
    };

    renderAlarms();
});
