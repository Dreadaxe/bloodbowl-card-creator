const dataRef = "printSheet";
const PRINT_STATE_KEY = "print-sheet";

// The shared i18n bootstrap expects every page to expose the card editor hooks.
// The print page has no editable card state, so these are intentionally minimal.
function defaultCardData() {
    return { name: dataRef };
}

function readControls() {
    return defaultCardData();
}

function writeControls() {
    return Promise.resolve();
}

function refreshSaveSlots() {}

const PRINT_CONSTANTS = Object.freeze({
    pageWidthMm: 210,
    pageHeightMm: 297,
    columns: 3,
    rows: 3,
    cardsPerPage: 9,
    trimWidthMm: 63,
    trimHeightMm: 88,
    sourceWidth: 822,
    sourceHeight: 1122,
    trimX: 35,
    trimY: 35,
    trimWidth: 752,
    trimHeight: 1052
});

const bleedXmm = PRINT_CONSTANTS.trimWidthMm * PRINT_CONSTANTS.trimX / PRINT_CONSTANTS.trimWidth;
const bleedYmm = PRINT_CONSTANTS.trimHeightMm * PRINT_CONSTANTS.trimY / PRINT_CONSTANTS.trimHeight;
const fullWidthMm = PRINT_CONSTANTS.trimWidthMm + (bleedXmm * 2);
const fullHeightMm = PRINT_CONSTANTS.trimHeightMm + (bleedYmm * 2);

let presets = [];
let renderedObjectUrls = [];
let generatedSheets = false;
let renderTimer = null;
let renderVersion = 0;
let renderInProgress = false;
let renderPending = false;
let statePersistenceReady = false;
let stateSaveTimer = null;
const editedCards = new Map();
let queuedRecords = [];
let queuedBack = null;
let rememberedBackFile = null;
let editingFile = null;
let cardEditorModal = null;

function translate(key, options = {}) {
    if (window.i18next && i18next.isInitialized) {
        return i18next.t(key, options);
    }
    return options.defaultValue || key;
}

function setError(message) {
    const error = document.getElementById("printError");
    error.textContent = message;
    error.classList.toggle("d-none", !message);
}

function normalizeQuantity(value) {
    return Math.min(99, Math.max(1, Number.parseInt(value, 10) || 1));
}

function serializePrintState() {
    const presetSelections = [...document.querySelectorAll(".star-list-item")]
        .filter(row => row.querySelector(".star-checkbox").checked)
        .map(row => ({
            file: row.dataset.file,
            quantity: normalizeQuantity(row.querySelector(".star-quantity").value)
        }));
    const queuedSelections = [...document.querySelectorAll(".queued-card-item")]
        .filter(row => row.querySelector(".queued-card-checkbox").checked)
        .map(row => ({
            id: row.dataset.id,
            quantity: normalizeQuantity(row.querySelector(".queued-card-quantity").value)
        }));

    return {
        version: 1,
        search: document.getElementById("starSearch").value,
        presetSelections,
        queuedSelections,
        options: {
            includeBleed: document.getElementById("includeBleed").checked,
            showPageMarks: document.getElementById("showPageMarks").checked,
            duplexFlip: document.getElementById("duplexFlip").value
        },
        editedCards: [...editedCards.entries()],
        rememberedBackFile
    };
}

async function persistPrintState() {
    window.clearTimeout(stateSaveTimer);
    stateSaveTimer = null;
    if (!statePersistenceReady || !window.BloodBowlPrintQueue?.setState) return;
    await BloodBowlPrintQueue.setState(PRINT_STATE_KEY, serializePrintState());
}

function schedulePrintStateSave(delay = 180) {
    if (!statePersistenceReady) return;
    window.clearTimeout(stateSaveTimer);
    stateSaveTimer = window.setTimeout(() => {
        persistPrintState().catch(error => {
            console.error(error);
            setError(error.message);
        });
    }, delay);
}

function updateRememberedBackNotice() {
    const notice = document.getElementById("rememberedBackNotice");
    notice.classList.toggle("d-none", !rememberedBackFile);
    document.getElementById("rememberedBackName").textContent = rememberedBackFile
        ? translate("print.remembered_back_name", {
            name: rememberedBackFile.name,
            defaultValue: `Remembered back: ${rememberedBackFile.name}`
        })
        : "";
}

