import waitForExpect from 'wait-for-expect';
import { communitiesActions } from '../sagas/communities/communities.slice';
import { identityActions } from '../sagas/identity/identity.slice';
import { messagesActions } from '../sagas/messages/messages.slice';
import logger from '../utils/logger';
import { createApp } from './utils';
import { AsyncReturnType } from 'src/utils/types/AsyncReturnType.interface';

import { keyFromCertificate, parseCertificate } from '@zbayapp/identity/lib';
import { connectionActions } from '../sagas/appConnection/connection.slice';

const log = logger('tests');
const App: AsyncReturnType<typeof createApp> = null;
type Store = typeof App.store;

interface CreateCommunity {
  userName: string;
  store: Store;
}
interface JoinCommunity {
  registrarAddress: string;
  userName: string;
  ownerPeerId: string;
  ownerRootCA: string;
  expectedPeersCount: number;
  registrarPort: number;
  store: Store;
}

export async function createCommunity({ userName, store }: CreateCommunity) {
  const timeout = 120_000;
  const communityName = 'CommunityName';

  store.dispatch(communitiesActions.createNewCommunity(communityName));

  await waitForExpect(() => {
    expect(store.getState().Identity.identities.ids).toHaveLength(1);
  }, timeout);
  await waitForExpect(() => {
    expect(store.getState().Communities.communities.ids).toHaveLength(1);
  }, timeout);

  const communityId = store.getState().Communities.communities.ids[0];

  await waitForExpect(() => {
    expect(
      store.getState().Identity.identities.entities[communityId].hiddenService
        .onionAddress
    ).toBeTruthy();
  }, timeout);
  await waitForExpect(() => {
    expect(
      store.getState().Identity.identities.entities[communityId].peerId.id
    ).toHaveLength(46);
  }, timeout);

  store.dispatch(identityActions.registerUsername(userName));

  await waitForExpect(() => {
    expect(
      store.getState().Identity.identities.entities[communityId].userCertificate
    ).toBeTruthy();
  }, timeout);
  await waitForExpect(() => {
    expect(
      store.getState().Communities.communities.entities[communityId].CA
    ).toHaveProperty('rootObject');
  }, timeout);
  await waitForExpect(() => {
    expect(
      store.getState().Communities.communities.entities[communityId]
        .onionAddress
    ).toBeTruthy();
  }, timeout);
  await waitForExpect(() => {
    expect(store.getState().Users.certificates.ids).toHaveLength(1);
  }, timeout);
  await waitForExpect(() => {
    expect(
      store.getState().Connection.initializedCommunities[communityId]
    ).toBeTruthy();
  });
  await waitForExpect(() => {
    expect(
      store.getState().Connection.initializedRegistrars[communityId]
    ).toBeTruthy();
  });
}

export async function joinCommunity(payload: JoinCommunity) {
  const {
    registrarAddress,
    userName,
    ownerPeerId,
    ownerRootCA,
    expectedPeersCount,
    registrarPort,
    store,
  } = payload;

  const timeout = 120_000;

  let address: string;
  if (payload.registrarAddress === '0.0.0.0') {
    address = `${registrarAddress}:${registrarPort}`;
  } else {
    address = registrarAddress;
  }

  store.dispatch(communitiesActions.joinCommunity(address));

  await waitForExpect(() => {
    expect(store.getState().Identity.identities.ids).toHaveLength(1);
  }, timeout);
  await waitForExpect(() => {
    expect(store.getState().Communities.communities.ids).toHaveLength(1);
  }, timeout);

  const communityId = store.getState().Communities.communities.ids[0];

  await waitForExpect(() => {
    expect(
      store.getState().Identity.identities.entities[communityId].hiddenService
        .onionAddress
    ).toBeTruthy();
  }, timeout);
  await waitForExpect(() => {
    expect(
      store.getState().Identity.identities.entities[communityId].peerId.id
    ).toHaveLength(46);
  }, timeout);

  const userPeerId =
    store.getState().Identity.identities.entities[communityId].peerId.id;

  store.dispatch(identityActions.registerUsername(userName));

  await waitForExpect(() => {
    expect(
      store.getState().Identity.identities.entities[communityId].userCertificate
    ).toBeTruthy();
  }, timeout);
  await waitForExpect(() => {
    expect(
      store.getState().Communities.communities.entities[communityId].rootCa
    ).toEqual(ownerRootCA);
  }, timeout);

  await waitForExpect(() => {
    expect(
      store.getState().Communities.communities.entities[communityId].peerList
        .length
    ).toEqual(expectedPeersCount);
  }, timeout);

  const peerList =
    store.getState().Communities.communities.entities[communityId].peerList;

  await waitForExpect(() => {
    expect(peerList[0]).toMatch(new RegExp(ownerPeerId));
  }, timeout);

  await waitForExpect(() => {
    expect(peerList[peerList.length - 1]).toMatch(new RegExp(userPeerId));
  }, timeout);
}

