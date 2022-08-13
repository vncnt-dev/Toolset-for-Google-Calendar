// #region general variables

// Separates the day and time for multi-day events
var dayTimeSeparators = new RegExp(
  Object.values({
    english: ' at ',
    bahasaIndonesian: ' pukul ',
    catala: ' a les ',
    dansk: ' kl. ',
    deutsch: ' um ',
    espanol: ' a las ',
    euskara: '\\(a\\) ',
    filipino: ' nang ',
    italiano: ' alle ',
    nederlands: ' om ',
    portugues: ' às ',
    turkish: ' saat ',
    chineseAndJapanese: '日',
    korean: '일 ',
  }).join('|'),
  'g',
);

var unnecessaryPreAndSuffix = new RegExp(/de |du |Van | arası|時|С /g);

//var russianTokenRegex = /^С .*/;
var commasRegex = /[,，、]/;

// In certain language settings, it is ambiguous whether a separator is
// separating a day/time in a datetime, or separating the two datetimes in an
// event. Example: catala
//
// For these, need to look for a token to explicitly identify whether it's
// multiDay or single day.
var multiDayTokens = new RegExp(
  Object.values({
    catala: ' al dia ',
    espanol: ' al ',
    francais: ' au ',
  }).join('|'),
);

function getStartEndRegex(ismultiDay: boolean) {
  var startEndSeparators = {
    english: ' to ',
    dansk: ' til ',
    deutsch: ' bis ',
    francais: ' à ',
    japanese: '～',
    chinese: '至',
    korean: '~',
    bahasaIndonesian: ' sampai ',
    filipino: ' hanggang ',
    nederlands: ' tot ',
    polski: ' do ',
    svenska: ' till ',
    turkish: ' ile ',
    russian: ' до ',
  };

  var multiDaySeparators = {
    espanol: ' al ',
    catala: ' al dia ',
    francias: ' au ',
  };

  if (ismultiDay) {
    // Multi-day detected
    Object.assign(startEndSeparators, multiDaySeparators);
  } else {
    // Single-day detected
    Object.assign(startEndSeparators, {
      espanol: ' a ',
      catala: ' a les ',
    });
  }

  return new RegExp('[-–]|' + Object.values(startEndSeparators).join('|'));
}