async function restorePrintState() {
    const saved = window.BloodBowlPrintQueue?.getState
        ? await BloodBowlPrintQueue.getState(PRINT_STATE_KEY)
        : null;

    if (saved) {
        const options = saved.options || {};
        if (typeof options.includeBleed === "boolean") {
            document.getElementById("includeBleed").checked = options.includeBleed;
        }
        if (typeof options.showPageMarks === "boolean") {
            document.getElementById("showPageMarks").checked = options.showPageMarks;
        }
        if (["long", "short"].includes(options.duplexFlip)) {
            document.getElementById("duplexFlip").value = options.duplexFlip;
        }
        if (typeof saved.search === "string") {
            document.getElementById("starSearch").value = saved.search;
            filterPresets();
        }

        rememberedBackFile = saved.rememberedBackFile?.blob ? saved.rememberedBackFile : null;
        editedCards.clear();
        (saved.editedCards || []).forEach(([file, data]) => editedCards.set(file, data));

        const presetSelections = new Map(
            (saved.presetSelections || []).map(item => [item.file, item])
        );
        document.querySelectorAll(".star-list-item").forEach(row => {
            const selection = presetSelections.get(row.dataset.file);
            if (!selection) return;
            row.querySelector(".star-checkbox").checked = true;
            row.querySelector(".star-quantity").disabled = false;
            row.querySelector(".star-quantity").value = String(normalizeQuantity(selection.quantity));
            row.querySelector(".star-edit-button").disabled = false;
        });

        const queuedSelections = new Map(
            (saved.queuedSelections || []).map(item => [item.id, item])
        );
        document.querySelectorAll(".queued-card-item").forEach(row => {
            const selection = queuedSelections.get(row.dataset.id);
            if (!selection) return;
            row.querySelector(".queued-card-checkbox").checked = true;
            row.querySelector(".queued-card-quantity").disabled = false;
            row.querySelector(".queued-card-quantity").value = String(normalizeQuantity(selection.quantity));
        });

        editedCards.forEach((data, file) => updateEditedRow(file));
    }

    statePersistenceReady = true;
    updateRememberedBackNotice();
    updateQueuedBackNotice();
    updateSelectionSummary();
}

function showEmptyPreview() {
    revokeRenderedUrls();
    const empty = document.createElement("div");
    empty.className = "print-empty-state";
    empty.id = "printEmptyState";
    empty.dataset.i18n = "print.empty_preview";
    empty.textContent = translate("print.empty_preview", {
        defaultValue: "Select at least one Star Player to preview the sheets."
    });
    document.getElementById("printPreview").replaceChildren(empty);
    document.getElementById("pageSummary").textContent = "";
    generatedSheets = false;
    document.getElementById("printSheetsButton").disabled = true;
    document.getElementById("renderProgress").classList.add("d-none");
}

function queueSheetRender(delay = 180) {
    window.clearTimeout(renderTimer);
    renderTimer = window.setTimeout(runScheduledRender, delay);
}

function scheduleSheetRender(options = {}) {
    schedulePrintStateSave(options.immediate ? 0 : 180);
    renderVersion += 1;
    generatedSheets = false;
    document.getElementById("printSheetsButton").disabled = true;

    if (getSelectedEntries().length === 0) {
        showEmptyPreview();
        return;
    }

    if (renderInProgress) {
        renderPending = true;
        return;
    }

    queueSheetRender(options.immediate ? 0 : 180);
}

async function runScheduledRender() {
    renderTimer = null;
    if (renderInProgress) {
        renderPending = true;
        return;
    }

    const requestedVersion = renderVersion;
    renderInProgress = true;
    renderPending = false;
    await generateSheets(requestedVersion);
    renderInProgress = false;

    if (renderPending || requestedVersion !== renderVersion) {
        renderPending = false;
        if (getSelectedEntries().length > 0) queueSheetRender(0);
    }
}

function getVisibleRows() {
    return [...document.querySelectorAll(".star-list-item:not([hidden])")];
}

function getSelectedEntries() {
    const presetsSelected = [...document.querySelectorAll(".star-list-item")]
        .map(row => {
            const checkbox = row.querySelector(".star-checkbox");
            const quantity = row.querySelector(".star-quantity");
            if (!checkbox.checked) return null;
            return {
                key: `preset:${row.dataset.file}`,
                kind: "preset",
                file: row.dataset.file,
                name: row.dataset.name,
                quantity: normalizeQuantity(quantity.value)
            };
        })
        .filter(Boolean);

    const queuedSelected = [...document.querySelectorAll(".queued-card-item")]
        .map(row => {
            const checkbox = row.querySelector(".queued-card-checkbox");
            const quantity = row.querySelector(".queued-card-quantity");
            if (!checkbox.checked) return null;
            const record = queuedRecords.find(item => item.id === row.dataset.id);
            if (!record) return null;
            return {
                key: `queue:${record.id}`,
                kind: "queue",
                id: record.id,
                name: record.name,
                blob: record.blob,
                quantity: normalizeQuantity(quantity.value)
            };
        })
        .filter(Boolean);

    return [...presetsSelected, ...queuedSelected];
}

