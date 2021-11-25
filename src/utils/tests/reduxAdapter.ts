import { Store } from "../../sagas/store.types";

export class CustomReduxAdapter {
  store: Store;

  constructor(store: Store) {
    this.store = store;
  }

  build<T>(Action, payload?: Partial<T>) {
    return Action(payload);
  }

  async save(action) {
    return this.store.dispatch(action).payload;
  }
}
