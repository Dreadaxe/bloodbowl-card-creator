const dataRef = "specialCard";

function defaultCardData() {
    var cardData = new Object;
    cardData.name = getName();
    cardData.cardName = i18next.t('card.special.card_name');
    cardData.cardText = i18next.t('card.caracteristics.body_text');
    cardData.effect = false;
    cardData.effectText = "";
    cardData.duration = false;
    cardData.durationText = "";
    cardData.timing = false;
    cardData.timingText = "";
    cardData.footer = i18next.t('card.special.footer');
    cardData.imageUrl = null;
    cardData.imageProperties = getDefaultModelImageProperties();
    cardData.fontSizeSelector = 32; // Set the default font size to 32
    cardData.centerImage = true;
    
    return cardData;
}

function drawCardText() {
    let yStart = 250;
    let context = getContext();
    context.textAlign = "center";
    context.textBaseline = "top";
    var data = readControls();

    let xStart = getCanvas().width/2;
    let defaultFontSize = data.fontSizeSelector;
    let lineHeight = defaultFontSize * 1.2;
    let gapAfterTitle = 60;

    var c = document.getElementById('canvas');
    var ctx = c.getContext('2d');
    // Create a new image object
    const img1 = new Image();
    const img2 = new Image();
    const img3 = new Image();

    let maxLength = 680;

    // Split input value into lines
    context.font = `italic ${defaultFontSize}px franklin-gothic-book`;
    context.fillStyle = 'black';
    lines = splitWordWrap(context, data.cardText, maxLength);

    for (let i = 0; i < lines.length; i++) {
        context.fillText(lines[i], xStart, yStart);
        yStart += lineHeight;
    }

    // Timing
    if(data.timing){
        // Set the image source to the server path of the image
        img3.src = 'assets/img/special/timing.png';
        timing_y = yStart;
        // When the image is loaded, draw it on the canvas
        img3.onload = function() {
            // Draw the image on the canvas at position (x, y)
            ctx.drawImage(img3, getCanvas().width/2 - 169/2, timing_y);
        };
        yStart += gapAfterTitle;
    }

    // Split input value into lines
    context.font = `normal ${defaultFontSize}px franklin-gothic-book`;
    context.fillStyle = 'black';
    lines = splitWordWrap(context, data.timingText, maxLength);

    for (let i = 0; i < lines.length; i++) {
        context.fillText(lines[i], xStart, yStart);
        yStart += lineHeight;
    }


    // Duration
    if(data.duration){
        // Set the image source to the server path of the image
        img2.src = 'assets/img/special/duration.png';
        duration_y = yStart;
        // When the image is loaded, draw it on the canvas
        img2.onload = function() {
            // Draw the image on the canvas at position (x, y)
            ctx.drawImage(img2, getCanvas().width/2 - 224/2, duration_y);
        };
        yStart += gapAfterTitle;
    }

    // Split input value into lines
    context.font = `normal ${defaultFontSize}px franklin-gothic-book`;
    context.fillStyle = 'black';
    lines = splitWordWrap(context, data.durationText, maxLength);

    for (let i = 0; i < lines.length; i++) {
        context.fillText(lines[i], xStart, yStart);
        yStart += lineHeight;
    }

    // Effect
    if(data.effect){
        // Set the image source to the server path of the image
        img1.src = 'assets/img/special/effect.png';
        effect_y = yStart;
        // When the image is loaded, draw it on the canvas
        img1.onload = function() {
            // Draw the image on the canvas at position (x, y)
            ctx.drawImage(img1, getCanvas().width/2 - 156/2, effect_y);
        };
        yStart += gapAfterTitle;
    }

    // Split input value into lines
    context.font = `normal ${defaultFontSize}px franklin-gothic-book`;
    context.fillStyle = 'black';
    lines = splitWordWrap(context, data.effectText, maxLength);

    for (let i = 0; i < lines.length; i++) {
        context.fillText(lines[i], xStart, yStart);
        yStart += lineHeight;
    }
    
}

