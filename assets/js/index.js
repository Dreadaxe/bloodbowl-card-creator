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


onAnyChange = function () {
    var cardData = readControls();
    cardData = window.BloodBowlQueueEditor?.augmentData(cardData) || cardData;
    render(cardData);
    saveLatestCardData(dataRef);
}

onClearInput = function (value) {
    document.getElementById(value).value = '';
    onAnyChange();
}

pageReady = function (){
    return new Promise(resolve => {
        if (document.readyState === 'complete') {
            resolve();
        } else {
            window.addEventListener('load', resolve, { once: true });
        }
    });
}

/*
* data card storage
*/

saveCardDataMap = function(dataRef, newMap) {
    window.localStorage.setItem(dataRef, JSON.stringify(newMap));
}

loadCardDataMap = function(dataRef) {
    var storage = window.localStorage.getItem(dataRef);
    if (storage != null) {
        return JSON.parse(storage);
    }
    // Set up the map.
    var map = new Object;
    map = defaultCardData();
    saveCardDataMap(dataRef, map);
    return map;
}

loadLatestCardData = function(dataRef) {
    var latestCardName = window.localStorage.getItem(dataRef);
    if (latestCardName == null) {
        latestCardName = dataRef;
    }
    var data = loadCardData(latestCardName);
    if (!data) {
        data = defaultCardData();
    }

    return data;
}

saveLatestCardData = function(dataRef) {
    var cardData = readControls();
    if (!cardData.name) {
        return;
    }
    if (!window.BloodBowlQueueEditor?.saveDraft(cardData)) saveCardDataMap(dataRef, cardData);
}

loadCardData = function(dataRef) {
    if (!dataRef) {
        return null;
    }

    var data = loadCardDataMap(dataRef);
    if (data) {
        return data;
    }

    return null;
}

onResetToDefault = function() {
    var cardData = defaultCardData();
    writeControls(cardData);
}

refreshSaveSlots = function() {
    // Remove all
    //$('select').not("#languageSwitcher").children('option').remove();

    //var cardDataName = readControls().name;

    var map = loadCardDataMap(dataRef);

    for (let [key, value] of Object.entries(map)) {
        var selected = false;
        if (dataRef &&
            key == dataRef) {
            selected = true;
        }
        var newOption = new Option(key, key, selected, selected);
        $('#saveSlotsSelect').append(newOption);
    }
}

getCardDataName = function() {
    return dataRef;
}

validateInput = function(input) {
    // Only allow letters, spaces, and hyphens
    var regex = /^[a-zA-Z\s:-]+$/;
    return regex.test(input);
}

onClearCache = function() {
    window.localStorage.clear();
    location.reload();
    return false;
}

getCanvas = function () {
    return document.getElementById("canvas");
}

getContext = function () {
    return getCanvas().getContext("2d");
}

getLabel = function(element) {
    return $(element).prop("labels")[0];
}

getImage = function(element) {
    return $(element).find("img")[0];
}

getBackgroundImage = function () {
    return document.getElementById('bg1');
}

getName = function() {
    //var textInput = $("#saveNameInput")[0];
    return "BloodBowl_Card";
}

setName = function (name) {
    //var textInput = $("#saveNameInput")[0];
    //textInput.value = name;
}

/*
* image Manipulation
*/

onChooseIcon = async function (url) {
    const response = await fetch("assets/img/icons/" + url);
    let image = URL.createObjectURL(await response.blob());
    setModelImage(image);
    var cardData = readControls();
    render(cardData);
    saveLatestCardData(dataRef);
}

onModelImageUpload = function () {
    image = getModelImage();
    setModelImage(image);
    var cardData = readControls();
    render(cardData);
    saveLatestCardData(dataRef);
}

onCustomBackgroundUpload = function () {
    image = getCustomBackground();
    setCustomBackground(image);
    var cardData = readControls();
    render(cardData);
    saveLatestCardData(dataRef);
}

onload2promise = function(obj) {
    return new Promise((resolve, reject) => {
        obj.onload = () => resolve(obj);
        obj.onerror = reject;
    });
}

scalePixelPosition = function (pixelPosition) {
    var scalingFactor = getScalingFactor(getCanvas(), getBackgroundImage());
    var scaledPosition = { x: pixelPosition.x * scalingFactor.x, y: pixelPosition.y * scalingFactor.y };
    return scaledPosition;
}

getScalingFactor = function (canvas, image) {
    return {
        x: canvas.width / image.width,
        y: canvas.height / image.height
    };
}

