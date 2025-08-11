"use client";

/*
  Utilization Model Test Page
  - Purpose: Simple client UI to validate the end-to-end utilization prediction flow.
  - Actions:
    - "Health Check" calls `/api/utilization-model/health` to ensure the Python FastAPI
      service and models are available.
    - "Predict" posts minimal features (e.g., age, BMI) to `/api/utilization-model/predict`
      and displays the returned annual utilization counts.
  - Note: The "use client" directive must remain the first statement in this file.
*/

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

type PredictResponse = {
  pcp_visits: number;
  outpatient_visits: number;
  er_visits: number;
  inpatient_admits: number;
  home_health_visits: number;
  rx_fills: number;
  dental_visits: number;
  equipment_purchases: number;
};

export default function UtilizationModelTestPage() {
  const [age, setAge] = useState<string>("");
  const [bmi, setBmi] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState<string>("");
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [error, setError] = useState<string>("");

  async function checkHealth() {
    setHealthStatus("checking...");
    setError("");
    try {
      const res = await fetch("/api/utilization-model/health");
      const json = await res.json();
      if (!res.ok) throw new Error(json?.detail || "Service error");
      setHealthStatus("Python service is healthy");
    } catch (e: any) {
      setHealthStatus("");
      setError(e?.message || "Health check failed");
    }
  }

  async function predict() {
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const features: Record<string, any> = {};
      if (age.trim()) features.age_years_2022 = Number(age);
      if (bmi.trim()) features.bmi = Number(bmi);

      const res = await fetch("/api/utilization-model/predict", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(features),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.detail || "Prediction failed");
      setResult(json as PredictResponse);
    } catch (e: any) {
      setError(e?.message || "Prediction failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Utilization Model Test</h1>
        <Button variant="outline" onClick={checkHealth}>
          Health Check
        </Button>
      </div>
      {healthStatus && (
        <div className="text-sm text-green-700">{healthStatus}</div>
      )}
      {error && <div className="text-sm text-red-600">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Enter Minimal Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Age (years)</Label>
              <Input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g., 45"
              />
            </div>
            <div>
              <Label className="text-sm">BMI</Label>
              <Input
                type="number"
                value={bmi}
                onChange={(e) => setBmi(e.target.value)}
                placeholder="e.g., 27.5"
              />
            </div>
          </div>
          <Button onClick={predict} disabled={loading} className="w-full">
            {loading ? "Predicting..." : "Predict"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Predicted Annual Counts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span>Primary care visits</span>
                <span>{result.pcp_visits}</span>
              </div>
              <div className="flex justify-between">
                <span>Outpatient visits</span>
                <span>{result.outpatient_visits}</span>
              </div>
              <div className="flex justify-between">
                <span>ER visits</span>
                <span>{result.er_visits}</span>
              </div>
              <div className="flex justify-between">
                <span>Inpatient admits</span>
                <span>{result.inpatient_admits}</span>
              </div>
              <div className="flex justify-between">
                <span>Home health visits</span>
                <span>{result.home_health_visits}</span>
              </div>
              <div className="flex justify-between">
                <span>Prescription fills</span>
                <span>{result.rx_fills}</span>
              </div>
              <div className="flex justify-between">
                <span>Dental visits</span>
                <span>{result.dental_visits}</span>
              </div>
              <div className="flex justify-between">
                <span>Durable equipment purchases</span>
                <span>{result.equipment_purchases}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
