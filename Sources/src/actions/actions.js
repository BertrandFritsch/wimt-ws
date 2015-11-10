
/*
 * action types
 */

export const UPDATE_DEBUGGING_INFO = 'UPDATE_DEBUGGING_INFO';

/*
 * action creators
 */

export function updateDebuggingInfo(type, text) {
  return { type: UPDATE_DEBUGGING_INFO, data: { type, text }};
}