function updateSelectionSummary() {
    const selected = getSelectedEntries();
    const totalCards = selected.reduce((sum, entry) => sum + entry.quantity, 0);
    const summary = document.getElementById("selectionSummary");

    summary.textContent = translate("print.selection_summary", {
        count: selected.length,
        cards: totalCards,
        defaultValue: `${selected.length} selected · ${totalCards} cards`
    });
    document.getElementById("cardCount").textContent = totalCards;
    scheduleSheetRender();
}

function createPresetRow(preset, index) {
    const row = document.createElement("div");
    row.className = "star-list-item";
    row.dataset.file = preset.file;
    row.dataset.name = preset.name;
    row.dataset.normalizedName = preset.name.toLocaleLowerCase();

    const checkbox = document.createElement("input");
    checkbox.className = "form-check-input star-checkbox";
    checkbox.type = "checkbox";
    checkbox.id = `star-${index}`;
    checkbox.addEventListener("change", () => {
        quantity.disabled = !checkbox.checked;
        editButton.disabled = !checkbox.checked;
        updateSelectionSummary();
    });

    const name = document.createElement("div");
    name.className = "star-name";

    const label = document.createElement("label");
    label.htmlFor = checkbox.id;
    label.textContent = preset.name;
    label.title = preset.name;

    const editedBadge = document.createElement("span");
    editedBadge.className = "badge text-bg-warning star-edited-badge d-none";
    editedBadge.dataset.i18n = "print.edited";
    editedBadge.textContent = translate("print.edited", { defaultValue: "Edited" });
    name.append(label, editedBadge);

    const quantity = document.createElement("input");
    quantity.className = "form-control form-control-sm star-quantity";
    quantity.type = "number";
    quantity.min = "1";
    quantity.max = "99";
    quantity.value = "1";
    quantity.disabled = true;
    quantity.setAttribute("aria-label", `${preset.name} quantity`);
    quantity.addEventListener("input", updateSelectionSummary);

    const actions = document.createElement("div");
    actions.className = "star-actions";

    const editButton = document.createElement("button");
    editButton.className = "btn btn-sm btn-outline-primary star-edit-button";
    editButton.type = "button";
    editButton.disabled = true;
    editButton.dataset.i18n = "print.edit";
    editButton.textContent = translate("print.edit", { defaultValue: "Edit" });
    editButton.addEventListener("click", () => openCardEditor(preset.file, preset.name));

    const restoreButton = document.createElement("button");
    restoreButton.className = "btn btn-sm btn-outline-secondary star-restore-button d-none";
    restoreButton.type = "button";
    restoreButton.dataset.i18n = "print.restore";
    restoreButton.textContent = translate("print.restore", { defaultValue: "Restore" });
    restoreButton.addEventListener("click", () => restorePreset(preset.file));

    actions.append(editButton, restoreButton);
    row.append(checkbox, name, quantity, actions);
    return row;
}

async function loadPresetIndex() {
    const response = await fetch("assets/star/index.json");
    if (!response.ok) {
        throw new Error(`Unable to load Star Player list (${response.status})`);
    }
    presets = await response.json();
    if (window.BloodBowlStarLocales) {
        presets = await BloodBowlStarLocales.localizePresetList(presets);
    }

    const list = document.getElementById("starList");
    const fragment = document.createDocumentFragment();
    presets.forEach((preset, index) => fragment.append(createPresetRow(preset, index)));
    list.replaceChildren(fragment);
}

function filterPresets() {
    const query = document.getElementById("starSearch").value.trim().toLocaleLowerCase();
    document.querySelectorAll(".star-list-item").forEach(row => {
        row.hidden = query !== "" && !row.dataset.normalizedName.includes(query);
    });
    schedulePrintStateSave();
}

function selectVisiblePresets() {
    getVisibleRows().forEach(row => {
        row.querySelector(".star-checkbox").checked = true;
        row.querySelector(".star-quantity").disabled = false;
        row.querySelector(".star-edit-button").disabled = false;
    });
    updateSelectionSummary();
}

function clearSelection() {
    document.querySelectorAll(".star-list-item").forEach(row => {
        row.querySelector(".star-checkbox").checked = false;
        row.querySelector(".star-quantity").disabled = true;
        row.querySelector(".star-edit-button").disabled = true;
        row.querySelector(".star-quantity").value = "1";
    });
    document.querySelectorAll(".queued-card-item").forEach(row => {
        row.querySelector(".queued-card-checkbox").checked = false;
        row.querySelector(".queued-card-quantity").disabled = true;
        row.querySelector(".queued-card-quantity").value = "1";
    });
    updateSelectionSummary();
}

