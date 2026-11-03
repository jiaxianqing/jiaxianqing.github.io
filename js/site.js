/* Vanilla JS only: no npm, no external library, works with Hugo's static assets. */
(() => {
  'use strict';
  const q=(s,root=document)=>root.querySelector(s);
  const qa=(s,root=document)=>Array.from(root.querySelectorAll(s));
  const navToggle=q('.nav-toggle'); const nav=q('.nav-links');
  if(navToggle && nav){
    navToggle.addEventListener('click',()=>{let expanded=navToggle.getAttribute('aria-expanded')!=='true';navToggle.setAttribute('aria-expanded',String(expanded));nav.classList.toggle('is-open',expanded)});
    qa('.nav-dropdown .dropdown-toggle').forEach(btn=>btn.addEventListener('click',()=>{
      const parent=btn.closest('.nav-dropdown');const open=!parent.classList.contains('is-open');parent.classList.toggle('is-open',open);btn.setAttribute('aria-expanded',String(open));
    }));
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){nav.classList.remove('is-open');navToggle.setAttribute('aria-expanded','false')}});
  }
  const themeBtn=q('.theme-toggle');
  if(themeBtn){
    let stored='';try{stored=localStorage.getItem('plant-idea-theme')||''}catch(e){}
    if(stored==='dark')document.documentElement.dataset.theme='dark';
    themeBtn.addEventListener('click',()=>{let newTheme=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=newTheme;try{localStorage.setItem('plant-idea-theme',newTheme)}catch(e){}});
  }
  // Member modal: every profile is an independent Markdown page and also available in a dialog.
  qa('[data-dialog]').forEach(btn=>btn.addEventListener('click',()=>{
    const d=document.getElementById(btn.dataset.dialog);if(d && typeof d.showModal==='function')d.showModal();
  }));
  qa('.profile-dialog').forEach(d=>{
    const close=q('[data-close-dialog]',d);if(close)close.addEventListener('click',()=>d.close());
    d.addEventListener('click',e=>{const r=d.getBoundingClientRect();if(e.clientX<r.left || e.clientX>r.right || e.clientY<r.top || e.clientY>r.bottom)d.close()});
  });
  // All members (including Alumni) display by default; filtering affects visibility only.
  const mSearch=q('#member-search'),filters=qa('[data-member-filter]'),groups=qa('.member-group'),emptyMembers=q('#member-no-results');let activeFilter='all';
  function updateMembers(){const term=(mSearch?.value||'').trim().toLowerCase();let total=0;
    groups.forEach(group=>{let count=0;qa('.member-card',group).forEach(card=>{const show=(activeFilter==='all'||group.dataset.group===activeFilter)&&(card.dataset.search||'').toLowerCase().includes(term);card.hidden=!show;if(show){count++;total++}});group.hidden=count===0});
    if(emptyMembers)emptyMembers.hidden=total>0;
  }
  mSearch?.addEventListener('input',updateMembers);
  filters.forEach(btn=>btn.addEventListener('click',()=>{activeFilter=btn.dataset.memberFilter;filters.forEach(b=>b.classList.toggle('is-active',b===btn));updateMembers()}));
  // Publication list: uses existing standard Markdown with year headings and list items.
  const publications=q('#publication-list');
  if(publications){
    const yearSelect=q('#publication-year'),search=q('#publication-search'),empty=q('#publication-empty');
    const children=Array.from(publications.children);let year='';const yearBlocks=[];
    children.forEach(el=>{
      if(el.tagName==='H2' && /^\d{4}(?: and before)?$/.test(el.textContent.trim())){
        year=el.textContent.trim();yearBlocks.push({year,heading:el,items:[]});
        const option=document.createElement('option');option.value=year;option.textContent=year;yearSelect?.appendChild(option);
      }else if(el.tagName==='UL' && yearBlocks.length){yearBlocks[yearBlocks.length-1].items.push(el)}
    });
    const run=()=>{
      let total=0;const selected=yearSelect?.value||'all';const term=(search?.value||'').trim().toLowerCase();
      yearBlocks.forEach(block=>{
        let yearVisible=selected==='all'||selected===block.year,yearCount=0;
        block.items.forEach(ul=>{
          let found=0;qa(':scope > li',ul).forEach(li=>{
            let show=yearVisible && li.textContent.toLowerCase().includes(term);li.hidden=!show;if(show){found++;total++}
          });
          ul.hidden=found===0;yearCount+=found;
        });
        block.heading.hidden=yearCount===0;
      });
      if(empty)empty.hidden=total>0;
    };
    yearSelect?.addEventListener('change',run);search?.addEventListener('input',run);run();
  }
  let activeTag='all';const postSearch=q('.post-search'),tagButtons=qa('[data-post-tag]'),postEmpty=q('#post-no-results');
  function updatePosts(){const term=(postSearch?.value||'').trim().toLowerCase();let total=0;
    qa('#post-list .post-card').forEach(card=>{const visible=card.textContent.toLowerCase().includes(term)&&(activeTag==='all'||(card.dataset.postTags||'').split('|').includes(activeTag));card.hidden=!visible;if(visible)total++});
    if(postEmpty)postEmpty.hidden=total>0;
  }
  postSearch?.addEventListener('input',updatePosts);
  tagButtons.forEach(btn=>btn.addEventListener('click',()=>{activeTag=btn.dataset.postTag;tagButtons.forEach(b=>b.classList.toggle('is-active',b===btn));updatePosts()}));
  // V4: internal links, including News/Projects cards and tag links, stay in the current tab.
  // External websites still open in a new tab. Photo gallery originals retain their own view.
  qa('a[href]').forEach(link=>{
    const href=link.getAttribute('href')||'';
    if(link.closest('.lab-carousel-slide')){link.target='_blank';link.rel='noopener noreferrer';return;}
    let external=false;
    try{const uri=new URL(href,location.href);external=(uri.protocol==='http:'||uri.protocol==='https:')&&uri.origin!==location.origin}catch(e){}
    if(external){link.target='_blank';link.rel='noopener noreferrer';}
    else{link.removeAttribute('target');link.removeAttribute('rel');}
  });
  qa('.directory-sidebar a[href^="#"]').forEach(link=>link.addEventListener('click',e=>{e.preventDefault();const dest=document.getElementById(decodeURIComponent(link.hash.slice(1)));dest?.scrollIntoView({behavior:'smooth',block:'start'})}));

  // Homepage: cycle through the latest project illustrations from Markdown.
  qa('.hero-science-carousel').forEach(carousel=>{
    const slides=qa('.hero-science-slide',carousel),dots=qa('[data-hero-dot]',carousel),counter=q('[data-hero-counter]',carousel),title=q('.hero-science-caption [data-hero-title]',carousel),desc=q('.hero-science-caption [data-hero-description]',carousel);
    if(!slides.length)return;
    let index=0,timer=null;
    const delay=carousel.hasAttribute('data-hero-auto')?Number(carousel.dataset.heroAuto):5200;
    const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const show=i=>{index=(i+slides.length)%slides.length;slides.forEach((slide,n)=>{const isActive=n===index;slide.classList.toggle('is-active',isActive);slide.setAttribute('aria-hidden',String(!isActive));const slideLink=q('.hero-slide-link',slide);if(slideLink)slideLink.tabIndex=isActive?0:-1});dots.forEach((dot,n)=>{dot.classList.toggle('is-active',n===index);dot.setAttribute('aria-pressed',String(n===index))});if(counter)counter.textContent=`${String(index+1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;if(title)title.textContent=slides[index].dataset.heroTitle||'';if(desc)desc.textContent=slides[index].dataset.heroDescription||''};
    const stop=()=>{if(timer!==null){clearInterval(timer);timer=null;}};
    const start=()=>{stop();if(slides.length>1&&!reduce&&!document.hidden&&!carousel.matches(':hover')&&!carousel.matches(':focus-within')&&delay>=1000){timer=setInterval(()=>show(index+1),delay);}};
    dots.forEach((dot,i)=>dot.addEventListener('click',()=>{show(i);start()}));
    carousel.addEventListener('mouseenter',stop);carousel.addEventListener('mouseleave',start);carousel.addEventListener('focusin',stop);carousel.addEventListener('focusout',()=>setTimeout(start,0));document.addEventListener('visibilitychange',start);
    show(0);start();
  });

  // gallery-slider: real carousel, no dependency, works for static previews and Hugo pages.
  qa('.lab-carousel').forEach(carousel=>{
    const slides=qa('.lab-carousel-slide',carousel),dots=qa('[data-carousel-dot]',carousel),counter=q('[data-carousel-counter]',carousel);
    if(!slides.length)return;
    let index=0,timer=null,touchX=null;
    const interval=Number(carousel.dataset.autoSlide)||0;
    const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const show=(next)=>{
      index=(next+slides.length)%slides.length;
      slides.forEach((slide,i)=>{let active=i===index;slide.classList.toggle('is-active',active);slide.setAttribute('aria-hidden',String(!active));const link=slide.querySelector('a');if(link)link.tabIndex=active?0:-1});
      dots.forEach((dot,i)=>{const active=i===index;dot.classList.toggle('is-active',active);dot.setAttribute('aria-pressed',String(active))});
      if(counter)counter.textContent=`${index+1} / ${slides.length}`;
    };
    const pause=()=>{if(timer!==null){window.clearInterval(timer);timer=null}};
    const start=()=>{pause();if(interval>=1000&&!reducedMotion&&!document.hidden&&slides.length>1&&!carousel.matches(':hover')&&!carousel.matches(':focus-within'))timer=window.setInterval(()=>show(index+1),interval)};
    const navigate=(delta)=>{show(index+delta);start()};
    q('[data-carousel-prev]',carousel)?.addEventListener('click',()=>navigate(-1));
    q('[data-carousel-next]',carousel)?.addEventListener('click',()=>navigate(1));
    dots.forEach((dot,i)=>dot.addEventListener('click',()=>{show(i);start()}));
    carousel.addEventListener('mouseenter',pause);
    carousel.addEventListener('mouseleave',start);
    carousel.addEventListener('focusin',pause);
    carousel.addEventListener('focusout',()=>window.setTimeout(start,0));
    carousel.addEventListener('touchstart',ev=>{touchX=ev.changedTouches[0]?.screenX??null},{passive:true});
    carousel.addEventListener('touchend',ev=>{if(touchX===null)return;const delta=(ev.changedTouches[0]?.screenX??touchX)-touchX;touchX=null;if(Math.abs(delta)>45)navigate(delta<0?1:-1)},{passive:true});
    carousel.addEventListener('keydown',ev=>{if(ev.key==='ArrowRight'){ev.preventDefault();navigate(1)}if(ev.key==='ArrowLeft'){ev.preventDefault();navigate(-1)}});
    document.addEventListener('visibilitychange',start);
    show(0);start();
  });

})();
