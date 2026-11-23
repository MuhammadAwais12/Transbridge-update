import { useState, useEffect } from "react";
import { PROHIBITED_COUNTRIES_AND_REGIONS, PROHIBITED_COUNTRIES_ISO2 } from "../helpers/prohibitedCountries";

const BASE_URL = "https://countriesnow.space/api/v0.1";
 
let countriesCache: CountryOption[];
let statesCache: StateOption[];


interface CountryOption {
  name: string;
  Iso2: string;
  Iso3: string;
}
interface StateOption {
  name: string;        
  state_code: string;
  fullCode: string;
}

type CountriesIsoResponse = {
  error: boolean;
  msg: string;
  data: CountryOption[];
};

interface StatesByCountryResponse {
  error: boolean;
  msg: string;
  data: {
    name: string;
    iso2: string;
    iso3: string;
    states: { name: string; state_code?: string | null }[];
  };
}

export async function fetchCountries(): Promise<CountryOption[]> {
  if (countriesCache) return countriesCache;

  const res = await fetch(`${BASE_URL}/countries/iso`);
  if (!res.ok) throw new Error("Failed to fetch countries");

  const countryList : CountriesIsoResponse = await res.json();

  let list = Array.isArray(countryList.data) ? [...countryList.data] : [];

  list = list.filter(
    c =>
      !PROHIBITED_COUNTRIES_AND_REGIONS.some(
        p => p.toLowerCase() === c.name.toLowerCase()
      )
  );

  // sort alphabetically
  list.sort((a, b) => a.name.localeCompare(b.name));

  countriesCache = list;
  return list;
}


/** Fetch states for a given country */
// export async function fetchStates(country: string): Promise<StateOption[]> {
//   if (statesCache[country]) return statesCache[country];

//   country = 'AUSTRALIA';
//   const res = await fetch(`${BASE_URL}/countries/states`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ country }),
//   });
//   if (!res.ok) throw new Error("Failed to fetch states");

//   const data = await res.json();
//   const stateList: string[] = data.data.states.map((s: any) => s.name);

//   statesCache[country] = stateList;
//   return stateList;
// }

export async function fetchStatesWithFullCode(country: string): Promise<StateOption[]> {
  const key = `full:${country.trim().toLowerCase()}`;

  const res = await fetch(`${BASE_URL}/countries/states`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ country }),
  });
  if (!res.ok) throw new Error("Failed to fetch states");

  const json: StatesByCountryResponse = await res.json();
  const iso2 = (json.data?.iso2 ?? "").toUpperCase();

  return (json.data?.states ?? [])
    .filter(s => s?.name)
    .map(s => {
      const code = (s.state_code ?? "").toString();
      return {
        name: s.name,
        state_code: code,
        fullCode: iso2 && code ? `${iso2}-${code}` : code, // convenience
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}



/** Hook to get all countries */
export function useCountries() {
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCountries()
      .then(setCountries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { countries, loading };
}

/** Hook to get states of a country */
export function useStates(country: string | null) {
  const [states, setStates] = useState<StateOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!country) return;

    setLoading(true);
    fetchStatesWithFullCode(country)
      .then(setStates)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [country]);

  return { states, loading };
}
