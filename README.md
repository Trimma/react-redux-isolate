# React Redux Isolate

Provides a way for multiple react-redux apps to share the same state tree, adhering to the principle of Single Source Of Truth,
without requiring changes to the apps. It enables you to use *sub-apps* inside your redux app, without using multiple stores, and without requiring that you write your sub-apps in a particular manner.
Inspired by [cyclejs/isolate](https://github.com/cyclejs/isolate).

* Isolate Redux reducers, allowing them to be mounted as a subtree inside a larger state tree.
* Isolate React components to sandbox their redux connection to the subtree.

### Intuition

The package exposes an `isolate` function that isolates a Redux container, giving it it's own pseudo-store. The sub-app state tree is manually mounted in the root state tree, and information about how the sub-tree is handled is passed into the `isolate` function.

### Installation

```
npm install --save react-redux-isolate
```

The package depends on React, Redux and React-Redux.

### Usage

To isolate a redux subapp, we need to isolate the redux container:

```js
import { isolate } from 'react-redux-isolate';

const isolateCounterState = (state, { id }) => state.counters[id] || 0;
const PREFIX_COUNTER_ACTION = 'counter / ';
const isolateCounterAction = (action, { id }) => ({
  type: PREFIX_COUNTER_ACTION + action.type,
  counterId: id,
  counterAction: action
});

const IsolatedCounterApp = isolate(isolateCounterState, isolateCounterAction)(CounterApp);
```

We also need to mount the state tree accordingly:

```js
const countersReducer = (state = {}, action) => {
  if(action.type.startsWith(PREFIX_COUNTER_ACTION)) {
    return {
      ...state,
      [action.counterId]: counterRootReducer(state[action.counterId], action.counterAction)
    };
  }
  return state;
};
const rootReducer = combineReducers({
  counters: countersReducer
});
```

For a full example, se `examples/counters`. Try checking out this repository and running `npm run develop` inside the counters example to play around.

### License

MIT