async function resetPrintState() {
    window.clearTimeout(stateSaveTimer);
    stateSaveTimer = null;
    statePersistenceReady = false;

    editedCards.clear();
    rememberedBackFile = null;
    document.getElementById("backImage").value = "";
    document.getElementById("starSearch").value = "";
    document.getElementById("includeBleed").checked = false;
    document.getElementById("showPageMarks").checked = true;
    document.getElementById("duplexFlip").value = "long";

    document.querySelectorAll(".star-list-item").forEach(row => {
        row.hidden = false;
        row.querySelector(".star-checkbox").checked = false;
        row.querySelector(".star-quantity").disabled = true;
        row.querySelector(".star-quantity").value = "1";
        row.querySelector(".star-edit-button").disabled = true;
        updateEditedRow(row.dataset.file);
    });
    document.querySelectorAll(".queued-card-item").forEach(row => {
        row.querySelector(".queued-card-checkbox").checked = false;
        row.querySelector(".queued-card-quantity").disabled = true;
        row.querySelector(".queued-card-quantity").value = "1";
    });

    if (window.BloodBowlPrintQueue?.removeState) {
        await BloodBowlPrintQueue.removeState(PRINT_STATE_KEY);
    }
    statePersistenceReady = true;
    updateRememberedBackNotice();
    updateQueuedBackNotice();
    updateSelectionSummary();
}

function createQueuedCardRow(record, autoSelect) {
    const row = document.createElement("div");
    row.className = "queued-card-item";
    row.dataset.id = record.id;

    const checkbox = document.createElement("input");
    checkbox.className = "form-check-input queued-card-checkbox";
    checkbox.type = "checkbox";
    checkbox.id = `queued-${record.id}`;
    checkbox.checked = autoSelect;

    const label = document.createElement("label");
    label.htmlFor = checkbox.id;
    label.textContent = record.name;
    label.title = record.name;

    const quantity = document.createElement("input");
    quantity.className = "form-control form-control-sm queued-card-quantity";
    quantity.type = "number";
    quantity.min = "1";
    quantity.max = "99";
    quantity.value = "1";
    quantity.disabled = !autoSelect;
    quantity.addEventListener("input", updateSelectionSummary);

    checkbox.addEventListener("change", () => {
        quantity.disabled = !checkbox.checked;
        updateSelectionSummary();
    });

    const actions = document.createElement("div");
    actions.className = "star-actions";

    const reopenButton = document.createElement("button");
    reopenButton.className = "btn btn-sm btn-outline-primary";
    reopenButton.type = "button";
    reopenButton.dataset.i18n = "print.reopen_editor";
    reopenButton.textContent = translate("print.reopen_editor", { defaultValue: "Edit" });
    reopenButton.addEventListener("click", async () => {
        try {
            await persistPrintState();
        } catch (error) {
            console.error(error);
        } finally {
            window.location.href = record.sourcePage || "index.html";
        }
    });

    const removeButton = document.createElement("button");
    removeButton.className = "btn btn-sm btn-outline-danger";
    removeButton.type = "button";
    removeButton.dataset.i18n = "print.remove";
    removeButton.textContent = translate("print.remove", { defaultValue: "Remove" });
    removeButton.addEventListener("click", () => removeQueuedRecord(record.id));

    actions.append(reopenButton, removeButton);
    row.append(checkbox, label, quantity, actions);
    return row;
}

async function loadPrintQueue() {
    if (!window.BloodBowlPrintQueue) return;
    queuedRecords = await BloodBowlPrintQueue.getAll();
    const addedId = new URLSearchParams(window.location.search).get("added");
    const frontRecords = queuedRecords.filter(record => record.type !== "back");
    const backRecords = queuedRecords.filter(record => record.type === "back");
    queuedBack = backRecords.length ? backRecords[backRecords.length - 1] : null;

    const panel = document.getElementById("queuedCardsPanel");
    const list = document.getElementById("queuedCardList");
    panel.classList.toggle("d-none", frontRecords.length === 0);
    list.replaceChildren(...frontRecords.map(record => createQueuedCardRow(record, record.id === addedId)));
    if (addedId) {
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("added");
        window.history.replaceState({}, "", `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`);
    }
    updateQueuedBackNotice();
    if (statePersistenceReady) updateSelectionSummary();
}

function updateQueuedBackNotice() {
    const notice = document.getElementById("queuedBackNotice");
    notice.classList.toggle("d-none", !queuedBack);
    document.getElementById("queuedBackName").textContent = queuedBack
        ? translate("print.queued_back_name", {
            name: queuedBack.name,
            defaultValue: `Queued back: ${queuedBack.name}`
        })
        : "";
    const hasBack = Boolean(queuedBack || rememberedBackFile || document.getElementById("backImage").files.length);
    document.getElementById("duplexOptions").classList.toggle("d-none", !hasBack);
}

async function removeQueuedRecord(id) {
    await BloodBowlPrintQueue.remove(id);
    await loadPrintQueue();
}

