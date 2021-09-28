import { applyMiddleware, combineReducers, createAction, createStore } from "@reduxjs/toolkit"
import assert from 'assert'
import debug from 'debug'
import fp from 'find-free-port'
import path from 'path'
import createSagaMiddleware from "redux-saga"
import thunk from 'redux-thunk'
import { io, Socket } from 'socket.io-client'
import tmp from 'tmp'
import { call, fork, put, take } from "typed-redux-saga"
import waggle from 'waggle'
import { communities, errors, identity, publicChannels, storeKeys, users } from "../index"
import { useIO } from '../sagas/socket/startConnection/startConnection.saga'
import logger from '../utils/logger'
const log = logger('tests')

function testReducer(state = { continue: false, finished: false, error: null, manager: null, rootTask: null }, action) {
  switch (action.type) {
    case 'setManager':
      return {...state, manager: action.payload}
    case 'setRootTask':
      return {...state, rootTask: action.payload}
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

export const watchResults = (apps: any[], finalApp: any, testName: string) => {
  log(`Running "${testName}"`)
  for (const app of apps) {
    app.store.dispatch({type: 'setRootTask', payload: app.rootTask})
    const storeUnsub = app.store.subscribe(() => {
      if (app.store.getState().Test.error) {
        storeUnsub()
        log.error(`"${testName}" failed: `, app.store.getState().Test.error)
        process.exit(1)
      }
    })
  }
  const finalStoreUnsubscribe = finalApp.store.subscribe(() => {
    if (finalApp.store.getState().Test.finished) {
      finalStoreUnsubscribe()
      log.success(`"${testName}" passed`)
      process.exit(0) // TODO: handle running multiple tests and make them not hang after passing
      // for (const app of apps.filter((a) => a !== finalApp)) {
      //   app.store.dispatch(createAction('testFinished'))
      // }
    }
  })
}

export const createTmpDir = (prefix: string) => {
  return tmp.dirSync({ mode: 0o750, prefix, unsafeCleanup: true })
}

export const createPath = (dirName: string) => {
  return path.join(dirName, '.nectar')
}

export const prepareStore = () => {
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

  const { store, runSaga } = prepareStore()

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

  const rootTask = runSaga(root)
  
  function* root(): Generator {
    const socket = yield* call(connectToDataport, `http://localhost:${dataServerPort1}`, appName)
    const task = yield* fork(useIO, socket)
    yield* take(createAction('testFinished'))
    // const root = yield* select((state) => {return state.Test.rootTask})
    // yield* cancel(root)
    // yield* cancel(task)
    // console.log('CANCELLED TASK', task)
    // yield* put(appActions.closeServices())
  }
  
  return {store, runSaga, rootTask}
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