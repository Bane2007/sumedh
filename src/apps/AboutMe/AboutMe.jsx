import './AboutMe.css';

const POSITIONS = [
  { year: '2025', entry: 'Marketing & Creatives Head, IITDAD Coding Club' },
  { year: '2025', entry: 'Core Member, Digital Arts & Design Club' },
  { year: '2025', entry: 'Millennium Fellow, UN Academic Impact & MCN' }
];

const COMPETITIONS = [
  { year: '2025', entry: 'Best Audio, Best Storytelling, Audience Choice · University Film Festival' },
  { year: '2026', entry: '2nd Place, Hyperloop · TRYST' },
  { year: '2026', entry: '2nd Place, Titan · TRYST' },
  { year: '2026', entry: '3rd Place, Casecation · TRYST' }
];

function AboutMe() {
  return (
    <div className="am-dossier">
      <div className="am-classification">
        <span className="am-classification-title">[ PERSONNEL FILE ]</span>
        <span className="am-classification-status">STATUS: ACTIVE &middot; CLEARANCE: CREW</span>
      </div>

      <h2 className="am-name">Sumedh Jamsandekar</h2>

      <div className="am-summary">
        <div className="am-summary-label">case summary</div>
        <p className="am-summary-body">
          I&rsquo;m a second-year Energy Engineering student at IIT Delhi Abu Dhabi. Most of my spare time goes to writing. When I&rsquo;m not at a script, I&rsquo;ve got a movie on, a show running, or a game I&rsquo;m halfway through. I read in between.
        </p>
      </div>

      <div className="am-records">
        <div className="am-record-column">
          <h3 className="am-record-title">service record — positions</h3>
          <table className="am-record-table">
            <tbody>
              {POSITIONS.map((p, i) => (
                <tr key={i}>
                  <td className="am-record-year">{p.year}</td>
                  <td className="am-record-entry">{p.entry}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="am-record-column">
          <h3 className="am-record-title">service record — competitions</h3>
          <table className="am-record-table">
            <tbody>
              {COMPETITIONS.map((c, i) => (
                <tr key={i}>
                  <td className="am-record-year">{c.year}</td>
                  <td className="am-record-entry">{c.entry}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AboutMe;
