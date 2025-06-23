// src/types.ts

export type Listing = {
  id: number;
  type: 'PALVELUT' | 'TARPEET';
  title: string;
  category: string;
  location: string;
  description?: string;
  price?: number | null;          // vain palvelu-tyypille (backend saattaa palauttaa numeron tai null)
  unit?: 'hour' | 'urakka' | null; // vain palvelu-tyypille
  photoUrl?: string;               // käyttäjän lataaman kuvan osoite
  userName: string;                // ilmoituksen tekijän nimi
  userPhotoUrl?: string | null;    // käyttäjän profiilikuva (URL)
  rating?: number | null;          // tähtiarvio esim. 4.5 (ja null, jos ei ole)
  createdAt: string;               // luontiaika (ISO-8601), backend palauttaa aina
};
