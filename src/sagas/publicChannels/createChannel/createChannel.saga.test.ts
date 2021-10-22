import { combineReducers } from '@reduxjs/toolkit';
import { expectSaga } from 'redux-saga-test-plan';
import { StoreKeys } from '../../store.keys';
import { Socket } from 'socket.io-client';
import { SocketActionTypes } from '../../socket/const/actionTypes';

import {
  publicChannelsActions,
} from '../publicChannels.slice';
import {
  identityReducer, Identity
} from '../../identity/identity.slice';
import {
  Community,CommunitiesState, communitiesReducer
} from '../../communities/communities.slice';
import {
  communitiesAdapter
} from '../../communities/communities.adapter';
import {
  identityAdapter,
} from '../../identity/identity.adapter';
import { createChannelSaga } from './createChannel.saga';

describe('createChannelSaga', () => {

    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket;

    const channel = {
      name: 'general',
      description: 'desc',
      owner: 'Howdy',
      timestamp: Date.now(),
      address: 'address',
    };
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

    test('ask for missing messages', () => {
      expectSaga(createChannelSaga, socket, publicChannelsActions.createChannel({channel, communityId: 'communityId'}))
           .withReducer(
        combineReducers({
          [StoreKeys.Identity]: identityReducer, [StoreKeys.Communities]: communitiesReducer
        }),
        {
          [StoreKeys.Identity]: {
            ...identityAdapter.setAll(identityAdapter.getInitialState(), [
              identity,
            ]),
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
      .apply(socket, socket.emit, [
        SocketActionTypes.SUBSCRIBE_FOR_TOPIC,
        identity.peerId.id,
        channel
      ])
        .run();
    });
});
