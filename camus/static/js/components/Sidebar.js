import React, {Component} from 'react';
import PropTypes from 'prop-types';

export default class Sidebar extends Component {
    constructor(props) {
        super(props);

        this.state = {
            currentChild: 0,
            isCollapsed: true
        };

        this.onToggleButtonClick = this.onToggleButtonClick.bind(this);
        this.hide = this.hide.bind(this);
    }

    render() {
        const {
            currentChild,
            isCollapsed
        } = this.state;

        if (isCollapsed) {
            return (
                <section className='sidebar collapsed'>
                    {this.renderToggleButtons()}
                </section>
            );
        }

        return (
            <section className='sidebar'>
                <button className='icon-button' onClick={this.hide}>
                    <i className='material-icons'>close</i>
                </button>
                {this.props.children[currentChild]}
            </section>
        );
    }

    renderToggleButtons() {
        return (
            <ul className='sidebar-toggle-buttons'>
                {this.props.buttonIcons.map((icon) =>
                    <li key={icon}>
                        <SidebarToggleButton
                            icon={icon}
                            onClick={this.onToggleButtonClick}
                        />
                    </li>
                )}
            </ul>
        );
    }

    onToggleButtonClick(icon) {
        const childIndex = this.props.buttonIcons.indexOf(icon);
        this.setState({
            currentChild: childIndex,
            isCollapsed: false
        });

        this.props.onToggle('open');
    }

    hide() {
        this.setState({
            isCollapsed: true
        });

        this.props.onToggle('close');
    }
}

Sidebar.propTypes = {
    buttonIcons: PropTypes.arrayOf(PropTypes.string).isRequired,
    onToggle: PropTypes.func.isRequired,
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.node
    ]).isRequired
};

class SidebarToggleButton extends Component {
    constructor(props) {
        super(props);
        this.onClick = this.onClick.bind(this);
    }

    render() {
        return (
            <button className='icon-button' onClick={this.onClick}>
                <i className='material-icons'>
                    {this.props.icon}
                </i>
            </button>
        );
    }

    onClick() {
        this.props.onClick(this.props.icon);
    }
}

SidebarToggleButton.propTypes = {
    icon: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired
};