async function clearPrintQueue() {
    await BloodBowlPrintQueue.clear();
    await loadPrintQueue();
}

async function removeQueuedBack() {
    if (!queuedBack) return;
    await removeQueuedRecord(queuedBack.id);
}

function waitForFrameRenderer(frameId = "cardRendererFrame") {
    const frame = document.getElementById(frameId);
    const startedAt = Date.now();

    return new Promise((resolve, reject) => {
        const check = () => {
            try {
                const renderer = frame.contentWindow && frame.contentWindow.BloodBowlStarRenderer;
                if (renderer && typeof renderer.renderPreset === "function") {
                    resolve(renderer);
                    return;
                }
            } catch (error) {
                reject(error);
                return;
            }

            if (Date.now() - startedAt > 20000) {
                reject(new Error(translate("print.renderer_timeout", {
                    defaultValue: "The card renderer did not start. Reload the page and try again."
                })));
                return;
            }
            window.setTimeout(check, 100);
        };
        check();
    });
}

function waitForRenderer() {
    return waitForFrameRenderer("cardRendererFrame");
}

function updateEditedRow(file) {
    const row = [...document.querySelectorAll(".star-list-item")].find(item => item.dataset.file === file);
    if (!row) return;
    const isEdited = editedCards.has(file);
    row.querySelector(".star-edited-badge").classList.toggle("d-none", !isEdited);
    row.querySelector(".star-restore-button").classList.toggle("d-none", !isEdited);
}

async function openCardEditor(file, fallbackName) {
    editingFile = file;
    const loading = document.getElementById("cardEditorLoading");
    const applyButton = document.getElementById("applyCardChangesButton");
    const title = document.getElementById("cardEditorModalTitle");
    loading.classList.remove("is-ready");
    applyButton.disabled = true;
    title.textContent = translate("print.edit_named_card", {
        name: fallbackName,
        defaultValue: `Edit ${fallbackName}`
    });
    cardEditorModal.show();

    try {
        const editor = await waitForFrameRenderer("cardEditorFrame");
        const result = editedCards.has(file)
            ? await editor.loadData(editedCards.get(file))
            : await editor.loadPreset(file);
        const cardName = result.cardName || fallbackName;
        title.textContent = translate("print.edit_named_card", {
            name: cardName,
            defaultValue: `Edit ${cardName}`
        });
        loading.classList.add("is-ready");
        applyButton.disabled = false;
    } catch (error) {
        cardEditorModal.hide();
        setError(error.message);
    }
}

async function applyCardChanges() {
    if (!editingFile) return;
    const button = document.getElementById("applyCardChangesButton");
    button.disabled = true;
    try {
        const editor = await waitForFrameRenderer("cardEditorFrame");
        editedCards.set(editingFile, await editor.exportCurrentData());
        updateEditedRow(editingFile);
        scheduleSheetRender({ immediate: true });
        await persistPrintState();
        cardEditorModal.hide();
    } catch (error) {
        setError(error.message);
        button.disabled = false;
    }
}

async function restorePreset(file) {
    editedCards.delete(file);
    updateEditedRow(file);
    scheduleSheetRender({ immediate: true });
    await persistPrintState();
}

function localizeDynamicControls() {
    document.querySelectorAll("[data-i18n='print.edit']").forEach(element => {
        element.textContent = translate("print.edit", { defaultValue: "Edit" });
    });
    document.querySelectorAll("[data-i18n='print.restore']").forEach(element => {
        element.textContent = translate("print.restore", { defaultValue: "Restore" });
    });
    document.querySelectorAll("[data-i18n='print.edited']").forEach(element => {
        element.textContent = translate("print.edited", { defaultValue: "Edited" });
    });
    document.querySelectorAll("[data-i18n='print.reopen_editor']").forEach(element => {
        element.textContent = translate("print.reopen_editor", { defaultValue: "Edit" });
    });
    document.querySelectorAll("[data-i18n='print.remove']").forEach(element => {
        element.textContent = translate("print.remove", { defaultValue: "Remove" });
    });
    updateRememberedBackNotice();
    updateQueuedBackNotice();
}

function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
            if (blob) resolve(blob);
            else reject(new Error("Unable to create image"));
        }, "image/png");
    });
}

async function decodeImage(blob) {
    if ("createImageBitmap" in window) {
        return createImageBitmap(blob);
    }

    const url = URL.createObjectURL(blob);
    try {
        const image = new Image();
        await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = reject;
            image.src = url;
        });
        return image;
    } finally {
        URL.revokeObjectURL(url);
    }
}

