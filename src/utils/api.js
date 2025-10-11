export const fetchSensorData = async () => {
  return [
    { id: 1, carbonLevel: 420, energyGenerated: 5.2, timestamp: Date.now() },
    { id: 2, carbonLevel: 390, energyGenerated: 6.1, timestamp: Date.now() },
  ];
};