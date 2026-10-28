"use client";

import Link from "next/link";
import * as React from "react";
import { useStore } from "@/components/store-provider";
import { CarCard } from "@/components/car-card";
import { CheckoutModal, DetailModal, OfferModal } from "@/components/modals";
import { PageHeader, EmptyState } from "@/components/ui";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/toast";

export default function FavoritPage() {
  const store = useStore();
  const { toast } = useToast();
  const [detailId, setDetailId] = React.useState<string | null>(null);
  const [offerId, setOfferId] = React.useState<string | null>(null);
  const [buyId, setBuyId] = React.useState<string | null>(null);
  const list = store.favorites();

  return (
    <div>
      <PageHeader eyebrow="PILIHAN PERSONAL" title="Favorit" description={`${list.length} mobil tersimpan untuk kamu pertimbangkan.`} actions={<><Link href="/beli" className="button-primary">Jelajahi katalog<Icon name="arrow" className="h-4 w-4" /></Link>{list.length ? <button className="button-secondary" onClick={() => { if (confirm("Hapus semua mobil dari favorit?")) { store.clearFavs(); toast("Daftar favorit sudah dikosongkan."); } }}>Kosongkan favorit</button> : null}</>} />

      {list.length === 0 ? (
        <div className="surface"><EmptyState icon="heart" title="Beri tempat untuk pilihan favoritmu." description="Ketuk ikon hati pada mobil yang menarik perhatianmu. Semua pilihanmu akan tersimpan rapi di sini." action={{href:"/beli",label:"Temukan pilihan pertamamu"}} /></div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => (
            <CarCard key={c.id} car={c} onDetail={setDetailId} onBuy={setBuyId} onOffer={setOfferId} />
          ))}
        </div>
      )}

      {detailId ? (
        <DetailModal carId={detailId} onClose={() => setDetailId(null)} onBuy={setBuyId} onOffer={setOfferId} />
      ) : null}
      {offerId ? <OfferModal carId={offerId} onClose={() => setOfferId(null)} /> : null}
      {buyId ? <CheckoutModal carId={buyId} onClose={() => setBuyId(null)} /> : null}
    </div>
  );
}
