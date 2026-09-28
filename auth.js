(()=>{
  const byId=id=>document.getElementById(id),cfg=window.RiftyAuthConfig||{};
  const dialog=byId('auth-dialog'),guest=byId('auth-guest'),userPanel=byId('auth-user'),recovery=byId('auth-recovery'),status=byId('auth-status');
  const configured=typeof cfg.url==='string'&&/^https?:\/\//.test(cfg.url)&&!cfg.url.includes('YOUR_')&&typeof cfg.publishableKey==='string'&&cfg.publishableKey.length>20&&!cfg.publishableKey.includes('YOUR_');
  const client=configured&&window.supabase?window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
  const parse=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
  let mode='signin',session=null,syncTimer=null,syncing=false;

  function message(text,type=''){status.textContent=text;status.dataset.type=type}
  function redirectUrl(){return cfg.redirectUrl||location.href.split('#')[0].split('?')[0]}
  function localPayload(){return {profile:parse('accord-profile',{}),favorites:parse('accord-favorites',[]),missions:parse('accord-missions',{}),localUpdated:Number(localStorage.getItem('rifty-local-updated')||0)}}
  function validObject(value){return value&&typeof value==='object'&&!Array.isArray(value)}
  function mergedPayload(remote,updatedAt){
    const local=localPayload(),cloud=validObject(remote)?remote:{},cloudTime=Date.parse(updatedAt||0)||0;
    const localProfile=validObject(local.profile)?local.profile:{},cloudProfile=validObject(cloud.profile)?cloud.profile:{};
    const profile=local.localUpdated>cloudTime?localProfile:(Object.keys(cloudProfile).length?cloudProfile:localProfile);
    const favorites=[...new Set([...(Array.isArray(cloud.favorites)?cloud.favorites:[]),...(Array.isArray(local.favorites)?local.favorites:[])])];
    const missions={};
    for(const source of [validObject(cloud.missions)?cloud.missions:{},validObject(local.missions)?local.missions:{}])for(const [day,ids]of Object.entries(source))missions[day]=[...new Set([...(missions[day]||[]),...(Array.isArray(ids)?ids:[])])];
    return {profile,favorites,missions};
  }
  function applyLocal(payload){
    window.RiftyCloudApplying=true;
    localStorage.setItem('accord-profile',JSON.stringify(payload.profile||{}));
    localStorage.setItem('accord-favorites',JSON.stringify(payload.favorites||[]));
    localStorage.setItem('accord-missions',JSON.stringify(payload.missions||{}));
    localStorage.setItem('rifty-local-updated',String(Date.now()));
    window.RiftyCloudApplying=false;
    document.dispatchEvent(new CustomEvent('rifty:cloud-loaded'));
  }
  async function pushCloud(){
    if(!client||!session||syncing)return null;
    syncing=true;
    const payload=localPayload();delete payload.localUpdated;
    const {error}=await client.from('rifty_user_data').upsert({user_id:session.user.id,payload,updated_at:new Date().toISOString()},{onConflict:'user_id'});
    syncing=false;
    if(error){message(['42P01','PGRST205'].includes(error.code)?'Ajoutez la table Rifty dans Supabase avec le fichier supabase-schema.sql.':`Synchronisation impossible : ${error.message}`,'error');return false}
    message('Progression synchronisée.','success');updateSyncBadge(true);return true
  }
  function queuePush(){if(!session||window.RiftyCloudApplying)return;byId('account-label').textContent=accountName(session.user);clearTimeout(syncTimer);syncTimer=setTimeout(pushCloud,700)}
  async function pullCloud(){
    if(!client||!session||syncing)return;
    syncing=true;
    const {data,error}=await client.from('rifty_user_data').select('payload,updated_at').eq('user_id',session.user.id).maybeSingle();
    syncing=false;
    if(error){message(['42P01','PGRST205'].includes(error.code)?'Le compte fonctionne. Exécutez supabase-schema.sql pour activer la synchronisation.':`Compte connecté, synchronisation indisponible : ${error.message}`,'error');return}
    const merged=mergedPayload(data?.payload,data?.updated_at);applyLocal(merged);await pushCloud();
  }
  function updateSyncBadge(connected){const badge=byId('profile-sync-badge');if(!badge)return;badge.innerHTML=uiIcon('check')+(connected?' Synchronisé avec Rifty':' Sur cet appareil')}
  function accountName(account){const profile=parse('accord-profile',{});return profile.nickname?.trim()||account.user_metadata?.full_name||account.user_metadata?.name||account.email?.split('@')[0]||'Guitariste'}
  function drawSession(next){
    session=next||null;const account=session?.user;
    guest.hidden=!!account;userPanel.hidden=!account;recovery.hidden=true;
    byId('account-label').textContent=account?accountName(account):'Se connecter';
    byId('account-button').classList.toggle('signed-in',!!account);updateSyncBadge(!!account);
    if(account){byId('auth-user-name').textContent=accountName(account);byId('auth-user-email').textContent=account.email||'Compte Google';const avatar=account.user_metadata?.avatar_url,box=byId('auth-avatar');box.replaceChildren();if(avatar){const image=document.createElement('img');image.src=avatar;image.alt='';box.append(image)}else box.innerHTML=uiIcon('user-round')}
    document.dispatchEvent(new CustomEvent('rifty:auth-change',{detail:{session}}));
  }
  function setMode(next){mode=next;document.querySelectorAll('[data-auth-mode]').forEach(button=>{const active=button.dataset.authMode===mode;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active))});byId('auth-submit').textContent=mode==='signup'?'Créer mon compte':'Se connecter';byId('auth-password').autocomplete=mode==='signup'?'new-password':'current-password';byId('forgot-password').hidden=mode==='signup';message('')}
  function openDialog(){drawSession(session);if(!configured)message('Connexion prête à être activée : renseignez auth-config.js avec les deux valeurs publiques Supabase.','setup');dialog.showModal()}
  byId('account-button').onclick=openDialog;
  document.querySelector('.auth-close').onclick=()=>dialog.close();
  dialog.onclick=e=>{if(e.target===dialog)dialog.close()};
  document.querySelectorAll('[data-auth-mode]').forEach(button=>button.onclick=()=>setMode(button.dataset.authMode));
  byId('google-auth').onclick=async()=>{if(!client)return message('Renseignez d’abord la configuration publique Supabase.','error');if(location.protocol==='file:')return message('La connexion Google fonctionne depuis le site GitHub Pages ou l’aperçu localhost.','error');message('Ouverture de Google…');const {error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:redirectUrl()}});if(error)message(error.message,'error')};
  byId('auth-form').onsubmit=async e=>{e.preventDefault();if(!client)return message('Renseignez d’abord la configuration publique Supabase.','error');const email=byId('auth-email').value.trim(),password=byId('auth-password').value;message(mode==='signup'?'Création du compte…':'Connexion…');const result=mode==='signup'?await client.auth.signUp({email,password,options:{emailRedirectTo:redirectUrl()}}):await client.auth.signInWithPassword({email,password});if(result.error)return message(result.error.message,'error');if(mode==='signup'&&!result.data.session)message('Compte créé. Consultez votre e-mail pour le confirmer.','success');else message('Connexion réussie.','success')};
  byId('forgot-password').onclick=async()=>{if(!client)return message('Renseignez d’abord la configuration publique Supabase.','error');const email=byId('auth-email').value.trim();if(!email){byId('auth-email').focus();return message('Indiquez votre adresse e-mail.','error')}const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:redirectUrl()});message(error?error.message:'E-mail de réinitialisation envoyé.',error?'error':'success')};
  byId('auth-recovery').onsubmit=async e=>{e.preventDefault();const password=byId('auth-new-password').value;const {error}=await client.auth.updateUser({password});if(error)return message(error.message,'error');message('Mot de passe mis à jour.','success');recovery.hidden=true;userPanel.hidden=false};
  byId('auth-signout').onclick=async()=>{if(!client)return;const synced=await pushCloud();const {error}=await client.auth.signOut();if(error)return message(error.message,'error');if(synced!==false){for(const key of ['accord-profile','accord-favorites','accord-missions','rifty-local-updated'])localStorage.removeItem(key);for(let i=localStorage.length-1;i>=0;i--){const key=localStorage.key(i);if(key?.startsWith('accord-note-'))localStorage.removeItem(key)}document.dispatchEvent(new CustomEvent('rifty:cloud-loaded'))}drawSession(null);message(synced===false?'Déconnecté. Les changements non synchronisés restent sur cet appareil.':'Vous êtes déconnecté.','success')};
  document.addEventListener('rifty:data-change',queuePush);document.addEventListener('accord:favorites',queuePush);
  window.addEventListener('online',queuePush);
  window.RiftyAuth={configured,client,get session(){return session},open:openDialog};
  document.querySelectorAll('[data-open-account]').forEach(button=>button.onclick=openDialog);
  if(client){client.auth.onAuthStateChange((event,next)=>{drawSession(next);if(event==='PASSWORD_RECOVERY'){dialog.showModal();guest.hidden=true;userPanel.hidden=true;recovery.hidden=false;message('Vous pouvez choisir un nouveau mot de passe.')}else if(next&&(event==='SIGNED_IN'||event==='INITIAL_SESSION'))setTimeout(pullCloud,0)});client.auth.getSession().then(({data})=>drawSession(data.session))}else drawSession(null);
  setMode('signin');
})();