async function cropToTrim(blob) {
    const image = await decodeImage(blob);
    const width = image.width || image.naturalWidth;
    const height = image.height || image.naturalHeight;
    const sourceRatio = width / height;
    const generatorRatio = PRINT_CONSTANTS.sourceWidth / PRINT_CONSTANTS.sourceHeight;

    // Files exported by this generator include a 35 px bleed band. Other card
    // images are kept intact and fitted to the standard 63 x 88 mm trim size.
    if (Math.abs(sourceRatio - generatorRatio) > 0.01) {
        if (typeof image.close === "function") image.close();
        return { blob, hasGeneratorBleed: false };
    }

    const scaleX = width / PRINT_CONSTANTS.sourceWidth;
    const scaleY = height / PRINT_CONSTANTS.sourceHeight;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(PRINT_CONSTANTS.trimWidth * scaleX);
    canvas.height = Math.round(PRINT_CONSTANTS.trimHeight * scaleY);
    canvas.getContext("2d").drawImage(
        image,
        PRINT_CONSTANTS.trimX * scaleX,
        PRINT_CONSTANTS.trimY * scaleY,
        PRINT_CONSTANTS.trimWidth * scaleX,
        PRINT_CONSTANTS.trimHeight * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
    );
    if (typeof image.close === "function") image.close();
    return { blob: await canvasToBlob(canvas), hasGeneratorBleed: true };
}

function revokeRenderedUrls() {
    renderedObjectUrls.forEach(url => URL.revokeObjectURL(url));
    renderedObjectUrls = [];
}

async function prepareCardBlob(blob, includeBleed) {
    if (includeBleed) {
        const image = await decodeImage(blob);
        const width = image.width || image.naturalWidth;
        const height = image.height || image.naturalHeight;
        if (typeof image.close === "function") image.close();
        const hasGeneratorBleed = Math.abs((width / height) - (PRINT_CONSTANTS.sourceWidth / PRINT_CONSTANTS.sourceHeight)) <= 0.01;
        return { blob, fullBleed: hasGeneratorBleed };
    }

    const cropped = await cropToTrim(blob);
    return { blob: cropped.blob, fullBleed: false };
}

function setProgress(current, total) {
    const progress = document.getElementById("renderProgress");
    const bar = document.getElementById("renderProgressBar");
    const percent = total === 0 ? 0 : Math.round(current / total * 100);
    progress.classList.remove("d-none");
    progress.setAttribute("aria-valuenow", String(percent));
    bar.style.width = `${percent}%`;
    bar.textContent = `${percent}%`;
}

function getSheetGeometry(includeBleed) {
    const cellWidth = includeBleed ? fullWidthMm : PRINT_CONSTANTS.trimWidthMm;
    const cellHeight = includeBleed ? fullHeightMm : PRINT_CONSTANTS.trimHeightMm;
    return {
        cellWidth,
        cellHeight,
        left: (PRINT_CONSTANTS.pageWidthMm - (cellWidth * PRINT_CONSTANTS.columns)) / 2,
        top: (PRINT_CONSTANTS.pageHeightMm - (cellHeight * PRINT_CONSTANTS.rows)) / 2
    };
}

function createCardElement(entry, slotIndex, options) {
    const geometry = getSheetGeometry(options.includeBleed);
    const row = Math.floor(slotIndex / PRINT_CONSTANTS.columns);
    const column = slotIndex % PRINT_CONSTANTS.columns;
    const cellLeft = geometry.left + (column * geometry.cellWidth);
    const cellTop = geometry.top + (row * geometry.cellHeight);
    const useFullBleed = options.includeBleed && entry.fullBleed;

    const card = document.createElement("div");
    card.className = "print-card";
    card.style.left = `${cellLeft + (useFullBleed ? 0 : (options.includeBleed ? bleedXmm : 0))}mm`;
    card.style.top = `${cellTop + (useFullBleed ? 0 : (options.includeBleed ? bleedYmm : 0))}mm`;
    card.style.width = `${useFullBleed ? fullWidthMm : PRINT_CONSTANTS.trimWidthMm}mm`;
    card.style.height = `${useFullBleed ? fullHeightMm : PRINT_CONSTANTS.trimHeightMm}mm`;

    const image = document.createElement("img");
    image.src = entry.url;
    image.alt = entry.name || "";
    card.append(image);

    return card;
}

function uniqueCoordinates(values) {
    return values
        .sort((a, b) => a - b)
        .filter((value, index, array) => index === 0 || Math.abs(value - array[index - 1]) > 0.01);
}

function getTrimBoundaries(options) {
    const geometry = getSheetGeometry(options.includeBleed);
    const x = [];
    const y = [];

    for (let column = 0; column < PRINT_CONSTANTS.columns; column += 1) {
        const start = geometry.left + (column * geometry.cellWidth) + (options.includeBleed ? bleedXmm : 0);
        x.push(start, start + PRINT_CONSTANTS.trimWidthMm);
    }

    for (let row = 0; row < PRINT_CONSTANTS.rows; row += 1) {
        const start = geometry.top + (row * geometry.cellHeight) + (options.includeBleed ? bleedYmm : 0);
        y.push(start, start + PRINT_CONSTANTS.trimHeightMm);
    }

    return { x: uniqueCoordinates(x), y: uniqueCoordinates(y) };
}

