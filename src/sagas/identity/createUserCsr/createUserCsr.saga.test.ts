// import { expectSaga } from 'redux-saga-test-plan';

// import { combineReducers } from '@reduxjs/toolkit';
// import { call } from 'redux-saga-test-plan/matchers';
// import { createUserCsr } from '@zbayapp/identity';

// import { KeyObject } from 'crypto';
// import { StoreKeys } from '../../store.keys';
// import { createUserCsrSaga } from './createUserCsr.saga';
// import {
//   CreateUserCsrPayload,
//   identityActions,
//   identityReducer,
//   IdentityState,
// } from '../identity.slice';

// describe('createUserCsrSaga', () => {
//   const userCsr = {
//     userCsr: 'userCsr',
//     userKey: 'userKey',
//     pkcs10: {
//       publicKey: jest.fn() as unknown as KeyObject,
//       privateKey: jest.fn() as unknown as KeyObject,
//       pkcs10: 'pkcs10',
//     },
//   };
//   test('create csr', async () => {
//     const identityState = new IdentityState()
//     await expectSaga(
//       createUserCsrSaga,
//       identityActions.createUserCsr(<CreateUserCsrPayload>{})
//     )
//       .withReducer(
//         combineReducers({
//           // [StoreKeys.Init]: initReducer,
//           [StoreKeys.Identity]: identityReducer,
//         }),
//         {
//           // [StoreKeys.Init]: {
//           //   ...new InitState(),
//           //   isCryptoEngineInitialized: true,
//           // },
//           [StoreKeys.Identity]: {
//             ...identityState,
//           },
//         }
//       )
//       .provide([[call.fn(createUserCsr), userCsr]])
//       .hasFinalState({
//         // [StoreKeys.Init]: {
//         //   ...new InitState(),
//         //   isCryptoEngineInitialized: true,
//         // },
//         [StoreKeys.Identity]: {
//           ...identityState,
//           userCsr,
//         },
//       })
//       .run();
//   });
// });
