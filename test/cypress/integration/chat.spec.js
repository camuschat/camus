
describe('Create room', () => {
    it('Should create and enter a public room', () => {
        const roomName = 'public-room';

        cy.visit('/rtc');

        // Create a room
        const form = cy.get('form[id="create-room-form"]');
        form.get('input[name="room_name"]')
            .type(roomName)
            .should('have.value', roomName);

        form.get('input[name="public"]').not('[disabled]')
            .check().should('be.checked')

        form.get('input[name="submit"]')
            .click();

        // The url should contain the room name once we enter
        cy.url().should('include', roomName)

        // Check that room is in the public list
        cy.visit('/rtc');
        cy.get('#room-link-public-room')
    });

    it('Should create and enter a non-public room', () => {
        const roomName = 'nonpublic-room';

        cy.visit('/rtc');

        // Create a room
        const form = cy.get('form[id="create-room-form"]');
        form.get('input[name="room_name"]')
            .type(roomName)
            .should('have.value', roomName);

        form.get('input[name="submit"]')
            .click();

        // The url should contain the room name once we enter
        cy.url().should('include', roomName)

        // Check that room is not in the public list
        cy.visit('/rtc');
        cy.get('#room-link-nonpublic-room').should('not.exist');
    });

    it('Should create and enter a password-protected room', () => {
        const roomName = 'password-room';
        const password = 'secret password';

        cy.visit('/rtc');

        // Create a room
        const createForm = cy.get('form[id="create-room-form"]');
        createForm.get('input[name="room_name"]')
                  .type(roomName)
                  .should('have.value', roomName);

        createForm.get('input[name="password"]')
                  .type(password)
                  .should('have.value', password);

        createForm.get('input[name="submit"]')
                  .click();

        // Log in on the next page
        cy.url().should('include', roomName)

        const loginForm = cy.get('form');
        loginForm.get('input[name="password"]')
                 .type(password)
                 .should('have.value', password);

        loginForm.get('input[name="submit"]')
                 .click();

        // Enter the room
        cy.url().should('include', roomName)
    });
});
