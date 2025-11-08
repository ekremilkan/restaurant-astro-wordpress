/**
 * Server-side WooCommerce REST client with caching, pagination helpers, and safe error handling.
 * Never import this module into browser-executed code.
 */

type CacheEntry<T> = {
	value: T;
	expiresAt: number;
};

const DEFAULT_TTL_MS = 1000 * 60; // 60 seconds
const LONG_TTL_MS = DEFAULT_TTL_MS * 10;
const cache = new Map<string, CacheEntry<unknown>>();

const baseUrl = resolveBaseUrl();
const authHeader = buildAuthHeader();

export class WooCommerceError extends Error {
	public readonly status?: number;
	public readonly endpoint: string;

	constructor(message: string, endpoint: string, status?: number) {
		super(message);
		this.name = 'WooCommerceError';
		this.status = status;
		this.endpoint = endpoint;
	}
}

export interface PaginationMeta {
	total: number;
	totalPages: number;
	page: number;
	perPage: number;
}

export interface PaginatedResponse<T> {
	items: T[];
	pagination: PaginationMeta;
}

export interface WooImage {
	id: number;
	src: string;
	alt?: string;
	name?: string;
}

export interface WooCategory {
	id: number;
	name: string;
	slug: string;
	parent: number;
	description?: string;
	image?: WooImage;
	menu_order?: number;
	count?: number;
}

export interface WooTag {
	id: number;
	name: string;
	slug: string;
	description?: string;
}

export interface WooAttribute {
	id: number;
	name: string;
	slug: string;
	type: string;
	order_by: string;
	has_archives: boolean;
}

export interface WooAttributeTerm {
	id: number;
	name: string;
	slug: string;
	count: number;
	description?: string;
	menu_order?: number;
}

export interface WooProduct {
	id: number;
	name: string;
	slug: string;
	permalink: string;
	price: string;
	regular_price: string;
	sale_price: string;
	description: string;
	short_description: string;
	stock_status: 'instock' | 'outofstock' | 'onbackorder';
	featured: boolean;
	menu_order: number;
	images: WooImage[];
	categories: WooCategory[];
	tags: WooTag[];
	attributes?: Array<{
		id: number;
		name: string;
		position: number;
		visible: boolean;
		variation: boolean;
		options: string[];
	}>;
}

type QueryValue = string | number | boolean | undefined;

interface RequestOptions {
	searchParams?: Record<string, QueryValue | QueryValue[]>;
	cacheTtlMs?: number;
}

interface InternalRequestOptions extends RequestOptions {
	mode: 'single' | 'collection';
}

export interface ListProductsOptions {
	category?: string | number;
	tag?: string | number;
	search?: string;
	status?: 'publish' | 'draft';
	per_page?: number;
	page?: number;
	order?: 'asc' | 'desc';
	orderby?: 'date' | 'title' | 'menu_order' | 'price' | 'popularity';
	featured?: boolean;
	on_sale?: boolean;
	slug?: string;
}

export interface ListCategoriesOptions {
	parent?: number;
	hide_empty?: boolean;
	exclude?: number[];
	include?: number[];
	per_page?: number;
	page?: number;
	order?: 'asc' | 'desc';
	orderby?: 'name' | 'slug' | 'term_group' | 'term_id' | 'description' | 'count';
}

export interface ListTagsOptions {
	search?: string;
	hide_empty?: boolean;
	parent?: number;
	per_page?: number;
	page?: number;
	order?: 'asc' | 'desc';
	orderby?: 'name' | 'slug';
}

export interface ListAttributesOptions {
	order?: 'asc' | 'desc';
	orderby?: 'name' | 'id' | 'menu_order';
	page?: number;
	per_page?: number;
}

export interface ListAttributeTermsOptions {
	search?: string;
	page?: number;
	per_page?: number;
	order?: 'asc' | 'desc';
	orderby?: 'name' | 'slug' | 'menu_order';
	hide_empty?: boolean;
	slug?: string;
}

export async function listProducts(options: ListProductsOptions = {}): Promise<PaginatedResponse<WooProduct>> {
	return request<PaginatedResponse<WooProduct>>('products', {
		mode: 'collection',
		searchParams: sanitizeParams(options),
		cacheTtlMs: options.status === 'publish' ? DEFAULT_TTL_MS : 0,
	});
}

