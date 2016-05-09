import invariant from 'invariant';
import React, { Component, PropTypes } from 'react';
import { connect, Provider } from 'react-redux';

export function isolateDispatch(isolateState: Function, isolateAction: Function) {
	invariant(typeof(isolateState) === 'function',
		'The first argument of isolateDispatch must be a function that selects an isolated subtree'
	);
	invariant(typeof(isolateAction) === 'function',
		'The second argument of isolateDispatch must be a function that creates a wrapping action for the isolation reducer'
	);

	return (dispatch: Function, ownProps: ?Object) => {
		invariant(typeof(dispatch) === 'function',
			'the isolated dispatch creator must be called with the dispatch function to create an isolated dispatch function'
		);
		const isolatedDispatch = action => {
			if(typeof(action) === 'function') {
				return dispatch((realDispatch, realGetState, ...extra) => {
					invariant(typeof(realDispatch) === 'function' && typeof(realGetState) === 'function',
						'dispatch and getState must be functions. Are you trying to execute a thunk without redux-thunk?'
					);
					return action(isolatedDispatch, () => isolateState(realGetState(), ownProps), ...extra);
				});
			} else {
				return dispatch(isolateAction(action, ownProps));
			}
		};
		return isolatedDispatch;
	};
}

export function isolate(isolateState: Function, isolateAction: Function) {
	invariant(typeof(isolateState) === 'function',
		'The first argument of isolate must be a function that selects an isolated subtree'
	);
	invariant(typeof(isolateAction) === 'function',
		'The second argument of isolate must be a function that creates a wrapping action for the isolation reducer'
	);

	const createDispatch = isolateDispatch(isolateState, isolateAction);
	return ComponentToIsolate => {
		class IsolatedComponent extends Component {
			static propTypes = {
				state: PropTypes.object.isRequired,
				dispatch: PropTypes.func.isRequired
			};

			constructor(props) {
				super(props);

				const { state, dispatch, ...ownProps } = props;

				this.listeners = [];
				this.lastState = state;
				this.currentIsolatedState = isolateState(state, ownProps);
				this.currentisolatedDispatch = createDispatch(dispatch, ownProps);

				const getIsolatedState = () => this.currentIsolatedState;
				const isolatedDispatch = (...args) => this.currentisolatedDispatch(...args);

				const localSubscribe = (listener: Function): Function => {
					let isSubscribed = true;
					const listeners = this.listeners;
					listeners.push(listener);
					return function unsubscribe() {
						if (!isSubscribed) {
							return;
						}
						isSubscribed = false;
						const index = listeners.indexOf(listener);
						listeners.splice(index, 1);
					};
				};

				// Our store proxy - matches a redux store minus
				// replaceReducers, which we will not need anyway
				this.proxyStore = {
					getState: getIsolatedState,
					dispatch: isolatedDispatch,
					subscribe: localSubscribe
				};
			}

			componentWillReceiveProps(props) {
				if(props.state !== this.lastState) {
					const { state, dispatch, ...ownProps } = props;
					this.lastState = props.state;
					this.currentIsolatedState = isolateState(state, ownProps);
					this.currentisolatedDispatch = createDispatch(dispatch, ownProps);
					this.updateListeners = true;
				}
			}

			componentDidUpdate() {
				if(this.updateListeners) {
					this.listeners.map(l => l());
					this.updateListeners = false;
				}
			}

			render() {
				const { state: _state, dispatch: _dispatch, ...ownProps } = this.props;
				return (
					<Provider store={this.proxyStore}>
						<ComponentToIsolate {...ownProps} />
					</Provider>
				);
			}
		}

		const displayName = ComponentToIsolate.displayName || ComponentToIsolate.name || 'Component';
		IsolatedComponent.displayName = `IsolatedComponent(${displayName})`;
		return connect(state => ({ state }))(IsolatedComponent);
	};
}
