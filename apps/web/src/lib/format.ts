export function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function dateTime(value: string) {
  return new Date(value).toLocaleString("id-ID");
}
