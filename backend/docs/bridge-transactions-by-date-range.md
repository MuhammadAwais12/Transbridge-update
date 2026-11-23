### Bridge: Transactions by Date Range (Month/Year) API

This guide shows how to fetch MSB transactions for a specific month/year from your frontend and how to handle the response.

### Endpoint
- Path: `GET /bridge/msb/:msbID/transactions/statement`
- Path params:
  - **msbID**: string (required) – the MSB identifier
- Query params:
  - **month**: number (1–12, optional)
  - **year**: number (4-digit, optional)
- **Default behavior**: If `month` and/or `year` are not provided, the backend returns transactions for the previous UTC month.

### Response
Returns JSON with the total count and a list of transactions. Each transaction includes the originating `customer_id` and optional `user_id`.

```json
{
  "count": 2,
  "data": [
    {
      "txn_type": "onramp",
      "id": "txn_123",
      "source_to_destination": "ACH USD → BASE USDC",
      "created_at": "2025-11-05T12:34:56.000Z",
      "status": "payment_processed",
      "amount": "$1,000.00",
      "raw_amount": 1000,
      "developer_fee": 10,
      "is_from_wallet": false,
      "tracking_and_receipt": [],
      "source_details": [],
      "destination_details": [],
      "instructions": {
        "payment_route_instructions": [],
        "source_details": [],
        "destination_details": []
      },
      "customer_id": "cust_abc",
      "user_id": "user_xyz"
    }
  ]
}
```

Note: Fields follow `TransactionDetailsDto` plus `{ customer_id: string; user_id?: string }`.

### TypeScript helper types (optional)

```ts
type TransactionDetails = {
  txn_type: 'onramp' | 'offramp';
  id: string;
  source_to_destination: string;
  created_at: string; // ISO string
  status: string;
  amount: string;
  raw_amount: number;
  developer_fee: number;
  is_from_wallet: boolean;
  tracking_and_receipt: Array<{ label: string; value?: string; copyable: boolean }>;
  source_details: Array<{ label: string; value?: string; copyable: boolean }>;
  destination_details: Array<{ label: string; value?: string; copyable: boolean }>;
  instructions: {
    payment_route_instructions: Array<{ label: string; value?: string; copyable: boolean }>;
    source_details: Array<{ label: string; value?: string; copyable: boolean }>;
    destination_details: Array<{ label: string; value?: string; copyable: boolean }>;
  };
  customer_id: string;
  user_id?: string;
};

type TransactionsByDateRangeResponse = {
  count: number;
  data: TransactionDetails[];
};
```

### Fetch examples

- Basic (default: previous month, UTC)

```ts
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL; // e.g., https://api.example.com

export async function fetchPrevMonthTransactions(msbID: string) {
  const url = new URL(`/bridge/msb/${encodeURIComponent(msbID)}/transactions/statement`, API_BASE);

  const res = await fetch(url.toString(), { method: 'GET' });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const json = (await res.json()) as TransactionsByDateRangeResponse;
  return json;
}
```

- Specific month/year

```ts
export async function fetchTransactionsByMonth(
  msbID: string,
  month: number, // 1-12
  year: number   // e.g. 2025
) {
  const url = new URL(`/bridge/msb/${encodeURIComponent(msbID)}/transactions/statement`, API_BASE);
  url.searchParams.set('month', String(month));
  url.searchParams.set('year', String(year));

  const res = await fetch(url.toString(), { method: 'GET' });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const json = (await res.json()) as TransactionsByDateRangeResponse;
  return json;
}
```

### Axios examples

```ts
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function axiosPrevMonthTransactions(msbID: string) {
  const { data } = await axios.get<TransactionsByDateRangeResponse>(
    `${API_BASE}/bridge/msb/${encodeURIComponent(msbID)}/transactions/statement`,
  );
  return data;
}

export async function axiosTransactionsByMonth(msbID: string, month: number, year: number) {
  const { data } = await axios.get<TransactionsByDateRangeResponse>(
    `${API_BASE}/bridge/msb/${encodeURIComponent(msbID)}/transactions/statement`,
    { params: { month, year } },
  );
  return data;
}
```

### Rendering example (React)

```tsx
import { useEffect, useState } from 'react';

export function TransactionsTable({ msbID }: { msbID: string }) {
  const [rows, setRows] = useState<TransactionDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await fetchPrevMonthTransactions(msbID);
        setRows(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    })();
  }, [msbID]);

  if (loading) return <div>Loading…</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Type</th>
          <th>Status</th>
          <th>Amount</th>
          <th>Developer Fee</th>
          <th>Customer</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((t) => (
          <tr key={t.id}>
            <td>{new Date(t.created_at).toLocaleString()}</td>
            <td>{t.txn_type}</td>
            <td>{t.status}</td>
            <td>{t.amount}</td>
            <td>{t.developer_fee}</td>
            <td>{t.customer_id}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Notes
- **Month numbering is 1–12**: January is 1, December is 12.
- The backend applies UTC when determining the month range.
- Large MSBs may yield large responses; consider client-side pagination or server-side filtering in follow-up endpoints if needed.

### Troubleshooting
- 400/422: Check that `msbID` is provided and `month` is in 1–12.
- 404/Empty data: No transactions found for the specified month/year.
- CORS/network issues: Ensure your frontend points to the correct backend base URL and that any required auth/proxy is configured.


