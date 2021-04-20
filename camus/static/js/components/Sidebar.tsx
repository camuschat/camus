import React, { Component } from 'react';

interface SidebarProps {
    buttonIcons: string[];
    buttonAriaLabels: string[];
    onToggle: Function;
    children: React.ReactNode[];
}

interface SidebarState {
    currentChild: number;
    isCollapsed: boolean;
}

export default class Sidebar extends Component<SidebarProps, SidebarState> {
    constructor(props: SidebarProps) {
        super(props);

        this.state = {
            currentChild: 0,
            isCollapsed: true,
        };

        this.onToggleButtonClick = this.onToggleButtonClick.bind(this);
        this.hide = this.hide.bind(this);
    }

    render(): React.ReactNode {
        const { currentChild, isCollapsed } = this.state;

        const label = this.props.buttonAriaLabels[currentChild];
        return (
            <section
                className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}
                aria-labelledby='sidebar-title'
            >
                <h1 id='sidebar-title' className='sr-only'>
                    Sidebar
                </h1>
                {isCollapsed && this.renderToggleButtons()}
                {!isCollapsed && (
                    <>
                        <button
                            className='icon-button'
                            onClick={this.hide}
                            aria-label={`Close ${label}`}
                        >
                            <i className='material-icons'>close</i>
                        </button>
                        {this.props.children[currentChild]}
                    </>
                )}
            </section>
        );
    }

    renderToggleButtons(): React.ReactNode {
        const icons = this.props.buttonIcons;
        const labels = this.props.buttonAriaLabels;
        return (
            <ul className='sidebar-toggle-buttons'>
                {icons.map((icon, idx) => (
                    <li key={icon}>
                        <SidebarToggleButton
                            icon={icon}
                            onClick={this.onToggleButtonClick}
                            ariaLabel={`Open ${labels[idx]}`}
                        />
                    </li>
                ))}
            </ul>
        );
    }

    onToggleButtonClick(icon: string): void {
        const childIndex = this.props.buttonIcons.indexOf(icon);
        this.setState({
            currentChild: childIndex,
            isCollapsed: false,
        });

        this.props.onToggle('open');
    }

    hide(): void {
        this.setState({
            isCollapsed: true,
        });

        this.props.onToggle('close');
    }
}

interface SidebarToggleButtonProps {
    icon: string;
    onClick: Function;
    ariaLabel: string;
}

class SidebarToggleButton extends Component<SidebarToggleButtonProps> {
    constructor(props: SidebarToggleButtonProps) {
        super(props);
        this.onClick = this.onClick.bind(this);
    }

    render(): React.ReactNode {
        return (
            <button
                className='icon-button'
                onClick={this.onClick}
                aria-label={this.props.ariaLabel}
            >
                <i className='material-icons'>{this.props.icon}</i>
            </button>
        );
    }

    onClick(): void {
        this.props.onClick(this.props.icon);
    }
}
