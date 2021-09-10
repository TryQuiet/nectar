import { applyMiddleware, combineReducers, createAction, createStore, PayloadAction } from "@reduxjs/toolkit"
import createSagaMiddleware from "redux-saga"
import { all, fork, put, select, take, takeEvery } from "redux-saga/effects"
import { call } from "typed-redux-saga"
import { communitiesMasterSaga } from '../../sagas/communities/communities.master.saga'
import waggle from 'waggle'
import { io, Socket } from 'socket.io-client'
import fp from 'find-free-port'
import tmp from 'tmp'
import path from 'path'
import thunk from 'redux-thunk'
import { communities, storeKeys, identity, users, errors } from "../../index"
import { handleActions, useIO } from '../../sagas/socket/startConnection/startConnection.saga'
import { createCommunitySaga } from "../../sagas/communities/createCommunity/createCommunity.saga"
import { communitiesActions } from "../../sagas/communities/communities.slice"
import { communitiesSelectors } from "../../sagas/communities/communities.selectors"
import { identityMasterSaga } from "../../sagas/identity/identity.master.saga"
// import { identityActions, identityReducer } from "../../sagas/identity/identity.slice"
import { createUserCsr, configCrypto } from "@zbayapp/identity"
import { UserCsr } from "@zbayapp/identity/lib/requestCertificate"
import { messagesMasterSaga } from "../messages/messages.master.saga"
// import {communities}

export const createTmpDir = (prefix: string) => {
  return tmp.dirSync({ mode: 0o750, prefix, unsafeCleanup: true })
}

export const createPath = (dirName: string) => {
  return path.join(dirName, '.nectar')
}

function testReducer(state = { value: 0 }, action) {
  return state
}

export function* handleTest(): Generator {
  console.log('handling test')
  yield all([
    takeEvery(
      createAction('userCreatingCommunity'),
      createCommunityTestSaga,
    ),
    takeEvery(
      createAction('userJoiningCommunity'),
      joinCommunityTestSaga,
    ),
  ]);
}

const prepareStore = (rootSaga) => {
  const reducers = {
    [storeKeys.Communities]: communities.reducer,
    [storeKeys.Identity]: identity.reducer,
    [storeKeys.Users]: users.reducer,
    [storeKeys.Errors]: errors.reducer,
    'test': testReducer
  }
  const combinedReducers = combineReducers(reducers)
  const sagaMiddleware = createSagaMiddleware()
  const store = createStore(
    combinedReducers,
    applyMiddleware(...[sagaMiddleware, thunk])
  )

  return { store, runSagas: () =>sagaMiddleware.run(rootSaga) }
}

const connectToDataport = (url, name): Socket => {
  const socket = io(url)
  socket.on('connect', async () => {
    console.log(`websocket connection is ready for ${name}`)
  })
  return socket
}

const createApp = async (name: string) => {
  const [dataServerPort1] = await fp(4677)
  const server1 = new waggle.DataServer(dataServerPort1)
  await server1.listen()

  const  { store, runSagas } = prepareStore(root)

  const [proxyPort] = await fp(1234)
  const [controlPort] = await fp(5555)
  const manager1 = new waggle.ConnectionsManager({
    agentHost: 'localhost',
    agentPort: proxyPort,
    options: {
      env: {
        appDataPath: path.join(createTmpDir(`nectarIntegrationTest${name}`).name, '.nectar')
      },
      torControlPort: controlPort
    },
    io: server1.io
  })
  await manager1.init()

  runSagas()
  
  function* root(): Generator {
    console.log('root saga')
    const socket = yield* call(connectToDataport, `http://localhost:${dataServerPort1}`, name);
    yield all([
      fork(handleActions, socket),
      fork(handleTest),
      // fork(publicChannelsMasterSaga, socket),
      fork(messagesMasterSaga, socket),
      fork(identityMasterSaga, socket),
      fork(communitiesMasterSaga, socket)
    ])
  }
  
  return store
}

function* createCommunityTestSaga(payload): Generator {
  const userName = payload.payload.userName
  console.log('1. Start', userName)
  yield put(communitiesActions.createNewCommunity('CommunityName'))
  console.log('2. Creating new community?', userName)
  const createdCommunity = yield take(communitiesActions.responseCreateCommunity)
  console.log('3. Created new community', userName)
  yield put(identity.actions.registerUsername(userName))
  // yield select(communitiesSelectors.currentCommunity())
  console.log('5. Registered user', userName)
}

function* joinCommunityTestSaga(payload): Generator {  // this is second user
  const { registrarAddress, communityId, userName } = payload.payload
  console.log('PAYLOAD:', registrarAddress, communityId, userName)
  console.log('1. Start', userName)
  yield put(communitiesActions.joinCommunity(registrarAddress))
  console.log('2. after join community action', userName)
  const createdCommunity = yield take(communitiesActions.responseCreateCommunity)
  console.log('3. Joined community', userName, createdCommunity)
  yield put(identity.actions.registerUsername(userName))
}

const test = async () => {
  const store1 = await createApp('First')
  const store2 = await createApp('Second')

  store1.dispatch({ type: 'userCreatingCommunity', payload: { userName: 'Owner' } })

  const unsubscribe = store1.subscribe(async () => {
    const communitiesState = store1.getState().Communities
    const identityState = store1.getState().Identity
    const useridentity = identityState.entities[identityState.ids[0]]
    const communities = communitiesState.communities
    const mainCommunityId = communitiesState.currentCommunity

    // TODO: simplify this ^
    if (mainCommunityId && communities.entities[mainCommunityId].onionAddress && useridentity && useridentity.userCertificate) {
      unsubscribe()
      const community = communities.entities[mainCommunityId]
      const registrarAddress = community.onionAddress
      store2.dispatch({ type: 'userJoiningCommunity', payload: { userName: 'User', registrarAddress, communityId: community.id } })
    }
  })

  // store2.subscribe(() => {
  //   // const identityState = store1.getState().Identity
  //   // console.log('store 1 state', identityState.entities[identityState.ids[0]])
  //   console.log('STORE2:', store2.getState())
  // })
}

test().catch(e => console.error('oops', e))