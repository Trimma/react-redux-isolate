/*
Copyright (c) 2015-present Dan Abramov (https://github.com/reactjs/redux)

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the
Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { INCREMENT, DECREMENT } from './constants';

export class Counter extends Component {
	static propTypes = {
		value: PropTypes.number.isRequired,
		onIncrement: PropTypes.func.isRequired,
		onDecrement: PropTypes.func.isRequired
	}

	constructor(props) {
		super(props);
		this.incrementAsync = this.incrementAsync.bind(this);
		this.incrementIfOdd = this.incrementIfOdd.bind(this);
	}

	incrementIfOdd() {
		if (this.props.value % 2 !== 0) {
			this.props.onIncrement();
		}
	}

	incrementAsync() {
		setTimeout(this.props.onIncrement, 1000);
	}

	render() {
		const { value, onIncrement, onDecrement } = this.props;
		return (
			<p>
				Clicked: {value} times
				{' '}
				<button onClick={onIncrement}>
					+
				</button>
				{' '}
				<button onClick={onDecrement}>
					-
				</button>
				{' '}
				<button onClick={this.incrementIfOdd}>
					Increment if odd
				</button>
				{' '}
				<button onClick={this.incrementAsync}>
					Increment async
				</button>
			</p>
		);
	}
}

const mapStateToProps = state => ({
	value: state
});
const mapDispatchToProps = dispatch => ({
	onIncrement: () => dispatch({
		type: INCREMENT, amount: 1
	}),
	onDecrement: () => dispatch({
		type: DECREMENT, amount: 1
	})
});

export const App = connect(mapStateToProps, mapDispatchToProps)(Counter);

export function rootReducer(state = 0, action) {
	switch (action.type) {
	case INCREMENT:
		return state + action.amount;
	case DECREMENT:
		return state - action.amount;
	default:
		return state;
	}
}
