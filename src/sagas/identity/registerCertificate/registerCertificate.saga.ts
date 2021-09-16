import { Socket } from 'socket.io-client';
import { PayloadAction } from '@reduxjs/toolkit';
import { apply, select } from 'typed-redux-saga';
import { identityActions } from '../identity.slice';
import { SocketActionTypes } from '../../socket/const/actionTypes';
import { communitiesSelectors } from '../../communities/communities.selectors';

export function* registerCertificateSaga(
  socket: Socket,
  action: PayloadAction<
    ReturnType<typeof identityActions.storeUserCsr>['payload']
  >
): Generator {

  console.log('registerCertificateSaga')

const currentCommunity = yield* select(communitiesSelectors.currentCommunity)
console.log(currentCommunity.CA.rootCertString, 'rootCertString')
  if(currentCommunity.CA.rootCertString) {
    console.log('registerOwnerCertificate')
    yield* apply(socket, socket.emit, [
      SocketActionTypes.REGISTER_OWNER_CERTIFICATE,
      action.payload.communityId,
      action.payload.userCsr.userCsr,
     {
       certificate: currentCommunity.CA.rootCertString,
       privKey: currentCommunity.CA.rootKeyString
     }
    ])
  } else {
    yield* apply(socket, socket.emit, [
      SocketActionTypes.REGISTER_USER_CERTIFICATE,
      action.payload.registrarAddress,
      action.payload.userCsr.userCsr,
      action.payload.communityId,
    ]);
  }
}
