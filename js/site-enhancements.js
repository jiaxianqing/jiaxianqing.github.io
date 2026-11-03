/* V6: presentation generated from unchanged Markdown content. No hard-coded papers/journals. */
(()=>{
 'use strict';
 const q=(s,r=document)=>r.querySelector(s);
 const qa=(s,r=document)=>Array.from(r.querySelectorAll(s));
 const make=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e};
 const pubs=q('#publication-list');
 if(pubs && !pubs.dataset.v6Ready){
  pubs.dataset.v6Ready='yes';
  const parent=pubs.closest('.publications-layout');
  const search=q('#publication-search'),empty=q('#publication-empty');
  let selectedYear='all';
  const tool=q('.pub-toolbar',parent);
  const summary=make('div','pub-collection-summary');summary.setAttribute('role','status');summary.setAttribute('aria-live','polite');
  const count=make('span','pub-result-count');summary.append(count);
  tool?.insertAdjacentElement('afterend',summary);
  const layout=make('div','pub-reading-layout'),rail=make('aside','pub-year-rail');rail.setAttribute('aria-label','Browse publications by year');
  rail.append(make('span','pub-rail-caption','Browse by year'));
  const buttons=make('div','pub-year-buttons');rail.append(buttons);
  const main=make('div','pub-reading-main');
  parent.insertBefore(layout,pubs);layout.append(rail,main);
  const oldHint=q('.publication-hint',parent);if(oldHint)main.append(oldHint);
  main.append(pubs);if(empty){main.append(empty);empty.classList.add('pub-empty-state')}
  const blocks=[];let serial=0;
  qa(':scope > h2',pubs).forEach(heading=>{
   const year=heading.textContent.trim();if(!/^\d{4}(?: and before)?$/.test(year))return;
   const list=heading.nextElementSibling;if(!list||list.tagName!=='UL')return;
   const section=make('section','pub-year-section');section.dataset.publicationYear=year;
   section.id='publications-year-'+year;
   heading.before(section);section.append(heading,list);
   const entries=qa(':scope > li',list);
   entries.forEach((li,i)=>{
    serial++;li.classList.add('publication-item');
    const firstP=q(':scope > p',li),source=firstP||li,titleLink=q(':scope > a[href]',source);
    const entry=make('div','pub-entry');
    const core=make('div','pub-entry-main');
    if(source && titleLink && titleLink.parentNode===source){
     const authors=make('p','pub-authors'),cit=make('div','pub-citation'),title=make('h3','pub-title');
     while(source.firstChild && source.firstChild!==titleLink)authors.append(source.firstChild);
     title.append(titleLink);
     while(source.firstChild)cit.append(source.firstChild);
     // Remove the decorative dot that previously separated the paper title and journal.
     if(cit.firstChild && cit.firstChild.nodeType===Node.TEXT_NODE){cit.firstChild.textContent=cit.firstChild.textContent.replace(/^\s*\.\s*/, '');}
     core.append(title,authors,cit);if(firstP)firstP.remove();
    }else{const fallback=make('div','pub-citation');while(li.firstChild)fallback.append(li.firstChild);core.append(fallback)}
    if(li.textContent.trim().length || li.querySelector('blockquote,ul,ol,img,picture,figure')){const extra=make('div','pub-extra');while(li.firstChild)extra.append(li.firstChild);core.append(extra)}

    // Extract publication accolades from simple **Bold markdown** or legacy <font> tags.
    // The cited article and all other rich inline formatting are left intact.
    const labels={'featured article':'featured','esi highly cited':'cited'};
    const badges=make('div','pub-entry-badges');
    const sources=Array.from(core.querySelectorAll('.pub-citation font, .pub-extra font, .pub-citation strong, .pub-extra strong'));
    sources.forEach(node=>{
      if(node.closest('.pub-entry-badges'))return;
      if(node.tagName==='STRONG' && node.closest('font'))return;
      const normalized=(node.textContent||'').replace(/[()]/g,'').trim().replace(/\s+/g,' ').toLowerCase();
      const kind=labels[normalized];if(!kind)return;
      const label=kind==='featured'?'Featured article':'ESI highly cited';
      const chip=make('span','pub-accolade pub-accolade--'+kind,label);
      badges.append(chip);
      // Legacy font wraps the entire parenthesized label; new markdown uses <strong>.
      node.remove();
    });
    if(badges.children.length){
      const extraBlock=q(':scope > .pub-extra',core);
      if(extraBlock)core.insertBefore(badges,extraBlock);
      else core.append(badges);
    }

    // Optional illustration: a regular Markdown image inside this paper's list item.
    // Move it into a compact side figure; leave citation and badge logic unchanged.
    const art=q('.pub-extra img, .pub-citation img',core);
    let figure=null;
    if(art){
      const parent=art.parentElement;
      figure=make('figure','pub-illustration');
      figure.append(art);
      const caption=make('figcaption','','Illustrative artwork');figure.append(caption);
      entry.classList.add('has-figure');entry.dataset.hasFigure='true';
      if(parent && parent.tagName==='P' && !parent.textContent.trim() && !parent.querySelector('img'))parent.remove();
      const extra=q('.pub-extra',core);
      if(extra && !extra.textContent.trim() && !extra.querySelector('img,blockquote,ul,ol,video'))extra.remove();
    }
    entry.prepend(make('span','pub-entry-number',String(entries.length-i).padStart(2,'0')));
    entry.append(core);if(art)entry.append(figure);li.append(entry);
   });
   const badge=make('span','pub-year-heading-count',entries.length+' papers');heading.append(badge);
   blocks.push({year,section,heading,items:entries,button:null});
  });
  const makeBtn=(label,value,n)=>{
   const b=make('button','pub-year-btn');b.type='button';b.dataset.yearValue=value;
   b.append(make('span','',label),make('span','pub-count',n));
   b.addEventListener('click',()=>{selectedYear=value;refresh();if(label!=='All years'&&window.matchMedia('(max-width: 760px)').matches){const section=blocks.find(x=>x.year===value)?.section;section?.scrollIntoView({behavior:'smooth',block:'start'});}});
   buttons.append(b);return b;
  };
  makeBtn('All years','all',blocks.reduce((n,b)=>n+b.items.length,0));
  blocks.forEach(b=>b.button=makeBtn(b.year,b.year,b.items.length));
  const refresh=()=>{
   const year=selectedYear;const term=(search?.value||'').trim().toLowerCase();let visible=0;
   for(const b of blocks){let shown=0;
    for(const li of b.items){const match=(year==='all'||year===b.year)&&li.textContent.toLowerCase().includes(term);
     li.hidden=!match;if(match){visible++;shown++}
    }
    b.section.hidden=shown===0;
    b.heading.querySelector('.pub-year-heading-count').textContent=shown+' '+(shown===1?'paper':'papers');
   }
   qa('.pub-year-btn',buttons).forEach(b=>{let active=b.dataset.yearValue===year;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active))});
   const all=blocks.reduce((n,b)=>n+b.items.length,0);
   count.innerHTML='<strong>'+visible+'</strong> of <strong>'+all+'</strong> publications'+(year==='all'?'':' · '+year);
   if(empty)empty.hidden=visible!==0;
  };
  
  search?.addEventListener('input',refresh);
  refresh();
 }
 qa('.directory-layout').forEach(layout=>{
  const root=q('.directory-content',layout);
  if(!root || root.dataset.v6Ready)return;root.dataset.v6Ready='yes';
  const isJournals=Boolean(layout.closest('[data-page="journals"]') || document.body.classList.contains('page-journals') || location.pathname.replace(/\/$/,'').endsWith('/journals'));
  const isTools=Boolean(layout.closest('[data-page="tools"]') || location.pathname.replace(/\/$/,'').endsWith('/tools'));
  // This template is used only for Journals/Tools, and otherwise remains unchanged.
  const majors=[];let current=null;
  qa(':scope > *',root).forEach(child=>{
   if(child.tagName==='H2'){
    current=make('section','directory-major');root.insertBefore(current,child);majors.push(current);
   }
   if(current)current.append(child);
  });
  const categories=[];
  majors.forEach(major=>{
   let cat=null;
   qa(':scope > *',major).forEach(node=>{
    if(node.tagName==='H3'){
     cat=make('div','directory-category');major.insertBefore(cat,node);categories.push(cat);
    }
    if(cat && node!==major.querySelector(':scope > h2'))cat.append(node);
   });
  });
  // Only plain link lists are reflowed; Markdown tables, prose, and notes are left intact.
  qa('.directory-major ul',root).forEach(ul=>{if(qa(':scope > li',ul).some(li=>q(':scope > a[href]',li)))ul.classList.add('directory-link-grid')});
  const allLi=qa('.directory-link-grid > li',root).filter(li=>q(':scope > a[href]',li));
  // Journal marks are optional. Add a Markdown image inside any journal link
  // to display an actual logo. Otherwise create a modest initials fallback.
  if(isJournals){
   const palette=['marine','forest','slate','teal','violet'];
   allLi.forEach(li=>{
    const a=q(':scope > a[href]',li);if(!a)return;
    const logo=q(':scope > img',a);
    if(logo){logo.classList.add('journal-logo','journal-logo--image');logo.loading='lazy';logo.decoding='async';return;}
    const name=(a.textContent||'').trim();
    const words=name.replace(/[^\w\s]/g,' ').split(/\s+/).filter(Boolean);
    const initials=words.length>=2?words.slice(0,2).map(w=>w[0].toUpperCase()).join(''):(name.slice(0,2).toUpperCase()||'J');
    const hash=[...name].reduce((n,c)=>n+c.charCodeAt(0),0);
    const mark=make('span','journal-logo journal-logo--fallback journal-logo--'+palette[hash%palette.length],initials);
    mark.setAttribute('aria-hidden','true');a.prepend(mark);
   });
  }

  const searchBox=make('div','directory-explore');
  searchBox.append(make('h2','directory-explore-title',isJournals?'Find a journal':'Find a research tool'));
  searchBox.append(make('p','',isJournals?'Browse the curated collection by research field, or search any journal by name.':'Explore tools by workflow, or quickly locate a specific resource.'));
  const controls=make('div','directory-explore-controls');const label=make('label','search-field');
  label.append(make('span','', '⌕'));
  const input=make('input','');input.type='search';input.placeholder=isJournals?'Search journal names…':'Search tools and databases…';input.setAttribute('aria-label',input.placeholder);
  label.append(input);controls.append(label);
  const tally=make('span','directory-tally');tally.setAttribute('aria-live','polite');controls.append(tally);
  searchBox.append(controls);root.insertBefore(searchBox,root.firstChild);
  const noResult=make('p','directory-no-results','Nothing matched your search. Try a different keyword.');noResult.hidden=true;root.append(noResult);
  const sidebar=q('.directory-sidebar',layout);
  if(sidebar){const footer=make('div','directory-side-footer');footer.append(make('span','', 'Browse the original categories'));const top=make('a','', '↑ Back to top');top.href='#';top.addEventListener('click',ev=>{ev.preventDefault();layout.scrollIntoView({behavior:'smooth',block:'start'})});footer.append(top);sidebar.append(footer)}
  const filter=()=>{const term=input.value.trim().toLowerCase();let matches=0;
   allLi.forEach(li=>{li.hidden=!li.textContent.toLowerCase().includes(term);if(!li.hidden)matches++});
   categories.forEach(cat=>{const links=qa('.directory-link-grid > li',cat);cat.hidden=links.length>0&&!links.some(li=>!li.hidden)});
   majors.forEach(major=>{const links=qa('.directory-link-grid > li',major);major.hidden=links.length>0&&!links.some(li=>!li.hidden)});
   tally.innerHTML='<strong>'+matches+'</strong> of '+allLi.length+' links';noResult.hidden=matches!==0;
  };
  input.addEventListener('input',filter);filter();
 });

 // Every page with meaningful scroll depth gets a high-contrast back-to-top control.
 const top=make('button','site-back-to-top');top.type='button';
 top.innerHTML='<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 19 0-14 M5 12l7-7 7 7"/></svg>';
 top.setAttribute('aria-label','Back to top');top.title='Back to top';document.body.append(top);
 const refreshTop=()=>{
   const doc=document.documentElement;
   const range=Math.max(0,doc.scrollHeight-window.innerHeight);
   const threshold=Math.min(310,Math.max(45,range*.45));
   top.classList.toggle('is-visible',range>90 && window.scrollY>threshold);
 };
 top.addEventListener('click',()=>window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));
 window.addEventListener('scroll',refreshTop,{passive:true});window.addEventListener('resize',refreshTop,{passive:true});
 window.addEventListener('hashchange',()=>requestAnimationFrame(refreshTop));
 window.addEventListener('popstate',()=>requestAnimationFrame(refreshTop));
 document.querySelectorAll('.preview-page').forEach(page=>new MutationObserver(refreshTop).observe(page,{attributes:true,attributeFilter:['hidden']}));
 requestAnimationFrame(refreshTop);

})();
