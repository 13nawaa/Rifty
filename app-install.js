(()=>{
  const installButton=document.getElementById('install-rifty-app');
  const status=document.getElementById('rifty-install-status');
  let installPrompt=null;
  const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  const card=document.querySelector('.rifty-app-card');
  if(card){
    card.querySelector('.rifty-app-badge').textContent='RIFTY APP · BÊTA OUVERTE';
    card.querySelector('h3').textContent='Installez Rifty sur Windows.';
    card.querySelector(':scope>p').textContent='Même compte, fenêtre dédiée et mises à jour automatiques.';
    card.querySelector('[data-open-rifty-app]').childNodes[0].textContent='Installer la bêta ';
  }

  function setState(){
    if(!installButton||!status)return;
    if(standalone()){
      installButton.disabled=true;
      installButton.textContent='Rifty est installée';
      status.textContent='La bêta tourne dans sa propre fenêtre. Les mises à jour arrivent automatiquement.';
      return;
    }
    installButton.disabled=false;
    installButton.textContent=installPrompt?'Installer la bêta Windows':'Comment installer Rifty';
    status.textContent=installPrompt
      ?'Installation gratuite · Windows 10 et 11 · mises à jour automatiques'
      :'Dans Edge ou Chrome : menu ⋯, puis Applications > Installer Rifty.';
  }

  addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();
    installPrompt=event;
    setState();
  });

  addEventListener('appinstalled',()=>{
    installPrompt=null;
    setState();
    if(typeof showToast==='function')showToast('Rifty est installée. Retrouvez-la dans le menu Démarrer.');
  });

  installButton?.addEventListener('click',async()=>{
    if(standalone())return;
    if(!installPrompt){
      setState();
      status?.classList.add('install-hint');
      setTimeout(()=>status?.classList.remove('install-hint'),900);
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