var monthNamesInt: any = {
  january: {
    english: 'january',
    bahasaindonesian: 'januari',
    catala: 'gener',
    dansk: 'januar',
    deutsch: 'januar',
    espanol: 'enero',
    euskara: 'urtarrila',
    filipino: 'enero',
    français: 'janvier',
    italiano: 'gennaio',
    nederlands: 'januari',
    polski: 'styczeń',
    portugues: 'janeiro',
    svenska: 'januari',
    turkish: 'ocak',
    chinese: '一月',
    korean: '1월',
    russian: 'января',
  },
  february: {
    english: 'february',
    bahasaindonesian: 'februari',
    catala: 'febrer',
    dansk: 'februar',
    deutsch: 'februar',
    espanol: 'febrero',
    euskara: 'otsaila',
    filipino: 'pebrero',
    français: 'février',
    italiano: 'febbraio',
    nederlands: 'februari',
    polski: 'luty',
    portugues: 'fevereiro',
    svenska: 'februari',
    turkish: 'şubat',
    chinese: '二月',
    korean: '2월',
    russian: 'февраля',
  },
  march: {
    english: 'march',
    bahasaindonesian: 'maret',
    catala: 'març',
    dansk: 'marts',
    deutsch: 'märz',
    espanol: 'marzo',
    euskara: 'martxo',
    filipino: 'marso',
    français: 'mars',
    italiano: 'marzo',
    nederlands: 'maart',
    polski: 'marzec',
    portugues: 'março',
    svenska: 'mars',
    turkish: 'marş',
    chinese: '三月',
    korean: '3월',
    russian: 'марта',
  },
  april: {
    english: 'april',
    bahasaindonesian: 'april',
    catala: 'abril',
    dansk: 'april',
    deutsch: 'april',
    espanol: 'abril',
    euskara: 'apirila',
    filipino: 'abril',
    français: 'avril',
    italiano: 'aprile',
    nederlands: 'april',
    polski: 'kwiecień',
    portugues: 'abril',
    svenska: 'april',
    turkish: 'nisan',
    chinese: '四月',
    korean: '4월',
    russian: 'апреля',
  },
  may: {
    english: 'may',
    bahasaindonesian: 'mei',
    catala: 'maig',
    dansk: 'maj',
    deutsch: 'mai',
    espanol: 'mayo',
    euskara: 'maiatza',
    filipino: 'mayo',
    français: 'mai',
    italiano: 'maggio',
    nederlands: 'mei',
    polski: 'maj',
    portugues: 'maio',
    svenska: 'maj',
    turkish: 'mayıs',
    chinese: '五月',
    korean: '5월',
    russian: 'мая',
  },
  june: {
    english: 'june',
    bahasaindonesian: 'juni',
    catala: 'juny',
    dansk: 'juni',
    deutsch: 'juni',
    espanol: 'junio',
    euskara: 'ekain',
    filipino: 'hulyo',
    français: 'juin',
    italiano: 'giugno',
    nederlands: 'juni',
    polski: 'czerwiec',
    portugues: 'junho',
    svenska: 'juni',
    turkish: 'haziran',
    chinese: '六月',
    korean: '6월',
    russian: 'июня',
  },
  july: {
    english: 'july',
    bahasaindonesian: 'juli',
    catala: 'juliol',
    dansk: 'juli',
    deutsch: 'juli',
    espanol: 'julio',
    euskara: 'ekain',
    filipino: 'hulyo',
    français: 'juillet',
    italiano: 'luglio',
    nederlands: 'juli',
    polski: 'lipiec',
    portugues: 'julho',
    svenska: 'juli',
    turkish: 'temmuz',
    chinese: '七月',
    korean: '7월',
    russian: 'июля',
  },
  august: {
    english: 'august',
    bahasaindonesian: 'agustus',
    catala: 'agost',
    dansk: 'august',
    deutsch: 'august',
    espanol: 'agosto',
    euskara: 'ekain',
    filipino: 'agosto',
    français: 'août',
    italiano: 'agosto',
    nederlands: 'augustus',
    polski: 'sierpień',
    portugues: 'agosto',
    svenska: 'augusti',
    turkish: 'ağustos',
    chinese: '八月',
    korean: '8월',
    russian: 'августа',
  },
  september: {
    english: 'september',
    bahasaindonesian: 'september',
    catala: 'setembre',
    dansk: 'september',
    deutsch: 'september',
    espanol: 'septiembre',
    euskara: 'uztaila',
    filipino: 'setiembre',
    français: 'septembre',
    italiano: 'settembre',
    nederlands: 'september',
    polski: 'wrzesień',
    portugues: 'setembro',
    svenska: 'september',
    turkish: 'eylül',
    chinese: '九月',
    korean: '9월',
    russian: 'сентября',
  },
  october: {
    english: 'october',
    bahasaindonesian: 'oktober',
    catala: 'octubre',
    dansk: 'oktober',
    deutsch: 'oktober',
    espanol: 'octubre',
    euskara: 'urtarrila',
    filipino: 'oktober',
    français: 'octobre',
    italiano: 'ottobre',
    nederlands: 'oktober',
    polski: 'październik',
    portugues: 'outubro',
    svenska: 'oktober',
    turkish: 'ekim',
    chinese: '十月',
    korean: '10월',
    russian: 'октября',
  },
  november: {
    english: 'november',
    bahasaindonesian: 'november',
    catala: 'novembre',
    dansk: 'november',
    deutsch: 'november',
    espanol: 'noviembre',
    euskara: 'urtea',
    filipino: 'november',
    français: 'novembre',
    italiano: 'novembre',
    nederlands: 'november',
    polski: 'listopad',
    portugues: 'novembro',
    svenska: 'november',
    turkish: 'kasım',
    chinese: '十一月',
    korean: '11월',
    russian: 'ноября',
  },
  december: {
    english: 'december',
    bahasaindonesian: 'desember',
    catala: 'desembre',
    dansk: 'december',
    deutsch: 'dezember',
    espanol: 'diciembre',
    euskara: 'urtea',
    filipino: 'desember',
    français: 'décembre',
    italiano: 'dicembre',
    nederlands: 'december',
    polski: 'grudzień',
    portugues: 'dezembro',
    svenska: 'december',
    turkish: 'aralık',
    chinese: '十二月',
    korean: '12월',
    russian: 'декабря',
  },
};
// #endregion

