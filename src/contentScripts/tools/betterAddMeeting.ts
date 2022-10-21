import { betterAddMeetingTaskInterface } from '../../interfaces/betterAddMeetingTaskInterface';

// gcal might delete the elements, so we need to store them to access them later and re-add them
var betterAddMeetingTasks: betterAddMeetingTaskInterface[] = [];

function betterAddMeeting() {
  if (!document.getElementById('tabEventDetails') && !document.getElementById('tabEvent')) return;

  let view: 'quickadd' | 'detailsPage';
  let meetingButtonCollectorElement: HTMLElement | null = null;

  if (document.getElementById('tabEventDetails')) {
    view = 'detailsPage';
    meetingButtonCollectorElement = document.getElementById('meetingButtonCollectorElement');
    if (!meetingButtonCollectorElement) {
      meetingButtonCollectorElement = document.createElement('div');
      meetingButtonCollectorElement.style.display = 'flex';
      meetingButtonCollectorElement.id = 'meetingButtonCollectorElement';
      document.getElementById('tabEventDetails')!.insertBefore(meetingButtonCollectorElement, document.getElementById('tabEventDetails')!.firstChild);
    }
    if (!document.getElementById('betterAddMeetingStyle')) {
      let style = document.createElement('style');
      style.id = 'betterAddMeetingStyle';
      style.innerHTML = `
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
        `;
      document.head.appendChild(style);
    }
  } else {
    if (!document.querySelector('#tabEvent div.m2hqkd')) return;
    // quickadd view (inside main cal view)
    view = 'quickadd';
    meetingButtonCollectorElement = document.getElementById('meetingButtonCollectorElement');
    if (!meetingButtonCollectorElement) {
      meetingButtonCollectorElement = document.createElement('div');
      meetingButtonCollectorElement.style.display = 'flex';
      meetingButtonCollectorElement.id = 'meetingButtonCollectorElement';
      document.querySelector('#tabEvent > div')!.insertBefore(meetingButtonCollectorElement, document.querySelector('#tabEvent div.m2hqkd'));
    }

    if (!document.getElementById('betterAddMeetingStyle')) {
      let style = document.createElement('style');
      style.id = 'betterAddMeetingStyle';
      style.innerHTML = `
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
          margin-top: 0;
        }
  
        .meetingMainElement .j3nyw {
          padding: 0;
          align-self: baseline;
        }
        `;
      document.head.appendChild(style);
    }
  }
  if (meetingButtonCollectorElement === null) return;
  getTasks(view);
  console.log(betterAddMeetingTasks);

  for (let taskKey in betterAddMeetingTasks) {
    let task = betterAddMeetingTasks[taskKey];
    console.log(task, taskKey);
    try {
      // set new text
      if (task.textElement.innerText !== task.newText) task.textElement.innerText = task.newText;
      // move element to new parent, if not already done
      console.log(!task.mainElement.parentElement);
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

function getTasks(view: 'quickadd' | 'detailsPage') {
  if (view === 'quickadd') {
    // GMeet
    if (document.querySelector('#tabEvent > div > div.m2hqkd > div') && document.querySelector('#xAddRtcSel > span > span'))
      betterAddMeetingTasks['GMeet' as any] = {
        mainElement: document.querySelector('#tabEvent > div > div.m2hqkd > div')!,
        textElement: document.querySelector('#xAddRtcSel > span > span')!,
        newText: 'GMeet',
      };
    // Jitsi
    if (document.querySelector('#jitsi-meet_button_quick_add_content') && document.querySelector('#jitsi-meet_button_quick_add > content > span'))
      betterAddMeetingTasks['Jitsi' as any] = {
        mainElement: document.querySelector('#jitsi-meet_button_quick_add_content')!,
        textElement: document.querySelector('#jitsi-meet_button_quick_add > content > span')!,
        newText: 'Jitsi',
      };
    // Zoom
    if (document.querySelector('.zoom-pop-link'))
      betterAddMeetingTasks['Zoom' as any] = {
        mainElement: document.querySelector('.zoom-pop-link')!,
        textElement: document.querySelector('.zoom-pop-link a')!,
        newText: 'Zoom',
      };
  } else {
    // GMeet
    if (document.querySelector('#xAddRtcSel > span > span')?.closest('.FrSOzf'))
      betterAddMeetingTasks['GMeet' as any] = {
        mainElement: document.querySelector('#xAddRtcSel > span > span')!.closest('.FrSOzf')!,
        textElement: document.querySelector('#xAddRtcSel > span > span')!,
        newText: 'GMeet',
      };
    // Jitsi
    if (document.querySelector('#jitsi-meet_button')?.closest('.FrSOzf'))
      betterAddMeetingTasks['Jitsi' as any] = {
        mainElement: document.querySelector('#jitsi-meet_button')!.closest('.FrSOzf')!,
        textElement: document.querySelector('#jitsi-meet_button')!,
        newText: 'Jitsi',
      };
    // Zoom
    if (document.querySelector('#zoom-video-sec'))
      betterAddMeetingTasks['Zoom' as any] = {
        mainElement: document.querySelector('#zoom-video-sec')!,
        textElement: document.querySelector('#zoom_schedule_button')!,
        newText: 'Zoom',
      };
  }
}

export { betterAddMeeting };
