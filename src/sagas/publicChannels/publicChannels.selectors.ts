import { createSelector } from 'reselect';
import { StoreKeys } from '../store.keys';
import {
  publicChannelsAdapter,
  communityChannelsAdapter,
  channelMessagesAdapter,
} from './publicChannels.adapter';
import { CreatedSelectors } from '../store.types';
import { formatMessageDisplayDate } from '../../utils/functions/formatMessageDisplayDate/formatMessageDisplayDate';
import { certificatesMapping } from '../users/users.selectors';
import { StoreState } from '../store.types';
import { currentCommunityId } from '../communities/communities.selectors';
import { MessagesGroupedByDay } from './publicChannels.types';
import { MessageType } from '../messages/messages.types';
import { CommunityChannels } from './publicChannels.slice';

const publicChannelSlice: CreatedSelectors[StoreKeys.PublicChannels] = (
  state: StoreState
) => state[StoreKeys.PublicChannels];

export const selectEntities = createSelector(
  publicChannelSlice,
  (reducerState) =>
    communityChannelsAdapter
      .getSelectors()
      .selectEntities(reducerState.channels)
);

export const publicChannelsByCommunity = (id: string) =>
  createSelector(selectEntities, (publicChannels) => {
    const community = publicChannels[id];
    return publicChannelsAdapter
      .getSelectors()
      .selectAll(community.channels);
  });

const currentCommunityChannelsState = createSelector(
  selectEntities,
  currentCommunityId,
  (publicChannels, currentCommunity) => {
    const empty: CommunityChannels = {
      id: '',
      currentChannel: '',
      channels: publicChannelsAdapter.getInitialState(),
      channelMessages: channelMessagesAdapter.getInitialState()
    }
    return publicChannels[currentCommunity] || empty;
  }
);

export const publicChannels = createSelector(
  currentCommunityChannelsState,
  (state) => {
    return publicChannelsAdapter.getSelectors().selectAll(state.channels);
  }
);

export const publicChannelsMessages = createSelector(
  currentCommunityChannelsState,
  (state) => {
    return channelMessagesAdapter
      .getSelectors()
      .selectAll(state.channelMessages);
  }
);

export const missingChannelsMessages = createSelector(
  publicChannelsMessages,
  (messages) => {
    return messages
      .filter((message) => message.type === MessageType.Empty)
      .map((message) => message.id);
  }
);

export const currentChannel = createSelector(
  currentCommunityChannelsState,
  (state) => {
    return state.currentChannel;
  }
);

const currentChannelMessages = createSelector(
  publicChannelsMessages,
  currentChannel,
  (messages, channel) => {
    return messages.filter((message) => message.channelId === channel);
  }
);

const validCurrentChannelMessages = createSelector(
  currentChannelMessages,
  certificatesMapping,
  (messages, certificates) => {
    return messages.filter((message) => message.pubKey in certificates);
  }
);

export const sortedCurrentChannelMessages = createSelector(
  validCurrentChannelMessages,
  (messages) => {
    return messages.sort((a, b) => b.createdAt - a.createdAt);
  }
);

export const currentChannelDisplayableMessages = createSelector(
  sortedCurrentChannelMessages,
  certificatesMapping,
  (messages, certificates) =>
    messages.map((message) => {
      const user = certificates[message.pubKey];
      return {
        id: message.id,
        type: message.type,
        message: message.message,
        createdAt: message.createdAt,
        nickname: user.username,
      };
    })
);

// returns array of messages SORTED and GROUPED by createdAt and user
const currentChannelMessagesMergedBySender = createSelector(
  currentChannelDisplayableMessages,
  (messages) => {
    const timeOfGroupingMessages = 300;
    let newMessages = [];

    for (
      let indexOfMessages = 0;
      indexOfMessages < messages.length;
      indexOfMessages++
    ) {
      let currentMessage = messages[indexOfMessages];

      while (
        messages[indexOfMessages + 1] &&
        currentMessage.createdAt - messages[indexOfMessages + 1].createdAt <
          timeOfGroupingMessages &&
        currentMessage.nickname === messages[indexOfMessages + 1].nickname
      ) {
        currentMessage = {
          ...messages[indexOfMessages + 1],
          message:
            messages[indexOfMessages + 1].message +
            '\n' +
            currentMessage.message,
        };
        indexOfMessages++;
      }

      newMessages.push(currentMessage);
    }
    return newMessages.reverse();
  }
);

// returns array of 'day' object with day and grouped messages
export const currentChannelMessagesGroupedByDay = createSelector(
  currentChannelMessagesMergedBySender,
  (messages) => {
    let messagesByDay: MessagesGroupedByDay = [];

    for (const message of messages) {
      const split = formatMessageDisplayDate(message.createdAt).split(',');

      if (split.length === 1) {
        const messageTime = split[0];
        const isDay = messagesByDay.find((item) => item.day === 'Today');
        const displayableMessage = {
          ...message,
          createdAt: messageTime,
        };

        if (!isDay) {
          messagesByDay.push({
            day: 'Today',
            messages: [displayableMessage],
          });
        } else {
          const dayIndex = messagesByDay.findIndex(
            (item) => item.day === 'Today'
          );
          messagesByDay[dayIndex].messages.push(displayableMessage);
        }
      } else if (split.length === 2) {
        const messageDay = split[0];
        const messageTime = split[1];
        const isDay = messagesByDay.find((item) => item.day === messageDay);
        const displayableMessage = {
          ...message,
          createdAt: messageTime,
        };

        if (!isDay) {
          messagesByDay.push({
            day: messageDay,
            messages: [displayableMessage],
          });
        } else {
          const dayIndex = messagesByDay.findIndex(
            (item) => item.day === messageDay
          );
          messagesByDay[dayIndex].messages.push(displayableMessage);
        }
      }
    }
    return messagesByDay;
  }
);

export const publicChannelsSelectors = {
  publicChannelsByCommunity,
  publicChannels,
  currentChannel,
  currentChannelMessagesGroupedByDay,
};
