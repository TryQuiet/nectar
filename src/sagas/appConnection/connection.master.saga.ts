import { all, takeEvery } from 'typed-redux-saga';
import { connectionActions } from './connection.slice';

import { responseInitializedCommunitiesSaga } from '../appConnection/responseInitializedCommunitiesAndRegistrars/responseInitializedCommunities';
import { responseInitializedRegistrarsSaga } from '../appConnection/responseInitializedCommunitiesAndRegistrars/responseInitializedRegistrars.saga';

export function* connectionMasterSaga(): Generator {
  yield all([
    takeEvery(
      connectionActions.responseInitializedCommunities.type,
      responseInitializedCommunitiesSaga
    ),
    takeEvery(
      connectionActions.responseInitializedRegistrars.type,
      responseInitializedRegistrarsSaga
    ),
  ]);
}
