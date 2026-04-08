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
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="title" hide={data.length > 6} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="collectedAmount" name="Donasi Masuk" fill="#0f7b6c" radius={[8, 8, 0, 0]} />
          <Bar dataKey="distributedAmount" name="Tersalurkan" fill="#f08b37" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
