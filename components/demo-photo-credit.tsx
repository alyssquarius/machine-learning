import type { Car } from '@/components/store-provider';

export function DemoPhotoCredit({car}:{car:Car}) {
  const credit=car.photoCredit;
  if (!car.isDemo || !credit || !credit.source.startsWith('https://commons.wikimedia.org/') || !/^https:\/\/(creativecommons.org|commons.wikimedia.org)\//.test(credit.licenseUrl)) return null;
  return <p className="px-5 py-2 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">Foto referensi: <a href={credit.source} target="_blank" rel="noopener noreferrer" className="underline">{credit.author}</a> · <a href={credit.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline">{credit.license}</a>. Diperkecil &amp; dipotong untuk tampilan.</p>;
}
