import './content_script.css';
import { settings, saveSettings } from './SettingsHandler';

function preparePage() {
  /* https://www.w3schools.com/howto/howto_css_modals.asp */
  // open modal with button click
  const btn = document.createElement('div');
  btn.classList.add('GCToolsModalOpen');
  btn.innerHTML = `<svg style="width:24px;height:24px" viewBox="0 0 24 24"><path fill="currentColor" d="M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10M10,22C9.75,22 9.54,21.82 9.5,21.58L9.13,18.93C8.5,18.68 7.96,18.34 7.44,17.94L4.95,18.95C4.73,19.03 4.46,18.95 4.34,18.73L2.34,15.27C2.21,15.05 2.27,14.78 2.46,14.63L4.57,12.97L4.5,12L4.57,11L2.46,9.37C2.27,9.22 2.21,8.95 2.34,8.73L4.34,5.27C4.46,5.05 4.73,4.96 4.95,5.05L7.44,6.05C7.96,5.66 8.5,5.32 9.13,5.07L9.5,2.42C9.54,2.18 9.75,2 10,2H14C14.25,2 14.46,2.18 14.5,2.42L14.87,5.07C15.5,5.32 16.04,5.66 16.56,6.05L19.05,5.05C19.27,4.96 19.54,5.05 19.66,5.27L21.66,8.73C21.79,8.95 21.73,9.22 21.54,9.37L19.43,11L19.5,12L19.43,13L21.54,14.63C21.73,14.78 21.79,15.05 21.66,15.27L19.66,18.73C19.54,18.95 19.27,19.04 19.05,18.95L16.56,17.95C16.04,18.34 15.5,18.68 14.87,18.93L14.5,21.58C14.46,21.82 14.25,22 14,22H10M11.25,4L10.88,6.61C9.68,6.86 8.62,7.5 7.85,8.39L5.44,7.35L4.69,8.65L6.8,10.2C6.4,11.37 6.4,12.64 6.8,13.8L4.68,15.36L5.43,16.66L7.86,15.62C8.63,16.5 9.68,17.14 10.87,17.38L11.24,20H12.76L13.13,17.39C14.32,17.14 15.37,16.5 16.14,15.62L18.57,16.66L19.32,15.36L17.2,13.81C17.6,12.64 17.6,11.37 17.2,10.2L19.31,8.65L18.56,7.35L16.15,8.39C15.38,7.5 14.32,6.86 13.12,6.62L12.75,4H11.25Z" /></svg>`;
  btn.innerHTML = `${btn.innerHTML}<span>GC Tools</span>`;
  btn.addEventListener('click', () => {
    document.getElementById('GCTModal')!.style.display = 'block';
  });
  document.querySelector('div.BXL82c')!.after(btn);

  /* modal */
  const modal = document.createElement('div');
  modal.innerHTML = `
  <div id="GCTModal" class="modal">
    <div class="modal-content" id="GCToolsMenueBody" style="border-radius:10px;">
      <span class="close" style="position: relative;top: -13px;">&times;</span>
      <h2>Toolset for Google Calendar™</h2>
      <h3 class="O1gyfd">Fast Access Settings</h3>
    </div>
  </div>`;
  document.body.appendChild(modal);

  // close Button
  const span = document.getElementsByClassName('close')[0];
  span.addEventListener('click', () => {
    document.getElementById('GCTModal')!.style.display = 'none';
  });

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function (event) {
    const modal = document.getElementById('GCTModal')!;
    if (event.target == modal) {
      modal.style.display = 'none';
    }
  };
  // fast access to the "Information On Hover" setting, because it might be turned on/of more frequently (Google Calendar™ style)
  const menuPointHI = document.createElement('div');
  menuPointHI.classList.add('GCToolsMenueItem');
  menuPointHI.innerHTML = `
    <div class="uVccjd OQWBod" role="checkbox" id="menuPointHICheckbox" aria-checked="false">
      <div class="uHMk6b fsHoPb"></div>
      <div class="rq8Mwb">
        <div class="TCA6qd">
          <div class="MbUTNc oyD5Oc"></div>
          <div class="Ii6cVc oyD5Oc"></div>
        </div>
      </div>
    </div>
    <span for="c109" class="VYaxId">Information On Hover</span>`;
  const menuPointHICheckbox = menuPointHI.querySelector('#menuPointHICheckbox')!;
  menuPointHICheckbox.setAttribute('aria-checked', settings.hoverInformation_isActive.toString());
  menuPointHICheckbox.classList.add(settings.hoverInformation_isActive ? 'N2RpBe' : 'foo');
  menuPointHI.addEventListener('click', () => {
    settings.hoverInformation_isActive = !settings.hoverInformation_isActive;
    const menuPointHICheckbox = document.getElementById('menuPointHICheckbox')!;
    menuPointHICheckbox.setAttribute('aria-checked', settings.hoverInformation_isActive.toString());
    menuPointHICheckbox.classList.add(settings.hoverInformation_isActive ? 'N2RpBe' : 'foo');
    saveSettings(settings);
  });
  document.getElementById('GCToolsMenueBody')!.appendChild(menuPointHI);

  // open the settings menu  (Google Calendar™ style)
  const menuPointgtSettings = document.createElement('div');
  menuPointHI.classList.add('GCToolsMenueItem');
  menuPointgtSettings.innerHTML = `
  <button
  class="VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-INsAgc VfPpkd-LgbsSe-OWXEXe-dgl2Hf Rj2Mlf">
  <span class="VfPpkd-vQzf8d">Open Settings</span>
</button>
`;
  menuPointgtSettings.addEventListener('click', () => {
    chrome.runtime.sendMessage('GCTopenOptionsPage');
  });
  document.getElementById('GCToolsMenueBody')!.appendChild(menuPointgtSettings);

  // hoverover element in Google Calendar™ style use for the hover information
  const hoverElement: HTMLElement = document.createElement('div');
  hoverElement.innerHTML = `<span class="RM9ulf catR2e PgfOZ qs41qe" id="hoverInformationElement"> 
      <span class="AZnilc R8qYlc" id="hoverInformationElementText">Text</span>
  </span>`;
  document.getElementsByTagName('body')[0].appendChild(hoverElement);
}

export { preparePage };
