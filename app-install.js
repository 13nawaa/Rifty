(()=>{
  const installButton=document.getElementById('install-rifty-app');
  let installPrompt=null;
  const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  const showMessage=text=>{if(typeof showToast==='function')showToast(text)};
  const card=document.querySelector('.rifty-app-card');
  if(card){
    card.querySelector('.rifty-app-badge').textContent='RIFTY APP · BÊTA OUVERTE';
    card.querySelector('h3').textContent='Installez Rifty sur Windows.';
    card.querySelector(':scope>p').textContent='Même compte, fenêtre dédiée et mises à jour automatiques.';
    card.querySelector('[data-open-rifty-app]').childNodes[0].textContent='Installer la bêta ';
  }

  function setState(){
    if(!installButton)return;
    const installed=standalone();
    installButton.disabled=installed;
    installButton.textContent=installed?'Rifty est installée':'Installer Rifty';
  }

  addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();
    installPrompt=event;
    setState();
  });

  addEventListener('appinstalled',()=>{
    installPrompt=null;
    setState();
    showMessage('Rifty est installée. Retrouvez-la dans le menu Démarrer.');
  });

  installButton?.addEventListener('click',async()=>{
    if(standalone())return;
    if(!installPrompt){
      showMessage('Ce navigateur ne propose pas l’installation directe. Ouvrez le menu ⋯ puis Applications → Installer Rifty.');
      return;
    }
    const prompt=installPrompt;
    installPrompt=null;
    await prompt.prompt();
    const choice=await prompt.userChoice;
    if(choice.outcome!=='accepted')setState();
  });

  if('serviceWorker'in navigator&&location.protocol!=='file:'){
    addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').then(registration=>registration.update()).catch(()=>{}));
  }
  setState();
})();