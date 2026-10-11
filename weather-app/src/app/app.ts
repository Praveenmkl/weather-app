import { Component, ChangeDetectorRef, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Weather } from './models/weather.model';
import { WeatherService } from './services/weather.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  cityName = signal<string>('');

  weather = signal<Weather | null>(null);

  isLoading = signal<boolean>(false);

  errorMessage = signal<string>('');

  constructor(
    private weatherService: WeatherService,
    private cdr: ChangeDetectorRef
  ) {}

  searchCity(): void {
    const city = this.cityName().trim();

    if (!city) {
      this.errorMessage.set('Please enter a city name.');
      this.weather.set(null);
      this.cdr.markForCheck();
      return;
    }

    if (this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.weather.set(null);
    this.cdr.markForCheck();

    this.weatherService.getWeatherByCity(city).subscribe({
      next: (weather) => {
        this.weather.set(weather);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },

      error: (error: unknown) => {
        this.isLoading.set(false);
        this.weather.set(null);
        this.errorMessage.set(this.getErrorMessage(error));
        this.cdr.markForCheck();
      }
    });
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      if (error.message.includes('was not found')) {
        return 'City not found. Please check the spelling and try again.';
      }
    }

    return 'Unable to load weather. Please check your internet connection and try again.';
  }

  getWeatherDescription(code: number): string {
    switch (code) {
      case 0:
        return 'Clear sky';
      case 1:
        return 'Mainly clear';
      case 2:
        return 'Partly cloudy';
      case 3:
        return 'Overcast';
      case 45:
      case 48:
        return 'Foggy';
      case 51:
      case 53:
      case 55:
        return 'Drizzle';
      case 61:
      case 63:
      case 65:
        return 'Rain';
      case 71:
      case 73:
      case 75:
        return 'Snow';
      case 80:
      case 81:
      case 82:
        return 'Rain showers';
      case 95:
      case 96:
      case 99:
        return 'Thunderstorm';
      default:
        return 'Unknown weather';
    }
  }
}