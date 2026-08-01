import { generateGenericCover } from './mediaUtils.jsx';

function getSpineRatingMark(category, item) {
  if (category === 'films') {
    if (!item.rating) return null;
    const stars = (item.rating.split('★').length - 1) + (item.rating.includes('½') ? 0.5 : 0);
    return stars > 0 ? '★'.repeat(Math.round(stars)) : null;
  }
  const personal = parseFloat(item.my_rating);
  if (isNaN(personal)) return null;
  return '★'.repeat(Math.round(personal / 2));
}

function ShelfBrowser({ items, category, selectedItem, onSelectItem, onRemoveItem }) {
  if (items.length === 0) {
    return <div className="mc-shelf-empty mono">[ No matching titles found on the shelf ]</div>;
  }

  return (
    <div className="mc-shelf">
      {items.map((item, index) => {
        const isSelected = selectedItem && (
          category === 'films' ? selectedItem.slug === item.slug : selectedItem.id === item.id
        );
        const ratingMark = getSpineRatingMark(category, item);

        return (
          <div
            key={category === 'films' ? item.slug : item.id}
            className={`mc-spine ${isSelected ? 'mc-spine--selected' : ''}`}
            style={{ animationDelay: `${index * 12}ms` }}
            tabIndex="0"
            title={item.title}
            onClick={() => onSelectItem(item)}
            onFocus={() => onSelectItem(item)}
          >
            {item.isCustom && (
              <button
                className="mc-spine-delete-btn"
                onClick={(e) => { e.stopPropagation(); onRemoveItem(item); }}
                title="Delete custom entry"
              >
                ×
              </button>
            )}

            <div className="mc-spine-art">
              {item.image ? (
                <img src={item.image} alt="" loading="lazy" referrerPolicy="no-referrer" />
              ) : (
                <div className="mc-spine-fallback" dangerouslySetInnerHTML={{ __html: generateGenericCover(item.title, item.year) }} />
              )}
              <div className="mc-spine-gradient" />
            </div>

            {(item.status === 'watching' || item.status === 'reading') && (
              <div className="mc-spine-status-dot" title={item.status} />
            )}

            <span className="mc-spine-title">{item.title}</span>

            {ratingMark && <span className="mc-spine-rating mono">{ratingMark}</span>}
          </div>
        );
      })}
    </div>
  );
}

export default ShelfBrowser;
