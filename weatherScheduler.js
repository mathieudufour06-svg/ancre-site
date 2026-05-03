/**
 * weatherScheduler.js
 *
 * Moteur météo pour SmartPlan MVP.
 * Évalue si un travail extérieur peut être exécuté selon les conditions météo
 * et propose la meilleure heure d'exécution.
 *
 * Les règles et pondérations sont chargées depuis weatherConfig.js
 * et peuvent être surchargées à l'exécution via setConfig().
 */

const defaultConfig = require('./weatherConfig');

// Config active (modifiable via setConfig)
let config = {
  rules: { ...defaultConfig.JOB_RULES },
  weights: { ...defaultConfig.JOB_WEIGHTS },
  defaultWeights: { ...defaultConfig.DEFAULT_WEIGHTS },
};

/**
 * Surcharge tout ou partie de la configuration.
 * Les clés non fournies conservent leur valeur courante.
 *
 * @param {{rules?: object, weights?: object, defaultWeights?: object}} newConfig
 */
function setConfig(newConfig = {}) {
  if (newConfig.rules) config.rules = { ...config.rules, ...newConfig.rules };
  if (newConfig.weights) config.weights = { ...config.weights, ...newConfig.weights };
  if (newConfig.defaultWeights) config.defaultWeights = { ...config.defaultWeights, ...newConfig.defaultWeights };
}

function getRules(type) {
  return config.rules[type];
}

function getWeights(type) {
  return config.weights[type] || config.defaultWeights;
}

// --- Helpers ------------------------------------------------------------

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Retourne un sous-score entre 0 et 1 pour une valeur comparée à un seuil max.
 * 0 = bien au-dessus du seuil (mauvais), 1 = bien en-dessous (bon).
 */
function scoreUnderMax(value, max) {
  if (value <= 0) return 1;
  if (value >= max) {
    // pénalité progressive au-delà du seuil
    const over = (value - max) / max;
    return clamp(1 - over - 1, 0, 1); // toujours <= 0 → ramené à 0
  }
  return clamp(1 - value / max, 0, 1);
}

/**
 * Sous-score pour la température : 1 si dans la plage idéale,
 * décroît à mesure qu'on s'en éloigne.
 */
function scoreTemperature(temp, min, max) {
  if (temp >= min && temp <= max) return 1;
  const distance = temp < min ? min - temp : temp - max;
  return clamp(1 - distance / 10, 0, 1);
}

// --- API ----------------------------------------------------------------

/**
 * Évalue les conditions météo pour un job donné.
 *
 * @param {{id: string|number, client: string, type: string}} job
 * @param {{rainProbability: number, windKmh: number, temperature: number, humidity: number}} weather
 * @returns {{status: 'ok'|'risk'|'bad', score: number, reason: string}}
 */
function evaluateJobWeather(job, weather) {
  const rules = getRules(job.type);
  if (!rules) {
    return {
      status: 'bad',
      score: 0,
      reason: `Type de travail inconnu : ${job.type}`,
    };
  }

  const weights = getWeights(job.type);

  const rainScore = scoreUnderMax(weather.rainProbability, rules.maxRainProbability);
  const windScore = scoreUnderMax(weather.windKmh, rules.maxWindKmh);
  const tempScore = scoreTemperature(weather.temperature, rules.minTemperature, rules.maxTemperature);
  const humidityScore = scoreUnderMax(weather.humidity, rules.maxHumidity);

  const score = Math.round(
    rainScore * weights.rain +
    windScore * weights.wind +
    tempScore * weights.temperature +
    humidityScore * weights.humidity
  );

  const reasons = [];
  if (weather.rainProbability > rules.maxRainProbability) {
    reasons.push(`pluie ${weather.rainProbability}% > ${rules.maxRainProbability}%`);
  }
  if (weather.windKmh > rules.maxWindKmh) {
    reasons.push(`vent ${weather.windKmh}km/h > ${rules.maxWindKmh}km/h`);
  }
  if (weather.temperature < rules.minTemperature || weather.temperature > rules.maxTemperature) {
    reasons.push(`température ${weather.temperature}°C hors plage ${rules.minTemperature}–${rules.maxTemperature}°C`);
  }
  if (weather.humidity > rules.maxHumidity) {
    reasons.push(`humidité ${weather.humidity}% > ${rules.maxHumidity}%`);
  }

  let status;
  if (score >= 75) status = 'ok';
  else if (score >= 50) status = 'risk';
  else status = 'bad';

  const reason = reasons.length === 0
    ? 'Conditions favorables'
    : reasons.join(', ');

  return { status, score, reason };
}

