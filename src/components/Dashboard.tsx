import { useEffect, useState } from "react";
import SensorChart from "../components/SensorChart";
import DashboardCard from "../components/DashboardCard";
import { gql, useQuery } from "@apollo/client";

const GET_METRICS = gql`
  query GetMetrics {
    metrics {
      totalCO2
      totalEnergy
      totalCET
    }
  }
`;

export default function Dashboard() {
  const { data, loading } = useQuery(GET_METRICS);
  const [metrics, setMetrics] = useState({ totalCO2: 0, totalEnergy: 0, totalCET: 0 });

  useEffect(() => {
    if (data) setMetrics(data.metrics);
  }, [data]);

  if (loading) return <div className="text-white text-center mt-10">Loading...</div>;

  return (
    <div className="p-6 text-white bg-gradient-to-br from-gray-900 to-black min-h-screen">
      <h2 className="text-3xl mb-6 font-bold">🌿 Carbon Dashboard</h2>
      <div className="grid grid-cols-3 gap-6">
        <DashboardCard title="CO₂ Captured" value={`${metrics.totalCO2} ppm`} />
        <DashboardCard title="Energy Generated" value={`${metrics.totalEnergy} kWh`} />
        <DashboardCard title="CET Earned" value={`${metrics.totalCET} CET`} />
      </div>
      <div className="mt-10">
        <SensorChart />
      </div>
    </div>
  );
}
