import { createStore } from 'redux';
import reducer, {
    addConnection,
    removeConnection,
    updateConnection
} from '../../../js/slices/connections';

describe('Test connections slice of Redux store', () => {
    it('can add a connection', () => {
        // Setup
        const store = createStore(reducer);

        // Test
        const connection = {
            id: '1234',
            connectionState: 'connected',
            iceConnectionState: 'connected',
            iceGatheringState: 'complete',
            signalingState: 'stable'
        };
        store.dispatch(addConnection(connection));

        // Get result
        const state = store.getState();
        const storedConnection = state.find(conn => conn.id === '1234');

        // Verify result
        expect(storedConnection).is.not.undefined;
        expect(storedConnection.id).to.equal('1234');
        expect(storedConnection.connectionState).to.equal('connected');
        expect(storedConnection.iceConnectionState).to.equal('connected');
        expect(storedConnection.iceGatheringState).to.equal('complete');
        expect(storedConnection.signalingState).to.equal('stable');
    });

    it('can remove a connection', () => {
        // Setup
        const store = createStore(
            reducer,
            [{
                id: '1234',
                connectionState: 'connected',
                iceConnectionState: 'connected',
                iceGatheringState: 'complete',
                signalingState: 'stable'
            }]
        );

        // Test
        store.dispatch(removeConnection('1234'));

        // Get result
        const state = store.getState();
        const storedConnection = state.find(conn => conn.id === '1234');

        // Verify result
        expect(storedConnection).is.undefined;
    });

    it('can update a connection', () => {
        // Setup
        const store = createStore(
            reducer,
            [{
                id: '1234',
                connectionState: 'connected',
                iceConnectionState: 'connected',
                iceGatheringState: 'complete',
                signalingState: 'stable'
            }]
        );

        // Test
        const updatedConnection = {
            id: '1234',
            connectionState: 'failed'
        };
        store.dispatch(updateConnection(updatedConnection));

        // Get result
        const state = store.getState();
        const storedConnection = state.find(conn => conn.id === '1234');

        // Verify result
        expect(storedConnection).is.not.undefined;
        expect(storedConnection.id).to.equal('1234');
        expect(storedConnection.connectionState).to.equal('failed');
        expect(storedConnection.iceConnectionState).to.equal('connected');
        expect(storedConnection.iceGatheringState).to.equal('complete');
        expect(storedConnection.signalingState).to.equal('stable');
    });
});
