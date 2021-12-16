import { apply, select, put } from 'typed-redux-saga';
import { PayloadAction } from '@reduxjs/toolkit';
import { Socket } from 'socket.io-client';
import { SocketActionTypes } from '../../socket/const/actionTypes';
import { identitySelectors } from '../../identity/identity.selectors';

import { communitiesSelectors } from '../communities.selectors';
import { communitiesActions } from '../communities.slice';
import { identityActions } from '../../identity/identity.slice';

export function* initCommunities(): Generator {

  const joinedCommunities = yield* select(identitySelectors.joinedCommunities);
  const unregisteredCommunities = yield* select(identitySelectors.unregisteredCommunities)
  const userName = yield* select(identitySelectors.currentIdentity)

  for (const community of unregisteredCommunities) {
    yield* put(identityActions.registerUsername(userName.zbayNickname));
  }

  for (const community of joinedCommunities) {
    yield* put(communitiesActions.launchCommunity(community.id));
  }
}

export function* launchCommunitySaga(
  socket: Socket,
  action: PayloadAction<
    ReturnType<typeof communitiesActions.launchCommunity>['payload']
  >
): Generator {
  let communityId: string = action.payload;

  if (!communityId) {
    communityId = yield* select(communitiesSelectors.currentCommunityId);
  }

  const community = yield* select(communitiesSelectors.selectById(communityId));
  const identity = yield* select(identitySelectors.selectById(communityId));

  const cert = identity.userCertificate;
  const key = identity.userCsr.userKey;
  const ca = community.rootCa;

  const certs = {
    cert,
    key,
    ca,
  };
  yield* apply(socket, socket.emit, [
    SocketActionTypes.LAUNCH_COMMUNITY,
    identity.id,
    identity.peerId,
    identity.hiddenService,
    community.peerList,
    certs,
  ]);
}
