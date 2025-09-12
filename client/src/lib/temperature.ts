import { TemperatureUnit } from "@shared/schema";

/**
 * Convert Fahrenheit to Celsius
 */
export function fahrenheitToCelsius(fahrenheit: number): number {
  return (fahrenheit - 32) * (5 / 9);
}

/**
 * Convert Celsius to Fahrenheit
 */
export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

/**
 * Convert temperature from one unit to another
 */
export function convertTemperature(
  temperature: number,
  fromUnit: TemperatureUnit,
  toUnit: TemperatureUnit
): number {
  if (fromUnit === toUnit) {
    return temperature;
  }

  if (fromUnit === "fahrenheit" && toUnit === "celsius") {
    return fahrenheitToCelsius(temperature);
  }

  if (fromUnit === "celsius" && toUnit === "fahrenheit") {
    return celsiusToFahrenheit(temperature);
  }

  return temperature;
}

/**
 * Format temperature for display with unit symbol
 */
export function formatTemperature(
  temperature: number,
  unit: TemperatureUnit,
  decimals: number = 0
): string {
  const rounded = Number(temperature.toFixed(decimals));
  const symbol = unit === "fahrenheit" ? "°F" : "°C";
  return `${rounded}${symbol}`;
}

/**
 * Get temperature in the user's preferred unit
 * Assumes the input temperature is in Fahrenheit (API default)
 */
export function getTemperatureInUnit(
  temperatureFahrenheit: number,
  preferredUnit: TemperatureUnit
): number {
  if (preferredUnit === "celsius") {
    return fahrenheitToCelsius(temperatureFahrenheit);
  }
  return temperatureFahrenheit;
}

/**
 * Format temperature for display in the user's preferred unit
 * Assumes the input temperature is in Fahrenheit (API default)
 */
export function formatTemperatureInUnit(
  temperatureFahrenheit: number,
  preferredUnit: TemperatureUnit,
  decimals: number = 0
): string {
  const temp = getTemperatureInUnit(temperatureFahrenheit, preferredUnit);
  return formatTemperature(temp, preferredUnit, decimals);
}