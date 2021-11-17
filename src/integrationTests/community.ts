import { createAction } from '@reduxjs/toolkit';
import { StoreKeys } from '../sagas/store.keys';
import {
  fork,
  put,
  take,
} from 'typed-redux-saga';
import { createUserCsr, UserCsr } from '@zbayapp/identity/lib/requestCertificate';
import config from '@zbayapp/identity/lib/config';
import waitForExpect from 'wait-for-expect';

import { communitiesAdapter } from '../sagas/communities/communities.adapter';
import {
  communitiesActions,
  CommunitiesState,
  Community,
} from '../sagas/communities/communities.slice';
import {
  Identity,
  identityActions,
  IdentityState,
} from '../sagas/identity/identity.slice';
import logger from '../utils/logger';
import {
  assertNoErrors,
  createApp,
  integrationTest,
  watchResults,
} from './utils';
import { identityAdapter } from '../sagas/identity/identity.adapter';
import { sendMessageSaga } from 'src/sagas/messages/sendMessage/sendMessage.saga';

const log = logger('tests');

export async function assertReceivedCertificates(
  userName: string,
  expectedCount: number,
  maxTime: number = 600000,
  store
) {
  log(`User ${userName} starts waiting ${maxTime}ms for certificates`);

  await waitForExpect(() => {
    expect(store.getState().Users.certificates.ids).toHaveLength(expectedCount);
  }, maxTime);

  log(
    `User ${userName} received ${
      store.getState().Users.certificates.ids.length
    } certificates`
  );
}

export async function assertReceivedChannels(
  userName: string,
  expectedCount: number,
  maxTime: number = 600000,
  store
) {
  log(`User ${userName} starts waiting ${maxTime}ms for channels`);

  const communityId = store.getState().Communities.communities.ids[0];

  await waitForExpect(() => {
    expect(
      store.getState().PublicChannels.channels.entities[communityId].channels.ids
    ).toHaveLength(expectedCount);
  }, maxTime);

  log(
    `User ${userName} received ${
      store.getState().PublicChannels.channels.entities[communityId].channels.ids.length
    } channels`
  );
}

export const getCommunityOwnerData = (ownerStore: any) => {
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

export async function createCommunity({ userName, store }) {
  const timeout = 50_000;
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
    ).toHaveLength(56);
  }, timeout);
  await waitForExpect(() => {
    expect(store.getState().Users.certificates.ids).toHaveLength(1);
  }, timeout);
}

export async function joinCommunity(payload) {
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

  let address;
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
    ).toHaveLength(62);
  }, timeout);
  await waitForExpect(() => {
    expect(
      store.getState().Identity.identities.entities[communityId].peerId.id
    ).toHaveLength(46);
  }, timeout);

  const userPeerId = store.getState().Identity.identities.entities[communityId].peerId.id

  store.dispatch(identityActions.registerUsername(userName));

  await waitForExpect(() => {
    expect(
      store.getState().Identity.identities.entities[communityId].userCertificate
    ).toBeTruthy();
  }, timeout);
  await waitForExpect(() => {
    expect(
      store.getState().Communities.communities.entities[communityId]
        .rootCa
    ).toEqual(ownerRootCA);
  }, timeout)

  await waitForExpect(() => {
    expect(
      store.getState().Communities.communities.entities[communityId]
        .peerList.length
    ).toEqual(expectedPeersCount);
  }, timeout)

  const peerList = store.getState().Communities.communities.entities[communityId]
  .peerList
  
  await waitForExpect(() => {
    expect(
      peerList[0]
    ).toMatch(new RegExp(ownerPeerId))
  }, timeout)

  await waitForExpect(() => {
    expect(
      peerList[peerList.length-1]
    ).toMatch(new RegExp(userPeerId))
  }, timeout)
}

