const dataRef = "starPlayerCard";

function defaultCardData() {
    var cardData = new Object;
    cardData.name = getName();
    cardData.cardName = i18next.t('card.caracteristics.player_name');
    cardData.teamName = i18next.t('card.caracteristics.team_name');
    cardData.showTeamName = false;
    cardData.playsFor = "";
    cardData.specialRules = i18next.t('card.caracteristics.rulename');
    cardData.keywords = "";
    cardData.footer = "100,000";
    cardData.cardText = i18next.t('card.caracteristics.body_text');
    cardData.ma = 6;
    cardData.st = 3;
    cardData.ag = 3;
    cardData.pa = 4;
    cardData.av = 8;
    cardData.base64Image = null;
    cardData.imageUrl = null;
    cardData.imageProperties = getDefaultModelImageProperties();
    cardData.backgroundType = "bg1";

    return cardData;
}

function drawCardText(value, yStart, maxLinesForNormalFont, keywords=false, isSpecialRule=false) {
    let context = getContext();
    context.font = `32px franklin-gothic-book`;
    if(keywords == true){
        context.font = 'italic 24px brothers-regular';
        context.fillStyle = '#223f7d';
        context.textAlign = "left";
        context.textBaseline = "middle";
    }
    else{
        context.textAlign = "left";
        context.textBaseline = "middle";
    }
    
    let xStart = 265;

    let minFontSize = 18;
    let fontSize = 32;
    let lineHeight = 28;

    let maxWidth = 495;
    let maxHeight = keywords === false && isSpecialRule === false ? 130 : 305;
    while (fontSize > minFontSize) {
        textLines = [];
        const paragraphs = value.split('\n');
        for (const paragraph of paragraphs) {
            if (paragraph === '') {
                textLines.push('');
                continue;
            }

            const words = paragraph.split(' ');
            let currentLine = words[0] || '';

            for (let i = 1; i < words.length; i++) {
                const word = words[i];
                const testLine = currentLine + ' ' + word;
                const metrics = context.measureText(testLine);
                
                if (metrics.width > maxWidth) {
                    textLines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            }
            textLines.push(currentLine);
        }

        const totalHeight = textLines.length * (fontSize * 1.2);
        if (totalHeight <= maxHeight) {
            break;
        }
        if (fontSize > minFontSize) {
            fontSize -= 2;
        }
        context.font = `${fontSize}px franklin-gothic-book`;
    }

    if(keywords == true){

        let fillStyle = '#223f7d';
        context.font = 'italic 24px brothers-regular';
        context.fillStyle = fillStyle;
    }
    else{

        let fillStyle = 'black';
        context.font = `${fontSize}px franklin-gothic-book`;
        context.fillStyle = fillStyle;
    }

    let isFirstLine = true;
    textLines.forEach((line, index) => {
        if (isSpecialRule && isFirstLine) {
            let splitWords = line.split(':');
            let ruleName = splitWords[0] + ':';
            let restOfText = splitWords[1];
            context.font = `bold ${fontSize}px franklin-gothic-book`;
            context.fillText(ruleName, xStart, yStart + index * fontSize);

            let sizeRuleName = context.measureText(ruleName).width;
            context.font = `${fontSize}px franklin-gothic-book`;
            context.fillText(restOfText, xStart + sizeRuleName, yStart + index * fontSize);
            isFirstLine = false;
        }
        else {
            context.fillText(line, xStart, yStart + index * fontSize);
        }
    });
}

drawCardName = function (value) {
    getContext().fillStyle = 'black';
    getContext().textAlign = "left";
    getContext().textBaseline = "middle";
    getContext().rotate(-5 * Math.PI / 180);

    // Set the initial font size
    var fontSize = 70;

    // Check if the value is 18 characters or more
    if (value.length >= 18) {
        // Calculate the maximum width based on the desired length
        var maxWidth = 600;

        // Calculate the width of the text with the current font size
        getContext().font = 'italic ' + fontSize + 'px brothers-regular';
        var textWidth = getContext().measureText(value).width;

        // Reduce font size if the text width exceeds the maximum width
        while (textWidth > maxWidth && fontSize > 1) {
            fontSize--;
            getContext().font = 'italic ' + fontSize + 'px brothers-regular';
            textWidth = getContext().measureText(value).width;
        }
    }

    // Set the font size and draw the text with black shadow
    getContext().font = 'italic ' + fontSize + 'px brothers-regular';
    writeScaled(value, { x: 80 + 4, y: 160 + 4 });

    // Set the font size and draw the text in white
    getContext().fillStyle = 'white';
    writeScaled(value, { x: 80, y: 160 });
    getContext().rotate(5 * Math.PI / 180);
}

drawTeamName = function (value, isShowTeamName) {
    if(isShowTeamName == false){
        return;
    }
    const txt = " " + value + "  ";
    getContext().font = 'italic 32px brothers-regular';
    getContext().textAlign = "left";
    getContext().textBaseline = "top";
    getContext().rotate(-5 * Math.PI / 180);

    const textMetrics = getContext().measureText(txt);
    const textWidth = textMetrics.width+5;
    const textHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent+5;

    const padding = 5;
    const x = 736-textWidth;
    const y = 182+textHeight;
    const rectX = x - padding;
    const rectY = y - padding;
    const rectWidth = textWidth + (padding * 2);
    const rectHeight = textHeight + (padding * 2);

    getContext().beginPath();
    getContext().moveTo(rectX, rectY); // Top-left
    getContext().lineTo(rectX + rectWidth, rectY); // Top-right
    getContext().lineTo(rectX + rectWidth - 3, rectY + rectHeight); // Bottom-right
    getContext().lineTo(rectX - 3,  rectY + rectHeight); // Bottom-left
    getContext().closePath();

    getContext().fillStyle = '#b4191e';
    getContext().fill();
    getContext().strokeStyle = "#f0a70b";
    getContext().lineWidth = 5;
    getContext().stroke();

    getContext().fillStyle = 'black';
    writeScaled(txt, { x: x + 4, y: y + 4 });
    getContext().fillStyle = 'white';
    writeScaled(txt, { x: x, y: y });
    getContext().rotate(+5 * Math.PI / 180);
}

drawFooter = function (value) {
    getContext().font = '28px brothers-regular';
    getContext().fillStyle = 'white';
    getContext().textAlign = "center";
    getContext().textBaseline = "middle";
    writeScaled(value, { x: 164, y: 1013 });
}

drawKeywords = function (value) {
    drawCardText(value, 1034, 1, true, false)
}

drawCapacity = function (value, x, y){
    let angle = 90 * Math.PI / 180;
    getContext().translate( canvas.width / 3, canvas.height / 3 );
    getContext().font = 'bold 32px brothers-regular';
    getContext().fillStyle = 'white';
    getContext().textAlign = "center";
    getContext().textBaseline = "middle";
    getContext().rotate(angle);
    writeScaled(value, { x, y});
    getContext().rotate(-angle);
    getContext().translate( -canvas.width / 3, -canvas.height / 3 );

}

drawSkilstraits = function (value, x=261, y=659){
    getContext().font = 'bold 28px brothers-regular';
    getContext().fillStyle = '#b4191e';
    getContext().textAlign = "left";
    getContext().textBaseline = "middle";
    writeScaled(value, { x, y });
}

drawCardBodyTitle = function (value, y=659 ,x=261 ){
    getContext().font = 'bold 28px brothers-regular';
    getContext().fillStyle = '#b4191e';
    getContext().textAlign = "left";
    getContext().textBaseline = "middle";
    writeScaled(value, { x, y });
}

drawGoldPrice = function (value, x, y){
    getContext().font = 'bold 40px brothers-regular';
    getContext().fillStyle = 'white';
    getContext().textAlign = "center";
    getContext().textBaseline = "middle";
    getContext().shadowColor = "black";
    getContext().shadowBlur = 2
    getContext().shadowOffsetX = 2;
    getContext().shadowOffsetY = 2;
    writeScaled(value, { x: 162, y: 975 });
    getContext().shadowColor = "";
    getContext().shadowBlur = 0
    getContext().shadowOffsetX = 0;
    getContext().shadowOffsetY = 0;
}

async function drawCardFrame(cardData) {
    await document.fonts.ready;
    await pageReady();
    //set texts for translation
    let skills_traits = i18next.t('card.caracteristics.skills_traits');
    let plays_for = i18next.t('card.caracteristics.plays_for');
    let special_rules = i18next.t('card.caracteristics.special_rules');
    let MA = i18next.t('card.caracteristics.MA');
    let ST = i18next.t('card.caracteristics.ST');
    let AG = i18next.t('card.caracteristics.AG');
    let PA = i18next.t('card.caracteristics.PA');
    let AV = i18next.t('card.caracteristics.AV');
    let GP = i18next.t('card.caracteristics.GP');

    getContext().drawImage(document.getElementById('star_frame'), 0, 0, getCanvas().width, getCanvas().height);

    if (!document.getElementById("removeBorder").checked) {
        getContext().drawImage(document.getElementById('border'), 0, 0, getCanvas().width, getCanvas().height);
    }

    if (document.getElementById("dashLine").checked) {
        getContext().strokeStyle = 'black';
        getContext().lineWidth = 1;
        getContext().setLineDash([4, 4]);
        getContext().strokeRect(35, 35, 752, 1052);
        getContext().setLineDash([]);
    }

    drawTeamName(cardData.teamName, cardData.showTeamName);
    drawCardName(cardData.cardName);
    drawFooter(cardData.footer);

    drawGoldPrice(GP);

    yStart = 550;

    drawCardText(cardData.cardText, yStart, 3, false, false);

    drawCardBodyTitle(skills_traits.toUpperCase(), 513);
    drawCardBodyTitle(plays_for.toUpperCase(), 650);
    drawCardText(cardData.playsFor, 680, 2, false, false);
    drawCardBodyTitle(special_rules.toUpperCase(), 750);
    drawCardText(cardData.specialRules, 780, 8, false, true);

    drawKeywords(cardData.keywords);

    drawCapacity(MA, -108, 208);
    drawCapacity(ST, 40, 208);
    drawCapacity(AG, 195, 208);
    drawCapacity(PA, 345, 208);
    drawCapacity(AV, 498, 208);
    // MA
    drawNumber(cardData.ma, 120, 224, false);
    // ST
    drawNumber(cardData.st, 120, 375, false);
    // AG
    drawNumber(cardData.ag, 120, 527, true);
    // PA
    drawNumber(cardData.pa, 120, 680, true);
    // AV
    drawNumber(cardData.av, 120, 832, true);

}

function drawNumber(num,x, y, plus){
    suffix = "sp";

    if(num<1 || num>11 ) {
        num = '-';
        plus = false;
    }
    if(num>9){
        getContext().drawImage(document.getElementById('sf1'+suffix), x-15, y, 35, 70);
        x = x + 35-15;
        num = num -10;
    }
    elementId = 'sf'+num+suffix;

    if(num == 1) {
        width = 35;
        x = x+9;
    } else {
        width = 53;
    }

    getContext().drawImage(document.getElementById(elementId), x, y, width, 70);
    if (plus){
        getContext().drawImage(document.getElementById('sf+'+suffix), x+width, y, 39, 70);
    }
}

function waitForImageElement(image) {
    if (image.complete && image.naturalWidth > 0) {
        return Promise.resolve(image);
    }
    return new Promise((resolve, reject) => {
        image.addEventListener("load", () => resolve(image), { once: true });
        image.addEventListener("error", reject, { once: true });
    });
}

function loadCanvasImage(src) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = src;
    });
}

