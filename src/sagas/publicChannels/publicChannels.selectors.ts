import { createSelector } from 'reselect';
import { StoreKeys } from '../store.keys';
import { selectReducer } from '../store.utils';
import { publicChannelsAdapter, channelsByCommunityAdapter } from './publicChannels.adapter';
import { formatMessageDisplayDate } from '../../utils/functions/formatMessageDisplayDate/formatMessageDisplayDate';
import { certificatesMapping } from '../users/users.selectors';

const selectSelf = (state) => state

export const currentCommunityChannels = createSelector(
  selectSelf, (reducerState) => {
    const id = reducerState.Communities.currentCommunity
    const selected = channelsByCommunityAdapter.getSelectors().selectById(reducerState.PublicChannels, id)
    return selected
  }
)

export const publicChannels = createSelector(
  currentCommunityChannels,
  (channels) =>{
    console.log(channels, 'CHANNELSLIST')
    if (channels) {
      return publicChannelsAdapter.getSelectors().selectAll(channels.channels)
    }
    return []
  }
);























export const currentChannelDisplayableMessages = () => createSelector(
  currentCommunityChannels,
  (channels) =>
    channels
);
export const validCurrentChannelMessages = () => createSelector(
  currentCommunityChannels,
  (channels) =>
    channels
);
export const missingCurrentChannelMessages = () => createSelector(
  currentCommunityChannels,
  (channels) =>
    channels
);
export const orderedChannelMessages = () => createSelector(
  currentCommunityChannels,
  (channels) =>
    channels
);
export const currentChannelMessages = () => createSelector(
  currentCommunityChannels,
  (channels) =>
    channels
);
export const ZbayChannel = () => createSelector(
  currentCommunityChannels,
  (channels) =>
    channels
);
export const channelMessages = () => createSelector(
  currentCommunityChannels,
  (channels) =>
    channels
);
export const currentChannel = createSelector(
  currentCommunityChannels,
  (channels) =>
    'currentChannel'
);






// // TODO: Change to general channel - created by default on community creation
// export const ZbayChannel = (id) => createSelector(
//   selectReducer(StoreKeys.PublicChannels),
//   (reducerState) => {
//     const publicChannelsList = publicChannelsAdapter
//       .getSelectors()
//       .selectAll(reducerState[id].channels);

//     return publicChannelsList.find(
//       (channel) =>
//         channel.address ===
//         'GENERAL'
//     );
//   }
// );

// export const currentChannel = createSelector(
//   selectReducer(StoreKeys.PublicChannels),
//   (reducerState) => reducerState.currentChannel
// );

// export const channelMessages = createSelector(
//   selectReducer(StoreKeys.PublicChannels),
//   (reducerState) => reducerState.channelMessages
// );

// export const currentChannelMessagesKeys = createSelector(
//   currentChannel,
//   channelMessages,
//   (address, messages) => {
//     if (messages && address in messages) {
//       return messages[address].ids;
//     }
//     return <string[]>[];
//   }
// );

// export const currentChannelMessages = createSelector(
//   currentChannel,
//   channelMessages,
//   (address, messages) => {
//     if (messages && address in messages) {
//       return messages[address].messages;
//     }
//     return {};
//   }
// );

// export const orderedChannelMessages = createSelector(
//   currentChannelMessagesKeys,
//   currentChannelMessages,
//   (keys: string[], messages) =>
//     keys.filter((key) => key in messages).map((key) => messages[key])
// );

// export const missingCurrentChannelMessages = createSelector(
//   currentChannelMessagesKeys,
//   currentChannelMessages,
//   (ids: string[], messages) => ids.filter((id) => !(id in messages))
// );

// export const validCurrentChannelMessages = createSelector(
//   orderedChannelMessages,
//   certificatesMapping,
//   (messages, certificates) =>
//     messages
//       .filter((message) => message.pubKey in certificates)
//       .sort((a, b) => b.createdAt - a.createdAt)
// );

// export const currentChannelDisplayableMessages = createSelector(
//   validCurrentChannelMessages,
//   certificatesMapping,
//   (messages, certificates) =>
//     messages.map((message) => {
//       const user = certificates[message.pubKey];
//       return {
//         id: message.id,
//         type: message.type,
//         message: message.message,
//         createdAt: formatMessageDisplayDate(message.createdAt),
//         nickname: user.username,
//       };
//     })
// );

export const publicChannelsSelectors = {
  publicChannels,
  ZbayChannel,
  currentChannel,
  channelMessages,
  currentChannelMessages,
  orderedChannelMessages,
  missingCurrentChannelMessages,
  validCurrentChannelMessages,
  currentChannelDisplayableMessages,
};