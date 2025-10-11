import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const dummyData = [
  { time: "10:00", co2: 410, energy: 0.1 },
  { time: "10:10", co2: 415, energy: 0.15 },
  { time: "10:20", co2: 420, energy: 0.22 },
  { time: "10:30", co2: 417, energy: 0.19 },
];

export default function SensorChart() {
  return (
    <div className="bg-gray-800 p-6 rounded-2xl shadow-xl">
      <h3 className="text-lg font-bold mb-4">Real-time CO₂ and Energy Data</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={dummyData}>
          <Line type="monotone" dataKey="co2" stroke="#22c55e" strokeWidth={3} />
          <Line type="monotone" dataKey="energy" stroke="#3b82f6" strokeWidth={3} />
          <CartesianGrid stroke="#333" strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
