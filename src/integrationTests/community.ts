import { createAction, Store } from '@reduxjs/toolkit';
import assert from 'assert';
import React from 'react';
import { publicChannelsSelectors } from '../sagas/publicChannels/publicChannels.selectors';
import { StoreKeys } from '../sagas/store.keys';
import {
  delay,
  fork,
  put,
  select,
  take,
  call,
  spawn,
  takeEvery,
} from 'typed-redux-saga';
import waitForExpect from 'wait-for-expect';
import { identity } from '../index';
import { communitiesAdapter } from '../sagas/communities/communities.adapter';
import { communitiesSelectors } from '../sagas/communities/communities.selectors';
import { createCommunitySaga } from '../sagas/communities/createCommunity/createCommunity.saga';
import {
  communitiesActions,
  CommunitiesState,
  Community,
} from '../sagas/communities/communities.slice';
import { errorsSelectors } from '../sagas/errors/errors.selectors';
import { errorsActions } from '../sagas/errors/errors.slice';
import { identitySelectors } from '../sagas/identity/identity.selectors';
import {
  Identity,
  identityActions,
  IdentityState,
} from '../sagas/identity/identity.slice';
import { SocketActionTypes } from '../sagas/socket/const/actionTypes';
import { usersSelectors } from '../sagas/users/users.selectors';
import logger from '../utils/logger';

