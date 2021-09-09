import { createSelector } from 'reselect';
import { ErrorsState } from './errors.slice';

const selectSelf = (state) => state;

export const certificateRegistration = createSelector(
  selectSelf,
  (reducerState: ErrorsState) => {
    console.log(`inside errors selector ${reducerState}`)
    return reducerState.certificateRegistration;
  }
);

export const errorsSelectors = {
  certificateRegistration
}