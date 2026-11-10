document.addEventListener('DOMContentLoaded', function() {
    const clockEl = document.getElementById('currentClock');
    const timeInput = document.getElementById('alarmTimeInput');
    const setBtn = document.getElementById('setAlarmBtn');
    const listEl = document.getElementById('alarmList');

    const soundFileInput = document.getElementById('soundFileInput');
    const uploadSoundBtn = document.getElementById('uploadSoundBtn');
    const previewSoundBtn = document.getElementById('previewSoundBtn');
    const resetSoundBtn = document.getElementById('resetSoundBtn');
    const soundStatusText = document.getElementById('soundStatusText');

    if (!clockEl) return;

    let alarms = JSON.parse(localStorage.getItem('science_club_alarms') || '[]');
    
    let activeAudio = new Audio('./sound.mp3');
    activeAudio.onerror = () => {
        activeAudio.src = './sound.mp4';
    };
    activeAudio.loop = true; // 🔄 閉じるまでループ再生

    async function loadCustomAudio() {
        try {
            const file = await getCustomAudioFromDB();
            if (file) {
                const audioUrl = URL.createObjectURL(file);
                activeAudio.src = audioUrl;
                if (soundStatusText) soundStatusText.textContent = `📌 カスタム音声適用中: ${file.name || 'カスタム音源'}`;
                if (resetSoundBtn) resetSoundBtn.style.display = 'block';
                if (previewSoundBtn) previewSoundBtn.disabled = false;
            } else {
                if (soundStatusText) soundStatusText.textContent = '📌 デフォルト音（sound.mp3 / sound.mp4）を使用中';
                if (resetSoundBtn) resetSoundBtn.style.display = 'none';
                if (previewSoundBtn) previewSoundBtn.disabled = false;
            }
        } catch (e) {
            console.warn("カスタム音声の読み込み失敗:", e);
            if (previewSoundBtn) previewSoundBtn.disabled = false;
        }
    }
    loadCustomAudio();

    if (uploadSoundBtn && soundFileInput) {
        uploadSoundBtn.addEventListener('click', async () => {
            const file = soundFileInput.files[0];
            if (!file) {
                alert('音声ファイルを選択してください。');
                return;
            }
            try {
                await saveCustomAudioToDB(file);
                await loadCustomAudio();
                alert('音声を保存しました！');
                soundFileInput.value = '';
            } catch (e) {
                alert('音声の保存に失敗しました。');
                console.error(e);
            }
        });
    }

    if (previewSoundBtn) {
        previewSoundBtn.addEventListener('click', () => {
            activeAudio.currentTime = 0;
            const playPromise = activeAudio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn("試聴再生エラー:", error);
                    alert('音声を再生できませんでした。画面を一度クリックしてからお試しください。');
                });
            }
        });
    }

    if (resetSoundBtn) {
        resetSoundBtn.addEventListener('click', async () => {
            if (confirm('カスタム音声を削除して初期音源に戻しますか？')) {
                await deleteCustomAudioFromDB();
                activeAudio.src = './sound.mp3';
                if (soundStatusText) soundStatusText.textContent = '📌 初期音源に戻しました';
                resetSoundBtn.style.display = 'none';
                alert('初期音源に戻しました。');
            }
        });
    }

    function updateClock() {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');
        clockEl.textContent = `${h}:${m}:${s}`;

        const currentHm = `${h}:${m}`;
        alarms.forEach(alarm => {
            if (alarm.time === currentHm && alarm.active && s === '00') {
                activeAudio.currentTime = 0;
                // ブラウザの制限対策としてユーザー操作前に確実に音声を再ロード・再生
                activeAudio.play().then(() => {
                    if (confirm(`⏰ アラーム時刻です！（${alarm.time}）\n[OK]を押すと音を止めます。`)) {
                        activeAudio.pause();
                        activeAudio.currentTime = 0;
                    }
                }).catch(e => {
                    console.warn("アラーム音声自動再生ブロック:", e);
                    alert(`⏰ アラーム時刻です！（${alarm.time}）`);
                    activeAudio.pause();
                    activeAudio.currentTime = 0;
                });

                alarm.active = false; 
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
