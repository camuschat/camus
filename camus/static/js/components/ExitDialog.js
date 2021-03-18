import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class ExitDialog extends Component {
    constructor(props) {
        super(props);

        this.handleCancel = this.handleCancel.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    render() {
        return (<>
            <div className='modal-overlay'></div>
            <div className='dialog fade-in exit-dialog'>
                <p>Do you want to leave the room?</p>
                <input
                    onClick={this.handleCancel}
                    className='btn btn-secondary btn-cancel'
                    type='button'
                    value='Cancel'
                />
                <input
                    onClick={this.handleSubmit}
                    className='btn btn-secondary'
                    type='submit'
                    value='Leave'
                />
            </div>
        </>);
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
