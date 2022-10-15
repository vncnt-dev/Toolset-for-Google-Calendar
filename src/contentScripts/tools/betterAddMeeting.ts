import { betterAddMeetingTaskInterface } from '../../interfaces/betterAddMeetingTaskInterface';

var betterAddMeetingTasks: betterAddMeetingTaskInterface[] = [];

function betterAddMeeting() {
  let view: 'quickadd' | 'detailsPage';
  let meetingButtonCollectorElement: HTMLElement | null = null;

  if (document.querySelector('#tabEventDetails')) {
    view = 'detailsPage';
    // edit event detailpage (fullscreen page): add new Element .meetingButtonCollectorElement as first element of parent
    meetingButtonCollectorElement = document.querySelector('#tabEventDetails .meetingButtonCollectorElement');
    if (!meetingButtonCollectorElement) {
      meetingButtonCollectorElement = document.createElement('div');
      meetingButtonCollectorElement.style.display = 'flex';
      meetingButtonCollectorElement.classList.add('meetingButtonCollectorElement');
      document.querySelector('#tabEventDetails')!.insertBefore(meetingButtonCollectorElement, document.querySelector('#tabEventDetails')!.firstChild);
    }
    let style = document.createElement('style');
    style.innerHTML = `
      .meetingButtonCollectorElement .Jitsi .BY5aAd {
        height: 36px;
      }
      .meetingButtonCollectorElement .Jitsi .BY5aAd div {
        height: 36px;
      }
      `;
    document.head.appendChild(style);
  } else {
    // quickadd view (inside main cal view)
    view = 'quickadd';
    meetingButtonCollectorElement = document.querySelector('#tabEvent > div > div.m2hqkd');
    if (meetingButtonCollectorElement) meetingButtonCollectorElement.style.display = 'flex';
    let style = document.createElement('style');
    style.innerHTML = `
    #jitsi-meet_button_quick_add {
      height: 36px;
    }
    .Jitsi div {
      margin-top: 0px;
      }`;
    document.head.appendChild(style);
  }

  if (meetingButtonCollectorElement === null) return;
  getTasks(view);

  for (let taskKey in betterAddMeetingTasks) {
    let task = betterAddMeetingTasks[taskKey];
    console.log(task, taskKey);
    try {
      if (task.mainElement === null || task.textElement === null || meetingButtonCollectorElement === null) return;
      // set new text
      if (task.textElement.innerText !== task.newText) task.textElement.innerText = task.newText;
      // move element to new parent, if not already done
      if (!task.mainElement.parentElement || !task.mainElement.parentElement.isSameNode(meetingButtonCollectorElement))
        meetingButtonCollectorElement.appendChild(task.mainElement);
      // set taskKey as class if not already done
      if (!task.mainElement.classList.contains(taskKey)) task.mainElement.classList.add(taskKey);
      // set main and text element to fixed height, marginBottom 0 and marginTop 0, if not already done
      if (task.mainElement.style.height !== '36px') task.mainElement.style.height = '36px';
      if (task.mainElement.style.marginBottom !== '0px') task.mainElement.style.marginBottom = '0px';
      if (task.mainElement.style.marginTop !== '0px') task.mainElement.style.marginTop = '0px';

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
