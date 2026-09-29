(()=>{
  const P=window.RiftyProgress,byId=id=>document.getElementById(id);
  function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}}
  let profile=read('accord-profile',{});if(!profile||typeof profile!=='object'||Array.isArray(profile))profile={};
  profile.nickname=typeof profile.nickname==='string'?profile.nickname.slice(0,30):'';profile.level=['0','1','2'].includes(profile.level)?profile.level:'0';
  let ledger=P.clean(read('accord-missions',{})),day=P.dayKey();
  const editor=byId('profile-editor');let draft=null,editingUser=null,saving=false,processing=0;const versions={photo:0,banner:0};
  function save(key,value){try{localStorage.setItem(key,JSON.stringify(value));localStorage.setItem('rifty-local-updated',String(Date.now()));byId('profile-save-status').textContent='Modifications enregistrées';document.dispatchEvent(new Event('rifty:data-change'));return true}catch{byId('profile-save-status').textContent='Stockage plein ou indisponible : modification non enregistrée.';return false}}
  function imageSource(value){return typeof value==='string'&&/^data:image\/(jpeg|png|webp);base64,/.test(value)}
  function drawIdentity(){
    byId('profile-display-name').textContent=profile.nickname?.trim()||'Guitariste';
    for(const [key,id]of [['photo','profile-photo'],['banner','profile-banner']]){const img=byId(id),valid=imageSource(profile[key]);img.hidden=!valid;if(valid)img.src=profile[key];else img.removeAttribute('src')}
    byId('photo-placeholder').hidden=imageSource(profile.photo);document.querySelector('.cover-default').hidden=imageSource(profile.banner);
    const auth=window.RiftyAuth,claimed=!!auth?.session&&!!auth.nickname;
    byId('nickname-onboarding').hidden=claimed;
    byId('nickname-onboarding-copy').textContent=auth?.session?'Choisissez un pseudo qui n’appartiendra qu’à vous.':'Connectez-vous pour réserver votre pseudo unique.';
    byId('choose-nickname').textContent=auth?.session?'Choisir mon pseudo':'Me connecter';
  }
  function editorMessage(text,error=false){const el=byId('profile-editor-status');el.textContent=text;el.dataset.type=error?'error':'success'}
  function drawEditor(){
    if(!draft)return;byId('profile-nickname').value=draft.nickname||'';byId('profile-level').value=draft.level||'0';
    for(const key of ['photo','banner']){const img=byId('editor-'+key);img.hidden=!imageSource(draft[key]);if(!img.hidden)img.src=draft[key];else img.removeAttribute('src');byId('remove-'+key).disabled=!imageSource(draft[key])}
    byId('editor-photo-placeholder').hidden=imageSource(draft.photo);
  }
  function openEditor(){draft={...profile};editingUser=window.RiftyAuth?.session?.user.id||null;editorMessage('');byId('profile-nickname').removeAttribute('aria-invalid');drawEditor();if(!editor.open)editor.showModal()}
  function closeEditor(){if(!saving)editor.close()}
  editor.addEventListener('cancel',e=>{if(saving)e.preventDefault()});
  editor.addEventListener('close',()=>{draft=null;versions.photo++;versions.banner++});
  editor.onclick=e=>{if(e.target===editor)closeEditor()};byId('profile-editor-close').onclick=closeEditor;byId('profile-edit').onclick=openEditor;
  byId('choose-nickname').onclick=()=>window.RiftyAuth?.session?openEditor():window.RiftyAuth?.open();
  byId('profile-editor-form').onsubmit=async e=>{
    e.preventDefault();if(!draft||saving)return;if(processing)return editorMessage('L’image est encore en cours de préparation.',true);
    const auth=window.RiftyAuth,userId=auth?.session?.user.id||null,nickname=(draft.nickname||'').trim();
    if(userId!==editingUser)return editorMessage('Le compte a changé. Fermez puis rouvrez les réglages.',true);
    if(nickname&&!/^[A-Za-z0-9_]{3,24}$/.test(nickname)){byId('profile-nickname').setAttribute('aria-invalid','true');return editorMessage('Utilisez 3 à 24 lettres, chiffres ou _.',true)}
    if(!nickname&&auth?.nickname)return editorMessage('Choisissez un pseudo pour votre compte.',true);
    if(nickname&&!userId)return editorMessage('Connectez-vous pour réserver ce pseudo. Vos images peuvent être enregistrées sans pseudo.',true);
    if(userId&&!auth.ready)return editorMessage('Votre profil se synchronise encore. Réessayez dans un instant.',true);
    saving=true;byId('profile-editor-save').disabled=true;editorMessage('Enregistrement…');
    try{
      if(userId&&nickname){const {error}=await auth.client.from('rifty_handles').upsert({user_id:userId,nickname},{onConflict:'user_id'});if(error){if(error.code==='23505'){byId('profile-nickname').setAttribute('aria-invalid','true');return editorMessage('Ce pseudo est déjà pris. Choisissez-en un autre.',true)}throw error}}
      if((window.RiftyAuth?.session?.user.id||null)!==userId)return;
      const next={...draft,nickname};if(!save('accord-profile',next))return editorMessage('Stockage local plein : le profil n’a pas pu être enregistré.',true);
      profile=next;if(userId&&nickname)document.dispatchEvent(new CustomEvent('rifty:nickname-saved',{detail:{nickname,userId}}));drawIdentity();drawProgress();editor.close();showToast('Profil enregistré');
    }catch{editorMessage('Connexion interrompue. Votre profil n’a pas été modifié ; réessayez.',true)}
    finally{saving=false;byId('profile-editor-save').disabled=false}
  };
  document.addEventListener('rifty:profile-ready',drawIdentity);
  document.addEventListener('rifty:auth-change',()=>{if(editor.open&&(window.RiftyAuth?.session?.user.id||null)!==editingUser){editor.close();saving=false}drawIdentity()});
  function drawProgress(){day=P.dayKey();const s=P.stats(ledger,day),followed=(()=>{const f=read('accord-favorites',[]);return Array.isArray(f)?f.filter(id=>creators.some(c=>c.id===id)).length:0})();
    byId('total-xp').textContent=s.total;byId('xp-rank').textContent=`Rang ${s.rank}`;byId('next-rank').textContent=`${200-s.rankXP} XP avant le rang ${s.rank+1}`;byId('xp-progress').value=s.rankXP;byId('xp-progress').setAttribute('aria-valuetext',`${s.rankXP} sur 200 XP`);byId('daily-progress').value=s.today;byId('daily-xp').textContent=`${s.today} / 100 XP`;byId('daily-count').textContent=`${s.completed} / 3`;byId('mission-date').textContent=new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});byId('stat-followed').textContent=followed;byId('stat-level').textContent=['Débutant','Intermédiaire','Avancé'][+profile.level];byId('stat-days').textContent=s.practiceDays;byId('current-streak').textContent=s.streak;byId('current-streak').nextElementSibling.textContent=`jour${s.streak>1?'s':''}`;byId('longest-streak').textContent=`${s.longestStreak} jour${s.longestStreak>1?'s':''}`;byId('streak-today').textContent=s.practicedToday?'Validé':'À faire';byId('streak-today').classList.toggle('done',s.practicedToday);byId('streak-message').textContent=s.practicedToday?(s.streak>1?`${s.streak} jours d’affilée. Continuez demain pour garder la flamme.`:'Jour 1 validé. À demain pour la suite.'):(s.streak?`Une session aujourd’hui prolongera votre série de ${s.streak} jour${s.streak>1?'s':''}.`:'Jouez aujourd’hui : ce sera le jour 1.');
    byId('missions-list').innerHTML=P.missions.map(m=>`<label class="mission-row ${(ledger[day]||[]).includes(m.id)?'done':''}"><input type="checkbox" data-mission="${m.id}" ${(ledger[day]||[]).includes(m.id)?'checked':''}><span class="mission-symbol">${uiIcon(m.icon)}</span><span class="mission-text"><strong>${m.title}</strong><small>${m.detail}</small></span><span class="mission-reward">+${m.xp} XP</span></label>`).join('');
    const badges=[{name:'Premier déclic',detail:'Terminer une mission',unlocked:s.total>0,icon:'zap'},{name:'Curieux',detail:'Suivre au moins 3 créateurs',unlocked:followed>=3,icon:'search'},{name:'Dans le rythme',detail:'Pratiquer 3 jours différents',unlocked:s.practiceDays>=3,icon:'music2'},{name:'En feu',detail:'Atteindre une série de 7 jours',unlocked:s.longestStreak>=7,icon:'flame'},{name:'Régulier',detail:'Cumuler 500 XP',unlocked:s.total>=500,icon:'award'}];
    byId('stat-badges').textContent=badges.filter(b=>b.unlocked).length;byId('profile-badges').innerHTML=badges.map(b=>`<div class="achievement ${b.unlocked?'unlocked':''}"><span>${uiIcon(b.icon)}</span><div><strong>${b.name}</strong><small>${b.unlocked?'Obtenu · ':''}${b.detail}</small></div>${b.unlocked?uiIcon('check'):''}</div>`).join('');
  }
  byId('profile-nickname').addEventListener('input',e=>{if(draft)draft.nickname=e.target.value;e.target.removeAttribute('aria-invalid');editorMessage('')});
  byId('profile-level').addEventListener('change',e=>{if(draft)draft.level=e.target.value});
  byId('missions-list').addEventListener('change',e=>{const id=e.target.dataset.mission;if(!id)return;const next=P.toggle(ledger,P.dayKey(),id,e.target.checked);if(save('accord-missions',next))ledger=next;drawProgress();});
  let reminder=read('rifty-reminder',{enabled:false,time:'18:00',days:[1,2,3,4,5,6,0]});if(!reminder||typeof reminder!=='object')reminder={};reminder.enabled=!!reminder.enabled;reminder.time=/^([01]\d|2[0-3]):[0-5]\d$/.test(reminder.time||'')?reminder.time:'18:00';reminder.days=Array.isArray(reminder.days)?[...new Set(reminder.days.filter(day=>Number.isInteger(day)&&day>=0&&day<=6))]:[1,2,3,4,5,6,0];
  function saveReminder(){localStorage.setItem('rifty-reminder',JSON.stringify(reminder));drawReminder()}
  function drawReminder(){byId('reminder-enabled').checked=reminder.enabled;byId('reminder-time').value=reminder.time;byId('reminder-settings').classList.toggle('disabled',!reminder.enabled);document.querySelectorAll('[data-day]').forEach(button=>button.classList.toggle('active',reminder.days.includes(+button.dataset.day)));const permission='Notification'in window?Notification.permission:'unsupported';byId('enable-notifications').hidden=permission==='granted'||permission==='unsupported';byId('reminder-status').textContent=permission==='granted'?'Notification navigateur autorisée.':permission==='denied'?'Notifications bloquées dans le navigateur.':'Le rappel apparaît lorsque Rifty est ouvert.'}
  byId('reminder-enabled').onchange=e=>{reminder.enabled=e.target.checked;saveReminder()};byId('reminder-time').onchange=e=>{reminder.time=e.target.value;saveReminder()};byId('reminder-days').onclick=e=>{const button=e.target.closest('[data-day]');if(!button)return;const day=+button.dataset.day,set=new Set(reminder.days);set.has(day)?set.delete(day):set.add(day);reminder.days=[...set];saveReminder()};
  byId('enable-notifications').onclick=async()=>{if(!('Notification'in window)){byId('reminder-status').textContent='Notifications non disponibles dans ce navigateur.';return}if(!isSecureContext){byId('reminder-status').textContent='Les notifications nécessitent le site HTTPS publié.';return}const permission=await Notification.requestPermission();drawReminder();if(permission==='granted')new Notification('Rifty est prêt',{body:'Vos rappels d’entraînement sont activés.',icon:'assets/logo-custom.png'})};
  function checkReminder(){if(!reminder.enabled||!reminder.days.includes(new Date().getDay()))return;const now=new Date(),time=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,key=`rifty-reminded-${P.dayKey()}-${reminder.time}`;if(time!==reminder.time||localStorage.getItem(key))return;localStorage.setItem(key,'1');if(typeof showToast==='function')showToast('🔥 C’est l’heure de sortir la guitare.');if('Notification'in window&&Notification.permission==='granted')new Notification('Votre série Rifty vous attend 🔥',{body:'Votre rappel est là. Même un seul riff compte aujourd’hui.',icon:'assets/logo-custom.png'})}
  setInterval(checkReminder,30000);
  async function upload(key,file){
    const version=++versions[key];if(!file||!draft)return;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>8*1024*1024)return editorMessage('Choisissez un PNG, JPEG ou WebP de moins de 8 Mo.',true);
    processing++;editorMessage('Préparation de votre image…');const url=URL.createObjectURL(file);
    try{const img=new Image();img.src=url;await img.decode();const maxW=key==='photo'?320:1400,maxH=key==='photo'?320:500,ratio=Math.min(1,maxW/img.width,maxH/img.height);const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*ratio));canvas.height=Math.max(1,Math.round(img.height*ratio));const c=canvas.getContext('2d');c.fillStyle='#ffffff';c.fillRect(0,0,canvas.width,canvas.height);c.drawImage(img,0,0,canvas.width,canvas.height);if(versions[key]!==version||!draft)return;draft[key]=canvas.toDataURL('image/jpeg',.85);drawEditor();editorMessage('Image prête. Enregistrez pour appliquer vos changements.')}
    catch{editorMessage('Cette image ne peut pas être lue. Essayez un autre fichier.',true)}finally{processing--;URL.revokeObjectURL(url)}
  }
  for(const key of ['photo','banner']){byId(key+'-upload').addEventListener('change',e=>{upload(key,e.target.files[0]);e.target.value=''});byId('remove-'+key).onclick=()=>{if(!draft)return;versions[key]++;delete draft[key];drawEditor()}}
  document.addEventListener('accord:favorites',drawProgress);document.addEventListener('accord:tab',drawProgress);
  setInterval(()=>{if(day!==P.dayKey())drawProgress()},30000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)drawProgress()});
  window.addEventListener('storage',e=>{if(e.key==='accord-missions'){ledger=P.clean(read('accord-missions',{}));drawProgress()}if(e.key==='accord-favorites')drawProgress()});
  document.addEventListener('rifty:cloud-loaded',()=>{profile=read('accord-profile',{});if(!profile||typeof profile!=='object'||Array.isArray(profile))profile={};profile.nickname=typeof profile.nickname==='string'?profile.nickname.slice(0,30):'';profile.level=['0','1','2'].includes(profile.level)?profile.level:'0';ledger=P.clean(read('accord-missions',{}));drawIdentity();drawProgress()});
  const riftyAppModal=byId('rifty-app-modal');
  document.querySelectorAll('[data-open-rifty-app]').forEach(button=>button.onclick=()=>riftyAppModal.showModal());
  document.querySelector('.rifty-app-close').onclick=()=>riftyAppModal.close();
  riftyAppModal.addEventListener('click',e=>{if(e.target===riftyAppModal)riftyAppModal.close()});
  document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=uiIcon(el.dataset.icon));
  const set=(selector,html)=>{const el=document.querySelector(selector);if(el)el.innerHTML=html};
  set('[data-value="youtube"]',brandIcon('youtube')+'YouTube');set('[data-value="tiktok"]',brandIcon('tiktok')+'TikTok');set('.sun',uiIcon('sun'));set('.moon',uiIcon('moon'));set('.suggest',uiIcon('plus')+'<span>Suggérer un créateur</span>');set('#surprise',uiIcon('shuffle')+'Surprenez-moi');set('.hero .eyebrow',uiIcon('zap')+'GUITARE ÉLECTRIQUE');set('[data-view="tools"] .eyebrow',uiIcon('wrench')+'BOÎTE À OUTILS');set('[data-view="training"] .eyebrow',uiIcon('book-open')+'FORMATIONS GRATUITES');set('.note-symbol',uiIcon('music2'));set('#favorites-empty>span',uiIcon('heart'));set('.empty-icon',uiIcon('search'));set('.sheet-icon',uiIcon('plus'));set('#sheet .close',uiIcon('x'));set('#clear',uiIcon('x'));
  document.querySelectorAll('.tool-icon').forEach((el,i)=>el.innerHTML=uiIcon(i?'audio-lines':'music2'));
  drawIdentity();drawProgress();drawReminder();checkReminder();
})();
