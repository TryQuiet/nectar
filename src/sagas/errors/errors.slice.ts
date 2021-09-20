import { createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit';

import { StoreKeys } from '../store.keys';
import { errorAdapter, errorsAdapter } from './errors.adapter';

export class ErrorState {
  type: string
  code: number
  message: string
  constructor({type, code, message}) {
    this.type = type
    this.code = code
    this.message = message
  }
}

export class ErrorsState {
  id: string = ''
  errors: EntityState<ErrorPayload>

  constructor({communityId=null, type, code, message}) {
    this.id = communityId
    if (!communityId) {
      this.id = 'general' // Error not connected with community
    }
  }
}

export interface ErrorPayload {
  communityId?: string
  type: string
  code: number
  message: string
}

export const errorsSlice = createSlice({
  initialState: errorsAdapter.getInitialState(),
  name: StoreKeys.Errors,
  reducers: {
    setError: (state, action: PayloadAction<ErrorPayload>) => {
      if (state.entities[action.payload.communityId]) {
        errorsAdapter.updateOne(
          state,
          {
            id: action.payload.communityId,
            changes: {
              errors: errorAdapter.addOne(
                state.entities[action.payload.communityId].errors, 
                action.payload
                )
            }
        })
      } else {
        errorsAdapter.addOne(
          state,
          {
            id: action.payload.communityId, 
            errors: errorAdapter.addOne(errorAdapter.getInitialState(), action.payload)}
        )
      }
    },
  },
});

export const errorsActions = errorsSlice.actions;
export const errorsReducer = errorsSlice.reducer;