function getEventTime(eventMetadata: string): Date[] {
  // get language from html lang attribute
  var language = document.documentElement.lang;
  console.log('language: ' + language);

  if (language == 'fr') {
    eventMetadata = eventMetadata.replace(unnecessaryPreAndSuffix, '');
    // "," is uded to sepret the date and time but also as a seperator in general (between the date, eventname,..)
    // 30 juin 2020, 03:45 au 1 juillet 2020, 03:15,
    if (eventMetadata.match(/^[0-9]+ [A-Za-z]+ [0-9]+, [0-9]+:[0-9]+/)) {
      let eventMetadataArray = eventMetadata.split(',');
      eventMetadataArray[0] = eventMetadataArray[0] + eventMetadataArray[1] + eventMetadataArray[2];
      eventMetadataArray.splice(1, 2);
      eventMetadata = eventMetadataArray.join(', ');
    }
  }

  if (language == 'en') {
    // en = only en-US not en-UK,...
    // "," is uded to sepret the date and time but also as a seperator in general (between the date, eventname,..)
    //  additonaly the order of the date and time is reversed/ different
    let eventMetadataArray = eventMetadata.split(',');
    if (eventMetadata.match(/^[A-Za-z]+ [0-9]+, [0-9]+/)) {
      eventMetadataArray[0] = eventMetadataArray[0] + eventMetadataArray[1] + eventMetadataArray[2];
      eventMetadataArray.splice(1, 2);
      eventMetadata = eventMetadataArray.join(', ');
    } else if (!eventMetadataArray[0].includes(':')) {
      if (eventMetadataArray[eventMetadataArray.length - 2].includes('–')) {
        eventMetadataArray[eventMetadataArray.length - 2] =
          eventMetadataArray[eventMetadataArray.length - 2]
            // June 29 – 30 -> 29. - 30. June (this can already be handled)
            .replace(/([A-zA-z]+)\s([0-9]+)\s–\s([0-9]+)/, '$2. - $3. $1') +
          // add year
          eventMetadataArray[eventMetadataArray.length - 1];
        eventMetadataArray.splice(-1);
        eventMetadata = eventMetadataArray.join(', ');
      } else {
        eventMetadataArray[eventMetadataArray.length - 2] =
          eventMetadataArray[eventMetadataArray.length - 2] +
          // add year
          eventMetadataArray[eventMetadataArray.length - 1];
        eventMetadataArray.splice(-1);
        eventMetadata = eventMetadataArray.join(', ');
      }
    }
  }

  if (language == 'pt-PT') {
    // às has differnet meanings depending on the context
    // "30 de junho de 2020 - 03:45 a 1 de julho de 2020 às 03:15" but also "20:15 às 21:45"
    let eventMetadataArray = eventMetadata.split(',');
    if (eventMetadataArray[0].includes(' a ') && eventMetadataArray[0].includes('às')) {
      eventMetadata = eventMetadata.replace(' - ', ' ');
    } else if (eventMetadataArray[0].includes(' às ')) {
      eventMetadata = eventMetadata.replace(' às ', ' - ');
    }
  }

  return parseMetadata(eventMetadata);
}

