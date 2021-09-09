import { applyMiddleware, combineReducers, createAction, createStore, PayloadAction } from "@reduxjs/toolkit"
import createSagaMiddleware from "redux-saga"
import { all, call, fork, put, select, take, takeEvery } from "redux-saga/effects"
import { communitiesMasterSaga } from '../../sagas/communities/communities.master.saga'
import waggle from 'waggle'
import { io, Socket } from 'socket.io-client'
import fp from 'find-free-port'
import tmp from 'tmp'
import path from 'path'
import thunk from 'redux-thunk'
import { communities, storeKeys } from "../../index"
import { handleActions, useIO } from '../../sagas/socket/startConnection/startConnection.saga'
import { createCommunitySaga } from "../../sagas/communities/createCommunity/createCommunity.saga"
import { communitiesActions } from "../../sagas/communities/communities.slice"
import { communitiesSelectors } from "../../sagas/communities/communities.selectors"
import { identityMasterSaga } from "../../sagas/identity/identity.master.saga"
import { identityActions } from "../../sagas/identity/identity.slice"
import { createUserCsr, configCrypto } from "@zbayapp/identity"
import { UserCsr } from "@zbayapp/identity/lib/requestCertificate"
import { messagesMasterSaga } from "../messages/messages.master.saga"

export const createTmpDir = (prefix: string) => {
  return tmp.dirSync({ mode: 0o750, prefix, unsafeCleanup: true })
}

export const createPath = (dirName: string) => {
  return path.join(dirName, '.nectar')
}

function testReducer(state = { value: 0 }, action) {
  switch (action.type) {
    default:
      return state
  }
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
    'test': testReducer
  }
  const combinedReducers = combineReducers(reducers)
  const sagaMiddleware = createSagaMiddleware()
  const store = createStore(
    combinedReducers,
    applyMiddleware(...[sagaMiddleware, thunk])
  )
  sagaMiddleware.run(rootSaga)
  return store
}

const createApp = async (name: string) => {
  const [dataServerPort1] = await fp(4677)
  const server1 = new waggle.DataServer(dataServerPort1)
  await server1.listen()
  
  const socket = io(`http://localhost:${dataServerPort1}`)
  socket.on('connect', async () => {
    console.log(`websocket connection is ready for ${name}`)
  })
  function* root(): Generator {
    console.log('root saga')
    yield all([
      fork(handleActions, socket),
      fork(handleTest),
      // fork(publicChannelsMasterSaga, socket),
      fork(messagesMasterSaga, socket),
      fork(identityMasterSaga, socket),
      fork(communitiesMasterSaga, socket)
    ])
  }
  const store = prepareStore(root)

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
  return store
}

function* createCommunityTestSaga(payload): Generator { // this is first user
  const userName = payload.payload.userName
  console.log(payload, '<- payload?')
  console.log('1. Start', userName)
  const sth = yield put(communitiesActions.createNewCommunity('CommunityName'))
  console.log('2. Creating new community?', userName)
  const createdCommunity = yield take(communitiesActions.responseCreateCommunity)
  console.log('3. Created new community', userName)
  const csrObj = yield call(createUserCsr, {
    zbayNickname: userName, 
    commonName: 'CommunityName', 
    peerId: 'asdasdasdsad', 
    dmPublicKey: '12321312', 
    signAlg: configCrypto.signAlg,
    hashAlg: configCrypto.hashAlg
  })
  console.log('4. Created csr', userName)
  const currentCommunity = yield select(communitiesSelectors.currentCommunity())
  // @ts-expect-error
  yield put(identityActions.storeUserCsr({userCsr: csrObj, communityId: createdCommunity.payload.id, registrarAddress: `http://${currentCommunity.onionAddress}.onion:${currentCommunity.port}`}))
  console.log('5. Registered user', userName)
}

function* joinCommunityTestSaga(payload): Generator {  // this is second user
  const {registrarAddress, communityId, userName} = payload.payload
  console.log('1. Start', userName)
  const csrObj = yield call(createUserCsr, {
    zbayNickname: userName, 
    commonName: 'CommunityName', 
    peerId: 'zxczxczxc',
    dmPublicKey: '6578678678', 
    signAlg: configCrypto.signAlg,
    hashAlg: configCrypto.hashAlg
  })
  console.log('PAYLOAD:', registrarAddress, communityId, userName)
  // @ts-expect-error
  yield put(identityActions.storeUserCsr({userCsr: csrObj, communityId, registrarAddress}))
  console.log('2. Registered user?', userName)
  yield put(communitiesActions.joinCommunity(registrarAddress))
  console.log('3. Joined community')
  // const createdCommunity = yield take(communitiesActions.responseCreateCommunity)
  // console.log('... ', createdCommunity)
  console.log('4. Joined community - response')
}

const test = async () => {
  const store1 = await createApp('First')
  const store2 = await createApp('Second')

  store1.dispatch({type: 'userCreatingCommunity', payload: {userName: 'Owner'}})

  const unsubscribe = store1.subscribe(async () => {
    const communitiesState = store1.getState()['Communities']
    const communities = communitiesState.communities
    const mainCommunityId = communitiesState.currentCommunity
    if (mainCommunityId && communities.entities[mainCommunityId].onionAddress) {
      unsubscribe()
      const community = communities.entities[mainCommunityId]
      const registrarAddress = `http://${community.onionAddress}.onion:${community.port}`
      store2.dispatch({type: 'userJoiningCommunity', payload: {userName: 'User', registrarAddress, communityId: community.id}})
    }
  })

  store2.subscribe(() => {
    console.log('store 2 state', store2.getState())
  })
}

test().catch(e => console.error('oops', e))