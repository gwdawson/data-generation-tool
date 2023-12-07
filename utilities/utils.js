export const exit = (message) => {
  console.log(message);
  process.exit(0);
};

export const getSineWaveDataPoints = () => {
  const xValue = new Date().toISOString();
  const currentTime = new Date().getTime();
  const amplitude = 50;
  const frequency = 0.1;
  const y = amplitude * Math.sin((frequency * currentTime) / 1000);
  const yValue = ((y + amplitude) / (2 * amplitude)) * 100;
  return { xValue, yValue };
};
