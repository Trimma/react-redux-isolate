import React, { Component, PropTypes } from 'react';
import { connect, Provider } from 'react-redux';

export function isolateDispatch(isolateState: Function, isolateAction: Function) {
	return (dispatch: Function) => {
		const isolatedDispatch = action => {
			if(typeof(action) === 'function') {
				return dispatch((realDispatch, realGetState, ...extra) => {
					return action(isolatedDispatch, () => isolateState(realGetState()), ...extra);
				});
				// Should probably add support for promises here
			} else {
				return dispatch(isolateAction(action));
			}
		};
		return isolatedDispatch;
	};
}

export function isolate(isolateState: Function, isolateAction: Function) {
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

				const getIsolatedState = () => this.currentIsolatedState;

				const isolatedDispatch = isolateDispatch(isolateState, isolateAction)(dispatch);

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
				const { state, dispatch, ...ownProps } = this.props;
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
