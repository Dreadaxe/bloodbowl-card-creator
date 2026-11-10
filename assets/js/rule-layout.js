(function () {
'use strict';
  function wrap(ctx, text, width) {
    const words = String(text).split(/\s+/).filter(Boolean), lines = [];
    let line = '';
    for (const word of words) {
      if (ctx.measureText(word).width > width) {
        if (line) { lines.push(line); line = ''; }
        let part = '';
        for (const char of word) {
          if (part && ctx.measureText(part + char).width > width) {lines.push(part);part='';}
          part += char;
        }
        line = part;
      } else if (line && ctx.measureText(line + ' ' + word).width > width) {lines.push(line);line=word;}
      else line += (line ? ' ' : '') + word;
    }
    if (line) lines.push(line);
    return lines;
  }
  function flowRules(ctx, rules, fontSize, columns) {
    const width = 680, gap = 24, colWidth = (width - gap * (columns - 1)) / columns;
    // The native special-card footer slopes upward to y=885 on the right.
    const top = 242, bottom = 875, lineHeight = fontSize * 1.12;
    const pages = [{lines:[],fontSize,columns}], capacity = Math.floor((bottom-top)/lineHeight);
    let col = 0, line = 0;
    const advance = () => { line=0; if (++col === columns) {col=0;pages.push({lines:[],fontSize,columns});} };
    const put = (text,bold) => {
      if (line === capacity) advance();
      pages.at(-1).lines.push({text,bold,x:71+col*(colWidth+gap),y:top+line*lineHeight});line++;
    };
    for (const rule of rules) {
      ctx.font = `bold ${fontSize}px franklin-gothic-book`;
      const heading = wrap(ctx,rule.name,colWidth);
      ctx.font = `${fontSize}px franklin-gothic-book`;
      const paras = rule.text.split(/\n+/).map(p=>wrap(ctx,p,colWidth)).filter(p=>p.length);
      const count = heading.length + paras.reduce((n,p)=>n+p.length,0);
      if (line && (count <= capacity ? count > capacity-line : capacity-line < heading.length+2)) advance();
      heading.forEach(t=>put(t,true));
      const continued = () => {
        advance();ctx.font = `bold ${fontSize}px franklin-gothic-book`;
        wrap(ctx,`${rule.name} — suite`,colWidth).forEach(t=>put(t,true));
        ctx.font = `${fontSize}px franklin-gothic-book`;
      };
      for (const lines of paras) {
        if (line && lines.length <= capacity-heading.length && lines.length > capacity-line) continued();
        for (const t of lines) {
          if (line === capacity) continued();
          put(t,false);
        }
      }
      if (line < capacity) line++; // modest separation between distinct rules
    }
    return pages;
  }
  function planRules(ctx, rules, minPt = 8) {
    // Native trim: 752 pixels = 63 mm. This is the final printed point size.
    const minPx = Math.ceil(minPt * 25.4 / 72 * 752 / 63);
    const choices = [];
    for (let font = Math.max(42,minPx); font >= minPx; font -= 2) {
      for (const columns of [1,2]) choices.push(flowRules(ctx,rules,font,columns));
    }
    choices.push(flowRules(ctx,rules,minPx,1),flowRules(ctx,rules,minPx,2));
    choices.sort((a,b)=>a.length-b.length || b[0].fontSize-a[0].fontSize || a[0].columns-b[0].columns);
    return choices[0];
  }

const api={wrap,flowRules,planRules};
if(typeof module==='object'&&module.exports)module.exports=api;else window.BloodBowlRuleLayout=Object.freeze(api);
})();
