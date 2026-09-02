export function IntentCard({
  intent,
  category,
}: {
  intent?: string;
  category?: string;
}) {
  return (
    <div>
      <p className="typo-eyebrow text-steel">Intent</p>
      {intent ? (
        <p className="mt-2 text-[16px] font-medium">
          {intent}
          {category ? ` / ${category}` : ""}
        </p>
      ) : (
        <p className="mt-2 text-[14px] text-steel">Waiting for classification</p>
      )}
    </div>
  );
}
