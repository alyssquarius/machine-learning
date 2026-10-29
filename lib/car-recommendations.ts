export const CAR_VIEWS_KEY = "abc_catalogue_views_v1";
export function readCarViews(raw: string | null): Record<string, number> {
  try {
    const value: unknown = JSON.parse(raw || "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value)
        .filter(
          ([id, count]) =>
            id.length <= 160 && typeof count === "number" && Number.isFinite(count) && count > 0,
        )
        .slice(-200)
        .map(([id, count]) => [id, Math.min(10000, Math.floor(Number(count)))]),
    );
  } catch {
    return {};
  }
}
export function incrementCarView(views: Record<string, number>, id: string) {
  return Object.fromEntries(
    [
      ...Object.entries(views).filter(([key]) => key !== id),
      [id, Math.min(10000, (Object.hasOwn(views, id) ? views[id] : 0) + 1)],
    ].slice(-200),
  );
}
export function recommendCars<T extends { id: string; category: string }>(
  cars: T[],
  views: Record<string, number>,
  favorites: string[],
  limit = 3,
) {
  const saved = new Set(favorites);
  const count = (id: string) => (Object.hasOwn(views, id) ? views[id] : 0);
  const hasActivity = cars.some((car) => saved.has(car.id) || count(car.id) > 0);
  if (hasActivity)
    return {
      hasActivity,
      cars: sortByLocalInterest(
        cars.filter((car) => saved.has(car.id) || count(car.id) > 0),
        views,
        favorites,
      ).slice(0, limit),
    };
  const categories = new Set<string>();
  const chosen = cars
    .filter((car) => {
      if (categories.has(car.category)) return false;
      categories.add(car.category);
      return true;
    })
    .slice(0, limit);
  const ids = new Set(chosen.map((car) => car.id));
  return {
    hasActivity,
    cars: [...chosen, ...cars.filter((car) => !ids.has(car.id))].slice(0, limit),
  };
}

export function sortByLocalInterest<T extends { id: string }>(
  cars: T[],
  views: Record<string, number>,
  favorites: string[],
) {
  const saved = new Set(favorites);
  const count = (id: string) => (Object.hasOwn(views, id) ? views[id] : 0);
  return [...cars].sort(
    (a, b) => Number(saved.has(b.id)) - Number(saved.has(a.id)) || count(b.id) - count(a.id),
  );
}
