import { createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit';

import { StoreKeys } from '../store.keys';

import { publicChannelsAdapter, channelsByCommunityAdapter } from './publicChannels.adapter';
import { IChannelInfo, IMessage } from './publicChannels.types';

export class PublicChannelsState {
  public channels: EntityState<CommunityChannels> = channelsByCommunityAdapter.getInitialState()
  // public id: string
  // public channels: EntityState<IChannelInfo> =
  //   publicChannelsAdapter.getInitialState();

  // public currentChannel: string =
  //   'GENERAL';

  // public channelMessages: ChannelMessages = {};
}

export class CommunityChannels {
  constructor({id}) {
    this.id = id
  }
  public id: string
  public channels: EntityState<IChannelInfo> =
    publicChannelsAdapter.getInitialState();

  public currentChannel: string =
    'general';

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
  }
}

export interface ChannelMessagesIdsResponse {
  channelAddress: string;
  ids: string[];
}

export interface AskForMessagesPayload {
  channelAddress: string;
  ids: string[];
}

export interface AskForMessagesResponse {
  channelAddress: string;
  messages: IMessage[];
}

export const publicChannelsSlice = createSlice({
  initialState: channelsByCommunityAdapter.getInitialState(),
  name: StoreKeys.PublicChannels,
  reducers: {
    addPublicChannelsList: (state, action) => {
channelsByCommunityAdapter.addOne(state, new CommunityChannels(action.payload))
    },
    getPublicChannels: (state) => state,
    responseGetPublicChannels: (
  state,
      action: PayloadAction<GetPublicChannelsResponse>
    ) => {
      const channel : IChannelInfo = {name: 'namghfhfghe', description:'asdffghfghdsf', owner: 'asfghfghdf', timestamp: 12333333, address: 'asdf'}
      publicChannelsAdapter.addOne(
        state.entities[action.payload.communityId].channels,
        channel
      );
    },
    // setCurrentChannel: (state, action: PayloadAction<string>) => {
    //   state.currentChannel = action.payload;
    // },
    subscribeForTopic: (state, _action: PayloadAction<IChannelInfo>) => state,
    // responseSendMessagesIds: (
    //   state,
    //   action: PayloadAction<ChannelMessagesIdsResponse>
    // ) => {
    //   const { channelAddress } = action.payload;
    //   if (channelAddress in state.channelMessages) {
    //     state.channelMessages[channelAddress].ids = action.payload.ids;
    //   } else {
    //     state.channelMessages[channelAddress] = {
    //       ids: action.payload.ids,
    //       messages: {},
    //     };
    //   }
    // },
    askForMessages: (state, _action: PayloadAction<AskForMessagesPayload>) =>
      state,
    // responseAskForMessages: (
    //   state,
    //   action: PayloadAction<AskForMessagesResponse>
    // ) => {
    //   const { channelAddress } = action.payload;
    //   action.payload.messages.forEach((message) => {
    //     state.channelMessages[channelAddress].messages[message.id] = message;
    //   });
    // },
    // onMessagePosted: (state, action: PayloadAction<{ message: IMessage }>) => {
    //   const channelAddress = state.currentChannel;
    //   const { message } = action.payload;

    //   if (channelAddress in state.channelMessages) {
    //     state.channelMessages[channelAddress].ids.push(message.id);
    //     state.channelMessages[channelAddress].messages[message.id] = message;
    //   } else {
    //     state.channelMessages[channelAddress] = {
    //       ids: [message.id],
    //       messages: {[message.id]: message},
    //     };
    //   }

    // },
  },
});

export const publicChannelsActions = publicChannelsSlice.actions;
export const publicChannelsReducer = publicChannelsSlice.reducer;