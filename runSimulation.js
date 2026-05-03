const { getMockWeather } = require('./mockWeather');
const { rescheduleJobs, generateClientMessage } = require('./weatherScheduler');

const jobs = [
  { id: 1, client: 'Tremblay', type: 'pose_tourbe', priority: 'high',   deadline: '2026-06-10' },
  { id: 2, client: 'Gagnon',   type: 'peinture',    priority: 'urgent', deadline: '2026-06-05' },
  { id: 3, client: 'Roy',      type: 'excavation',  priority: 'medium', deadline: '2026-06-15' },
  { id: 4, client: 'Bouchard', type: 'pavage',      priority: 'low',    deadline: '2026-06-20' },
];

const weather = getMockWeather();
const weatherByHour = {};
for (const slot of weather) {
  weatherByHour[slot.time] = slot;
}

const decisions = rescheduleJobs(jobs, weatherByHour);

for (const decision of decisions) {
  const job = jobs.find(j => j.id === decision.jobId);
  const clientMessage = generateClientMessage(job, decision);

  console.log('========================================');
  console.log('=== CLIENT ===');
  console.log(`Nom         : ${job.client}`);
  console.log(`Type de job : ${job.type}`);
  console.log(`Priorité    : ${job.priority}`);
  console.log(`Deadline    : ${job.deadline}`);
  console.log('');
  console.log('=== DÉCISION ===');
  console.log(`Action            : ${decision.action}`);
  console.log(`Heure suggérée    : ${decision.suggestedTime ?? 'aucune'}`);
  console.log(`Message technique : ${decision.message}`);
  console.log('');
  console.log('=== MESSAGE CLIENT ===');
  console.log(clientMessage);
  console.log('');
}
