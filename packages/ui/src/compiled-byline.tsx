export function CompiledByline({ name, verifiedAt }: { name: string; verifiedAt?: string }) {
  return (
    <p className="text-sm text-ink-muted">
      Compiled by <span className="font-medium text-ink">{name}</span>
      {verifiedAt ? <> · last verified {verifiedAt}</> : null}
    </p>
  );
}
