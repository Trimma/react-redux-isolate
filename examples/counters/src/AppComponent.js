import React, { Component, PropTypes } from 'react';
import css from './AppComponent.css';

export default class App extends Component {
	static propTypes = {
		counterComponent: PropTypes.func.isRequired
	};

	render() {
		const { counterComponent: Counter } = this.props;
		return (
			<div className={css.page}>

				<h1>React Redux Isolate</h1>
				<h3>Counters example</h3>

				<p>
					Each counter component is a separate redux app,
					and can not affect the other.
					We use a middleware to make the left counter change when the other changes.
				</p>

				<div className={css.counters}>
					<div className={css.counter}>
						<Counter id='left' />
					</div>
					<div className={css.counter}>
						<Counter id='right' />
					</div>
				</div>

				<div className={css.footnote}>
					Ctrl/Cmd + h to toggle dev panel<br />
					Ctrl/Cmd + m to toggle active devtool
				</div>
			</div>
		);
	}
}
