'use strict';
(() => {
  const data = window.SUNLIT_WIKI;
  const $ = (selector, root = document) => root.querySelector(selector);
  const paths = {
    home:'M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9',
    search:'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
    book:'M12 5C9 3 5 3 2 4v16c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Zm0 0v16',
    sun:'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0',
    fish:'M3 12c4-7 10-7 16 0-6 7-12 7-16 0Zm16 0 3-5v10Zm-9-4v8m5-5h.1',
    leaf:'M20 3C9 1 2 8 5 16c8 5 16-2 15-13ZM3 22 15 10',
    spark:'m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Zm8 0v4m-2-2h4',
    server:'M4 3h16v7H4Zm0 11h16v7H4ZM7 6h.1M7 17h.1M11 6h6m-6 11h6',
    help:'M9 8a3 3 0 1 1 4 3c-1 .5-1 1-1 3m0 3h.1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
    check:'m7 12 3 3 7-7M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
    code:'m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18',
    download:'M12 2v13m-5-5 5 5 5-5M3 15v6h18v-6',
    arrow:'M4 12h16m-6-6 6 6-6 6',
    clock:'M12 6v6l4 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
    menu:'M4 6h16M4 12h16M4 18h16',
  };
  const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.book}"/></svg>`;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
  let season = read('sunlit-wiki-season', 'normal');
  if (!['normal','pokemon'].includes(season)) season = 'normal';
  let searchIndex = -1, searchItems = [], toastTimer;
  const steps = [
    ['같은 시즌으로 설치하고 로그인하기', '일반과 포켓몬은 따로 설치해요.'],
    ['친구와 만날 곳, 공용 상자 정하기', '한 명이 모든 일을 할 필요는 없어요.'],
    ['환영 보상에서 첫 통발과 꾸러미 받기', '퀘스트 화면에서 보상을 눌러 받아요.'],
    ['밀 8개를 모으고 스프링클러 받아보기', '모은 밀은 사라지지 않아요.'],
  ];
  function decorate(root = document) { root.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); }); }
  function toast(text) { $('#toast').textContent = text; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 2400); }
  async function copy(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
      else { const el = document.createElement('textarea'); el.value = text; el.setAttribute('aria-label', '복사할 내용'); document.body.append(el); el.select(); const ok = document.execCommand('copy'); el.remove(); if (!ok) throw Error('Copy unavailable'); }
      toast('복사했어요. 필요한 곳에 붙여 넣으세요.');
    } catch { toast('자동 복사를 할 수 없어요. 주소를 직접 복사해주세요.'); }
  }
  function navigation() {
    const groups = [...new Set(data.guides.map(g => g.group))];
    $('#navigation').innerHTML = groups.map(group => `<div class="nav-group">${escape(group)}</div>${data.guides.filter(g => g.group === group).map(g => `<a class="nav-link" href="#guide/${g.id}">${icon(g.icon)}${escape(g.id === 'first-30-minutes' ? '처음 30분' : g.id === 'friend-install' ? '친구용 설치' : g.id === 'host-setup' ? '서버 열기' : g.id === 'traps-and-treasure' ? '통발과 보물' : g.id === 'automation' ? '농사와 자동화' : g.id === 'pokemon-season' ? '포켓몬 시즌' : g.id === 'troubleshooting' ? '문제 해결' : g.id === 'verification' ? '검증과 알려진 제한' : '개발 안내')}</a>`).join('')}`).join('');
  }
  function checklist() {
    const completed = read('sunlit-wiki-check-' + season, []);
    const checked = Array.isArray(completed) ? completed : [];
    return `<div class="checklist">${steps.map((step, i) => `<label><input type="checkbox" data-step="${i}" ${checked.includes(i) ? 'checked' : ''}><span>${step[0]}<small>${step[1]}</small></span></label>`).join('')}</div><div class="check-progress"><span id="check-count">${checked.filter(i => Number.isInteger(i) && i >= 0 && i < steps.length).length} / 4 준비했어요</span><button class="text-button" id="reset-checklist">처음부터 체크하기</button></div>`;
  }
  function home() {
    const pokemon = season === 'pokemon';
    const featured = ['friend-install', 'traps-and-treasure', 'automation', 'pokemon-season', 'host-setup', 'troubleshooting'];
    $('#main').innerHTML = `<div class="home-heading"><div><div class="eyebrow">OUR LITTLE VALLEY</div><h1>반가워요, 오늘도 선릿밸리.</h1></div><p>모르는 건 여기서, 재밌는 건 친구들과.</p></div>
      <section class="hero" aria-labelledby="hero-title"><img class="hero-image" src="assets/${pokemon ? 'pokemon' : 'valley'}.png" alt="노을 아래 작은 농장과 강이 있는 마을 일러스트" width="1536" height="1024"><div class="hero-content"><span class="hero-tag">${pokemon ? '포켓몬과 함께하는 별도 시즌' : '우리 여섯 명의 작은 마을'}</span><h2 id="hero-title">${pokemon ? '오늘은 파트너와<br>어디로 걸어볼까요?' : '오늘은 무엇을<br>해볼까요?'}</h2><p>${pokemon ? '첫 파트너를 만나고, 나무열매를 심고.<br>익숙한 마을에 새로운 친구가 생겨요.' : '작은 밭을 가꾸고, 통발을 걷고, 보물을 열고.<br>우리 속도로 하나씩 시작해봐요.'}</p><a class="button" href="#guide/${pokemon ? 'pokemon-season' : 'first-30-minutes'}">${pokemon ? '포켓몬 시즌 시작하기' : '처음 30분, 같이 시작하기'}${icon('arrow')}</a></div><span class="hero-credit">분위기를 담은 표지 그림이에요</span></section>
      <div class="quickbar"><span>${icon('check')} 처음이라도 괜찮아요</span><span>${icon('book')} 게임 안에서도 한국어 안내</span><a href="${data.release}" target="_blank" rel="noopener noreferrer">최신 설치기 받기 ↗</a></div>
      <div class="section-title"><h2>궁금한 곳부터 둘러봐요</h2><p>정해진 순서는 없어요. 하고 싶은 것부터.</p></div>
      <div class="guide-grid">${featured.map(id => { const g = data.guides.find(g => g.id === id); return `<a href="#guide/${g.id}" class="guide-card"><span class="card-icon">${icon(g.icon)}</span><span class="card-arrow">${icon('arrow')}</span><h3>${escape(g.title)}</h3><p>${escape(g.description)}</p></a>`; }).join('')}</div>
      <div class="bottom-grid"><section class="panel"><h2>우리의 첫날 체크리스트</h2><p>이 브라우저에만 저장해요. 게임 진행과는 별개예요.</p>${checklist()}</section><section class="panel treasure-panel"><img class="treasure-art" src="assets/treasure.png" alt="작은 보물 꾸러미" width="128" height="128"><div class="eyebrow">A LITTLE SURPRISE</div><h2>통발을 기다리는 동안,<br>다른 재미를 찾아요.</h2><p class="treasure-description">반짝이는 조각 8개와 종이 1개.<br>작은 보물 꾸러미에 무엇이 들었을까요?</p><a href="#guide/traps-and-treasure">보상과 확률 알아보기 ${icon('arrow')}</a><div class="treasure-caption">획득 확률과 미끼별 차이도 공략에서 확인해요.</div></section></div>
      <div class="notice">${icon('help')}<span>새로 시작하는 친구는 Minecraft Java 계정이 필요해요. GitHub 다운로드는 초대된 계정으로 볼 수 있고, 친구에게 설치기를 직접 받아도 돼요. <a href="#guide/verification">아직 남은 검증도 확인해주세요.</a></span></div>`;
    $('#crumb').textContent = '첫 화면';
    document.title = '우리의 선릿밸리 · 같이 보는 공략';
    $('#reset-checklist').addEventListener('click', () => { save('sunlit-wiki-check-' + season, []); home(); toast('첫날 체크리스트를 비웠어요.'); });
    $('#main').querySelectorAll('[data-step]').forEach(input => input.addEventListener('change', () => {
      const checked = [...$('#main').querySelectorAll('[data-step]:checked')].map(el => Number(el.dataset.step));
      save('sunlit-wiki-check-' + season, checked);
      $('#check-count').textContent = `${checked.length} / 4 준비했어요`;
    }));
  }
  function article(guide) {
    $('#main').innerHTML = `<header class="article-header"><div class="eyebrow">${escape(guide.group)}${guide.season === 'pokemon' ? ' · 포켓몬 시즌' : ''}</div><h1>${escape(guide.title)}</h1><p>${escape(guide.description)}</p><div class="article-tools"><button id="copy-article">이 공략 주소 복사</button><a href="${data.repository}/blob/main/docs/${guide.id}.md" target="_blank" rel="noopener noreferrer">GitHub 원문 ↗</a>${guide.id === 'first-30-minutes' ? '<button id="copy-command">/sunlit 명령어 복사</button>' : ''}</div></header><div class="article-layout"><article class="prose">${guide.html}<div class="article-end"><a href="#home">← 공략 첫 화면</a><a href="#guide/troubleshooting">막힌 곳이 있나요? →</a></div></article><aside class="toc" aria-label="이 공략의 목차"><strong>이 페이지에서</strong>${guide.headings.map(h => `<button data-heading="${h.id}">${escape(h.title)}</button>`).join('')}</aside></div>`;
    $('#crumb').textContent = guide.title;
    document.title = guide.title + ' · 우리의 선릿밸리';
    $('#copy-article').addEventListener('click', () => copy(location.href));
    $('#copy-command')?.addEventListener('click', () => copy('/sunlit'));
    $('#main').querySelectorAll('[data-heading]').forEach(button => button.addEventListener('click', () => document.getElementById(button.dataset.heading)?.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'})));
  }
  function closeNavigation() { $('#sidebar').classList.remove('open'); $('#backdrop').hidden = true; $('#mobile-menu').setAttribute('aria-expanded', 'false'); }
  function render() {
    document.body.classList.toggle('pokemon', season === 'pokemon');
    document.querySelectorAll('[data-season]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.season === season)));
    const id = location.hash.startsWith('#guide/') ? location.hash.slice(7) : '';
    const guide = data.guides.find(g => g.id === id);
    if (guide) article(guide); else home();
    document.querySelectorAll('.nav-link').forEach(link => {
      const active = link.getAttribute('href') === (guide ? '#guide/' + id : '#home');
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
    closeNavigation();
    window.scrollTo(0,0);
  }
  const normalize = text => text.toLocaleLowerCase().replace(/\s+/g,'');
  function search() {
    const query = normalize($('#search-input').value.trim());
    const results = data.guides.map(g => {
      const title = normalize(g.title), keywords = normalize(g.keywords.join(' ')), body = normalize(g.text);
      return {g, score: !query ? 1 : title.includes(query) ? 4 : keywords.includes(query) ? 3 : body.includes(query) ? 1 : 0};
    }).filter(item => item.score).sort((a,b) => b.score - a.score);
    $('#search-status').textContent = query ? `${results.length}개의 공략을 찾았어요` : '자주 찾는 공략';
    $('#search-results').innerHTML = results.length ? results.map(({g}) => `<a class="search-result" href="#guide/${g.id}"><small>${escape(g.group)}${g.season === 'pokemon' ? ' · 포켓몬' : ''}</small><strong>${escape(g.title)}</strong><p>${escape(g.description)}</p></a>`).join('') : '<p class="empty-search">맞는 공략이 아직 없어요.<br>‘접속’, ‘낚시’, ‘보상’처럼 짧게 검색해보세요.</p>';
    searchItems = [...$('#search-results').querySelectorAll('a')]; searchIndex = -1;
    searchItems.forEach(a => a.addEventListener('click', () => $('#search-dialog').close()));
  }
  function openSearch() { $('#search-dialog').showModal(); $('#search-input').value = ''; search(); $('#search-input').focus(); }
  document.querySelectorAll('[data-search]').forEach(button => button.addEventListener('click', openSearch));
  $('#search-close').addEventListener('click', () => $('#search-dialog').close());
  $('#search-dialog').addEventListener('click', event => { if (event.target === $('#search-dialog')) { const rect = event.target.getBoundingClientRect(); if(event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.target.close(); } });
  $('#search-input').addEventListener('input', search);
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); if (!$('#search-dialog').open) openSearch(); }
    if (event.key === 'Escape') { closeNavigation(); if ($('#search-dialog').open) { event.preventDefault(); $('#search-dialog').close(); } }
    if ($('#search-dialog').open && ['ArrowDown','ArrowUp','Enter'].includes(event.key)) {
      if (!searchItems.length) return;
      event.preventDefault();
      if (event.key === 'Enter') { if (searchIndex < 0) searchIndex = 0; searchItems[searchIndex].click(); }
      else { searchIndex = (searchIndex + (event.key === 'ArrowDown' ? 1 : -1) + searchItems.length) % searchItems.length; searchItems.forEach((a,i) => a.classList.toggle('selected', i === searchIndex)); searchItems[searchIndex].scrollIntoView({block:'nearest'}); }
    }
  });
  $('#mobile-menu').addEventListener('click', () => { const opened = $('#sidebar').classList.toggle('open'); $('#backdrop').hidden = !opened; $('#mobile-menu').setAttribute('aria-expanded', String(opened)); });
  $('#backdrop').addEventListener('click', closeNavigation);
  document.querySelectorAll('[data-season]').forEach(button => button.addEventListener('click', () => { season = button.dataset.season; save('sunlit-wiki-season', season); render(); }));
  window.addEventListener('hashchange', render);
  $('#version').textContent = `v${data.version} · ${data.updated}`;
  decorate(); navigation(); render();
})();
