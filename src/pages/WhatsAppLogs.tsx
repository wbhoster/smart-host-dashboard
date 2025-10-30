import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/storage';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Log {
  id: number;
  client_id?: string | null;
  client_name?: string | null;
  username?: string | null;
  phone: string;
  message: string;
  status: 'sent' | 'failed';
  error_message?: string | null;
  created_at: string;
}

const PAGE_SIZE = 20;

const WhatsAppLogs = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const load = async (p = 1) => {
    const res = await storage.getWhatsAppLogs(p, PAGE_SIZE);
    setLogs(res.data);
    setTotal(res.total);
    setPage(p);
  };

  useEffect(() => { load(1); }, []);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">WhatsApp Logs</h1>
        <p className="text-muted-foreground mt-1">History of all WhatsApp messages sent</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Logs ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">No logs yet.</TableCell>
                  </TableRow>
                ) : (
                  logs.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={l.status === 'sent' ? 'text-green-600' : 'text-red-600'}>{l.status}</span>
                      </TableCell>
                      <TableCell className="max-w-[160px] truncate">{l.client_name || '-'}</TableCell>
                      <TableCell className="max-w-[120px] truncate">{l.username || '-'}</TableCell>
                      <TableCell className="max-w-[120px] truncate">{l.phone}</TableCell>
                      <TableCell className="max-w-[360px] truncate" title={l.message}>{l.message}</TableCell>
                      <TableCell className="max-w-[240px] truncate" title={l.error_message || ''}>{l.error_message || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => load(Math.max(1, page - 1))} disabled={page === 1}>
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => load(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppLogs;