drawCardName = function (value) {
    getContext().fillStyle = 'black';
    getContext().textAlign = "center";
    getContext().textBaseline = "middle";
    getContext().rotate(-6 * Math.PI / 180);

    // Set the initial font size
    var fontSize = 70;

    // Check if the value is 18 characters or more
    if (value.length >= 18) {
        // Calculate the maximum width based on the desired length
        var maxWidth = 650;

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
    writeScaled(value, { x: getCanvas().width/2 + 4 - 20, y: 180 + 4 });
    
    // Set the font size and draw the text in white
    getContext().fillStyle = 'white';
    writeScaled(value, { x: getCanvas().width/2 - 20, y: 180 });

    getContext().rotate(6 * Math.PI / 180);
}

drawFooter = function (value) {
    getContext().font = 'italic 46px brothers-regular';
    getContext().fillStyle = 'black';
    getContext().textAlign = "center";
    getContext().textBaseline = "middle";
    getContext().rotate(-6 * Math.PI / 180);
    writeScaled(value, { x: getCanvas().width/3 + 40, y: 1035+4 });
    getContext().fillStyle = 'white';
    writeScaled(value, { x: getCanvas().width/3 + 40, y: 1035 });
    getContext().rotate(+6 * Math.PI / 180);
}

drawFooterIcon = function () {
    getContext().font = 'italic 32px brothers-regular';
    getContext().textAlign = "left";
    getContext().textBaseline = "top";
    getContext().rotate(-5 * Math.PI / 180);

    //const textMetrics = getContext().measureText(txt);
    const textWidth = 150;
    const textHeight = 120;

    const x = 107-textWidth;
    const y = 780+textHeight;
    const rectX = x;
    const rectY = y;
    const rectWidth = textWidth;
    const rectHeight = textHeight;

    getContext().beginPath();
    getContext().moveTo(rectX, rectY); // Top-left
    getContext().lineTo(rectX + rectWidth, rectY); // Top-right
    getContext().lineTo(rectX + rectWidth - 10, rectY + rectHeight); // Bottom-right
    getContext().lineTo(rectX - 10,  rectY + rectHeight); // Bottom-left
    getContext().closePath();

    getContext().fillStyle = '#223f7d';
    getContext().fill();
    //getContext().strokeStyle = "white";
    //getContext().lineWidth = 5;
    //getContext().stroke();
    getContext().rotate(+5 * Math.PI / 180);

    
}

async function drawCardFrame(cardData) {
    await document.fonts.ready;
    await pageReady();

    drawCardName(cardData.cardName);
    drawFooter(cardData.footer);
    drawFooterIcon();

    drawCardText();

    if (!document.getElementById("removeBorder").checked) {
        getContext().drawImage(document.getElementById('border'), 0, 0, getCanvas().width, getCanvas().height);
    }
    if (document.getElementById("dashLine").checked) {
        getContext().strokeStyle = 'black';
        getContext().lineWidth = 1;
        getContext().setLineDash([4, 4]);
        getContext().strokeRect(35, 35, 752, 1052);
    }

}

render = function (cardData) {
    // First the textured background
    getContext().drawImage(document.getElementById('bg1'), 0, 0, getCanvas().width, getCanvas().height);

    if (cardData.imageUrl) {
        var image = new Image();
        image.onload = function () {
            var scale = cardData.imageProperties.scalePercent / 100.0;
            var width = image.width * scale;
            var height = image.height * scale;
            if (cardData.centerImage) {          // 62 902
                var position = scalePixelPosition({x: 61 + cardData.imageProperties.offsetX, y: 904 + cardData.imageProperties.offsetY});
            }
            else {
                var position = scalePixelPosition({x: 100 + cardData.imageProperties.offsetX, y: cardData.imageProperties.offsetY});
            }
            drawCardFrame(cardData).then(r => getContext().drawImage(image, position.x, position.y, width, height));
        };
    image.src = cardData.imageUrl;
    }
    else {
        // next the frame elements
        drawCardFrame(cardData);
    }
}

function readControls() {
    var data = new Object;
    data.name = getName();
    data.imageUrl = getModelImageUrl();
    data.imageProperties = getModelImageProperties();
    data.cardName = document.getElementById("cardName").value;
    data.footer = document.getElementById("footer").value;
    data.cardText = document.getElementById("cardText").value;
    data.effect = document.getElementById("effectCheckbox").checked;
    data.effectText = document.getElementById("effectText").value;
    data.duration = document.getElementById("durationCheckbox").checked;
    data.durationText = document.getElementById("durationText").value;
    data.timing = document.getElementById("timingCheckbox").checked;
    data.timingText = document.getElementById("timingText").value;
    data.fontSizeSelector = document.getElementById("fontSizeSelector").value;
    data.centerImage = document.getElementById("centerImage").checked;

    return data;
}

async function writeControls(cardData) {
    if (cardData.base64Image != null) {
        const dataToBlob = async (imageData) => {
            return await (await fetch(imageData)).blob();
        };
        const blob = await dataToBlob(cardData.base64Image);
        cardData.imageUrl = URL.createObjectURL(blob);
        cardData.base64Image = null;
    } else {
        cardData.imageUrl = null;
    }

    setName(cardData.name);
    setModelImage(cardData.imageUrl);
    setModelImageProperties(cardData.imageProperties);

    $("#cardName")[0].value = cardData.cardName;
    $("#footer")[0].value = cardData.footer;
    $("#cardText")[0].value = cardData.cardText;
    $("#effectCheckbox")[0].checked = cardData.effect;
    $("#effectText")[0].value = cardData.effectText;
    $("#durationCheckbox")[0].checked = cardData.duration;
    $("#durationText")[0].value = cardData.durationText;
    $("#timingCheckbox")[0].checked = cardData.timing;
    $("#timingText")[0].value = cardData.timingText;
    $("#fontSizeSelector")[0].value = cardData.fontSizeSelector; // Set the fontSizeSelector value
    $("#centerImage")[0].checked = cardData.centerImage;

    render(cardData);
}