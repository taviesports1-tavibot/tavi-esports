import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="brand" href="/" aria-label="TaVi Esports — головна">
      <span className="brand-mark" aria-hidden="true">
        T
      </span>
      {!compact && (
        <span className="brand-copy">
          <strong>TaVi</strong>
          <small>ESPORTS</small>
        </span>
      )}
    </Link>
  );
}

