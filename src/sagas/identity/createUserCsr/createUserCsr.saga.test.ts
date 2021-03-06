import { expectSaga } from 'redux-saga-test-plan';
import { combineReducers } from '@reduxjs/toolkit';
import { call } from 'redux-saga-test-plan/matchers';
import { createUserCsr } from '@zbayapp/identity';
import { KeyObject } from 'crypto';
import { StoreKeys } from '../../store.keys';
import { createUserCsrSaga } from './createUserCsr.saga';
import {
  CreateUserCsrPayload,
  identityActions,
  identityReducer,
  Identity,
  IdentityState,
} from '../identity.slice';

import { identityAdapter } from '../identity.adapter';
import {
  communitiesReducer,
  CommunitiesState,
  Community,
} from '../../communities/communities.slice';

describe('createUserCsrSaga', () => {
  const userCsr = {
    userCsr: 'userCsr',
    userKey: 'userKey',
    pkcs10: {
      publicKey: jest.fn() as unknown as KeyObject,
      privateKey: jest.fn() as unknown as KeyObject,
      pkcs10: 'pkcs10',
    },
  };

  test('create csr', async () => {
    const community: Community = {
      name: '',
      id: 'id',
      registrarUrl: 'registrarUrl',
      CA: null,
      rootCa: '',
      peerList: [],
      registrar: null,
      onionAddress: '',
      privateKey: '',
      port: 0,
    };
    const identity: Identity = {
      id: 'id',
      zbayNickname: '',
      hiddenService: { onionAddress: 'onionAddress', privateKey: 'privateKey' },
      dmKeys: { publicKey: 'publicKey', privateKey: 'privateKey' },
      peerId: { id: 'peerId', pubKey: 'pubKey', privKey: 'privKey' },
      userCsr: undefined,
      userCertificate: null,
    };
    const identityWithCsr: Identity = {
      id: 'id',
      zbayNickname: '',
      hiddenService: { onionAddress: 'onionAddress', privateKey: 'privateKey' },
      dmKeys: { publicKey: 'publicKey', privateKey: 'privateKey' },
      peerId: { id: 'peerId', pubKey: 'pubKey', privKey: 'privKey' },
      userCsr: userCsr,
      userCertificate: null,
    } as Identity;
    await expectSaga(
      createUserCsrSaga,
      identityActions.createUserCsr(<CreateUserCsrPayload>{})
    )
      .withReducer(
        combineReducers({
          [StoreKeys.Identity]: identityReducer,
          [StoreKeys.Communities]: communitiesReducer,
        }),
        {
          [StoreKeys.Identity]: {
            ...new IdentityState(),
            identities: identityAdapter.setAll(
              identityAdapter.getInitialState(),
              [identity]
            ),
          },
          [StoreKeys.Communities]: {
            ...new CommunitiesState(),
            currentCommunity: 'id',
            communities: {
              ids: ['id'],
              entities: {
                [community.id]: community,
              },
            },
          },
        }
      )
      .provide([[call.fn(createUserCsr), userCsr]])
      .hasFinalState({
        [StoreKeys.Identity]: {
          ...new IdentityState(),
          identities: identityAdapter.setAll(
            identityAdapter.getInitialState(),
            [identityWithCsr]
          ),
        },
        [StoreKeys.Communities]: {
          ...new CommunitiesState(),
          currentCommunity: 'id',
          communities: {
            ids: ['id'],
            entities: {
              [community.id]: community,
            },
          },
        },
      })
      .run();
  });
});
