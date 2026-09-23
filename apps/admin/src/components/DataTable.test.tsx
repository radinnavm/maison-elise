import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DataTable } from '@/components/DataTable';
import type { Column } from '@/components/DataTable';

interface Row {
  id: string;
  name: string;
  total: number;
}

const columns: Column<Row>[] = [
  { key: 'name', header: 'Name' },
  { key: 'total', header: 'Total', align: 'right', render: (row) => `€${row.total}` },
];

const rows: Row[] = [
  { id: '1', name: 'Aurelia', total: 189 },
  { id: '2', name: 'Elise', total: 520 },
];

describe('DataTable', () => {
  it('renders headers and rows', () => {
    render(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />);

    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Aurelia' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '€520' })).toBeInTheDocument();
  });

  it('renders no rows for an empty list', () => {
    render(<DataTable columns={columns} rows={[]} rowKey={(row) => row.id} />);

    expect(screen.queryByRole('cell', { name: 'Aurelia' })).not.toBeInTheDocument();
  });
});
