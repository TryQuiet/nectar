import { createEntityAdapter } from '@reduxjs/toolkit';
import { IChannelInfo, IMessage } from './publicChannels.types';
import { CommunityChannels } from './publicChannels.slice';

export const publicChannelsAdapter = createEntityAdapter<IChannelInfo>({
  selectId: (channel) => channel.name,
});

export const channelsByCommunityAdapter =
  createEntityAdapter<CommunityChannels>({
    selectId: (community) => community.id,
  });

export const channelMessagesAdapter = createEntityAdapter<IMessage>({
  selectId: (message) => message.id,
});
