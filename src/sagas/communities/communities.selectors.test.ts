import { combineReducers, createStore, Store } from '@reduxjs/toolkit';
import { StoreKeys } from '../store.keys';
import { communitiesAdapter } from './communities.adapter';
import { communitiesSelectors } from './communities.selectors';
import {
  communitiesReducer,
  CommunitiesState,
  Community,
} from './communities.slice';

describe('communitiesSelectors', () => {
  let store: Store;
  const communityAlpha: Community = {
    name: 'alpha',
    id: 'communityAlpha',
    CA: { rootCertString: 'certString', rootKeyString: 'keyString' },
    registrarUrl: '',
    rootCa: '',
    peerList: [],
    registrar: null,
    onionAddress: '',
    privateKey: '',
    port: 0,
  };
  const communityBeta: Community = {
    name: 'beta',
    id: 'communityBeta',
    CA: { rootCertString: 'certString', rootKeyString: 'keyString' },
    registrarUrl: '',
    rootCa: '',
    peerList: [],
    registrar: null,
    onionAddress: '',
    privateKey: '',
    port: 0,
  };
  beforeEach(() => {
    store = createStore(
      combineReducers({
        [StoreKeys.Communities]: communitiesReducer,
      }),
      {
        [StoreKeys.Communities]: {
          ...new CommunitiesState(),
          currentCommunity: 'communityAlpha',
          communities: communitiesAdapter.setAll(
            communitiesAdapter.getInitialState(),
            [communityAlpha, communityBeta]
          ),
        },
      }
    );
  });

  it('select community by id', () => {
    const community = communitiesSelectors.selectById('communityBeta')(
      store.getState()
    );
    expect(community).toMatchInlineSnapshot(`
      Object {
        "CA": Object {
          "rootCertString": "certString",
          "rootKeyString": "keyString",
        },
        "id": "communityBeta",
        "name": "beta",
        "onionAddress": "",
        "peerList": Array [],
        "port": 0,
        "privateKey": "",
        "registrar": null,
        "registrarUrl": "",
        "rootCa": "",
      }
    `);
  });

  it('select current community id', () => {
    const communityId = communitiesSelectors.currentCommunityId(
      store.getState()
    );
    expect(communityId).toMatchInlineSnapshot(`"communityAlpha"`);
  });

  it('select current community', () => {
    const community = communitiesSelectors.currentCommunity(store.getState());
    expect(community).toMatchInlineSnapshot(`
      Object {
        "CA": Object {
          "rootCertString": "certString",
          "rootKeyString": "keyString",
        },
        "id": "communityAlpha",
        "name": "alpha",
        "onionAddress": "",
        "peerList": Array [],
        "port": 0,
        "privateKey": "",
        "registrar": null,
        "registrarUrl": "",
        "rootCa": "",
      }
    `);
  });

  it('returns registrar url without port if no port in the store', () => {
    const onionAddress =
      'aznu6kiyutsgjhdue4i4xushjzey6boxf4i4isd53admsibvbt6qyiyd';
    const community: Community = {
      name: 'new',
      id: 'communityNew',
      CA: { rootCertString: 'certString', rootKeyString: 'keyString' },
      registrarUrl: '',
      rootCa: '',
      peerList: [],
      registrar: null,
      onionAddress: onionAddress,
      privateKey: '',
      port: 0,
    };
    store = createStore(
      combineReducers({
        [StoreKeys.Communities]: communitiesReducer,
      }),
      {
        [StoreKeys.Communities]: {
          ...new CommunitiesState(),
          currentCommunity: community.id,
          communities: communitiesAdapter.setAll(
            communitiesAdapter.getInitialState(),
            [community]
          ),
        },
      }
    );
    const registrarUrl = communitiesSelectors.registrarUrl(community.id)(store.getState());
    expect(registrarUrl).toBe(onionAddress);
  });

  it('returns registrar url with port if port exists in the store', () => {
    const onionAddress =
      'aznu6kiyutsgjhdue4i4xushjzey6boxf4i4isd53admsibvbt6qyiyd';
    const port = 7777;
    const community: Community = {
      name: 'new',
      id: 'communityNew',
      CA: { rootCertString: 'certString', rootKeyString: 'keyString' },
      registrarUrl: '',
      rootCa: '',
      peerList: [],
      registrar: null,
      onionAddress: onionAddress,
      privateKey: '',
      port: 0,
    };
    community.port = port;
    store = createStore(
      combineReducers({
        [StoreKeys.Communities]: communitiesReducer,
      }),
      {
        [StoreKeys.Communities]: {
          ...new CommunitiesState(),
          currentCommunity: community.id,
          communities: communitiesAdapter.setAll(
            communitiesAdapter.getInitialState(),
            [community]
          ),
        },
      }
    );
    const registrarUrl = communitiesSelectors.registrarUrl(community.id)(store.getState());
    expect(registrarUrl).toBe(`${onionAddress}:${port}`);
  });

  it('returns registrar url if no onion address, no port', () => {
    const url =
      'http://aznu6kiyutsgjhdue4i4xushjzey6boxf4i4isd53admsibvbt6qyiyd';
    const community: Community = {
      name: 'new',
      id: 'communityNew',
      CA: { rootCertString: 'certString', rootKeyString: 'keyString' },
      registrarUrl: url,
      rootCa: '',
      peerList: [],
      registrar: null,
      onionAddress: '',
      privateKey: '',
      port: 0,
    };
    store = createStore(
      combineReducers({
        [StoreKeys.Communities]: communitiesReducer,
      }),
      {
        [StoreKeys.Communities]: {
          ...new CommunitiesState(),
          currentCommunity: community.id,
          communities: communitiesAdapter.setAll(
            communitiesAdapter.getInitialState(),
            [community]
          ),
        },
      }
    );
    const registrarUrl = communitiesSelectors.registrarUrl(community.id)(store.getState());
    expect(registrarUrl).toBe(url);
  });
});
