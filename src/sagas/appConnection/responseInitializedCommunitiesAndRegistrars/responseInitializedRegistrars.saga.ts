import { put } from 'typed-redux-saga';
import { PayloadAction } from '@reduxjs/toolkit';
import { connectionActions } from '../connection.slice';
import { RegistrarId } from '../connection.types';

export function* responseInitializedRegistrarsSaga(
  action: PayloadAction<RegistrarId>
): Generator {
  const registrarId = action.payload;

  yield* put(connectionActions.addInitializedRegistrar(registrarId));
}
