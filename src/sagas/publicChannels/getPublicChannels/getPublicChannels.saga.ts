import { Socket } from 'socket.io-client'
import { SocketActionTypes } from '../../socket/const/actionTypes'
import { apply } from 'typed-redux-saga'
// import { publicChannelsSelectors } from '../publicChannels.selectors';
import { IChannelInfo } from '../publicChannels.types'
// import { publicChannelsActions } from '../publicChannels.slice';

export function* getPublicChannelsSaga(socket: Socket): Generator {
  yield* apply(socket, socket.emit, [SocketActionTypes.GET_PUBLIC_CHANNELS])
}

export function* loadPublicChannelsSaga(): Generator {
  const channels: IChannelInfo[] = []
  // while (true) {
  //   yield* put(publicChannelsActions.getPublicChannels());
  //   channels = yield* select(publicChannelsSelectors.publicChannels);
  //   if (channels.length > 0) {
  //     break;
  //   }
  //   yield* delay(500);
  // }
}
