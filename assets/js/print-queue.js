(function () {
    const databaseName = "bloodbowl-card-creator";
    const databaseVersion = 1;
    const storeName = "printQueue";
    const statePrefix = "state:";

    function openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(databaseName, databaseVersion);
            request.onupgradeneeded = () => {
                const database = request.result;
                if (!database.objectStoreNames.contains(storeName)) {
                    const store = database.createObjectStore(storeName, { keyPath: "id" });
                    store.createIndex("createdAt", "createdAt");
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async function useStore(mode, callback) {
        const database = await openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(storeName, mode);
            const store = transaction.objectStore(storeName);
            let result;
            try {
                result = callback(store);
            } catch (error) {
                database.close();
                reject(error);
                return;
            }
            transaction.oncomplete = () => {
                database.close();
                resolve(result);
            };
            transaction.onerror = () => {
                database.close();
                reject(transaction.error);
            };
            transaction.onabort = () => {
                database.close();
                reject(transaction.error || new Error("Print queue transaction aborted"));
            };
        });
    }

    function requestResult(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    function canvasToBlob(canvas) {
        return new Promise((resolve, reject) => {
            canvas.toBlob(blob => {
                if (blob) resolve(blob);
                else reject(new Error("Unable to capture the card"));
            }, "image/png");
        });
    }

    function createId() {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return window.crypto.randomUUID();
        }
        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function getCardName(data, type) {
        if (data.cardName) return data.cardName;
        if (data.playName && data.teamName) return `${data.teamName} – ${data.playName}`;
        if (data.playName) return data.playName;
        return type || "Blood Bowl card";
    }

    async function captureData(value) {
        const data = JSON.parse(JSON.stringify(value));
        if (typeof handleImageUrlFromDisk === "function") data.base64Image = data.imageUrl && data.imageUrl !== 'null'
            ? await handleImageUrlFromDisk(data.imageUrl) : null;
        data.imageUrl = null;
        data.printOptions = {
            removeBorder: Boolean(document.getElementById('removeBorder')?.checked),
            dashLine: Boolean(document.getElementById('dashLine')?.checked)
        };
        return data;
    }

    async function addCanvas(type) {
        const controls = typeof readControls === "function" ? readControls() : {};
        const data = await captureData(window.BloodBowlQueueEditor?.augmentData(controls) || controls);
        const editingId = new URLSearchParams(window.location.search).get('queueCard');
        const previous = editingId ? await get(editingId) : null;
        if (editingId && !previous) throw new Error('This queued card no longer exists');
        const currentPage = window.location.pathname.split("/").pop() || "index.html";
        const rendered = window.BloodBowlCardRenderer && ['index.html','star.html','special.html'].includes(currentPage)
            ? await BloodBowlCardRenderer.renderData(data, data.printOptions)
            : {blob:await canvasToBlob(getCanvas())};
        const record = {
            ...previous,
            id: previous?.id || createId(),
            type,
            name: getCardName(data, type),
            blob: rendered.blob,
            data,
            sourcePage: currentPage,
            createdAt: previous?.createdAt || Date.now()
        };
        await useStore("readwrite", store => store.put(record));
        if (editingId) await window.BloodBowlQueueEditor?.finish();
        return record;
    }

    async function get(id) {
        const database = await openDatabase();
        try {
            const record = await requestResult(database.transaction(storeName, 'readonly').objectStore(storeName).get(id));
            return record?.kind === 'state' ? null : record || null;
        } finally { database.close(); }
    }

    async function getAll() {
        const database = await openDatabase();
        try {
            const transaction = database.transaction(storeName, "readonly");
            const records = await requestResult(transaction.objectStore(storeName).getAll());
            return records
                .filter(record => record.kind !== "state")
                .sort((a, b) => a.createdAt - b.createdAt);
        } finally {
            database.close();
        }
    }

    async function remove(id) {
        await useStore("readwrite", store => store.delete(id));
    }

    async function clear() {
        await useStore("readwrite", store => {
            const request = store.openCursor();
            request.onsuccess = () => {
                const cursor = request.result;
                if (!cursor) return;
                if (cursor.value.kind !== "state") cursor.delete();
                cursor.continue();
            };
        });
    }

    async function getState(key) {
        const database = await openDatabase();
        try {
            const transaction = database.transaction(storeName, "readonly");
            const record = await requestResult(transaction.objectStore(storeName).get(`${statePrefix}${key}`));
            return record ? record.value : null;
        } finally {
            database.close();
        }
    }

    async function setState(key, value) {
        await useStore("readwrite", store => store.put({
            id: `${statePrefix}${key}`,
            kind: "state",
            value,
            updatedAt: Date.now()
        }));
    }

    async function removeState(key) {
        await useStore("readwrite", store => store.delete(`${statePrefix}${key}`));
    }

    // Import complete front/back pairs atomically. Recreating a player removes
    // obsolete annexes from that import, without touching other cards or state.
    async function importRecords(records) {
        if (!Array.isArray(records) || !records.length || records.some(record =>
            !record.id || !record.blob || !record.backBlob || !record.bbtc?.batch || !record.bbtc?.number
        )) throw new Error("Incomplete team card import");
        const replacing = new Set(records.map(record => `${record.bbtc.batch}:${record.bbtc.number}`));
        await useStore("readwrite", store => {
            const request = store.openCursor();
            request.onsuccess = () => {
                const cursor = request.result;
                if (cursor) {
                    const imported = cursor.value.bbtc;
                    if (imported && replacing.has(`${imported.batch}:${imported.number}`)) cursor.delete();
                    cursor.continue();
                } else {
                    try { records.forEach(record => store.put(record)); }
                    catch (error) { store.transaction.abort(); }
                }
            };
        });
        return records.map(record => record.id);
    }

    async function sendCurrentCardToPrint(type, button) {
        if (button) button.disabled = true;
        try {
            const record = await addCanvas(type);
            window.location.href = `print.html?added=${encodeURIComponent(record.id)}`;
        } catch (error) {
            console.error(error);
            window.alert(error.message || "Unable to add this card to the print queue.");
            if (button) button.disabled = false;
        }
    }

    window.BloodBowlPrintQueue = Object.freeze({
        addCanvas,
        captureData,
        clear,
        getAll,
        get,
        getState,
        importRecords,
        remove,
        removeState,
        setState
    });
    window.sendCurrentCardToPrint = sendCurrentCardToPrint;
})();


