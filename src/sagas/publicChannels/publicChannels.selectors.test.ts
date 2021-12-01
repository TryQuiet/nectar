import { Store } from '../store.types';
import { getFactory } from '../..';
import { prepareStore } from '../../utils/tests/prepareStore';
import {
  publicChannelsSelectors,
  sortedCurrentChannelMessages,
} from './publicChannels.selectors';
import { communitiesActions } from '../communities/communities.slice';
import { publicChannelsActions } from './publicChannels.slice';
import { identityActions } from '../identity/identity.slice';
import { DateTime } from 'luxon';
import { MessageType } from '../messages/messages.types';

process.env.TZ = 'UTC';

describe('publicChannelsSelectors', () => {
  let store: Store;

  beforeAll(async () => {
    store = prepareStore().store;

    const factory = await getFactory(store);

    const community = await factory.create<
      ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community');

    const holmes = await factory.create<
      ReturnType<typeof identityActions.addNewIdentity>['payload']
    >('Identity', { id: community.id, zbayNickname: 'holmes' });

    const bartek = await factory.create<
      ReturnType<typeof identityActions.addNewIdentity>['payload']
    >('Identity', { id: community.id, zbayNickname: 'bartek' });

    /* Messages ids are being used only for veryfing proper order...
    ...they have no impact on selectors work */
    const messages = [
      {
        id: '1',
        createdAt: DateTime.fromObject({
          year: 2020,
          month: 10,
          day: 20,
          hour: 5,
          minute: 50,
        }).valueOf(),
        identity: holmes,
      },
      {
        id: '2',
        createdAt: DateTime.fromObject({
          year: 2020,
          month: 10,
          day: 20,
          hour: 6,
          minute: 10,
        }).valueOf(),
        identity: holmes,
      },
      {
        id: '3',
        createdAt: DateTime.fromObject({
          year: 2020,
          month: 10,
          day: 20,
          hour: 6,
          minute: 11,
          second: 30,
          millisecond: 1,
        }).valueOf(),
        identity: holmes,
      },
      {
        id: '4',
        createdAt: DateTime.fromObject({
          year: 2020,
          month: 10,
          day: 20,
          hour: 6,
          minute: 11,
          second: 30,
          millisecond: 2,
        }).valueOf(),
        identity: holmes,
      },
      {
        id: '5',
        createdAt: DateTime.fromObject({
          year: 2020,
          month: 10,
          day: 20,
          hour: 6,
          minute: 12,
          second: 1,
        }).valueOf(),
        identity: holmes,
      },
      {
        id: '6',
        createdAt: DateTime.fromObject({
          year: 2020,
          month: 10,
          day: 20,
          hour: 6,
          minute: 12,
          second: 2,
        }).valueOf(),
        identity: bartek,
      },
      {
        id: '7',
        createdAt: DateTime.fromObject({
          year: 2021,
          month: 2,
          day: 5,
          hour: 18,
          minute: 2,
        }).valueOf(),
        identity: holmes,
      },
      {
        id: '8',
        createdAt: DateTime.fromObject({
          year: 2021,
          month: 2,
          day: 5,
          hour: 20,
          minute: 50,
        }).valueOf(),
        identity: holmes,
      },
    ];

    // Shuffle messages array
    const shuffled = messages
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);

    for (const item of shuffled) {
      await factory.create<
        ReturnType<typeof publicChannelsActions.signMessage>['payload']
      >('SignedMessage', {
        identity: item.identity,
        message: {
          id: item.id,
          type: MessageType.Basic,
          message: `message_${item.id}`,
          createdAt: item.createdAt,
          channelId: 'general',
          signature: '',
          pubKey: '',
        },
      });
    }
  });

  it('get messages sorted by date', async () => {
    const messages = sortedCurrentChannelMessages(store.getState());
    messages.forEach((message) => {
      expect(message).toMatchSnapshot({
        pubKey: expect.any(String),
        signature: expect.any(String),
      });
    });
  });

  it.skip('get grouped messages', async () => {
    const messages = publicChannelsSelectors.currentChannelMessagesGroupedByDay(
      store.getState()
    );

    expect(messages).toMatchInlineSnapshot();
  });
});

export {};
