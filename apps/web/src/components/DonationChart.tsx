"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type CampaignData = {
  title: string;
  collectedAmount: number;
  distributedAmount: number;
};

export function DonationChart({ data }: { data: CampaignData[] }) {
  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="4 4" stroke="rgba(153, 133, 243, 0.24)" />
          <XAxis dataKey="title" hide={data.length > 6} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="collectedAmount" name="Donasi Masuk" fill="#9985f3" radius={[8, 8, 0, 0]} />
          <Bar dataKey="distributedAmount" name="Tersalurkan" fill="#c7b7fc" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
