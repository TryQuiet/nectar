import { combineReducers } from '@reduxjs/toolkit';
import { expectSaga } from 'redux-saga-test-plan';
import { StoreKeys } from '../../store.keys';
import {
  connectionActions,
  connectionReducer,
  ConnectionState,
} from '../connection.slice';
import { responseInitializedCommunitiesSaga } from './responseInitializedCommunities';

describe('responseInitializedCommunities', () => {
  test('response initialized communities', async () => {
    const communityId = 'communityId';

    await expectSaga(
      responseInitializedCommunitiesSaga,
      connectionActions.responseInitializedCommunities(communityId)
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
          initializedCommunities: [communityId],
        },
      })
      .run();
  });
});
