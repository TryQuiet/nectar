
test.skip('asdf', () => {})
// import { Crypto } from '@peculiar/webcrypto';
// import {
//   assertReceivedCertificates,
//   assertReceivedChannelsAndSubscribe,
//   assertReceivedMessages,
//   assertReceivedMessagesAreValid,
// } from './assertions';
// import {
//   createCommunity,
//   joinCommunity,
//   getCommunityOwnerData,
//   sendMessage,
// } from './appActions'
// import { createApp, createAppWithoutTor } from './utils';
// import { AsyncReturnType } from '../utils/types/AsyncReturnType.interface';
// import logger from '../utils/logger';

// const log = logger('tests');

// jest.setTimeout(600_000);
// const crypto = new Crypto();

// global.crypto = crypto;

// describe('send message - with tor', () => {
//   let owner: AsyncReturnType<typeof createApp>;
//   let userOne: AsyncReturnType<typeof createApp>;
//   let userTwo: AsyncReturnType<typeof createApp>;

//   beforeAll(async () => {
//     owner = await createApp();
//     userOne = await createApp();
//     userTwo = await createApp();
//   });

//   afterAll(async () => {
//     await owner.manager.closeAllServices();
//     await userOne.manager.closeAllServices();
//     await userTwo.manager.closeAllServices();
//   });

//   test('Owner creates community', async () => {
//     await createCommunity({ userName: 'Owner', store: owner.store });
//   });

//   test('Two users join community', async () => {
//     const ownerData = getCommunityOwnerData(owner.store);

//     await joinCommunity({
//       ...ownerData,
//       store: userOne.store,
//       userName: 'username1',
//       expectedPeersCount: 2,
//     });

//     await joinCommunity({
//       ...ownerData,
//       store: userTwo.store,
//       userName: 'username2',
//       expectedPeersCount: 3,
//     });
//   });

//   test('Owner and users received certificates', async () => {
//     await assertReceivedCertificates('owner', 3, 120_000, owner.store);
//     await assertReceivedCertificates('userOne', 3, 120_000, userOne.store);
//     await assertReceivedCertificates('userTwo', 3, 120_000, userTwo.store);
//   });

//   test('Users replicated channel and subscribed to it', async () => {
//     await assertReceivedChannelsAndSubscribe('owner', 1, 120_000, owner.store);
//     await assertReceivedChannelsAndSubscribe(
//       'userTwo',
//       1,
//       120_000,
//       userOne.store
//     );
//     await assertReceivedChannelsAndSubscribe(
//       'userTwo',
//       1,
//       120_000,
//       userTwo.store
//     );
//   });

//   let ownerMessageData;
//   let userOneMessageData;
//   let userTwoMessageData;

//   test('Every user sends one message to general channel', async () => {
//     ownerMessageData = await sendMessage('owner says hi', owner.store);
//     userOneMessageData = await sendMessage('userOne says hi', userOne.store);
//     userTwoMessageData = await sendMessage('userTwo says hi', userTwo.store);
//   });

//   test('Every user replicated all messages', async () => {
//     await assertReceivedMessages('owner', 3, 120_000, owner.store);
//     await assertReceivedMessages('userOne', 3, 120_000, userOne.store);
//     await assertReceivedMessages('userTwo', 3, 120_000, userTwo.store);
//   });

//   test('Replicated messages are valid', async () => {
//     log(`ownerMessage`)
//     await assertReceivedMessagesAreValid(
//       'owner',
//       [ownerMessageData, userOneMessageData, userTwoMessageData],
//       20000,
//       owner.store
//     );
//     await assertReceivedMessagesAreValid(
//       'userOne',
//       [ownerMessageData, userOneMessageData, userTwoMessageData],
//       20000,
//       owner.store
//     );
//     await assertReceivedMessagesAreValid(
//       'userTwo',
//       [ownerMessageData, userOneMessageData, userTwoMessageData],
//       20000,
//       owner.store
//     );
//   });
// });

// describe.skip('send message - without tor', () => {
//   let owner: AsyncReturnType<typeof createApp>;
//   let userOne: AsyncReturnType<typeof createApp>;
//   let userTwo: AsyncReturnType<typeof createApp>;

//   beforeAll(async () => {
//     owner = await createAppWithoutTor();
//     userOne = await createAppWithoutTor();
//     userTwo = await createAppWithoutTor();
//   });

//   afterAll(async () => {
//     await owner.manager.closeAllServices();
//     await userOne.manager.closeAllServices();
//     await userTwo.manager.closeAllServices();
//   });

//   test('Owner creates community', async () => {
//     await createCommunity({ userName: 'Owner', store: owner.store });
//   });

//   test('Two users join community', async () => {
//     const ownerData = getCommunityOwnerData(owner.store);

//     await joinCommunity({
//       ...ownerData,
//       store: userOne.store,
//       userName: 'username1',
//       expectedPeersCount: 2,
//     });

//     await joinCommunity({
//       ...ownerData,
//       store: userTwo.store,
//       userName: 'username2',
//       expectedPeersCount: 3,
//     });
//   });

//   test('Owner and users received certificates', async () => {
//     await assertReceivedCertificates('owner', 3, 120_000, owner.store);
//     await assertReceivedCertificates('userOne', 3, 120_000, userOne.store);
//     await assertReceivedCertificates('userTwo', 3, 120_000, userTwo.store);
//   });

//   test('Users replicated channel and subscribed to it', async () => {
//     await assertReceivedChannelsAndSubscribe('owner', 1, 120_000, owner.store);
//     await assertReceivedChannelsAndSubscribe(
//       'userTwo',
//       1,
//       120_000,
//       userOne.store
//     );
//     await assertReceivedChannelsAndSubscribe(
//       'userTwo',
//       1,
//       120_000,
//       userTwo.store
//     );
//   });

//   let ownerMessageData;
//   let userOneMessageData;
//   let userTwoMessageData;

//   test('Every user sends one message to general channel', async () => {
//     log('users send messages')
//     ownerMessageData = await sendMessage('owner says hi', owner.store);
//     userOneMessageData = await sendMessage('userOne says hi', userOne.store);
//     userTwoMessageData = await sendMessage('userTwo says hi', userTwo.store);
//     log(ownerMessageData.message, 'usermessage')
//     log(userOneMessageData.message,'usermessage')
//     log(userTwoMessageData.message,'usermessage')
//   });

//   test('Every user replicated all messages', async () => {
//     await assertReceivedMessages('owner', 3, 120_000, owner.store);
//     await assertReceivedMessages('userOne', 3, 120_000, userOne.store);
//     await assertReceivedMessages('userTwo', 3, 120_000, userTwo.store);
//   });

//   test('Replicated messages are valid', async () => {
//     await assertReceivedMessagesAreValid(
//       'owner',
//       [ownerMessageData, userOneMessageData, userTwoMessageData],
//       20000,
//       owner.store
//     );
//     await assertReceivedMessagesAreValid(
//       'userOne',
//       [ownerMessageData, userOneMessageData, userTwoMessageData],
//       20000,
//       owner.store
//     );
//     await assertReceivedMessagesAreValid(
//       'userTwo',
//       [ownerMessageData, userOneMessageData, userTwoMessageData],
//       20000,
//       owner.store
//     );
//   });
// });
