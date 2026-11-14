(function (root) {
    "use strict";

    const databaseByLocale = new Map();
    const databasePromises = new Map();
    const profileIdOverrides = Object.freeze({
        "Boa_Kon’ssstriktr.json": "boa-konssstriktor",
        "Glart_Smashrip.json": "glart-lavollee",
        "Helmut_Wolf.json": "helmut-wulf",
        "Lucian_Swift.json": "lucien-swift",
        "Swiftvine_Glimmershard.json": "vrilleclaire-eclalumineux",
        "Zolcath_the_Zoat.json": "zolcath-le-zoat"
    });

    function normalizeName(value) {
        return String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLocaleLowerCase("fr")
            .replace(/[‘’ʼ«»\"']/g, "")
            .replace(/[^a-z0-9]+/g, "")
            .replace(/^the/, "");
    }

    function currentLocale() {
        const language = root.i18next && (root.i18next.resolvedLanguage || root.i18next.language);
        return String(language || root.localStorage?.getItem("lang") || "en").split("-")[0];
    }

    function databaseUrl(locale) {
        return `assets/star/locales/${locale}.json?v=20261110-1`;
    }

    async function loadDatabase(locale = currentLocale()) {
        if (locale !== "fr") return null;
        if (databaseByLocale.has(locale)) return databaseByLocale.get(locale);
        if (!databasePromises.has(locale)) {
            databasePromises.set(locale, fetch(databaseUrl(locale)).then(response => {
                if (!response.ok) {
                    throw new Error(`Unable to load Star Player locale ${locale} (${response.status})`);
                }
                return response.json();
            }).then(database => {
                databaseByLocale.set(locale, database);
                return database;
            }));
        }
        return databasePromises.get(locale);
    }

    function findProfile(database, file, cardData = {}) {
        if (!database || !Array.isArray(database.starPlayers)) return null;

        const forcedId = profileIdOverrides[file];
        if (forcedId) {
            return database.starPlayers.find(profile => profile.id === forcedId) || null;
        }

        const cardName = normalizeName(cardData.cardName);
        return database.starPlayers.find(profile =>
            normalizeName(profile.nameVo) === cardName || normalizeName(profile.nameFr) === cardName
        ) || null;
    }

    function formatCost(cost) {
        return String(cost).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function formatLeagues(leagues) {
        return leagues.map(league => {
            if (league === "Toutes") return "Toutes les équipes";
            if (league === "Toutes sauf Spot de Sylvanie") {
                return "Toutes les équipes sauf celles du Spot de Sylvanie";
            }
            return league;
        }).join(" ou ");
    }

    function profileToCardData(profile, cardData) {
        const stats = profile.stats || {};
        return Object.assign({}, cardData, {
            cardName: profile.nameFr,
            cardText: (profile.skills || []).join(", "),
            playsFor: formatLeagues(profile.leagues || []),
            specialRules: profile.specialRule
                ? `${profile.specialRule.name} : ${profile.specialRule.text}`
                : cardData.specialRules,
            keywords: (profile.keywords || []).join(", "),
            footer: Number.isFinite(profile.cost) ? formatCost(profile.cost) : cardData.footer,
            ma: stats.movement ?? cardData.ma,
            st: stats.strength ?? cardData.st,
            ag: stats.agility ?? cardData.ag,
            pa: stats.passing ?? cardData.pa,
            av: stats.armour ?? cardData.av,
            teamName: profile.megaStar ? "MEGA-STAR" : cardData.teamName,
            showTeamName: Boolean(profile.megaStar)
        });
    }

    async function localizeCardData(cardData, file, locale = currentLocale()) {
        if (locale !== "fr") return cardData;
        const database = await loadDatabase(locale);
        const profile = findProfile(database, file, cardData);
        return profile ? profileToCardData(profile, cardData) : cardData;
    }

    async function localizePresetList(presets, locale = currentLocale()) {
        if (locale !== "fr") return presets;
        const database = await loadDatabase(locale);
        return presets.map(preset => {
            const profile = findProfile(database, preset.file, { cardName: preset.name });
            return profile ? Object.assign({}, preset, { name: profile.nameFr }) : preset;
        });
    }

    const api = Object.freeze({
        currentLocale,
        findProfile,
        formatLeagues,
        loadDatabase,
        localizeCardData,
        localizePresetList,
        normalizeName,
        profileToCardData
    });

    root.BloodBowlStarLocales = api;
    if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window === "object" ? window : globalThis);
