import { expectSaga } from 'redux-saga-test-plan';
import { Socket } from 'socket.io-client';
import { SocketActionTypes } from '../../socket/const/actionTypes';
import {
  communitiesActions,
  Community,
} from '../communities.slice';
import { launchRegistrarSaga } from './launchRegistrar.saga';

describe('joinCommunity', () => {
  test('join the existing community', async () => {
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket;
    const communityPayload = {
      id: 'id',
    };
    await expectSaga(launchRegistrarSaga, socket, communitiesActions.launchCommunity())
      .apply(socket, socket.emit, [
        SocketActionTypes.LAUNCH_COMMUNITY,
        communityPayload,
      ])

      .silentRun();
  });
});