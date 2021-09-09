import { expectSaga } from 'redux-saga-test-plan';
import { Socket } from 'socket.io-client';
import { generateId } from '../../../utils/cryptography/cryptography';
import { call } from 'redux-saga-test-plan/matchers';
import { SocketActionTypes } from '../../socket/const/actionTypes';
import { StoreKeys } from '../../store.keys';
import {
  communitiesActions,
  communitiesReducer,
  Community,
} from '../communities.slice';
import { launchCommunitySaga } from './launchCommunity.saga';

describe('joinCommunity', () => {
  test('join the existing community', async () => {
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket;
    const community = new Community({name: '', id: 'id', registrarUrl:'registrarUrl', CA: null})

    const communityPayload = {
      id: 'id',
    };
    await expectSaga(launchCommunitySaga, socket, communitiesActions.launchCommunity())
      .apply(socket, socket.emit, [
        SocketActionTypes.CREATE_COMMUNITY,
        communityPayload,
      ])

      .silentRun();
  });
});