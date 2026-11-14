const dataRef = "playerCard";

function defaultCardData() {
    var cardData = new Object;
    cardData.name = getName();
    cardData.cardName = i18next.t('card.caracteristics.player_name');
    cardData.teamName = i18next.t('card.caracteristics.team_name');
    cardData.showTeamName = false;
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
    cardData.p_agility = false;
    cardData.p_devious = false;
    cardData.p_general = false;
    cardData.p_passing = false;
    cardData.p_mutations = false;
    cardData.p_strength = false;
    cardData.s_agility = false;
    cardData.s_devious = false;
    cardData.s_general = false;
    cardData.s_passing = false;
    cardData.s_mutations = false;
    cardData.s_strength = false;
    cardData.backgroundType = "bg1";

    return cardData;
}

function drawCardText(value, yStart, maxLinesForNormalFont, keywords=false) {
    let context = getContext();
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
    
    let maxCharactersForThreeLines = 140;
    let minFontSize = 24;

    let xStart = 265;

    let fontSize = 32;
    let lineHeight = 28;
    let fitWidth = 500; // Reduced fitWidth for accommodating 4 lines at smaller font size

    let textLines = splitWordWrap(context, value, fitWidth);

    if (value.length > maxCharactersForThreeLines) {
        maxLinesForNormalFont = 9; // Allow 4 lines if there are more than 300 characters
    }

    if (textLines.length > maxLinesForNormalFont) {
        let fontReductionStep = 2;
        while (textLines.length > maxLinesForNormalFont) {
            fontSize -= fontReductionStep;
            lineHeight = fontSize * 1.2;
            fitWidth = 350 / (fontSize / 36); // Adjust fit width proportionally to the font size
            textLines = splitWordWrap(context, value, fitWidth);
        }
        fontSize = Math.max(fontSize, minFontSize);
        lineHeight = fontSize * 1.2;
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

    textLines.forEach((line, index) => {
        context.fillText(line, xStart, yStart + index * lineHeight);
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
    getContext().strokeStyle = "white";
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
    drawCardText(value, 1034, 1, true)
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

drawPlayerDev = function (value, x, y){
    getContext().font = 'bold 28px brothers-regular';
    getContext().fillStyle = '#b4191e';
    getContext().textAlign = "left";
    getContext().textBaseline = "middle";
    writeScaled(value, { x: 261, y: 856 });
}

drawCardBodyTitle =function (value, y=659 ,x=261 ){
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

drawDevelopment = function (primary, secondary) {
    const context = getContext();
    const x = 261;
    const maxWidth = 500;
    const gap = 8;
    const fontSize = 24;
    const lineHeight = 28;
    const blockGap = 12;
    const lines = [
        {
            label: i18next.t('card.caracteristics.primary') + ":",
            value: primary
        },
        {
            label: i18next.t('card.caracteristics.secondary') + ":",
            value: secondary
        }
    ];

    context.fillStyle = 'black';
    context.textAlign = "left";
    context.textBaseline = "middle";

    context.font = `bold ${fontSize}px franklin-gothic-book`;
    const labelWidth = Math.max(...lines.map(function (line) {
        return context.measureText(line.label).width;
    }));
    const valueX = x + labelWidth + gap;
    const valueWidth = maxWidth - labelWidth - gap;

    const wrapDevelopmentValue = function (value) {
        const categories = value.split(",").map(function (category) {
            return category.trim();
        }).filter(Boolean);
        const wrappedLines = [];
        let currentLine = "";

        context.font = `${fontSize}px franklin-gothic-book`;
        categories.forEach(function (category, index) {
            const suffix = index < categories.length - 1 ? "," : "";
            const nextCategory = category + suffix;
            const candidate = currentLine ? currentLine + " " + nextCategory : nextCategory;

            if (currentLine && context.measureText(candidate).width > valueWidth) {
                wrappedLines.push(currentLine);
                currentLine = nextCategory;
            } else {
                currentLine = candidate;
            }
        });

        if (currentLine) {
            wrappedLines.push(currentLine);
        }

        return wrappedLines.length ? wrappedLines : [""];
    };

    let y = 890;
    lines.forEach(function (line, lineIndex) {
        const wrappedValue = wrapDevelopmentValue(line.value);
        context.font = `bold ${fontSize}px franklin-gothic-book`;
        writeScaled(line.label, { x, y });

        wrappedValue.forEach(function (valueLine, valueIndex) {
            context.font = `${fontSize}px franklin-gothic-book`;
            writeScaled(valueLine, { x: valueX, y: y + valueIndex * lineHeight });
        });

        y += wrappedValue.length * lineHeight;
        if (lineIndex < lines.length - 1) {
            y += blockGap;
        }
    });
}

async function drawCardFrame(cardData) {
    await document.fonts.ready;
    await pageReady();
    //set texts for translation
    let skills_traits = i18next.t('card.caracteristics.skills_traits');
    let player_development = i18next.t('card.caracteristics.player_development');
    let agility = i18next.t('card.caracteristics.agility');
    let devious = i18next.t('card.caracteristics.devious');
    let general = i18next.t('card.caracteristics.general');
    let mutations = i18next.t('card.caracteristics.mutations');
    let passing = i18next.t('card.caracteristics.passing');
    let strength = i18next.t('card.caracteristics.strength');
    let MA = i18next.t('card.caracteristics.MA');
    let ST = i18next.t('card.caracteristics.ST');
    let AG = i18next.t('card.caracteristics.AG');
    let PA = i18next.t('card.caracteristics.PA');
    let AV = i18next.t('card.caracteristics.AV');
    let GP = i18next.t('card.caracteristics.GP');

    getContext().drawImage(document.getElementById('frame'), 0, 0, getCanvas().width, getCanvas().height);

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

    yStart = 700;

    drawCardText(cardData.cardText, yStart, 3);

    drawCardBodyTitle(skills_traits.toUpperCase());

    drawCardBodyTitle(player_development.toUpperCase(), 856);

    drawKeywords(cardData.keywords);

    primary = "";
    if (cardData.p_agility) {
        primary = primary + agility;
    }
    if (primary != "" && cardData.p_devious) {
        primary = primary + ", ";
    }
    if (cardData.p_devious) {
        primary = primary + devious;
    }
    if (primary != "" && cardData.p_general) {
        primary = primary + ", ";
    }
    if (cardData.p_general) {
        primary = primary + general;
    }
    if (primary != "" && cardData.p_mutations) {
        primary = primary + ", ";
    }
    if (cardData.p_mutations) {
        primary = primary + mutations;
    }
    if (primary != "" && cardData.p_passing) {
        primary = primary + ", ";
    }
    if (cardData.p_passing) {
        primary = primary + passing;
    }
    if (primary != "" && cardData.p_strength) {
        primary = primary + ", ";
    }
    if (cardData.p_strength) {
        primary = primary + strength;
    }

    secondary = "";
    if (cardData.s_agility) {
        secondary = secondary + agility;
    }
    if (secondary != "" && cardData.s_devious) {
        secondary = secondary + ", ";
    }
    if (cardData.s_devious) {
        secondary = secondary + devious;
    }
    if (secondary != "" && cardData.s_general) {
        secondary = secondary + ", ";
    }
    if (cardData.s_general) {
        secondary = secondary + general;
    }
    if (secondary != "" && cardData.s_mutations) {
        secondary = secondary + ", ";
    }
    if (cardData.s_mutations) {
        secondary = secondary + mutations;
    }
    if (secondary != "" && cardData.s_passing) {
        secondary = secondary + ", ";
    }
    if (cardData.s_passing) {
        secondary = secondary + passing;
    }
    if (secondary != "" && cardData.s_strength) {
        secondary = secondary + ", ";
    }
    if (cardData.s_strength) {
        secondary = secondary + strength;
    }
    drawDevelopment(primary, secondary);

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
    //AV
    drawNumber(cardData.av, 120, 832, true);

}

function drawNumber(num,x, y, plus){
    suffix = "";

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

render = function (cardData) {
    // First the textured background
    getContext().drawImage(document.getElementById(cardData.backgroundType), 0, 0, getCanvas().width, getCanvas().height);

    if (cardData.imageUrl) {
        var image = new Image();
        image.onload = function () {
        var position = scalePixelPosition({ x: 100 + cardData.imageProperties.offsetX, y: cardData.imageProperties.offsetY });
        var scale = cardData.imageProperties.scalePercent / 100.0;
        var width = image.width * scale;
        var height = image.height * scale;
        getContext().drawImage(image, position.x, position.y, width, height);
        drawCardFrame(cardData);
        };
    image.src = cardData.imageUrl;
    }
    // next the frame elements

    drawCardFrame(cardData);
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
    data.p_general = document.getElementById("p_general").checked;
    data.p_agility = document.getElementById("p_agility").checked;
    data.p_devious = document.getElementById("p_devious").checked;
    data.p_strength = document.getElementById("p_strength").checked;
    data.p_passing = document.getElementById("p_passing").checked;
    data.p_mutations = document.getElementById("p_mutations").checked;
    data.s_general = document.getElementById("s_general").checked;
    data.s_agility = document.getElementById("s_agility").checked;
    data.s_devious = document.getElementById("s_devious").checked;
    data.s_strength = document.getElementById("s_strength").checked;
    data.s_passing = document.getElementById("s_passing").checked;
    data.s_mutations = document.getElementById("s_mutations").checked;

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

    document.getElementById('p_agility').checked = cardData.p_agility;
    document.getElementById('p_devious').checked = cardData.p_devious;
    document.getElementById('p_general').checked = cardData.p_general;
    document.getElementById('p_mutations').checked = cardData.p_mutations;
    document.getElementById('p_passing').checked = cardData.p_passing;
    document.getElementById('p_strength').checked = cardData.p_strength;

    document.getElementById('s_agility').checked = cardData.s_agility;
    document.getElementById('s_devious').checked = cardData.s_devious;
    document.getElementById('s_general').checked = cardData.s_general;
    document.getElementById('s_mutations').checked = cardData.s_mutations;
    document.getElementById('s_passing').checked = cardData.s_passing;
    document.getElementById('s_strength').checked = cardData.s_strength;
    
    document.getElementById("keywords").value = cardData.keywords;

    // render the updated info
    render(cardData);
}


const playerPresetProfiles = new Map();

function playerPresetLanguage() {
    return window.i18next && String(i18next.resolvedLanguage || i18next.language).startsWith("fr")
        ? "fr"
        : "en";
}

function playerPresetText(value) {
    if (!value) return "";
    return value[playerPresetLanguage()] || value.en || value.fr || "";
}

function setPlayerSkillAccess(cardData, prefix, codes) {
    const categories = {
        A: "agility",
        D: "devious",
        G: "general",
        M: "mutations",
        P: "passing",
        S: "strength"
    };

    Object.values(categories).forEach(category => {
        cardData[prefix + "_" + category] = false;
    });
    (codes || []).forEach(code => {
        const category = categories[code];
        if (category) cardData[prefix + "_" + category] = true;
    });
}

async function waitForPlayerPresetI18n() {
    if (window.i18next && i18next.isInitialized) return;
    await new Promise(resolve => {
        if (!window.i18next) {
            resolve();
            return;
        }
        i18next.on("initialized", resolve);
    });
}

async function loadPlayerPresetIndex() {
    await waitForPlayerPresetI18n();

    const response = await fetch("assets/player-presets.json?v=20261114-1");
    if (!response.ok) {
        throw new Error("Unable to load player presets (" + response.status + ")");
    }

    const data = await response.json();
    const select = document.getElementById("playerPreset");
    if (!select) return;

    playerPresetProfiles.clear();
    select.replaceChildren();

    data.teams.forEach(team => {
        const group = document.createElement("optgroup");
        group.label = playerPresetText(team.name);

        team.positions.forEach(position => {
            const profile = { team, position };
            playerPresetProfiles.set(position.id, profile);
            group.append(new Option(playerPresetText(position.name), position.id));
        });

        select.append(group);
    });

    const first = select.querySelector("option");
    select.value = first ? first.value : "";
    window.BloodBowlPresetCombobox?.refresh(select);
}

async function loadPlayerPresetForEditing(id) {
    const profile = playerPresetProfiles.get(id);
    if (!profile) return null;

    const cardData = defaultCardData();
    const position = profile.position;
    const cost = String(position.cost || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    cardData.cardName = playerPresetText(position.name);
    cardData.teamName = playerPresetText(profile.team.name);
    cardData.showTeamName = true;
    cardData.footer = cost;
    cardData.ma = position.stats.ma;
    cardData.st = position.stats.st;
    cardData.ag = position.stats.ag;
    cardData.pa = position.stats.pa;
    cardData.av = position.stats.av;
    cardData.cardText = (position.skills || []).map(playerPresetText).join(", ");
    cardData.keywords = (position.roles || []).map(playerPresetText).join(", ");

    setPlayerSkillAccess(cardData, "p", position.primary);
    setPlayerSkillAccess(cardData, "s", position.secondary);

    document.getElementById("removeBorder").checked = false;
    document.getElementById("dashLine").checked = false;
    await writeControls(cardData);
    return { cardName: cardData.cardName };
}

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("embedded") !== "1") {
        loadPlayerPresetIndex().catch(console.error);
    }
});