import {
  assertListElementMatches,
  assertNoErrors,
  assertNotEmpty,
  createApp,
  createAppWithoutTor,
  finishTestSaga,
  integrationTest,
  userIsReady,
  watchResults,
} from './utils';
import { identityAdapter } from '../sagas/identity/identity.adapter';
import { UserCsr } from '@zbayapp/identity/lib/requestCertificate';
import { publicChannelsActions } from '../sagas/publicChannels/publicChannels.slice';


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
      store.getState().PublicChannels.entities[communityId].channels.ids
    ).toHaveLength(expectedCount);
  }, maxTime);

  log(
    `User ${userName} received ${
      store.getState().PublicChannels.entities[communityId].channels.ids.length
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

  // console.log(store.getState().Communities.communities.entities[communityId], 'Communities')
  // console.log(store.getState().Identity.identities.entities[communityId], 'Identity')
  // console.log(store.getState().PublicChannels.entities[communityId].channels.entities['general'], 'PublicChannels')

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

  const timeout = 50_000;

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

  // console.log(store.getState().Communities.communities.entities[communityId], 'Communities')
  // console.log(store.getState().Identity.identities.entities[communityId], 'Identity')
  // console.log(store.getState().PublicChannels.entities[communityId].channels.entities['general'], 'PublicChannels')

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

  // yield* take(identityActions.storeUserCertificate);
  // yield* take(communitiesActions.community);
  // const currentCommunity = yield* select(communitiesSelectors.currentCommunity);
  // const createdIdentity = yield* select(identitySelectors.currentIdentity);

  // assert.equal(
  //   currentCommunity.rootCa,
  //   ownerRootCA,
  //   'User joining community should have the same rootCA as the owner'
  // );
  // assert.notEqual(
  //   currentCommunity.peerList,
  //   undefined,
  //   'User joining community should have a list of peers to connect to'
  // );
  // assert(
  //   currentCommunity.peerList.length >= expectedPeersCount,
  //   `User joining community should receive a list of ${expectedPeersCount} peers to connect to, received ${currentCommunity.peerList.length}.`
  // );
  // assertListElementMatches(currentCommunity.peerList, new RegExp(ownerPeerId));
  // assertListElementMatches(
  //   currentCommunity.peerList,
  //   new RegExp(createdIdentity.peerId.id)
  // );
  // assert.equal(createdIdentity.zbayNickname, userName);
  // assert.equal(createdIdentity.id, currentCommunity.id);
  // assertNotEmpty(createdIdentity.peerId, 'Identity.peerId');
  // assertNotEmpty(createdIdentity.userCertificate, 'Identity.userCertificate');
  // assertNotEmpty(createdIdentity.hiddenService, 'Identity.hiddenService');
}

const sleep = (time) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, time)
  })
}

export async function tryToJoinOfflineRegistrar(store) {

  const timeout = 50_000
  const userName = 'userName'

store.dispatch(communitiesActions.joinCommunity('yjnblkcrvqexxmntrs7hscywgebrizvz2jx4g4m5wq4x7uzi5syv5cid'))

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

  await sleep(50_000)

  console.log(store.getState(), 'Errors')

  const registrarError = null

  // yield* take(errorsActions.addError);
  // const registrarError = (yield* select(
  //   errorsSelectors.currentCommunityErrorsByType
  // ))[SocketActionTypes.REGISTRAR];
  // assertNotEmpty(registrarError, 'Registrar error');
  // assert.equal(registrarError.communityId, currentCommunityId);
  // assert.equal(registrarError.code, 500);
  // assert.equal(registrarError.message, 'Registering username failed.');
}

// function* launchCommunitiesOnStartupSaga(communitiesAmount: number): Generator {
//   yield* fork(assertNoErrors);
//   yield* take(communitiesActions.launchRegistrar);
//   yield* take(communitiesActions.responseRegistrar);
//   // TODO: add assertions
//   yield* put(createAction('testFinished')());
// }

// const testLaunchCommunitiesOnStartup = async (testCase) => {
//   const community = new Community({
//     name: 'communityName',
//     id: 'id',
//     CA: {
//       rootCertString: "MIIBTTCB8wIBATAKBggqhkjOPQQDAjASMRAwDgYDVQQDEwdaYmF5IENBMB4XDTEwMTIyODEwMTAxMFoXDTMwMTIyODEwMTAxMFowEjEQMA4GA1UEAxMHWmJheSBDQTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABPX+UupXOLEZGsM+2ZSTBLnn1tYTraMW2jqz+PLd8iuxPnXlf17sYUMh+xRkwr0ZK0gFJzM0WojewpDPF4RHFLqjPzA9MA8GA1UdEwQIMAYBAf8CAQMwCwYDVR0PBAQDAgCGMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATAKBggqhkjOPQQDAgNJADBGAiEAklQrkfh6RLNj+dawO5bOU1AffnGR8liq/fSr0U5sSn0CIQCRhfZxIxM1qDveJGtY0wNCpHZEl+UnXn9U7XOsMu/wYA==",
//       rootKeyString: "MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgRMHbInrFakg3vXEsHX1aKTlj+3LxXsYNYpsmHQYl8begCgYIKoZIzj0DAQehRANCAAT1/lLqVzixGRrDPtmUkwS559bWE62jFto6s/jy3fIrsT515X9e7GFDIfsUZMK9GStIBSczNFqI3sKQzxeERxS6"
//     },
//     registrarUrl: '',
//   });

//   const identity = new Identity({
//     id: 'id',
//     hiddenService: {
//       onionAddress:
//         'ugmx77q2tnm5fliyfxfeen5hsuzjtbsz44tsldui2ju7vl5xj4d447yd',
//       privateKey:
//         'ED25519-V3:eECPVkKQxx0SADnjaqAxheH797Q79D0DqGu8Pbc83mpfaZSujZdxqJ6r5ZwUDWCYAegWx2xNkMt7zUKXyxKOuQ==',
//     },
//     peerId: {
//       id: 'QmPdB7oUGiDEz3oanj58Eba595H2dtNiKtW7bNTrBey5Az',
//       privKey:
//         'CAASqAkwggSkAgEAAoIBAQCUGW9AvS5miIuhu2xk+OiaQpaTBPDjS22KOi2KfXXFfzwyZvduO0ZsOE5HxoGQ/kqL4QR2RhbTCZ8CNdkWPDR/s8fb7JGVRLkoexLzgMNs7OFg0JFy9AjmZ/vspE6y3irr/DH3bp/qiHTWiSvOGMaws3Ma74mqUyBKfK+hIri0/1xHGWNcIyhhjMy7f/ulZCOyd+G/jPA54BI36dSprzWSxdHbpcjAJo95OID9Y4HLOWP3BeMCodzslWpkPg+F9x4XjiXoFTgfGQqi3JpWNdgWHzpAQVgOGv5DO1a+OOKxjakAnFXgmg0CnbnzQR7oIHeutizz2MSmhrrKcG5WaDyBAgMBAAECggEAXUbrwE2m9ONZdqLyMWJoNghsh+qbwbzXIDFmT4yXaa2qf2BExQPGZhDMlP5cyrKuxw0RX2DjrUWpBZ5evVdsBWZ5IXYNd4NST0G8/OsDqw5DIVQb19gF5wBlNnWCL7woMnukCOB/Dhul4x2AHo2STuanP7bQ8RrsAp4njAivZydZADv2Xo4+ll+CBquJOHRMjcIqXzaKLoXTf80euskHfizFT4cFsI6oZygx8yqstoz2SBj2Qr3hvkUmSBFhE+dChIRrpcYuuz0JPpUTBmGgCLdKarUJHH1GJ4+wc6YU9YmJJ3kqyR+h/oVGaB1j4YOd5ubtJAIvf7uj0Ofhq1FJhQKBgQDrgsrUAZCafk81HAU25EmfrvH0jbTvZ7LmM86lntov8viOUDVk31F3u+CWGP7L/UomMIiveqO8J9OpQCvK8/AgIahtcB6rYyyb7XGLBn+njfVzdg8e2S4G91USeNuugYtwgpylkotOaAZrmiLgl415UgJvhAaOf+sMzV5xLREWMwKBgQCg+9iU7rDpgx8Tcd9tf5hGCwK9sorC004ffxtMXa+nN1I+gCfQH9eypFbmVnAo6YRQS02sUr9kSfB1U4f7Hk1VH/Wu+nRJNdTfz4uV5e65dSIo3kga8aTZ8YTIlqtDwcVv0GDCxDcstpdmR3scua0p2Oq22cYrmHOBgSGgdX0mewKBgQCPm/rImoet3ZW5IfQAC+blK424/Ww2jDpn63F4Rsxvbq6oQTq93vtTksoZXPaKN1KuxOukbZlIU9TaoRnTMTrcrQmCalsZUWlTT8/r4bOX3ZWtqXEA85gAgXNrxyzWVYJMwih5QkoWLpKzrJLV9zQ6pYp8q7o/zLrs3JJZWwzPRwKBgDrHWfAfKvdICfu2k0bO1NGWSZzr6OBz+M1lQplih7U9bMknT+IdDkvK13Po0bEOemI67JRj7j/3A1ZDdp4JFWFkdvc5uWXVwvEpPaUwvDZ4/0z+xEMaQf/VwI7g/I2T3bwS0JGsxRyNWsBcjyYQ4Zoq+qBi6YmXc20wsg99doGrAoGBAIXD8SW9TNhbo3uGK0Tz7y8bdYT4M9krM53M7I62zU6yLMZLTZHX1qXjbAFhEU5wVm6Mq0m83r1fiwnTrBQbn1JBtEIaxCeQ2ZH7jWmAaAOQ2z3qrHenD41WQJBzpWh9q/tn9JKD1KiWykQDfEnMgBt9+W/g3VgAF+CnR+feX6aH',
//       pubKey:
//         'CAASpgIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCUGW9AvS5miIuhu2xk+OiaQpaTBPDjS22KOi2KfXXFfzwyZvduO0ZsOE5HxoGQ/kqL4QR2RhbTCZ8CNdkWPDR/s8fb7JGVRLkoexLzgMNs7OFg0JFy9AjmZ/vspE6y3irr/DH3bp/qiHTWiSvOGMaws3Ma74mqUyBKfK+hIri0/1xHGWNcIyhhjMy7f/ulZCOyd+G/jPA54BI36dSprzWSxdHbpcjAJo95OID9Y4HLOWP3BeMCodzslWpkPg+F9x4XjiXoFTgfGQqi3JpWNdgWHzpAQVgOGv5DO1a+OOKxjakAnFXgmg0CnbnzQR7oIHeutizz2MSmhrrKcG5WaDyBAgMBAAE=',
//     },
//     dmKeys: {
//       publicKey:
//         '0bd934b164fdbf09a2675233bd9d5c396ce3a5944f92485c8c98b72ec3148f51',
//       privateKey:
//         '51da400fb7323793604ec204c60f3e1c96b1b3023d2eadc515376e37faf4b9f8',
//     },
//   });

//   const userCsr: UserCsr = {
//     userCsr:
//       'MIIBvTCCAWQCAQAwSTFHMEUGA1UEAxM+cDd3aXVhdHlwdHc0bmdncWo3dXAzdXg2enltNGhqanB1bTU1d2VqdGd5bWsybndzcGxic2h0eWQub25pb24wWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAS2dbszx01KQW10y9xnwMHUOR5DfxDLekYtS5kxxUlG6W/gN+OtsGAhdhBqrQ9WwOsKgXE6J2gJFCtPUEdVGMnhoIG4MC4GCSqGSIb3DQEJDjEhMB8wHQYDVR0OBBYEFClOosI71OA1gofy9ufJomWeNDmBMC8GCSqGSIb3DQEJDDEiBCAL2TSxZP2/CaJnUjO9nVw5bOOllE+SSFyMmLcuwxSPUTAWBgorBgEEAYOMGwIBMQgTBndpa3RvcjA9BgkrBgECAQ8DAQExMBMuUW1kaThiVTNHUHRodG52MkxBWkhwUTl5bVhHOG1BZjlkcWdtVTVzYzdwZlRoczAKBggqhkjOPQQDAgNHADBEAiBvYm3pcvTfJnX8jY2TU/6qW+yxsW4Y54300NLUbtaTwwIgAMt1DicoacfkGHIIR0GGMzm/TiBy6HQ2RlKG7zr1P60=',
//     userKey:
//       'MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgrW84gHtf8i01krddbjAbhB3AB27xsGV+iUeNqZiKc+CgCgYIKoZIzj0DAQehRANCAAS2dbszx01KQW10y9xnwMHUOR5DfxDLekYtS5kxxUlG6W/gN+OtsGAhdhBqrQ9WwOsKgXE6J2gJFCtPUEdVGMnh',
//     pkcs10: {
//       publicKey: {},
//       privateKey: {},
//       pkcs10: {
//         tbs: '308201640201003049314730450603550403133E7037776975617479707477346E6767716A377570337578367A796D34686A6A70756D353577656A7467796D6B326E7773706C6273687479642E6F6E696F6E3059301306072A8648CE3D020106082A8648CE3D03010703420004B675BB33C74D4A416D74CBDC67C0C1D4391E437F10CB7A462D4B9931C54946E96FE037E3ADB0602176106AAD0F56C0EB0A81713A276809142B4F50475518C9E1A081B8302E06092A864886F70D01090E3121301F301D0603551D0E04160414294EA2C23BD4E0358287F2F6E7C9A2659E343981302F06092A864886F70D01090C312204200BD934B164FDBF09A2675233BD9D5C396CE3A5944F92485C8C98B72EC3148F513016060A2B06010401838C1B02013108130677696B746F72303D06092B060102010F0301013130132E516D64693862553347507468746E76324C415A48705139796D5847386D4166396471676D55357363377066546873',
//         version: 0,
//         subject: {
//           typesAndValues: [
//             {
//               type: '2.5.4.3',
//               value: {
//                 blockName: 'PrintableString',
//                 blockLength: 0,
//                 error: '',
//                 warnings: [],
//                 valueBeforeDecode: '',
//                 idBlock: {
//                   blockName: 'identificationBlock',
//                   blockLength: 0,
//                   error: '',
//                   warnings: [],
//                   valueBeforeDecode: '',
//                   isHexOnly: false,
//                   valueHex: '',
//                   tagClass: 1,
//                   tagNumber: 19,
//                   isConstructed: false,
//                 },
//                 lenBlock: {
//                   blockName: 'lengthBlock',
//                   blockLength: 0,
//                   error: '',
//                   warnings: [],
//                   valueBeforeDecode: '',
//                   isIndefiniteForm: false,
//                   longFormUsed: false,
//                   length: 62,
//                 },
//                 valueBlock: {
//                   blockName: 'SimpleStringValueBlock',
//                   blockLength: 0,
//                   error: '',
//                   warnings: [],
//                   valueBeforeDecode: '',
//                   isHexOnly: true,
//                   valueHex:
//                     '7037776975617479707477346E6767716A377570337578367A796D34686A6A70756D353577656A7467796D6B326E7773706C6273687479642E6F6E696F6E',
//                   value:
//                     'p7wiuatyptw4nggqj7up3ux6zym4hjjpum55wejtgymk2nwsplbshtyd.onion',
//                 },
//               },
//             },
//           ],
//         },
//       },
//     },
//   };

//   identity.userCsr = userCsr;
//   identity.userCertificate =
//     'MIICDjCCAbMCBgF8o6yIiTAKBggqhkjOPQQDAjASMRAwDgYDVQQDEwdaYmF5IENBMB4XDTIxMTAyMTE2MjYwNVoXDTMwMDEzMTIzMDAwMFowSTFHMEUGA1UEAxM+cDd3aXVhdHlwdHc0bmdncWo3dXAzdXg2enltNGhqanB1bTU1d2VqdGd5bWsybndzcGxic2h0eWQub25pb24wWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAS2dbszx01KQW10y9xnwMHUOR5DfxDLekYtS5kxxUlG6W/gN+OtsGAhdhBqrQ9WwOsKgXE6J2gJFCtPUEdVGMnho4HCMIG/MAkGA1UdEwQCMAAwCwYDVR0PBAQDAgCOMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATAvBgkqhkiG9w0BCQwEIgQgC9k0sWT9vwmiZ1IzvZ1cOWzjpZRPkkhcjJi3LsMUj1EwFgYKKwYBBAGDjBsCAQQIEwZ3aWt0b3IwPQYJKwYBAgEPAwEBBDATLlFtZGk4YlUzR1B0aHRudjJMQVpIcFE5eW1YRzhtQWY5ZHFnbVU1c2M3cGZUaHMwCgYIKoZIzj0EAwIDSQAwRgIhANOMmwDQ8P9nlYHiGDSV8xPO06UU3AqJgsdUS6YZhMUMAiEAu5ftYuNPnRWzRGv5kX4HaeNtvIUIUPAMhCnZ5r+r1l0=';

//   const app = await createApp({
//     [StoreKeys.Communities]: {
//       ...new CommunitiesState(),
//       currentCommunity: 'id',
//       communities: {
//         ...communitiesAdapter.setAll(communitiesAdapter.getInitialState(), [
//           community,
//         ]),
//       },
//     },
//     [StoreKeys.Identity]: {
//       ...new IdentityState(),
//       identities: {
//         ...identityAdapter.setAll(identityAdapter.getInitialState(), [
//           identity,
//         ]),
//       },
//     },
//   });

//   watchResults(
//     [app],
//     app,
//     'Community and registrar are launched when user reopens the app'
//   );
//   app.runSaga(integrationTest, launchCommunitiesOnStartupSaga)
// };