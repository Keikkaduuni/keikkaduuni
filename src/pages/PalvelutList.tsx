import React, { useEffect, useState } from 'react';

function PalvelutList() {
  const [palvelut, setPalvelut] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/palvelut')
      .then(res => res.json())
      .then(data => setPalvelut(data))
      .catch(() => alert('Failed to load palvelut'));
  }, []);

  return (
    <div>
      <h2>Palvelut</h2>
      {palvelut.length === 0 && <p>Ei palveluita listattavana</p>}
      <ul>
        {palvelut.map((p, i) => (
          <li key={i}>
            <h3>{p.title}</h3>
            <p>{p.description}</p>
            <p>Yhteystiedot: {p.contact}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PalvelutList;
