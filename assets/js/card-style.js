(function (root) {
    "use strict";

    const storageKey = "bloodbowlCardStyle";
    const defaultStyle = "season3";
    const styles = {
        season3: {
            frame: "assets/img/card/bloodbowl_frame.png",
            star_frame: "assets/img/card/bloodbowl_specialplayer_frame.png"
        },
        classic: {
            frame: "assets/img/card/bloodbowl_frame_old.png",
            star_frame: "assets/img/card/bloodbowl_specialplayer_frame_old.png"
        }
    };

    function normalizeStyle(style) {
        return Object.prototype.hasOwnProperty.call(styles, style) ? style : defaultStyle;
    }

    function getStoredStyle() {
        return normalizeStyle(root.localStorage.getItem(storageKey));
    }

    function waitForImage(image) {
        if (!image || (image.complete && image.naturalWidth > 0)) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            image.addEventListener("load", resolve, { once: true });
            image.addEventListener("error", reject, { once: true });
        });
    }

    async function applyStyle(style, options) {
        const settings = Object.assign({ persist: true, redraw: false }, options);
        const selectedStyle = normalizeStyle(style);
        const select = document.getElementById("cardStyle");
        const imagesToLoad = [];

        if (settings.persist) {
            root.localStorage.setItem(storageKey, selectedStyle);
        }

        if (select) {
            select.value = selectedStyle;
        }

        ["frame", "star_frame"].forEach((imageId) => {
            const image = document.getElementById(imageId);
            const source = styles[selectedStyle][imageId];
            if (!image || !source) return;

            if (!image.src.endsWith(source)) {
                image.src = source;
            }
            imagesToLoad.push(waitForImage(image));
        });

        await Promise.all(imagesToLoad);

        if (settings.redraw && typeof root.onAnyChange === "function") {
            root.onAnyChange();
        }

        return selectedStyle;
    }

    root.BloodBowlCardStyles = Object.freeze({
        apply: applyStyle,
        current: getStoredStyle,
        styles: Object.keys(styles)
    });

    root.onCardStyleChange = function (style) {
        applyStyle(style, { persist: true, redraw: true }).catch(console.error);
    };

    document.addEventListener("DOMContentLoaded", () => {
        if (!document.getElementById("cardStyle")) return;
        applyStyle(getStoredStyle(), { persist: false, redraw: false }).catch(console.error);
    });
})(window);
