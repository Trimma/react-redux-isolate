import React, { Component, PropTypes } from 'react';

import css from './CounterComponent.css';

export default class Counter extends Component {
	static propTypes = {
		value: PropTypes.number.isRequired,
		onIncrement: PropTypes.func.isRequired,
		onDecrement: PropTypes.func.isRequired,
		onReset: PropTypes.func.isRequired,
		onRandomize: PropTypes.func.isRequired
	};

	render() {
		const {
			value,
			onIncrement,
			onDecrement,
			onReset,
			onRandomize
		} = this.props;
		return (
			<div className={css.container}>
				<div className={css.number}>
					{value}
				</div>
				<div className={css.row}>
					<button onClick={onIncrement}>+</button>
					{' '}
					<button onClick={onDecrement}>-</button>
				</div>
				<div className={css.row}>
					<button onClick={onReset}>Reset</button>
				</div>
				<div className={css.row}>
					<button onClick={onRandomize}>Randomize</button>
				</div>
			</div>
		);
	}
}
