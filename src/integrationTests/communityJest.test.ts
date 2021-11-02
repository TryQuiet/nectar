import { expectSaga } from 'redux-saga-test-plan';
import {
  createCommunityTestSaga,
  joinCommunityTestSaga,
  getCommunityOwnerData,
  assertReceivedCertificates
} from './community';
import { createApp, integrationTest, userIsReady } from './utils';

jest.setTimeout(600_000);
expectSaga.DEFAULT_TIMEOUT = 100_000;

describe('communityJest', () => {
  test('communityJest', async () => {
    const owner = await createApp();
    // const user1 = await createApp();
    // const user2 = await createApp();
    
    const ownerPromise = await owner
      .runSaga(integrationTest, createCommunityTestSaga, {
        userName: 'Owner',
      })
      .toPromise()

   console.log(ownerPromise, 'ownerPRomise')

// const userOnePromise = await user1.runSaga(integrationTest, joinCommunityTestSaga, {
//   userName: 'User1',
//   ...getCommunityOwnerData(owner.store),
//   expectedPeersCount: 2,
// }).toPromise()

//   console.log(userOnePromise, 'userOnePromise')
  
//   const userTwoPromise = await user2.runSaga(integrationTest, joinCommunityTestSaga, {
//     userName: 'User2',
//     expectedPeersCount: 3,
//     ...getCommunityOwnerData(owner.store),
//   }).toPromise();

//   console.log(userTwoPromise, 'userTwoPromise')


  await owner.runSaga(
    integrationTest,
    assertReceivedCertificates,
    'Owner',
    3,
    60_000
  ).toPromise();

    });
  });
  
  // await expectSaga(createCommunityTestSaga, payload)
  // .withReducer(combineReducers({ [StoreKeys.Communities]: communitiesReducer }) , app.store)
  //   .run();