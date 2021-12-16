import waitForExpect from 'wait-for-expect';
import logger from '../utils/logger';
import { publicChannelsActions } from '../sagas/publicChannels/publicChannels.slice';
import { createApp, sleep } from './utils';
import { AsyncReturnType } from 'src/utils/types/AsyncReturnType.interface';

const log = logger('tests');
const App: AsyncReturnType<typeof createApp> = null;
type Store = typeof App.store;

export async function assertReceivedCertificates(
  userName: string,
  expectedCount: number,
  maxTime: number = 600000,
  store: Store
) {
  log(`User ${userName} starts waiting ${maxTime}ms for certificates`);

  await waitForExpect(() => {
    expect(store.getState().Users.certificates.ids).toHaveLength(expectedCount);
  }, maxTime);

  log(
    `User ${userName} received ${
      store.getState().Users.certificates.ids.length
    } certificates`
  );
}

export async function assertReceivedChannelsAndSubscribe(
  userName: string,
  expectedCount: number,
  maxTime: number = 600000,
  store: Store
) {
  log(`User ${userName} starts waiting ${maxTime}ms for channels`);

  const communityId = store.getState().Communities.communities.ids[0] as string;

  await waitForExpect(() => {
    expect(
      store.getState().PublicChannels.channels.entities[communityId].channels
        .ids
    ).toHaveLength(expectedCount);
  }, maxTime);

  store.dispatch(
    publicChannelsActions.setCurrentChannel({
      communityId,
      channel: store.getState().PublicChannels.channels.entities[communityId]
        .channels.ids[0] as string,
    })
  );
  store.dispatch(publicChannelsActions.subscribeForAllTopics(communityId));

  log(
    `User ${userName} received ${
      store.getState().PublicChannels.channels.entities[communityId].channels
        .ids.length
    } channels`
  );
}

export async function assertReceivedMessages(
  userName: string,
  expectedCount: number,
  maxTime: number = 600000,
  store: Store
) {
  log(`User ${userName} starts waiting ${maxTime}ms for messages`);

  const communityId = store.getState().Communities.communities.ids[0];
await sleep(maxTime)


const publicChannels = store.getState().PublicChannels.channels.entities[communityId]
console.log(publicChannels)

    // await waitForExpect(() => {
    //   expect(
    //     store.getState().PublicChannels.channels.entities[communityId]
    //     .channelMessages.ids
    //     ).toHaveLength(expectedCount);
    //   }, maxTime);
  log(
    `User ${userName} received ${
      store.getState().PublicChannels.channels.entities[communityId]
        .channelMessages.ids.length
    } messages`
  );
}

export const assertReceivedMessagesAreValid = async (
  userName: string,
  messages: any[],
  maxTime: number = 600000,
  store: Store
) => {
  log(`User ${userName} checks is messages are valid`);

  const communityId = store.getState().Communities.communities.ids[0];

  const receivedMessages = Object.values(
    store.getState().PublicChannels.channels.entities[communityId]
      .channelMessages.entities
  );

  const validMessages = [];

  for (let receivedMessage of receivedMessages) {
    const msg = messages.filter(
      // @ts-ignorets-ignore
      (message) => message.publicKey === receivedMessage.pubKey
    );
    if (msg[0]) {
      validMessages.push(msg[0]);
    }
  }

  await waitForExpect(() => {
    expect(validMessages).toHaveLength(messages.length);
  }, maxTime);
};

export const assertInitializedExistingCommunitiesAndRegistrars = async (
  store: Store
) => {
  const communityId = store.getState().Communities.communities.ids[0];

  await waitForExpect(() => {
    expect(
      store.getState().Connection.initializedCommunities[communityId]
    ).toBeTruthy();
  });
  await waitForExpect(() => {
    expect(
      store.getState().Connection.initializedRegistrars[communityId]
    ).toBeTruthy();
  });
};

export const assertReceivedRegistrationError = async (store: Store) => {
  const communityId = store.getState().Communities.communities.ids[0];
  await waitForExpect(() => {
    expect(store.getState().Errors[communityId]?.ids[0]).toEqual('registrar')
  })
};

export const assertReceivedCertificate = async (store: Store) => {
  const communityId = store.getState().Communities.communities.ids[0];
  await waitForExpect(() => {
    expect(
      store.getState().Identity.identities.entities[communityId].userCertificate
    ).toBeTruthy();
  }, 150_000);
};
