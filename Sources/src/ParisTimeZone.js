/**
 * Paris Timezone offset computation
 * Assuming the summer time goes from last sunday of March at 1am to the last sunday of October at 1am
 */


let ParisTimezoneOffset;
let ParisTimezoneOffsetStr;
let ParisJetlag;

let isInitialized = false;

function initialize() {
  const date = new Date();
  const dayOf31OfMarch = new Date(Date.UTC(date.getUTCFullYear(), 2, 31)).getUTCDay();
  const startSummerDate = new Date(Date.UTC(date.getUTCFullYear(), 2, 31 - dayOf31OfMarch, 1)); // last sunday of March at 1am

  const dayOf31OfOctober = new Date(Date.UTC(date.getUTCFullYear(), 9, 31)).getUTCDay();
  const endOfSummerDate = new Date(Date.UTC(date.getUTCFullYear(), 2, 31 - dayOf31OfOctober, 1)); // last sunday of October at 1am

  const timeOffset = 1 + (startSummerDate.getTime() <= date.getTime() && date.getTime() < endOfSummerDate ? 1 : 0);

  ParisTimezoneOffset = timeOffset * 60;
  ParisTimezoneOffsetStr = `+0${timeOffset}:00`;
  ParisJetlag = new Date().getTimezoneOffset() + timeOffset * 60;

  isInitialized = true;
}

function getParisTimezoneOffset() {
  if (!isInitialized) {
    initialize();
  }

  return ParisTimezoneOffset;
}

function getParisTimezoneOffsetStr() {
  if (!isInitialized) {
    initialize();
  }

  return ParisTimezoneOffsetStr;
}

function getParisJetlag() {
  if (!isInitialized) {
    initialize();
  }

  return ParisJetlag;
}

function toParisTimezone(date) {
  return new Date(date.getTime() + getParisJetlag() * 60 * 1000);
}

export default {
  getParisTimezoneOffset,
  getParisTimezoneOffsetStr,
  getParisJetlag,
  toParisTimezone
};