export async function searchProducts(
	term: string,
	options: Omit<ListProductsOptions, 'search'> = {},
): Promise<PaginatedResponse<WooProduct>> {
	return listProducts({
		...options,
		search: term.trim(),
	});
}

export async function listProductsByTag(
	tag: string | number,
	options: Omit<ListProductsOptions, 'tag'> = {},
): Promise<PaginatedResponse<WooProduct>> {
	return listProducts({
		tag,
		...options,
	});
}

export async function listFeaturedProducts(limit = 6): Promise<PaginatedResponse<WooProduct>> {
	return listProducts({ featured: true, per_page: limit });
}

export async function getProduct(productId: number): Promise<WooProduct> {
	return request<WooProduct>(`products/${productId}`, { mode: 'single', cacheTtlMs: DEFAULT_TTL_MS });
}

export async function getProductBySlug(slug: string): Promise<WooProduct | null> {
	const response = await listProducts({ slug, per_page: 1, page: 1 });
	return response.items[0] ?? null;
}

export async function listCategories(options: ListCategoriesOptions = {}): Promise<PaginatedResponse<WooCategory>> {
	return request<PaginatedResponse<WooCategory>>('products/categories', {
		mode: 'collection',
		searchParams: sanitizeParams(options),
		cacheTtlMs: LONG_TTL_MS,
	});
}

export async function getCategory(categoryId: number): Promise<WooCategory> {
	return request<WooCategory>(`products/categories/${categoryId}`, { mode: 'single', cacheTtlMs: LONG_TTL_MS });
}

export async function listTags(options: ListTagsOptions = {}): Promise<PaginatedResponse<WooTag>> {
	return request<PaginatedResponse<WooTag>>('products/tags', {
		mode: 'collection',
		searchParams: sanitizeParams(options),
		cacheTtlMs: LONG_TTL_MS,
	});
}

export async function getTag(tagId: number): Promise<WooTag> {
	return request<WooTag>(`products/tags/${tagId}`, { mode: 'single', cacheTtlMs: LONG_TTL_MS });
}

export async function listAttributes(options: ListAttributesOptions = {}): Promise<PaginatedResponse<WooAttribute>> {
	return request<PaginatedResponse<WooAttribute>>('products/attributes', {
		mode: 'collection',
		searchParams: sanitizeParams(options),
		cacheTtlMs: LONG_TTL_MS,
	});
}

export async function getAttribute(attributeId: number): Promise<WooAttribute> {
	return request<WooAttribute>(`products/attributes/${attributeId}`, {
		mode: 'single',
		cacheTtlMs: LONG_TTL_MS,
	});
}

export async function listAttributeTerms(
	attributeId: number,
	options: ListAttributeTermsOptions = {},
): Promise<PaginatedResponse<WooAttributeTerm>> {
	return request<PaginatedResponse<WooAttributeTerm>>(`products/attributes/${attributeId}/terms`, {
		mode: 'collection',
		searchParams: sanitizeParams(options),
		cacheTtlMs: LONG_TTL_MS,
	});
}

async function request<T>(endpoint: string, options: InternalRequestOptions): Promise<T> {
	const url = buildUrl(endpoint, options.searchParams);
	const cacheKey = buildCacheKey(endpoint, options.searchParams, options.mode);
	const ttl = Math.max(0, options.cacheTtlMs ?? DEFAULT_TTL_MS);

	if (ttl) {
		const cached = getCachedValue<T>(cacheKey);
		if (cached !== undefined) {
			return cached;
		}
	}

	const { payload } = await fetchFromWoo<T>(endpoint, url, options);

	if (ttl) {
		setCachedValue(cacheKey, payload, ttl);
	}

	return payload;
}

async function fetchFromWoo<T>(
	endpoint: string,
	url: URL,
	options: InternalRequestOptions,
): Promise<{ payload: T }> {
	let response: Response;
	try {
		response = await fetch(url, {
			headers: {
				Authorization: authHeader,
				Accept: 'application/json',
			},
			method: 'GET',
		});
	} catch (error) {
		throw wrapError(error, endpoint);
	}

	if (!response.ok) {
		const safeMessage = `WooCommerce request failed (${response.status}) for ${endpoint}`;
		throw new WooCommerceError(safeMessage, endpoint, response.status);
	}

	const json = await response.json();

	if (options.mode === 'single') {
		return { payload: json as T };
	}

	if (!Array.isArray(json)) {
		throw new WooCommerceError('Expected array response for collection endpoint', endpoint, response.status);
	}

	const pagination = buildPaginationMeta(response.headers, options.searchParams);
	const payload = {
		items: json,
		pagination,
	} as PaginatedResponse<unknown>;

	return { payload: payload as T };
}

