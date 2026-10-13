type Props = { text: string; className?: string };

/**
 * Render aman untuk teks riwayat/notifikasi.
 * Store hanya menyimpan tag <b>...</b> (sudah di-escape),
 * jadi kita parse manual tanpa dangerouslySetInnerHTML.
 */
export function HistText({ text, className }: Props) {
  const parts = String(text ?? "").split(/(<b>.*?<\/b>)/g);
  return (
    <span className={className}>
      {parts.map((p, i) =>
        p.startsWith("<b>") && p.endsWith("</b>") ? (
          <b key={i}>{p.slice(3, -4)}</b>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </span>
  );
}
