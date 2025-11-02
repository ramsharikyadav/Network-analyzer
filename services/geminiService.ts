import { GoogleGenAI, Type } from "@google/genai";
import { Device, PortService } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This is a placeholder for environments where the key might not be set.
  // The app will show an error in the analysis field.
  console.error("Gemini API key not found. AI analysis will fail.");
}

/**
 * Analyzes a device based on its open ports using the Gemini API.
 * @param device The device object containing IP and open ports.
 * @returns A promise that resolves to an object with the AI's analysis, category, and identified services.
 */
export const analyzeDeviceByPorts = async (device: Pick<Device, 'ip' | 'openPorts'>): Promise<{ analysis: string, category: string, services: PortService[] }> => {
    const defaultErrorResponse = {
        analysis: 'An error occurred while analyzing the device with AI. The API might be unavailable or the key may be invalid.',
        category: 'Error',
        services: []
    };

    if (!API_KEY) {
        return { analysis: "Error: Gemini API key is not configured.", category: "Error", services: [] };
    }
    
    if (device.openPorts.length === 0) {
        return { analysis: "No open ports detected to analyze.", category: "Unknown", services: [] };
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const categories = ['Server', 'Router', 'Workstation', 'Printer', 'NAS', 'IoT Device', 'Mobile Device', 'Unknown'];
    const prompt = `
        A device on a local network at IP address ${device.ip} has the following TCP ports open: ${device.openPorts.join(', ')}.

        Analyze this device based on its open ports and provide a response in JSON format. The JSON object must contain three keys: "category", "services", and "analysis".

        1. For the "category" key, choose the most likely device type from this list: ${categories.join(', ')}.
        2. For the "services" key, provide an array of objects. Each object should represent an open port and contain three keys: "port" (the port number), "serviceName" (the common name of the service, e.g., "HTTP", "SSH"), and "description" (a brief one-sentence description of the service's purpose).
        3. For the "analysis" key, provide a brief, user-friendly summary based on the identified services. This summary should explain what the device's likely role is on the network and offer a general security tip related to the open ports.

        Keep all descriptions and the final analysis concise and easy for a non-technical user to understand.
    `;
    
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            category: {
                type: Type.STRING,
                description: `The device category, chosen from: ${categories.join(', ')}.`
            },
            analysis: {
                type: Type.STRING,
                description: 'A brief, user-friendly summary of the device role and security considerations.'
            },
            services: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        port: { type: Type.NUMBER, description: 'The port number.' },
                        serviceName: { type: Type.STRING, description: 'The common name of the service.' },
                        description: { type: Type.STRING, description: 'A brief one-sentence description of the service.' }
                    },
                    required: ['port', 'serviceName', 'description']
                }
            }
        },
        required: ['category', 'analysis', 'services'],
    };


    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const resultJson = JSON.parse(response.text);
        
        return {
            analysis: resultJson.analysis || "AI analysis was incomplete.",
            category: resultJson.category || "Unknown",
            services: resultJson.services || []
        };
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        return defaultErrorResponse;
    }
};