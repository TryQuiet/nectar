import { errorsAdapter } from "./errors.adapter"
import { errorsActions, errorsReducer } from "./errors.slice"

test('errors reducer should set errors', () => {
  const errorPayload = {type: 'community', code: 500, message: 'Error occured', communityId: 'community-id'}
  const errorPayload2 = {type: 'other', code: 403, message: 'Validation error occured', communityId: 'community-id'}
  const errorPayload3 = {type: 'community', code: 403, message: 'Validation error occured', communityId: 'different-community-id'}
  const state = errorsReducer(errorsAdapter.getInitialState(), errorsActions.setError(errorPayload))
  const stateUpdated = errorsReducer(state, errorsActions.setError(errorPayload2))
  const newestState = errorsReducer(stateUpdated, errorsActions.setError(errorPayload3))
  expect(newestState).toEqual({
    ids: [errorPayload.communityId, errorPayload3.communityId],
    entities: {
      [errorPayload.communityId]: {
        id: errorPayload.communityId,
        errors: {
          ids: [errorPayload.type, errorPayload2.type],
          entities: {
            [errorPayload.type]: {
              ...errorPayload
            }, 
            [errorPayload2.type]: {
              ...errorPayload2
            }
          }
        }
      },
      [errorPayload3.communityId]: {
        id: errorPayload3.communityId,
        errors: {
          ids: [errorPayload3.type],
          entities: {
            [errorPayload3.type]: {
              ...errorPayload3
            }
          }
        }
      }
    }
  })
})