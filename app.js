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
    grid:'M3 3h7v7H3Zm11 0h7v7h-7ZM3 14h7v7H3Zm11 0h7v7h-7Z',
    star:'m12 2 3 6.5 7 1-5 5 1.2 7-6.2-3.4-6.2 3.4 1.2-7-5-5 7-1Z',
  };
  const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.book}"/></svg>`;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
  let season = read('sunlit-wiki-season', 'normal');
  if (!['normal','pokemon'].includes(season)) season = 'normal';
  let searchIndex = -1, searchItems = [], toastTimer;
  const catalog = data.catalog || [];
  const stageNames = {early:'초반부터', mid:'재료를 모아서', late:'나중 목표'};
  const catalogFilters = {query:'', category:'all', stage:'all', starred:false};
  let selectedRole = 'treasure';
  const roles = [
    {id:'treasure',name:'보물 여는 게 좋아',icon:'spark',line:'통발에서 모은 조각으로, 다음 꾸러미를 기대해요.',detail:'첫 환영 보상에 작은 보물 꾸러미가 있어요. 통발을 챙기면서 조각을 모으고, 가구 상자·티켓·캡슐·진주를 노려봐요.',guide:'traps-and-treasure',terms:['보물','조각','꾸러미','진주','캡슐'],early:'첫 꾸러미를 열고, 함께 결과 구경하기'},
    {id:'farm',name:'작은 농장은 좋아',icon:'leaf',line:'첫 밭에서 물주기를 줄이고, 나중에는 기계까지.',detail:'밀 8개 목표의 철 스프링클러부터 써봐요. 움직이는 자동 수확 장치는 팩 전용 재료와 진행이 필요한 나중 목표예요.',guide:'automation',terms:['스프링클러','물레','수확기','청사진','작물'],early:'작은 밭 하나와 첫 철 스프링클러'},
    {id:'explore',name:'밖으로 나가고 싶어',icon:'sun',line:'새 재료를 찾아 돌아오면, 마을에서 쓸 곳이 생겨요.',detail:'음식과 방패를 챙겨 가까운 곳부터 같이 걸어요. 찾은 광물과 재료는 장비, 마을의 가공 장치와 나중 자동화에도 쓰여요.',guide:'play-together',terms:['광물','파편','주화','방패','배낭','정동석'],early:'가까운 탐험에서 공용 상자에 가져올 물건 찾기'},
    {id:'build',name:'마을 꾸미고 싶어',icon:'home',line:'모아 온 가구로 식당, 창고, 친구 집을 꾸며요.',detail:'첫날은 공용 상자 하나여도 좋아요. 보물에서 가구 상자가 나오면 어디에 둘지 같이 골라봐요. 완성된 마을 맵은 제공하지 않고 직접 만들어가요.',guide:'collection-goals',terms:['가구','상자','인형','장식','티켓'],early:'친구들이 돌아올 작은 공용 공간 만들기'},
    {id:'fish',name:'기다리며 모을래',icon:'fish',line:'통발에 미끼를 넣고, 그동안 다른 일을 해요.',detail:'직접 낚시만 반복하지 않아도 물고기를 모을 수 있어요. 물, 미끼, 빈칸을 확인하고 가까운 곳에서 밭이나 집을 돌봐요.',guide:'traps-and-treasure',terms:['통발','미끼','물고기','대구','연어'],early:'첫 통발에 미끼를 넣고 다른 일 하나 해보기'},
    {id:'pokemon',name:'포켓몬이 궁금해',icon:'spark',line:'별도 시즌에서 첫 파트너와 마을 밖으로.',detail:'일반 마을은 남겨두고 포켓몬 시즌을 따로 시작해요. 포획 도구·회복·나무열매도 이 팩의 실제 조합과 퀘스트에 맞춰 알아볼 수 있어요.',guide:'pokemon-season',terms:['몬스터볼','슈퍼볼','회복','열매','규토리'],early:'포켓몬 시즌의 첫 튜토리얼과 파트너 만나기',season:'pokemon'},
  ];
  const itemHref = item => '#item/' + encodeURIComponent(item.id);
  const findItem = id => catalog.find(item => item.id === id);
  const pictureLabel = item => item.iconKind==='model_texture'?'완성 블록 모습이 아닌 원본 표면 그림':item.iconKind==='tinted_item_texture'?'게임에서 색을 입히기 전의 원본 그림':'원본 아이템 그림';
  const wishes = () => { const value = read('sunlit-wiki-wishes', []); return Array.isArray(value) ? value.filter(id => catalog.some(item => item.id === id)) : []; };
  const plainLine = value => typeof value === 'string' ? value : value?.label && typeof value.percent==='number' ? value.label+' '+Number(value.percent.toFixed(2))+'%'+(value.scope?' · '+value.scope:'') : value?.text || value?.note || value?.description || Object.entries(value || {}).map(([key,val])=>key+': '+val).join(' · ');
  const lines = values => (Array.isArray(values) ? values : values ? [values] : []).map(value=>`<li>${escape(plainLine(value))}</li>`).join('');
  function sprite(item, large = false) { return `<span class="item-picture ${large ? 'large' : ''} ${item.iconKind === 'model_texture' ? 'surface-picture' : ''}"><img src="${escape(item.icon)}" alt="${escape(item.name)}${item.iconKind === 'model_texture' ? '의 원본 표면 그림' : ''}" loading="lazy" width="${item.iconWidth}" height="${item.iconHeight}"></span>`; }
  function itemCard(item) {
    const starred = wishes().includes(item.id);
    return `<article class="item-card"><button class="wish-button ${starred ? 'selected' : ''}" data-wish="${escape(item.id)}" aria-pressed="${starred}" aria-label="${escape(item.name)} 관심 ${starred ? '해제' : '추가'}">${icon('star')}</button><a class="item-open" href="${itemHref(item)}">${sprite(item)}<div class="item-labels"><span class="stage-${item.stage}">${stageNames[item.stage]}</span>${item.season === 'pokemon' ? '<span class="pokemon-badge">포켓몬</span>' : ''}${item.iconKind === 'model_texture' ? '<span>표면 그림</span>' : ''}</div><h3>${escape(item.name)}</h3><p>${escape(item.tagline)}</p><span class="item-more">얻는 법과 쓰는 곳 ${icon('arrow')}</span></a></article>`;
  }
  function bindWishes(root = $('#main')) {
    root.querySelectorAll('[data-wish]').forEach(button => button.addEventListener('click', () => {
      const id = button.dataset.wish, current = wishes(), isSaved = current.includes(id);
      save('sunlit-wiki-wishes', isSaved ? current.filter(value=>value!==id) : [...current,id]);
      if (location.hash === '#items') { catalogResults(); const next = [...root.querySelectorAll('[data-wish]')].find(el=>el.dataset.wish===id); (next || $('#only-wishes'))?.focus(); }
      else { root.querySelectorAll('[data-wish]').forEach(el => { if(el.dataset.wish === id){el.classList.toggle('selected',!isSaved);el.setAttribute('aria-pressed',String(!isSaved));el.setAttribute('aria-label',findItem(id).name+' 관심 '+(!isSaved?'해제':'추가'));} }); }
      toast(isSaved ? '관심 목록에서 뺐어요.' : '이 브라우저의 관심 목록에 담았어요.');
    }));
  }
  function visibleItems() { return catalog.filter(item=>season==='pokemon' || item.season==='all'); }
  function catalogResults() {
    const query = normalize(catalogFilters.query), saved = wishes();
    const filtered = visibleItems().filter(item => (catalogFilters.category==='all'||item.category===catalogFilters.category) && (catalogFilters.stage==='all'||item.stage===catalogFilters.stage) && (!catalogFilters.starred||saved.includes(item.id)) && (!query||normalize([item.name,item.id,item.tagline,item.category,...item.keywords,...item.obtain,...item.uses].join(' ')).includes(query)));
    $('#item-results-count').textContent = `${filtered.length}개 / 이 시즌에서 소개하는 ${visibleItems().length}개`;
    $('#item-grid').innerHTML = filtered.length ? filtered.map(itemCard).join('') : '<div class="catalog-empty"><h3>이 조건에 맞는 아이템이 없어요.</h3><p>검색어를 짧게 바꾸거나 다른 분류를 골라보세요.</p><button class="button" id="clear-item-filters">조건 모두 지우기</button></div>';
    $('#clear-item-filters')?.addEventListener('click',()=>{Object.assign(catalogFilters,{query:'',category:'all',stage:'all',starred:false});catalogPage();});
    bindWishes($('#item-grid'));
  }
  function catalogPage() {
    const categories = [...new Set(visibleItems().map(item=>item.category))];
    if (!categories.includes(catalogFilters.category)) catalogFilters.category='all';
    $('#main').innerHTML = `<header class="catalog-heading"><div><div class="eyebrow">FIND YOUR NEXT LITTLE GOAL</div><h1>이건, 어디서 얻어요?</h1><p>실제 팩에서 확인한 ${catalog.length}개 아이템. 얻는 방법과 다음 목표까지.</p></div><span class="catalog-counter">${catalog.length}<small>선별 도감</small></span></header><div class="catalog-intro">전체 아이템 목록이 아니라, 처음 시작하거나 다음 목표로 삼기 좋은 아이템을 골랐어요. <strong>추천 시기와 실제 해금 조건은 달라요.</strong> 자세한 조건은 각 항목에서 확인해주세요.</div><div class="catalog-tools"><label class="catalog-search">${icon('search')}<input id="item-query" type="search" placeholder="이름, 용도, 얻는 재료로 찾아봐요" aria-label="아이템 검색" value="${escape(catalogFilters.query)}"></label><label class="stage-filter"><span>추천 시기</span><select id="item-stage"><option value="all">모든 시기</option>${Object.entries(stageNames).map(([id,name])=>`<option value="${id}" ${catalogFilters.stage===id?'selected':''}>${name}</option>`).join('')}</select></label><label class="wish-filter"><input id="only-wishes" type="checkbox" ${catalogFilters.starred?'checked':''}>${icon('star')} 관심만</label></div><div class="category-chips" aria-label="아이템 종류"><button data-category="all" aria-pressed="${catalogFilters.category==='all'}">전체</button>${categories.map(category=>`<button data-category="${escape(category)}" aria-pressed="${catalogFilters.category===category}">${escape(category)}</button>`).join('')}</div><div class="catalog-status"><span id="item-results-count" aria-live="polite"></span><span>${season==='pokemon'?'포켓몬 + 공통 아이템':'일반 시즌 · 포켓몬 아이템은 위에서 시즌을 바꿔요'}</span></div><div id="item-grid" class="item-grid"></div><div class="notice">${icon('help')}<span>별표는 이 브라우저의 관심 표시예요. 게임 가방이나 수집 상태와 연결되지 않아요. 그림은 원본 리소스이며, 일부 3D 블록은 ‘표면 그림’으로 표시합니다. <a href="assets/item-credits.json" target="_blank" rel="noopener">그림 출처</a></span></div>`;
    $('#crumb').textContent='아이템 도감'; document.title='아이템 도감 · 우리의 선릿밸리';
    $('#item-query').addEventListener('input',event=>{catalogFilters.query=event.target.value;catalogResults();});
    $('#item-stage').addEventListener('change',event=>{catalogFilters.stage=event.target.value;catalogResults();});
    $('#only-wishes').addEventListener('change',event=>{catalogFilters.starred=event.target.checked;catalogResults();});
    document.querySelectorAll('[data-category]').forEach(button=>button.addEventListener('click',()=>{catalogFilters.category=button.dataset.category;document.querySelectorAll('[data-category]').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));catalogResults();}));
    catalogResults();
  }
  function recipeHTML(recipe) {
    if (!recipe?.pattern || !recipe.ingredients) return '';
    const entries = Object.entries(recipe.ingredients);
    const describe = entry => typeof entry==='string' ? (findItem(entry)?.name || entry) : entry.name || findItem(entry.id)?.name || entry.id || '재료';
    const symbols = recipe.type==='shapeless' ? entries.map(([symbol])=>symbol) : recipe.pattern.flatMap(row=>[...row.padEnd(3,' ')]);
    const grid = symbols.map(symbol=>{
      const ingredient = recipe.ingredients[symbol]; if(!ingredient)return '<span class="recipe-cell empty"></span>';
      const id = typeof ingredient==='string'?ingredient:ingredient.id;
      const item=findItem(id);return `<span class="recipe-cell" title="${escape(describe(ingredient))}">${item?sprite(item):`<small>${escape(describe(ingredient))}</small>`}</span>`;
    }).join('');
    return `<section class="detail-section recipe-section"><h2>확인한 조합 방법</h2><p>${recipe.type==='shapeless'?'재료를 놓는 위치는 상관없어요.':'조합대에 아래 모양으로 재료를 놓아요.'}</p><div class="recipe-layout"><div class="recipe-grid">${grid}</div><div><ul>${entries.map(([symbol,value])=>`<li>${escape(describe(value))}</li>`).join('')}</ul>${recipe.resultCount?`<p>한 번 조합하면 ${escape(recipe.resultCount)}개</p>`:''}${recipe.note?`<p>${escape(recipe.note)}</p>`:''}</div></div></section>`;
  }
  function itemPage(item) {
    const saved=wishes().includes(item.id), chances=item.chances || [], evidence=item.evidence || [];
    $('#main').innerHTML=`<div class="detail-back"><a href="#items">← 아이템 도감</a><span>${escape(item.category)}${item.season==='pokemon'?' · 포켓몬 시즌 전용':''}</span></div><header class="item-hero"><div class="item-art">${sprite(item,true)}<small>${pictureLabel(item)}</small></div><div class="item-intro"><div class="item-labels"><span class="stage-${item.stage}">${escape(item.stageLabel)}</span>${item.season==='pokemon'?'<span class="pokemon-badge">포켓몬 전용</span>':''}</div><h1>${escape(item.name)}</h1><p class="item-tagline">${escape(item.tagline)}</p><p>${escape(item.description)}</p><div class="detail-actions"><button class="button wish-button-inline ${saved?'selected':''}" data-wish="${escape(item.id)}" aria-pressed="${saved}" aria-label="${escape(item.name)} 관심 ${saved?'해제':'추가'}">${icon('star')}관심 아이템</button><button class="outline-button" id="copy-item-name">이름 복사</button><button class="outline-button" id="share-item">친구에게 보낼 주소</button></div></div></header>${item.conditions.length?`<aside class="item-condition"><strong>${icon('help')} 먼저 알아두면 좋아요</strong><ul>${lines(item.conditions)}</ul></aside>`:''}<div class="item-detail-columns"><div><section class="detail-section"><h2>어떻게 얻나요?</h2><ol>${lines(item.obtain)}</ol></section><section class="detail-section"><h2>어디에 쓰나요?</h2><ul>${lines(item.uses)}</ul></section>${recipeHTML(item.recipe)}${chances.length?`<section class="detail-section"><h2>확인한 확률과 조건</h2><ul>${lines(chances)}</ul></section>`:''}<section class="detail-section"><h2>얻었다면, 다음에는</h2><ul>${lines(item.next)}</ul></section></div><aside class="item-side"><div class="panel"><div class="eyebrow">KEEP EXPLORING</div><h2>쓰는 장면도 알아봐요</h2><p>아이템 하나에서 다음 재미로.</p><a href="#guide/${item.guide}">${escape(data.guides.find(g=>g.id===item.guide)?.title || '관련 공략')} ${icon('arrow')}</a><a href="#guide/collection-goals">함께 정하는 수집 목표 ${icon('arrow')}</a></div><p class="item-stage-note">‘${stageNames[item.stage]}’는 이 도감의 추천 시기예요. 실제 제작·획득에는 설명한 재료와 퀘스트 조건이 필요합니다.</p></aside></div><details class="item-sources"><summary>자료 출처와 확인 범위</summary><p>${escape(item.sourcePack)}와 우리의 선릿밸리 패치를 기준으로 정리했어요. 일반 모드의 최신 조합법과 다를 수 있어요.</p><code>${escape(item.id)}</code><ul>${evidence.map(row=>`<li>${escape(row.note || row.description || '')}<small>${escape(row.path || row.source || '')}</small></li>`).join('')}</ul>${item.iconNote?`<p>그림: ${escape(item.iconNote)}</p>`:''}<p>모든 조합과 보상을 실제 플레이로 끝까지 진행한 것은 아니에요. <a href="#guide/verification">검증 범위 보기</a></p><a href="assets/item-credits.json" target="_blank" rel="noopener">그림 출처 목록 ↗</a></details><div class="article-end"><a href="#items">← 다른 아이템 보기</a><a href="#play">친구들과 할 일 골라보기 →</a></div>`;
    $('#crumb').textContent=item.name;document.title=item.name+' · 선릿밸리 아이템 도감';
    $('#copy-item-name').addEventListener('click',()=>copy(item.name));
    $('#share-item').addEventListener('click',()=>copy(data.publicWiki+itemHref(item)));
    bindWishes();
  }
  function roleRecommendations(role) {
    return catalog.filter(item=>(role.id==='pokemon'?item.season==='pokemon':item.season==='all') && role.terms.some(term=>[item.name,item.category,item.tagline].join(' ').includes(term))).slice(0,4);
  }
  function playPage() {
    const role=roles.find(role=>role.id===selectedRole)||roles[0];
    $('#main').innerHTML=`<header class="play-heading"><div class="eyebrow">SIX FRIENDS, DIFFERENT LITTLE ADVENTURES</div><h1>같은 일을 좋아하지 않아도,<br>같이 놀 수 있으니까.</h1><p>누군가는 밭을 돌보고, 누군가는 재료를 찾고.<br>돌아와서는 오늘 얻은 보물을 같이 구경해요.</p><div class="play-actions"><a class="button" href="#guide/play-together">친구들과 할 일 자세히 보기 ${icon('arrow')}</a><button class="outline-button" id="copy-invitation">친구에게 보낼 소개 복사</button></div></header><div class="section-title"><h2>너는 어떤 쪽이 끌려?</h2><p>역할을 정해 놓을 필요는 없어요.</p></div><div class="role-choices">${roles.map(value=>`<button data-role="${value.id}" aria-pressed="${role.id===value.id}">${icon(value.icon)}<strong>${value.name}</strong><span>${value.line}</span>${value.season?'<small>포켓몬 시즌</small>':''}</button>`).join('')}</div><section class="role-detail"><div><span class="eyebrow">${escape(role.name)}</span><h2>${escape(role.early)}</h2><p>${escape(role.detail)}</p><a href="#guide/${role.guide}">어떻게 시작하는지 보기 ${icon('arrow')}</a></div><div class="role-items">${roleRecommendations(role).map(item=>`<a href="${itemHref(item)}">${sprite(item)}<span>${escape(item.name)}</span></a>`).join('')}</div></section><div class="section-title"><h2>처음부터 기다려지는 작은 보상</h2><a href="#guide/traps-and-treasure">실제 보상과 얻는 법 →</a></div><section class="treasure-demo"><div class="demo-copy"><div class="eyebrow">A PREVIEW, JUST FOR FUN</div><h2>작은 꾸러미,<br>안에는 무엇이 있을까요?</h2><p>환영 보상에서 첫 꾸러미를 받고,<br>이후에는 보물 조각 8개와 종이 1개로 만들어요.</p><div class="loot-odds">${data.treasureRewards.map(reward=>`<span>${escape(findItem(reward.id)?.name || reward.id)} <strong>${reward.percent}%</strong></span>`).join('')}</div></div><div class="demo-stage"><div id="demo-result" aria-live="polite"><img src="assets/treasure.png" alt="작은 보물 꾸러미" width="128" height="128"><strong>한번 미리 열어볼까요?</strong><small>게임과 같은 보상 비율로 보여줘요.</small></div><button class="button" id="preview-treasure">꾸러미 미리 열어보기 ${icon('spark')}</button><p>위키에서만 체험해요. 게임 아이템은 지급되지 않아요.</p></div></section><div class="promise-grid"><section><h3>처음에는 가볍게</h3><p>설치기 하나에서 시즌을 골라요. 처음 30분 안내와 첫 보상이 시작을 도와줘요.</p></section><section><h3>반복은 하나씩 줄이기</h3><p>통발을 기다리며 다른 일을 하고, 첫 스프링클러로 물주기부터 줄여봐요. 큰 자동화는 나중 목표예요.</p></section><section><h3>알고 시작하면 더 편해요</h3><p>직접 쌓아가는 마을이에요. 게임 구매·로그인은 각자 필요하고, 6인 성능과 실제 메뉴 조작 확인은 남아 있어요.</p></section></div><div class="play-end"><h2>그럼, 첫날에는 뭘 해볼까?</h2><a class="button" href="#guide/first-30-minutes">우리의 첫 30분 ${icon('arrow')}</a><a href="#items">갖고 싶은 아이템부터 골라도 좋아요 →</a></div>`;
    $('#crumb').textContent='우리, 뭐 하고 놀까요?';document.title='우리, 뭐 하고 놀까요? · 선릿밸리';
    document.querySelectorAll('[data-role]').forEach(button=>button.addEventListener('click',()=>{const position=scrollY;selectedRole=button.dataset.role;playPage();window.scrollTo(0,position);$(`[data-role="${selectedRole}"]`).focus({preventScroll:true});}));
    $('#copy-invitation').addEventListener('click',()=>copy('마인크래프트 선릿밸리 같이 한번 해보자! 농사, 통발 보물, 탐험, 마을 꾸미기 중에 좋아하는 걸 골라서 하면 돼. 첫 통발이랑 보물 꾸러미 보상도 있고, 농사는 스프링클러부터 천천히 편하게 만들 수 있어. 포켓몬은 별도 시즌으로 할 수 있어. 설치기는 한 파일로 준비할게. 뭐가 있는지 여기서 같이 골라보자: '+data.publicWiki+'#play'));
    $('#preview-treasure').addEventListener('click',()=>{
      const button=$('#preview-treasure'),stage=$('#demo-result');button.disabled=true;stage.classList.add('opening');
      const total=data.treasureRewards.reduce((sum,reward)=>sum+reward.weight,0);let draw=Math.random()*total;let reward=data.treasureRewards[data.treasureRewards.length-1];for(const candidate of data.treasureRewards){draw-=candidate.weight;if(draw<0){reward=candidate;break;}}
      setTimeout(()=>{const item=findItem(reward.id);stage.innerHTML=`${sprite(item,true)}<strong>${escape(item.name)}</strong><small>실제 보상표 비율 ${reward.percent}% · 위키 미리보기</small><a href="${itemHref(item)}">어디에 쓰는지 알아보기 →</a>`;stage.classList.remove('opening');button.disabled=false;button.innerHTML='한 번 더 미리보기 '+icon('spark');},matchMedia('(prefers-reduced-motion: reduce)').matches?0:420);
    });
  }
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
    const labels = {'play-together':'친구와 할 일 자세히','collection-goals':'다음 수집 목표','first-30-minutes':'처음 30분','friend-install':'친구용 설치','game-menu':'F8 게임 메뉴','host-setup':'서버 열기','traps-and-treasure':'통발과 보물','automation':'농사와 자동화','pokemon-season':'포켓몬 시즌','troubleshooting':'문제 해결','verification':'검증과 알려진 제한','development':'개발 안내'};
    const groups = [...new Set(data.guides.map(g => g.group))];
    $('#navigation').innerHTML = groups.map(group => `<div class="nav-group">${escape(group)}</div>${data.guides.filter(g => g.group === group).map(g => `<a class="nav-link" href="#guide/${g.id}">${icon(g.icon)}${escape(labels[g.id] || g.title)}</a>`).join('')}`).join('');
  }
  function checklist() {
    const completed = read('sunlit-wiki-check-' + season, []);
    const checked = Array.isArray(completed) ? completed : [];
    return `<div class="checklist">${steps.map((step, i) => `<label><input type="checkbox" data-step="${i}" ${checked.includes(i) ? 'checked' : ''}><span>${step[0]}<small>${step[1]}</small></span></label>`).join('')}</div><div class="check-progress"><span id="check-count">${checked.filter(i => Number.isInteger(i) && i >= 0 && i < steps.length).length} / 4 준비했어요</span><button class="text-button" id="reset-checklist">처음부터 체크하기</button></div>`;
  }
  function home() {
    const pokemon = season === 'pokemon';
    const featured = ['friend-install', 'traps-and-treasure', 'automation', 'pokemon-season', 'host-setup', 'troubleshooting'];
    const featuredItems = ['sunlitfriends:sealed_find','sunlitfriends:treasure_fragment','society:sunlit_pearl',pokemon?'cobblemon:poke_ball':'society:furniture_box'].map(findItem).filter(Boolean);
    $('#main').innerHTML = `<div class="home-heading"><div><div class="eyebrow">OUR LITTLE VALLEY</div><h1>반가워요, 오늘도 선릿밸리.</h1></div><p>모르는 건 여기서, 재밌는 건 친구들과.</p></div>
      <section class="hero" aria-labelledby="hero-title"><img class="hero-image" src="assets/${pokemon ? 'pokemon' : 'valley'}.png" alt="노을 아래 작은 농장과 강이 있는 마을 일러스트" width="1536" height="1024"><div class="hero-content"><span class="hero-tag">${pokemon ? '포켓몬과 함께하는 별도 시즌' : '농사 · 보물 · 탐험 · 우리 마을'}</span><h2 id="hero-title">${pokemon ? '오늘은 파트너와<br>어디로 걸어볼까요?' : '내가 좋아하는 일로<br>우리 마을이 자라요.'}</h2><p>${pokemon ? '첫 파트너를 만나고, 나무열매를 심고.<br>익숙한 마을에 새로운 친구가 생겨요.' : '누군가는 보물을, 누군가는 멋진 집을.<br>취향이 다른 친구들도, 각자의 재미로 함께.'}</p><div class="hero-buttons"><a class="button" href="#play">우리, 뭐 하고 놀까요? ${icon('arrow')}</a><a class="hero-secondary" href="#items">아이템 도감 둘러보기</a></div></div><span class="hero-credit">분위기를 담은 표지 그림이에요</span></section>
      <div class="quickbar"><span>${icon('check')} 처음이라도 괜찮아요</span><span>${icon('book')}<a href="#guide/game-menu">F8로 여는 게임 메뉴</a></span><a href="${data.release}" target="_blank" rel="noopener noreferrer">최신 설치기 받기 ↗</a></div>
      <a class="discovery-banner" href="#play"><span class="discovery-icon">${icon('spark')}</span><div><strong>농사하는 친구, 탐험하는 친구, 꾸미는 친구.</strong><p>각자 좋아하는 일과, 같이 기다릴 보상을 골라봐요.</p></div><span>여섯 가지 재미 보기 ${icon('arrow')}</span></a>
      ${featuredItems.length?`<div class="section-title"><h2>‘이거 얻고 싶다!’부터 시작해요</h2><a href="#items">${catalog.length}개 아이템 도감 →</a></div><div class="item-grid featured-item-grid">${featuredItems.map(itemCard).join('')}</div>`:''}
      <div class="section-title"><h2>궁금한 곳부터 둘러봐요</h2><p>정해진 순서는 없어요. 하고 싶은 것부터.</p></div>
      <div class="guide-grid">${featured.map(id => { const g = data.guides.find(g => g.id === id); return `<a href="#guide/${g.id}" class="guide-card"><span class="card-icon">${icon(g.icon)}</span><span class="card-arrow">${icon('arrow')}</span><h3>${escape(g.title)}</h3><p>${escape(g.description)}</p></a>`; }).join('')}</div>
      <div class="bottom-grid"><section class="panel"><h2>우리의 첫날 체크리스트</h2><p>이 브라우저에만 저장해요. 게임 진행과는 별개예요.</p>${checklist()}</section><section class="panel treasure-panel"><img class="treasure-art" src="assets/treasure.png" alt="작은 보물 꾸러미" width="128" height="128"><div class="eyebrow">A LITTLE SURPRISE</div><h2>통발을 기다리는 동안,<br>다른 재미를 찾아요.</h2><p class="treasure-description">반짝이는 조각 8개와 종이 1개.<br>작은 보물 꾸러미에 무엇이 들었을까요?</p><a href="#guide/traps-and-treasure">보상과 확률 알아보기 ${icon('arrow')}</a><div class="treasure-caption">획득 확률과 미끼별 차이도 공략에서 확인해요.</div></section></div>
      <div class="notice">${icon('help')}<span>새로 시작하는 친구는 Minecraft Java 계정이 필요해요. GitHub 다운로드는 초대된 계정으로 볼 수 있고, 친구에게 설치기를 직접 받아도 돼요. <a href="#guide/verification">아직 남은 검증도 확인해주세요.</a></span></div>`;
    $('#crumb').textContent = '첫 화면';
    document.title = '우리의 선릿밸리 · 같이 보는 공략';
    bindWishes();
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
    let item = null;
    if(location.hash.startsWith('#item/')){try{item=findItem(decodeURIComponent(location.hash.slice(6)));}catch{}}
    const isCatalog=location.hash==='#items', isPlay=location.hash==='#play';
    if (guide) article(guide); else if(item)itemPage(item);else if(isCatalog)catalogPage();else if(isPlay)playPage();else home();
    document.querySelectorAll('.nav-link').forEach(link => {
      const active = link.getAttribute('href') === (guide ? '#guide/' + id : item||isCatalog ? '#items' : isPlay ? '#play' : '#home');
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
    closeNavigation();
    window.scrollTo(0,0);
  }
  const normalize = text => text.toLocaleLowerCase().replace(/\s+/g,'');
  function search() {
    const query = normalize($('#search-input').value.trim());
    const results = [...data.guides.map(g => {
      const title = normalize(g.title), keywords = normalize(g.keywords.join(' ')), body = normalize(g.text);
      return {href:'#guide/'+g.id,group:g.group,title:g.title,description:g.description,season:g.season,score: !query ? 1 : title.includes(query) ? 4 : keywords.includes(query) ? 3 : body.includes(query) ? 1 : 0};
    }),...catalog.map(item=>{const title=normalize(item.name),keyword=normalize([item.id,...item.keywords].join(' ')),body=normalize([item.category,item.tagline,item.description,...item.obtain].join(' '));return {href:itemHref(item),group:'아이템 도감 · '+item.category,title:item.name,description:item.tagline,season:item.season,score:!query?0:title===query?7:title.includes(query)?5:keyword.includes(query)?3:body.includes(query)?1:0};})].filter(item => item.score).sort((a,b) => b.score - a.score);
    $('#search-status').textContent = query ? `${results.length}개의 공략·아이템을 찾았어요` : '자주 찾는 공략 · 아이템 이름도 검색할 수 있어요';
    $('#search-results').innerHTML = results.length ? results.map(g => `<a class="search-result" href="${g.href}"><small>${escape(g.group)}${g.season === 'pokemon' ? ' · 포켓몬' : ''}</small><strong>${escape(g.title)}</strong><p>${escape(g.description)}</p></a>`).join('') : '<p class="empty-search">맞는 공략이나 아이템이 아직 없어요.<br>‘접속’, ‘통발’, ‘몬스터볼’처럼 짧게 검색해보세요.</p>';
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
  $('.skip').addEventListener('click', event => { event.preventDefault(); $('#main').focus(); $('#main').scrollIntoView({block:'start'}); });
  $('#version').textContent = `v${data.version} · ${data.updated}`;
  $('#catalog-nav-count').textContent=catalog.length || '';
  decorate(); navigation(); render();
})();
