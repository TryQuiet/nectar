import { applyMiddleware, combineReducers, createStore } from "@reduxjs/toolkit"
import assert from 'assert'
import fp from 'find-free-port'
import path from 'path'
import createSagaMiddleware from "redux-saga"
import { all, fork } from "redux-saga/effects"
import thunk from 'redux-thunk'
import { io, Socket } from 'socket.io-client'
import tmp from 'tmp'
import { call } from "typed-redux-saga"
import waggle from 'waggle'
import { communities, errors, identity, publicChannels, storeKeys, users } from "../index"
import { communitiesMasterSaga } from '../sagas/communities/communities.master.saga'
import { identityMasterSaga } from "../sagas/identity/identity.master.saga"
import { messagesMasterSaga } from "../sagas/messages/messages.master.saga"
import { handleActions } from '../sagas/socket/startConnection/startConnection.saga'

function testReducer(state = { done: false }, action) {
  console.log('TEST REDUCER -> ', action.type)
  switch (action.type) {
    case 'setDone':
      return {done: true}
    default:
      return state
  }
}

export const createTmpDir = (prefix: string) => {
  return tmp.dirSync({ mode: 0o750, prefix, unsafeCleanup: true })
}

export const createPath = (dirName: string) => {
  return path.join(dirName, '.nectar')
}

export const prepareStore = (rootSaga) => {
  const reducers = {
    [storeKeys.Communities]: communities.reducer,
    [storeKeys.Identity]: identity.reducer,
    [storeKeys.Users]: users.reducer,
    [storeKeys.Errors]: errors.reducer,
    [storeKeys.Messages]: errors.reducer,
    [storeKeys.PublicChannels]: publicChannels.reducer,
    'Test': testReducer
  }
  const combinedReducers = combineReducers(reducers)
  const sagaMiddleware = createSagaMiddleware()
  const store = createStore(
    combinedReducers,
    applyMiddleware(...[sagaMiddleware, thunk])
  )

  return { store, runSagas: () => sagaMiddleware.run(rootSaga) }
}

const connectToDataport = (url: string, name: string): Socket => {
  const socket = io(url)
  socket.on('connect', async () => {
    console.log(`websocket connection is ready for ${name}`)
  })
  return socket
}

export const createApp = async (name: string, handleTestActions) => {
  /**
   * Configure and initialize ConnectionsManager from waggle,
   * configure redux store
   */
  const [dataServerPort1] = await fp(4677)
  const server1 = new waggle.DataServer(dataServerPort1)
  await server1.listen()

  const { store, runSagas } = prepareStore(root)

  const [proxyPort] = await fp(1234)
  const [controlPort] = await fp(5555)
  const manager1 = new waggle.ConnectionsManager({
    agentHost: 'localhost',
    agentPort: proxyPort,
    options: {
      env: {
        appDataPath: path.join(createTmpDir(`nectarIntegrationTest${name}`).name, '.nectar')
      },
      torControlPort: controlPort,
      useLocalTorFiles: true
    },
    io: server1.io
  })
  await manager1.init()

  runSagas()
  
  function* root(): Generator {
    const socket = yield* call(connectToDataport, `http://localhost:${dataServerPort1}`, name);
    yield all([
      fork(handleTestActions),
      fork(handleActions, socket),
      fork(messagesMasterSaga, socket),
      fork(identityMasterSaga, socket),
      fork(communitiesMasterSaga, socket)
    ])
  }
  
  return store
}

export const assertListElementMatches = (actual: any[], match: RegExp) => {
  let counter = 0
  for (const item of actual) {
    try {
      assert.match(item, match)
    } catch (e) {
      counter++
    }
  }
  if (counter === actual.length) {
    throw new assert.AssertionError({message: `No element in the list matches ${match}`})
  }
}
