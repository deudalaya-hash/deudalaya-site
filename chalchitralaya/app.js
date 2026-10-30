(function () {
  'use strict';

  const movies = [
    { id:'pahadko-katha',title:'पहाडले सुनाएको कथा',english:'The Story the Hills Told',year:'२०८३',yearEn:'2026',genre:'सामाजिक चलचित्र',duration:'१ घण्टा ५२ मिनेट',durationEn:'1h 52m',price:'रु. २५०',director:'माया खड्का',producer:'चलचित्रलय स्टुडियो',cast:'सुरज बुढा, रचना मल्ल, भीम बिष्ट',story:'घर फर्किने यात्रामा एक छोरीले आफ्नो बुवाको अधुरो आवाज र गाउँको बदलिँदो संसार भेट्छिन्। पहाड र परिवारको सम्बन्धबारेको यो एउटा काल्पनिक अवधारणा हो।',art:'poster-1',tag:'Featured',categories:['नेपाली चलचित्र','कर्णाली चलचित्र','सामाजिक चलचित्र'],yearGroup:'२०८३' },
    { id:'setiko-bato',title:'सेतीको बाटो',english:'Along the Seti',year:'२०८२',yearEn:'2025',genre:'सुदूरपश्चिमेली चलचित्र',duration:'१ घण्टा ४६ मिनेट',durationEn:'1h 46m',price:'रु. २००',director:'अमृत जोशी',producer:'नदी किनार पिक्चर्स',cast:'सुमन बिष्ट, दिया बोहरा, नरेश ऐर',story:'सेतीको किनारमा भेटिएका दुई अपरिचितले गन्तव्यभन्दा बाटो किन महत्त्वपूर्ण हुन्छ भन्ने बुझ्छन्।',art:'poster-2',tag:'Trending',categories:['नेपाली चलचित्र','सुदूरपश्चिमेली चलचित्र','प्रेमकथा'],yearGroup:'२०८२' },
    { id:'karnali-patra',title:'कर्णालीका पत्रहरू',english:'Letters from Karnali',year:'२०८२',yearEn:'2025',genre:'वृत्तचित्र',duration:'५८ मिनेट',durationEn:'58m',price:'रु. १५०',director:'निमा शाही',producer:'नदीका कथा',cast:'स्थानीय आवाजहरू',story:'कर्णाली किनारका परिवारले नदी पारि र देश बाहिर रहेका आफन्तलाई पठाएका सम्झनाका चिठीहरूको नमुना वृत्तचित्र अवधारणा।',art:'poster-3',tag:'Documentary',categories:['नेपाली चलचित्र','कर्णाली चलचित्र','वृत्तचित्र'],yearGroup:'२०८२' },
    { id:'lal-mohar',title:'रातो मोहर',english:'The Red Seal',year:'२०८१',yearEn:'2024',genre:'ऐतिहासिक चलचित्र',duration:'२ घण्टा ०५ मिनेट',durationEn:'2h 05m',price:'रु. २५०',director:'किरण शाही',producer:'पुरानो दरबार फिल्म्स',cast:'प्रविन मल्ल, शोभा रावत, गणेश थापा',story:'पुरानो दरबारको अभिलेखमा भेटिएको एउटा लाल मोहरले तीन पुस्ताको इतिहास खोल्छ। पात्र र घटना काल्पनिक हुन्।',art:'poster-4',tag:'Period drama',categories:['नेपाली चलचित्र','ऐतिहासिक चलचित्र'],yearGroup:'२०८१' },
    { id:'aakashko-chithi',title:'आकाशको चिठी',english:'A Letter to the Sky',year:'२०८१',yearEn:'2024',genre:'प्रेमकथा',duration:'१ घण्टा ३८ मिनेट',durationEn:'1h 38m',price:'रु. २००',director:'स्नेहा रोकाया',producer:'रातो धागो',cast:'आशा मल्ल, निरज बुढा',story:'टाढा भएका दुई साथीले हरेक वर्ष एउटै आकाशमुनि एउटा पत्र लेख्छन्। एउटा सरल प्रेमकथा अवधारणा।',art:'poster-5',tag:'Romance',categories:['नेपाली चलचित्र','प्रेमकथा'],yearGroup:'२०८१' },
    { id:'gham-arko-paarि',title:'घाम अर्को पारि',english:'Sunlight on the Other Bank',year:'२०८३',yearEn:'2026',genre:'छोटा चलचित्र',duration:'२१ मिनेट',durationEn:'21m',price:'रु. ७५',director:'सन्देश पुन',producer:'एक दृश्य स्टुडियो',cast:'लक्ष्मी रोकाया, विकास कडेल',story:'नदी तर्ने पुल नबनेको गाउँमा दुई बाल साथीले आफ्नै बाटो बनाउने उपाय खोज्छन्। नमुना छोटो चलचित्रको अवधारणा।',art:'poster-6',tag:'Short film',categories:['नेपाली चलचित्र','कर्णाली चलचित्र','छोटा चलचित्र'],yearGroup:'२०८३' },
    { id:'banjha-ghanti',title:'बाँझो घण्टी',english:'The Silent Bell',year:'२०८०',yearEn:'2023',genre:'सामाजिक चलचित्र',duration:'१ घण्टा ४१ मिनेट',durationEn:'1h 41m',price:'रु. १५०',director:'देविका बम',producer:'पाखा कथालय',cast:'मनोज ऐर, रिता जोशी, सागर रोकाया',story:'वर्षौँदेखि नबजेको गाउँको घण्टी फेरि बजाउने प्रयासले समुदायलाई एउटै प्रश्नमा ल्याउँछ।',art:'poster-7',tag:'Community',categories:['नेपाली चलचित्र','सुदूरपश्चिमेली चलचित्र','सामाजिक चलचित्र'],yearGroup:'२०८०' },
    { id:'ghar-aune-din',title:'घर आउने दिन',english:'The Day We Return',year:'२०८३',yearEn:'2026',genre:'प्रेमकथा',duration:'१ घण्टा ३२ मिनेट',durationEn:'1h 32m',price:'रु. २००',director:'पूजा बुढा',producer:'डाँफे स्टुडियो',cast:'समिर भण्डारी, प्रेरणा शाही',story:'घर फर्किने एउटा चाडले बाल्यकालका दुई साथीलाई फेरि भेटाउँछ। यो अर्को काल्पनिक कथा अवधारणा हो।',art:'poster-8',tag:'Recommended',categories:['नेपाली चलचित्र','प्रेमकथा'],yearGroup:'२०८३' }
  ];

  const heroSlides = [0, 1, 5];
  const grid = document.getElementById('movieGrid');
  const searchInput = document.getElementById('searchInput');
  const categoryButtons = Array.from(document.querySelectorAll('.category-chip'));
  const toastNode = document.getElementById('toast');
  const movieDialog = document.getElementById('movieDialog');
  const checkoutDialog = document.getElementById('checkoutDialog');
  const playerDialog = document.getElementById('playerDialog');
  const noticeDialog = document.getElementById('noticeDialog');
  const storedWatchlistKey = 'chalchitralaya-demo-watchlist';
  let selectedCategory = 'all';
  let selectedMovie = movies[0];
  let currentHero = 0;
  let language = 'ne';
  let toastTimer;
  let playerTime = Number(sessionStorage.getItem('chalchitralaya-demo-resume') || 0);
  let playerPlaying = false;
  let playerFrame = 0;
  let playerLastFrame = 0;
  let audioContext = null;
  let demoGain = null;
  const reviewDrafts = new Map();
  const genreEnglish = {
    'सामाजिक चलचित्र': 'Social drama', 'सुदूरपश्चिमेली चलचित्र': 'Sudurpashchim film',
    'कर्णाली चलचित्र': 'Karnali film', 'वृत्तचित्र': 'Documentary',
    'ऐतिहासिक चलचित्र': 'Historical drama', 'प्रेमकथा': 'Romance', 'छोटा चलचित्र': 'Short film'
  };
  const storyEnglish = {
    'pahadko-katha': 'On a journey home, a daughter discovers her father’s unfinished voice and a village in change. A fictional concept.',
    'setiko-bato': 'Two strangers meet along the Seti and learn why the journey can matter more than the destination. A fictional concept.',
    'karnali-patra': 'A sample documentary concept about letters sent by Karnali families to loved ones across the river and away from home.',
    'lal-mohar': 'A seal found in an old palace archive opens the histories of three generations. The characters and events are fictional.',
    'aakashko-chithi': 'Two distant friends write a letter under the same sky each year. A fictional romance concept.',
    'gham-arko-paarि': 'In a village without a bridge, two children search for a way across the river. A fictional short-film concept.',
    'banjha-ghanti': 'An effort to ring a village bell silent for years brings the community together around one question. A fictional concept.',
    'ghar-aune-din': 'A festival reunion brings two childhood friends home. A fictional story concept.'
  };
  const staticEnglish = [
    ['#heroDetails', 'View details'], ['#heroDemo', 'Demo scene'],
    ['.hero-demo-label', 'Concept film · tickets are not on sale'],
    ['.demo-banner p strong', 'Demonstration catalogue'],
    ['.demo-banner p span', 'Films, credits, years, and prices are examples. Ticketing, accounts, and full-film playback are not connected.'],
    ['.demo-banner button', 'About this platform'], ['#trendingTitle', 'Trending films'],
    ['.catalog-section:nth-of-type(3) .section-note', 'Sample films · no streaming connected'],
    ['.collection-section:nth-of-type(1) h2', 'Recently added · concept titles'],
    ['.collection-section:nth-of-type(1) .section-note', 'Sample list'],
    ['.collection-section:nth-of-type(2) h2', 'Recommended · sample picks'],
    ['.collection-section:nth-of-type(2) .section-note', 'Personal recommendations are not active'],
    ['.editorial-section h2', 'Upcoming stories'], ['.editorial-section .section-note', 'Concepts in development'],
    ['.upcoming-one>span', 'Coming · 2027'], ['.upcoming-one p', 'A journey that connects two generations.'],
    ['.upcoming-two>span', 'In development · 2027'], ['.upcoming-two p', 'Unfinished letters from the river’s edge.'],
    ['.filmmaker-callout .eyebrow', 'For filmmakers'], ['.filmmaker-callout h2', 'Bring your story to the screen.'],
    ['.filmmaker-callout p', 'A dashboard for submissions and sales is planned for a future release.'],
    ['.filmmaker-callout button', 'Filmmaker demo'], ['.site-footer>span', 'A demonstration platform for Nepali cinema'],
    ['.site-footer button', 'Admin demo'], ['#movieBadge', 'SAMPLE FILM'],
    ['.credit-grid div:nth-child(1) small', 'Director'], ['.credit-grid div:nth-child(2) small', 'Producer'],
    ['.cast-line small', 'Cast'], ['#buyTicketButton', 'Ticket information'],
    ['#watchDemoButton', 'Original demo scene'], ['#watchMovieButton', 'Watch film · unavailable'],
    ['.review-demo h3', 'Demo review and rating'], ['.review-demo>p', 'Ratings and reviews stay on this page; they are not published.'],
    ['.review-demo form label', 'Demo review'], ['.review-demo form button', 'Preview review'],
    ['.backend-hint', 'Ticketing and full-film playback need a real payment service, licensed film files, user accounts, and secure storage.'],
    ['#checkoutTitle', 'Ticket information'], ['.checkout-summary span', 'Example ticket price'],
    ['.checkout-warning b', 'Demonstration only · no payment'],
    ['.checkout-warning span', 'No money is taken, no ticket is issued, and this film is not added to your library. A payment gateway and ticket service are required for real sales.'],
    ['.checkout-dialog [data-close].button', 'Understood · go back'],
    ['#playerTitle', 'Original demo scene'], ['.player-controls>p', 'An original generated animation demonstrates player controls; it is not a film.'],
    ['#fullscreenButton', '⛶ Fullscreen'], ['.mobile-nav a small', 'Home'],
    ['#mobileNavSearch small', 'Search'], ['.mobile-nav [data-open="library"] small', 'My library'],
    ['.mobile-nav [data-open="account"] small', 'Account']
  ];

  function readWatchlist() {
    try { return new Set(JSON.parse(sessionStorage.getItem(storedWatchlistKey) || '[]')); }
    catch (_) { return new Set(); }
  }
  let watchlist = readWatchlist();
  function saveWatchlist() { sessionStorage.setItem(storedWatchlistKey, JSON.stringify(Array.from(watchlist))); }
  function showToast(message) {
    toastNode.textContent = message;
    toastNode.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastNode.classList.remove('visible'), 3200);
  }
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function makePoster(movie, compact) {
    const poster = element('div', `poster ${movie.art}`);
    poster.setAttribute('aria-label', `${movie.title} · मौलिक नमुना पोस्टर कला`);
    poster.append(element('div', 'poster-landscape'));
    poster.append(element('div', 'poster-figure'));
    const copy = element('div', 'poster-copy');
    copy.append(element('span', 'poster-mark', 'च'));
    copy.append(element('strong', 'poster-title', language === 'en' ? movie.english : movie.title));
    copy.append(element('span', 'poster-genre', (language === 'en' ? (genreEnglish[movie.genre] || movie.genre) : movie.genre).toUpperCase()));
    poster.append(copy);
    if (!compact) poster.append(element('span', 'poster-badge', movie.tag.toUpperCase()));
    return poster;
  }
  function renderMovies() {
    const query = searchInput.value.trim().toLocaleLowerCase();
    const filtered = movies.filter(movie => {
      const matchesCategory = selectedCategory === 'all' || movie.categories.includes(selectedCategory);
      const haystack = [movie.title, movie.english, movie.genre, movie.director, ...movie.categories].join(' ').toLocaleLowerCase();
      return matchesCategory && (!query || haystack.includes(query));
    });
    grid.replaceChildren();
    filtered.forEach(movie => {
      const card = element('article', 'movie-card');
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', language === 'en' ? `${movie.english}, ${genreEnglish[movie.genre] || movie.genre}, open details` : `${movie.title}, ${movie.genre}, विवरण खोल्नुहोस्`);
      const poster = makePoster(movie, false);
      const save = element('button', 'save-card', watchlist.has(movie.id) ? '♥' : '＋');
      save.type = 'button';
      save.setAttribute('aria-label', watchlist.has(movie.id) ? 'Remove from demo watchlist' : 'Add to demo watchlist');
      save.setAttribute('aria-pressed', String(watchlist.has(movie.id)));
      save.addEventListener('click', event => {
        event.stopPropagation();
        toggleWatchlist(movie);
        save.textContent = watchlist.has(movie.id) ? '♥' : '＋';
        save.setAttribute('aria-pressed', String(watchlist.has(movie.id)));
      });
      poster.append(save);
      card.append(poster);
      const meta = element('div', 'card-meta');
      meta.append(element('h3', 'card-title', language === 'en' ? movie.english : movie.title));
      const sub = element('div', 'card-subtitle');
      sub.append(element('span', '', `${language === 'en' ? movie.yearEn : movie.year} · ${language === 'en' ? 'Demo title' : 'नमुना चलचित्र'}`));
      sub.append(element('span', 'card-tag', language === 'en' ? (genreEnglish[movie.genre] || movie.tag) : movie.genre));
      meta.append(sub);
      card.append(meta);
      card.addEventListener('click', () => openMovie(movie));
      card.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openMovie(movie); }
      });
      grid.append(card);
    });
    document.getElementById('emptyState').hidden = filtered.length > 0;
  }
  function renderCollections() {
    const collections = [
      ['recentGrid', [movies[6], movies[3], movies[1], movies[2]]],
      ['recommendedGrid', [movies[0], movies[4], movies[5], movies[7]]]
    ];
    collections.forEach(([targetId, items]) => {
      const target = document.getElementById(targetId);
      target.replaceChildren();
      items.forEach(movie => {
        const card = element('button', 'mini-film');
        card.type = 'button';
        card.setAttribute('aria-label', language === 'en' ? `${movie.english}, open film details` : `${movie.title}, चलचित्र विवरण खोल्नुहोस्`);
        card.append(makePoster(movie, true));
        const copy = element('span', 'mini-film-copy');
        copy.append(element('strong', '', language === 'en' ? movie.english : movie.title));
        copy.append(element('span', '', `${language === 'en' ? movie.yearEn : movie.year} · ${language === 'en' ? (genreEnglish[movie.genre] || movie.genre) : movie.genre} · ${language === 'en' ? 'demo concept' : 'नमुना अवधारणा'}`));
        card.append(copy);
        card.addEventListener('click', () => openMovie(movie));
        target.append(card);
      });
    });
  }
  function setHero(index) {
    currentHero = (index + heroSlides.length) % heroSlides.length;
    const movie = movies[heroSlides[currentHero]];
    selectedMovie = movie;
    document.getElementById('heroTitle').textContent = language === 'en' ? movie.english : movie.title;
    const heroMeta = document.querySelector('.hero-meta');
    heroMeta.replaceChildren(element('span', '', language === 'en' ? movie.yearEn : movie.year), document.createTextNode('•'), document.createTextNode(language === 'en' ? (genreEnglish[movie.genre] || movie.genre) : movie.genre), document.createTextNode('•'), document.createTextNode(language === 'en' ? movie.durationEn : movie.duration));
    document.querySelector('.hero-description').textContent = language === 'en'
      ? (storyEnglish[movie.id] || `A story of home, memory, and the road that leads back. Sample concept artwork; no film is available to stream.`)
      : movie.story;
    document.querySelector('.hero-art').className = `hero-art hero-art-${currentHero + 1}`;
    document.querySelectorAll('.hero-pagination button').forEach((button, i) => button.classList.toggle('current', i === currentHero));
    document.querySelector('.hero-pagination span').innerHTML = `${String(currentHero + 1).padStart(2, '0')} <i>/</i> 03`;
  }
  function updateWatchlistButtons() {
    const isSaved = watchlist.has(selectedMovie.id);
    const button = document.getElementById('watchlistButton');
    button.setAttribute('aria-pressed', String(isSaved));
    button.textContent = language === 'en' ? (isSaved ? '✓ In my list' : '＋ Add to my list') : (isSaved ? '✓ मेरो सूचीमा छ' : '＋ मेरो सूचीमा');
  }
  function openMovie(movie) {
    selectedMovie = movie;
    document.getElementById('movieTitle').textContent = language === 'en' ? movie.english : movie.title;
    document.getElementById('movieMeta').replaceChildren(...[language === 'en' ? movie.yearEn : movie.year, language === 'en' ? (genreEnglish[movie.genre] || movie.genre) : movie.genre, language === 'en' ? movie.durationEn : movie.duration].map(value => element('span', '', value)));
    document.getElementById('movieStory').textContent = language === 'en' ? (storyEnglish[movie.id] || movie.story) : movie.story;
    document.getElementById('movieDirector').textContent = movie.director;
    document.getElementById('movieProducer').textContent = movie.producer;
    document.getElementById('movieCast').textContent = movie.cast;
    document.getElementById('moviePrice').textContent = language === 'en' ? `Proposed demo ticket price · ${movie.price} · no real sales` : `प्रस्तावित डेमो टिकट मूल्य · ${movie.price} · वास्तविक बिक्री छैन`;
    const detailArt = document.getElementById('detailArt');
    detailArt.className = `detail-art ${movie.art}`;
    detailArt.replaceChildren(element('div', 'poster-landscape'), element('div', 'poster-figure'));
    updateWatchlistButtons();
    const savedReview = reviewDrafts.get(movie.id);
    document.getElementById('reviewText').value = savedReview || '';
    movieDialog.showModal();
  }
  function toggleWatchlist(movie) {
    if (watchlist.has(movie.id)) watchlist.delete(movie.id); else watchlist.add(movie.id);
    saveWatchlist();
    updateWatchlistButtons();
    renderMovies();
    showToast('मेरो सूची यो ब्राउजर ट्याबको सत्रमा मात्रै सुरक्षित हुन्छ।');
  }
  document.getElementById('heroDetails').addEventListener('click', () => openMovie(movies[heroSlides[currentHero]]));
  document.getElementById('heroDemo').addEventListener('click', () => openDemoPlayer(movies[heroSlides[currentHero]]));
  document.querySelectorAll('.hero-pagination button').forEach((button, index) => button.addEventListener('click', () => setHero(index)));
  document.getElementById('watchlistButton').addEventListener('click', () => toggleWatchlist(selectedMovie));
  document.getElementById('buyTicketButton').addEventListener('click', () => {
    document.getElementById('checkoutMovie').textContent = language === 'en' ? selectedMovie.english : selectedMovie.title;
    document.getElementById('checkoutPrice').textContent = selectedMovie.price;
    checkoutDialog.showModal();
  });
  document.getElementById('watchMovieButton').addEventListener('click', () => showToast('अधिकार प्राप्त चलचित्र र टिकट प्रमाणीकरण जोडिएपछि उपलब्ध हुनेछ।'));
  document.getElementById('watchDemoButton').addEventListener('click', () => {
    movieDialog.close(); openDemoPlayer(selectedMovie);
  });
  document.getElementById('categoryRail').addEventListener('click', event => {
    const button = event.target.closest('.category-chip');
    if (!button) return;
    selectedCategory = button.dataset.category;
    categoryButtons.forEach(item => item.classList.toggle('selected', item === button));
    renderMovies();
  });
  document.querySelector('[data-clear-filter]').addEventListener('click', () => {
    selectedCategory = 'all'; searchInput.value = '';
    categoryButtons.forEach((item, i) => item.classList.toggle('selected', i === 0));
    renderMovies();
  });
  searchInput.addEventListener('input', renderMovies);
  document.getElementById('mobileSearch').addEventListener('click', () => {
    searchInput.closest('.search-box').classList.add('search-open');
    searchInput.focus();
    document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
  });
  document.getElementById('mobileNavSearch').addEventListener('click', () => {
    searchInput.closest('.search-box').classList.add('search-open');
    searchInput.focus();
    document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
  });
  document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault(); searchInput.focus();
      document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
    }
  });

  document.getElementById('languageToggle').addEventListener('click', () => {
    language = language === 'ne' ? 'en' : 'ne';
    document.documentElement.lang = language;
    document.getElementById('languageToggle').textContent = language === 'ne' ? 'EN' : 'नेपाली';
    document.querySelectorAll('[data-en]').forEach(node => {
      if (!node.dataset.ne) node.dataset.ne = node.textContent.trim();
      node.textContent = language === 'en' ? node.dataset.en : node.dataset.ne;
    });
    staticEnglish.forEach(([selector, english]) => {
      const node = document.querySelector(selector);
      if (!node) return;
      if (!node.dataset.ne) node.dataset.ne = node.textContent.trim();
      node.textContent = language === 'en' ? english : node.dataset.ne;
    });
    const categoryEnglish = { all: 'All', 'नेपाली चलचित्र': 'Nepali films', 'सुदूरपश्चिमेली चलचित्र': 'Sudurpashchim films', 'कर्णाली चलचित्र': 'Karnali films', 'ऐतिहासिक चलचित्र': 'Historical', 'सामाजिक चलचित्र': 'Social drama', 'प्रेमकथा': 'Romance', 'वृत्तचित्र': 'Documentary', 'छोटा चलचित्र': 'Short films' };
    categoryButtons.forEach(button => {
      if (!button.dataset.ne) button.dataset.ne = button.textContent.trim();
      button.textContent = language === 'en' ? (categoryEnglish[button.dataset.category] || button.dataset.ne) : button.dataset.ne;
    });
    searchInput.placeholder = language === 'en' ? 'Search films' : 'चलचित्र खोज्नुहोस्';
    setHero(currentHero);
    renderMovies();
    renderCollections();
    updateWatchlistButtons();
  });

  function setNotice(title, body, eyebrow) {
    document.getElementById('noticeTitle').textContent = title;
    document.getElementById('noticeEyebrow').textContent = eyebrow || 'चलचित्रलय · प्रदर्शन नमुना';
    document.getElementById('noticeBody').replaceChildren(body);
    noticeDialog.showModal();
  }
  function openNotice(kind) {
    const body = element('div');
    if (kind === 'library') {
      const intro = element('p', '', 'तपाईंको खाता जडान भएको छैन। तलको सूची यो ब्राउजर ट्याबको सत्रमा मात्र रहन्छ।'); body.append(intro);
      body.append(element('p', '', `मेरो सूची · ${watchlist.size} नमुना शीर्षक`));
      if (watchlist.size) {
        const list = element('ul');
        movies.filter(movie => watchlist.has(movie.id)).forEach(movie => list.append(element('li', '', movie.title)));
        body.append(list);
      } else body.append(element('p', '', 'तपाईंले कुनै चलचित्र सूचीमा राख्नुभएको छैन।'));
      body.append(element('p', '', 'My Tickets · ० वास्तविक टिकट। demonstration checkout ले बिक्री वा टिकट जारी गर्दैन।'));
      body.append(element('p', '', `Demo animation resume point · ${Number(playerTime).toFixed(1)} सेकेन्ड (यो चलचित्र हेरेको इतिहास होइन)।`));
      setNotice('मेरो चलचित्र संग्रह', body, 'SESSION-ONLY DEMO');
    } else if (kind === 'account') {
      body.append(element('p', '', 'लगइन र दर्ता स्क्रिनको नमुना। यो फारमले कुनै खाता बनाउँदैन वा विवरण कतै पठाउँदैन।'));
      const form = element('form', 'demo-form');
      form.innerHTML = '<label>इमेल (नमुना मात्र)<input type="email" autocomplete="off" required></label><label>पासवर्ड (नमुना मात्र)<input type="password" autocomplete="off" required></label><button type="submit">डेमो जारी राख्नुहोस्</button>';
      form.addEventListener('submit', event => {
        event.preventDefault(); form.reset(); noticeDialog.close();
        showToast('डेमो मात्र · कुनै खाता बनाइएको छैन।');
      });
      body.append(form, element('p', '', 'वास्तविक खाताका लागि प्रमाणीकरण र सुरक्षित प्रयोगकर्ता डाटाबेस आवश्यक पर्छ।'));
      setNotice('लगइन / खाता बनाउनुहोस्', body, 'ACCOUNT PREVIEW');
    } else if (kind === 'filmmaker') {
      body.append(element('p', '', 'फिल्ममेकर ड्यासबोर्ड भविष्यका लागि योजना गरिएको छ। यहाँ कुनै चलचित्र अपलोड वा सेभ हुँदैन।'));
      const list = element('ul');
      ['चलचित्र विवरण र अधिकार कागजात पेस गर्ने','पोस्टर र ट्रेलर अपलोड गर्ने','प्रस्तावित टिकट मूल्य तय गर्ने','बिक्री र दर्शक प्रतिवेदन हेर्ने'].forEach(item => list.append(element('li', '', item)));
      body.append(list, element('p', '', 'यसका लागि प्रमाणित फिल्ममेकर खाता, सुरक्षित फाइल भण्डारण, चलचित्र अनुमोदन र भुक्तानी विवरण चाहिन्छ।'));
      setNotice('फिल्ममेकर स्टुडियो · अवधारणा', body, 'FUTURE CREATOR DASHBOARD');
    } else if (kind === 'admin') {
      body.append(element('p', '', 'प्रशासन प्यानलको अवधारणा मात्र। यो पृष्ठले प्रयोगकर्ता, चलचित्र वा कारोबार नियन्त्रण गर्दैन।'));
      const list = element('ul');
      ['चलचित्र अनुमोदन','प्रयोगकर्ता र फिल्ममेकर प्रमाणीकरण','टिकट र बिक्री रिपोर्ट','अधिकार तथा सामग्री व्यवस्थापन'].forEach(item => list.append(element('li', '', item)));
      body.append(list, element('p', '', 'वास्तविक प्रशासनका लागि सुरक्षित भूमिका, audit trail र server-side authorization आवश्यक छ।'));
      setNotice('प्रशासन · अवधारणा', body, 'ADMIN DASHBOARD PREVIEW');
    } else {
      body.append(element('p', '', 'चलचित्रलयले नेपाली चलचित्र, टिकटिङ र कलाकारहरूको खोजीलाई एउटै डिजिटल घरमा जोड्ने लक्ष्य राख्छ। यो हालको investor demo हो।'));
      body.append(element('p', '', 'चलचित्रका शीर्षक, पोस्टर, वर्ष, कलाकार, कथा र मूल्य सबै काल्पनिक उदाहरण हुन्। कुनै वास्तविक फिल्म वा टिकट समावेश छैन।'));
      body.append(element('p', '', 'वास्तविक उत्पादनका लागि चलचित्र अधिकार, भुक्तानी gateway, प्रयोगकर्ता login, सुरक्षित ticket ledger, video delivery/CDN र filmmaker/admin services आवश्यक हुनेछन्।'));
      setNotice('तीन एपको सिनेमा अवधारणा', body, 'ABOUT चलचित्रलय');
    }
  }
  document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => openNotice(button.dataset.open)));
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
  document.getElementById('reviewForm').addEventListener('submit', event => {
    event.preventDefault();
    const value = document.getElementById('reviewText').value.trim();
    if (!value) return;
    reviewDrafts.set(selectedMovie.id, value);
    document.getElementById('reviewStatus').textContent = 'तपाईंको नमुना समीक्षा यस पृष्ठमा मात्र देखाइएको छ; सार्वजनिक वा सुरक्षित गरिएको छैन।';
    showToast('नमुना समीक्षा पृष्ठको यो सत्रमा मात्रै राखियो।');
  });
  document.getElementById('ratingRow').addEventListener('click', event => {
    const button = event.target.closest('[data-rating]');
    if (!button) return;
    document.querySelectorAll('#ratingRow [data-rating]').forEach(star => star.classList.toggle('rated', Number(star.dataset.rating) <= Number(button.dataset.rating)));
    document.getElementById('reviewStatus').textContent = 'डेमो rating · सार्वजनिक रूपमा सेभ भएको छैन।';
  });

  function drawDemo(time) {
    const canvas = document.getElementById('demoCanvas');
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(rect.width * ratio) || canvas.height !== Math.round(rect.height * ratio)) {
      canvas.width = Math.round(rect.width * ratio); canvas.height = Math.round(rect.height * ratio);
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const w = rect.width, h = rect.height, phase = time / 18;
    const sky = ctx.createLinearGradient(0, 0, w, h);
    sky.addColorStop(0, '#392d29'); sky.addColorStop(.52, '#19242a'); sky.addColorStop(1, '#080a0d');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    const sunX = w * (.7 - phase * .3), sunY = h * (.33 + Math.sin(phase * Math.PI * 2) * .035);
    const glow = ctx.createRadialGradient(sunX, sunY, 1, sunX, sunY, h * .32);
    glow.addColorStop(0, '#e8bc85aa'); glow.addColorStop(.2, '#a47155aa'); glow.addColorStop(1, '#845d4900');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e7b47b'; ctx.beginPath(); ctx.arc(sunX, sunY, h * .075, 0, Math.PI * 2); ctx.fill();
    function ridge(y, amp, color, offset) {
      ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 5) {
        const yy = y + Math.sin(x / w * 6 + phase * 5 + offset) * amp + Math.sin(x / w * 13 + offset) * amp * .28;
        ctx.lineTo(x, yy);
      }
      ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
    }
    ridge(h * .57, h * .12, '#263338', 0);
    ridge(h * .72, h * .1, '#171f22', 2.1);
    ridge(h * .84, h * .055, '#0b1012', 4.3);
    ctx.fillStyle = '#f1d1a9a8'; ctx.font = `${Math.max(9, h * .022)}px system-ui`; ctx.fillText('चलचित्रलय · ORIGINAL DEMO ART', 18, h - 18);
  }
  function playTone() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    audioContext = audioContext || new AudioContextClass();
    if (demoGain) return;
    const low = audioContext.createOscillator();
    const high = audioContext.createOscillator();
    demoGain = audioContext.createGain();
    const toneGain = audioContext.createGain();
    low.type = 'sine'; low.frequency.value = 82.4;
    high.type = 'sine'; high.frequency.value = 123.5;
    toneGain.gain.value = .12;
    demoGain.gain.value = Number(document.getElementById('playerVolume').value) * .08;
    low.connect(toneGain); high.connect(toneGain); toneGain.connect(demoGain); demoGain.connect(audioContext.destination);
    low.start(); high.start();
  }
  function setPlayerState(playing) {
    playerPlaying = playing;
    const label = playing ? 'Ⅱ' : '▶';
    document.getElementById('playerToggle').textContent = label;
    document.getElementById('canvasPlay').textContent = label;
    document.getElementById('playerToggle').setAttribute('aria-label', playing ? 'Pause' : 'Play');
    document.getElementById('canvasPlay').setAttribute('aria-label', playing ? 'नमुना दृश्य रोक्नुहोस्' : 'नमुना दृश्य चलाउनुहोस्');
    if (playing) {
      playTone();
      if (audioContext) audioContext.resume();
      playerLastFrame = performance.now();
      playerFrame = requestAnimationFrame(advancePlayer);
    } else {
      cancelAnimationFrame(playerFrame);
      if (audioContext) audioContext.suspend();
    }
  }
  function advancePlayer(now) {
    if (!playerPlaying) return;
    playerTime += Math.min((now - playerLastFrame) / 1000, .1);
    playerLastFrame = now;
    if (playerTime >= 18) { playerTime = 0; setPlayerState(false); }
    sessionStorage.setItem('chalchitralaya-demo-resume', String(playerTime));
    document.getElementById('playerTimeline').value = String(playerTime);
    document.getElementById('playerCurrent').textContent = `०:${String(Math.floor(playerTime)).padStart(2, '0')}`;
    drawDemo(playerTime);
    if (playerPlaying) playerFrame = requestAnimationFrame(advancePlayer);
  }
  function openDemoPlayer(movie) {
    document.getElementById('playerTitle').textContent = `${language === 'en' ? movie.english : movie.title} · मौलिक demo दृश्य`;
    playerTime = Number(sessionStorage.getItem('chalchitralaya-demo-resume') || 0);
    if (playerTime >= 18) playerTime = 0;
    document.getElementById('playerTimeline').value = String(playerTime);
    document.getElementById('playerCurrent').textContent = `०:${String(Math.floor(playerTime)).padStart(2, '0')}`;
    document.getElementById('resumeState').textContent = playerTime > 0 ? `यस ट्याबमा ${playerTime.toFixed(0)}s बाट जारी` : 'यो सत्रको demo';
    playerDialog.showModal();
    requestAnimationFrame(() => drawDemo(playerTime));
    setPlayerState(true);
  }
  document.getElementById('playerToggle').addEventListener('click', () => setPlayerState(!playerPlaying));
  document.getElementById('canvasPlay').addEventListener('click', () => setPlayerState(!playerPlaying));
  document.getElementById('playerTimeline').addEventListener('input', event => {
    playerTime = Number(event.currentTarget.value);
    sessionStorage.setItem('chalchitralaya-demo-resume', String(playerTime));
    document.getElementById('playerCurrent').textContent = `०:${String(Math.floor(playerTime)).padStart(2, '0')}`;
    drawDemo(playerTime);
  });
  document.getElementById('playerVolume').addEventListener('input', event => {
    if (demoGain && audioContext) demoGain.gain.setTargetAtTime(Number(event.currentTarget.value) * .08, audioContext.currentTime, .03);
  });
  document.getElementById('fullscreenButton').addEventListener('click', async () => {
    try {
      if (!document.fullscreenElement) await document.querySelector('.player-screen').requestFullscreen();
      else await document.exitFullscreen();
    } catch (_) { showToast('यो ब्राउजरमा fullscreen उपलब्ध छैन।'); }
  });
  playerDialog.addEventListener('close', () => setPlayerState(false));
  playerDialog.addEventListener('cancel', () => setPlayerState(false));
  window.addEventListener('resize', () => { if (playerDialog.open) drawDemo(playerTime); });

  const installGate = document.getElementById('installGate');
  let installPrompt = null;
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); installPrompt = event;
    document.getElementById('installStatus').textContent = 'चलचित्रलय ब्राउजरबाट स्थापना गर्न तयार छ।';
  });
  document.getElementById('installAppAction').addEventListener('click', async () => {
    if (!installPrompt) {
      document.getElementById('installStatus').textContent = /iPhone|iPad|iPod/i.test(navigator.userAgent)
        ? 'Safari मा Share थिच्नुहोस्, “Add to Home Screen” छान्नुहोस्, अनि Add गर्नुहोस्।'
        : 'ब्राउजर मेनुबाट “Install चलचित्रलय” वा “Add to Home screen” छान्नुहोस्।';
      return;
    }
    const prompt = installPrompt; installPrompt = null;
    try {
      await prompt.prompt();
      const result = await prompt.userChoice;
      document.getElementById('installStatus').textContent = result.outcome === 'accepted'
        ? 'स्थापना अनुरोध स्वीकार भयो। एप launcher बाट चलचित्रलय खोल्नुहोस्।'
        : 'स्थापना रद्द भयो। सामग्री हेर्न एप स्थापना आवश्यक छ।';
      if (result.outcome === 'accepted') {
        try { localStorage.setItem('ecosystem-install-chalchitralaya', 'reported'); } catch (_) {}
        document.getElementById('openInstalledApp').hidden = false;
      }
    } catch (_) { document.getElementById('installStatus').textContent = 'ब्राउजरको Add to Home Screen मेनु प्रयोग गर्नुहोस्।'; }
  });
  window.addEventListener('appinstalled', () => {
    try { localStorage.setItem('ecosystem-install-chalchitralaya', 'reported'); } catch (_) {}
    sessionStorage.setItem('chalchitralaya-install-requested', 'yes');
    document.getElementById('installStatus').textContent = 'स्थापना भयो भन्ने ब्राउजर सूचना प्राप्त भयो। एप launcher बाट खोल्नुहोस्।';
    document.getElementById('openInstalledApp').hidden = false;
  });
  document.getElementById('openInstalledApp').addEventListener('click', () => {
    location.href = '/chalchitralaya/';
    showToast('यदि एप नखुलेमा home screen बाट चलचित्रलय खोल्नुहोस्।');
  });
  async function detectInstall() {
    if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true) {
      document.documentElement.classList.add('cinema-installed');
      installGate.hidden = true;
      return;
    }
    document.documentElement.classList.add('cinema-install-required');
    try {
      const related = await navigator.getInstalledRelatedApps?.();
      const appId = new URL('/chalchitralaya/', location.origin).href;
      if (related && related.some(app => app.id === appId)) {
        try { localStorage.setItem('ecosystem-install-chalchitralaya', 'reported'); } catch (_) {}
        document.getElementById('installStatus').textContent = 'यो ब्राउजरले चलचित्रलय स्थापना भएको रिपोर्ट गरेको छ। launcher बाट खोल्नुहोस्।';
        document.getElementById('openInstalledApp').hidden = false;
      } else if (related) {
        document.getElementById('installStatus').textContent = 'यो ब्राउजरले चलचित्रलय स्थापना भएको देखाएको छैन।';
      }
    } catch (_) { /* Detection is optional and not supported everywhere. */ }
  }
  detectInstall();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/chalchitralaya/sw.js', { scope: '/chalchitralaya/' }).catch(error => console.warn('चलचित्रलय worker could not register:', error));

  renderMovies();
  renderCollections();
  setHero(0);
}());
