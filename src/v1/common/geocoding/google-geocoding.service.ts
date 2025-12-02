import { Injectable, Logger } from '@nestjs/common';

type Coordinates = {
  latitude: number;
  longitude: number;
};

type GeocodeResponse = {
  status: string;
  results: Array<{
    geometry?: {
      location?: {
        lat: number;
        lng: number;
      };
    };
  }>;
  error_message?: string;
};

type FetchResponse = {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
};

type FetchLike = (
  input: string | URL,
  init?: Record<string, unknown>,
) => Promise<FetchResponse>;

@Injectable()
export class GoogleGeocodingService {
  private readonly logger = new Logger(GoogleGeocodingService.name);
  private readonly endpoint =
    'https://maps.googleapis.com/maps/api/geocode/json';
  private readonly apiKey = process.env.GOOGLE_GEOCODING_API_KEY;

  async lookupPostcode(postCode: string): Promise<Coordinates | null> {
    const trimmed = postCode?.trim();
    if (!trimmed) return null;
    if (!this.apiKey) {
      this.logger.warn(
        'Google Geocoding API key is not configured. Skipping lookup.',
      );
      return null;
    }

    const fetchImpl: FetchLike | undefined = (globalThis as any).fetch;
    if (!fetchImpl) {
      this.logger.error('Fetch API not available in current runtime');
      return null;
    }

    const url = new URL(this.endpoint);
    url.searchParams.set('address', trimmed);
    url.searchParams.set('key', this.apiKey);

    try {
      const response = await fetchImpl(url);
      if (!response.ok) {
        this.logger.warn(
          `Geocoding request failed with status ${response.status}`,
        );
        return null;
      }
      const payload = (await response.json()) as GeocodeResponse;
      if (payload.status !== 'OK') {
        this.logger.warn(
          `Geocoding lookup for "${trimmed}" returned status ${payload.status}${
            payload.error_message ? ` (${payload.error_message})` : ''
          }`,
        );
        return null;
      }
      const location = payload.results?.[0]?.geometry?.location;
      if (!location) {
        this.logger.warn(
          `Geocoding lookup for "${trimmed}" did not include coordinates`,
        );
        return null;
      }
      return { latitude: location.lat, longitude: location.lng };
    } catch (error) {
      this.logger.error(
        'Geocoding lookup failed',
        error instanceof Error ? error.stack : undefined,
      );
      return null;
    }
  }
}
