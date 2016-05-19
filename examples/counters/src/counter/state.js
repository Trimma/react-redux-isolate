import { INCREMENT, DECREMENT, JUMP, RESET } from './ActionTypes';

const counterReducer = (state = 0, action: Object) => {
	switch (action.type) {
	case INCREMENT:
		return state + 1;
	case DECREMENT:
		return state - 1;
	case JUMP:
		return action.target;
	case RESET:
		return 0;
	default:
		return state;
	}
};

export default counterReducer;
