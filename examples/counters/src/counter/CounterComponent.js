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
					<button onClick={onIncrement} className={css.button}>+</button>
					{' '}
					<button onClick={onDecrement} className={css.button}>-</button>
				</div>
				<div className={css.row}>
					<span onClick={onReset} className={css.link}>Reset</span>
					{' '}
					<span onClick={onRandomize} className={css.link}>Randomize</span>
				</div>
			</div>
		);
	}
}
