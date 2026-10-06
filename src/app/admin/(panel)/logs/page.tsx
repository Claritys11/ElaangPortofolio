import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/admin/guard";
import { prisma } from "@/lib/db";

export default async function LogsPage() {
  await requireAdmin();
  const logs = await prisma.accessLog.findMany({ orderBy: { accessedAt: "desc" }, take: 300 });
  return (
    <div className="grid gap-6">
      <h1 className="font-display text-4xl font-bold tracking-tight">Access logs</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="meta text-left">
            <tr>
              <th className="py-2">When</th>
              <th>User</th>
              <th>IP</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="py-2 font-mono text-xs">{l.accessedAt.toISOString().replace("T", " ").slice(0, 19)}</td>
                <td>{l.username}</td>
                <td className="font-mono text-xs">{l.ip}</td>
                <td>
                  <Badge variant={l.accessSuccessful ? "secondary" : "destructive"}>{l.accessSuccessful ? "ok" : "failed"}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
