import React, { useEffect, useState } from 'react';

function TarpeetList() {
  const [tarpeet, setTarpeet] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/tarpeet')
      .then(res => res.json())
      .then(data => setTarpeet(data))
      .catch(() => alert('Failed to load tarpeet'));
  }, []);

  return (
    <div>
      <h2>Tarpeet</h2>
      {tarpeet.length === 0 && <p>Ei tarpeita listattavana</p>}
      <ul>
        {tarpeet.map((t, i) => (
          <li key={i}>
            <h3>{t.title}</h3>
            <p>{t.description}</p>
            <p>Yhteystiedot: {t.contact}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TarpeetList;
