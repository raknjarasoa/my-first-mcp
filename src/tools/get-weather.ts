import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { fetchWithTimeout } from "../utils/fetch.js";

const ArgsSchema = z.object({
  latitude: z.coerce
    .number({ message: "La latitude doit être un nombre." })
    .min(-90, "La latitude doit être entre -90 et 90.")
    .max(90, "La latitude doit être entre -90 et 90."),
  longitude: z.coerce
    .number({ message: "La longitude doit être un nombre." })
    .min(-180, "La longitude doit être entre -180 et 180.")
    .max(180, "La longitude doit être entre -180 et 180."),
});

export const definition: Tool = {
  name: "get_weather",
  description: "Récupère la météo actuelle via Open-Meteo",
  inputSchema: {
    type: "object",
    properties: {
      latitude: {
        type: "number",
        description: "Latitude du lieu (ex: 48.8566 pour Paris)",
      },
      longitude: {
        type: "number",
        description: "Longitude du lieu (ex: 2.3522 pour Paris)",
      },
    },
    required: ["latitude", "longitude"],
  },
};

export async function handler(
  args: Record<string, unknown>
): Promise<{ content: { type: "text"; text: string }[]; isError: boolean }> {
  const { latitude, longitude } = ArgsSchema.parse(args);

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("current_weather", "true");

  const response = await fetchWithTimeout(url.toString());

  if (!response.ok) {
    throw new Error(`Open-Meteo a répondu avec le statut ${response.status}`);
  }

  const data = await response.json();
  const weather = data.current_weather;

  if (!weather) {
    throw new Error(
      "Données météorologiques indisponibles pour ces coordonnées."
    );
  }

  const weatherInfo = `La température actuelle est de ${weather.temperature}°C avec un vent à ${weather.windspeed} km/h.`;

  return {
    content: [{ type: "text", text: weatherInfo }],
    isError: false,
  };
}
