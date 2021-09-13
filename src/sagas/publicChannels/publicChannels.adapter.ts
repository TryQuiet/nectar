import { createEntityAdapter } from '@reduxjs/toolkit';
import { currentCommunityChannels } from './publicChannels.selectors';
import { IChannelInfo } from './publicChannels.types';
import {CommunityChannels} from './publicChannels.slice'
import { CommunitiesState } from '../communities/communities.slice';
export const publicChannelsAdapter = createEntityAdapter<IChannelInfo>({
  selectId: (channel) => channel.name,
});



export const channelsByCommunityAdapter = createEntityAdapter<CommunityChannels>({
  selectId: (community) => community.id,
});
