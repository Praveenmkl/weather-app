import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, map, switchMap, throwError, catchError, timeout, TimeoutError } from 'rxjs';
import { environment } from '../../environments/environment';

import {
    Weather,
    GeocodingResponse,
    OpenMeteoResponse
} from '../models/weather.model';

@Injectable({
    providedIn: 'root'
})
export class WeatherService {
    private geocodingUrl = environment.geocodingApiUrl;

    private weatherUrl = environment.weatherApiUrl;

    constructor(private http: HttpClient) { }

    getWeatherByCity(city: string): Observable<Weather> {
        const locationParams = new HttpParams()
            .set('name', city)
            .set('count', 1)
            .set('language', 'en')
            .set('format', 'json');

        return this.http
            .get<GeocodingResponse>(this.geocodingUrl, {
                params: locationParams
            })
            .pipe(
                timeout(10000),
                switchMap((locationResponse) => {
                    const location = locationResponse.results?.[0];

                    if (!location) {
                        return throwError(
                            () => new Error(`City "${city}" was not found.`)
                        );
                    }

                    const weatherParams = new HttpParams()
                        .set('latitude', location.latitude)
                        .set('longitude', location.longitude)
                        .set(
                            'current',
                            'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day'
                        )
                        .set('timezone', 'auto');

                    return this.http
                        .get<OpenMeteoResponse>(this.weatherUrl, {
                            params: weatherParams
                        })
                        .pipe(
                            timeout(10000),
                            map((response): Weather => ({
                                cityName: location.name,
                                country: location.country,
                                temperature: response.current.temperature_2m,
                                humidity: response.current.relative_humidity_2m,
                                windSpeed: response.current.wind_speed_10m,
                                weatherCode: response.current.weather_code,
                                isDay: response.current.is_day,
                                time: response.current.time
                            }))
                        );
                }),
                catchError((error) => this.handleApiError(error))
            );
    }

    private handleApiError(error: unknown): Observable<never> {
        if (error instanceof TimeoutError) {
            return throwError(
                () => new Error(
                    'Request timed out. Please check your internet connection and try again.'
                )
            );
        }

        if (error instanceof HttpErrorResponse) {
            if (error.status === 0) {
                return throwError(
                    () => new Error(
                        'Network error. Please check your internet connection.'
                    )
                );
            }

            return throwError(
                () => new Error(
                    'The weather service is temporarily unavailable. Please try again.'
                )
            );
        }

        return throwError(
            () => error instanceof Error
                ? error
                : new Error('An unexpected error occurred.')
        );
    }
}