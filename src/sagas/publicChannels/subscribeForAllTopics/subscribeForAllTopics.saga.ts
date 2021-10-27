import {  select, put } from 'typed-redux-saga';
import { publicChannelsSelectors } from '../publicChannels.selectors';
import { publicChannelsActions } from '../publicChannels.slice';
import { identitySelectors } from '../../identity/identity.selectors';

export function* subscribeForAllTopicsSaga(
  action
): Generator {

  console.log('subscribing to all topics after')
  console.log(`${action.payload.id} is payload`)
  const identity = yield* select(identitySelectors.currentIdentity)
  identity.peerId.id
    const channels = yield* select(publicChannelsSelectors.publicChannelsByCommunityId(action.payload.id));
    for (const channel of channels) {
      console.log(`subscribing for ${channel.name}`)
      yield* put(publicChannelsActions.subscribeForTopic({peerId: identity.peerId.id, channelData: channel}));
    }
    

}