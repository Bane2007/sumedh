import { useState } from 'react';
import { useDebts } from './useDebts';
import './DebtDesk.css';

function DebtDesk() {
  const { debts, addDebt, removeDebt, importFromNotes } = useDebts();

  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [direction, setDirection] = useState('them_owes_me');
  const [notes, setNotes] = useState('');

  const totalOwedToMe = debts.filter(d => d.direction === 'them_owes_me').reduce((acc, c) => acc + c.amount, 0);
  const totalIOwe = debts.filter(d => d.direction === 'i_owe_them').reduce((acc, c) => acc + c.amount, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    addDebt({ person, amount, description, direction });
    setPerson('');
    setAmount('');
    setDescription('');
  };

  const handleImport = () => {
    importFromNotes(notes);
    setNotes('');
  };

  return (
    <div className="dd-ledger" onClick={(e) => e.stopPropagation()}>
      <div className="dd-header">
        <h2 className="dd-title">Sumedh's Ledger</h2>
        <p className="dd-subtitle">accounts payable &amp; receivable</p>
      </div>

      <div className="dd-balance-line">
        <span className="dd-balance-item">
          <span className="dd-balance-label">owed to me</span>
          <span className="dd-ink dd-ink--black">${totalOwedToMe.toFixed(2)}</span>
        </span>
        <span className="dd-balance-item">
          <span className="dd-balance-label">i owe</span>
          <span className="dd-ink dd-ink--red">${totalIOwe.toFixed(2)}</span>
        </span>
      </div>

      <div className="dd-body">
        <div className="dd-column-write">
          <form onSubmit={handleSubmit} className="dd-entry-form">
            <div className="dd-form-title">new entry</div>
            <label className="dd-line-field">
              <span>person</span>
              <input type="text" value={person} onChange={(e) => setPerson(e.target.value)} required placeholder="name" />
            </label>
            <label className="dd-line-field">
              <span>amount</span>
              <input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="0.00" />
            </label>
            <label className="dd-line-field">
              <span>for</span>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="pizza, uber..." />
            </label>
            <div className="dd-direction-toggle">
              <button type="button" className={direction === 'them_owes_me' ? 'dd-dir-btn dd-dir-btn--active' : 'dd-dir-btn'} onClick={() => setDirection('them_owes_me')}>they owe me</button>
              <button type="button" className={direction === 'i_owe_them' ? 'dd-dir-btn dd-dir-btn--active' : 'dd-dir-btn'} onClick={() => setDirection('i_owe_them')}>i owe them</button>
            </div>
            <button type="submit" className="dd-submit-btn">record entry</button>
          </form>

          <div className="dd-notes-box">
            <div className="dd-form-title">quick jot &rarr; parse</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={'John owes me 50 for pizza\nSarah: 20\nowe Mike 15'}
            />
            <button type="button" className="dd-parse-btn" onClick={handleImport}>parse &amp; merge</button>
          </div>
        </div>

        <div className="dd-column-ledger">
          <div className="dd-ledger-head">
            <span>who</span>
            <span>for</span>
            <span>date</span>
            <span className="dd-ledger-head-amount">amount</span>
            <span></span>
          </div>
          <div className="dd-ledger-rows">
            {debts.length === 0 ? (
              <div className="dd-empty">[ no entries in the ledger ]</div>
            ) : (
              debts.map(d => (
                <div key={d.id} className="dd-row">
                  <span className="dd-row-person">
                    {d.person}
                    <span className="dd-row-sub">{d.direction === 'them_owes_me' ? 'owes me' : 'i owe'}</span>
                  </span>
                  <span className="dd-row-desc">{d.description}</span>
                  <span className="dd-row-date">{d.date}</span>
                  <span className={`dd-row-amount dd-ink ${d.direction === 'them_owes_me' ? 'dd-ink--black' : 'dd-ink--red'}`}>
                    ${d.amount.toFixed(2)}
                  </span>
                  <button className="dd-stamp-btn" onClick={() => removeDebt(d.id)}>PAID</button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DebtDesk;
