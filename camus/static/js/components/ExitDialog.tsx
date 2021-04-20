import React, { Component } from 'react';

interface ExitDialogProps {
    onClose: Function;
}

export default class ExitDialog extends Component<ExitDialogProps> {
    private cancelButton: React.RefObject<HTMLInputElement>;
    private leaveButton: React.RefObject<HTMLInputElement>;

    constructor(props: ExitDialogProps) {
        super(props);

        this.cancelButton = React.createRef();
        this.leaveButton = React.createRef();

        this.keyListener = this.keyListener.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    render(): React.ReactNode {
        return (
            <>
                <div className='modal-overlay'></div>
                <div
                    className='dialog fade-in exit-dialog'
                    onKeyPress={this.keyListener}
                    role='dialog'
                    aria-labelledby='exit-dialog-title'
                    aria-modal='true'
                >
                    <p id='exit-dialog-title'>Do you want to leave the room?</p>
                    <input
                        onClick={this.handleCancel}
                        className='btn btn-secondary btn-cancel'
                        type='button'
                        value='Cancel'
                        ref={this.cancelButton}
                    />
                    <input
                        onClick={this.handleSubmit}
                        className='btn btn-secondary'
                        type='submit'
                        value='Leave'
                        ref={this.leaveButton}
                    />
                </div>
            </>
        );
    }

    componentDidMount(): void {
        if (this.cancelButton.current) {
            this.cancelButton.current.focus();
        }
    }

    keyListener(event: React.KeyboardEvent<HTMLDivElement>): void {
        // Close the dialog if ESC is pressed
        if (event.key === 'Escape') {
            event.preventDefault();
            this.props.onClose();
        }

        // Trap focus to the dialog's buttons when tabbing
        if (event.key === 'Tab') {
            event.preventDefault();

            if (
                document.activeElement === this.cancelButton.current &&
                this.leaveButton.current
            ) {
                this.leaveButton.current.focus();
            } else if (this.cancelButton.current) {
                this.cancelButton.current.focus();
            }
        }
    }

    handleCancel(): void {
        this.props.onClose();
    }

    handleSubmit(): void {
        // Redirect to homepage
        window.location.href = window.location.origin;
    }
}
