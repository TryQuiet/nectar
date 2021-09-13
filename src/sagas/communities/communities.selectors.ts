import { StoreKeys } from '../store.keys';
import { createSelector } from 'reselect';
import { selectReducer } from '../store.utils';
import { communitiesAdapter } from './communities.adapter';
import { Community } from './communities.slice';

export const selectById = (id: string) =>
  createSelector(selectReducer(StoreKeys.Communities), (reducerState) =>
    communitiesAdapter.getSelectors().selectById(reducerState, id)
  );

  export const currentCommunity = () => 
    createSelector(selectReducer(StoreKeys.Communities), (reducerState) =>{

      const id = reducerState.currentCommunity
      // console.log('communitnies', reducerState.communities)
     return communitiesAdapter.getSelectors().selectById(reducerState.communities, id)
     
    });
  

export const currentCommunityId = () => {
  selectReducer(StoreKeys.Communities),
    (reducerState) => reducerState.currentCommunity;
};

export const registrarUrl = () =>
  createSelector(currentCommunity(), (community) => {
    let registrarAddress: string = ''
    if (community.onionAddress && community.port) {
      registrarAddress = `http://${community.onionAddress}.onion:${community.port}`
    } else if (community.registrarUrl) {
      registrarAddress = community.registrarUrl
    }
    return registrarAddress
  }
);

export const communitiesSelectors = {
  selectById,
  currentCommunityId,
  currentCommunity,
  registrarUrl
};
