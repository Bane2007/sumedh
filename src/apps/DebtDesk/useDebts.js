import { useState, useEffect, useCallback } from 'react';

function syncToServer(list) {
  fetch('/api/sync-debts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(list)
  }).catch(() => {});
}

export function useDebts() {
  const [debts, setDebts] = useState(() => {
    try {
      const stored = localStorage.getItem('sumedh_debts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const fetchDebts = () => {
      fetch(`${import.meta.env.BASE_URL}assets/data/debts.json?t=${Date.now()}`)
        .then(res => res.json())
        .then(data => setDebts(data))
        .catch(err => console.log('Polling debts error:', err));
    };
    fetchDebts();
    const interval = setInterval(fetchDebts, 3000);
    return () => clearInterval(interval);
  }, []);

  const addDebt = useCallback(({ person, amount, description, direction }) => {
    if (!person.trim() || !amount) return;
    const item = {
      id: Math.floor(Math.random() * 1000000),
      direction,
      person: person.trim(),
      amount: parseFloat(amount) || 0,
      description: description.trim() || 'No description',
      date: new Date().toISOString().split('T')[0]
    };
    setDebts(prev => {
      const updated = [item, ...prev];
      localStorage.setItem('sumedh_debts', JSON.stringify(updated));
      syncToServer(updated);
      return updated;
    });
  }, []);

  const removeDebt = useCallback((id) => {
    setDebts(prev => {
      const updated = prev.filter(d => d.id !== id);
      localStorage.setItem('sumedh_debts', JSON.stringify(updated));
      syncToServer(updated);
      return updated;
    });
  }, []);

  const importFromNotes = useCallback((text) => {
    if (!text.trim()) return;
    const lines = text.split('\n');
    const parsed = [];
    lines.forEach(line => {
      const t = line.trim();
      if (!t) return;
      const owesMe = t.match(/^([a-zA-Z0-9_\s]+)\s+owes\s+me\s+([0-9.]+)(?:\s+for\s+(.+))?/i);
      const oweThem = t.match(/^owe\s+([a-zA-Z0-9_\s]+)\s+([0-9.]+)(?:\s+for\s+(.+))?/i);
      const colon = t.match(/^([a-zA-Z0-9_\s]+)\s*[:\-]\s*([0-9.]+)(?:\s*\((.+)\))?/i);

      if (owesMe) {
        parsed.push({
          id: Math.floor(Math.random() * 1000000),
          direction: 'them_owes_me',
          person: owesMe[1].trim(),
          amount: parseFloat(owesMe[2]),
          description: owesMe[3] ? owesMe[3].trim() : 'Notes Import',
          date: new Date().toISOString().split('T')[0]
        });
      } else if (oweThem) {
        parsed.push({
          id: Math.floor(Math.random() * 1000000),
          direction: 'i_owe_them',
          person: oweThem[1].trim(),
          amount: parseFloat(oweThem[2]),
          description: oweThem[3] ? oweThem[3].trim() : 'Notes Import',
          date: new Date().toISOString().split('T')[0]
        });
      } else if (colon) {
        parsed.push({
          id: Math.floor(Math.random() * 1000000),
          direction: 'them_owes_me',
          person: colon[1].trim(),
          amount: parseFloat(colon[2]),
          description: colon[3] ? colon[3].trim() : 'Notes Import',
          date: new Date().toISOString().split('T')[0]
        });
      }
    });

    if (parsed.length > 0) {
      setDebts(prev => {
        const updated = [...parsed, ...prev];
        localStorage.setItem('sumedh_debts', JSON.stringify(updated));
        syncToServer(updated);
        return updated;
      });
    }
  }, []);

  return { debts, addDebt, removeDebt, importFromNotes };
}
