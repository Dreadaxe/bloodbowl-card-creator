(() => {
    "use strict";

    const instances = new WeakMap();

    function normalizePresetText(value) {
        return String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/œ/gi, "oe")
            .replace(/æ/gi, "ae")
            .toLocaleLowerCase()
            .trim();
    }

    function translated(key, fallback) {
        if (window.i18next && i18next.isInitialized) {
            const value = i18next.t(key);
            if (value && value !== key) return value;
        }
        return fallback;
    }

    function enhance(select) {
        if (!select || instances.has(select)) return instances.get(select);

        const wrapper = document.createElement("div");
        wrapper.className = "preset-combobox";

        const input = document.createElement("input");
        input.type = "search";
        input.className = "form-control";
        input.id = select.id + "Combobox";
        input.autocomplete = "off";
        input.setAttribute("role", "combobox");
        input.setAttribute("aria-autocomplete", "list");
        input.setAttribute("aria-expanded", "false");

        const list = document.createElement("div");
        list.className = "preset-combobox-list list-group";
        list.id = select.id + "ComboboxList";
        list.setAttribute("role", "listbox");
        list.hidden = true;
        input.setAttribute("aria-controls", list.id);

        select.before(wrapper);
        wrapper.append(input, list, select);
        select.classList.add("d-none");

        const label = document.querySelector('label[for="' + CSS.escape(select.id) + '"]');
        if (label) label.htmlFor = input.id;

        const loadButton = select.dataset.loadButton
            ? document.getElementById(select.dataset.loadButton)
            : null;

        let entries = [];
        let visibleEntries = [];

        const setLoadState = enabled => {
            if (loadButton) loadButton.disabled = !enabled;
        };

        const close = () => {
            list.hidden = true;
            input.setAttribute("aria-expanded", "false");
        };

        const choose = entry => {
            select.value = entry.value;
            input.value = entry.label;
            setLoadState(true);
            close();
            select.dispatchEvent(new Event("change", { bubbles: true }));
            input.focus();
            input.select();
        };

        const render = query => {
            const normalizedQuery = normalizePresetText(query);
            visibleEntries = entries.filter(entry =>
                !normalizedQuery
                || entry.normalizedLabel.includes(normalizedQuery)
                || entry.normalizedGroup.includes(normalizedQuery)
            );

            list.replaceChildren();
            if (!visibleEntries.length) {
                const empty = document.createElement("div");
                empty.className = "preset-combobox-empty";
                empty.textContent = translated("card.action.no_preset_match", "No matching preset");
                list.append(empty);
            } else {
                let currentGroup = null;
                visibleEntries.forEach(entry => {
                    if (entry.group && entry.group !== currentGroup) {
                        currentGroup = entry.group;
                        const heading = document.createElement("div");
                        heading.className = "preset-combobox-group";
                        heading.textContent = currentGroup;
                        list.append(heading);
                    }

                    const option = document.createElement("button");
                    option.type = "button";
                    option.className = "list-group-item list-group-item-action preset-combobox-option";
                    option.setAttribute("role", "option");
                    option.textContent = entry.label;
                    option.addEventListener("mousedown", event => event.preventDefault());
                    option.addEventListener("click", () => choose(entry));
                    list.append(option);
                });
            }

            list.hidden = false;
            input.setAttribute("aria-expanded", "true");
        };

        const refresh = () => {
            entries = [...select.options]
                .filter(option => option.value !== "")
                .map(option => {
                    const group = option.parentElement && option.parentElement.tagName === "OPTGROUP"
                        ? option.parentElement.label
                        : "";
                    return {
                        value: option.value,
                        label: option.textContent.trim(),
                        group,
                        normalizedLabel: normalizePresetText(option.textContent),
                        normalizedGroup: normalizePresetText(group)
                    };
                });

            input.disabled = entries.length === 0;
            input.placeholder = translated(
                select.dataset.presetPlaceholderKey || "card.action.preset_search_placeholder",
                select.dataset.presetPlaceholder || "Type to filter presets…"
            );

            const selected = entries.find(entry => entry.value === select.value);
            if (selected && (document.activeElement !== input || !input.value)) {
                input.value = selected.label;
                setLoadState(true);
            } else if (!selected) {
                setLoadState(false);
            }

            if (!list.hidden) render(input.value);
        };

        input.addEventListener("focus", () => {
            input.select();
            render("");
        });

        input.addEventListener("input", () => {
            const query = normalizePresetText(input.value);
            const exact = entries.find(entry => entry.normalizedLabel === query);
            select.value = exact ? exact.value : "";
            setLoadState(Boolean(exact));
            render(input.value);
        });

        input.addEventListener("keydown", event => {
            if (event.key === "Enter" && visibleEntries.length) {
                event.preventDefault();
                choose(visibleEntries[0]);
            } else if (event.key === "ArrowDown") {
                event.preventDefault();
                if (list.hidden) render(input.value);
                list.querySelector(".preset-combobox-option")?.focus();
            } else if (event.key === "Escape") {
                close();
            }
        });

        list.addEventListener("keydown", event => {
            const options = [...list.querySelectorAll(".preset-combobox-option")];
            const index = options.indexOf(document.activeElement);
            if (event.key === "ArrowDown" && options.length) {
                event.preventDefault();
                options[(index + 1) % options.length].focus();
            } else if (event.key === "ArrowUp" && options.length) {
                event.preventDefault();
                if (index <= 0) input.focus();
                else options[index - 1].focus();
            } else if (event.key === "Escape") {
                event.preventDefault();
                input.focus();
                close();
            }
        });

        input.addEventListener("blur", () => {
            setTimeout(() => {
                if (!wrapper.contains(document.activeElement)) close();
            }, 0);
        });

        select.addEventListener("change", () => {
            const selected = entries.find(entry => entry.value === select.value);
            if (selected) input.value = selected.label;
        });

        const observer = new MutationObserver(refresh);
        observer.observe(select, { childList: true, subtree: true, characterData: true });

        const instance = { input, list, refresh };
        instances.set(select, instance);
        refresh();
        return instance;
    }

    function enhanceAll() {
        document.querySelectorAll("select[data-searchable-preset]").forEach(enhance);
    }

    window.BloodBowlPresetCombobox = Object.freeze({
        enhance,
        refresh(select) {
            instances.get(select)?.refresh();
        },
        refreshAll() {
            instances.forEach?.(instance => instance.refresh());
        }
    });

    document.addEventListener("DOMContentLoaded", enhanceAll);
    if (window.i18next) {
        i18next.on("initialized", enhanceAll);
        i18next.on("languageChanged", () => {
            document.querySelectorAll("select[data-searchable-preset]").forEach(select => {
                const instance = instances.get(select);
                if (instance) instance.refresh();
                else enhance(select);
            });
        });
    }
})();
