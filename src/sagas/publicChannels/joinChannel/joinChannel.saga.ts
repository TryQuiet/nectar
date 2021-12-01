import { PayloadAction } from '@reduxjs/toolkit';
import { Socket } from 'socket.io-client';
import { communitiesSelectors } from '../../communities/communities.selectors';
import { apply, put, select } from 'typed-redux-saga';
import { SocketActionTypes } from '../../socket/const/actionTypes';
import { publicChannelsActions } from '../publicChannels.slice';
import { subscribeForTopicSaga } from '../subscribeForTopic/subscribeForTopic.saga';
import { publicChannels } from 'src';
import { createPeerIdTestHelper } from 'src/utils/tests/helpers';
import { publicChannelsSelectors } from '../publicChannels.selectors';
import { identitySelectors } from '../../identity/identity.selectors';

export function* joinChannelSaga(
  action: PayloadAction<
    ReturnType<typeof publicChannelsActions.joinChannel>['payload']
  >
): Generator {
  const { communityId, channel } = action.payload;
  console.log('joinChannel');
  const identity = yield* select(identitySelectors.selectById(communityId));
  console.log('identity', identity);
  const isChannelJoined = yield* select(
    publicChannelsSelectors.isChannelJoined(channel.name)
  );
  console.log('isChannelJoined', isChannelJoined);

  if (isChannelJoined) return;

  yield* put(
    publicChannelsActions.addChannel({
      communityId,
      channel: channel,
    })
  );

  yield* put(
    publicChannelsActions.subscribeForTopic({
      peerId: identity.peerId.id,
      channelData: channel,
    })
  );
}
