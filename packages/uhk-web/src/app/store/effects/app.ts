import { Injectable } from '@angular/core';
import { Action, Store } from '@ngrx/store';
import { Actions, Effect } from '@ngrx/effects';
import { Observable } from 'rxjs/Observable';
import { map, startWith, tap, withLatestFrom } from 'rxjs/operators';
import { NotifierService } from 'angular-notifier';

import { AppStartInfo, LogService, Notification, NotificationType } from 'uhk-common';
import {
    ActionTypes,
    ApplyAppStartInfoAction,
    AppStartedAction,
    DismissUndoNotificationAction,
    OpenUrlInNewWindowAction,
    ProcessAppStartInfoAction,
    ShowNotificationAction,
    UndoLastAction
} from '../actions/app';
import { AppRendererService } from '../../services/app-renderer.service';
import { AppUpdateRendererService } from '../../services/app-update-renderer.service';
import { ConnectionStateChangedAction } from '../actions/device';
import { AppState, runningInElectron } from '../index';

@Injectable()
export class ApplicationEffects {

    @Effect()
    appStart$: Observable<Action> = this.actions$
        .ofType(ActionTypes.AppBootstrapped)
        .pipe(
            startWith(new AppStartedAction()),
            tap(() => {
                this.logService.info('Renderer appStart effect start');
                this.appUpdateRendererService.sendAppStarted();
                this.appRendererService.getAppStartInfo();
                this.logService.info('Renderer appStart effect end');
            })
        );

    @Effect({dispatch: false})
    appStartInfo$: Observable<Action> = this.actions$
        .ofType(ActionTypes.LoadAppStartInfo)
        .do(() => {
            this.appRendererService.getAppStartInfo();
        });

    @Effect({dispatch: false})
    showNotification$: Observable<Action> = this.actions$
        .ofType<ShowNotificationAction>(ActionTypes.AppShowNotification)
        .pipe(
            map(action => action.payload),
            tap((notification: Notification) => {
                if (notification.type === NotificationType.Undoable) {
                    return;
                }
                this.notifierService.notify(notification.type, notification.message);
            })
        );

    @Effect()
    processStartInfo$: Observable<Action> = this.actions$
        .ofType<ProcessAppStartInfoAction>(ActionTypes.AppProcessStartInfo)
        .map(action => action.payload)
        .mergeMap((appInfo: AppStartInfo) => {
            this.logService.debug('[AppEffect][processStartInfo] payload:', appInfo);
            return [
                new ApplyAppStartInfoAction(appInfo),
                new ConnectionStateChangedAction(appInfo.deviceConnectionState)
            ];
        });

    @Effect() undoLastNotification$: Observable<Action> = this.actions$
        .ofType<UndoLastAction>(ActionTypes.UndoLast)
        .map(action => action.payload)
        .mergeMap((action: Action) => [action, new DismissUndoNotificationAction()]);

    @Effect({dispatch: false}) openUrlInNewWindow$ = this.actions$
        .ofType<OpenUrlInNewWindowAction>(ActionTypes.OpenUrlInNewWindow)
        .pipe(
            withLatestFrom(this.store.select(runningInElectron)),
            tap(([action, inElectron]) => {
                const url = action.payload;

                if (inElectron) {
                    this.appRendererService.openUrl(url);
                } else {
                    window.open(url, '_blank');
                }
            })
        );

    constructor(private actions$: Actions,
                private notifierService: NotifierService,
                private appUpdateRendererService: AppUpdateRendererService,
                private appRendererService: AppRendererService,
                private logService: LogService,
                private store: Store<AppState>) {
    }
}