getModelImage = function() {
    var imageSelect = $("#imageSelect")[0];
    if (imageSelect.files.length > 0) {
        return URL.createObjectURL(imageSelect.files[0]);
    }
    return null;
}

setModelImage = function(image) {
    $("#modelImageUrl")[0].value = image;
}

getModelImageUrl = function() {
    return $("#modelImageUrl")[0].value;
}

getCustomBackground = function() {
    var imageSelect = $("#customBackgroundSelect")[0];
    if (imageSelect.files.length > 0) {
        return URL.createObjectURL(imageSelect.files[0]);
    }
    return null;
}

setCustomBackground = function(image) {
    $("#customBackgroundUrl")[0].value = image;
}

getCustomBackgroundUrl = function() {
    return $("#customBackgroundUrl")[0].value;
}

setModelImageProperties = function(modelImageProperties) {
    $("#imageOffsetX")[0].value = modelImageProperties.offsetX;
    $("#imageOffsetY")[0].value = modelImageProperties.offsetY;
    $("#imageScalePercent")[0].value = modelImageProperties.scalePercent;
}

setCustomBackgroundProperties = function(customBackgroundProperties) {
    $("#customBackgroundOffsetX")[0].value = customBackgroundProperties.offsetX;
    $("#customBackgroundOffsetY")[0].value = customBackgroundProperties.offsetY;
    $("#customBackgroundScalePercent")[0].value = customBackgroundProperties.scalePercent;
}

getDefaultModelImageProperties = function() {
    return {
        offsetX: 0,
        offsetY: 0,
        scalePercent: 100
    };
}

getModelImageProperties = function() {
    return {
        offsetX: $("#imageOffsetX")[0].valueAsNumber,
        offsetY: $("#imageOffsetY")[0].valueAsNumber,
        scalePercent: $("#imageScalePercent")[0].valueAsNumber
    };
}

getCustomBackgroundProperties = function() {
    return {
        offsetX: $("#customBackgroundOffsetX")[0].valueAsNumber,
        offsetY: $("#customBackgroundOffsetY")[0].valueAsNumber,
        scalePercent: $("#customBackgroundScalePercent")[0].valueAsNumber,
    };
}

drawImage = function(scaledPosition, scaledSize, image) {
    if (image != null) {
        if (image.complete) {
            getContext().drawImage(image, scaledPosition.x, scaledPosition.y, scaledSize.x, scaledSize.y);
        }
        else {
            image.onload = function () { drawImage(scaledPosition, scaledSize, image); };
        }
    }
}

drawImageSrc = function(scaledPosition, scaledSize, imageSrc) {
    if (imageSrc != null) {
        var image = new Image();
        image.onload = function () { drawImage(scaledPosition, scaledSize, image); };
        image.src = imageSrc;
    }
}

drawModel = function(imageUrl, imageProps) {
    if (imageUrl != null) {
        var image = new Image();
        image.onload = function () {
            var position = scalePixelPosition({ x: 590 + imageProps.offsetX, y: imageProps.offsetY });
            var scale = imageProps.scalePercent / 100.0;
            var width = image.width * scale;
            var height = image.height * scale;
            getContext().drawImage(image, position.x, position.y, width, height);

            URL.revokeObjectURL(image.src);
        };
        image.src = imageUrl;
    }
}

getBase64Image = function(img) {
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    var dataURL = canvas.toDataURL("image/png");

    return dataURL;
}

getBase64ImgFromUrl = async function (imgUrl) {
    let img = new Image();
    let imgpromise = onload2promise(img); // see comment of T S why you should do it this way.
    img.src = imgUrl;
    await imgpromise;
    var imgData = getBase64Image(img);
    return imgData;
}

handleImageUrlFromDisk =async function (imageUrl) {
    if (imageUrl &&
        imageUrl.startsWith("blob:")) {
        // The image was loaded from disk. So we can load it later, we need to stringify it.
        imageUrl = await getBase64ImgFromUrl(imageUrl);
    }

    return imageUrl;
}

/*
* Word manipulation
*/

writeValue = function (ctx, value, pos) {
    var scale = getScalingFactor(getCanvas(), getBackgroundImage());
    pos = { x: pos.x / scale.x, y: pos.y / scale.y };

    ctx.save();
    ctx.scale(scale.x, scale.y);
    ctx.fillText(value, pos.x, pos.y);
    ctx.restore();
};

writeScaled = function (value, pixelPos) {
    var scaledPos = scalePixelPosition(pixelPos);
    writeValue(getContext(), value, scaledPos);
}

