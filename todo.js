// todo.js - ToDoリスト管理 ＆ LocalStorage使用量グラフ

(function () {
  const TODO_STORAGE_KEY = 'science_club_todos_v1';
  const MAX_INPUT_LINES = 5;
  // 一般的なブラウザの LocalStorage 上限目安 (5MB)
  const ESTIMATED_MAX_BYTES = 5 * 1024 * 1024;

  function loadTodos() {
    try {
      const raw = localStorage.getItem(TODO_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('ToDo読み込みエラー:', e);
      return [];
    }
  }

  function saveTodos(todos) {
    localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  // LocalStorage のカテゴリ別サイズ（UTF-16 2バイト/文字ベースで推定）を計算
  function calculateStorageUsage() {
    let chatBytes = 0;
    let eventBytes = 0;
    let todoBytes = 0;
    let otherBytes = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const val = localStorage.getItem(key) || '';
      const bytes = (key.length + val.length) * 2;

      if (key === TODO_STORAGE_KEY) {
        todoBytes += bytes;
      } else if (key.includes('chat')) {
        chatBytes += bytes;
      } else if (key.includes('events')) {
        eventBytes += bytes;
      } else {
        otherBytes += bytes;
      }
    }

    const totalUsed = chatBytes + eventBytes + todoBytes + otherBytes;
    const remaining = Math.max(0, ESTIMATED_MAX_BYTES - totalUsed);

    return {
      chatBytes,
      eventBytes,
      todoBytes,
      otherBytes,
      totalUsed,
      remaining
    };
  }

  function updateStorageChart() {
    const barContainer = document.getElementById('todoStorageBar');
    const summaryEl = document.getElementById('todoStorageSummary');
    const legendEl = document.getElementById('todoStorageLegend');
    if (!barContainer || !summaryEl || !legendEl) return;

    const usage = calculateStorageUsage();

    const segments = [
      { label: 'チャット', bytes: usage.chatBytes, color: '#007bff' },
      { label: '予定のキャッシュ', bytes: usage.eventBytes, color: '#28a745' },
      { label: 'ToDo', bytes: usage.todoBytes, color: '#fd7e14' },
      { label: 'その他', bytes: usage.otherBytes, color: '#6c757d' }
    ];

    // 積み上げ棒グラフを描画
    barContainer.innerHTML = '';
    segments.forEach(seg => {
      if (seg.bytes <= 0) return;
      const pct = (seg.bytes / ESTIMATED_MAX_BYTES) * 100;
      const div = document.createElement('div');
      div.className = 'todo-storage-segment';
      div.style.width = `${pct}%`;
      div.style.minWidth = '4px';
      div.style.backgroundColor = seg.color;
      div.title = `${seg.label}: ${formatBytes(seg.bytes)}`;
      barContainer.appendChild(div);
    });

    const usedPct = ((usage.totalUsed / ESTIMATED_MAX_BYTES) * 100).toFixed(2);
    summaryEl.textContent = `使用中: ${formatBytes(usage.totalUsed)} / 推定上限 5.00 MB（残り約 ${formatBytes(usage.remaining)}・使用率 ${usedPct}%）`;

    // 色付き凡例を描画（・チャット / ・予定のキャッシュ / ・ToDo / ・その他）
    legendEl.innerHTML = '';
    segments.forEach(seg => {
      const item = document.createElement('span');
      item.className = 'todo-legend-item';

      const dot = document.createElement('span');
      dot.className = 'todo-legend-dot';
      dot.style.color = seg.color;
      dot.textContent = '・';

      const text = document.createElement('span');
      text.textContent = `${seg.label} (${formatBytes(seg.bytes)})`;

      item.appendChild(dot);
      item.appendChild(text);
      legendEl.appendChild(item);
    });
  }

  function renderTodoList() {
    const listEl = document.getElementById('todoListContainer');
    const countEl = document.getElementById('todoCountBadge');
    if (!listEl) return;

    const todos = loadTodos();
    if (countEl) countEl.textContent = `${todos.length}件`;

    listEl.innerHTML = '';

    if (todos.length === 0) {
      listEl.innerHTML = '<div class="todo-empty-msg">登録されたToDoはありません。上の欄から追加してください。</div>';
      updateStorageChart();
      return;
    }

    todos.forEach((todo, index) => {
      const row = document.createElement('div');
      row.className = 'todo-item-row';

      const textSpan = document.createElement('span');
      textSpan.className = 'todo-item-text';
      textSpan.textContent = todo.text;

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'todo-item-actions';

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'todo-edit-btn';
      editBtn.textContent = '編集';

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'todo-delete-btn';
      deleteBtn.textContent = '削除';

      // 編集モード切り替え
      editBtn.addEventListener('click', () => {
        if (row.classList.contains('is-editing')) return;
        row.classList.add('is-editing');

        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.className = 'todo-inline-edit-input';
        editInput.value = todo.text;

        const saveEditBtn = document.createElement('button');
        saveEditBtn.type = 'button';
        saveEditBtn.className = 'todo-save-edit-btn';
        saveEditBtn.textContent = '保存';

        const cancelEditBtn = document.createElement('button');
        cancelEditBtn.type = 'button';
        cancelEditBtn.className = 'todo-cancel-edit-btn';
        cancelEditBtn.textContent = '取消';

        const commitEdit = () => {
          const newText = editInput.value.trim();
          if (!newText) {
            alert('ToDoの内容を入力してください');
            return;
          }
          const current = loadTodos();
          if (current[index]) {
            current[index].text = newText;
            current[index].updatedAt = Date.now();
            saveTodos(current);
          }
          renderTodoList();
        };

        editInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commitEdit();
          } else if (e.key === 'Escape') {
            renderTodoList();
          }
        });

        saveEditBtn.addEventListener('click', commitEdit);
        cancelEditBtn.addEventListener('click', () => renderTodoList());

        row.innerHTML = '';
        row.appendChild(editInput);

        const editActions = document.createElement('div');
        editActions.className = 'todo-item-actions';
        editActions.appendChild(saveEditBtn);
        editActions.appendChild(cancelEditBtn);
        row.appendChild(editActions);

        editInput.focus();
      });

      // 削除処理
      deleteBtn.addEventListener('click', () => {
        const current = loadTodos();
        current.splice(index, 1);
        saveTodos(current);
        renderTodoList();
      });

      actionsDiv.appendChild(editBtn);
      actionsDiv.appendChild(deleteBtn);

      row.appendChild(textSpan);
      row.appendChild(actionsDiv);
      listEl.appendChild(row);
    });

    updateStorageChart();
  }

  function enforceMaxLines(textarea, lineCountEl) {
    const lines = textarea.value.split(/\r?\n/);
    if (lines.length > MAX_INPUT_LINES) {
      textarea.value = lines.slice(0, MAX_INPUT_LINES).join('\n');
    }
    if (lineCountEl) {
      const nonEmptyCount = textarea.value
        .split(/\r?\n/)
        .filter(l => l.trim() !== '').length;
      const totalLines = textarea.value === '' ? 0 : textarea.value.split(/\r?\n/).length;
      lineCountEl.textContent = `${totalLines} / ${MAX_INPUT_LINES}行（登録対象: ${nonEmptyCount}件）`;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const todoInput = document.getElementById('todoMultiInput');
    const todoAddBtn = document.getElementById('todoAddBtn');
    const todoLineCount = document.getElementById('todoLineCount');

    if (todoInput) {
      todoInput.addEventListener('input', () => enforceMaxLines(todoInput, todoLineCount));
      todoInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const lines = todoInput.value.split(/\r?\n/);
          if (lines.length >= MAX_INPUT_LINES) {
            e.preventDefault();
          }
        }
      });
      enforceMaxLines(todoInput, todoLineCount);
    }

    if (todoAddBtn && todoInput) {
      todoAddBtn.addEventListener('click', () => {
        const lines = todoInput.value
          .split(/\r?\n/)
          .map(line => line.trim())
          .filter(line => line !== '')
          .slice(0, MAX_INPUT_LINES);

        if (lines.length === 0) {
          alert('追加するToDoを入力してください（1行につき1つ）');
          return;
        }

        const current = loadTodos();
        const now = Date.now();
        lines.forEach((text, i) => {
          current.push({
            id: `${now}_${i}`,
            text: text,
            createdAt: now
          });
        });

        saveTodos(current);
        todoInput.value = '';
        enforceMaxLines(todoInput, todoLineCount);
        renderTodoList();
      });
    }

    // ToDoタブを開いたときにLocalStorageグラフを最新化
    const todoNavBtn = document.querySelector('.nav-tab[data-target="todo-pane"]');
    if (todoNavBtn) {
      todoNavBtn.addEventListener('click', () => {
        renderTodoList();
      });
    }

    renderTodoList();
  });
})();
