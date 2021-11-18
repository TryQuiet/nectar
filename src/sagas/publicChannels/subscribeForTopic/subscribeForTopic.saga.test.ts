import { Socket } from 'socket.io-client';
import { expectSaga } from 'redux-saga-test-plan';
import { combineReducers } from '@reduxjs/toolkit';
import { SocketActionTypes } from '../../socket/const/actionTypes';
import { StoreKeys } from '../../store.keys';
import { publicChannelsActions } from '../publicChannels.slice';
import { subscribeForTopicSaga } from './subscribeForTopic.saga';
import { Identity } from '../../identity/identity.slice';
import { identityAdapter } from '../../identity/identity.adapter';
import { identityReducer, IdentityState } from '../../identity/identity.slice';

describe('subscribeForTopicSaga', () => {
  const socket = { emit: jest.fn() } as unknown as Socket;

  const channel = {
    name: 'general',
    description: 'stuff',
    owner: 'nobody',
    timestamp: 666999666,
    address: 'hell on the shore of the baltic sea',
  };
  const identity = new Identity({
    id: 'id',
    hiddenService: { onionAddress: 'onionAddress', privateKey: 'privateKey' },
    dmKeys: { publicKey: 'publicKey', privateKey: 'privateKey' },
    peerId: { id: 'peerId', pubKey: 'pubKey', privKey: 'privKey' },
  });

  test('subscribe for topic', () => {
    expectSaga(
      subscribeForTopicSaga,
      socket,
      publicChannelsActions.subscribeForTopic({
        peerId: 'peerid',
        channelData: channel,
      })
    )
      .withReducer(
        combineReducers({
          [StoreKeys.Identity]: identityReducer,
        }),
        {
          [StoreKeys.Identity]: {
            ...new IdentityState(),
            identities: identityAdapter.setAll(
              identityAdapter.getInitialState(),
              [identity]
            ),
          },
        }
      )
      .put(
        publicChannelsActions.subscribeForTopic({
          channelData: channel,
          peerId: 'peerId',
        })
      )
      .apply(socket, socket.emit, [
        SocketActionTypes.SUBSCRIBE_FOR_TOPIC,
        'peerId',
        channel,
      ])
      .run();
  });
});
