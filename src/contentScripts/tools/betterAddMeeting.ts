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
      meetingButtonCollectorElement.classList.add('meetingButtonCollectorElement');
      document.querySelector('#tabEventDetails')!.insertBefore(meetingButtonCollectorElement, document.querySelector('#tabEventDetails')!.firstChild);
    }
  } else {
    // quickadd view (inside main cal view)
    view = 'quickadd';
    meetingButtonCollectorElement = document.querySelector('#tabEvent > div > div.m2hqkd');
  }

  if (meetingButtonCollectorElement === null) return;
  getTasks(view);

  for (let taskKey in betterAddMeetingTasks) {
    let task = betterAddMeetingTasks[taskKey];
    try {
      if (task.mainElement === null || task.textElement === null || meetingButtonCollectorElement === null) return;

      if (task.textElement.innerText !== task.newText) task.textElement.innerText = task.newText;
      if (!task.mainElement.parentElement || !task.mainElement.parentElement.isSameNode(meetingButtonCollectorElement))
        meetingButtonCollectorElement.appendChild(task.mainElement);
      if (task.mainElement.style.display !== 'inline-flex') task.mainElement.style.display = 'inline-flex';
      if (view === 'quickadd' && meetingButtonCollectorElement.querySelector('div.tsUyod.XsN7kf'))
        meetingButtonCollectorElement.querySelector('div.tsUyod.XsN7kf')!.classList.remove('tsUyod');
      if (view === 'quickadd' && task.mainElement.style.marginInlineEnd !== '0px') task.mainElement.style.marginInlineEnd = '0px';
    } catch (e) {
      console.log(e);
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
  }
}

export { betterAddMeeting };
