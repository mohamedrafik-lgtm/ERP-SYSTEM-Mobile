import AuthService from './AuthService';

export interface LocationCity {
  id: string;
  code: string;
  nameAr: string;
  nameEn?: string;
}

export interface LocationGovernorate {
  id: string;
  code: string;
  nameAr: string;
  nameEn?: string;
  cities: LocationCity[];
}

export interface LocationCountry {
  id: string;
  code: string;
  nameAr: string;
  nameEn?: string;
  governorates: LocationGovernorate[];
}

class LocationService {
  private static normalizeCities(input: any): LocationCity[] {
    if (!Array.isArray(input)) {
      return [];
    }

    return input
      .filter(Boolean)
      .map((city: any) => ({
        id: String(city?.id ?? city?.code ?? ''),
        code: String(city?.code ?? ''),
        nameAr: String(city?.nameAr ?? city?.name ?? city?.code ?? ''),
        nameEn: city?.nameEn ? String(city.nameEn) : undefined,
      }))
      .filter((city) => city.code && city.nameAr);
  }

  private static normalizeGovernorates(input: any): LocationGovernorate[] {
    if (!Array.isArray(input)) {
      return [];
    }

    return input
      .filter(Boolean)
      .map((gov: any) => ({
        id: String(gov?.id ?? gov?.code ?? ''),
        code: String(gov?.code ?? ''),
        nameAr: String(gov?.nameAr ?? gov?.name ?? gov?.code ?? ''),
        nameEn: gov?.nameEn ? String(gov.nameEn) : undefined,
        cities: this.normalizeCities(gov?.cities),
      }))
      .filter((gov) => gov.code && gov.nameAr);
  }

  private static normalizeCountries(input: any): LocationCountry[] {
    if (!Array.isArray(input)) {
      return [];
    }

    return input
      .filter(Boolean)
      .map((country: any) => ({
        id: String(country?.id ?? country?.code ?? ''),
        code: String(country?.code ?? ''),
        nameAr: String(country?.nameAr ?? country?.name ?? country?.code ?? ''),
        nameEn: country?.nameEn ? String(country.nameEn) : undefined,
        governorates: this.normalizeGovernorates(country?.governorates),
      }))
      .filter((country) => country.code && country.nameAr);
  }

  static async getLocationsTree(): Promise<LocationCountry[]> {
    const token = await AuthService.getToken();
    if (!token) {
      throw new Error('Authentication token not found.');
    }

    const baseUrl = await AuthService.getCurrentApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/locations/countries`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const message = payload?.message || `HTTP error! status: ${response.status}`;
      throw new Error(message);
    }

    const countriesSource = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.countries)
      ? payload.countries
      : Array.isArray(payload?.data)
      ? payload.data
      : [];

    return this.normalizeCountries(countriesSource);
  }
}

export default LocationService;
