import { put } from 'typed-redux-saga';
import { PayloadAction } from '@reduxjs/toolkit';
import { connectionActions } from '../connection.slice';
import { CommunityId } from '../connection.types';

export function* responseInitializedCommunitiesSaga(
  action: PayloadAction<CommunityId>
): Generator {
  const communityId = action.payload;

  yield* put(connectionActions.addInitializedCommunity(communityId));
}