render = async function (cardData) {
    await document.fonts.ready;
    await pageReady();

    const canvas = getCanvas();
    const context = getContext();
    const background = document.getElementById(cardData.backgroundType);
    await waitForImageElement(background);

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(background, 0, 0, canvas.width, canvas.height);

    if (cardData.imageUrl) {
        const image = await loadCanvasImage(cardData.imageUrl);
        const position = scalePixelPosition({ x: 100 + cardData.imageProperties.offsetX, y: cardData.imageProperties.offsetY });
        const scale = cardData.imageProperties.scalePercent / 100.0;
        const width = image.width * scale;
        const height = image.height * scale;
        context.drawImage(image, position.x, position.y, width, height);
    }

    await drawCardFrame(cardData);
}

function readControls() {
    var data = new Object;
    data.name = getName();
    data.imageUrl = getModelImageUrl();
    data.imageProperties = getModelImageProperties();
    data.cardName = document.getElementById("cardName").value;
    data.teamName = document.getElementById("teamName").value;
    data.showTeamName = document.getElementById("showTeamName").checked;
    data.footer = document.getElementById("footer").value;
    data.cardText = document.getElementById("cardText").value;
    data.ma = document.getElementById("ma").value;
    data.st = document.getElementById("st").value;
    data.ag = document.getElementById("ag").value;
    data.pa = document.getElementById("pa").value;
    data.av = document.getElementById("av").value;
    
    data.playsFor = document.getElementById("playsFor").value;
    data.specialRules = document.getElementById("specialRules").value;
    data.keywords = document.getElementById("keywords").value;

    data.backgroundType = document.getElementById("backgroundType").value;
    return data;
}

