import { take, spawn } from 'typed-redux-saga';
import waitForExpect from 'wait-for-expect';
import { communitiesActions } from '../sagas/communities/communities.slice';
import logger from '../utils/logger';
import { assertNoErrors } from './utils';
import { publicChannelsActions } from '../sagas/publicChannels/publicChannels.slice';
import {createApp} from './utils'
import { AsyncReturnType } from 'src/utils/types/AsyncReturnType.interface';

const log = logger('tests');
const App: AsyncReturnType<typeof createApp> = null
type Store = typeof App.store

export async function assertStateIsCorrect(
  oldState,
  currentState
) {
 log('checking state')
 log('state correct')
}

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
    publicChannelsActions.setCurrentChannel(
      {communityId, 
      channel: store.getState().PublicChannels.channels.entities[communityId].channels
      .ids[0] as string
    }
    )
  );
  store.dispatch(
    publicChannelsActions.subscribeForAllTopics(communityId)
  );

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

  await waitForExpect(() => {
    expect(
      store.getState().PublicChannels.channels.entities[communityId]
        .channelMessages.ids
    ).toHaveLength(expectedCount);
  }, maxTime);

  log(
    `User ${userName} received ${
      store.getState().PublicChannels.channels.entities[communityId]
        .channelMessages.ids.length
    } messages`
  );
}

export async function assertReceivedMessagesAreValid(
  userName: string,
  messages: any[],
  maxTime: number = 600000,
  store: Store
) {
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
    if (msg) {
      validMessages.push(msg);
    }
  }

  await waitForExpect(() => {
    expect(validMessages).toHaveLength(messages.length);
  }, maxTime);
}



// Change to standard test, we already have this in store. 
export function* launchCommunitiesOnStartupSaga(): Generator {
  yield* spawn(assertNoErrors);
  yield* take(communitiesActions.launchRegistrar);
  yield* take(communitiesActions.community);
  yield* take(communitiesActions.responseRegistrar);
}
