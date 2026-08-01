import './Contact.css';

const LINKS = [
  { label: 'imdb', href: 'https://www.imdb.com/name/nm18199394/' },
  { label: 'github', href: 'https://github.com/Bane2007' },
  { label: 'letterboxd', href: 'https://letterboxd.com/Bane_snj/' },
  { label: 'storygraph', href: 'https://app.thestorygraph.com/profile/sumed_nj' },
  { label: 'instagram', href: 'https://www.instagram.com/sumed_nj/' }
];

function Contact() {
  return (
    <div className="ct-wrap">
      <div className="ct-card">
        <div className="ct-card-notch" />
        <h2 className="ct-card-name">Sumedh Jamsandekar</h2>
        <div className="ct-card-divider" />
        <div className="ct-card-fields">
          {LINKS.map(l => (
            <a key={l.label} className="ct-field-row" href={l.href} target="_blank" rel="noopener">
              <span className="ct-field-label">{l.label}</span>
              <span className="ct-field-arrow">&rarr;</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Contact;
