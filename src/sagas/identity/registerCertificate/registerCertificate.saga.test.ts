import { expectSaga } from 'redux-saga-test-plan';
import { Socket } from 'socket.io-client';
import { combineReducers } from '@reduxjs/toolkit';
import { StoreKeys } from '../../store.keys';
import { SocketActionTypes } from '../../socket/const/actionTypes';
import { communitiesReducer, CommunitiesState, Community } from '../../communities/communities.slice';
import {
  identityActions,
  UserCsr,
} from '../identity.slice';
import { registerCertificateSaga } from './registerCertificate.saga';

describe('registerCertificateSaga', () => {
  
  test('register owner certificate', async () => {
    const community = new Community({name: 'communityName', id: 'id', CA: { rootCertString: 'certString', rootKeyString: 'keyString' }, registrarUrl:''})
    const socket = { emit: jest.fn(), on: jest.fn() } as unknown as Socket;
    const userCsr = {
      userCsr: 'userCsr',
      userKey: 'userKey',
      pkcs10: jest.fn(),
    };
    const communityId = 'id'
    const registrarAddress = 'http://wzispgrbrrkt3bari4kljpqz2j6ozzu3vlsoi2wqupgu7ewi4ncibrid.onion:7789'
    await expectSaga(
      registerCertificateSaga,
      socket,
      identityActions.storeUserCsr(<{userCsr: UserCsr, communityId: 'string',registrarAddress: string}>(<unknown>{ registrarAddress, userCsr, communityId }))
    ).withReducer(
        combineReducers({ [StoreKeys.Communities]: communitiesReducer }),
        {
          [StoreKeys.Communities]: {
            ...new CommunitiesState(),
            currentCommunity: 'id',
            communities: {
              ids: ['id'],
              entities: {
                id: community
              }
            }
            }
        }
      )
      .apply(socket, socket.emit, [
        SocketActionTypes.REGISTER_OWNER_CERTIFICATE,
        communityId,
        userCsr.userCsr,
        {
          certificate: community.CA.rootCertString,
          privKey: community.CA.rootKeyString
        }
      ])
      .silentRun();
  });
});
