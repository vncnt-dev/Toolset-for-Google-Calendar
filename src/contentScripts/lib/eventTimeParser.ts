// #region general variables

// Separates the day and time for multi-day events
var portuguesToken = ' às ';
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
    portugues: portuguesToken,
    turkish: ' saat ',
    chineseAndJapanese: '日',
    korean: '일 ',
  }).join('|'),
  'g',
);

var unnecessaryPreAndSuffix = new RegExp(/de |du |Van | arası|時|С /g);

var russianTokenRegex = /^С .*/;
var commasRegex = /[,，、]/;

var eastAsianAms = new RegExp(['午前', '上午', '오전'].join('|'));
var eastAsianPms = new RegExp(['午後', '下午', '오후'].join('|'));

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
  },
};
// #endregion

function getEventTime(eventMetadata: string): Date[] {
  // get language from html lang attribute
  var language = document.documentElement.lang;
  console.log('language: ' + language);

  if (language == 'fr') {
    eventMetadata = eventMetadata.replace(unnecessaryPreAndSuffix, '');
    // 30 juin 2020, 03:45 au 1 juillet 2020, 03:15,
    if (eventMetadata.match(/^[0-9]+ [A-Za-z]+ [0-9]+, [0-9]+:[0-9]+/)) {
      let eventMetadataArray = eventMetadata.split(',');
      eventMetadataArray[0] = eventMetadataArray[0] + eventMetadataArray[1] + eventMetadataArray[2];
      eventMetadataArray.splice(1, 2);
      eventMetadata = eventMetadataArray.join(', ');
    }
  }

  if (language == 'en') {
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

  return parseMetadata(eventMetadata);
}

function parseMetadata(eventMetadata: string): Date[] {
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

  if (eventTime.includes(portuguesToken)) {
    // Portugues is particularly ambiguous.
    //
    // Portugues (Portugal) Single-Day and Portugues (Brasil and Portugal)
    // Multi-Day events will all have the token, which makes it harder to
    // determine which case we're in.
    //
    // Portugues (Brasil) Single-Day will just have a - and doesn't need to be
    // handled here.
    let portuguesSplit = eventTime.split(portuguesToken);
    if (portuguesSplit.length === 2) {
      // Portugues (Portugal) Single-Day
      startEndDateTime = portuguesSplit;
    } else if (eventTime.includes(' - ')) {
      // Portugues (Brasil) Multi-Day
      startEndDateTime = eventTime.split(' - ');
    } else {
      // Portugues (Portugal) Multi-Day
      startEndDateTime = eventTime.split(' a ');
    }
  } else {
    let startEndRegex = getStartEndRegex(ismultiDay);
    startEndDateTime = eventTime.split(startEndRegex);
  }
  if (multiDayWithoutTime) {
    if (startEndDateTime.length > 1) {
      // Multi-day event
      // if the start date doesn't contain a month, assume it's the same as the end date
      if (startEndDateTime[0].match(/^\s+[0-9]{1,2}\.?\s+$/)) {
        startEndDateTime[0] =
          startEndDateTime[0].trim() +
          ' ' +
          startEndDateTime[1].slice(startEndDateTime[1].match(/^\s+[0-9]{1,2}\.?\s+/)![0].length);
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
    startEndDateTime[index] = new Date(item);
    if (isNaN(startEndDateTime[index] as any)) {
      console.error('invalid date: ', item);
    }
  });
  return startEndDateTime as unknown as Date[];
}

function normalizeEastAsiaDateTime(dateString: string): string {
  //|年|月|日 Chinese
  //|年|月|日 Korean
  let isEastAsia =
    dateString.match(eastAsianAms) || dateString.match(eastAsianPms) || dateString.match(/|年|月|日|년|월|일/);

  if (isEastAsia) {
    if (dateString.match(eastAsianAms)) {
      dateString = dateString.replace(eastAsianAms, '');
      dateString += 'am';
    }
    if (dateString.match(eastAsianPms)) {
      dateString = dateString.replace(eastAsianPms, '');
      dateString += 'pm';
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

  // 01.01.2020 01:00 -> 01:00 01.01.2020
  /*   let split = dateString.split(" ");
  if (split.length === 2) {
    if (split[1].includes(":")) {
      if (split.length > 1) {
        var dateString = split[0];
        var time = split[1];
        dateString = time + " " + dateString;
      }
    }
  } */
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
