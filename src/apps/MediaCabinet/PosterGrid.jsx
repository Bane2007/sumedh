import { generateGenericCover } from './mediaUtils.jsx';

function getCardRatingBadge(category, item) {
  if (category === 'films') {
    return item.rating || null;
  }
  const personal = parseFloat(item.my_rating);
  if (isNaN(personal)) return null;
  return '★'.repeat(Math.round(personal / 2));
}

function PosterGrid({ items, category, selectedItem, onSelectItem, onRemoveItem }) {
  if (items.length === 0) {
    return <div className="mc-grid-empty mono">[ No matching titles found on the shelf ]</div>;
  }

  return (
    <div className="mc-grid">
      {items.map((item, index) => {
        const isSelected = selectedItem && (
          category === 'films' ? selectedItem.slug === item.slug : selectedItem.id === item.id
        );
        const ratingBadge = getCardRatingBadge(category, item);

        return (
          <div
            key={category === 'films' ? item.slug : item.id}
            className={`mc-card ${isSelected ? 'mc-card--selected' : ''}`}
            style={{ animationDelay: `${index * 12}ms` }}
            tabIndex="0"
            onClick={() => onSelectItem(item)}
            onFocus={() => onSelectItem(item)}
          >
            {item.isCustom && (
              <button
                className="mc-card-delete-btn"
                onClick={(e) => { e.stopPropagation(); onRemoveItem(item); }}
                title="Delete custom entry"
              >
                DELETE
              </button>
            )}

            <div className="mc-card-poster">
              {item.image ? (
                <img src={item.image} alt={item.title} loading="lazy" referrerPolicy="no-referrer" />
              ) : (
                <div className="mc-card-fallback-cover" dangerouslySetInnerHTML={{ __html: generateGenericCover(item.title, item.year) }} />
              )}

              {(item.status === 'watching' || item.status === 'reading') && (
                <div className="mc-card-status mono">{item.status}</div>
              )}

              {ratingBadge && <div className="mc-card-rating mono">{ratingBadge}</div>}

              <div className="mc-card-hover-overlay">
                <span className="mc-card-hover-title">{item.title}</span>
                <span className="mc-card-hover-year">{item.year}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default PosterGrid;
