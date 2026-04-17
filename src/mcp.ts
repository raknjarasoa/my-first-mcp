import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";

// Create MCP server
export const mcpServer = new Server(
  {
    name: "my-first-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const ADD_TOOL: Tool = {
  name: "add",
  description: "Additionne deux nombres a et b",
  inputSchema: {
    type: "object",
    properties: {
      a: { type: "number", description: "Le premier nombre" },
      b: { type: "number", description: "Le second nombre" },
    },
    required: ["a", "b"],
  },
};

const GET_POKEMON_TOOL: Tool = {
  name: "get_pokemon",
  description: "Récupère les informations d'un Pokémon via PokeAPI",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Le nom du Pokémon (en minuscules, ex: pikachu)",
      },
    },
    required: ["name"],
  },
};

const GET_WEATHER_TOOL: Tool = {
  name: "get_weather",
  description: "Récupère la météo actuelle via Open-Meteo",
  inputSchema: {
    type: "object",
    properties: {
      latitude: { type: "number", description: "Latitude du lieu (ex: 48.8566 pour Paris)" },
      longitude: { type: "number", description: "Longitude du lieu (ex: 2.3522 pour Paris)" },
    },
    required: ["latitude", "longitude"],
  },
};

const QUI_EST_L_AVENIR_TOOL: Tool = {
  name: "qui_est_l_avenir",
  description: "Une petite blague pour ma nouvelle collègue",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [ADD_TOOL, GET_POKEMON_TOOL, GET_WEATHER_TOOL, QUI_EST_L_AVENIR_TOOL],
  };
});

mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "add") {
      const a = Number(args?.a);
      const b = Number(args?.b);
      
      if (isNaN(a) || isNaN(b)) {
        throw new Error("Les arguments 'a' et 'b' doivent être des nombres.");
      }

      return {
        content: [{ type: "text", text: String(a + b) }],
        isError: false,
      };
    }

    if (name === "get_pokemon") {
      const pokemonName = String(args?.name).toLowerCase();
      const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
      const data = response.data;
      
      const pokemonInfo = `Nom: ${data.name}\nID: ${data.id}\nTaille: ${data.height / 10}m\nPoids: ${data.weight / 10}kg`;
      
      return {
        content: [{ type: "text", text: pokemonInfo }],
        isError: false,
      };
    }

    if (name === "get_weather") {
      const lat = Number(args?.latitude);
      const lon = Number(args?.longitude);
      
      if (isNaN(lat) || isNaN(lon)) {
         throw new Error("Latitude et Longitude invalides.");
      }

      const response = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
      );
      const weather = response.data.current_weather;
      
      if (!weather) {
         throw new Error("Données météorologiques indisponibles pour ces coordonnées.");
      }

      const weatherInfo = `La température actuelle est de ${weather.temperature}°C avec un vent à ${weather.windspeed} km/h.`;

      return {
        content: [{ type: "text", text: weatherInfo }],
        isError: false,
      };
    }

    if (name === "qui_est_l_avenir") {
      return {
        content: [{ type: "text", text: "Marie" }],
        isError: false,
      };
    }

    throw new Error(`Tool inconnu: ${name}`);
  } catch (error: any) {
    let errorMessage = "Erreur inconnue";
    
    if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || error.message;
        if (error.response?.status === 404 && name === "get_pokemon") {
            errorMessage = `Pokémon '${args?.name}' introuvable.`;
        }
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }

    return {
      content: [{ type: "text", text: `Erreur interne: ${errorMessage}` }],
      isError: true,
    };
  }
});