async function writeControls(cardData) {
    // here we check for base64 loaded image and convert it back to imageUrl
    if (cardData.base64Image != null) {

        // first convert to blob
        const dataToBlob = async (imageData) => {
            return await (await fetch(imageData)).blob();
        };
        const blob = await dataToBlob(cardData.base64Image);
        // then create URL object
        cardData.imageUrl = URL.createObjectURL(blob);
        // Now that's saved, clear out the base64 so we don't reassign
        cardData.base64Image = null;
    } else {
        cardData.imageUrl = null;
    }

    setName(cardData.name);
    setModelImage(cardData.imageUrl);
    setModelImageProperties(cardData.imageProperties);

    $("#cardName")[0].value = cardData.cardName;
    $("#teamName")[0].value = cardData.teamName;
    $("#showTeamName")[0].value = cardData.showTeamName;
    $("#footer")[0].value = cardData.footer;
    $("#ma")[0].value = cardData.ma;
    $("#st")[0].value = cardData.st;
    $("#ag")[0].value = cardData.ag;
    $("#pa")[0].value = cardData.pa;
    $("#av")[0].value = cardData.av;
    $("#cardText")[0].value = cardData.cardText;
    $("#backgroundType")[0].value = cardData.backgroundType;

    document.getElementById("showTeamName").checked = cardData.showTeamName;

    document.getElementById("playsFor").value = cardData.playsFor;
    document.getElementById("specialRules").value = cardData.specialRules;
    document.getElementById("keywords").value = cardData.keywords;

    // render the updated info
    await render(cardData);
    return cardData;
}

