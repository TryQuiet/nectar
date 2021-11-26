import { combineReducers } from '@reduxjs/toolkit';
import { expectSaga } from 'redux-saga-test-plan';
import { StoreKeys } from '../../store.keys';
import {
  identityActions,
  identityReducer,
  Identity,
  IdentityState,
} from '../identity.slice';
import { identityAdapter } from '../identity.adapter';
import { registerUsernameSaga } from './registerUsername.saga';
import { config } from '../../users/const/certFieldTypes';
import { errorsReducer } from '../../errors/errors.slice';
import {
  communitiesReducer,
  CommunitiesState,
  Community,
} from '../../communities/communities.slice';
import { communitiesAdapter } from '../../communities/communities.adapter';
import { errorsAdapter } from '../../errors/errors.adapter';

describe('registerUsernameSaga', () => {
  const identity: Identity = {
    id: 'id',
    hiddenService: {
      onionAddress: 'onionAddress.onion',
      privateKey: 'privateKey',
    },
    dmKeys: { publicKey: 'publicKey', privateKey: 'privateKey' },
    peerId: { id: 'peerId', pubKey: 'pubKey', privKey: 'privKey' },
    zbayNickname: '',
    userCsr: undefined,
    userCertificate: ''
  };
  const identityWithoutPeerId: Identity = {
    id: 'id',
    hiddenService: {
      onionAddress: 'onionAddress.onion',
      privateKey: 'privateKey',
    },
    dmKeys: { publicKey: 'publicKey', privateKey: 'privateKey' },
    peerId: { id: '', pubKey: 'pubKey', privKey: 'privKey' },
    zbayNickname: '',
    userCsr: undefined,
    userCertificate: ''
  };
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
    port: 0
  };

  const connectionError = {
    communityId: 'id',
    type: 'registrar',
    code: 403,
    message: "You're not connected with other peers.",
  };

  const username = 'username';

  test('create user csr', () =>
    expectSaga(registerUsernameSaga, identityActions.registerUsername(username))
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
            communities: communitiesAdapter.setAll(
              communitiesAdapter.getInitialState(),
              [community]
            ),
          },
        }
      )
      .put(
        identityActions.updateUsername({
          communityId: identity.id,
          nickname: username,
        })
      )
      .put(
        identityActions.createUserCsr({
          zbayNickname: username,
          commonName: 'onionAddress.onion',
          peerId: 'peerId',
          dmPublicKey: 'publicKey',
          signAlg: config.signAlg,
          hashAlg: config.hashAlg,
        })
      )
      .run());
  test('throw error if missing data', () =>
    expectSaga(
      registerUsernameSaga,
      identityActions.registerUsername('username')
    )
      .withReducer(
        combineReducers({
          [StoreKeys.Identity]: identityReducer,
          [StoreKeys.Communities]: communitiesReducer,
          [StoreKeys.Errors]: errorsReducer,
        }),
        {
          [StoreKeys.Identity]: {
            ...new IdentityState(),
            identities: identityAdapter.setAll(
              identityAdapter.getInitialState(),
              [identityWithoutPeerId]
            ),
          },
          [StoreKeys.Communities]: {
            ...new CommunitiesState(),
            currentCommunity: 'id',
            communities: communitiesAdapter.setAll(
              communitiesAdapter.getInitialState(),
              [community]
            ),
          },
          [StoreKeys.Errors]: {},
        }
      )
      // .put(
      //   errorsActions.addError(connectionError)
      // )
      .hasFinalState({
        [StoreKeys.Identity]: {
          ...new IdentityState(),
          identities: identityAdapter.setAll(
            identityAdapter.getInitialState(),
            [identityWithoutPeerId]
          ),
        },
        [StoreKeys.Communities]: {
          ...new CommunitiesState(),
          currentCommunity: 'id',
          communities: communitiesAdapter.setAll(
            communitiesAdapter.getInitialState(),
            [community]
          ),
        },
        [StoreKeys.Errors]: {
          ['id']: {
            ...errorsAdapter.setAll(errorsAdapter.getInitialState(), [
              connectionError,
            ]),
          },
        },
      })
      .run());
});