function parseMetadata(eventMetadata: string): Date[] {
  console.log('eventMetadata: ' + eventMetadata);
  let eventTime: string = eventMetadata.split(commasRegex)[0].toLowerCase();
  // allday events without Time are stored differently
  let multiDayWithoutTime = false;
  if (!eventTime.includes(':')) {
    eventTime = eventMetadata.split(commasRegex).pop()!.toLowerCase();
    multiDayWithoutTime = true;
  }
  // remove uncessary prefixes and suffixes
  eventTime = eventTime.replace(unnecessaryPreAndSuffix, '').replace(dayTimeSeparators, ' ');
  // detect multiDay events for some languages
  let ismultiDay = multiDayTokens.test(eventTime);

  /** split Start and End times from eventTime, includes dates if presents   */
  let startEndDateTime: string[] | Date[];

  let startEndRegex = getStartEndRegex(ismultiDay);
  startEndDateTime = eventTime.split(startEndRegex);

  if (multiDayWithoutTime) {
    if (startEndDateTime.length > 1) {
      // Multi-day event
      // if the start date doesn't contain a month, assume it's the same as the end date
      if (startEndDateTime[0].match(/^\s+[0-9]{1,2}\.?\s+$/)) {
        startEndDateTime[0] =
          startEndDateTime[0].trim() + ' ' + startEndDateTime[1].slice(startEndDateTime[1].match(/^\s+[0-9]{1,2}\.?\s+/)![0].length);
      }
      // if the start date doesn't contain a year, assume it's the same year as the end date
      else if (!startEndDateTime[0].match(/\d{4}/)) {
        startEndDateTime[0] = startEndDateTime[0].trim() + ' ' + startEndDateTime[1].match(/\d{4}/)![0];
      }
      startEndDateTime = ['00:00 ' + startEndDateTime[0].trim(), '23:59:59 ' + startEndDateTime[1].trim()];
    } else {
      // 24h event
      startEndDateTime = ['00:00 ' + startEndDateTime[0].trim(), '23:59:59 ' + startEndDateTime[0].trim()];
    }
  } else {
    // if dateTimes doesnt contain a date, set to 1.1.100 -> helps to detect added date later on
    startEndDateTime.map(function (item, index) {
      if (!item.match(/\d{4}/)) {
        startEndDateTime[index] = item.trim() + ' 1.1.100';
      }
    });
  }

  startEndDateTime.map(function (item, index) {
    item = normalizeEastAsiaDateTime(item);
    item = reorderDateAndTime(item);
    item = removeInternationalization(item);
    item = item.trim();
    console.log('finalItem: ', index, item);
    startEndDateTime[index] = new Date(item);
    console.log('Date: ', index, startEndDateTime[index]);
    if (isNaN(startEndDateTime[index] as any)) {
      console.warn('invalid date: ', index, item);
    }
  });
  console.log('');
  return startEndDateTime as unknown as Date[];
}

function normalizeEastAsiaDateTime(dateString: string): string {
  //|年|月|日 Chinese
  //|年|月|日 Korean
  let eastAsianAm = new RegExp(['午前', '上午', '오전'].join('|'));
  let eastAsianPm = new RegExp(['午後', '下午', '오후'].join('|'));
  let isEastAsia = dateString.match(eastAsianAm) || dateString.match(eastAsianPm) || dateString.match(/|年|月|日|년|월|일/);

  if (isEastAsia) {
    if (dateString.match(eastAsianAm)) {
      dateString = dateString.replace(eastAsianAm, '') + 'am';
    }
    if (dateString.match(eastAsianPm)) {
      dateString = dateString.replace(eastAsianPm, '') + 'pm';
    }
    // reoder 2022年6月16日 to 2022/6/16
    dateString = dateString.replace(/(.*) (\d+)[年|년]\s?(\d+)[月|월]\s?(\d+)[日||일]/, '$1 $2/$3/$4');
  }
  return dateString;
}

function reorderDateAndTime(dateString: string): string {
  // 16/06/2022 -> 06/16/2022
  if (dateString.match(/(\d+)\/(\d+)\/(\d{4})/)) {
    dateString = dateString.replace(/(.*) (\d+)\/(\d+)\/(\d+)/, '$1 $3/$2/$4');
  }
  return dateString;
}

/** Remove internationalization from the date.*/
function removeInternationalization(dateString: string): string {
  // replace month in intDate with english month from monthNamesInt
  for (var month in monthNamesInt) {
    // get regex by combining all from month obj exept english, ignore case
    var regex = new RegExp(Object.values(monthNamesInt[month]).slice(1).join('|'), 'i');
    // replace month in intDate with english month from monthNamesInt
    dateString = dateString.toLowerCase().replace(regex, monthNamesInt[month].english);
  }
  return dateString;
}

export { getEventTime };
