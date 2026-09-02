export const SearchField = ({ onFind }: { onFind: (q: string) => void }) => (
  <input type="search" aria-label="상품 검색" onChange={(e) => onFind(e.target.value)} />
);
