/**
 * mockWeather.js
 *
 * Simule une journée météo complète pour tester le moteur sans API réelle.
 * Scénario : beau matin → humidité montante vers midi → pluie en après-midi.
 */

function getMockWeather() {
  return [
    {
      time: '07:00',
      rainProbability: 5,
      windKmh: 8,
      temperature: 14,
      humidity: 55,
    },
    {
      time: '08:00',
      rainProbability: 5,
      windKmh: 10,
      temperature: 16,
      humidity: 58,
    },
    {
      time: '09:00',
      rainProbability: 10,
      windKmh: 12,
      temperature: 18,
      humidity: 62,
    },
    {
      time: '10:00',
      rainProbability: 15,
      windKmh: 15,
      temperature: 20,
      humidity: 66,
    },
    {
      time: '11:00',
      rainProbability: 25,
      windKmh: 18,
      temperature: 21,
      humidity: 72,
    },
    {
      time: '13:00',
      rainProbability: 45,
      windKmh: 22,
      temperature: 20,
      humidity: 80,
    },
    {
      time: '14:00',
      rainProbability: 60,
      windKmh: 28,
      temperature: 19,
      humidity: 87,
    },
    {
      time: '15:00',
      rainProbability: 75,
      windKmh: 32,
      temperature: 18,
      humidity: 92,
    },
  ];
}

module.exports = { getMockWeather };
