import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const locations = pgTable("locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  country: text("country").notNull(),
  state: text("state"),
  lat: real("lat").notNull(),
  lon: real("lon").notNull(),
  zipCode: text("zip_code"),
});

export const weatherData = pgTable("weather_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  locationId: varchar("location_id").references(() => locations.id).notNull(),
  temperature: real("temperature").notNull(),
  feelsLike: real("feels_like").notNull(),
  humidity: integer("humidity").notNull(),
  windSpeed: real("wind_speed").notNull(),
  windDirection: text("wind_direction").notNull(),
  pressure: real("pressure").notNull(),
  visibility: real("visibility").notNull(),
  uvIndex: integer("uv_index").notNull(),
  condition: text("condition").notNull(),
  conditionIcon: text("condition_icon").notNull(),
  precipitation: real("precipitation").notNull(),
  sunrise: timestamp("sunrise").notNull(),
  sunset: timestamp("sunset").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const weatherAlerts = pgTable("weather_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  locationId: varchar("location_id").references(() => locations.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(), // severe, moderate, minor
  category: text("category").notNull(),
  areas: jsonb("areas").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  isActive: integer("is_active").default(1).notNull(),
});

export const forecastData = pgTable("forecast_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  locationId: varchar("location_id").references(() => locations.id).notNull(),
  forecastDate: timestamp("forecast_date").notNull(),
  highTemp: real("high_temp").notNull(),
  lowTemp: real("low_temp").notNull(),
  condition: text("condition").notNull(),
  conditionIcon: text("condition_icon").notNull(),
  precipitation: integer("precipitation").notNull(),
  windSpeed: real("wind_speed").notNull(),
  humidity: integer("humidity").notNull(),
});

export const hourlyForecast = pgTable("hourly_forecast", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  locationId: varchar("location_id").references(() => locations.id).notNull(),
  forecastTime: timestamp("forecast_time").notNull(),
  temperature: real("temperature").notNull(),
  condition: text("condition").notNull(),
  conditionIcon: text("condition_icon").notNull(),
  precipitation: integer("precipitation").notNull(),
  windSpeed: real("wind_speed").notNull(),
});

export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
});

export const insertWeatherDataSchema = createInsertSchema(weatherData).omit({
  id: true,
  lastUpdated: true,
});

export const insertWeatherAlertSchema = createInsertSchema(weatherAlerts).omit({
  id: true,
});

export const insertForecastDataSchema = createInsertSchema(forecastData).omit({
  id: true,
});

export const insertHourlyForecastSchema = createInsertSchema(hourlyForecast).omit({
  id: true,
});

export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;

export type WeatherData = typeof weatherData.$inferSelect;
export type InsertWeatherData = z.infer<typeof insertWeatherDataSchema>;

export type WeatherAlert = typeof weatherAlerts.$inferSelect;
export type InsertWeatherAlert = z.infer<typeof insertWeatherAlertSchema>;

export type ForecastData = typeof forecastData.$inferSelect;
export type InsertForecastData = z.infer<typeof insertForecastDataSchema>;

export type HourlyForecast = typeof hourlyForecast.$inferSelect;
export type InsertHourlyForecast = z.infer<typeof insertHourlyForecastSchema>;
