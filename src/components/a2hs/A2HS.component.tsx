import React, { PureComponent } from 'react';
import { isMobile, browserStorage } from 'utils/browser';
import { checkMediaProperty } from 'utils/css';
import { BeforeInstallPromptEvent } from './A2HS';
import IOSInstructions from './IOSInstructions';
import styles from './A2HS.module.scss';

export const InstallAccepted = 'accepted';
export const InstallDismissed = 'dismissed';

// When closed, hide A2HS notification for a week.
const NOTIFICATION_IGNORE_TIME = 7 * 24 * 60 * 60 * 1000;
const A2HS_IDENTIFIER = 'A2HS-Notification';
const DISPLAY_STANDALONE = 'display-mode: standalone';

const {
    A2HS: A2HSWrapper,
    A2HSControls,
    button
} = styles;

type InstallState = {
    isOpen: boolean
}

export default class A2HS extends PureComponent<unknown, InstallState> {
    installEvent: BeforeInstallPromptEvent | undefined;

    state = { isOpen: isMobile.iOS() };

    componentDidMount(): void {
        const isAppStandalone = checkMediaProperty(DISPLAY_STANDALONE);
        const isClosed = browserStorage.getItem(A2HS_IDENTIFIER);

        if (!isAppStandalone && !isClosed) {
            (self as any).onbeforeinstallprompt = this.installListener;
        }
    }

    dismissNotification = (): void => {
        browserStorage.setItem(
            A2HS_IDENTIFIER,
            true,
            NOTIFICATION_IGNORE_TIME
        );
    }

    installListener = (event: BeforeInstallPromptEvent): void => {
        event.preventDefault();

        this.installEvent = event;
        this.setState({ isOpen: true });
    }

    install = (): void => {
        if (!this.installEvent) {
            return;
        }

        this.installEvent.prompt();
        this.installEvent.userChoice.then(
            choice => {
                if (choice.outcome === InstallAccepted) {
                    this.setState({ isOpen: false });
                }
            }
        );
    }

    render(): JSX.Element | null {
        const { isOpen } = this.state;

        if (!isOpen) {
            return null;
        }

        return (
            <figure className={ A2HSWrapper }>
                <figcaption>
                    👋 Welcome!<br/>
                    Add this app to your home screen for the best experience!
                </figcaption>
                {
                    isMobile.iOS()
                        ? <IOSInstructions />
                        : (
                            <button
                              onClick={ this.install }
                              className={ button }
                            >
                                Add to Home Screen
                            </button>
                        )
                }
                <div className={ A2HSControls }>
                    <button
                      type="button"
                      aria-label="close notice"
                      onClick={ this.dismissNotification }
                    >
                        Maybe later
                    </button>
                </div>
            </figure>
        );
    }
}
