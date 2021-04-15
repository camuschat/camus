import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class ExitDialog extends Component {
    constructor(props) {
        super(props);

        this.cancelButton = React.createRef();
        this.leaveButton = React.createRef();

        this.keyListener = this.keyListener.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    render() {
        return (<>
            <div className='modal-overlay'></div>
            <div
                className='dialog fade-in exit-dialog'
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
        </>);
    }

    componentDidMount() {
        if (this.cancelButton.current) {
            this.cancelButton.current.focus();
        }

        window.addEventListener('keydown', this.keyListener);
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this.keyListener);
    }

    keyListener(e) {
        // Close the dialog if ESC is pressed
        if (e.keyCode === 27) {
            e.preventDefault();
            this.props.onClose();
        } 

        // Trap focus to the dialog's buttons when tabbing
        if (e.keyCode === 9) {
            e.preventDefault();

            if (document.activeElement === this.cancelButton.current) {
                this.leaveButton.current.focus();
            } else {
                this.cancelButton.current.focus();
            }
        }
    }

    handleCancel() {
        this.props.onClose();
    }

    handleSubmit() {
        // Redirect to homepage
        window.location.href = window.location.origin;
    }
}

ExitDialog.propTypes = {
    onClose: PropTypes.func.isRequired
};
