import { tripStates } from '../model/tripsStates/states.js';

/**
 * Format the date
 * @param {date} date the date to format
 * @returns {String} the formatted date
 */
function formatDate(date) {
  let today = new Date();
  let midnight = (() => {
    let d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    d.setDate(d.getDate() + 1);
    return d;
  })();

  let midnightTime = midnight.getTime();
  let time = date.getTime();

  if (time >= midnightTime) {
    // the date is later than today, show the date
    return date.toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  }
  else { //if (time - now >= _1H) {
    // the date is later than 1 hour from now, show the hours and minutes
    return date.toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  //else {
  //  // the date is less than 1 hour, show the minutes
  //  return `${(time - now) / (1000 * 60)}0mn`;
  //}
}

export function realTimeStateDisplay(state, showAtTime = true, showPlannedTrip = true) {
  if (state) {
    switch (state.type) {
      case tripStates.PLANNED_TRIP:
        return showPlannedTrip ? formatDate(new Date(state.time)) : '';

      case tripStates.NOT_PLANNED_TRIP:
        return "Non planifié !";

      case tripStates.DELAYED_TRIP:
        return "Retardé";

      case tripStates.CANCELLED_TRIP:
        return "Supprimé";

      case tripStates.RUNNING_TRIP:
        return state.delayed === 0 ? showAtTime ? "A l'heure" : '' : `${state.delayed} mn`;

      case tripStates.ARRIVED_TRIP:
        return "Arrivé";
    }
  }
}
