interface Column {
  header: string;
  width?: string;
}

interface Row {
  cells: string[];
}

interface DataTableProps {
  caption?: string;
  columns: Column[];
  rows: Row[];
}

export default function DataTable({ caption, columns, rows }: DataTableProps) {
  return (
    <div className="my-8 overflow-x-auto">
      {caption && (
        <p className="text-sm font-['Redaction_20'] uppercase tracking-wide text-[var(--cream-muted)] mb-3">
          {caption}
        </p>
      )}
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-[var(--divider)]">
            {columns.map((col, i) => (
              <th
                key={i}
                style={col.width ? { width: col.width } : undefined}
                className="py-4 pr-4 text-left text-[1.1rem] font-[800] text-[var(--cream)]"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx} className="border-b border-[var(--divider)]">
              {row.cells.map((cell, cellIdx) => (
                <td
                  key={cellIdx}
                  className={`py-4 pr-4 text-[1.1rem] leading-relaxed align-top ${
                    cellIdx === 0
                      ? "font-[800] text-[var(--cream)]"
                      : "text-[var(--cream-muted)]"
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
