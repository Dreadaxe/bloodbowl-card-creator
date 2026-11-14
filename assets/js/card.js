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


let warfoRenderVersion = 0;

function warfoRoundedRectPath(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.lineTo(x + width - r, y);
    context.quadraticCurveTo(x + width, y, x + width, y + r);
    context.lineTo(x + width, y + height - r);
    context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    context.lineTo(x + r, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();
}

function warfoFitFont(context, value, maxWidth, startSize, family) {
    let size = startSize;
    do {
        context.font = "bold " + size + "px " + family;
        size -= 1;
    } while (size > 14 && context.measureText(String(value || "")).width > maxWidth);
    return Math.max(size + 1, 14);
}

function warfoWrapText(context, value, x, y, maxWidth, lineHeight, maxLines) {
    const words = String(value || "").trim().split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";

    words.forEach(function (word) {
        const candidate = line ? line + " " + word : word;
        if (line && context.measureText(candidate).width > maxWidth) {
            lines.push(line);
            line = word;
        } else {
            line = candidate;
        }
    });
    if (line) lines.push(line);

    const visibleLines = lines.slice(0, maxLines);
    if (lines.length > maxLines && visibleLines.length) {
        let last = visibleLines[visibleLines.length - 1];
        while (last && context.measureText(last + "…").width > maxWidth) {
            last = last.slice(0, -1);
        }
        visibleLines[visibleLines.length - 1] = last.trimEnd() + "…";
    }

    visibleLines.forEach(function (textLine, index) {
        context.fillText(textLine, x, y + index * lineHeight);
    });
    return visibleLines.length;
}

function warfoSkillList(cardData, prefix) {
    const categories = [
        ["agility", "card.caracteristics.agility"],
        ["devious", "card.caracteristics.devious"],
        ["general", "card.caracteristics.general"],
        ["mutations", "card.caracteristics.mutations"],
        ["passing", "card.caracteristics.passing"],
        ["strength", "card.caracteristics.strength"]
    ];
    return categories.filter(function (entry) {
        return Boolean(cardData[prefix + "_" + entry[0]]);
    }).map(function (entry) {
        return i18next.t(entry[1]);
    }).join(", ");
}

function warfoPolygon(context, points) {
    context.beginPath();
    points.forEach(function (point, index) {
        if (index === 0) context.moveTo(point[0], point[1]);
        else context.lineTo(point[0], point[1]);
    });
    context.closePath();
}

function warfoDrawPaper(context) {
    const paperGradient = context.createLinearGradient(190, 120, 822, 990);
    paperGradient.addColorStop(0, "#eee5d2");
    paperGradient.addColorStop(0.5, "#f8f4e9");
    paperGradient.addColorStop(1, "#ded1b9");
    context.fillStyle = paperGradient;
    warfoPolygon(context, [[170, 155], [822, 55], [822, 1015], [170, 1080]]);
    context.fill();

    context.save();
    warfoPolygon(context, [[170, 155], [822, 55], [822, 1015], [170, 1080]]);
    context.clip();
    for (let i = 0; i < 46; i += 1) {
        const x = 185 + ((i * 109) % 625);
        const y = 85 + ((i * 173) % 930);
        context.strokeStyle = i % 4 === 0 ? "rgba(113, 83, 46, 0.11)" : "rgba(255, 255, 255, 0.18)";
        context.lineWidth = i % 5 === 0 ? 3 : 1;
        context.beginPath();
        context.moveTo(x, y);
        context.quadraticCurveTo(x + 30, y - 10, x + 75, y + 5);
        context.stroke();
    }
    context.restore();
}

function warfoTeamInitials(teamName) {
    const initials = String(teamName || "BB").trim().split(/\s+/).map(function (word) {
        return word.charAt(0);
    }).join("").slice(0, 2).toUpperCase();
    return initials || "BB";
}

function warfoDrawTeamBadge(context, cardData) {
    const cx = 116;
    const cy = 104;
    const radius = 79;

    context.save();
    context.translate(cx, cy);

    context.fillStyle = "#c8c3ad";
    for (let i = 0; i < 12; i += 1) {
        context.save();
        context.rotate((Math.PI * 2 * i) / 12);
        context.beginPath();
        context.moveTo(-7, -radius - 5);
        context.lineTo(0, -radius - 22);
        context.lineTo(7, -radius - 5);
        context.closePath();
        context.fill();
        context.restore();
    }

    const badgeGradient = context.createRadialGradient(-18, -24, 8, 0, 0, radius);
    badgeGradient.addColorStop(0, "#b9d67a");
    badgeGradient.addColorStop(0.55, "#5e8d39");
    badgeGradient.addColorStop(1, "#274f31");
    context.fillStyle = badgeGradient;
    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#e1dcc6";
    context.lineWidth = 10;
    context.stroke();
    context.strokeStyle = "#6a6b66";
    context.lineWidth = 3;
    context.stroke();

    context.save();
    context.rotate(-0.72);
    context.fillStyle = "#d8d8cd";
    context.fillRect(-9, -58, 18, 105);
    context.fillStyle = "#efb323";
    context.fillRect(-17, 31, 34, 24);
    context.strokeStyle = "#323b32";
    context.lineWidth = 3;
    context.strokeRect(-17, 31, 34, 24);
    context.restore();

    context.save();
    context.rotate(0.72);
    context.fillStyle = "#d8d8cd";
    context.fillRect(-9, -58, 18, 105);
    context.fillStyle = "#efb323";
    context.fillRect(-17, 31, 34, 24);
    context.strokeStyle = "#323b32";
    context.lineWidth = 3;
    context.strokeRect(-17, 31, 34, 24);
    context.restore();

    context.fillStyle = "rgba(24, 50, 32, 0.78)";
    context.beginPath();
    context.arc(0, 0, 27, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#f4f0df";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = "bold 26px brothers-regular";
    context.fillText(warfoTeamInitials(cardData.teamName), 0, 2);
    context.restore();
}

function warfoDrawSideIcon(context, type, cx, cy) {
    context.save();
    context.translate(cx, cy);
    context.fillStyle = "#ffffff";
    context.strokeStyle = "#ffffff";
    context.lineWidth = 6;
    context.lineJoin = "round";
    context.lineCap = "round";

    if (type === "movement") {
        context.beginPath();
        context.moveTo(-31, 16);
        context.lineTo(-10, -25);
        context.lineTo(9, -15);
        context.lineTo(27, 13);
        context.lineTo(37, 17);
        context.lineTo(31, 33);
        context.lineTo(-19, 33);
        context.quadraticCurveTo(-39, 29, -31, 16);
        context.closePath();
        context.fill();
        context.strokeStyle = "#cf0811";
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(-10, -7);
        context.lineTo(15, 8);
        context.moveTo(-16, 4);
        context.lineTo(18, 21);
        context.stroke();
    } else if (type === "strength") {
        context.beginPath();
        context.moveTo(-34, 27);
        context.lineTo(-31, 1);
        context.lineTo(-19, -10);
        context.lineTo(-8, -7);
        context.lineTo(-2, -29);
        context.lineTo(13, -26);
        context.lineTo(15, -8);
        context.lineTo(28, -15);
        context.quadraticCurveTo(44, -1, 29, 16);
        context.lineTo(17, 34);
        context.lineTo(-8, 37);
        context.closePath();
        context.fill();
        context.strokeStyle = "#cf0811";
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(-25, 8);
        context.quadraticCurveTo(0, 20, 28, 3);
        context.stroke();
    } else if (type === "agility") {
        context.beginPath();
        context.moveTo(-40, 31);
        context.quadraticCurveTo(-10, -41, 42, -30);
        context.quadraticCurveTo(16, -8, 45, 2);
        context.quadraticCurveTo(13, 4, 33, 25);
        context.quadraticCurveTo(4, 13, 8, 40);
        context.quadraticCurveTo(-10, 15, -40, 31);
        context.closePath();
        context.fill();
        context.strokeStyle = "#cf0811";
        context.lineWidth = 4;
        [-14, 2, 18].forEach(function (offset) {
            context.beginPath();
            context.moveTo(-18 + offset / 4, offset + 4);
            context.quadraticCurveTo(7, offset - 11, 31, offset - 8);
            context.stroke();
        });
    } else if (type === "passing") {
        context.save();
        context.rotate(-0.36);
        context.beginPath();
        context.ellipse(0, 0, 42, 27, 0, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = "#cf0811";
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(-17, 0);
        context.lineTo(17, 0);
        [-10, 0, 10].forEach(function (x) {
            context.moveTo(x, -8);
            context.lineTo(x, 8);
        });
        context.stroke();
        context.restore();
    } else {
        context.beginPath();
        context.moveTo(-38, -11);
        context.quadraticCurveTo(-30, -40, 0, -43);
        context.quadraticCurveTo(30, -40, 38, -11);
        context.lineTo(38, 19);
        context.lineTo(23, 19);
        context.lineTo(23, 40);
        context.lineTo(9, 40);
        context.lineTo(9, 20);
        context.lineTo(-9, 20);
        context.lineTo(-9, 40);
        context.lineTo(-23, 40);
        context.lineTo(-23, 19);
        context.lineTo(-38, 19);
        context.closePath();
        context.fill();
        context.strokeStyle = "#cf0811";
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(-27, -10);
        context.lineTo(27, -10);
        context.moveTo(0, -37);
        context.lineTo(0, 11);
        context.stroke();
    }
    context.restore();
}

function warfoDrawPlayerImage(context, cardData, image) {
    context.save();
    warfoPolygon(context, [[205, 142], [822, 49], [822, 649], [205, 710]]);
    context.clip();

    if (image) {
        const properties = cardData.imageProperties || {};
        const scaleControl = Number(properties.scalePercent || 100) / 100;
        const baseScale = Math.min(560 / image.width, 520 / image.height);
        const scale = Math.max(0.05, baseScale * scaleControl);
        const width = image.width * scale;
        const height = image.height * scale;
        const offsetX = Number(properties.offsetX || 0) * 0.55;
        const offsetY = Number(properties.offsetY || 0) * 0.55;
        const x = 535 - width / 2 + offsetX;
        const y = 402 - height / 2 + offsetY;
        context.drawImage(image, x, y, width, height);
    } else {
        context.fillStyle = "rgba(76, 74, 66, 0.18)";
        context.beginPath();
        context.arc(535, 315, 60, 0, Math.PI * 2);
        context.fill();
        context.beginPath();
        context.ellipse(535, 500, 135, 145, 0, Math.PI, Math.PI * 2);
        context.fill();
    }
    context.restore();
}

function warfoLoadImage(source) {
    return new Promise(function (resolve) {
        if (!source) {
            resolve(null);
            return;
        }
        const image = new Image();
        image.onload = function () { resolve(image); };
        image.onerror = function () { resolve(null); };
        image.src = source;
    });
}

function warfoDrawBottomBadge(context) {
    context.save();
    context.translate(725, 1048);
    context.fillStyle = "#34528e";
    context.beginPath();
    context.arc(0, 0, 46, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#d7d7d0";
    context.lineWidth = 7;
    context.stroke();
    context.strokeStyle = "#9aa3b4";
    context.lineWidth = 2;
    context.stroke();
    context.fillStyle = "#ffffff";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = "bold 31px brothers-regular";
    context.fillText("BB", 0, 2);
    context.restore();
}

async function renderWarfoCard(cardData) {
    const version = ++warfoRenderVersion;
    await document.fonts.ready;
    await pageReady();
    const image = await warfoLoadImage(cardData.imageUrl);
    if (version !== warfoRenderVersion) return;

    const context = getContext();
    const canvas = getCanvas();
    const removeBorder = Boolean(document.getElementById("removeBorder")?.checked);
    const dashedBorder = Boolean(document.getElementById("dashLine")?.checked);
    const inset = removeBorder ? 0 : 35;
    const width = canvas.width - inset * 2;
    const height = canvas.height - inset * 2;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.translate(inset, inset);
    context.scale(width / 822, height / 1122);

    context.fillStyle = "#2d478a";
    context.fillRect(0, 0, 822, 1122);
    warfoDrawPaper(context);

    context.fillStyle = "#ffffff";
    warfoPolygon(context, [[0, 1065], [822, 932], [822, 947], [0, 1080]]);
    context.fill();
    context.fillStyle = "#d5060d";
    warfoPolygon(context, [[0, 1074], [822, 941], [822, 1122], [0, 1122]]);
    context.fill();

    warfoDrawPlayerImage(context, cardData, image);

    context.fillStyle = "#ffffff";
    context.textAlign = "left";
    context.textBaseline = "middle";
    const title = String(cardData.cardName || "");
    const titleSize = warfoFitFont(context, title.toUpperCase(), 520, 58, "brothers-regular");
    context.font = "bold " + titleSize + "px brothers-regular";
    context.fillText(title.toUpperCase(), 255, 78);

    if (cardData.showTeamName && String(cardData.teamName || "").trim()) {
        context.font = "bold 20px franklin-gothic-book";
        context.fillStyle = "rgba(255, 255, 255, 0.82)";
        context.fillText(String(cardData.teamName).toUpperCase(), 260, 123);
    }

    warfoDrawTeamBadge(context, cardData);

    const statTypes = ["movement", "strength", "agility", "passing", "armour"];
    const statValues = [cardData.ma, cardData.st, cardData.ag, cardData.pa, cardData.av];
    const statKeys = ["MA", "ST", "AG", "PA", "AV"];
    statTypes.forEach(function (type, index) {
        const y = 239 + index * 135;
        context.fillStyle = "#d3060f";
        warfoPolygon(context, [[0, y + 10], [245, y], [245, y + 105], [0, y + 129]]);
        context.fill();
        context.strokeStyle = "#ffffff";
        context.lineWidth = 6;
        context.beginPath();
        context.moveTo(0, y + 129);
        context.lineTo(245, y + 105);
        context.stroke();

        warfoDrawSideIcon(context, type, 63, y + 58);
        context.fillStyle = "#ffffff";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = "bold 72px brothers-regular";
        const rawValue = Number(statValues[index]);
        const suffix = index >= 2 && rawValue > 0 ? "+" : "";
        const displayValue = rawValue > 0 ? String(rawValue) + suffix : "—";
        context.fillText(displayValue, 170, y + 58);
        context.font = "bold 15px franklin-gothic-book";
        context.fillText(i18next.t("card.caracteristics." + statKeys[index]), 63, y + 111);
    });

    context.fillStyle = "#ffffff";
    warfoPolygon(context, [[248, 651], [822, 594], [822, 962], [248, 1056]]);
    context.fill();

    context.fillStyle = "#080808";
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.font = "bold 43px brothers-regular";
    context.fillText(i18next.t("card.caracteristics.skills_traits").replace(/\s*&\s*.*/, "").toUpperCase() + " :", 278, 690);

    context.font = "31px franklin-gothic-book";
    warfoWrapText(context, cardData.cardText, 278, 741, 506, 37, 5);

    let detailsY = 884;
    if (String(cardData.keywords || "").trim()) {
        context.fillStyle = "#3d3d3d";
        context.font = "italic 22px franklin-gothic-book";
        warfoWrapText(context, cardData.keywords, 278, detailsY, 500, 28, 2);
        detailsY += 60;
    }

    const primary = warfoSkillList(cardData, "p");
    const secondary = warfoSkillList(cardData, "s");
    context.fillStyle = "#222222";
    context.font = "19px franklin-gothic-book";
    warfoWrapText(context, i18next.t("card.caracteristics.primary") + " : " + primary, 278, detailsY, 500, 24, 2);
    warfoWrapText(context, i18next.t("card.caracteristics.secondary") + " : " + secondary, 278, detailsY + 52, 500, 24, 2);

    context.fillStyle = "#ffffff";
    context.textAlign = "left";
    context.font = "bold 30px brothers-regular";
    context.fillText(i18next.t("card.caracteristics.GP") + " " + String(cardData.footer || "—"), 55, 1092);
    warfoDrawBottomBadge(context);

    context.restore();

    if (dashedBorder) {
        context.save();
        context.strokeStyle = "#1c1c1c";
        context.lineWidth = 2;
        context.setLineDash([8, 8]);
        context.strokeRect(35, 35, 752, 1052);
        context.restore();
    }
}

render = function (cardData) {
    if (window.BloodBowlCardStyles?.current() === "warfo") {
        renderWarfoCard(cardData).catch(console.error);
        return;
    }
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
        const select = document.getElementById("playerPreset");
        select?.addEventListener("change", () => {
            if (select.value) {
                loadPlayerPresetForEditing(select.value).catch(console.error);
            }
        });
        loadPlayerPresetIndex().catch(console.error);
    }
});
