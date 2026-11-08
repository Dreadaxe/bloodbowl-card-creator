const dataRef = "printSheet";

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

function markSheetsStale() {
    generatedSheets = false;
    document.getElementById("printSheetsButton").disabled = true;
}

function getVisibleRows() {
    return [...document.querySelectorAll(".star-list-item:not([hidden])")];
}

function getSelectedEntries() {
    return [...document.querySelectorAll(".star-list-item")]
        .map(row => {
            const checkbox = row.querySelector(".star-checkbox");
            const quantity = row.querySelector(".star-quantity");
            if (!checkbox.checked) return null;
            return {
                file: row.dataset.file,
                name: row.dataset.name,
                quantity: Math.max(1, Number.parseInt(quantity.value, 10) || 1)
            };
        })
        .filter(Boolean);
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
    document.getElementById("generateSheetsButton").disabled = totalCards === 0;
    markSheetsStale();
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
        updateSelectionSummary();
    });

    const label = document.createElement("label");
    label.htmlFor = checkbox.id;
    label.textContent = preset.name;
    label.title = preset.name;

    const quantity = document.createElement("input");
    quantity.className = "form-control form-control-sm star-quantity";
    quantity.type = "number";
    quantity.min = "1";
    quantity.max = "99";
    quantity.value = "1";
    quantity.disabled = true;
    quantity.setAttribute("aria-label", `${preset.name} quantity`);
    quantity.addEventListener("input", updateSelectionSummary);

    row.append(checkbox, label, quantity);
    return row;
}

async function loadPresetIndex() {
    const response = await fetch("assets/star/index.json");
    if (!response.ok) {
        throw new Error(`Unable to load Star Player list (${response.status})`);
    }
    presets = await response.json();

    const list = document.getElementById("starList");
    const fragment = document.createDocumentFragment();
    presets.forEach((preset, index) => fragment.append(createPresetRow(preset, index)));
    list.replaceChildren(fragment);
    updateSelectionSummary();
}

function filterPresets() {
    const query = document.getElementById("starSearch").value.trim().toLocaleLowerCase();
    document.querySelectorAll(".star-list-item").forEach(row => {
        row.hidden = query !== "" && !row.dataset.normalizedName.includes(query);
    });
}

function selectVisiblePresets() {
    getVisibleRows().forEach(row => {
        row.querySelector(".star-checkbox").checked = true;
        row.querySelector(".star-quantity").disabled = false;
    });
    updateSelectionSummary();
}

function clearSelection() {
    document.querySelectorAll(".star-list-item").forEach(row => {
        row.querySelector(".star-checkbox").checked = false;
        row.querySelector(".star-quantity").disabled = true;
        row.querySelector(".star-quantity").value = "1";
    });
    updateSelectionSummary();
}

function waitForRenderer() {
    const frame = document.getElementById("cardRendererFrame");
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

function registerObjectUrl(blob) {
    const url = URL.createObjectURL(blob);
    renderedObjectUrls.push(url);
    return url;
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

    if (options.showCutLines) {
        const guide = document.createElement("span");
        guide.className = "trim-guide";
        guide.style.left = `${useFullBleed ? bleedXmm : 0}mm`;
        guide.style.top = `${useFullBleed ? bleedYmm : 0}mm`;
        guide.style.width = `${PRINT_CONSTANTS.trimWidthMm}mm`;
        guide.style.height = `${PRINT_CONSTANTS.trimHeightMm}mm`;
        card.append(guide);
    }

    return card;
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

async function generateSheets() {
    const selected = getSelectedEntries();
    if (selected.length === 0) return;

    const generateButton = document.getElementById("generateSheetsButton");
    const printButton = document.getElementById("printSheetsButton");
    const includeBleed = document.getElementById("includeBleed").checked;
    const showCutLines = document.getElementById("showCutLines").checked;
    const backFile = document.getElementById("backImage").files[0] || null;
    const duplexFlip = document.getElementById("duplexFlip").value;

    generateButton.disabled = true;
    printButton.disabled = true;
    setError("");
    revokeRenderedUrls();

    try {
        const renderer = await waitForRenderer();
        const renderedCards = new Map();
        let renderedCount = 0;
        setProgress(0, selected.length);

        for (const entry of selected) {
            const result = await renderer.renderPreset(entry.file, {
                removeBorder: includeBleed,
                dashLine: false
            });
            const prepared = await prepareCardBlob(result.blob, includeBleed);
            renderedCards.set(entry.file, {
                name: entry.name,
                url: registerObjectUrl(prepared.blob),
                fullBleed: prepared.fullBleed
            });
            renderedCount += 1;
            setProgress(renderedCount, selected.length);
        }

        let backEntry = null;
        if (backFile) {
            const preparedBack = await prepareCardBlob(backFile, includeBleed);
            backEntry = {
                name: translate("print.card_back", { defaultValue: "Card back" }),
                url: registerObjectUrl(preparedBack.blob),
                fullBleed: preparedBack.fullBleed
            };
        }

        const cards = selected.flatMap(entry =>
            Array.from({ length: entry.quantity }, () => renderedCards.get(entry.file))
        );
        const preview = document.getElementById("printPreview");
        preview.replaceChildren();

        let sheetCount = 0;
        for (let offset = 0; offset < cards.length; offset += PRINT_CONSTANTS.cardsPerPage) {
            const frontEntries = cards.slice(offset, offset + PRINT_CONSTANTS.cardsPerPage);
            while (frontEntries.length < PRINT_CONSTANTS.cardsPerPage) frontEntries.push(null);
            sheetCount += 1;
            const options = { includeBleed, showCutLines };
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
        generatedSheets = true;
        printButton.disabled = false;
    } catch (error) {
        console.error(error);
        setError(error.message || translate("print.unknown_error", { defaultValue: "Unable to generate print sheets." }));
    } finally {
        document.getElementById("renderProgress").classList.add("d-none");
        generateButton.disabled = getSelectedEntries().length === 0;
    }
}

function printSheets() {
    if (generatedSheets) window.print();
}

function onBackImageChanged() {
    const hasBack = document.getElementById("backImage").files.length > 0;
    document.getElementById("duplexOptions").classList.toggle("d-none", !hasBack);
    markSheetsStale();
}

document.addEventListener("DOMContentLoaded", async () => {
    document.getElementById("starSearch").addEventListener("input", filterPresets);
    document.getElementById("selectVisibleButton").addEventListener("click", selectVisiblePresets);
    document.getElementById("clearSelectionButton").addEventListener("click", clearSelection);
    document.getElementById("includeBleed").addEventListener("change", markSheetsStale);
    document.getElementById("showCutLines").addEventListener("change", markSheetsStale);
    document.getElementById("backImage").addEventListener("change", onBackImageChanged);
    document.getElementById("duplexFlip").addEventListener("change", markSheetsStale);
    document.getElementById("generateSheetsButton").addEventListener("click", generateSheets);
    document.getElementById("printSheetsButton").addEventListener("click", printSheets);

    if (window.i18next) {
        i18next.on("languageChanged", updateSelectionSummary);
    }

    try {
        await loadPresetIndex();
    } catch (error) {
        console.error(error);
        setError(error.message);
    }
});

window.addEventListener("beforeunload", revokeRenderedUrls);
