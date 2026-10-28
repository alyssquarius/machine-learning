type Props = { text: string; className?: string };

// Parse only <b> markers so stored history never renders arbitrary HTML.
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