export async function sendMessage(
  message: string,
  store: Store
): Promise<{ message: string; publicKey: string }> {
  log(message, 'sendMessage');
  store.dispatch(messagesActions.sendMessage(message));

  const communityId = store.getState().Communities.communities.ids[0];
  const certificate =
    store.getState().Identity.identities.entities[communityId].userCertificate;

  const parsedCertificate = parseCertificate(certificate);
  const publicKey = keyFromCertificate(parsedCertificate);

  return {
    message,
    publicKey,
  };
}

export async function tryToJoinOfflineRegistrar(store) {
  const timeout = 120_000;
  const userName = 'userName';

  store.dispatch(
    communitiesActions.joinCommunity(
      'yjnblkcrvqexxmntrs7hscywgebrizvz2jx4g4m5wq4x7uzi5syv5cid'
    )
  );

  await waitForExpect(() => {
    expect(store.getState().Identity.identities.ids).toHaveLength(1);
  }, timeout);
  await waitForExpect(() => {
    expect(store.getState().Communities.communities.ids).toHaveLength(1);
  }, timeout);

  const communityId = store.getState().Communities.communities.ids[0];

  await waitForExpect(() => {
    expect(
      store.getState().Identity.identities.entities[communityId].hiddenService
        .onionAddress
    ).toHaveLength(62);
  }, timeout);
  await waitForExpect(() => {
    expect(
      store.getState().Identity.identities.entities[communityId].peerId.id
    ).toHaveLength(46);
  }, timeout);

  store.dispatch(identityActions.registerUsername(userName));

  await waitForExpect(() => {
    expect(
      store.getState().Errors[communityId].entities.registrar.type
    ).toEqual('registrar');
  }, timeout);
  await waitForExpect(() => {
    expect(
      store.getState().Errors[communityId].entities.registrar.message
    ).toEqual('Registering username failed.');
  }, timeout);
  await waitForExpect(() => {
    expect(
      store.getState().Errors[communityId].entities.registrar.communityId
    ).toEqual(communityId);
  }, timeout);
  await waitForExpect(() => {
    expect(
      store.getState().Errors[communityId].entities.registrar.code
    ).toEqual(500);
  }, timeout);
}

export const getCommunityOwnerData = (ownerStore: Store) => {
  const ownerStoreState = ownerStore.getState();
  const community =
    ownerStoreState.Communities.communities.entities[
      ownerStoreState.Communities.currentCommunity
    ];
  const registrarAddress = community.onionAddress;
  const ownerIdentityState = ownerStore.getState().Identity;
  return {
    registrarAddress,
    communityId: community.id,
    ownerPeerId:
      ownerIdentityState.identities.entities[
        ownerIdentityState.identities.ids[0]
      ].peerId.id,
    ownerRootCA: community.rootCa,
    registrarPort: community.port,
  };
};

export const clearInitializedCommunitiesAndRegistrars = (store: Store) => {
  store.dispatch(connectionActions.removeInitializedCommunities);
  store.dispatch(connectionActions.removeInitializedRegistrars);
};

interface SendRegistrationRequest {
  registrarAddress: string;
  userName: string;
  store: Store;
  registrarPort?: number;
}

export const sendRegistrationRequest = async (
  payload: SendRegistrationRequest
) => {
  const { registrarAddress, userName, registrarPort, store } = payload;

  const timeout = 120_000;

  let address: string;
  if (registrarAddress === '0.0.0.0') {
    address = `${registrarAddress}:${registrarPort}`;
  } else {
    address = registrarAddress;
  }

  store.dispatch(communitiesActions.joinCommunity(address));

  await waitForExpect(() => {
    expect(store.getState().Identity.identities.ids).toHaveLength(1);
  }, timeout);
  await waitForExpect(() => {
    expect(store.getState().Communities.communities.ids).toHaveLength(1);
  }, timeout);

  const communityId = store.getState().Communities.communities.ids[0];

  await waitForExpect(() => {
    expect(
      store.getState().Identity.identities.entities[communityId].hiddenService
        .onionAddress
    ).toBeTruthy();
  }, timeout);
  await waitForExpect(() => {
    expect(
      store.getState().Identity.identities.entities[communityId].peerId.id
    ).toHaveLength(46);
  }, timeout);

  store.dispatch(identityActions.registerUsername(userName));
};
