import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CarbonChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={250}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="timestamp" tickFormatter={(t) => new Date(t).toLocaleTimeString()} />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="carbonLevel" stroke="#82ca9d" />
      <Line type="monotone" dataKey="energyGenerated" stroke="#8884d8" />
    </LineChart>
  </ResponsiveContainer>
);

export default CarbonChart;