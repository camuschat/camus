import { createStore } from 'redux';
import reducer, {
    addUser,
    updateUser,
    setUsername
} from '../../../js/slices/users';

describe('Test users slice of Redux store', () => {
    it('can add a user', () => {
        // Setup
        const store = createStore(reducer);

        // Test
        const user = {
            id: '1234',
            username: 'Major Tom'
        }
        store.dispatch(addUser(user));

        // Get result
        const state = store.getState();

        // Verify result
        expect(state).includes(user);
    });

    it('can update a user', () => {
        // Setup
        const store = createStore(
            reducer,
            [{
                id: '1234',
                username: 'Major Tom'
            }]
        );

        // Test
        const updatedUser = {
            id: '1234',
            username: 'Ludwig'
        };
        store.dispatch(updateUser(updatedUser));

        // Get result
        const state = store.getState();
        const storedUser = state.find(user => user.id === '1234');

        // Verify result
        expect(storedUser).is.not.undefined;
        expect(storedUser.id).to.equal('1234');
        expect(storedUser.username).to.equal('Ludwig');
    });

    it('can set the local username', () => {
        // Setup
        const store = createStore(
            reducer,
            [{
                id: 'local',
                username: 'Major Tom'
            }]
        );

        // Test
        store.dispatch(setUsername('Ludwig'));

        // Get result
        const state = store.getState();
        const storedUser = state.find(user => user.id === 'local');

        // Verify result
        expect(storedUser).is.not.undefined;
        expect(storedUser.id).to.equal('local');
        expect(storedUser.username).to.equal('Ludwig');
    });
});
