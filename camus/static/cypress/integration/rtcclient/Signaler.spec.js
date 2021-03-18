import { Signaler } from '../../../js/rtcclient';

describe('Test Signaler', () => {
    describe('can send standard message types', () => {
        beforeEach(function() {
            this.signaler = new Signaler();

            this.sentData = '';
            cy.stub(this.signaler.socket, 'send', (data) =>{
                this.sentData = JSON.parse(data);
            });
        });

        it('text', function() {
            // Run: send the text message
            this.signaler.text(
                'Hello there',  // text
                '1234',  // from
                '5678',  // receiver
                '9999',  // time
            );

            // Verify: the sent message has the proper structure
            expect(this.sentData.type).to.equal('text');
            expect(this.sentData.receiver).to.equal('5678');
            expect(this.sentData.data.from).to.equal('1234');
            expect(this.sentData.data.time).to.equal('9999');
            expect(this.sentData.data.text).to.equal('Hello there');
        });

        it('profile', function() {
            // Run: send the profile message
            this.signaler.profile(
                'Ludwig',  // username
            );

            // Verify: the sent message has the proper structure
            expect(this.sentData.type).to.equal('profile');
            expect(this.sentData.receiver).to.equal('ground control');
            expect(this.sentData.data.username).to.equal('Ludwig');
        });

        it('offer', function() {
            // Run: send the offer message
            this.signaler.offer(
                '5678',  // receiver
                'a description',  // description
            );

            // Verify: the sent message has the proper structure
            expect(this.sentData.type).to.equal('offer');
            expect(this.sentData.receiver).to.equal('5678');
            expect(this.sentData.data).to.equal('a description');
        });

        it('answer', function() {
            // Run: send the answer message
            this.signaler.answer(
                '5678',  // receiver
                'a description',  // description
            );

            // Verify: the sent message has the proper structure
            expect(this.sentData.type).to.equal('answer');
            expect(this.sentData.receiver).to.equal('5678');
            expect(this.sentData.data).to.equal('a description');
        });

        it('bye', function() {
            // Run: send the bye message
            this.signaler.bye(
                '5678',  // receiver
            );

            // Verify: the sent message has the proper structure
            expect(this.sentData.type).to.equal('bye');
            expect(this.sentData.receiver).to.equal('5678');
            expect(this.sentData.data).to.not.be.undefined;
        });

        it('icecandidate', function() {
            // Run: send the icecandidate message
            this.signaler.icecandidate(
                '5678',  // receiver
                'a candidate',  // description
            );

            // Verify: the sent message has the proper structure
            expect(this.sentData.type).to.equal('icecandidate');
            expect(this.sentData.receiver).to.equal('5678');
            expect(this.sentData.data).to.equal('a candidate');
        });

        it('greeting', function() {
            // Run: send the greeting message
            this.signaler.greeting(
                '5678',  // receiver
                'Greetings!',  // greeting
            );

            // Verify: the sent message has the proper structure
            expect(this.sentData.type).to.equal('greeting');
            expect(this.sentData.receiver).to.equal('5678');
            expect(this.sentData.data).to.equal('Greetings!');
        });
    });

    it('can be shutdown', function() {
        // Setup
        const signaler = new Signaler();
        const callback = cy.stub();
        signaler.on('shutdown', callback);
        cy.spy(signaler, 'bye');
        cy.spy(signaler.socket, 'close');

        // Run
        signaler.shutdown();

        // Verify: the socket is closed and the callback is called
        expect(signaler.socket.close).to.be.called;
        expect(callback).to.be.called;
    });
});
