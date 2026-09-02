export function TagRow({ tags }: { tags: string[] }) {
  const chips = tags.map(tag => <span key={tag} className="chip">{tag}</span>);
  return <div className="tags">{chips}</div>;
}
