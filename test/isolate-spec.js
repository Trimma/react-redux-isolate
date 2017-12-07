import expect from 'expect';
import { mount } from 'enzyme';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
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
		const currentState = state[action.subAppId] || INITIAL_SUBAPP_STATE;
		return {
			...state,
			[action.subAppId]: subAppReducer(currentState, action.subAppAction)
		};
	}
	return state;
};

const rootReducer = combineReducers({
	subapps: subappsReducer,
	counter: (state = 0, action) => {
		if(action.type === 'increment root counter') {
			return state + 1;
		}
		return state;
	}
});

const createRootStore = () => createStore(rootReducer, applyMiddleware(thunk));

describe('react-redux-isolate', () => {
	describe('isolate', () => {
		it('passes through isolated state', () => {
			const store = createRootStore();
			const component = mount(
				<Provider store={store}>
					<IsolatedSubApp id={1} />
				</Provider>
			);
			const stub = component.find(SubApp);

			expect(stub.props().value).toEqual(1);
			expect(component.find(IsolatedSubApp).length).toEqual(1);
		});

		it('isolates vanilla actions', () => {
			const store = createRootStore();
			const component = mount(
				<Provider store={store}>
					<IsolatedSubApp id={1} />
				</Provider>
			);
			const stub = component.find(SubApp);

			expect(store.getState().subapps[1]).toNotExist();
			stub.props().onDouble();
			expect(store.getState().subapps[1]).toExist();
			expect(store.getState().subapps[1].value).toEqual(2);
		});

		it('passes ownProps to sub component', () => {
			const store = createRootStore();
			const component = mount(
				<Provider store={store}>
					<IsolatedSubApp id={1} initialValue={3} />
				</Provider>
			);
			const stub = component.find(SubApp);

			stub.props().onReset();
			expect(store.getState().subapps[1].value).toEqual(3);
		});

		it('isolates thunks', () => {
			const store = createRootStore();
			const component = mount(
				<Provider store={store}>
					<IsolatedSubApp id={1} initialValue={10} />
				</Provider>
			);
			const stub = component.find(SubApp);

			stub.props().onReset();
			stub.props().onRandomize();
			expect(store.getState().subapps[1].value).toNotEqual(10);
		});

		it('only notifies subscriptions when subtree actually changes', () => {
			const store = createRootStore();
			let mapStateToPropsCalls = 0;
			const mapStateSpy = () => { mapStateToPropsCalls++; };

			const component = mount(
				<Provider store={store}>
					<IsolatedSubApp id={1} mapStateSpy={mapStateSpy} />
				</Provider>
			);
			expect(mapStateToPropsCalls).toEqual(1);

			const stub = component.find(SubApp);
			stub.props().onDouble();
			expect(mapStateToPropsCalls).toEqual(2);

			{
				const stateBefore = store.getState();
				store.dispatch({ type: 'increment root counter' });
				expect(store.getState()).toNotBe(stateBefore);

				// Important - unrelated actions should not affect subscriptions in an isolated state-tree.
				// React-redux's connect() handles this for us
				expect(mapStateToPropsCalls).toEqual(2);
			}

			store.dispatch({
				type: ACTION_PREFIX + 'set',
				subAppId: 2,
				subAppAction: {
					type: 'set', value: 33
				}
			});
			// Test pure dispatch too
			// connect() is still giving us performance
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