function createPageCutMark(classes, positionProperty, positionMm) {
    const mark = document.createElement("span");
    mark.className = `page-cut-mark ${classes}`;
    mark.style[positionProperty] = `${positionMm}mm`;
    mark.setAttribute("aria-hidden", "true");
    return mark;
}

function addPageCutMarks(page, options) {
    if (!options.showPageMarks) return;

    const boundaries = getTrimBoundaries(options);
    boundaries.x.forEach(x => {
        page.append(
            createPageCutMark("page-cut-mark-vertical page-cut-mark-top", "left", x),
            createPageCutMark("page-cut-mark-vertical page-cut-mark-bottom", "left", x)
        );
    });
    boundaries.y.forEach(y => {
        page.append(
            createPageCutMark("page-cut-mark-horizontal page-cut-mark-left", "top", y),
            createPageCutMark("page-cut-mark-horizontal page-cut-mark-right", "top", y)
        );
    });
}

function createPrintPage(entries, type, pageNumber, options) {
    const wrapper = document.createElement("div");
    wrapper.className = "print-page-wrapper";

    const label = document.createElement("div");
    label.className = "print-page-label";
    label.textContent = translate(type === "front" ? "print.front_page" : "print.back_page", {
        page: pageNumber,
        defaultValue: `${type === "front" ? "Front" : "Back"} ${pageNumber}`
    });

    const page = document.createElement("div");
    page.className = `print-page print-page-${type}`;
    page.dataset.pageType = type;
    addPageCutMarks(page, options);
    entries.forEach((entry, index) => {
        if (entry) page.append(createCardElement(entry, index, options));
    });

    wrapper.append(label, page);
    return wrapper;
}

function mirrorBackEntries(frontEntries, backEntry, flip) {
    const backs = new Array(PRINT_CONSTANTS.cardsPerPage).fill(null);
    frontEntries.forEach((entry, index) => {
        if (!entry) return;
        const row = Math.floor(index / PRINT_CONSTANTS.columns);
        const column = index % PRINT_CONSTANTS.columns;
        const targetRow = flip === "short" ? (PRINT_CONSTANTS.rows - 1 - row) : row;
        const targetColumn = flip === "long" ? (PRINT_CONSTANTS.columns - 1 - column) : column;
        backs[(targetRow * PRINT_CONSTANTS.columns) + targetColumn] = backEntry;
    });
    return backs;
}

async function generateSheets(requestedVersion) {
    const selected = getSelectedEntries();
    if (selected.length === 0) {
        showEmptyPreview();
        return;
    }

    const printButton = document.getElementById("printSheetsButton");
    const includeBleed = document.getElementById("includeBleed").checked;
    const showPageMarks = document.getElementById("showPageMarks").checked;
    const selectedBackFile = document.getElementById("backImage").files[0] || null;
    const backFile = selectedBackFile || (rememberedBackFile && rememberedBackFile.blob) || null;
    const backFileName = selectedBackFile?.name || rememberedBackFile?.name || "";
    const duplexFlip = document.getElementById("duplexFlip").value;

    printButton.disabled = true;
    setError("");
    const nextObjectUrls = [];
    const registerNextObjectUrl = blob => {
        const url = URL.createObjectURL(blob);
        nextObjectUrls.push(url);
        return url;
    };

    try {
        const renderer = await waitForRenderer();
        const renderedCards = new Map();
        let renderedCount = 0;
        setProgress(0, selected.length);

        for (const entry of selected) {
            let sourceBlob;
            if (entry.kind === "preset") {
                const editedData = editedCards.get(entry.file);
                const renderOptions = editedData && editedData.printOptions
                    ? editedData.printOptions
                    : { removeBorder: includeBleed, dashLine: false };
                const result = editedData
                    ? await renderer.renderData(editedData, renderOptions)
                    : await renderer.renderPreset(entry.file, renderOptions);
                sourceBlob = result.blob;
            } else {
                sourceBlob = entry.blob;
            }

            const prepared = await prepareCardBlob(sourceBlob, includeBleed);
            renderedCards.set(entry.key, {
                name: entry.name,
                url: registerNextObjectUrl(prepared.blob),
                fullBleed: prepared.fullBleed
            });
            renderedCount += 1;
            setProgress(renderedCount, selected.length);
        }

        let backEntry = null;
        const backSource = backFile || (queuedBack && queuedBack.blob);
        if (backSource) {
            const preparedBack = await prepareCardBlob(backSource, includeBleed);
            backEntry = {
                name: backFile
                    ? backFileName || translate("print.card_back", { defaultValue: "Card back" })
                    : queuedBack.name,
                url: registerNextObjectUrl(preparedBack.blob),
                fullBleed: preparedBack.fullBleed
            };
        }

        if (requestedVersion !== renderVersion) return;

        const cards = selected.flatMap(entry =>
            Array.from({ length: entry.quantity }, () => renderedCards.get(entry.key))
        );
        const preview = document.getElementById("printPreview");
        preview.replaceChildren();

        let sheetCount = 0;
        for (let offset = 0; offset < cards.length; offset += PRINT_CONSTANTS.cardsPerPage) {
            const frontEntries = cards.slice(offset, offset + PRINT_CONSTANTS.cardsPerPage);
            while (frontEntries.length < PRINT_CONSTANTS.cardsPerPage) frontEntries.push(null);
            sheetCount += 1;
            const options = { includeBleed, showPageMarks };
            preview.append(createPrintPage(frontEntries, "front", sheetCount, options));
            if (backEntry) {
                preview.append(createPrintPage(
                    mirrorBackEntries(frontEntries, backEntry, duplexFlip),
                    "back",
                    sheetCount,
                    options
                ));
            }
        }

        document.getElementById("pageSummary").textContent = translate("print.page_summary", {
            sheets: sheetCount,
            pages: sheetCount * (backEntry ? 2 : 1),
            defaultValue: `${sheetCount} sheets · ${sheetCount * (backEntry ? 2 : 1)} pages`
        });
        revokeRenderedUrls();
        renderedObjectUrls = nextObjectUrls.splice(0);
        generatedSheets = true;
        printButton.disabled = false;
    } catch (error) {
        console.error(error);
        setError(error.message || translate("print.unknown_error", { defaultValue: "Unable to generate print sheets." }));
    } finally {
        nextObjectUrls.forEach(url => URL.revokeObjectURL(url));
        document.getElementById("renderProgress").classList.add("d-none");
    }
}

