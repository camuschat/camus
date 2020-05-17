
describe('Create room', () => {
    it('Should create and enter a public room', () => {
        cy.visit('/rtc');

        const form = cy.get('form[id="create-room-form"]');
        form.get('input[name="room_id"]')
            .type('public-room')
            .should('have.value', 'public-room');

        form.get('input[name="public"]').not('[disabled]')
            .check().should('be.checked')

        form.get('input[name="submit"]')
            .click();

        // The url should contain the room name once we enter
        cy.url().should('include', 'public-room')

        // Check that room is in the public list
        cy.visit('/rtc');
        cy.get('#room-link-public-room')
    });

    it('Should create and enter a non-public room', () => {
        cy.visit('/rtc');

        const form = cy.get('form[id="create-room-form"]');
        form.get('input[name="room_id"]')
            .type('nonpublic-room')
            .should('have.value', 'nonpublic-room');

        form.get('input[name="submit"]')
            .click();

        // The url should contain the room name once we enter
        cy.url().should('include', 'nonpublic-room')

        // Check that room is not in the public list
        cy.visit('/rtc');
        cy.get('#room-link-nonpublic-room').should('not.exist');
    });

    it('Should create and enter a password-protected room', () => {
        cy.visit('/rtc');

        const form = cy.get('form[id="create-room-form"]');
        form.get('input[name="room_id"]')
            .type('password-room')
            .should('have.value', 'password-room');

        form.get('input[name="password"]')
            .type('secretpassword')
            .should('have.value', 'secretpassword');

        form.get('input[name="submit"]')
            .click();

        cy.url().should('include', 'password-room')
    });
});
