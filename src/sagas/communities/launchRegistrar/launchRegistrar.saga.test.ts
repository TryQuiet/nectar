import { expectSaga } from 'redux-saga-test-plan';
import { Socket } from 'socket.io-client';
import { SocketActionTypes } from '../../socket/const/actionTypes';
import { identityAdapter } from '../../identity/identity.adapter';
import { initRegistrars, launchRegistrarSaga } from './launchRegistrar.saga';
import { combineReducers } from '@reduxjs/toolkit';
import { StoreKeys } from '../../store.keys';
import {
  communitiesActions,
  communitiesReducer,
  Community,
  CommunitiesState,
} from '../communities.slice';
import { communitiesAdapter } from '../communities.adapter';
import { Identity, identityReducer } from '../../identity/identity.slice';

describe('launchRegistrar', () => {
  test('launch all owned registrars', async () => {
    const community1 = new Community({
      name: '',
      id: 'id-1',
      registrarUrl: 'registrarUrl',
      CA: { rootCertString: 'certString', rootKeyString: 'keyString' },
    });

    const community2 = new Community({
      name: '',
      id: 'id-2',
      registrarUrl: 'registrarUrl',
      CA: { rootCertString: 'certString', rootKeyString: 'keyString' },
    });

    const community3 = new Community({
      name: '',
      id: 'id-3',
      registrarUrl: 'registrarUrl',
      CA: undefined,
    });
    await expectSaga(initRegistrars)
      .withReducer(
        combineReducers({
          [StoreKeys.Communities]: communitiesReducer,
        }),
        {
          [StoreKeys.Communities]: {
            ...new CommunitiesState(),
            communities: communitiesAdapter.setAll(
              communitiesAdapter.getInitialState(),
              [community1, community2, community3]
            ),
          },
        }
      )
      .put(communitiesActions.launchRegistrar(community1.id))
      .put(communitiesActions.launchRegistrar(community2.id))
      .not.put(communitiesActions.launchRegistrar(community3.id))
      .run();
  });
  test("launch certain registrar instead of current community's registrar", async () => {
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket;
    const community = new Community({
      name: '',
      id: 'id',
      registrarUrl: 'registrarUrl',
      CA: { rootCertString: 'certString', rootKeyString: 'keyString' },
    });
    const identity = new Identity({
      id: 'id',
      hiddenService: { onionAddress: 'onionAddress', privateKey: 'privateKey' },
      dmKeys: { publicKey: 'publicKey', privateKey: 'privateKey' },
      peerId: { id: 'peerId', pubKey: 'pubKey', privKey: 'privKey' },
    });
    const launchRegistrarPayload = {
      id: 'id',
      peerId: { id: 'peerId', pubKey: 'pubKey', privKey: 'privKey' },
      hiddenService: { onionAddress: 'onionAddress', privateKey: 'privateKey' },
      CA: { rootCertString: 'certString', rootKeyString: 'keyString' },
      privateKey: '',
    };
    await expectSaga(
      launchRegistrarSaga,
      socket,
      communitiesActions.launchCommunity(community.id)
    )
      .withReducer(
        combineReducers({
          [StoreKeys.Communities]: communitiesReducer,
          [StoreKeys.Identity]: identityReducer,
        }),
        {
          [StoreKeys.Communities]: {
            ...new CommunitiesState(),
            currentCommunity: 'id-0',
            communities: communitiesAdapter.setAll(
              communitiesAdapter.getInitialState(),
              [community]
            ),
          },
          [StoreKeys.Identity]: {
            ...identityAdapter.setAll(identityAdapter.getInitialState(), [
              identity,
            ]),
          },
        }
      )
      .apply(socket, socket.emit, [
        SocketActionTypes.LAUNCH_REGISTRAR,
        launchRegistrarPayload.id,
        launchRegistrarPayload.peerId.id,
        launchRegistrarPayload.CA.rootCertString,
        launchRegistrarPayload.CA.rootKeyString,
        launchRegistrarPayload.privateKey,
      ])
      .run();
  });
  test('do not attempt to launch certain registrar if user is not community owner', async () => {
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket;
    const community = new Community({
      name: '',
      id: 'id',
      registrarUrl: 'registrarUrl',
      CA: {},
    });
    const identity = new Identity({
      id: 'id',
      hiddenService: { onionAddress: 'onionAddress', privateKey: 'privateKey' },
      dmKeys: { publicKey: 'publicKey', privateKey: 'privateKey' },
      peerId: { id: 'peerId', pubKey: 'pubKey', privKey: 'privKey' },
    });
    const launchRegistrarPayload = {
      id: 'id',
      peerId: { id: 'peerId', pubKey: 'pubKey', privKey: 'privKey' },
      hiddenService: { onionAddress: 'onionAddress', privateKey: 'privateKey' },
      CA: { rootCertString: 'certString', rootKeyString: 'keyString' },
      privateKey: '',
    };
    await expectSaga(
      launchRegistrarSaga,
      socket,
      communitiesActions.launchCommunity(community.id)
    )
      .withReducer(
        combineReducers({
          [StoreKeys.Communities]: communitiesReducer,
          [StoreKeys.Identity]: identityReducer,
        }),
        {
          [StoreKeys.Communities]: {
            ...new CommunitiesState(),
            currentCommunity: 'id-0',
            communities: communitiesAdapter.setAll(
              communitiesAdapter.getInitialState(),
              [community]
            ),
          },
          [StoreKeys.Identity]: {
            ...identityAdapter.setAll(identityAdapter.getInitialState(), [
              identity,
            ]),
          },
        }
      )
      .not.apply(socket, socket.emit, [
        SocketActionTypes.LAUNCH_REGISTRAR,
        launchRegistrarPayload.id,
        launchRegistrarPayload.peerId.id,
        launchRegistrarPayload.CA.rootCertString,
        launchRegistrarPayload.CA.rootKeyString,
        launchRegistrarPayload.privateKey,
      ])
      .run();
  });
  test("launch registrar if user is current community's owner", async () => {
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket;
    const community = new Community({
      name: '',
      id: 'id',
      registrarUrl: 'registrarUrl',
      CA: { rootCertString: 'certString', rootKeyString: 'keyString' },
    });
    const identity = new Identity({
      id: 'id',
      hiddenService: { onionAddress: 'onionAddress', privateKey: 'privateKey' },
      dmKeys: { publicKey: 'publicKey', privateKey: 'privateKey' },
      peerId: { id: 'peerId', pubKey: 'pubKey', privKey: 'privKey' },
    });
    const launchRegistrarPayload = {
      id: 'id',
      peerId: { id: 'peerId', pubKey: 'pubKey', privKey: 'privKey' },
      hiddenService: { onionAddress: 'onionAddress', privateKey: 'privateKey' },
      CA: { rootCertString: 'certString', rootKeyString: 'keyString' },
      privateKey: '',
    };
    await expectSaga(
      launchRegistrarSaga,
      socket,
      communitiesActions.launchCommunity()
    )
      .withReducer(
        combineReducers({
          [StoreKeys.Communities]: communitiesReducer,
          [StoreKeys.Identity]: identityReducer,
        }),
        {
          [StoreKeys.Communities]: {
            ...new CommunitiesState(),
            currentCommunity: 'id',
            communities: communitiesAdapter.setAll(
              communitiesAdapter.getInitialState(),
              [community]
            ),
          },
          [StoreKeys.Identity]: {
            ...identityAdapter.setAll(identityAdapter.getInitialState(), [
              identity,
            ]),
          },
        }
      )
      .apply(socket, socket.emit, [
        SocketActionTypes.LAUNCH_REGISTRAR,
        launchRegistrarPayload.id,
        launchRegistrarPayload.peerId.id,
        launchRegistrarPayload.CA.rootCertString,
        launchRegistrarPayload.CA.rootKeyString,
        launchRegistrarPayload.privateKey,
      ])
      .run();
  });
  test("do not attempt to launch registrar if user is not current community's owner", async () => {
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket;
    const community = new Community({
      name: '',
      id: 'id',
      registrarUrl: 'registrarUrl',
      CA: {},
    });
    const identity = new Identity({
      id: 'id',
      hiddenService: { onionAddress: 'onionAddress', privateKey: 'privateKey' },
      dmKeys: { publicKey: 'publicKey', privateKey: 'privateKey' },
      peerId: { id: 'peerId', pubKey: 'pubKey', privKey: 'privKey' },
    });
    const launchRegistrarPayload = {
      id: 'id',
      peerId: { id: 'peerId', pubKey: 'pubKey', privKey: 'privKey' },
      hiddenService: { onionAddress: 'onionAddress', privateKey: 'privateKey' },
      CA: { rootCertString: 'certString', rootKeyString: 'keyString' },
      privateKey: '',
    };
    await expectSaga(
      launchRegistrarSaga,
      socket,
      communitiesActions.launchCommunity()
    )
      .withReducer(
        combineReducers({
          [StoreKeys.Communities]: communitiesReducer,
          [StoreKeys.Identity]: identityReducer,
        }),
        {
          [StoreKeys.Communities]: {
            ...new CommunitiesState(),
            currentCommunity: 'id',
            communities: communitiesAdapter.setAll(
              communitiesAdapter.getInitialState(),
              [community]
            ),
          },
          [StoreKeys.Identity]: {
            ...identityAdapter.setAll(identityAdapter.getInitialState(), [
              identity,
            ]),
          },
        }
      )
      .not.apply(socket, socket.emit, [
        SocketActionTypes.LAUNCH_REGISTRAR,
        launchRegistrarPayload.id,
        launchRegistrarPayload.peerId.id,
        launchRegistrarPayload.CA.rootCertString,
        launchRegistrarPayload.CA.rootKeyString,
        launchRegistrarPayload.privateKey,
      ])
      .run();
  });
});
