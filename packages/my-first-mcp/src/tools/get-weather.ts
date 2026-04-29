import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { fetchWithTimeout } from '../utils/fetch.js';
import type { ToolResult } from '../types.js';

export const inputSchema = {
  latitude: z.coerce
    .number({ message: 'Latitude must be a number.' })
    .min(-90, 'Latitude must be between -90 and 90.')
    .max(90, 'Latitude must be between -90 and 90.'),
  longitude: z.coerce
    .number({ message: 'Longitude must be a number.' })
    .min(-180, 'Longitude must be between -180 and 180.')
    .max(180, 'Longitude must be between -180 and 180.'),
};

const ArgsSchema = z.object(inputSchema);
type Args = z.infer<typeof ArgsSchema>;

export const definition: Tool = {
  name: 'get_weather',
  description: 'Retrieves current weather via Open-Meteo',
  inputSchema: {
    type: 'object',
    properties: {
      latitude: {
        type: 'number',
        description: 'Location latitude (e.g. 48.8566 for Paris)',
      },
      longitude: {
        type: 'number',
        description: 'Location longitude (e.g. 2.3522 for Paris)',
      },
    },
    required: ['latitude', 'longitude'],
  },
};

export async function handler(args: Args): Promise<ToolResult> {
  const { latitude, longitude } = ArgsSchema.parse(args);

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('current', 'temperature_2m,wind_speed_10m');

  const response = await fetchWithTimeout(url.toString());

  if (!response.ok) {
    throw new Error(`Open-Meteo responded with status ${response.status}`);
  }

  const data = await response.json();
  const weather = data.current;

  if (!weather) {
    throw new Error('Weather data unavailable for these coordinates.');
  }

  const weatherInfo = `Current temperature is ${weather.temperature_2m}°C with wind speed ${weather.wind_speed_10m} km/h.`;

  return {
    content: [{ type: 'text', text: weatherInfo }],
    isError: false,
  };
}
