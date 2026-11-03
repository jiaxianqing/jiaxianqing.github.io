/* V12. Count badges are derived from actual rendered cards, never maintained by hand.
   Search narrows counts in real time; selecting a category leaves other counts unchanged. */
(()=>{
  'use strict';
  const all=(selector,scope=document)=>Array.from(scope.querySelectorAll(selector));
  const ensureCounter=button=>{
    let number=button.querySelector('.filter-count');
    if(!number){number=document.createElement('span');number.className='filter-count';number.setAttribute('aria-hidden','true');button.append(number)}
    return number;
  };
  const setCount=(button,n,kind)=>{
    const name=button.dataset.countName || Array.from(button.childNodes).filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent).join(' ').trim() || button.textContent.trim();
    button.dataset.countName=name;
    ensureCounter(button).textContent=String(n);
    button.setAttribute('aria-label',`${name}, ${n} ${kind}`);
  };
  const memberSearch=document.querySelector('#member-search');
  const members=all('.member-group .member-card');
  const memberButtons=all('[data-member-filter]');
  const recountMembers=()=>{
    if(!memberButtons.length)return;
    const term=(memberSearch?.value||'').trim().toLowerCase();
    const matched=members.filter(card=>(card.dataset.search||'').toLowerCase().includes(term));
    memberButtons.forEach(btn=>{
      const category=btn.dataset.memberFilter;
      const n=category==='all'?matched.length:matched.filter(card=>card.closest('.member-group')?.dataset.group===category).length;
      setCount(btn,n,n===1?'member':'members');
    });
  };
  const postSearch=document.querySelector('.post-search');
  const posts=all('#post-list .post-card');
  const topicButtons=all('[data-post-tag]');
  const recountTopics=()=>{
    if(!topicButtons.length)return;
    const term=(postSearch?.value||'').trim().toLowerCase();
    const matched=posts.filter(card=>card.textContent.toLowerCase().includes(term));
    topicButtons.forEach(btn=>{
      const tag=btn.dataset.postTag;
      const n=tag==='all'?matched.length:matched.filter(card=>(card.dataset.postTags||'').split('|').includes(tag)).length;
      setCount(btn,n,n===1?'article':'articles');
    });
  };
  memberSearch?.addEventListener('input',recountMembers);
  postSearch?.addEventListener('input',recountTopics);
  recountMembers();
  recountTopics();
})();
