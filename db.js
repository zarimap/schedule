// db.js - IndexedDBを用いた音声ファイルの保存・管理
const DB_NAME = 'ScienceClubDB';
const STORE_NAME = 'settings';
const AUDIO_KEY = 'customAlarmSound';

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
}

async function saveCustomAudioToDB(file) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(file, AUDIO_KEY);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
    });
}

async function getCustomAudioFromDB() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(AUDIO_KEY);
        request.onsuccess = () => resolve(request.result); // File または Blob
        request.onerror = () => reject(request.error);
    });
}

async function deleteCustomAudioFromDB() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(AUDIO_KEY);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
    });
}