function getCachedValue<T>(key: string): T | undefined {
	const cached = cache.get(key) as CacheEntry<T> | undefined;
	if (!cached) return undefined;
	if (cached.expiresAt < Date.now()) {
		cache.delete(key);
		return undefined;
	}
	return cached.value;
}

function setCachedValue<T>(key: string, value: T, ttl: number): void {
	cache.set(key, { value, expiresAt: Date.now() + ttl });
}

function buildUrl(endpoint: string, params?: Record<string, QueryValue | QueryValue[]>): URL {
	const url = new URL(`/wp-json/wc/v3/${endpoint}`, baseUrl);
	const searchParams = new URLSearchParams();
	if (params) {
		for (const [key, value] of Object.entries(params)) {
			if (Array.isArray(value)) {
				value.filter((v): v is QueryValue => v !== undefined).forEach((item) => {
					searchParams.append(key, String(item));
				});
			} else if (value !== undefined) {
				searchParams.set(key, String(value));
			}
		}
	}
	url.search = searchParams.toString();
	return url;
}

function buildCacheKey(
	endpoint: string,
	params: Record<string, QueryValue | QueryValue[]> | undefined,
	mode: InternalRequestOptions['mode'],
): string {
	return `${mode}:${endpoint}?${JSON.stringify(params ?? {})}`;
}

function buildPaginationMeta(
	headers: Headers,
	params: Record<string, QueryValue | QueryValue[]> | undefined,
): PaginationMeta {
	return {
		total: toNumber(headers.get('X-WP-Total')),
		totalPages: toNumber(headers.get('X-WP-TotalPages')),
		page: toNumber(params?.page) || 1,
		perPage: toNumber(params?.per_page) || 10,
	};
}

function wrapError(error: unknown, endpoint: string): WooCommerceError {
	if (error instanceof WooCommerceError) return error;
	const message = error instanceof Error ? error.message : 'Unknown WooCommerce error';
	return new WooCommerceError(message, endpoint);
}

function resolveBaseUrl(): URL {
	const raw = requireEnv('WOOCOMMERCE_URL');
	try {
		return new URL(raw);
	} catch {
		throw new Error('WOOCOMMERCE_URL must be a valid URL');
	}
}

function buildAuthHeader(): string {
	const key = requireEnv('WOOCOMMERCE_CONSUMER_KEY');
	const secret = requireEnv('WOOCOMMERCE_CONSUMER_SECRET');
	const token = Buffer.from(`${key}:${secret}`).toString('base64');
	return `Basic ${token}`;
}

function requireEnv(name: string): string {
	const fromProcess = typeof process !== 'undefined' ? process.env?.[name] : undefined;
	const fromImportMeta =
		typeof import.meta !== 'undefined' && import.meta.env
			? (import.meta.env[name as keyof ImportMetaEnv] as string | undefined)
			: undefined;

	const value = fromProcess ?? fromImportMeta;
	if (!value) {
		throw new Error(`${name} is not defined`);
	}
	return value;
}

function sanitizeParams<T extends Record<string, unknown>>(params: T): Record<string, QueryValue | QueryValue[]> {
	return Object.entries(params).reduce<Record<string, QueryValue | QueryValue[]>>((acc, [key, value]) => {
		if (value === undefined || value === null || value === '') {
			return acc;
		}
		acc[key] = value as QueryValue | QueryValue[];
		return acc;
	}, {});
}

function toNumber(value: string | number | boolean | QueryValue[] | undefined): number {
	if (Array.isArray(value)) {
		return toNumber(value[0]);
	}
	if (typeof value === 'number') return value;
	if (typeof value === 'boolean') return value ? 1 : 0;
	if (typeof value === 'string') {
		const parsed = Number(value);
		return Number.isNaN(parsed) ? 0 : parsed;
	}
	return value ? Number(value) : 0;
}
