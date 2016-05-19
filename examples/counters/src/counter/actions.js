import { INCREMENT, DECREMENT, JUMP, RESET } from './ActionTypes';

export const action_increment = () => ({
	type: INCREMENT
});

export const action_decrement = () => ({
	type: DECREMENT
});

export const action_jump_to = (target: number) => ({
	type: JUMP,
	target
});

export const action_reset = () => ({
	type: RESET
});

export const action_jump_to_random = () => (dispatch, getState) => {
	const current = getState();
	const next = Math.round(Math.random() * Math.max(100, current));
	dispatch(action_jump_to(next));
};
