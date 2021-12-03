import { combineReducers } from '@reduxjs/toolkit';
import { expectSaga } from 'redux-saga-test-plan';
import { StoreKeys } from '../../store.keys';
import {
  connectionActions,
  connectionReducer,
  ConnectionState,
} from '../connection.slice';
import { responseInitializedRegistrarsSaga } from './responseInitializedRegistrars.saga';

describe('responseInitializedRegistrarsSaga works correctly', () => {
  test('add data from response initialized registrars into the store', async () => {
    const registrarId = 'registrarId';

    await expectSaga(
      responseInitializedRegistrarsSaga,
      connectionActions.responseInitializedRegistrars(registrarId)
    )
      .withReducer(
        combineReducers({ [StoreKeys.Connection]: connectionReducer }),
        {
          [StoreKeys.Connection]: { ...new ConnectionState() },
        }
      )

      .hasFinalState({
        [StoreKeys.Connection]: {
          ...new ConnectionState(),
          initializedRegistrars: [registrarId],
        },
      })
      .run();
  });
});
