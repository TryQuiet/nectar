import { createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit';

import { StoreKeys } from '../store.keys';

import {
  publicChannelsAdapter,
  channelsByCommunityAdapter,
} from './publicChannels.adapter';
import { IChannelInfo, IMessage } from './publicChannels.types';
import logger from '../../utils/logger';
const log = logger('publicChannels');

export class PublicChannelsState {
  public channels: EntityState<CommunityChannels> =
    channelsByCommunityAdapter.getInitialState();
}

export class CommunityChannels {
  constructor(id: string) {
    this.id = id;
  }

  public id: string;

  public channels: EntityState<IChannelInfo> =
    publicChannelsAdapter.getInitialState();

  public currentChannel: string = 'general';

  public channelMessages: ChannelMessages = {};
}

export interface ChannelMessages {
  [channelAddres: string]: {
    ids: string[];
    messages: {
      [id: string]: IMessage;
    };
  };
}

export interface GetPublicChannelsResponse {
  communityId: string;
  channels: {
    [name: string]: IChannelInfo;
  };
}

export interface ChannelMessagesIdsResponse {
  communityId: string;
  channelAddress: string;
  ids: string[];
}

export interface AskForMessagesPayload {
  channelAddress: string;
  ids: string[];
}

export interface subscribeForTopicPayload {
  peerId: string;
  channelData: IChannelInfo;
}

export interface SetCurrentChannelPayload {
  communityId: string;
  channel: string;
}

export interface CreateChannelPayload {
  channel: IChannelInfo;
  communityId: string;
}

export interface AskForMessagesResponse {
  channelAddress: string;
  messages: IMessage[];
  communityId: string;
}

export interface onMessagePostedResponse {
  message: IMessage;
  channelAddress: string;
  communityId: string;
}

export const publicChannelsSlice = createSlice({
  initialState: {
    ...new PublicChannelsState(),
  },
  name: StoreKeys.PublicChannels,
  reducers: {
    createChannel: (state, action: PayloadAction<CreateChannelPayload>) => {
      const { channel, communityId } = action.payload;

      channelsByCommunityAdapter.updateOne(state.channels, {
        id: communityId,
        changes: {
          channels: publicChannelsAdapter.addOne(
            state.channels.entities[communityId].channels,
            channel
          ),
          channelMessages: {
            ...state.channels.entities[communityId].channelMessages,
            [channel.address]: {
              ids: [],
              messages: {},
            },
          },
        },
      });
    },
    addChannel: (state, action: PayloadAction<CreateChannelPayload>) => {
      const { channel, communityId } = action.payload;
      channelsByCommunityAdapter.updateOne(state.channels, {
        id: communityId,
        changes: {
          channels: publicChannelsAdapter.addOne(
            state.channels.entities[communityId].channels,
            channel
          ),
          channelMessages: {
            ...state.channels.entities[communityId].channelMessages,
            [channel.address]: {
              ids: [],
              messages: {},
            },
          },
        },
      });
    },
    addPublicChannelsList: (state, action: PayloadAction<string>) => {
      channelsByCommunityAdapter.addOne(
        state.channels,
        new CommunityChannels(action.payload)
      );
    },
    getPublicChannels: (state) => state,
    responseGetPublicChannels: (
      state,
      action: PayloadAction<GetPublicChannelsResponse>
    ) => {
      console.log(
        `replicated channels [${Object.keys(
          action.payload.channels
        )}] for community ${action.payload.communityId}`
      );
      log(action.payload.channels);
      log({ ...state.channels.entities });
      channelsByCommunityAdapter.updateOne(state.channels, {
        id: action.payload.communityId,
        changes: {
          channels: publicChannelsAdapter.setAll(
            state.channels.entities[action.payload.communityId].channels,
            action.payload.channels
          ),
        },
      });
    },
    setCurrentChannel: (
      state,
      action: PayloadAction<SetCurrentChannelPayload>
    ) => {
      channelsByCommunityAdapter.updateOne(state.channels, {
        id: action.payload.communityId,
        changes: { currentChannel: action.payload.channel },
      });
    },
    subscribeForTopic: (
      state,
      _action: PayloadAction<subscribeForTopicPayload>
    ) => state,
    subscribeForAllTopics: (state, _action: PayloadAction<string>) => state,
    responseSendMessagesIds: (
      state,
      action: PayloadAction<ChannelMessagesIdsResponse>
    ) => {
      const { channelAddress } = action.payload;
      channelsByCommunityAdapter.updateOne(state.channels, {
        id: action.payload.communityId,
        changes: {
          channelMessages: {
            ...state.channels.entities[action.payload.communityId]
              .channelMessages,
            channelAddress: {
              ...state.channels.entities[action.payload.communityId]
                .channelMessages[channelAddress],
              ids: action.payload.ids,
            },
          },
        },
      });
    },
    askForMessages: (state, _action: PayloadAction<AskForMessagesPayload>) =>
      state,
    responseAskForMessages: (
      state,
      action: PayloadAction<AskForMessagesResponse>
    ) => {
      const { channelAddress, communityId } = action.payload;
      let messages = {};
      action.payload.messages.forEach((message) => {
        messages[message.id] = message;
      });
      channelsByCommunityAdapter.updateOne(state.channels, {
        id: communityId,
        changes: {
          channelMessages: {
            ...state.channels.entities[communityId].channelMessages,
            channelAddress: {
              ...state.channels.entities[communityId].channelMessages[
                channelAddress
              ],
              messages: {
                ...state.channels.entities[communityId].channelMessages[
                  channelAddress
                ].messages,
                ...messages,
              },
            },
          },
        },
      });
    },
    onMessagePosted: (
      state,
      action: PayloadAction<onMessagePostedResponse>
    ) => {
      const { message, channelAddress, communityId } = action.payload;
      const messages = {
        [message.id]: message,
      };
      channelsByCommunityAdapter.updateOne(state.channels, {
        id: communityId,
        changes: {
          channelMessages: {
            ...state.channels.entities[communityId].channelMessages,
            channelAddress: {
              ...state.channels.entities[communityId].channelMessages[
                channelAddress
              ],
              messages: {
                ...state.channels.entities[communityId].channelMessages[
                  channelAddress
                ].messages,
                ...messages,
              },
            },
          },
        },
      });
    },
  },
});

export const publicChannelsActions = publicChannelsSlice.actions;
export const publicChannelsReducer = publicChannelsSlice.reducer;
