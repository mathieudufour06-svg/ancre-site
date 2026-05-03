const { suggestSchedule, getWeatherScoreBreakdown } = require('./weatherScheduler');
const { getMockWeather } = require('./mockWeather');

const jobs = [
  { id: 1, client: 'Dupont', type: 'pose_tourbe' },
  { id: 2, client: 'Martin', type: 'peinture' },
  { id: 3, client: 'Tremblay', type: 'pavage' },
  { id: 4, client: 'Gagnon', type: 'excavation' },
];

const mockWeather = getMockWeather();
const weatherByHour = {};
for (const slot of mockWeather) {
  weatherByHour[slot.time] = slot;
}

const results = suggestSchedule(jobs, weatherByHour);

for (const result of results) {
  console.log(`\n[${result.client}] ${result.type}`);
  console.log(`  Meilleure heure : ${result.bestHour}`);
  console.log(`  Score           : ${result.score}/100`);
  console.log(`  Statut          : ${result.status}`);

  if (result.status !== 'ok') {
    const bestWeather = weatherByHour[result.bestHour];
    const job = jobs.find(j => j.id === result.jobId);
    const breakdown = getWeatherScoreBreakdown(job, bestWeather);
    console.log('  Breakdown       :', breakdown);
  }
}
