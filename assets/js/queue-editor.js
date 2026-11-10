(function () {
    'use strict';
    const params = new URLSearchParams(window.location.search);
    const editingId = params.get('queueCard');
    let active = null, loaded = false, timer = null, sequence = 0, saving = Promise.resolve();
    const clone = data => JSON.parse(JSON.stringify(data));
    const pages = new Set(['index.html', 'star.html', 'special.html', 'cardBack.html', 'playbook.html']);

    function sourcePage(record) {
        return pages.has(record.sourcePage) ? record.sourcePage : 'index.html';
    }
    async function editableData(record, side = 'front') {
        const direct = side === 'back' ? record.backData : record.data || record.bbtc?.data;
        if (direct) return clone(direct);
        const imported = record.bbtc;
        if (!imported?.rules?.length || !imported.layouts?.length || !window.BloodBowlRuleLayout) return null;
        const suffix = record.id.split(':').pop();
        const annex = /^\d+$/.test(suffix) ? Number(suffix) : 0;
        if (!annex && side === 'front') return null;
        const index = annex ? annex * 2 - 1 + (side === 'back' ? 1 : 0) : 0;
        const setting = imported.layouts[0];
        await document.fonts.ready;
        await document.fonts.load(`${setting.fontSize}px franklin-gothic-book`);
        const ctx = document.createElement('canvas').getContext('2d');
        const layouts = BloodBowlRuleLayout.flowRules(ctx, imported.rules, setting.fontSize, setting.columns);
        const layout = layouts[index] || {fontSize:34,lines:[{text:'Fin des règles',bold:true,x:71,y:300}]};
        return {
            cardName: `${imported.number} ${imported.name}`,
            cardText: layout.lines.map(line => line.text).join('\n'),
            footer: layouts[index] ? `Règles ${index + 1}/${layouts.length}` : imported.team,
            fontSizeSelector: layout.fontSize, ruleLayout: layout,
            imageUrl:null, base64Image:null, imageProperties:{offsetX:0,offsetY:0,scalePercent:100},
            effect:false,effectText:'',duration:false,durationText:'',timing:false,timingText:'',centerImage:true
        };
    }
    function augmentData(data) {
        const layout = active?.data?.ruleLayout;
        if (layout && data.cardText === active.data.cardText) data.ruleLayout = clone(layout);
        return data;
    }
    async function restore() {
        if (!editingId || params.get('queueRender') === '1') return false;
        if (loaded) { await render(augmentData(readControls())); return true; }
        const record = await BloodBowlPrintQueue.get(editingId);
        if (!record) throw new Error('Cette carte n’est plus dans la file d’impression.');
        if (sourcePage(record) !== (location.pathname.split('/').pop() || 'index.html'))
            throw new Error('Cette carte doit être ouverte dans son éditeur d’origine.');
        const draft = await BloodBowlPrintQueue.getState('queue-editor:' + editingId);
        const data = draft || await editableData(record);
        if (!data) throw new Error('Cette ancienne carte ne contient que son image. Réimportez son profil pour pouvoir le modifier.');
        active = {record,data:clone(data)};
        loaded = true;
        await writeControls({...defaultCardData(),...clone(data)});
        const send = document.querySelector('[onclick*="sendCurrentCardToPrint"]');
        if (send) {
            send.removeAttribute('data-i18n');
            send.textContent = window.i18next?.language?.startsWith('fr') ? 'Mettre à jour la carte imprimée' : 'Update queued card';
        }
        return true;
    }
    function saveDraft(data) {
        if (!editingId || !active) return false;
        const revision = ++sequence;
        clearTimeout(timer);
        const value = augmentData(clone(data));
        timer = setTimeout(() => {
            saving = BloodBowlPrintQueue.captureData(value).then(async value => {
                if (revision === sequence) await BloodBowlPrintQueue.setState('queue-editor:' + editingId, value);
            }).catch(console.error);
        },200);
        return true;
    }
    async function finish() {
        sequence++; clearTimeout(timer);
        await saving;
        if (editingId) await BloodBowlPrintQueue.removeState('queue-editor:' + editingId);
    }
    async function renderData(data, options = {}) {
        await document.fonts.ready; await pageReady();
        if(options.language && window.i18next) await i18next.changeLanguage(options.language);
        await Promise.all([...document.images].filter(image => image.getAttribute('src')).map(waitForImageElement));
        const value = {...defaultCardData(),...clone(data)};
        document.getElementById('removeBorder').checked = Boolean(options.removeBorder);
        document.getElementById('dashLine').checked = Boolean(options.dashLine);
        try {
            await writeControls(value);
            return {cardName:value.cardName,blob:await new Promise((resolve,reject) => getCanvas().toBlob(blob => blob ? resolve(blob) : reject(new Error('Card capture failed')), 'image/png'))};
        } finally {
            if(value.imageUrl?.startsWith('blob:'))URL.revokeObjectURL(value.imageUrl);
        }
    }
    function showError(error) {
        console.error(error);
        let notice = document.getElementById('queueEditorError');
        if (!notice) {
            notice = document.createElement('div'); notice.id='queueEditorError'; notice.className='alert alert-danger'; notice.setAttribute('role','alert');
            (document.querySelector('main') || document.body).prepend(notice);
        }
        notice.textContent=error.message;
        const send=document.querySelector('[onclick*="sendCurrentCardToPrint"]');
        if(send)send.disabled=true;
    }
    window.BloodBowlQueueEditor = Object.freeze({restore,editableData,augmentData,saveDraft,finish,showError,sourcePage});
    window.BloodBowlCardRenderer = Object.freeze({renderData,editableData});
})();
