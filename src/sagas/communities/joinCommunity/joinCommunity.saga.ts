import { put, apply, select } from "typed-redux-saga";
import {communitiesActions} from '../communities.slice'
import crypto from 'crypto'
import { Socket } from "socket.io-client";
import { SocketActionTypes } from "../../socket/const/actionTypes";
import {communitiesSelectors } from '../communities.selectors'

export function* joinCommunitySaga (socket: Socket,   action: any): Generator {
    const id = crypto.randomBytes(16).toString('hex').toUpperCase()
    const payload = {id: id, registrarUrl: action.payload}
    yield* put(communitiesActions.addNewCommunity(payload))
    yield* apply(socket, socket.emit, [SocketActionTypes.CREATE_COMMUNITY, {id}])
}