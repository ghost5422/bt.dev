/* AÖF Çalışma Paneli — HTML / CSS / vanilla JS + Firebase Realtime Database
   Kayıtlar yalnızca lifeOS/aofTrackerV1 yoluna yazılır; localStorage kullanılmaz. */
(() => {
  'use strict';
  const EXAM_DATE = '2026-12-05';
  const PATH = window.AOF_DATABASE_PATH || 'lifeOS/aofTrackerV1';
  const newId = () => (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const topic = (id, name, done=false, date=null) => ({id,name,done,completedAt:date});
  const unit = (n,name,status,completedAt,topics) => ({id:`u${n}`,name,status,completedAt,topics});
  const EMPTY = n => unit(n,`${n}. Ünite — Başlık ekleyebilirsin`,'todo',null,[]);
  const INITIAL_DATA = {
    version:1,
    courses:[
      {id:'ikt',code:'İKT101U',name:'İktisada Giriş I',short:'İktisat',color:'#8b99ff',icon:'chart-no-axes-column-increasing',units:[
        unit(1,'İktisadın Temel Kavramları','done',null,[topic('ikt1a','Kıtlık, tercih ve fırsat maliyeti',true),topic('ikt1b','Ekonomik karar verme ve temel kavramlar',true),topic('ikt1c','Mikro iktisat ve makro iktisat',true)]),
        unit(2,'Arz, Talep ve Piyasa Dengesi','doing',null,[topic('ikt2a','Talep ve talebi belirleyen faktörler',true),topic('ikt2b','Arz ve arzı belirleyen faktörler',true),topic('ikt2c','Piyasa dengesi, arz fazlası ve talep fazlası',true),topic('ikt2d','Talebin değişmesinin dengeye etkisi',false),topic('ikt2e','Arzın değişmesinin dengeye etkisi',false),topic('ikt2f','Arz ve talebin aynı anda değişmesi',false)]),EMPTY(3),EMPTY(4)
      ]},
      {id:'isl',code:'İŞL107U',name:'Genel İşletme',short:'İşletme',color:'#efb77a',icon:'briefcase-business',units:[
        unit(1,'İşletmeciliğin Temel Kavramları','done',null,[topic('isl1a','İşletme kavramı ve temel amaçları',true),topic('isl1b','İşletmelerin sınıflandırılması',true),topic('isl1c','İşletme büyüklüğü: niceliksel ve niteliksel ölçütler',true),topic('isl1d','KOBİ sınıflandırması',true)]),
        unit(2,'İşletme Sistemi ve Temel Kavramlar','doing',null,[topic('isl2a','Sistem ve alt sistemler',true),topic('isl2b','Açık ve kapalı sistemler',true),topic('isl2c','Sinerji ve stratejik sinerji',true),topic('isl2d','Entropi ve ekofinalite',true),topic('isl2e','Misyon ve vizyon',true)]),EMPTY(3),EMPTY(4)
      ]},
      {id:'tar',code:'TAR201U',name:'Atatürk İlkeleri ve İnkılap Tarihi I',short:'İnkılap Tarihi',color:'#5ccbb5',icon:'landmark',units:[
        unit(1,'Osmanlı Devleti’nde Yenileşme Hareketleri','done','2026-10-24',[topic('tar1a','III. Selim ve Nizam-ı Cedid',true),topic('tar1b','Sened-i İttifak ve Sekban-ı Cedid',true),topic('tar1c','Tanzimat ve Islahat Fermanları',true),topic('tar1d','Meşrutiyet dönemi ve yenileşme',true)]),
        unit(2,'Savaşlar ve I. Dünya Savaşı','done','2026-11-01',[topic('tar2a','Trablusgarp Savaşı',true),topic('tar2b','Balkan Savaşları',true),topic('tar2c','I. Dünya Savaşı’nın nedenleri ve ittifaklar',true),topic('tar2d','Osmanlı Devleti’nin savaşa girişi ve cepheler',true)]),EMPTY(3),EMPTY(4)
      ]},
      {id:'tur',code:'TÜR201U',name:'Türk Dili I',short:'Türk Dili',color:'#c29cea',icon:'languages',units:[
        unit(1,'Dil ve Türkçenin Temel Özellikleri','done',null,[topic('tur1a','Dil kavramı, özellikleri ve işlevleri',true),topic('tur1b','Dil ve kültür ilişkisi',true),topic('tur1c','Türk diline giriş',true)]),
        unit(2,'Türk Dilinin Tarihsel Gelişimi','doing',null,[topic('tur2a','Tanzimat döneminde dil çalışmaları',true),topic('tur2b','Şemsettin Sami ve Kamus-ı Türkî',true),topic('tur2c','Türk Derneği ve Genç Kalemler',true),topic('tur2d','Yeni Lisan Hareketi',true),topic('tur2e','Türklük Bilimi (Türkoloji)',true),topic('tur2f','Yazı Devrimi',false)]),EMPTY(3),EMPTY(4)
      ]}
    ],
    tests:[
      {id:'test1',date:'2026-10-23',courseId:'ikt',unitId:'u1',correct:5,total:5,note:'1. ünite seviye tespiti'},
      {id:'test2',date:'2026-10-29',courseId:'ikt',unitId:'u2',correct:4,total:5,note:'2. ünite mini test'},
      {id:'test3',date:'',courseId:'isl',unitId:'u1',correct:18,total:20,note:'1. ünite ilk genel test; kesin tarih bilinmiyor'},
      {id:'test4',date:'2026-11-01',courseId:'isl',unitId:'multi',correct:15,total:20,note:'1–2. ünite genel tekrar'},
      {id:'test5',date:'2026-10-24',courseId:'tar',unitId:'u1',correct:19,total:20,note:'1. ünite ilk genel test'},
      {id:'test6',date:'2026-11-01',courseId:'tar',unitId:'multi',correct:18,total:20,note:'1–2. ünite genel tekrar'},
      {id:'test7',date:'',courseId:'tur',unitId:'u1',correct:5,total:5,note:'1. ünite seviye tespiti; kesin tarih bilinmiyor'},
      {id:'test8',date:'2026-11-02',courseId:'tur',unitId:'u2',correct:5,total:5,note:'2. ünite genel tekrar'}
    ],
    logs:[
      {id:'log1',date:'2026-10-24',type:'unit',courseId:'tar',title:'1. ünite tamamlandı',detail:'Osmanlı Devleti’nde Yenileşme Hareketleri'},
      {id:'log2',date:'2026-11-01',type:'unit',courseId:'tar',title:'2. ünite tamamlandı',detail:'Savaşlar ve I. Dünya Savaşı'}
    ]
  };

  let data = structuredClone(INITIAL_DATA);
  let view = 'genel';
  let courseFilter = 'all';
  let logFilter = 'all';
  let testFilter = 'all';
  let openUnits = new Set(['ikt:u2','isl:u2','tar:u2','tur:u2']);
  let connection = 'connecting';
  let dbRef = null;
  let pendingWrites = 0;
  let saveQueue = Promise.resolve();
  let initialized = false;
  let seedAttempted = false;
  let toastTimer;

  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const today = () => new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const dt = s => s ? new Intl.DateTimeFormat('tr-TR',{day:'numeric',month:'short',year:'numeric',timeZone:'Europe/Istanbul'}).format(new Date(`${s}T12:00:00Z`)) : 'Tarih belirtilmedi';
  const shortDt = s => s ? new Intl.DateTimeFormat('tr-TR',{day:'numeric',month:'short',timeZone:'Europe/Istanbul'}).format(new Date(`${s}T12:00:00Z`)) : '—';
  const dayDiff = (a,b) => Math.round((Date.parse(b+'T00:00:00Z')-Date.parse(a+'T00:00:00Z'))/86400000);
  const getCourse = id => data.courses.find(c=>c.id===id);
  const getUnit = (c,u) => getCourse(c)?.units.find(x=>x.id===u);
  const percent = (a,b) => b ? Math.round(a*100/b) : 0;
  const doneUnits = () => data.courses.flatMap(c=>c.units).filter(u=>u.status==='done').length;
  const allUnits = () => data.courses.reduce((n,c)=>n+c.units.length,0);
  const allTopics = () => data.courses.flatMap(c=>c.units.flatMap(u=>u.topics));
  const avgScore = () => data.tests.length ? Math.round(data.tests.reduce((s,t)=>s+percent(t.correct,t.total),0)/data.tests.length) : 0;
  const unitTopicsDone = u => u.topics.filter(t=>t.done).length;
  const courseDone = c => c.units.filter(u=>u.status==='done').length;
  const pill = status => `<span class="status-badge ${status}">${status==='done'?'Tamamlandı':status==='doing'?'Devam ediyor':'Başlanmadı'}</span>`;
  const icon = name => `<i data-lucide="${esc(name)}"></i>`;
  const courseIcon = c => `<span class="course-symbol" style="--course-color:${c.color}">${icon(c.icon)}</span>`;
  const labelUnit = (c,u) => u==='multi'?'1–2. ünite':u==='all'?'Genel':`${Number((getUnit(c,u)?.id||'u0').slice(1))}. ünite`;
  const fmtPercent = x=>`%${x}`;

  function notify(message){const n=$('#toast');n.textContent=message;n.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>n.classList.remove('show'),3300)}
  function refreshIcons(){if(window.lucide?.createIcons) window.lucide.createIcons();}
  function setConnection(mode, message){connection=mode;let e=$('#syncStatus');e.className=`sync-status ${mode==='online'?'online':mode==='error'?'error':''}`;e.innerHTML=`<span class="status-dot"></span><span>${esc(message || (mode==='online'?'Firebase senkronize':mode==='error'?'Bağlantı yok · Kaydedilmez':'Firebase bağlanıyor'))}</span>`;}
  function normalize(raw){
    if (!raw || !Array.isArray(raw.courses)) return structuredClone(INITIAL_DATA);
    raw.tests=Array.isArray(raw.tests)?raw.tests:[];
    raw.logs=Array.isArray(raw.logs)?raw.logs:[];
    for(const c of raw.courses){c.units=Array.isArray(c.units)?c.units:[];for(const u of c.units){u.topics=Array.isArray(u.topics)?u.topics:[];}}
    return raw;
  }

  function connect(){
    if(!window.firebase || !window.AOF_FIREBASE_CONFIG){setConnection('error','Firebase SDK yüklenmedi');return;}
    try {
      const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(window.AOF_FIREBASE_CONFIG);
      dbRef=firebase.database(app).ref(PATH);
      dbRef.on('value',snap=>{
        if(!snap.exists()){
          if(!seedAttempted){
            seedAttempted=true;
            dbRef.transaction(current=>current===null?structuredClone(INITIAL_DATA):undefined,(err,committed)=>{
              if(err){setConnection('error','İlk kayıt engellendi');notify('Firebase yazma izni gerekli.');}
              else if(!committed) notify('Mevcut kayıtlar korundu.');
            },false);
          }
          return;
        }
        initialized=true;
        if(pendingWrites===0){data=normalize(snap.val());render();}
        setConnection('online','Firebase senkronize');
      },error=>{setConnection('error','Firebase erişimi reddedildi');notify(`Firebase: ${error.message}`);});
    } catch(e){setConnection('error','Bağlantı kurulamadı');notify(e.message);}
  }
  function persist(){
    data.updatedAt=today();
    render();
    if(!dbRef){notify('Değişiklik yalnızca ekranda. Firebase bağlantısı yok.');return;}
    const snapshot=structuredClone(data);
    pendingWrites++;
    setConnection('connecting','Kaydediliyor...');
    saveQueue=saveQueue.catch(()=>{}).then(()=>dbRef.set(snapshot)).then(()=>{
      pendingWrites--;
      if(pendingWrites===0)setConnection('online','Firebase senkronize');
    }).catch(e=>{
      pendingWrites--;
      setConnection('error','Kayıt kaydedilemedi');
      notify(`Firebase kaydı başarısız: ${e.message}`);
    });
  }
  function logActivity(type,courseId,title,detail,date){
    if(!date)return;
    data.logs.push({id:newId(),type,courseId,title,detail:detail||'',date});
  }
  function switchView(next){view=next;document.querySelectorAll('.nav-link').forEach(e=>e.classList.toggle('active',e.dataset.view===next));const titles={genel:'Genel Bakış',dersler:'Dersler ve Üniteler',kayitlar:'Çalışma Geçmişi',denemeler:'Deneme Sonuçları',ayarlar:'Ayarlar'};$('#breadcrumb').textContent=titles[next];render();window.scrollTo({top:0,behavior:'smooth'});}
  function heading(kicker,title,sub,buttons=''){return `<div class="page-heading"><div><span class="eyebrow">${esc(kicker)}</span><h1>${esc(title)}</h1><p>${esc(sub)}</p></div>${buttons?`<div class="heading-buttons">${buttons}</div>`:''}</div>`;}
  function smallBtn(label,ic,act){return `<button class="btn btn-ghost" data-act="${act}">${icon(ic)}${label}</button>`;}
  function render(){
    const dateNow=new Intl.DateTimeFormat('tr-TR',{timeZone:'Europe/Istanbul',weekday:'short',day:'numeric',month:'long',year:'numeric'}).format(new Date());
    $('#todayDate').textContent=dateNow;
    document.querySelectorAll('.view').forEach(e=>e.classList.toggle('active',e.id===`view-${view}`));
    const viewEl=$(`#view-${view}`);
    if(view==='genel')viewEl.innerHTML=renderOverview();
    if(view==='dersler')viewEl.innerHTML=renderCourses();
    if(view==='kayitlar')viewEl.innerHTML=renderHistory();
    if(view==='denemeler')viewEl.innerHTML=renderTests();
    if(view==='ayarlar')viewEl.innerHTML=renderSettings();
    refreshIcons();
  }
  function renderOverview(){
    const examDiff=dayDiff(today(),EXAM_DATE);const remaining=Math.abs(examDiff);
    const topics=allTopics();
    const done=doneUnits();
    return `${heading('2026 / 2027 · GÜZ DÖNEMİ','Çalışma panelin, Berkay.','Dört dersin, ünitelerin ve çalışma geçmişin tek ekranda.',`<button class="btn btn-ghost" data-act="go-courses">${icon('book-open')} Ünitelerime Git</button>`)}
      <div class="stats-grid">
        ${statCard('Tamamlanan ünite',`${done}<span>/ ${allUnits()}</span>`,'layers-3',`${percent(done,allUnits())}% ünite ilerlemesi`,'')}
        ${statCard('Tamamlanan konu',`${topics.filter(x=>x.done).length}<span>/ ${topics.length}</span>`,'check-check',`${percent(topics.filter(x=>x.done).length,topics.length)}% konu ilerlemesi`,'green')}
        ${statCard('Deneme ortalaması',`${avgScore()}<span>%</span>`,'chart-no-axes-combined',`${data.tests.length} kayıtlı test / deneme`,'amber')}
        ${statCard('Aktif ünite',`${data.courses.flatMap(c=>c.units).filter(u=>u.status==='doing').length}`,'book-marked','Çalışılmaya devam edilen','pink')}
      </div>
      <div class="section-grid">
        <section class="card section-card"><div class="card-head"><div><h2>Ders ilerlemen</h2><p>Tamamlanan ünite sayısına göre</p></div><button class="text-action" data-act="go-courses">Tümünü gör ${icon('arrow-up-right')}</button></div><div class="course-list">${data.courses.map(c=>`<div class="course-item" style="--course-color:${c.color}">${courseIcon(c)}<div class="course-main"><div class="course-main-head"><strong>${esc(c.name)}</strong><span>${courseDone(c)} / ${c.units.length}</span></div><small>${esc(c.code)} · ${percent(courseDone(c),c.units.length)}% tamamlandı</small><div class="progress-track"><div class="progress-fill" style="width:${percent(courseDone(c),c.units.length)}%"></div></div></div><button class="course-arrow" title="Dersi aç" aria-label="${esc(c.name)} detay" data-act="show-course" data-course="${c.id}">${icon('chevron-right')}</button></div>`).join('')}</div></section>
        <section class="card section-card"><div class="card-head"><div><h2>Son aktiviteler</h2><p>Kaydettiğin ünite ve deneme işlemleri</p></div><button class="text-action" data-act="go-history">Geçmiş ${icon('arrow-up-right')}</button></div><div class="activity-list">${activities().slice(0,5).map(activityRow).join('')||emptyState('Henüz aktivite yok','Ünite tamamladığında veya deneme eklediğinde burada görünür.')}</div></section>
      </div>
      <div class="below-grid"><section class="card upcoming-card"><div><span class="eyebrow">YAKLAŞAN SINAV</span><h2>AÖF Güz Dönemi Vize</h2><p>05 Aralık 2026 · Hedef: dört dersin ilk dört ünitesini bitirmek.</p></div><div class="days-big">${remaining}<small>${examDiff<0?'GÜN GEÇTİ':'GÜN KALDI'}</small></div></section><section class="card insight-card"><span class="eyebrow">BİR SONRAKİ ADIM</span><h2 style="font-size:16px;margin-top:9px">Devam ettiğin üniteler</h2><p>${data.courses.filter(c=>c.units.some(u=>u.status==='doing')).map(c=>`<strong>${esc(c.short)}:</strong> ${c.units.filter(u=>u.status==='doing').map(u=>esc(u.name)).join(', ')}`).join('<br>')||'Şu anda devam eden ünite bulunmuyor.'}</p></section></div>`;
  }
  function statCard(name,value,ic,foot,tint){return `<div class="stat-card"><div class="stat-head"><span>${name}</span><span class="stat-icon ${tint}">${icon(ic)}</span></div><div class="stat-value">${value}</div><div class="stat-foot">${foot}</div></div>`;}
  function renderCourses(){
    return `${heading('DERSLER / ÜNİTELER','Derslerin ve konuların','Ünite durumunu, bitiş tarihini ve konu tamamlanmasını buradan düzenle.')}
      <div class="filters"><button class="filter-chip ${courseFilter==='all'?'active':''}" data-act="filter-course" data-course="all">Tüm dersler</button>${data.courses.map(c=>`<button class="filter-chip ${courseFilter===c.id?'active':''}" data-act="filter-course" data-course="${c.id}">${esc(c.short)}</button>`).join('')}</div>
      ${data.courses.filter(c=>courseFilter==='all'||c.id===courseFilter).map(renderCourseDetail).join('')}`;
  }
  function renderCourseDetail(c){
    return `<section class="card course-detail" style="--course-color:${c.color}"><div class="detail-top">${courseIcon(c)}<div><h2>${esc(c.name)}</h2><p>${esc(c.code)} · ${courseDone(c)} / ${c.units.length} ünite tamamlandı</p></div><span class="detail-pill">${percent(courseDone(c),c.units.length)}% ilerleme</span></div><div class="units-grid">${c.units.map(u=>renderUnit(c,u)).join('')}</div></section>`;
  }
  function renderUnit(c,u){
    const isOpen=openUnits.has(`${c.id}:${u.id}`), n=Number(u.id.slice(1));
    const total=u.topics.length, done=unitTopicsDone(u);
    return `<div class="unit"><div class="unit-header"><span class="unit-number">${String(n).padStart(2,'0')}</span><div class="unit-title"><strong>${esc(u.name)}</strong><small>${total ? `${done} / ${total} konu${u.completedAt?' · '+dt(u.completedAt):''}` : 'Henüz konu eklenmedi'}</small></div><div class="unit-actions">${pill(u.status)}<button class="icon-btn ${isOpen?'rotate':''}" aria-label="Üniteyi aç/kapat" aria-expanded="${isOpen}" data-act="toggle-unit" data-course="${c.id}" data-unit="${u.id}">${icon('chevron-down')}</button></div></div>
      ${isOpen?`<div class="unit-body"><div class="unit-tools"><label for="status-${c.id}-${u.id}">Durum</label><select id="status-${c.id}-${u.id}" class="select" data-change="unit-status" data-course="${c.id}" data-unit="${u.id}"><option value="todo" ${u.status==='todo'?'selected':''}>Başlanmadı</option><option value="doing" ${u.status==='doing'?'selected':''}>Devam ediyor</option><option value="done" ${u.status==='done'?'selected':''}>Tamamlandı</option></select><label for="date-${c.id}-${u.id}">Bitiş</label><input id="date-${c.id}-${u.id}" aria-label="Ünite bitiş tarihi" class="date-input" type="date" value="${esc(u.completedAt||'')}" data-change="unit-date" data-course="${c.id}" data-unit="${u.id}" /><button class="icon-btn" aria-label="Ünite başlığını düzenle" title="Başlığı düzenle" data-act="edit-unit" data-course="${c.id}" data-unit="${u.id}">${icon('pencil')}</button></div>${!u.completedAt&&u.status==='done'?'<p class="mini-note" style="margin:-4px 0 13px">Bu ünitenin kesin bitiş tarihi bilinmiyor. İstersen tarih seç.</p>':''}
       <div class="unit-progress"><span>Konu ilerlemesi</span><div class="progress-track"><div class="progress-fill" style="width:${percent(done,total)}%"></div></div><strong>${percent(done,total)}%</strong></div>
       <div class="topic-list">${u.topics.map(t=>`<div class="topic-row ${t.done?'checked':''}"><input class="topic-checkbox" type="checkbox" aria-label="${esc(t.name)} tamamlandı" ${t.done?'checked':''} data-change="topic-check" data-course="${c.id}" data-unit="${u.id}" data-topic="${esc(t.id)}"/><span class="topic-name">${esc(t.name)}</span>${t.done?`<input class="date-input" aria-label="Konu bitiş tarihi" title="Konu bitiş tarihi" type="date" value="${esc(t.completedAt||'')}" data-change="topic-date" data-course="${c.id}" data-unit="${u.id}" data-topic="${esc(t.id)}" />`:''}<button class="icon-btn" title="Konuyu düzenle" aria-label="Konuyu düzenle" data-act="edit-topic" data-course="${c.id}" data-unit="${u.id}" data-topic="${esc(t.id)}">${icon('pencil')}</button><button class="icon-btn" title="Konuyu sil" aria-label="Konuyu sil" data-act="delete-topic" data-course="${c.id}" data-unit="${u.id}" data-topic="${esc(t.id)}">${icon('trash-2')}</button></div>`).join('')||`<div class="empty-state" style="padding:13px">Konularını buradan ekleyebilirsin.</div>`}</div><button class="topic-add" data-act="add-topic" data-course="${c.id}" data-unit="${u.id}">${icon('plus')} Konu ekle</button></div>`:''}</div>`;
  }
  function activities(){
    const logs=data.logs.map(l=>({...l,kind:'log'}));
    const tests=data.tests.filter(t=>t.date).map(t=>({id:t.id,kind:'test',type:'test',date:t.date,courseId:t.courseId,title:`${labelUnit(t.courseId,t.unitId)} deneme · ${percent(t.correct,t.total)}%`,detail:`${t.correct}/${t.total} doğru${t.note?' · '+t.note:''}`}));
    return [...logs,...tests].filter(x=>x.date).sort((a,b)=>b.date.localeCompare(a.date)||String(b.id).localeCompare(String(a.id)));
  }
  function activityRow(a){const c=getCourse(a.courseId);const isTest=a.type==='test';return `<div class="activity"><span class="activity-symbol ${esc(a.type)}">${icon(isTest?'clipboard-check':a.type==='topic'?'check':'flag')}</span><div><strong>${esc(a.title)}</strong><p>${esc(c?.short||'Ders')} · ${esc(a.detail)}</p></div><time title="${esc(dt(a.date))}">${shortDt(a.date)}</time></div>`;}
  function renderHistory(){
    const filtered=activities().filter(a=>logFilter==='all'||a.courseId===logFilter);
    const groups=Object.groupBy?Object.groupBy(filtered,a=>a.date):filtered.reduce((g,a)=>{(g[a.date]??=[]).push(a);return g;},{});
    return `${heading('ZAMAN ÇİZELGESİ','Çalışma geçmişi','Neyi hangi gün tamamladığını ve deneme yaptığını buradan takip edebilirsin.',smallBtn('Deneme Ekle','plus','add-test'))}
      <div class="filters"><button class="filter-chip ${logFilter==='all'?'active':''}" data-act="filter-history" data-course="all">Tümü</button>${data.courses.map(c=>`<button class="filter-chip ${logFilter===c.id?'active':''}" data-act="filter-history" data-course="${c.id}">${esc(c.short)}</button>`).join('')}</div>
      <section class="card history-card">${filtered.length?Object.entries(groups).sort(([a],[b])=>b.localeCompare(a)).map(([date,arr])=>`<div class="history-date-group"><h3>${dt(date)}</h3><div class="history-list">${arr.map(a=>`<div class="history-item"><span class="history-icon ${esc(a.type)}">${icon(a.type==='test'?'clipboard-check':a.type==='topic'?'check':'flag')}</span><div><strong>${esc(a.title)}</strong><p>${esc(getCourse(a.courseId)?.name||'Ders')} · ${esc(a.detail)}</p></div>${a.kind==='log'?`<button class="icon-btn" title="Geçmiş kaydını sil" aria-label="Kaydı sil" data-act="delete-log" data-id="${esc(a.id)}">${icon('trash-2')}</button>`:''}</div>`).join('')}</div></div>`).join(''):emptyState('Kayıt bulunamadı','Seçtiğin derste tarihli aktivite yok.')}</section>
      <p class="help-text" style="margin-top:15px">Not: Önceden tamamladığın ancak günü kesinleşmeyen üniteler, yanlış tarih göstermemek için geçmişe eklenmedi. Bitiş tarihi girerek kaydedebilirsin.</p>`;
  }
  function renderTests(){
    const tests=[...data.tests].filter(t=>testFilter==='all'||t.courseId===testFilter).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
    return `${heading('DENEME TAKİBİ','Test ve deneme sonuçların','Netlerini, başarı oranlarını ve tekrar çalışmalarını kaydet.',smallBtn('Yeni Deneme Ekle','plus','add-test'))}
    <div class="stats-grid" style="grid-template-columns:repeat(3,minmax(0,1fr))">${statCard('Kayıtlı test',tests.length,'clipboard-list','Mini test + genel tekrar','')}${statCard('Ortalama başarı',`${tests.length?Math.round(tests.reduce((s,t)=>s+percent(t.correct,t.total),0)/tests.length):0}<span>%</span>`,'trending-up','Gösterilen testlerin ortalaması','green')}${statCard('En yüksek sonuç',`${tests.length?Math.max(...tests.map(t=>percent(t.correct,t.total))):0}<span>%</span>`,'trophy','Gösterilen testler içinde','amber')}</div>
    <div class="filters"><button class="filter-chip ${testFilter==='all'?'active':''}" data-act="filter-tests" data-course="all">Tüm dersler</button>${data.courses.map(c=>`<button class="filter-chip ${testFilter===c.id?'active':''}" data-act="filter-tests" data-course="${c.id}">${esc(c.short)}</button>`).join('')}</div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>TARİH</th><th>DERS / ÜNİTE</th><th>SONUÇ</th><th>BAŞARI</th><th>İŞLEM</th></tr></thead><tbody>${tests.map(t=>`<tr><td>${dt(t.date)}</td><td><strong>${esc(getCourse(t.courseId)?.short||'Ders')}</strong><br><small>${esc(labelUnit(t.courseId,t.unitId))}${t.note?' · '+esc(t.note):''}</small></td><td>${t.correct} / ${t.total}</td><td><span class="score ${percent(t.correct,t.total)>=85?'high':percent(t.correct,t.total)>=65?'mid':'low'}">${percent(t.correct,t.total)}%</span></td><td><button class="table-control" data-act="edit-test" data-id="${esc(t.id)}" title="Düzenle" aria-label="Düzenle">${icon('pencil')}</button><button class="table-control" data-act="delete-test" data-id="${esc(t.id)}" title="Sil" aria-label="Sil">${icon('trash-2')}</button></td></tr>`).join('')||'<tr><td colspan="5">Henüz test eklenmedi.</td></tr>'}</tbody></table></div>`;
  }
  function renderSettings(){
    return `${heading('VERİ YÖNETİMİ','Ayarlar ve yedekler','Çalışma kayıtların Firebase üzerinde tutulur; tarayıcı localStorage kullanılmaz.')}
      <div class="notice">${icon('shield-alert')} <strong>Önemli:</strong> Bu panel kişisel kullanım için tasarlandı. Firebase Realtime Database kurallarını herkese açık bırakırsan başka kişiler kayıtları okuyabilir veya değiştirebilir. Firebase Console üzerinden erişim kurallarını güvenli hale getir.</div>
      <div class="setting-grid"><section class="card setting-card"><h2>${icon('database')} Firebase bağlantısı</h2><p>Proje: <strong>urunrakip</strong><br>Veritabanı yolu: <code>${esc(PATH)}</code><br>Bağlantı: <strong>${connection==='online'?'Bağlı':connection==='error'?'Bağlanamadı':'Bağlanıyor'}</strong></p><p>Diğer <code>lifeOS</code> alanlarına, admin, ödeme ve eski proje kayıtlarına dokunulmaz.</p></section><section class="card setting-card"><h2>${icon('hard-drive-download')} Kayıt yedeği</h2><p>Verilerini JSON dosyası olarak indirebilir veya bu panelde daha önce aldığın yedeği geri yükleyebilirsin.</p><button class="btn" data-act="export">${icon('download')} JSON indir</button><button class="btn" data-act="import">${icon('upload')} JSON yükle</button><input id="importFile" type="file" accept="application/json,.json" class="hidden" /></section><section class="card setting-card"><h2>${icon('list-checks')} Başlangıç kayıtları</h2><p>Önceki çalışma notların başlangıç verisi olarak eklendi. Tarihi kesin bilinmeyen bitişler boş tutuldu. 3. ve 4. ünite başlık ve konularını sen ekleyebilirsin.</p><button class="btn btn-danger" data-act="reset">${icon('rotate-ccw')} İlk verilere dön</button></section><section class="card setting-card"><h2>${icon('circle-help')} Kullanım notu</h2><p>Üniteyi "Tamamlandı" yaparsan bitiş günü otomatik eklenir. Konunun kutusunu işaretleyince tarih kaydedilir. Tarihleri sonradan düzenleyebilir, test sonuçları ekleyebilirsin.</p><p>Vize tarihi: <strong>05.12.2026</strong></p></section></div>`;
  }
  function emptyState(name,details){return `<div class="empty-state">${icon('folder-open')}<strong>${name}</strong><p>${details}</p></div>`;}

  function replaceUnitHistory(cId,uId,date){
    const u=getUnit(cId,uId);const title=`${Number(u.id.slice(1))}. ünite tamamlandı`;
    data.logs=data.logs.filter(l=>!(l.type==='unit'&&l.courseId===cId&&l.title===title));
    if(date)logActivity('unit',cId,title,u.name,date);
  }
  function updateUnitStatus(cId,uId,status){
    const u=getUnit(cId,uId);if(!u)return;
    u.status=status;
    if(status==='done'){
      if(!u.completedAt)u.completedAt=today();
      replaceUnitHistory(cId,uId,u.completedAt);
    } else {u.completedAt=null;replaceUnitHistory(cId,uId,null);}
    persist();notify('Ünite durumu güncellendi.');
  }
  function setUnitDate(cId,uId,date){
    const u=getUnit(cId,uId);if(!u)return;
    u.completedAt=date||null;if(date)u.status='done';
    replaceUnitHistory(cId,uId,date);
    persist();notify('Ünite tarihi kaydedildi.');
  }
  function toggleTopic(cId,uId,tId,checked){
    const u=getUnit(cId,uId),t=u?.topics.find(x=>x.id===tId);if(!t)return;
    t.done=checked;t.completedAt=checked?today():null;
    if(checked){if(u.status==='todo')u.status='doing';logActivity('topic',cId,'Konu tamamlandı',`${u.name}: ${t.name}`,t.completedAt);}
    persist();notify('Konu ilerlemesi kaydedildi.');
  }
  function topicDate(cId,uId,tId,date){
    const t=getUnit(cId,uId)?.topics.find(x=>x.id===tId);if(!t)return;
    t.completedAt=date||null;
    if(date){t.done=true;logActivity('topic',cId,'Konu tamamlandı',t.name,date);}
    persist();notify('Konu bitiş tarihi güncellendi.');
  }

  function modal(title,body,onSubmit){
    $('#modalTitle').textContent=title;
    $('#modalForm').innerHTML=body;
    $('#modalBackdrop').classList.remove('hidden');
    $('#modalForm').onsubmit=e=>{e.preventDefault();onSubmit(new FormData(e.target));};
    refreshIcons();
    $('#modalForm input:not([type=hidden]),#modalForm select')?.focus();
  }
  function closeModal(){$('#modalBackdrop').classList.add('hidden');$('#modalForm').onsubmit=null;}
  const fld=(label,name,value='',type='text',extra='')=>`<div class="field"><label for="field-${name}">${esc(label)}</label><input class="input" id="field-${name}" name="${name}" type="${type}" value="${esc(value)}" ${extra}/></div>`;
  const modalButtons=`<div class="form-footer"><button type="button" class="btn btn-ghost" data-act="close-modal">Vazgeç</button><button type="submit" class="btn btn-primary">${icon('check')} Kaydet</button></div>`;
  function editTopic(cId,uId,tId=null){
    const u=getUnit(cId,uId);const t=u?.topics.find(x=>x.id===tId);
    modal(t?'Konuyu düzenle':'Yeni konu ekle',fld('Konu başlığı','topicName',t?.name||'','text','required maxlength="180"')+modalButtons,f=>{
      const name=String(f.get('topicName')||'').trim();if(!name)return;
      if(t)t.name=name;else u.topics.push(topic(newId(),name));
      closeModal();persist();notify(t?'Konu düzenlendi.':'Yeni konu eklendi.');
    });
  }
  function editUnit(cId,uId){
    const u=getUnit(cId,uId);
    modal('Ünite başlığını değiştir',fld('Ünite adı','unitName',u.name,'text','required maxlength="180"')+modalButtons,f=>{const name=String(f.get('unitName')||'').trim();if(!name)return;u.name=name;closeModal();persist();notify('Ünite adı güncellendi.');});
  }
  function unitOptions(cId,selected){const c=getCourse(cId);return `<option value="all" ${selected==='all'?'selected':''}>Genel / Tüm üniteler</option><option value="multi" ${selected==='multi'?'selected':''}>1–2. ünite birlikte</option>${c.units.map(u=>`<option value="${u.id}" ${selected===u.id?'selected':''}>${Number(u.id.slice(1))}. ünite</option>`).join('')}`;}
  function editTest(id=null){
    const t=id?data.tests.find(x=>x.id===id):null;
    const selectedCourse=t?.courseId||data.courses[0].id;
    modal(t?'Denemeyi düzenle':'Yeni deneme ekle',`<div class="field"><label for="field-course">Ders</label><select class="select" name="course" id="field-course">${data.courses.map(c=>`<option value="${c.id}" ${c.id===selectedCourse?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div><div class="field"><label for="field-testUnit">Ünite</label><select class="select" name="testUnit" id="field-testUnit">${unitOptions(selectedCourse,t?.unitId||'all')}</select></div><div class="form-cols">${fld('Doğru sayısı','correct',t?.correct??'','number','required min="0" step="1"')}${fld('Toplam soru','total',t?.total??20,'number','required min="1" step="1"')}</div>${fld('Tarih (isteğe bağlı)','date',t?.date||today(),'date')}${fld('Not (isteğe bağlı)','note',t?.note||'','text','maxlength="300"')}${modalButtons}`,f=>{
      const correct=Number(f.get('correct')),total=Number(f.get('total'));
      if(!Number.isInteger(correct)||!Number.isInteger(total)||total<1||correct<0||correct>total){notify('Doğru sayısı 0 ile toplam soru arasında olmalı.');return;}
      const obj={id:t?.id||newId(),courseId:String(f.get('course')),unitId:String(f.get('testUnit')),correct,total,date:String(f.get('date')||''),note:String(f.get('note')||'').trim()};
      if(t)Object.assign(t,obj);else data.tests.push(obj);
      closeModal();persist();notify('Deneme sonucu kaydedildi.');
    });
    $('#field-course').addEventListener('change',e=>{$('#field-testUnit').innerHTML=unitOptions(e.target.value,'all');});
  }
  function downloadJSON(){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`aof-ilerleme-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('JSON yedeği indirildi.');}
  async function importJSON(file){
    try{const json=JSON.parse(await file.text());if(!json?.courses||!Array.isArray(json.courses)||!Array.isArray(json.tests)){throw Error('Uygun AÖF veri formatı bulunamadı.');}
      if(!confirm('İçe aktarılan JSON mevcut panel kayıtlarının yerini alacak. Devam edilsin mi?'))return;
      data=normalize(json);persist();notify('JSON kayıtları yüklendi.');
    }catch(e){notify('Dosya okunamadı: '+e.message);}
  }

  document.addEventListener('click',e=>{
    const target=e.target.closest('[data-act]');if(!target)return;
    const {act,course:c,unit:u,topic:t,id}=target.dataset;
    if(act==='go-courses'){courseFilter='all';switchView('dersler');}
    if(act==='go-history')switchView('kayitlar');
    if(act==='show-course'){courseFilter=c;switchView('dersler');}
    if(act==='filter-course'){courseFilter=c;render();}
    if(act==='filter-history'){logFilter=c;render();}
    if(act==='filter-tests'){testFilter=c;render();}
    if(act==='toggle-unit'){const key=`${c}:${u}`;openUnits.has(key)?openUnits.delete(key):openUnits.add(key);render();}
    if(act==='add-topic')editTopic(c,u);
    if(act==='edit-topic')editTopic(c,u,t);
    if(act==='edit-unit')editUnit(c,u);
    if(act==='delete-topic'&&confirm('Bu konu silinsin mi?')){const unit=getUnit(c,u);unit.topics=unit.topics.filter(x=>x.id!==t);persist();notify('Konu silindi.');}
    if(act==='add-test')editTest();
    if(act==='edit-test')editTest(id);
    if(act==='delete-test'&&confirm('Bu test sonucu silinsin mi?')){data.tests=data.tests.filter(x=>x.id!==id);persist();notify('Test sonucu silindi.');}
    if(act==='delete-log'&&confirm('Bu geçmiş kaydı silinsin mi?')){data.logs=data.logs.filter(x=>x.id!==id);persist();notify('Geçmiş kaydı silindi.');}
    if(act==='close-modal')closeModal();
    if(act==='export')downloadJSON();
    if(act==='import')$('#importFile').click();
    if(act==='reset'&&confirm('Tüm değiştirdiğin kayıtlar silinip başlangıç verileri geri yüklensin mi?')){data=structuredClone(INITIAL_DATA);persist();notify('Başlangıç verileri geri yüklendi.');}
  });
  document.addEventListener('change',e=>{
    const el=e.target;const {change,c:unused,course,unit,topic:topicId}=el.dataset;
    if(change==='unit-status')updateUnitStatus(course,unit,el.value);
    if(change==='unit-date')setUnitDate(course,unit,el.value);
    if(change==='topic-check')toggleTopic(course,unit,topicId,el.checked);
    if(change==='topic-date')topicDate(course,unit,topicId,el.value);
    if(el.id==='importFile'&&el.files[0]){importJSON(el.files[0]);el.value='';}
  });
  document.querySelectorAll('[data-view]').forEach(btn=>btn.addEventListener('click',()=>switchView(btn.dataset.view)));
  $('#addTestTop').addEventListener('click',()=>editTest());
  $('#closeModal').addEventListener('click',closeModal);
  $('#modalBackdrop').addEventListener('click',e=>{if(e.target.id==='modalBackdrop')closeModal();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});

  render();connect();
})();
