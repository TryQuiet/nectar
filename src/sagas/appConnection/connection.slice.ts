import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { StoreKeys } from '../store.keys';
import { CommunityId, RegistrarId } from './connection.types';

export class ConnectionState {
  public initializedCommunities: CommunityId[] = [];

  public initializedRegistrars: RegistrarId[] = [];
}

export const connectionSlice = createSlice({
  initialState: { ...new ConnectionState() },
  name: StoreKeys.Connection,
  reducers: {
    responseInitializedCommunities: (
      state,
      _action: PayloadAction<CommunityId>
    ) => state,
    responseInitializedRegistrars: (
      state,
      _action: PayloadAction<RegistrarId>
    ) => state,
    addInitializedCommunity: (state, action: PayloadAction<CommunityId>) => {
      state.initializedCommunities = [
        ...state.initializedCommunities,
        action.payload,
      ];
      console.log(state.initializedCommunities);
    },
    addInitializedRegistrar: (state, action: PayloadAction<RegistrarId>) => {
      state.initializedRegistrars = [
        ...state.initializedRegistrars,
        action.payload,
      ];
      console.log(state.initializedRegistrars);
    },
  },
});

export const connectionActions = connectionSlice.actions;
export const connectionReducer = connectionSlice.reducer;
