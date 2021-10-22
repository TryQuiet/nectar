import { createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit';

import { StoreKeys } from '../store.keys';

import {
  publicChannelsAdapter,
  channelsByCommunityAdapter,
} from './publicChannels.adapter';
import { IChannelInfo, IMessage } from './publicChannels.types';

export class PublicChannelsState {
  public channels: EntityState<CommunityChannels> =
    channelsByCommunityAdapter.getInitialState();
}

export class CommunityChannels {
  constructor(id) {
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
  communityId: string
  channelAddress: string;
  ids: string[];
}

export interface AskForMessagesPayload {
  channelAddress: string;
  ids: string[];
}

export interface CreateChannelPayload { channel: IChannelInfo; communityId: string }


export interface AskForMessagesResponse {
  channelAddress: string;
  messages: IMessage[];
  communityId: string
}

export interface onMessagePostedResponse {
  message: IMessage, 
  channelAddress: string,
  communityId: string
}

export const publicChannelsSlice = createSlice({
  initialState: channelsByCommunityAdapter.getInitialState(),
  name: StoreKeys.PublicChannels,
  reducers: {
    createChannel: (
      state,
      action: PayloadAction<{ channel: IChannelInfo; communityId: string }>
    ) => {

      const {channel, communityId} = action.payload

      channelsByCommunityAdapter.updateOne(state, {
        id: communityId,
        changes: {
          channels: publicChannelsAdapter.addOne(
            state.entities[communityId].channels,
            channel
          ),
          channelMessages: {...state.entities[communityId].channelMessages, 
          [channel.address]: {
            ids: [],
            messages: {}
          }}
        },
      });
    },
    addPublicChannelsList: (state, action) => {
      channelsByCommunityAdapter.addOne(
        state,
        new CommunityChannels(action.payload)
      );
    },
    getPublicChannels: (state) => state,
    responseGetPublicChannels: (
      state,
      action: PayloadAction<GetPublicChannelsResponse>
    ) => {
      const channel: IChannelInfo = {
        name: 'namghfhfghe',
        description: 'asdffghfghdsf',
        owner: 'asfghfghdf',
        timestamp: 12333333,
        address: 'asdf',
      };
      channelsByCommunityAdapter.updateOne(state, {
        id: action.payload.communityId,
        changes: {
          channels: 
          publicChannelsAdapter.setAll(
            state.entities[action.payload.communityId].channels,
            action.payload.channels
            )
        },
      });
    },
    setCurrentChannel: (
      state,
      action: PayloadAction<{ communityId: string; channel: string }>
    ) => {
      channelsByCommunityAdapter.updateOne(state, {
        id: action.payload.communityId,
        changes: { currentChannel: action.payload.channel },
      });
    },
    subscribeForTopic: (state, _action: PayloadAction<IChannelInfo>) => state,
    responseSendMessagesIds: (
      state,
      action: PayloadAction<ChannelMessagesIdsResponse>
    ) => {
      const { channelAddress } = action.payload;
      channelsByCommunityAdapter.updateOne(state, {
        id: action.payload.communityId,
        changes: { channelMessages: {...state.entities[action.payload.communityId].channelMessages,
          channelAddress: {...state.entities[action.payload.communityId].channelMessages[channelAddress], ids: action.payload.ids }
        },
      }});
    },
    askForMessages: (state, _action: PayloadAction<AskForMessagesPayload>) =>
      state,
    responseAskForMessages: (
      state,
      action: PayloadAction<AskForMessagesResponse>
    ) => {
      const { channelAddress, communityId } = action.payload;
      let messages =  {}
      action.payload.messages.forEach((message) => {
        messages[message.id] = message;
      });
      channelsByCommunityAdapter.updateOne(state, {
        id: communityId,
        changes: { channelMessages: {...state.entities[communityId].channelMessages,
          channelAddress: {...state.entities[communityId].channelMessages[channelAddress], messages: {
            ...state.entities[communityId].channelMessages[channelAddress].messages,
            ...messages
          } }
        },
      }});
    },
    onMessagePosted: (state, action: PayloadAction<onMessagePostedResponse>) => {
      const { message, channelAddress, communityId } = action.payload;
      const messages = {
        [message.id]: message
      }
      channelsByCommunityAdapter.updateOne(state, {
        id: communityId,
        changes: { channelMessages: {...state.entities[communityId].channelMessages,
          channelAddress: {...state.entities[communityId].channelMessages[channelAddress], messages: {
            ...state.entities[communityId].channelMessages[channelAddress].messages,
            ...messages
          } }
        },
      }});
    },
  },
});

export const publicChannelsActions = publicChannelsSlice.actions;
export const publicChannelsReducer = publicChannelsSlice.reducer;
