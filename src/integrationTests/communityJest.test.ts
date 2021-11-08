import { expectSaga } from 'redux-saga-test-plan';
import {
  createCommunityTestSaga,
  joinCommunityTestSaga,
  getCommunityOwnerData,
  assertReceivedCertificates
} from './community';
import { createApp, finishTestSaga, integrationTest, userIsReady } from './utils';

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

   console.log(ownerPromise, 'ownerPromise')

// const userOnePromise = await user1.runSaga(integrationTest, joinCommunityTestSaga, {
//   userName: 'User1',
//   ...getCommunityOwnerData(owner.store),
//   expectedPeersCount: 2,
// }).toPromise()

// //   console.log(userOnePromise, 'userOnePromise')
  
//   const userTwoPromise = await user2.runSaga(integrationTest, joinCommunityTestSaga, {
//     userName: 'User2',
//     expectedPeersCount: 3,
//     ...getCommunityOwnerData(owner.store),
//   }).toPromise();

//   console.log(userTwoPromise, 'userTwoPromise')

  // const firstCHeck  = await owner.runSaga(
  //   integrationTest,
  //   assertReceivedCertificates,
  //   'Owner',
  //   2,
  //   60_000
  // ).toPromise();
  // const secondCheck  = await user1.runSaga(
  //   integrationTest,
  //   assertReceivedCertificates,
  //   'User',
  //   2,
  //   60_000
  // ).toPromise();
  // const ThirdCheck  = await user2.runSaga(
  //   integrationTest,
  //   assertReceivedCertificates,
  //   'User',
  //   2,
  //   60_000
  // ).toPromise();

  // console.log('after promisek', firstCHeck)
  
  // const finishSagaOwner = await owner.runSaga(finishTestSaga).toPromise()
  await owner.manager.closeAllServices()
  // const finishSagaUserOne = await user1.runSaga(finishTestSaga).toPromise()
  // const finishSagaUserTwo = await user2.runSaga(finishTestSaga).toPromise()

  // console.log('finishSagaOwner',  finishSagaOwner)

  console.log('after closing services')

    });
  });
  
  // await expectSaga(createCommunityTestSaga, payload)
  // .withReducer(combineReducers({ [StoreKeys.Communities]: communitiesReducer }) , app.store)
  //   .run();