drawCardElementFromInput = function (inputElement, pixelPosition) {
    var value = inputElement.value;
    writeScaled(value, pixelPosition);
}

drawCardElementFromInputId = function (inputId, pixelPosition) {
    drawCardElementFromInput(document.getElementById(inputId), pixelPosition);
}

printAtWordWrap = function(context, text, x, y, lineHeight, fitWidth) {

    var lines = text.split('\n');
    lineNum = 0;
    for (var i = 0; i < lines.length; i++) {
        fitWidth = fitWidth || 0;
        if (fitWidth <= 0) {
            context.fillText(lines[i], x, y + (lineNum * lineHeight));
            lineNum++;
        }
        var words = lines[i].split(' ');
        var idx = 1;
        while (words.length > 0 && idx <= words.length) {
            var str = words.slice(0, idx).join(' ');
            var w = context.measureText(str).width;
            if (w > fitWidth) {
                if (idx == 1) {
                    idx = 2;
                }
                context.fillText(words.slice(0, idx - 1).join(' '), x, y + (lineNum * lineHeight));
                lineNum++;
                words = words.splice(idx - 1);
                idx = 1;
            }
            else {
                idx++;
            }
        }
        if (idx > 0) {
            context.fillText(words.join(' '), x, y + (lineNum * lineHeight));
            lineNum++;
        }

    }

}

splitWordWrap = function(context, text, fitWidth) {
    // this was modified from the print version to only return the text array
    return_array = [];
    var lines = text.split('\n');
    lineNum = 0;
    for (var i = 0; i < lines.length; i++) {
        fitWidth = fitWidth || 0;
        if (fitWidth <= 0) {
            return_array.push(lines[i]);
            lineNum++;
        }
        var words = lines[i].split(' ');
        var idx = 1;
        while (words.length > 0 && idx <= words.length) {
            var str = words.slice(0, idx).join(' ');
            var w = context.measureText(str).width;
            if (w > fitWidth) {
                if (idx == 1) {
                    idx = 2;
                }
                return_array.push(words.slice(0, idx - 1).join(' '));
                lineNum++;
                words = words.splice(idx - 1);
                idx = 1;
            }
            else {
                idx++;
            }
        }
        if (idx > 0) {
            return_array.push(words.join(' '));
            lineNum++;
        }

    }
    return return_array;
}

/*
* Save and Load in files
 */

readJSONFile = async function (file) {
    // Function will return a new Promise which will resolve or reject based on whether the JSON file is read and parsed successfully
    return new Promise((resolve, reject) => {
        // Define a FileReader Object to read the file
        let fileReader = new FileReader();
        // Specify what the FileReader should do on the successful read of a file
        fileReader.onload = event => {
            // If successfully read, resolve the Promise with JSON parsed contents of the file
            resolve(JSON.parse(event.target.result))
        };
        // If the file is not successfully read, reject with the error
        fileReader.onerror = error => reject(error);
        // Read from the file, which will kick-off the onload or onerror events defined above based on the outcome
        fileReader.readAsText(file);
    });
}

async function loadPreset(url) {
    const response = await fetch("assets/star/" + url);
    const json = await response.json();
    await writeControls(json);
    return json;
}

async function fileChange(file) {
    // Function to be triggered when file input changes
    // As readJSONFile is a promise, it must resolve before the contents can be read
    // in this case logged to the console

    var saveJson = function (json) {
        writeControls(json);
    };

    readJSONFile(file).then(json =>
        saveJson(json)
    );

}

async function onSaveClicked() {
    data = readControls();
    // temp null while I work out image saving
    data.base64Image = await handleImageUrlFromDisk(data.imageUrl)

    // need to be explicit due to sub arrays
    var exportObj = JSON.stringify(data, null, 4);

    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(exportObj);
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "bloodbowl_" + data.cardName.replace(/ /g, "_") + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

saveCardAsImage = function () {
    var element = document.createElement('a');
    data = readControls();
    element.setAttribute('href', document.getElementById('canvas').toDataURL('image/png'));
    element.setAttribute('download', "bloodbowl_" + data.cardName + ".png");
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

document.addEventListener("DOMContentLoaded", () => {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll(".navbar-nav .nav-link");

    navLinks.forEach(link => {
        const linkPath = link.getAttribute("href");
        if (currentPath.endsWith(linkPath) && linkPath !== "") {
            link.classList.add("active");
            link.setAttribute("aria-current", "page");
        } else {
            link.classList.remove("active");
            link.removeAttribute("aria-current");
        }
    });
});

