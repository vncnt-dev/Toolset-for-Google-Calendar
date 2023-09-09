import { betterAddMeetingButtonsInterface } from '../../interfaces/betterAddMeetingButtonsInterface';

// gcal might delete the elements, so we need to store them to access them later and re-add them
var addMeetingButtons: betterAddMeetingButtonsInterface[] = [];

let view: 'quickadd' | 'detailsPage';
let prevView: 'quickadd' | 'detailsPage';

const betterAddMeetingStyle_detailsPage = `
.meetingMainElement{
  display: flex;
  align-items: center;
  margin: 0;
  height: 38px;
  min-height: 38px;
  padding-bottom: 5px;
  padding-top: 5px;
}
.meetingMainElement .j3nyw {
  padding: 0;
  align-self: baseline;
}

.Jitsi .BY5aAd {
  height: 38px;
}
/* active google Meeting Link */
.GMeet:has(.GtJUP.fnUwMe) {
  height: 50px;
}
`;

const betterAddMeetingStyle_quickAdd = `
#meetingButtonCollectorElement {
  padding-left: 16px;
}

.meetingMainElement{
  display: flex;
  align-items: flex-start!important;
  margin: 0;
  height: 38px;
}

.meetingMainElement div{
  margin-top: 0!important;
}

.meetingMainElement .j3nyw {
  padding: 0;
  align-self: baseline;
}

/* active google Meeting Link */
.Cj64Ib {
  height: 100px;
}
.Cj64Ib div.toUqff,.Cj64Ib div.uLZ20b, .Cj64Ib.i3euSb {
  padding: 0;
}
`;

function genMeetingButtonCollectorElement() {
  let meetingButtonCollectorElement = document.createElement('div');
  meetingButtonCollectorElement.style.display = 'flex';
  meetingButtonCollectorElement.id = 'meetingButtonCollectorElement';
  return meetingButtonCollectorElement;
}

function betterAddMeeting() {
  const detailsPageElement = document.querySelector('.ewPPR');
  const quickAddElement = document.querySelector('.VuEIfc');
  let meetingButtonCollectorElement: HTMLElement | null = null;

  if (detailsPageElement) {
    view = 'detailsPage';
    meetingButtonCollectorElement = document.getElementById('meetingButtonCollectorElement');
    if (!meetingButtonCollectorElement) {
      meetingButtonCollectorElement = genMeetingButtonCollectorElement();
      detailsPageElement!.insertBefore(meetingButtonCollectorElement, detailsPageElement.firstChild);
    }
    if (!document.getElementById('betterAddMeetingStyle')) {
      const style = document.createElement('style');
      style.id = 'betterAddMeetingStyle';
      style.innerHTML = betterAddMeetingStyle_detailsPage;
      document.head.appendChild(style);
    }
  } else if (quickAddElement) {
    view = 'quickadd'; // (inside main cal view)
    meetingButtonCollectorElement = document.getElementById('meetingButtonCollectorElement');
    if (!meetingButtonCollectorElement) {
      meetingButtonCollectorElement = genMeetingButtonCollectorElement();
      quickAddElement.insertBefore(meetingButtonCollectorElement, document.querySelector('div.m2hqkd'));
    }

    if (!document.getElementById('betterAddMeetingStyle')) {
      const style = document.createElement('style');
      style.id = 'betterAddMeetingStyle';
      style.innerHTML = betterAddMeetingStyle_quickAdd;
      document.head.appendChild(style);
    }
  } else {
    return;
  }
  if (meetingButtonCollectorElement === null) return;
  getMeetingButtons(view);
  for (let taskKey in addMeetingButtons) {
    let task = addMeetingButtons[taskKey];
    try {
      // set new text
      if (task.textElement.innerText !== task.newText) task.textElement.innerText = task.newText;
      // move element to new parent, if not already done
      if (!task.mainElement.parentElement || !task.mainElement.parentElement.isSameNode(meetingButtonCollectorElement))
        meetingButtonCollectorElement.appendChild(task.mainElement);
      // set taskKey as class if not already done
      if (!task.mainElement.classList.contains(taskKey)) task.mainElement.classList.add(taskKey);
      if (!task.mainElement.classList.contains('meetingMainElement')) task.mainElement.classList.add('meetingMainElement');

      if (view === 'quickadd' && meetingButtonCollectorElement.querySelector('div.tsUyod.XsN7kf'))
        meetingButtonCollectorElement.querySelector('div.tsUyod.XsN7kf')!.classList.remove('tsUyod');
      if (view === 'quickadd' && task.mainElement.style.marginInlineEnd !== '0px') task.mainElement.style.marginInlineEnd = '0px';
    } catch (e) {
      console.warn(e);
    }
  }
}

function getMeetingButtons(view: 'quickadd' | 'detailsPage') {
  if (prevView !== view) {
    addMeetingButtons = [];
  }
  // Check if the view is 'quickadd'
  if (view === 'quickadd') {
    // GMeet
    const gMeetTextElement = document.querySelector('#xAddRtcSel > span');
    const gMeetMainElement = gMeetTextElement?.closest('.FrRgdd');
    if (gMeetMainElement && gMeetTextElement) {
      addMeetingButtons['GMeet' as any] = {
        mainElement: gMeetMainElement as HTMLElement,
        textElement: gMeetTextElement as HTMLElement,
        newText: 'GMeet',
      };
    }

    // Jitsi
    const jitsiMainElement = document.querySelector('#jitsi-meet_button_quick_add_content');
    const jitsiTextElement = document.querySelector('#jitsi-meet_button_quick_add > content > span');
    if (jitsiMainElement && jitsiTextElement) {
      addMeetingButtons['Jitsi' as any] = {
        mainElement: jitsiMainElement as HTMLElement,
        textElement: jitsiTextElement as HTMLElement,
        newText: 'Jitsi',
      };
    }

    // Zoom
    const zoomMainElement = document.querySelector('.zoom-pop-link');
    const zoomTextElement = zoomMainElement?.querySelector('a');
    if (zoomMainElement && zoomTextElement) {
      addMeetingButtons['Zoom' as any] = {
        mainElement: zoomMainElement as HTMLElement,
        textElement: zoomTextElement as HTMLElement,
        newText: 'Zoom',
      };
    }
  } else {
    // GMeet
    const gMeetTextElement = document.querySelector('#xAddRtcSel > span');
    const gMeetMainElement = gMeetTextElement?.closest('.FrSOzf');
    if (gMeetMainElement && gMeetTextElement) {
      addMeetingButtons['GMeet' as any] = {
        mainElement: gMeetMainElement as HTMLElement,
        textElement: gMeetTextElement as HTMLElement,
        newText: 'GMeet',
      };
    }

    // Jitsi
    const jitsiMainElement = document.querySelector('#jitsi-meet_button')?.closest('.FrSOzf');
    const jitsiTextElement = document.querySelector('#jitsi-meet_button');
    if (jitsiMainElement && jitsiTextElement) {
      addMeetingButtons['Jitsi' as any] = {
        mainElement: jitsiMainElement as HTMLElement,
        textElement: jitsiTextElement as HTMLElement,
        newText: 'Jitsi',
      };
    }

    // Zoom
    const zoomMainElement = document.querySelector('#zoom-video-sec');
    const zoomTextElement = document.querySelector('#zoom_schedule_button');
    if (zoomMainElement && zoomTextElement) {
      addMeetingButtons['Zoom' as any] = {
        mainElement: zoomMainElement as HTMLElement,
        textElement: zoomTextElement as HTMLElement,
        newText: 'Zoom',
      };
    }
  }
  prevView = view;
}

export { betterAddMeeting };