function waitForI18n() {
    if (window.i18next && i18next.isInitialized) {
        return Promise.resolve();
    }
    return new Promise(resolve => {
        const interval = window.setInterval(() => {
            if (window.i18next && i18next.isInitialized) {
                window.clearInterval(interval);
                resolve();
            }
        }, 25);
    });
}

function starCanvasToBlob() {
    return new Promise((resolve, reject) => {
        getCanvas().toBlob(blob => {
            if (blob) resolve(blob);
            else reject(new Error("Unable to render card image"));
        }, "image/png");
    });
}

async function renderStarDataForPrint(cardData, options = {}) {
    await waitForI18n();

    document.getElementById("removeBorder").checked = Boolean(options.removeBorder);
    document.getElementById("dashLine").checked = Boolean(options.dashLine);

    // writeControls converts the embedded base64 portrait to a temporary URL,
    // so work on a copy and leave the preset object untouched.
    const printableData = JSON.parse(JSON.stringify(cardData));
    await writeControls(printableData);
    const blob = await starCanvasToBlob();

    if (printableData.imageUrl && printableData.imageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(printableData.imageUrl);
    }

    return {
        cardName: printableData.cardName,
        blob
    };
}

async function fetchStarPreset(file) {
    const response = await fetch("assets/star/" + file);
    if (!response.ok) {
        throw new Error(`Unable to load ${file} (${response.status})`);
    }
    const cardData = await response.json();
    if (!window.BloodBowlStarLocales) return cardData;
    return BloodBowlStarLocales.localizeCardData(cardData, file);
}

async function renderStarPresetForPrint(file, options = {}) {
    const cardData = await fetchStarPreset(file);
    return renderStarDataForPrint(cardData, options);
}

async function loadStarPresetForEditing(file) {
    await waitForI18n();
    const cardData = await fetchStarPreset(file);
    document.getElementById("removeBorder").checked = false;
    document.getElementById("dashLine").checked = false;
    await writeControls(cardData);
    return { cardName: cardData.cardName };
}

async function loadStarDataForEditing(cardData) {
    await waitForI18n();
    const editableData = JSON.parse(JSON.stringify(cardData));
    document.getElementById("removeBorder").checked = Boolean(editableData.printOptions && editableData.printOptions.removeBorder);
    document.getElementById("dashLine").checked = Boolean(editableData.printOptions && editableData.printOptions.dashLine);
    await writeControls(editableData);
    return { cardName: editableData.cardName };
}

async function exportCurrentStarData() {
    await waitForI18n();
    const cardData = readControls();
    cardData.base64Image = await handleImageUrlFromDisk(cardData.imageUrl);
    cardData.imageUrl = null;
    cardData.printOptions = {
        removeBorder: document.getElementById("removeBorder").checked,
        dashLine: document.getElementById("dashLine").checked
    };
    return cardData;
}

window.BloodBowlStarRenderer = Object.freeze({
    exportCurrentData: exportCurrentStarData,
    loadData: loadStarDataForEditing,
    loadPreset: loadStarPresetForEditing,
    renderData: renderStarDataForPrint,
    renderPreset: renderStarPresetForPrint
});

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("embedded") === "1") {
        document.querySelector("nav")?.classList.add("d-none");
    }

    waitForI18n().then(async () => {
        const select = document.getElementById("preset");
        if (!select) return;

        let presets = [...select.options].map(option => ({ file: option.value, name: option.textContent }));
        if (window.BloodBowlStarLocales) {
            presets = await BloodBowlStarLocales.localizePresetList(presets);
        }
        presets.forEach((preset, index) => {
            select.options[index].textContent = preset.name;
        });
        window.BloodBowlPresetCombobox?.refresh(select);
    }).catch(console.error);
});
