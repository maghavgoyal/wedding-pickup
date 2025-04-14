"use client"

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

// Mock data for the chart
const data = [
  { name: "Mon", airport: 4, train: 2, bus: 1 },
  { name: "Tue", airport: 3, train: 1, bus: 2 },
  { name: "Wed", airport: 5, train: 3, bus: 0 },
  { name: "Thu", airport: 7, train: 4, bus: 1 },
  { name: "Fri", airport: 12, train: 6, bus: 3 },
  { name: "Sat", airport: 8, train: 5, bus: 2 },
  { name: "Sun", airport: 6, train: 3, bus: 1 },
]

export function ArrivalChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "none",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            padding: "8px 12px",
          }}
        />
        <Bar dataKey="airport" fill="#F43F7A" radius={[4, 4, 0, 0]} name="Airport" />
        <Bar dataKey="train" fill="#8A7EF8" radius={[4, 4, 0, 0]} name="Train Station" />
        <Bar dataKey="bus" fill="#17EBAA" radius={[4, 4, 0, 0]} name="Bus Terminal" />
      </BarChart>
    </ResponsiveContainer>
  )
}
