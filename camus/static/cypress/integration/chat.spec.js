describe('Create room', () => {
    it('can create and enter a public room', () => {
        const roomName = 'public-room';

        cy.visit('/');

        // Create a room
        const form = cy.get('form[id="create-room-form"]');
        form.get('input[name="room_name"]')
            .type(roomName)
            .should('have.value', roomName);

        form.get('details')
            .click();

        form.get('select[name="public"]')
            .select('Yes');

        form.get('input[name="submit"]')
            .click();

        // The url should contain the room name once we enter
        cy.url().should('include', roomName)

        // Check that room is in the public list
        cy.visit('/public');
        cy.get('#room-link-public-room')
    });

    it('can create and enter a non-public room', () => {
        const roomName = 'nonpublic-room';

        cy.visit('/');

        // Create a room
        const form = cy.get('form[id="create-room-form"]');
        form.get('input[name="room_name"]')
            .type(roomName)
            .should('have.value', roomName);

        form.get('details')
            .click();

        form.get('select[name="public"]')
            .select('No')

        form.get('input[name="submit"]')
            .click();

        // The url should contain the room name once we enter
        cy.url().should('include', roomName)

        // Check that room is not in the public list
        cy.visit('/public');
        cy.get('#room-link-nonpublic-room').should('not.exist');
    });

    it('can create and enter a password-protected room', () => {
        const roomName = 'password-room';
        const password = 'secret password';

        cy.visit('/');

        // Create a room
        const createForm = cy.get('form[id="create-room-form"]');
        createForm.get('input[name="room_name"]')
                  .type(roomName)
                  .should('have.value', roomName);

        createForm.get('details')
                  .click();

        createForm.get('input[name="password"]')
                  .type(password)
                  .should('have.value', password);

        createForm.get('input[name="submit"]')
                  .click();

        // Enter the room
        cy.url().should('include', roomName)
    });
});
