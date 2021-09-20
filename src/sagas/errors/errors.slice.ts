import { createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit';

import { StoreKeys } from '../store.keys';
import { errorAdapter, errorsAdapter } from './errors.adapter';

// ERRORS: {
//   communityId1: {
//     errorType1: {
//       message: 'Error occurred'
//       code: 403
//     }
//     errorType2: {
//       message: 'Other Error occurred'
//       code: 500
//     }
//   }
// }

// communityId: {
//   errors: [
//     {
//       message: 'Error occurred',
//       code: 403,
//       type: 'errorType1'
//     },
//     {
//       message: 'Other Error occurred',
//       code: 500,
//       type: 'errorType2'
//     }
//   ]
// }

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

  errors: EntityState<IError> = errorAdapter.getInitialState()

  constructor({communityId=null, type, code, message}) {
    this.id = communityId
    if (!communityId) {
      this.id = 'general' // Error not connected with community
    }
    errorAdapter.addOne(this.errors, new ErrorState({type, code, message}))
  }
}

class IError {
  type: string
  code: number
  message: string
}

export class ErrorPayload extends IError {
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
      const payload = {
        communityId: 'blabla',
        type: 'community',
        code: 403,
        message: 'something broke'
      }
      errorsAdapter.addOne(
        state,
        new ErrorsState(payload)
      )
    },
  },
});

export const errorsActions = errorsSlice.actions;
export const errorsReducer = errorsSlice.reducer;