export async function tryToJoinOfflineRegistrar(store) {
  const timeout = 50_000;
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

function* launchCommunitiesOnStartupSaga(communitiesAmount: number): Generator {
  yield* fork(assertNoErrors);
  yield* take(communitiesActions.launchRegistrar);
  yield* take(communitiesActions.responseRegistrar);
  yield* put(createAction('testFinished')());
}

const testLaunchCommunitiesOnStartup = async (testCase) => {
  const community = new Community({
    name: 'communityName',
    id: 'id',
    CA: {
      rootCertString: "MIIBTTCB8wIBATAKBggqhkjOPQQDAjASMRAwDgYDVQQDEwdaYmF5IENBMB4XDTEwMTIyODEwMTAxMFoXDTMwMTIyODEwMTAxMFowEjEQMA4GA1UEAxMHWmJheSBDQTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABPX+UupXOLEZGsM+2ZSTBLnn1tYTraMW2jqz+PLd8iuxPnXlf17sYUMh+xRkwr0ZK0gFJzM0WojewpDPF4RHFLqjPzA9MA8GA1UdEwQIMAYBAf8CAQMwCwYDVR0PBAQDAgCGMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATAKBggqhkjOPQQDAgNJADBGAiEAklQrkfh6RLNj+dawO5bOU1AffnGR8liq/fSr0U5sSn0CIQCRhfZxIxM1qDveJGtY0wNCpHZEl+UnXn9U7XOsMu/wYA==",
      rootKeyString: "MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgRMHbInrFakg3vXEsHX1aKTlj+3LxXsYNYpsmHQYl8begCgYIKoZIzj0DAQehRANCAAT1/lLqVzixGRrDPtmUkwS559bWE62jFto6s/jy3fIrsT515X9e7GFDIfsUZMK9GStIBSczNFqI3sKQzxeERxS6"
    },
    registrarUrl: '',
  });

  const identity = new Identity({
    id: 'id',
    hiddenService: {
      onionAddress:
        'ugmx77q2tnm5fliyfxfeen5hsuzjtbsz44tsldui2ju7vl5xj4d447yd',
      privateKey:
        'ED25519-V3:eECPVkKQxx0SADnjaqAxheH797Q79D0DqGu8Pbc83mpfaZSujZdxqJ6r5ZwUDWCYAegWx2xNkMt7zUKXyxKOuQ==',
    },
    peerId: {
      id: 'QmPdB7oUGiDEz3oanj58Eba595H2dtNiKtW7bNTrBey5Az',
      privKey:
        'CAASqAkwggSkAgEAAoIBAQCUGW9AvS5miIuhu2xk+OiaQpaTBPDjS22KOi2KfXXFfzwyZvduO0ZsOE5HxoGQ/kqL4QR2RhbTCZ8CNdkWPDR/s8fb7JGVRLkoexLzgMNs7OFg0JFy9AjmZ/vspE6y3irr/DH3bp/qiHTWiSvOGMaws3Ma74mqUyBKfK+hIri0/1xHGWNcIyhhjMy7f/ulZCOyd+G/jPA54BI36dSprzWSxdHbpcjAJo95OID9Y4HLOWP3BeMCodzslWpkPg+F9x4XjiXoFTgfGQqi3JpWNdgWHzpAQVgOGv5DO1a+OOKxjakAnFXgmg0CnbnzQR7oIHeutizz2MSmhrrKcG5WaDyBAgMBAAECggEAXUbrwE2m9ONZdqLyMWJoNghsh+qbwbzXIDFmT4yXaa2qf2BExQPGZhDMlP5cyrKuxw0RX2DjrUWpBZ5evVdsBWZ5IXYNd4NST0G8/OsDqw5DIVQb19gF5wBlNnWCL7woMnukCOB/Dhul4x2AHo2STuanP7bQ8RrsAp4njAivZydZADv2Xo4+ll+CBquJOHRMjcIqXzaKLoXTf80euskHfizFT4cFsI6oZygx8yqstoz2SBj2Qr3hvkUmSBFhE+dChIRrpcYuuz0JPpUTBmGgCLdKarUJHH1GJ4+wc6YU9YmJJ3kqyR+h/oVGaB1j4YOd5ubtJAIvf7uj0Ofhq1FJhQKBgQDrgsrUAZCafk81HAU25EmfrvH0jbTvZ7LmM86lntov8viOUDVk31F3u+CWGP7L/UomMIiveqO8J9OpQCvK8/AgIahtcB6rYyyb7XGLBn+njfVzdg8e2S4G91USeNuugYtwgpylkotOaAZrmiLgl415UgJvhAaOf+sMzV5xLREWMwKBgQCg+9iU7rDpgx8Tcd9tf5hGCwK9sorC004ffxtMXa+nN1I+gCfQH9eypFbmVnAo6YRQS02sUr9kSfB1U4f7Hk1VH/Wu+nRJNdTfz4uV5e65dSIo3kga8aTZ8YTIlqtDwcVv0GDCxDcstpdmR3scua0p2Oq22cYrmHOBgSGgdX0mewKBgQCPm/rImoet3ZW5IfQAC+blK424/Ww2jDpn63F4Rsxvbq6oQTq93vtTksoZXPaKN1KuxOukbZlIU9TaoRnTMTrcrQmCalsZUWlTT8/r4bOX3ZWtqXEA85gAgXNrxyzWVYJMwih5QkoWLpKzrJLV9zQ6pYp8q7o/zLrs3JJZWwzPRwKBgDrHWfAfKvdICfu2k0bO1NGWSZzr6OBz+M1lQplih7U9bMknT+IdDkvK13Po0bEOemI67JRj7j/3A1ZDdp4JFWFkdvc5uWXVwvEpPaUwvDZ4/0z+xEMaQf/VwI7g/I2T3bwS0JGsxRyNWsBcjyYQ4Zoq+qBi6YmXc20wsg99doGrAoGBAIXD8SW9TNhbo3uGK0Tz7y8bdYT4M9krM53M7I62zU6yLMZLTZHX1qXjbAFhEU5wVm6Mq0m83r1fiwnTrBQbn1JBtEIaxCeQ2ZH7jWmAaAOQ2z3qrHenD41WQJBzpWh9q/tn9JKD1KiWykQDfEnMgBt9+W/g3VgAF+CnR+feX6aH',
      pubKey:
        'CAASpgIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCUGW9AvS5miIuhu2xk+OiaQpaTBPDjS22KOi2KfXXFfzwyZvduO0ZsOE5HxoGQ/kqL4QR2RhbTCZ8CNdkWPDR/s8fb7JGVRLkoexLzgMNs7OFg0JFy9AjmZ/vspE6y3irr/DH3bp/qiHTWiSvOGMaws3Ma74mqUyBKfK+hIri0/1xHGWNcIyhhjMy7f/ulZCOyd+G/jPA54BI36dSprzWSxdHbpcjAJo95OID9Y4HLOWP3BeMCodzslWpkPg+F9x4XjiXoFTgfGQqi3JpWNdgWHzpAQVgOGv5DO1a+OOKxjakAnFXgmg0CnbnzQR7oIHeutizz2MSmhrrKcG5WaDyBAgMBAAE=',
    },
    dmKeys: {
      publicKey:
        '0bd934b164fdbf09a2675233bd9d5c396ce3a5944f92485c8c98b72ec3148f51',
      privateKey:
        '51da400fb7323793604ec204c60f3e1c96b1b3023d2eadc515376e37faf4b9f8',
    },
  });

  const userCsr: UserCsr = await createUserCsr({
    zbayNickname: 'holmes',
    commonName: 'vwikdxgxlsangu3cajkxhltl6goxtll75heg6qcx5wwicg3r5gcunyyd',
    peerId: 'QmdC8GmN2ZQPquaMsSJScJ3PrfZsG8B4Szw16hmDSCBNb9',
    dmPublicKey: '9d1832bd9fb8154be6975046a41538a71f3505d508dc8f286850445080e054a6',
    signAlg: config.signAlg,
    hashAlg: config.hashAlg,
  })

  identity.userCsr = userCsr;
  identity.userCertificate =
    'MIICDjCCAbMCBgF8o6yIiTAKBggqhkjOPQQDAjASMRAwDgYDVQQDEwdaYmF5IENBMB4XDTIxMTAyMTE2MjYwNVoXDTMwMDEzMTIzMDAwMFowSTFHMEUGA1UEAxM+cDd3aXVhdHlwdHc0bmdncWo3dXAzdXg2enltNGhqanB1bTU1d2VqdGd5bWsybndzcGxic2h0eWQub25pb24wWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAS2dbszx01KQW10y9xnwMHUOR5DfxDLekYtS5kxxUlG6W/gN+OtsGAhdhBqrQ9WwOsKgXE6J2gJFCtPUEdVGMnho4HCMIG/MAkGA1UdEwQCMAAwCwYDVR0PBAQDAgCOMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATAvBgkqhkiG9w0BCQwEIgQgC9k0sWT9vwmiZ1IzvZ1cOWzjpZRPkkhcjJi3LsMUj1EwFgYKKwYBBAGDjBsCAQQIEwZ3aWt0b3IwPQYJKwYBAgEPAwEBBDATLlFtZGk4YlUzR1B0aHRudjJMQVpIcFE5eW1YRzhtQWY5ZHFnbVU1c2M3cGZUaHMwCgYIKoZIzj0EAwIDSQAwRgIhANOMmwDQ8P9nlYHiGDSV8xPO06UU3AqJgsdUS6YZhMUMAiEAu5ftYuNPnRWzRGv5kX4HaeNtvIUIUPAMhCnZ5r+r1l0=';

  const app = await createApp({
    [StoreKeys.Communities]: {
      ...new CommunitiesState(),
      currentCommunity: 'id',
      communities: {
        ...communitiesAdapter.setAll(communitiesAdapter.getInitialState(), [
          community,
        ]),
      },
    },
    [StoreKeys.Identity]: {
      ...new IdentityState(),
      identities: {
        ...identityAdapter.setAll(identityAdapter.getInitialState(), [
          identity,
        ]),
      },
    },
  });

  watchResults(
    [app],
    app,
    'Community and registrar are launched when user reopens the app'
  );
  app.runSaga(integrationTest, launchCommunitiesOnStartupSaga)
};