/**
 * Suggère la meilleure heure d'exécution pour chaque job.
 *
 * @param {Array} jobs - liste de jobs
 * @param {Object<string|number, Object>} weatherByHour - météo indexée par heure
 *        ex : { 8: { rainProbability, windKmh, temperature, humidity }, 9: {...} }
 * @returns {Array<{jobId, client, type, bestHour, status, score, reason}>}
 */
function suggestSchedule(jobs, weatherByHour) {
  const hours = Object.keys(weatherByHour);

  return jobs.map((job) => {
    let best = null;

    for (const hour of hours) {
      const evaluation = evaluateJobWeather(job, weatherByHour[hour]);
      if (!best || evaluation.score > best.score) {
        best = { hour, ...evaluation };
      }
    }

    return {
      jobId: job.id,
      client: job.client,
      type: job.type,
      bestHour: best ? best.hour : null,
      status: best ? best.status : 'bad',
      score: best ? best.score : 0,
      reason: best ? best.reason : 'Aucune donnée météo disponible',
    };
  });
}

/**
 * Retourne le détail des sous-scores pondérés pour un job donné.
 * Utile pour comprendre POURQUOI une job est acceptée ou refusée.
 *
 * @param {{id: string|number, client: string, type: string}} job
 * @param {{rainProbability: number, windKmh: number, temperature: number, humidity: number}} weather
 * @returns {{rainScore, windScore, temperatureScore, humidityScore, totalScore}}
 */
function getWeatherScoreBreakdown(job, weather) {
  const rules = getRules(job.type);
  if (!rules) {
    return {
      rainScore: 0,
      windScore: 0,
      temperatureScore: 0,
      humidityScore: 0,
      totalScore: 0,
    };
  }

  const weights = getWeights(job.type);

  const rainScore = Math.round(
    scoreUnderMax(weather.rainProbability, rules.maxRainProbability) * weights.rain
  );
  const windScore = Math.round(
    scoreUnderMax(weather.windKmh, rules.maxWindKmh) * weights.wind
  );
  const temperatureScore = Math.round(
    scoreTemperature(weather.temperature, rules.minTemperature, rules.maxTemperature) * weights.temperature
  );
  const humidityScore = Math.round(
    scoreUnderMax(weather.humidity, rules.maxHumidity) * weights.humidity
  );

  return {
    rainScore,
    windScore,
    temperatureScore,
    humidityScore,
    totalScore: rainScore + windScore + temperatureScore + humidityScore,
  };
}

/**
 * Boost de score selon la priorité du job.
 */
function getPriorityScore(job) {
  const map = { urgent: 30, high: 20, medium: 10, low: 0 };
  return map[job.priority] || 0;
}

/**
 * Boost de score selon la proximité de la deadline (YYYY-MM-DD).
 */
function getDeadlineUrgency(job) {
  if (!job.deadline) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(job.deadline);
  deadline.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
  if (diffDays <= 1) return 30;
  if (diffDays <= 3) return 20;
  if (diffDays <= 7) return 10;
  return 0;
}

// Pondérations du score final
const FINAL_WEIGHTS = { weather: 0.7, priority: 0.2, deadline: 0.1 };

function computeAdjustedScore(weatherScore, priorityBoost, deadlineBoost) {
  // priorityBoost et deadlineBoost sont sur 30 → normalisés sur 100
  return (
    weatherScore * FINAL_WEIGHTS.weather +
    (priorityBoost / 30) * 100 * FINAL_WEIGHTS.priority +
    (deadlineBoost / 30) * 100 * FINAL_WEIGHTS.deadline
  );
}

