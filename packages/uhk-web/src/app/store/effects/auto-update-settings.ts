import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Observable, of } from 'rxjs';
import { Action, Store } from '@ngrx/store';
import { map, startWith, switchMap, withLatestFrom } from 'rxjs/operators';

import { AutoUpdateSettings, NotificationType } from 'uhk-common';

import {
    ActionTypes,
    LoadAutoUpdateSettingsAction,
    LoadAutoUpdateSettingsSuccessAction,
    SaveAutoUpdateSettingsSuccessAction,
    CheckForUpdateSuccessAction,
    CheckForUpdateFailedAction
} from '../actions/auto-update-settings';

import { DataStorageRepositoryService } from '../../services/datastorage-repository.service';
import { AppState, getAutoUpdateSettings } from '../index';
import { initialState } from '../reducers/auto-update-settings';
import { ShowNotificationAction } from '../actions/app';

@Injectable()
export class AutoUpdateSettingsEffects {
    @Effect() loadUserConfig$: Observable<Action> = this.actions$
        .pipe(
            ofType(ActionTypes.LOAD_AUTO_UPDATE_SETTINGS),
            startWith(new LoadAutoUpdateSettingsAction()),
            switchMap(() => {
                let settings: AutoUpdateSettings = this.dataStorageRepository.getAutoUpdateSettings();
                if (!settings) {
                    settings = initialState;
                }
                return of(new LoadAutoUpdateSettingsSuccessAction(settings));
            })
        );

    @Effect() saveAutoUpdateConfig$: Observable<Action> = this.actions$
        .pipe(
            ofType(ActionTypes.TOGGLE_CHECK_FOR_UPDATE_ON_STARTUP, ActionTypes.TOGGLE_PRE_RELEASE_FLAG),
            withLatestFrom(this.store.select(getAutoUpdateSettings)),
            map(([action, config]) => {
                this.dataStorageRepository.saveAutoUpdateSettings(config);
                return new SaveAutoUpdateSettingsSuccessAction();
            })
        );

    @Effect() sendNotification$: Observable<Action> = this.actions$
        .pipe(
            ofType<CheckForUpdateSuccessAction | CheckForUpdateFailedAction>(
                ActionTypes.CHECK_FOR_UPDATE_FAILED, ActionTypes.CHECK_FOR_UPDATE_SUCCESS),
            map(action => action.payload),
            map((message: string) => {
                return new ShowNotificationAction({
                    type: NotificationType.Info,
                    message
                });
            })
        );

    constructor(private actions$: Actions,
                private dataStorageRepository: DataStorageRepositoryService,
                private store: Store<AppState>) {
    }
}
