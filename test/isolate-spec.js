import expect from 'expect';
import TestUtils from 'react-addons-test-utils';
import React, { Component, PropTypes } from 'react';
import { connect, Provider } from 'react-redux';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import { isolate } from '../src/index';


const subAppReducer = (state = { value: 1 }, action) => {
	if(action.type === 'set') {
		return { value: action.value };
	}
	if(action.type === 'double') {
		return { value: state.value * 2 };
	}
	return state;
};
const ACTION_PREFIX = 'isolated / ';
const INITIAL_SUBAPP_STATE = subAppReducer(undefined, { type: '__init__' });
const isolateSubAppState = (state, { id }) => state.subapps[id] || INITIAL_SUBAPP_STATE;
// We choose to use an action prefix here rather than, say, a string like 'counter action', to make it
// easier to follow dispatches in logging and devtools
const isolateSubAppAction = (action, { id }) => ({
	type: ACTION_PREFIX + action.type,
	subAppId: id,
	subAppAction: action
});

class SubApp extends Component {
	static propTypes = {
		value: PropTypes.number.isRequired
	};
	render() {
		return <div>{this.props.value}</div>;
	}
}
const ConnectedSubApp = connect(
	(state, ownProps) => {
		if(ownProps.mapStateSpy) {
			ownProps.mapStateSpy();
		}
		return {
			value: state.value
		};
	},
	(dispatch, ownProps) => {
		return {
			onRandomize: () => dispatch((dispatch, getState) => {
				const oldValue = getState().value;
				let newValue = oldValue;
				while(newValue === oldValue) {
					newValue = Math.round(Math.random() * 100);
				}
				dispatch({
					type: 'set',
					value: newValue
				});
			}),
			onDouble: () => dispatch({ type: 'double' }),
			onReset: () => dispatch({ type: 'set', value: ownProps.initialValue })
		};
	}
)(SubApp);
const IsolatedSubApp = isolate(isolateSubAppState, isolateSubAppAction)(ConnectedSubApp);

const subappsReducer = (state = {}, action) => {
	if(action.type.startsWith(ACTION_PREFIX)) {
		return {
			...state,
			[action.subAppId]: subAppReducer(state[action.subAppId], action.subAppAction)
		};
	}
	return state;
};

const rootReducer = combineReducers({
	subapps: subappsReducer
});

const createRootStore = () => createStore(rootReducer, applyMiddleware(thunk));

describe('react-redux-isolate', () => {
	describe('isolate', () => {
		it('passes through isolated state', () => {
			const store = createRootStore();
			const container = TestUtils.renderIntoDocument(
				<Provider store={store}>
					<IsolatedSubApp id={1} />
				</Provider>
			);
			const stub = TestUtils.findRenderedComponentWithType(container, SubApp);

			expect(stub.props.value).toEqual(1);
			expect(() =>
				TestUtils.findRenderedComponentWithType(container, IsolatedSubApp)
			).toNotThrow();
		});

		it('isolates vanilla actions', () => {
			const store = createRootStore();
			const container = TestUtils.renderIntoDocument(
				<Provider store={store}>
					<IsolatedSubApp id={1} />
				</Provider>
			);
			const stub = TestUtils.findRenderedComponentWithType(container, SubApp);

			expect(store.getState().subapps[1]).toNotExist();
			stub.props.onDouble();
			expect(store.getState().subapps[1]).toExist();
			expect(store.getState().subapps[1].value).toEqual(2);
		});

		it('passes ownProps to sub component', () => {
			const store = createRootStore();
			const container = TestUtils.renderIntoDocument(
				<Provider store={store}>
					<IsolatedSubApp id={1} initialValue={3} />
				</Provider>
			);
			const stub = TestUtils.findRenderedComponentWithType(container, SubApp);

			stub.props.onReset();
			expect(store.getState().subapps[1].value).toEqual(3);
		});

		it('isolates thunks', () => {
			const store = createRootStore();
			const container = TestUtils.renderIntoDocument(
				<Provider store={store}>
					<IsolatedSubApp id={1} initialValue={10} />
				</Provider>
			);
			const stub = TestUtils.findRenderedComponentWithType(container, SubApp);

			stub.props.onReset();
			stub.props.onRandomize();
			expect(store.getState().subapps[1].value).toNotEqual(10);
		});

		it('only notifies subscriptions when subtree actually changes', () => {
			const store = createRootStore();
			let mapStateToPropsCalls = 0;
			const mapStateSpy = () => { mapStateToPropsCalls++; };

			const container = TestUtils.renderIntoDocument(
				<Provider store={store}>
					<IsolatedSubApp id={1} mapStateSpy={mapStateSpy} />
				</Provider>
			);
			expect(mapStateToPropsCalls).toEqual(1);

			const stub = TestUtils.findRenderedComponentWithType(container, SubApp);
			stub.props.onDouble();
			expect(mapStateToPropsCalls).toEqual(2);

			// Important - unrelated actions should not affect subscriptions in an isolated state-tree.
			store.dispatch({ type: 'unrelated action' });
			expect(mapStateToPropsCalls).toEqual(2);

			store.dispatch({
				type: ACTION_PREFIX + 'set',
				subAppId: 1,
				subAppAction: {
					type: 'set', value: 4
				}
			});
			expect(mapStateToPropsCalls).toEqual(3);
		});

	});
});
