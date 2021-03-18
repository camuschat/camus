import { EventEmitter } from '../../../js/rtcclient';

describe('Test EventEmitter', () => {
    it('can add a listener', () => {
        // Setup: create EventEmitter and a callback function
        const ee = new EventEmitter();
        const callback = () => {};

        // Run: add the callback for an event
        ee.on('event', callback);

        // Verify: the callback is associated with the event
        expect(ee.listeners('event')).to.include(callback);
    });

    it('can remove a listener', () => {
        // Setup: add a callback for an event
        const ee = new EventEmitter();
        const callback = () => {};
        ee.on('event', callback);

        // Run: remove the callback for the event
        ee.removeListener('event', callback);

        // Verify: the callback is not associated with the event
        expect(ee.listeners('event')).not.to.include(callback);
    });

    it('can emit an event', () => {
        // Setup: add a callback for an event
        const ee = new EventEmitter();
        const callback = cy.stub();
        ee.on('event', callback);

        // Run: emit the event
        ee.emit('event');

        // Verify: the callback function is called
        expect(callback).to.be.called;
    });
});
