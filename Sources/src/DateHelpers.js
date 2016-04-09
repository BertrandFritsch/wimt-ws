
// gets the number of days since 01/01/1970 in locale time
function getDateAsDays(date) {
  return Math.floor((date.getTime() - (date.getTimezoneOffset() * 60 * 1000)) / 1000 / 60 / 60 / 24);
}

// gets the date according the number of days since 01/01/1970 in locale time
function getDateByDays(days) {
  return new Date(days * 24 * 60 * 60 * 1000 + (new Date().getTimezoneOffset() * 60 * 1000));
}

function getDateByMinutes(time, date = new Date()) {
  return new Date(new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() + (time * 60 * 1000));
}

export default {
  getDateAsDays,
  getDateByDays,
  getDateByMinutes
};
