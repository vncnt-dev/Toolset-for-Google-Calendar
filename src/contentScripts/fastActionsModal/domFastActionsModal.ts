import { loadSettings, saveSettings } from '../lib/SettingsHandler';
import { downloadStringAsFile, logging } from '../lib/miscellaneous';

function createButton() {
  const btn = document.createElement('button');
  btn.id = 'btnGCToolsModalOpen';
  btn.className = 'GCToolsModalOpen';
  const icon = document.createElement('span');
  icon.textContent = 'GC Tools';
  icon.className = 'hint';
  btn.appendChild(icon);
  btn.addEventListener('click', () => {
    const modal = document.getElementById('GCTModal');
    if (modal) modal.style.display = 'block';
  });
  return btn;
}

function createModal() {
  const modal = document.createElement('div');
  modal.id = 'GCTModal';
  modal.className = 'modal';
  modal.style.display = 'none';
  modal.style.position = 'fixed';
  modal.style.zIndex = '2147483647';
  modal.style.left = '0';
  modal.style.top = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.overflow = 'auto';
  modal.style.backgroundColor = 'rgba(0,0,0,0.4)';

  const content = document.createElement('div');
  content.id = 'GCToolsMenueBody';
  content.className = 'modal-content';
  content.style.margin = '10% auto';
  content.style.padding = '20px';
  content.style.borderRadius = '10px';
  content.style.width = '80%';
  content.style.maxWidth = '720px';
  content.style.background = 'white';

  const close = document.createElement('span');
  close.className = 'close';
  close.innerHTML = '&times;';
  close.style.cursor = 'pointer';
  close.addEventListener('click', () => (modal.style.display = 'none'));

  const title = document.createElement('h2');
  title.textContent = 'Toolset for Google Calendar™';

  // ICS combiner section
  const icsHeader = document.createElement('h3');
  icsHeader.textContent = 'ics Combiner';
  const icsDesc = document.createElement('p');
  icsDesc.textContent = 'This combines multiple .ics files into one, that can be imported into Google Calendar™.';

  const fileInputLabel = document.createElement('label');
  fileInputLabel.className = 'IZXV0b';
  fileInputLabel.textContent = 'Select the .ics files to combine';
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.ics';
  fileInput.multiple = true;
  fileInput.addEventListener('change', async (event: any) => {
    const files = event.target.files;
    if (!files) return;
    const fileContents = [];
    for (let i = 0; i < files.length; i++) fileContents.push(await files[i].text());
    let combinedIcs = fileContents[0];
    for (let i = 1; i < fileContents.length; i++) {
      const events = fileContents[i].slice(fileContents[i].indexOf('BEGIN:VEVENT'), fileContents[i].lastIndexOf('END:VEVENT') + 11);
      combinedIcs = combinedIcs.slice(0, combinedIcs.lastIndexOf('END:VEVENT') + 11) + events + combinedIcs.slice(combinedIcs.lastIndexOf('END:VEVENT') + 11);
    }
    combinedIcs = combinedIcs.replace(/^\s*[\r\n]/gm, '').replace(/\n/g, '\r\n').replace(/\r\r\n/g, '\r\n');
    downloadStringAsFile(combinedIcs, 'combined.ics');
    event.target.value = '';
  });
  fileInputLabel.appendChild(fileInput);

  // Settings toggles container
  const settingsHeader = document.createElement('h3');
  settingsHeader.textContent = 'Switch Features On/Off';
  const settingsContainer = document.createElement('div');
  settingsContainer.className = 'GCToolsMenueItem';

  const openOptionsBtn = document.createElement('button');
  openOptionsBtn.textContent = 'Open Options Page';
  openOptionsBtn.addEventListener('click', () => chrome.runtime.sendMessage('GCTopenOptionsPage'));

  content.appendChild(close);
  content.appendChild(title);
  content.appendChild(icsHeader);
  content.appendChild(icsDesc);
  content.appendChild(fileInputLabel);
  content.appendChild(settingsHeader);
  content.appendChild(settingsContainer);
  content.appendChild(openOptionsBtn);

  modal.appendChild(content);

  // Click outside to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });

  // load settings and create toggles
  loadSettings().then((s) => {
    const featureKeys = [
      'calcDuration_isActive',
      'hoverInformation_isActive',
      'removeGMeets_isActive',
      'indicateAllDayEvents_isActive',
    ] as Array<keyof typeof s>;
    featureKeys.forEach((k) => {
      const div = document.createElement('div');
      div.style.marginBottom = '8px';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = (s as any)[k];
      input.addEventListener('change', async () => {
        const next = { ...(await loadSettings()), [k]: input.checked } as any;
        await saveSettings({ [k]: input.checked } as any);
      });
      const label = document.createElement('label');
      label.textContent = k;
      label.style.marginLeft = '6px';
      div.appendChild(input);
      div.appendChild(label);
      settingsContainer.appendChild(div);
    });
  });

  return { modal, button: createButton() };
}

export function mountDomFastActions() {
  try {
    const { modal, button } = createModal();
    if (!document.getElementById('GCTModal')) document.body.appendChild(modal);
    // Insert button into toolbar area (best-effort)
    const anchor = document.querySelector('div.L09ZLe') || document.body;
    if (!document.getElementById('btnGCToolsModalOpen')) anchor.after(button);
  } catch (e) {
    logging('error', 'Error mounting DOM fast actions', e);
  }
}
