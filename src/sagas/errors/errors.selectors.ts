import { createSelector } from 'reselect';
import { currentCommunityId } from '../communities/communities.selectors';
import { StoreKeys } from '../store.keys';
import { CreatedSelectors, StoreState } from '../store.types';
import { errorsAdapter } from './errors.adapter';
import { GENERAL_ERRORS } from './errors.slice';

const errorSlice: CreatedSelectors[StoreKeys.Errors] = (state: StoreState) =>
  state[StoreKeys.Errors];

export const currentCommunityErrors = createSelector(
  currentCommunityId,
  errorSlice,
  (communityId: string, reducerState) =>
    errorsAdapter.getSelectors().selectAll(reducerState[communityId])
);

export const generalErrors = createSelector(errorSlice, (reducerState) =>
  errorsAdapter.getSelectors().selectAll(reducerState[GENERAL_ERRORS])
);

export const currentCommunityErrorsByType = createSelector(
  currentCommunityId,
  errorSlice,
  (communityId: string, reducerState) =>
    errorsAdapter.getSelectors().selectEntities(reducerState[communityId])
);

export const errorsSelectors = {
  currentCommunityErrors,
  currentCommunityErrorsByType,
  generalErrors,
};
