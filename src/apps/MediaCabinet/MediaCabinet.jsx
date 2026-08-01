import { useState } from 'react';
import { useMediaDb } from './useMediaDb';
import Toolbar from './Toolbar';
import PosterGrid from './PosterGrid';
import DetailDrawer from './DetailDrawer';
import './MediaCabinet.css';

function MediaCabinet() {
  const {
    category, setCategory, search, setSearch, sortBy, setSortBy,
    selectedGenre, setSelectedGenre, selectedDecade, setSelectedDecade,
    availableGenres, availableDecades, processedItems, stats, addItem, removeItem
  } = useMediaDb();

  const [drawer, setDrawer] = useState({ mode: null, item: null });

  const handleSelectItem = (item) => setDrawer({ mode: 'view', item });
  const handleOpenAddForm = () => setDrawer({ mode: 'add', item: null });
  const handleCloseDrawer = () => setDrawer({ mode: null, item: null });

  const handleAddItem = (targetCategory, item) => {
    addItem(targetCategory, item);
    handleCloseDrawer();
  };

  const handleRemoveItem = (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.title}" from your shelf?`)) return;
    removeItem(category, item);
    const isOpenInDrawer = drawer.mode === 'view' && drawer.item &&
      (category === 'films' ? drawer.item.slug === item.slug : drawer.item.id === item.id);
    if (isOpenInDrawer) handleCloseDrawer();
  };

  return (
    <section className="mc-root">
      <Toolbar
        category={category}
        onCategoryChange={setCategory}
        search={search}
        onSearchChange={setSearch}
        selectedGenre={selectedGenre}
        onGenreChange={setSelectedGenre}
        availableGenres={availableGenres}
        selectedDecade={selectedDecade}
        onDecadeChange={setSelectedDecade}
        availableDecades={availableDecades}
        sortBy={sortBy}
        onSortChange={setSortBy}
        stats={stats}
        totalCount={processedItems.length}
        onOpenAddForm={handleOpenAddForm}
      />

      <PosterGrid
        items={processedItems}
        category={category}
        selectedItem={drawer.mode === 'view' ? drawer.item : null}
        onSelectItem={handleSelectItem}
        onRemoveItem={handleRemoveItem}
      />

      <DetailDrawer
        mode={drawer.mode}
        category={category}
        item={drawer.item}
        onClose={handleCloseDrawer}
        onAddItem={handleAddItem}
      />
    </section>
  );
}

export default MediaCabinet;
