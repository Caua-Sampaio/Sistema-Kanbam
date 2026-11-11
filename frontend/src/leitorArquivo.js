import * as XLSX from 'xlsx';

// Converte a primeira planilha de um .xlsx/.xls em texto CSV (separador ;)
export async function arquivoParaCsv(arquivo) {
  if (!/\.xlsx?$/i.test(arquivo.name)) return arquivo.text();
  const wb = XLSX.read(await arquivo.arrayBuffer(), { type: 'array' });
  const primeira = wb.Sheets[wb.SheetNames[0]];
  if (!primeira) throw new Error('A planilha está vazia.');
  return XLSX.utils.sheet_to_csv(primeira, { FS: ';' });
}
