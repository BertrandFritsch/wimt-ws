import Rx from 'rx';

const eventBus = new Rx.Subject();

export function publish(event) {
  eventBus.onNext(event);
}

/**
 * Get access to the event bus for subscription purposes.
 * @returns {Rx.Observable} The event bus
 */
export function getEventBus() {
  return eventBus;
}
