"use client";

import { memo } from "react";

interface HighlightMatchProps {
  text: string;
  query: string;
}

function HighlightMatchInner({ text, query }: HighlightMatchProps) {
  if (!query || !text) return <>{text}</>;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) return <>{text}</>;

  const before = text.slice(0, index);
  const match = text.slice(index, index + query.length);
  const after = text.slice(index + query.length);

  return (
    <>
      {before}
      <span className="font-semibold text-foreground">{match}</span>
      {after}
    </>
  );
}

export const HighlightMatch = memo(HighlightMatchInner);
