import {
  createSlice,
  EntityState,
  PayloadAction,
  Dictionary,
} from '@reduxjs/toolkit';

import { StoreKeys } from '../store.keys';
import { errorsAdapter } from './errors.adapter';

export const GENERAL_ERRORS = 'general';

export class ErrorPayload {
  constructor(
    public type: string,
    public code: number,
    public message: string,
    public communityId: string = GENERAL_ERRORS
  ) { }
}

type ErrorsState = Dictionary<EntityState<ErrorPayload>>;
const initialState: ErrorsState = {};

export const errorsSlice = createSlice({
  initialState,
  name: StoreKeys.Errors,
  reducers: {
    addError: (state, action: PayloadAction<ErrorPayload>) => {
      if (!state[action.payload.communityId]) {
        state[action.payload.communityId] = errorsAdapter.getInitialState();
      }
      errorsAdapter.upsertOne(
        state.entities[action.payload.communityId],
        action.payload
      );
    },
  },
});

export const errorsActions = errorsSlice.actions;
export const errorsReducer = errorsSlice.reducer;
