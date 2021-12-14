test.skip('sadf', () => {});

// import { Crypto } from '@peculiar/webcrypto';
// import {
//   assertReceivedCertificates,
//   assertReceivedChannelsAndSubscribe,
//   assertReceivedMessages,
//   launchCommunitiesOnStartupSaga,
//   assertReceivedMessagesAreValid,
//   assertStateIsCorrect
// } from './assertions';
// import {
//   createCommunity,
//   joinCommunity,
//   getCommunityOwnerData,
//   tryToJoinOfflineRegistrar,
//   sendMessage,
// } from './appActions'
// import {
//   createUserCsr,
//   UserCsr,
// } from '@zbayapp/identity/lib/requestCertificate';
// import { StoreKeys } from '../sagas/store.keys';
// import { identityAdapter } from '../sagas/identity/identity.adapter';
// import config from '@zbayapp/identity/lib/config';
// import { createApp, createAppWithoutTor } from './utils';
// import { communitiesAdapter } from '../sagas/communities/communities.adapter';
// import {
//   CommunitiesState,
//   Community,
// } from '../sagas/communities/communities.slice';
// import { Identity, IdentityState } from '../sagas/identity/identity.slice';

// import {
//   CommunityChannels,
//   PublicChannelsState,
// } from '../sagas/publicChannels/publicChannels.slice';
// import {
//   channelMessagesAdapter,
//   communityChannelsAdapter,
//   publicChannelsAdapter,
// } from '../sagas/publicChannels/publicChannels.adapter';
// import SingleResponse from 'pkijs/src/SingleResponse';
// import { AsyncReturnType } from 'src/utils/types/AsyncReturnType.interface';

// jest.setTimeout(600_000);

// const crypto = new Crypto();

// global.crypto = crypto;

// describe('relaunch app - simple scenario, only one user creates and closes community', () => {
//   let owner: AsyncReturnType<typeof createApp>
//   let userOne: AsyncReturnType<typeof createApp>
//   let userTwo: AsyncReturnType<typeof createApp>
//   let store: typeof owner.store
//   let oldState: ReturnType<typeof owner.store.getState>

//   beforeAll(async () => {
//     owner = await createApp();
//     // userOne = await createApp();
//     // userTwo = await createApp();
//   });

//   afterAll(async () => {
//     await owner.manager.closeAllServices();
//     // await userOne.manager.closeAllServices();
//     // await userTwo.manager.closeAllServices();
//   });

//   const sleep = async (time = 1000) =>
//   await new Promise<void>(resolve => {
//     setTimeout(() => {
//       resolve()
//     }, time)
//   })

//   test('Owner creates community', async () => {
//     await createCommunity({ userName: 'Owner', store: owner.store });
//     store = owner.store
//   });

//   test('Owner successfully closes app', async () => {
//     await owner.manager.closeAllServices();
//   })

//   test('Owner relaunch application with previous state', async () => {
//     oldState = store.getState()
//     owner = await createApp(oldState)

//     // Wait before checking state in case some unwanted actions are executing and manipulating store
//     await sleep(20_000)
//     store = owner.store
//   });

//   test('Assert that owner store is correct', async () => {
//     const currentState = store.getState()
//     await assertStateIsCorrect(oldState, currentState)
//   })

//   test('Assert UserOne store is correct', () => {})
//   test('Assert userTwo store is correct', () => {})
//   test('Every user sends message', () => {})
//   test('All users replicate messages', () => {})
//   test('', () => {})
//   test('', () => {})
//   test('', () => {})
//   test('', () => {})
//   test('', () => {})
//   test('', () => {})
//   test('', () => {})
//   test('', () => {})
// });
