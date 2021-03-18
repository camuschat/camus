import { createStore } from 'redux';
import reducer, {
    addIceServer,
    updateIceServer,
    removeIceServer
} from '../../../js/slices/iceServers';

describe('Test iceServers slice of Redux store', () => {
    it('can add an ICE server', () => {
        // Setup
        const store = createStore(reducer);

        // Test
        const server = {
            urls: ['turn:example.com'],
            username: 'Ludwig',
            password: '1234',
            kind: 'turn'
        };
        store.dispatch(addIceServer(server));

        // Get result
        const state = store.getState();
        const storedServer = state.find(server => server.urls.includes('turn:example.com'));

        // Verify result
        expect(storedServer).is.not.undefined;
        expect(storedServer.username).to.equal('Ludwig');
        expect(storedServer.password).to.equal('1234');
        expect(storedServer.kind).to.equal('turn');
        expect(storedServer.id).is.not.undefined;
        expect(storedServer.enabled).is.true;
    });

    it('can update an ICE server', () => {
        // Setup
        const store = createStore(
            reducer,
            [{
                id: 42,
                enabled: true,
                urls: ['turn:example.com'],
                username: 'Ludwig',
                password: '1234',
                kind: 'turn'
            }]
        );

        // Test
        const updatedServer = {
            id: 42,
            urls: ['stun:example.com'],
            username: 'Albert',
            password: '5678',
            kind: 'stun',
            enabled: false
        };
        store.dispatch(updateIceServer(updatedServer));

        // Get result
        const state = store.getState();
        const storedServer = state.find(server => server.id === 42);

        // Verify result
        expect(storedServer).is.not.undefined;
        expect(storedServer.username).to.equal('Albert');
        expect(storedServer.password).to.equal('5678');
        expect(storedServer.kind).to.equal('stun');
        expect(storedServer.enabled).is.false;
    });

    it('can remove an ICE server', () => {
        // Setup
        const store = createStore(
            reducer,
            [{
                id: 42,
                enabled: true,
                urls: ['turn:example.com'],
                username: 'Ludwig',
                password: '1234',
                kind: 'turn'
            }]
        );

        // Test
        store.dispatch(removeIceServer(42));

        // Get result
        const state = store.getState();
        const storedServer = state.find(server => server.id === 42);

        // Verify result
        expect(storedServer).is.undefined;
    });
});