function printSheets() {
    if (generatedSheets) window.print();
}

function onBackImageChanged() {
    const selectedBackFile = document.getElementById("backImage").files[0] || null;
    rememberedBackFile = selectedBackFile
        ? { name: selectedBackFile.name, blob: selectedBackFile }
        : null;
    updateRememberedBackNotice();
    const hasBack = Boolean(rememberedBackFile || queuedBack);
    document.getElementById("duplexOptions").classList.toggle("d-none", !hasBack);
    scheduleSheetRender({ immediate: true });
}

function removeRememberedBack() {
    rememberedBackFile = null;
    document.getElementById("backImage").value = "";
    updateRememberedBackNotice();
    updateQueuedBackNotice();
    scheduleSheetRender({ immediate: true });
}

document.addEventListener("DOMContentLoaded", async () => {
    cardEditorModal = new bootstrap.Modal(document.getElementById("cardEditorModal"));
    document.getElementById("starSearch").addEventListener("input", filterPresets);
    document.getElementById("selectVisibleButton").addEventListener("click", selectVisiblePresets);
    document.getElementById("clearSelectionButton").addEventListener("click", clearSelection);
    document.getElementById("resetPrintStateButton").addEventListener("click", resetPrintState);
    document.getElementById("includeBleed").addEventListener("change", () => scheduleSheetRender({ immediate: true }));
    document.getElementById("showPageMarks").addEventListener("change", () => scheduleSheetRender({ immediate: true }));
    document.getElementById("backImage").addEventListener("change", onBackImageChanged);
    document.getElementById("duplexFlip").addEventListener("change", () => scheduleSheetRender({ immediate: true }));
    document.getElementById("printSheetsButton").addEventListener("click", printSheets);
    document.getElementById("applyCardChangesButton").addEventListener("click", applyCardChanges);
    document.getElementById("clearPrintQueueButton").addEventListener("click", clearPrintQueue);
    document.getElementById("removeQueuedBackButton").addEventListener("click", removeQueuedBack);
    document.getElementById("removeRememberedBackButton").addEventListener("click", removeRememberedBack);
    document.getElementById("cardEditorModal").addEventListener("hidden.bs.modal", () => {
        editingFile = null;
        document.getElementById("applyCardChangesButton").disabled = true;
    });

    if (window.i18next) {
        i18next.on("languageChanged", () => {
            updateSelectionSummary();
            localizeDynamicControls();
        });
    }

    try {
        await Promise.all([loadPresetIndex(), loadPrintQueue()]);
        await restorePrintState();
    } catch (error) {
        console.error(error);
        setError(error.message);
    }
});

window.addEventListener("pagehide", () => {
    persistPrintState().catch(console.error);
    revokeRenderedUrls();
});
