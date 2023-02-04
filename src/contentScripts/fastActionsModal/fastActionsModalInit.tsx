import React from 'react';
import ReactDOM from 'react-dom/client';
import { BtnGCToolsModalOpen } from './btnModalOpen';
import { FastActionsModal } from './fastActionsModal';
import './fastActionsModal.css';

export function fastActionsModalInit() {
  /*** init hoverover element in Google Calendar™ style ***/
  // this element is used to display the hover information
  let hoverElement: HTMLElement = document.createElement('div');
  hoverElement.innerHTML = `
    <span class="RM9ulf catR2e PgfOZ qs41qe" id="hoverInformationElement">
      <span class="AZnilc R8qYlc" id="hoverInformationElementText">
        Text
      </span>
    </span>
  `;
  document.getElementsByTagName('body')[0].appendChild(hoverElement);

  /*** init modal ***/

  /* https://www.w3schools.com/howto/howto_css_modals.asp */
  // open modal with button click
  let btn = document.createElement('div');
  btn.id = 'btnGCToolsModalOpen';
  document.querySelector('div.BXL82c')!.after(btn);

  const btnGCToolsModalOpen = ReactDOM.createRoot(document.getElementById('btnGCToolsModalOpen') as HTMLElement);
  btnGCToolsModalOpen.render(
    <React.StrictMode>
      <BtnGCToolsModalOpen />
    </React.StrictMode>,
  );

  /* modal */
  let modal = document.createElement('div');
  modal.innerHTML = `<div id="GCTModal" class="modal"></div>`;
  document.body.appendChild(modal);

  window.onclick = function (event) {
    let modal = document.getElementById('GCTModal')!;
    if (event.target == modal) {
      modal.style.display = 'none';
    }
  };

  const fastActionModal = ReactDOM.createRoot(document.getElementById('GCTModal') as HTMLElement);
  fastActionModal.render(
    <React.StrictMode>
      <FastActionsModal />
    </React.StrictMode>,
  );
}
