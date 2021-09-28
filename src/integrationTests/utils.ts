import { applyMiddleware, combineReducers, createAction, createStore, Store } from "@reduxjs/toolkit"
import assert from 'assert'
import debug from 'debug'
import fp from 'find-free-port'
import path from 'path'
import createSagaMiddleware from "redux-saga"
import thunk from 'redux-thunk'
import { io, Socket } from 'socket.io-client'
import { appActions } from "../sagas/app/app.slice"
import tmp from 'tmp'
import { call, fork, put, select, take, cancel, takeLatest } from "typed-redux-saga"
import waggle from 'waggle'
import { communities, errors, identity, publicChannels, storeKeys, users } from "../index"
import { useIO } from '../sagas/socket/startConnection/startConnection.saga'
const log = Object.assign(debug('nectar:tests'), {
  error: debug('nectar:tests:err')
})

function testReducer(state = { continue: false, finished: false, error: null, manager: null }, action) {
  switch (action.type) {
    case 'setManager':
      return {...state, manager: action.payload}
    case 'testContinue':
      return {...state, continue: true}
    case 'testFinished':
      return {...state, finished: true}
    case 'testFailed':
      return {...state, error: action.payload}
    default:
      return state
  }
}

export function* integrationTest(saga, ...args: any[]): Generator {
  /**
   *  Integration test saga wrapper for catching errors
   */
  try {
    yield* call(saga, ...args)
  } catch (e) {
    yield* put({type: 'testFailed', payload: e.message})
  }
}


export const watchResults = (stores: Store[], finalStore: Store, testName: string) => {
  for (const store of stores) {
    store.subscribe(() => {
      if (store.getState().Test.error) {
        log.error(`"${testName}" failed: `, store.getState().Test.error)
        process.exit(1)
      }
    })
  }
  const finalStoreUnsubscribe = finalStore.subscribe(() => {
    if (finalStore.getState().Test.finished) {
      finalStoreUnsubscribe()
      log(`"${testName}" passed`)
      for (const store of stores.filter((s) => s !== finalStore)) {
        store.dispatch(createAction('testFinished'))
      }
    }
  })
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

  return {
    store, 
    runSagas: () => sagaMiddleware.run(rootSaga),
    runSaga: sagaMiddleware.run
    
  }
}

const connectToDataport = (url: string, name: string): Socket => {
  const socket = io(url)
  socket.on('connect', async () => {
    log(`websocket connection is ready for app ${name}`)
  })
  return socket
}

export const createApp = async () => {
  /**
   * Configure and initialize ConnectionsManager from waggle,
   * configure redux store
   */
  const appName = (Math.random() + 1).toString(36).substring(7)
  log(`Creating test app for ${appName}`)
  const [dataServerPort1] = await fp(4677)
  const server1 = new waggle.DataServer(dataServerPort1)
  await server1.listen()

  let { store, runSagas, runSaga } = prepareStore(root)

  const [proxyPort] = await fp(1234)
  const [controlPort] = await fp(5555)
  const manager = new waggle.ConnectionsManager({
    agentHost: 'localhost',
    agentPort: proxyPort,
    options: {
      env: {
        appDataPath: createPath(createTmpDir(`nectarIntegrationTest-${appName}`).name)
      },
      torControlPort: controlPort
    },
    io: server1.io
  })
  await manager.init()

  runSagas()

  let c = 0

  const killShit = () => {
    c++
    if (c===1){
      console.log('killShit')
      process.exit()
    }
  }
  
  function* root(): Generator {
    // yield* put({type: 'setManager', payload: manager})
    const socket = yield* call(connectToDataport, `http://localhost:${dataServerPort1}`, appName)
    const task = yield* fork(useIO, socket)
    // console.log('CANCELLED TASK', task)
    yield* take(createAction('testFinished'))
    console.log('TESTFINISGED')
    // yield* cancel(task)

    yield* put(appActions.closeServices())
    // const mmm = yield* select((state) => state.Test.manager)
    // yield* call(mmm.tor.kill)
    killShit()
    // log('Killed tor')
  }
  
  return {store, runSaga}
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
    throw new assert.AssertionError({message: `No element in the ${actual} matches ${match}`})
  }
}

export const assertNotEmpty = (value: any, valueName: string) => {
  if (
    (value === null || value === undefined || value === '') || 
    (Array.isArray(value) && value.length === 0) || 
    (Object.keys(value).length === 0)
    ) {
      throw new assert.AssertionError({message: `${valueName} is empty but shouldn't be`})
  }
}