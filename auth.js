(()=>{
  const byId=id=>document.getElementById(id),cfg=window.RiftyAuthConfig||{};
  const dialog=byId('auth-dialog'),guest=byId('auth-guest'),userPanel=byId('auth-user'),recovery=byId('auth-recovery'),status=byId('auth-status');
  const configured=typeof cfg.url==='string'&&/^https:\/\//.test(cfg.url)&&!cfg.url.includes('YOUR_')&&typeof cfg.publishableKey==='string'&&cfg.publishableKey.startsWith('sb_publishable_');
  const client=configured&&window.supabase?window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'implicit'}}):null;
  const parse=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
  const object=value=>value&&typeof value==='object'&&!Array.isArray(value);
  let mode='signin',session=null,syncTimer=null,syncing=false,ready=false,recovering=false,busy=false,epoch=0,dirty=false,changeVersion=0,confirmationEmail='',nickname=null;
  const google=byId('google-auth');google.hidden=!cfg.googleEnabled;byId('auth-divider').hidden=!cfg.googleEnabled;byId('auth-email-notice').hidden=!!cfg.emailDeliveryReady;

  function message(text,type=''){status.textContent=text;status.dataset.type=type}
  function errorText(error){
    const codes={invalid_credentials:'Adresse e-mail ou mot de passe incorrect.',email_not_confirmed:'Confirmez votre adresse e-mail avant de vous connecter.',user_already_exists:'Un compte existe déjà avec cette adresse. Essayez de vous connecter.',weak_password:'Choisissez un mot de passe plus long et difficile à deviner.',same_password:'Choisissez un mot de passe différent de l’ancien.',over_email_send_rate_limit:'Trop d’e-mails demandés. Patientez quelques minutes avant de réessayer.',over_request_rate_limit:'Trop de tentatives. Patientez avant de réessayer.',email_address_invalid:'Vérifiez votre adresse e-mail.',email_address_not_authorized:'L’envoi des e-mails Rifty est encore en configuration. Réessayez une fois le service activé.',otp_expired:'Ce lien a expiré ou a déjà été utilisé. Demandez un nouvel e-mail.',signup_disabled:'Les inscriptions sont temporairement fermées.',email_provider_disabled:'La connexion par e-mail est temporairement indisponible.'};
    if(codes[error?.code])return codes[error.code];
    if(/fetch|network|offline/i.test(error?.message||''))return 'Connexion interrompue. Vérifiez votre réseau et réessayez.';
    return 'Impossible de terminer cette action. Réessayez dans un instant.';
  }
  function ensureClient(){
    if(location.protocol==='file:'){message('Pour utiliser votre compte, ouvrez Rifty en ligne : https://13nawaa.github.io/Rifty/','error');return false}
    if(!client){message('Le service de connexion n’a pas pu charger. Actualisez la page.','error');return false}return true;
  }
  function showDialog(){if(!dialog.open)dialog.showModal()}
  function redirectUrl(){return cfg.redirectUrl}
  function payload(){return {profile:parse('accord-profile',{}),favorites:parse('accord-favorites',[]),missions:parse('accord-missions',{})}}
  function clean(value){value=object(value)?value:{};return {profile:object(value.profile)?value.profile:{},favorites:Array.isArray(value.favorites)?value.favorites.filter(x=>typeof x==='string'):[],missions:object(value.missions)?value.missions:{}}}
  function applyLocal(value){
    value=clean(value);window.RiftyCloudApplying=true;
    try{for(const key of ['profile','favorites','missions'])localStorage.setItem('accord-'+key,JSON.stringify(value[key]));document.dispatchEvent(new CustomEvent('rifty:cloud-loaded'))}
    finally{window.RiftyCloudApplying=false}
  }
  // Keep account caches separate: switching accounts must never merge private data.
  function stash(){const owner=localStorage.getItem('rifty-data-owner');if(owner)localStorage.setItem('rifty-cache-'+owner,JSON.stringify({payload:payload(),dirty}))}
  function clearPrivateNotes(){for(let i=localStorage.length-1;i>=0;i--){const key=localStorage.key(i);if(key?.startsWith('accord-note-'))localStorage.removeItem(key)}}
  function selectAccount(id){
    const previous=localStorage.getItem('rifty-data-owner');
    if(previous===id){dirty=!!parse('rifty-cache-'+id,null)?.dirty;return;}
    stash();const cached=parse('rifty-cache-'+id,null);
    if(cached){applyLocal(cached.payload);dirty=!!cached.dirty}
    else if(previous){applyLocal({});dirty=false}
    else dirty=false;
    clearPrivateNotes();localStorage.setItem('rifty-data-owner',id);
  }
  function leaveAccount(){const owner=localStorage.getItem('rifty-data-owner');if(dirty)stash();else if(owner)localStorage.removeItem('rifty-cache-'+owner);applyLocal({});localStorage.removeItem('rifty-data-owner');localStorage.removeItem('rifty-local-updated');clearPrivateNotes();dirty=false}
  function updateSyncBadge(connected){
    const badge=byId('profile-sync-badge');if(badge)badge.innerHTML=uiIcon(connected?'check':'cloud')+(connected?' Synchronisé avec Rifty':' Sur cet appareil');
    byId('auth-sync-title').textContent=connected?'Progression synchronisée':'Synchronisation en attente';
  }
  function accountName(account){const profile=parse('accord-profile',{});return (typeof profile.nickname==='string'&&profile.nickname.trim())||account.user_metadata?.full_name||account.user_metadata?.name||account.email?.split('@')[0]||'Guitariste'}
  function drawSession(){
    const account=session?.user;guest.hidden=!!account||recovering;userPanel.hidden=!account||recovering;recovery.hidden=!recovering;
    byId('account-label').textContent=account?accountName(account):'Se connecter';byId('account-button').classList.toggle('signed-in',!!account);
    if(account){byId('auth-user-name').textContent=accountName(account);byId('auth-user-email').textContent=account.email||'Compte Rifty';byId('auth-avatar').innerHTML=uiIcon('user-round')}
  }
  async function pushCloud(){
    if(!client||!session||!ready)return false;
    if(syncing){dirty=true;return false}
    const userId=session.user.id,version=epoch,localVersion=changeVersion;let succeeded=false;syncing=true;
    try{
      const {error}=await client.from('rifty_user_data').upsert({user_id:userId,payload:payload(),updated_at:new Date().toISOString()},{onConflict:'user_id'});
      if(version!==epoch)return false;
      if(error)throw error;
      succeeded=true;dirty=changeVersion!==localVersion;stash();updateSyncBadge(!dirty);return true;
    }catch(error){if(version===epoch){dirty=true;updateSyncBadge(false);message('Votre progression reste sur cet appareil. La synchronisation reprendra au retour du réseau.','error')}return false}
    finally{if(version===epoch){syncing=false;if(succeeded&&dirty&&navigator.onLine)clearTimeout(syncTimer),syncTimer=setTimeout(()=>{if(ready)pushCloud()},5000)}}
  }
  function queuePush(){
    if(!session||window.RiftyCloudApplying)return;dirty=true;changeVersion++;updateSyncBadge(false);byId('account-label').textContent=accountName(session.user);stash();
    clearTimeout(syncTimer);if(ready)syncTimer=setTimeout(pushCloud,700);
  }
  async function pullCloud(version){
    if(!client||!session||version!==epoch)return;const userId=session.user.id,localVersion=changeVersion;
    try{
      const {data,error}=await client.from('rifty_user_data').select('payload,updated_at').eq('user_id',userId).maybeSingle();
      const handle=await client.from('rifty_handles').select('nickname').eq('user_id',userId).maybeSingle();
      if(version!==epoch)return;if(error)throw error;if(handle.error)throw handle.error;nickname=handle.data?.nickname||null;
      // An existing cloud profile wins unless this account has unsent local edits.
      if(data&&!dirty&&changeVersion===localVersion)applyLocal(data.payload);
      const local=payload();local.profile={...local.profile,nickname:nickname||''};applyLocal(local);
      ready=true;drawSession();document.dispatchEvent(new Event('rifty:profile-ready'));
      if(!data||dirty)await pushCloud();else{stash();updateSyncBadge(true)}
    }catch(error){if(version===epoch){ready=false;updateSyncBadge(false);message('Compte connecté. Synchronisation indisponible pour le moment. Vos données locales sont conservées.','error')}}
  }
  function setMode(next){mode=next;document.querySelectorAll('[data-auth-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.authMode===mode);b.setAttribute('aria-selected',String(b.dataset.authMode===mode))});byId('auth-submit').textContent=mode==='signup'?'Créer mon compte':'Se connecter';const password=byId('auth-password');password.autocomplete=mode==='signup'?'new-password':'current-password';password.minLength=mode==='signup'?8:1;byId('forgot-password').hidden=mode==='signup';message('')}
  function openDialog(){drawSession();showDialog();if(!client)message('Le service de connexion est indisponible. Actualisez la page.','error');else if(location.protocol==='file:')ensureClient()}
  async function runAction(action){
    if(busy||!ensureClient())return;busy=true;
    const controls=Array.from(dialog.querySelectorAll('button:not(.auth-close)'));controls.forEach(b=>b.disabled=true);dialog.setAttribute('aria-busy','true');
    try{await action()}catch(error){message(errorText(error),'error')}finally{busy=false;controls.forEach(b=>b.disabled=false);dialog.removeAttribute('aria-busy')}
  }
  function emailValue(){const input=byId('auth-email');if(!input.reportValidity())return null;return input.value.trim()}
  byId('account-button').onclick=openDialog;document.querySelector('.auth-close').onclick=()=>dialog.close();dialog.onclick=e=>{if(e.target===dialog)dialog.close()};
  document.querySelectorAll('[data-auth-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.authMode));
  google.onclick=()=>runAction(async()=>{if(!cfg.googleEnabled)return;const {error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:redirectUrl()}});if(error)throw error});
  byId('auth-form').onsubmit=e=>{e.preventDefault();runAction(async()=>{
    const email=emailValue(),password=byId('auth-password').value;if(!email)return;
    message(mode==='signup'?'Création du compte…':'Connexion…');
    const result=mode==='signup'?await client.auth.signUp({email,password,options:{emailRedirectTo:redirectUrl()}}):await client.auth.signInWithPassword({email,password});
    if(result.error){if(result.error.code==='email_not_confirmed'){confirmationEmail=email;byId('resend-confirmation').hidden=false}throw result.error}
    byId('auth-password').value='';
    if(mode==='signup'&&!result.data.session){confirmationEmail=email;byId('resend-confirmation').hidden=false;message('Consultez votre boîte mail pour confirmer votre adresse. Si elle est déjà utilisée, connectez-vous ou réinitialisez votre mot de passe.','success')}
    else{byId('resend-confirmation').hidden=true;message('Vous êtes connecté.','success')}
  })};
  byId('forgot-password').onclick=()=>runAction(async()=>{const email=emailValue();if(!email)return;message('Envoi de la demande…');const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:redirectUrl()});if(error)throw error;message('Si un compte correspond à cette adresse, vous recevrez un lien pour choisir un nouveau mot de passe.','success')});
  byId('resend-confirmation').onclick=()=>runAction(async()=>{const email=emailValue()||confirmationEmail;if(!email)return;const {error}=await client.auth.resend({type:'signup',email,options:{emailRedirectTo:redirectUrl()}});if(error)throw error;message('Un nouveau lien a été demandé. Pensez à vérifier vos courriers indésirables.','success')});
  recovery.onsubmit=e=>{e.preventDefault();runAction(async()=>{const {error}=await client.auth.updateUser({password:byId('auth-new-password').value});if(error)throw error;byId('auth-new-password').value='';recovering=false;drawSession();message('Mot de passe mis à jour.','success')})};
  byId('auth-signout').onclick=()=>runAction(async()=>{clearTimeout(syncTimer);if(dirty)await pushCloud();const {error}=await client.auth.signOut({scope:'local'});if(error)throw error;message('Vous êtes déconnecté.','success')});
  document.addEventListener('rifty:data-change',queuePush);document.addEventListener('accord:favorites',queuePush);
  window.addEventListener('online',()=>{if(session){if(ready)queuePush();else pullCloud(epoch)}});
  window.RiftyAuth={configured:!!client,client,get session(){return session},get ready(){return ready},get nickname(){return nickname},open:openDialog};
  document.addEventListener('rifty:nickname-saved',e=>{if(e.detail.userId===session?.user.id){nickname=e.detail.nickname;drawSession();document.dispatchEvent(new Event('rifty:profile-ready'))}});
  document.querySelectorAll('[data-open-account]').forEach(b=>b.onclick=openDialog);
  setMode('signin');
  if(client){
    client.auth.onAuthStateChange((event,next)=>{
      const changed=session?.user.id!==next?.user.id;
      if(changed||event==='INITIAL_SESSION'){
        epoch++;clearTimeout(syncTimer);ready=false;syncing=false;nickname=null;
        if(next)selectAccount(next.user.id);else if(localStorage.getItem('rifty-data-owner'))leaveAccount();
      }
      session=next||null;
      if(event==='PASSWORD_RECOVERY')recovering=true;
      if(!next)recovering=false;
      drawSession();if(!ready)updateSyncBadge(false);
      document.dispatchEvent(new CustomEvent('rifty:auth-change',{detail:{session}}));
      if(recovering){showDialog();message('Choisissez votre nouveau mot de passe.')}
      if(next&&(changed||event==='INITIAL_SESSION')){const version=epoch;setTimeout(()=>pullCloud(version),0)}
    });
    const params=new URLSearchParams(location.hash.slice(1));
    if(params.has('error')){showDialog();message('Ce lien n’est plus valide. Demandez un nouvel e-mail de confirmation ou de récupération.','error');history.replaceState(null,'',location.pathname+location.search)}
  }else drawSession();
})();
