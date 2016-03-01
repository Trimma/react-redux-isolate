import React, { Component, PropTypes } from 'react';
import { connect, Provider } from 'react-redux';

export function createSandboxedDispatch(mapState: Function, mapAction: Function) {
	return (dispatch: Function) => {
		const sandboxedDispatch = action => {
			if(typeof(action) === 'function') {
				return dispatch((realDispatch, realGetState, ...extra) => {
					return action(sandboxedDispatch, () => mapState(realGetState()), ...extra);
				});
			} else {
				return dispatch(mapAction(action));
			}
		};
		return sandboxedDispatch;
	};
}

export function createReduxSandbox(mapSandboxedState: Function, mapSandboxedAction: Function) {
	return (ComponentToSandbox) => {
		class ReduxSandbox extends Component {
			static propTypes = {
				state: PropTypes.object.isRequired,
				dispatch: PropTypes.func.isRequired
			};

			constructor(props) {
				super(props);

				this.listeners = [];
				this.lastState = props.state;
				this.currentSandboxState = mapSandboxedState(props.state);

				const getSandboxState = () => this.currentSandboxState;

				const dispatchWithinSandbox = createSandboxedDispatch(mapSandboxedState, mapSandboxedAction)(props.dispatch);

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
				// replaceReducers, which we will not need
				this.proxyStore = {
					getState: getSandboxState,
					dispatch: dispatchWithinSandbox,
					subscribe: localSubscribe
				};
			}

			componentWillReceiveProps(props) {
				if(props.state !== this.lastState) {
					this.lastState = props.state;
					this.currentSandboxState = mapSandboxedState(props.state);
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
				const { state, dispatch, ...props } = this.props;
				return (
					<Provider store={this.proxyStore}>
						<ComponentToSandbox {...props} />
					</Provider>
				);
			}
		}

		const displayName = ComponentToSandbox.displayName || ComponentToSandbox.name || 'Component';
		ReduxSandbox.displayName = `ReduxSandbox(${displayName})`;
		return connect(state => ({ state }))(ReduxSandbox);
	};
}