/**
 * Identifie la cause principale d'un score risqué via le breakdown.
 * Renvoie 'pluie', 'humidité', 'vent' ou 'température'.
 */
function getMainWeatherIssue(job, weather) {
  const breakdown = getWeatherScoreBreakdown(job, weather);
  const weights = getWeights(job.type);
  const ratios = {
    pluie: breakdown.rainScore / weights.rain,
    vent: breakdown.windScore / weights.wind,
    température: breakdown.temperatureScore / weights.temperature,
    humidité: breakdown.humidityScore / weights.humidity,
  };
  let worstKey = 'pluie';
  let worstRatio = Infinity;
  for (const [key, ratio] of Object.entries(ratios)) {
    if (ratio < worstRatio) {
      worstRatio = ratio;
      worstKey = key;
    }
  }
  return worstKey;
}

/**
 * Décide automatiquement quoi faire avec chaque job en fonction de la météo,
 * de la priorité et de la deadline.
 */
function rescheduleJobs(jobs, weatherByHour) {
  const hours = Object.keys(weatherByHour);

  const results = jobs.map((job) => {
    const priorityBoost = getPriorityScore(job);
    const deadlineBoost = getDeadlineUrgency(job);
    const isUrgent = job.priority === 'urgent';

    let bestOk = null;
    let bestRisk = null;
    let bestAny = null;

    for (const hour of hours) {
      const evaluation = evaluateJobWeather(job, weatherByHour[hour]);
      const adjustedScore = computeAdjustedScore(evaluation.score, priorityBoost, deadlineBoost);
      const candidate = { hour, ...evaluation, adjustedScore };

      if (evaluation.status === 'ok' && (!bestOk || adjustedScore > bestOk.adjustedScore)) {
        bestOk = candidate;
      }
      if (evaluation.status === 'risk' && (!bestRisk || adjustedScore > bestRisk.adjustedScore)) {
        bestRisk = candidate;
      }
      if (!bestAny || adjustedScore > bestAny.adjustedScore) {
        bestAny = candidate;
      }
    }

    if (bestOk) {
      return {
        jobId: job.id,
        client: job.client,
        action: 'maintain',
        suggestedTime: bestOk.hour,
        message: `Conditions favorables à ${bestOk.hour}`,
        priorityBoost,
        deadlineBoost,
      };
    }

    if (bestRisk && isUrgent) {
      const cause = getMainWeatherIssue(job, weatherByHour[bestRisk.hour]);
      return {
        jobId: job.id,
        client: job.client,
        action: 'maintain',
        suggestedTime: bestRisk.hour,
        message: `Job urgente maintenue malgré conditions risquées (${cause}) à ${bestRisk.hour}`,
        priorityBoost,
        deadlineBoost,
      };
    }

    if (bestRisk) {
      const cause = getMainWeatherIssue(job, weatherByHour[bestRisk.hour]);
      return {
        jobId: job.id,
        client: job.client,
        action: 'risky',
        suggestedTime: bestRisk.hour,
        message: `Conditions risquées (${cause}) à ${bestRisk.hour}`,
        priorityBoost,
        deadlineBoost,
      };
    }

    return {
      jobId: job.id,
      client: job.client,
      action: 'reschedule',
      suggestedTime: bestAny ? bestAny.hour : null,
      message: bestAny
        ? `Conditions mauvaises, meilleur créneau disponible à ${bestAny.hour}`
        : 'Aucune donnée météo disponible',
      priorityBoost,
      deadlineBoost,
    };
  });

  results.sort((a, b) =>
    (b.priorityBoost + b.deadlineBoost) - (a.priorityBoost + a.deadlineBoost)
  );

  return results;
}

module.exports = {
  evaluateJobWeather,
  suggestSchedule,
  getWeatherScoreBreakdown,
  rescheduleJobs,
  getPriorityScore,
  getDeadlineUrgency,
  setConfig,
  config,
};
