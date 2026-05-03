/**
 * weatherConfig.js
 *
 * Configuration externe du moteur météo SmartPlan.
 * Modifie ce fichier (ou utilise setConfig dans weatherScheduler) pour ajuster :
 *   - les seuils par type de travail (rules)
 *   - les pondérations par type de travail (weights)
 *
 * Les pondérations doivent sommer à 100 pour rester comparables d'un type à l'autre.
 */

const DEFAULT_WEIGHTS = {
  rain: 40,
  wind: 25,
  temperature: 20,
  humidity: 15,
};

const JOB_RULES = {
  pose_tourbe: {
    maxRainProbability: 30,
    maxWindKmh: 40,
    minTemperature: 5,
    maxTemperature: 30,
    maxHumidity: 90,
  },
  peinture: {
    maxRainProbability: 10,
    maxWindKmh: 25,
    minTemperature: 10,
    maxTemperature: 32,
    maxHumidity: 70,
  },
  pavage: {
    maxRainProbability: 20,
    maxWindKmh: 50,
    minTemperature: 5,
    maxTemperature: 35,
    maxHumidity: 95,
  },
  excavation: {
    maxRainProbability: 50,
    maxWindKmh: 60,
    minTemperature: -5,
    maxTemperature: 35,
    maxHumidity: 100,
  },
};

// Pondérations spécifiques par type de travail (somme = 100)
const JOB_WEIGHTS = {
  pose_tourbe: { rain: 35, wind: 20, temperature: 25, humidity: 20 },

  // Peinture : très sensible à l'humidité (séchage)
  peinture:    { rain: 30, wind: 15, temperature: 20, humidity: 35 },

  pavage:      { rain: 35, wind: 20, temperature: 30, humidity: 15 },

  // Excavation : tolère plus de pluie → poids pluie réduit, vent/humidité augmentés
  excavation:  { rain: 15, wind: 30, temperature: 25, humidity: 30 },
};

module.exports = {
  DEFAULT_WEIGHTS,
  JOB_RULES,
  JOB_WEIGHTS,
};
