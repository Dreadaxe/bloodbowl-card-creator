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

    async function addCanvas(type) {
        const data = typeof readControls === "function" ? readControls() : {};
        const record = {
            id: createId(),
            type,
            name: getCardName(data, type),
            blob: await canvasToBlob(getCanvas()),
            sourcePage: window.location.pathname.split("/").pop() || "index.html",
            createdAt: Date.now()
        };
        await useStore("readwrite", store => store.put(record));
        return record;
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
        clear,
        getAll,
        getState,
        remove,
        removeState,
        setState
    });
    window.sendCurrentCardToPrint = sendCurrentCardToPrint;
})();
