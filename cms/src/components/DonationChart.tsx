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
import { CampaignChartData } from "../types/campaign";

interface DonationChartProps {
  data: CampaignChartData[];
}

export function DonationChart({ data }: DonationChartProps) {
  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid 
            strokeDasharray="4 4" 
            stroke="rgba(255, 255, 255, 0.12)" 
          />
          <XAxis 
            dataKey="title" 
            hide={data.length > 6} 
            tick={{ fill: "#beb8cf", fontSize: 12 }} 
          />
          <YAxis 
            tick={{ fill: "#beb8cf", fontSize: 12 }} 
          />
          <Tooltip
            contentStyle={{
              background: "#171924",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "10px",
              color: "#f3eefb",
            }}
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
          />
          <Legend wrapperStyle={{ color: "#e7e1f3" }} />
          <Bar 
            dataKey="collectedAmount" 
            name="Donasi Masuk" 
            fill="#9985f3" 
            radius={[8, 8, 0, 0]} 
          />
          <Bar 
            dataKey="distributedAmount" 
            name="Tersalurkan" 
            fill="#c7b7fc" 
            radius={[8, 8, 0, 0]} 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}