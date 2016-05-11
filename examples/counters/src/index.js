import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';

import { isolate } from '../../../src/index';
import { rootReducer as counterRootReducer, App as CounterApp } from './counter';
import { INCREMENT as COUNTER_INCREMENT, DECREMENT as COUNTER_DECREMENT } from './counter/contants';

// Set up isolation semantics.
// We want our counter state trees to mount in state.counters[id],
// we pass in the id ourselves as a prop to the isolated component
const PREFIX_COUNTER_ACTION = 'counter / ';
const isolateCounterState = (state, { id }) => state.counters[id] || INITIAL_COUNTER_STATE;
// We choose to use an action prefix here rather than, say, a string like 'counter action', to make it
// easier to follow dispatches in logging and devtools
const isolateCounterAction = (action, { id }) => ({
	type: PREFIX_COUNTER_ACTION + action.type,
	counterId: id,
	counterAction: action
});

// Create an isolated component from CounterApp that can only connect() to a sub-tree
const IsolatedCounterApp = isolate(isolateCounterState, isolateCounterAction)(CounterApp);

// Create reducer that contains counter sub-trees
const INITIAL_COUNTER_STATE = counterRootReducer(undefined, { type: '__init__' });
const countersReducer = (state = {}, action) => {
	if(action.type.startsWith(PREFIX_COUNTER_ACTION)) {
		return {
			...state,
			[action.counterId]: counterRootReducer(state[action.counterId], action.counterAction)
		};
	}
	return state;
};

// Create main app root reducer
const rootReducer = combineReducers({
	counters: countersReducer
});

// We can define a middleware to react to counter actions,
// allowing for some complex orchestration without introducing upward dependencies
// in the counter app
const countersMiddleware = store => next => action => {
	if(action.type.startsWith(PREFIX_COUNTER_ACTION)) {
		const { counterId, counterAction } = action;

		// For each decrement or increment on right counter, double it for left counter
		if(counterId === 'right' && [COUNTER_INCREMENT, COUNTER_DECREMENT].includes(counterAction.type)) {
			store.dispatch({
				type: action.type,
				counterId: 'left',
				counterAction: {
					...counterAction,
					amount: counterAction.amount * 2
				}
			});
		}
	}
	return next(action);
};

// Create store
const store = createStore(rootReducer, applyMiddleware(
	thunk,
	countersMiddleware
));

// create root element with two counters side by side
const rootElement = (
	<div>
		<Provider store={store}>
			<div style={{position: 'absolute', left: 0, top: 0, bottom: 0, right: '50%'}}>
				<IsolatedCounterApp id='left' />
			</div>
			<div style={{position: 'absolute', left: '50%', top: 0, bottom: 0, right: 0}}>
				<IsolatedCounterApp id='right' />
			</div>
		</Provider>
	</div>
);
render(rootElement, document.getElementById('root'));
