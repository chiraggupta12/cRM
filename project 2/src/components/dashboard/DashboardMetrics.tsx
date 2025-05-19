// Example usage in src/pages/Dashboard.tsx
import { DashboardMetrics } from '@/components/dashboard/DashboardMetrics';

export default function DashboardPage() {
  return (
    <div>
      {/* Other dashboard content like title, welcome message, etc. */}
      <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
      <p className="text-muted-foreground mb-6">Welcome back, gchirag12pm</p>
      
      <DashboardMetrics />

      {/* Other dashboard content like charts, recent leads, etc. */}
    </div>
  );
}